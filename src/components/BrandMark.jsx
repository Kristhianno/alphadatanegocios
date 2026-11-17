import LogoEmpresa from './LogoEmpresa'
import NomeMarca from './NomeMarca'

/**
 * Logo (símbolo no quadrado) + nome da marca (logotipo em imagem ou nome
 * fantasia em texto) — usado no Header e no Sidebar. O admin clica em cada
 * um para carregar/trocar (ver LogoEmpresa e NomeMarca).
 */
export default function BrandMark({ textClassName = '', variante = 'padrao', tamanho = 40, larguraMaximaNome = 240 }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoEmpresa variante={variante} tamanho={tamanho} />
      <NomeMarca variante={variante} altura={tamanho} larguraMaxima={larguraMaximaNome} textClassName={textClassName} />
    </span>
  )
}
