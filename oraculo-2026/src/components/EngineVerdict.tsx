import { useId } from 'react';
import type { OracleDecision } from '../oracle/types';
import type { EngineReading } from '../oracle/demoReadings';
import './engineVerdict.css';

const sources = ['LAB 1', 'LAB 2', 'ONEMAN', 'LAB 3'];
const colors = ['#14cfff', '#ffbb23', '#37f664', '#e473ff'];
const feeds = [
  'M50 0 Q50 17 68 17 H173 Q200 17 200 38',
  'M150 0 Q150 17 168 17 H173 Q200 17 200 38',
  'M250 0 Q250 17 232 17 H227 Q200 17 200 38',
  'M350 0 Q350 17 332 17 H227 Q200 17 200 38',
];

export default function EngineVerdict({decision, reading}: {decision: OracleDecision; reading: EngineReading}) {
  const id = useId();
  return <div className="engine-array">
    <ol aria-label="Previsões fictícias dos quatro motores">
      {reading.engines.map((tip, i) => <li key={sources[i]}>
        <strong>{sources[i]}</strong>
        {tip ? <><span>{tip.selection}</span>{tip.odd != null && <b>@{tip.odd.toFixed(2)}</b>}</>
          : <em><i aria-hidden="true" />In Progress</em>}
      </li>)}
    </ol>
    <svg className="engine-feeds" viewBox="0 0 400 38" preserveAspectRatio="none" aria-hidden="true">
      <defs>{colors.map((color,i)=><linearGradient key={color} id={`${id}-${i}`} x2="0" y2="1">
        <stop stopColor={color}/><stop offset="1" stopColor="#ed8cff"/>
      </linearGradient>)}</defs>
      {feeds.map((d,i)=><path key={d} d={d} pathLength="1" fill="none" stroke={`url(#${id}-${i})`} strokeWidth="1.3"/>)}
    </svg>
    <div className="engine-final">
      <h3>Decisão final</h3>
      <small>{decision.market}</small>
      <div className="verdict-pick">{decision.selection} <b>@{decision.odd.toFixed(2)}</b></div>
      <p>Confiança: <b>{reading.confidence}%</b></p>
    </div>
  </div>;
}
