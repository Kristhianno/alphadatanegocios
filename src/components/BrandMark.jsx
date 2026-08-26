import { useBranding } from '../hooks/useBranding'

/** Nome fantasia + logo da conta (ou a marca padrão, se ainda não personalizado) — usado no Header e no Sidebar. */
export default function BrandMark({ textClassName = '', imgClassName = 'h-8 w-8 rounded-btn object-cover shrink-0' }) {
  const { nomeExibido, logoUrl } = useBranding()

  if (!logoUrl) return <span className={textClassName}>{nomeExibido}</span>

  return (
    <span className="flex items-center gap-2 min-w-0">
      <img src={logoUrl} alt={nomeExibido} className={imgClassName} />
      <span className={`${textClassName} truncate`}>{nomeExibido}</span>
    </span>
  )
}
