// Logomarca da ALPHADATA (produto) — não confundir com BrandMark, que
// mostra a marca da CONTA logada (nome fantasia/logo personalizado).
// `variant="branco"` é pro fundo em gradiente azul das telas de auth
// (Cadastro de Cliente, Troca de Senha, link de demo); `variant="cor"`
// (padrão) é pra sentar em cima de um cartão branco.
export default function AlphaDataLogo({ variant = 'cor', tagline = 'Negócios', className = '' }) {
  const corPico = variant === 'branco' ? '#FFFFFF' : '#2F7DE0'
  const corAnel = variant === 'branco' ? 'rgba(255,255,255,0.7)' : '#1B2233'
  const corAlpha = variant === 'branco' ? 'text-white' : 'text-[#1B2233]'
  const corData = variant === 'branco' ? 'text-white/70' : 'text-[#2F7DE0]'
  const corTagline = variant === 'branco' ? 'text-blue-100' : 'text-[#999]'

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 78 L44 12 L60 44" stroke={corPico} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 24 H60 A26 26 0 0 1 60 76 H50" stroke={corAnel} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex items-baseline text-2xl font-extrabold tracking-tight leading-none">
        <span className={corAlpha}>ALPHA</span>
        <span className={corData}>DATA</span>
      </div>
      {tagline && <p className={`text-label mt-0.5 ${corTagline}`}>{tagline}</p>}
    </div>
  )
}
