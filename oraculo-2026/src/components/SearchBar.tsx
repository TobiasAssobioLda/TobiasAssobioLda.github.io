import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import gsap from 'gsap';
import { ArrowRight, LoaderCircle, Search } from 'lucide-react';
import { findMatches, lockRemaining, matchState } from '../oracle/matches';
import type { DemoMatch } from '../oracle/matches';
import type { OraclePhase } from '../oracle/types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onPick: (match: DemoMatch) => void;
  onSubmit: (query: string) => void;
  phase: OraclePhase;
  /** true quando o painel de resultado cobre a barra. */
  covered: boolean;
  reducedMotion: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

const DEBOUNCE_MS = 180;
const MAX_SUGGESTIONS = 6;

const pad = (n: number) => String(n).padStart(2, '0');

/** HH:MM:SS — contado do relógio real até ao desbloqueio KO−9. */
function countdown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

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

  const [suggestions, setSuggestions] = useState<DemoMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);
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
      if (req !== reqRef.current) return;
      // Linhas = jogos reais do catálogo DEMO — nunca equipas soltas.
      const fixtures = findMatches(q, MAX_SUGGESTIONS);
      setSuggestions(fixtures);
      setActive(-1);
      setOpen(fixtures.length > 0);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [value, locked]);

  // O contador das linhas bloqueadas corre do relógio real — nunca de um
  // timer aberto no clique. Só existe enquanto houver 🔒 à vista.
  const hasLocked =
    open && suggestions.some((m) => matchState(m, now) === 'locked');
  useEffect(() => {
    if (!hasLocked) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [hasLocked]);

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

  const pick = (match: DemoMatch) => {
    if (locked || pickTimer.current !== null) return;
    // 🔒 — a linha abana-se a si própria e não avança. Sem mensagens.
    if (matchState(match, Date.now()) === 'locked') {
      if (!reducedMotion) {
        setShake((s) => ({ id: match.id, n: (s && s.id === match.id ? s.n : 0) + 1 }));
      }
      return;
    }
    setConfirmed(match.id);
    pickTimer.current = window.setTimeout(() => {
      pickTimer.current = null;
      skipNext.current = match.label;
      setOpen(false);
      setActive(-1);
      setConfirmed(null);
      inputRef.current?.blur(); // fecha o teclado antes da revelação
      onPick(match);
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
          {suggestions.map((match, i) => {
            const state = matchState(match, now);
            const shakes = shake && shake.id === match.id ? shake.n : 0;
            return (
              <li
                key={match.id}
                id={`oracle-opt-${match.id}`}
                role="option"
                aria-selected={i === active}
                data-confirmed={confirmed === match.id || undefined}
                className={i === active ? 'suggest-item is-active' : 'suggest-item'}
                onPointerDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => pick(match)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="suggest-name">{match.label}</span>
                {state === 'ready' && (
                  <span className="suggest-state st-ready">
                    <span aria-hidden>✨</span> VOILÀ!
                  </span>
                )}
                {state === 'locked' && (
                  <span
                    key={shakes}
                    className={shakes ? 'suggest-state st-locked is-shaking' : 'suggest-state st-locked'}
                    aria-label={`Ainda é cedo — faltam ${countdown(lockRemaining(match, now))}`}
                  >
                    <span aria-hidden>🔒</span> {countdown(lockRemaining(match, now))}
                  </span>
                )}
                {state === 'invoke' && (
                  <span className="suggest-state st-invoke">
                    <span aria-hidden>😈</span> INVOCO!
                  </span>
                )}
              </li>
            );
          })}
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
