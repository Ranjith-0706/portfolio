/**
 * Abstract placeholder "screens" for the dummy projects. They are intentionally diagrammatic
 * (one idea each) and labelled as placeholders — swap for real screenshots later.
 */
type Kind = 'analytics' | 'commerce' | 'cloud' | 'three';

const A = '#D7AC74';
const L = 'rgba(244,241,235,0.14)';
const M = 'rgba(244,241,235,0.38)';

export function ProjectPreview({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 640 400" role="img" aria-label={`Placeholder preview — ${kind}`} preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="400" fill="#101012" />
      <rect x="0" y="0" width="640" height="30" fill="#0c0c0e" />
      <path d="M0 30H640" stroke={L} />
      {kind === 'analytics' && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M48 ${90 + i * 62}H600`} stroke={L} />
          ))}
          {Array.from({ length: 22 }, (_, i) => {
            const h = 30 + ((i * 53) % 150);
            return <rect key={i} x={60 + i * 25} y={336 - h} width="10" height={h} fill={i % 7 === 3 ? A : M} opacity={i % 7 === 3 ? 1 : 0.55} />;
          })}
          <polyline
            fill="none"
            stroke={A}
            strokeWidth="2.2"
            points="60,300 110,262 160,278 210,208 260,224 310,168 360,184 410,126 460,150 510,102 560,118 600,84"
          />
          <rect x="48" y="52" width="120" height="8" fill={M} />
          <rect x="48" y="66" width="70" height="6" fill={L} />
        </g>
      )}
      {kind === 'commerce' && (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${48 + i * 192} 58)`}>
              <rect width="176" height={i === 1 ? 250 : 210} fill={i === 1 ? '#17171a' : '#131315'} stroke={L} />
              <path d={`M18 ${i === 1 ? 210 : 170}L68 ${i === 1 ? 110 : 90}L108 ${i === 1 ? 160 : 130}L146 ${i === 1 ? 60 : 56}`} stroke={i === 1 ? A : M} fill="none" strokeWidth="2" />
              <rect x="18" y={i === 1 ? 262 : 222} width="90" height="8" fill={M} />
            </g>
          ))}
          <rect x="48" y="338" width="150" height="30" fill={A} />
          <rect x="62" y="349" width="70" height="8" fill="#101012" />
        </g>
      )}
      {kind === 'cloud' && (
        <g>
          {[
            [120, 120], [260, 90], [400, 130], [540, 96],
            [180, 250], [320, 230], [470, 270], [90, 330], [260, 340], [410, 350],
          ].map(([x, y], i, arr) => (
            <g key={i}>
              {arr.slice(i + 1).map(([x2, y2], j) =>
                Math.hypot(x2 - x, y2 - y) < 190 ? <path key={j} d={`M${x} ${y}L${x2} ${y2}`} stroke={L} /> : null,
              )}
            </g>
          ))}
          {[
            [120, 120], [260, 90], [400, 130], [540, 96],
            [180, 250], [320, 230], [470, 270], [90, 330], [260, 340], [410, 350],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 16} y={y - 12} width="32" height="24" fill="#131315" stroke={i === 5 ? A : M} />
              {i === 5 && <rect x={x - 16} y={y - 12} width="32" height="24" fill="none" stroke={A} strokeWidth="2" />}
            </g>
          ))}
        </g>
      )}
      {kind === 'three' && (
        <g>
          {Array.from({ length: 11 }, (_, i) => (
            <path key={`h${i}`} d={`M${60 + i * 10} ${300 - i * 14}L${580 - i * 10} ${300 - i * 14}`} stroke={L} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={`v${i}`} d={`M${60 + i * 46} 300L${190 + i * 24} 146`} stroke={L} />
          ))}
          <path d="M240 250L340 196L440 250L340 306Z" fill="none" stroke={A} strokeWidth="2" />
          <path d="M240 250V190L340 136L440 190V250" fill="none" stroke={M} strokeWidth="1.6" />
          <path d="M340 136V196M340 196L240 190M340 196L440 190" stroke={M} />
        </g>
      )}
    </svg>
  );
}
