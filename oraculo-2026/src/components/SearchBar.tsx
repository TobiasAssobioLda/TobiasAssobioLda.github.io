import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import gsap from 'gsap';
import { ArrowRight, LoaderCircle, Search } from 'lucide-react';
import { oracle } from '../oracle/client';
import type { OraclePhase, TeamRef } from '../oracle/types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onPick: (team: TeamRef) => void;
  onSubmit: (query: string) => void;
  phase: OraclePhase;
  /** true quando o painel de resultado cobre a barra. */
  covered: boolean;
  reducedMotion: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

const DEBOUNCE_MS = 180;
const MAX_SUGGESTIONS = 6;

/**
 * Barra de pesquisa cinematográfica com sugestões (combobox ARIA).
 * Debounce ~180ms → oracle.searchTeams; navegação por teclado completa.
 */
export default function SearchBar({
  value,
  onChange,
  onPick,
  onSubmit,
  phase,
  covered,
  reducedMotion,
  inputRef,
}: SearchBarProps) {
  const busy = phase === 'consulting';
  const charging = phase === 'charging';
  const locked = busy || charging || covered;

  const [suggestions, setSuggestions] = useState<TeamRef[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const pickTimer = useRef<number | null>(null);
  useEffect(() => () => { if (pickTimer.current !== null) window.clearTimeout(pickTimer.current); }, []);

  const listRef = useRef<HTMLUListElement>(null);
  const reqRef = useRef(0);
  const skipNext = useRef<string | null>(null);

  // Debounce da pesquisa. `skipNext` suprime o texto que acabou de ser
  // escolhido/submetido enquanto não for editado — evita re-pesquisas
  // quando `locked` alterna durante a consulta.
  useEffect(() => {
    const q = value.trim();
    if (skipNext.current && q !== skipNext.current) skipNext.current = null;
    if (q.length === 0) skipNext.current = null;
    if (locked || q.length < 2 || skipNext.current === q) {
      reqRef.current++;
      setSuggestions([]);
      setOpen(false);
      setActive(-1);
      return;
    }
    const req = ++reqRef.current;
    const timer = window.setTimeout(() => {
      oracle
        .searchTeams(q, MAX_SUGGESTIONS)
        .then((res) => {
          if (req !== reqRef.current) return;
          setSuggestions(res);
          setActive(-1);
          setOpen(res.length > 0);
        })
        .catch(() => {
          if (req !== reqRef.current) return;
          setSuggestions([]);
          setOpen(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [value, locked]);

  // Entrada animada da lista de sugestões.
  useEffect(() => {
    if (!open || reducedMotion || !listRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        listRef.current,
        { y: 10, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.28, ease: 'power2.out' },
      );
      gsap.fromTo(
        listRef.current!.children,
        { y: 6, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.22, stagger: 0.035, ease: 'power2.out' },
      );
    }, listRef);
    return () => ctx.revert();
  }, [open, reducedMotion]);

  // Mantém a opção ativa visível ao navegar com as setas.
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    listRef.current.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (team: TeamRef) => {
    if (locked || pickTimer.current !== null) return;
    setConfirmed(team.id);
    pickTimer.current = window.setTimeout(() => {
      pickTimer.current = null;
      skipNext.current = team.name.trim();
      setOpen(false);
      setActive(-1);
      setConfirmed(null);
      onPick(team);
    }, reducedMotion ? 100 : 230);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        if (suggestions.length > 0) setOpen(true);
        return;
      }
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && suggestions[active]) {
        e.preventDefault();
        pick(suggestions[active]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || locked || pickTimer.current !== null) return;
    skipNext.current = q;
    setOpen(false);
    onSubmit(q);
  };

  const status = busy ? 'a ler os sinais…' : charging ? 'a condensar a revelação…' : null;
  const activeId =
    open && active >= 0 && suggestions[active] ? `oracle-opt-${suggestions[active].id}` : undefined;

  return (
    <div className="search">
      <form className="searchbar" role="search" onSubmit={submit}>
        <Search className="searchbar-ico" size={20} strokeWidth={1.9} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="oracle-suggest"
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label="Equipa ou jogo a consultar"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
          maxLength={60}
          placeholder="Escreve a equipa ou o jogo…"
          value={value}
          disabled={locked}
          readOnly={confirmed !== null}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          onFocus={() => {
            if (suggestions.length > 0 && !locked) setOpen(true);
          }}
        />
        <button
          type="submit"
          className="searchbar-go"
          aria-label="Consultar o Oráculo"
          disabled={locked || value.trim().length === 0}
        >
          {busy ? (
            <LoaderCircle className="spin" size={20} aria-hidden />
          ) : (
            <ArrowRight size={20} aria-hidden />
          )}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="suggest" id="oracle-suggest" role="listbox" ref={listRef}>
          {suggestions.map((team, i) => (
            <li
              key={team.id}
              id={`oracle-opt-${team.id}`}
              role="option"
              aria-selected={i === active}
              data-confirmed={confirmed === team.id || undefined}
              className={i === active ? 'suggest-item is-active' : 'suggest-item'}
              onPointerDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => pick(team)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="suggest-name">{team.name}</span>
              <span className="suggest-country">{team.country}</span>
              <ArrowRight className="suggest-arrow" size={15} aria-hidden />
            </li>
          ))}
        </ul>
      )}

      {status && (
        <p className="search-status" aria-live="polite">
          <span className="pulse-dot" aria-hidden />
          {status}
        </p>
      )}
    </div>
  );
}
