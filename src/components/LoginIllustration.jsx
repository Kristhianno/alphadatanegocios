// Fundo decorativo do painel de marketing do login — puro SVG/CSS
// (sem imagens externas): silhueta de prédios + linhas tracejadas
// ligando "etapas", só pra dar textura atrás do texto.
export default function LoginIllustration({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
      <g stroke="#2F7DE0" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="5 6">
        <path d="M60 120 Q160 60 260 130" />
        <path d="M300 90 Q360 160 320 230" />
        <path d="M120 220 Q100 300 180 330" />
      </g>
      <g fill="#2F7DE0" fillOpacity="0.5">
        <circle cx="60" cy="120" r="4" />
        <circle cx="260" cy="130" r="4" />
        <circle cx="300" cy="90" r="4" />
        <circle cx="320" cy="230" r="4" />
        <circle cx="120" cy="220" r="4" />
        <circle cx="180" cy="330" r="4" />
      </g>
      <g fillOpacity="0.15" fill="#1B2233">
        <rect x="0" y="380" width="70" height="120" rx="4" />
        <rect x="80" y="340" width="60" height="160" rx="4" />
        <rect x="150" y="400" width="90" height="100" rx="4" />
        <rect x="250" y="360" width="55" height="140" rx="4" />
        <rect x="315" y="410" width="80" height="90" rx="4" />
        <rect x="405" y="370" width="65" height="130" rx="4" />
        <rect x="480" y="420" width="120" height="80" rx="4" />
      </g>
    </svg>
  )
}
