import { useBranding } from '../hooks/useBranding'
import LogoEmpresa from './LogoEmpresa'

/**
 * Logotipo + nome fantasia da conta — usado no Header e no Sidebar.
 * O admin clica no logo para adicionar/trocar (ver LogoEmpresa).
 */
export default function BrandMark({ textClassName = '', variante = 'padrao', tamanho = 40 }) {
  const { nomeExibido } = useBranding()
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoEmpresa variante={variante} tamanho={tamanho} />
      <span className={`${textClassName} truncate`}>{nomeExibido}</span>
    </span>
  )
}
