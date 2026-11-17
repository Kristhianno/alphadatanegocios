import { useState } from 'react'
import { IconLoader2, IconPencil, IconPhotoUp, IconTrash } from '@tabler/icons-react'
import { useBranding } from '../hooks/useBranding'
import { useImagemMarca } from '../hooks/useImagemMarca'
import MenuMarca from './MenuMarca'

/**
 * Nome da marca: o logotipo (nome em imagem) quando a empresa carregou um,
 * senão o nome fantasia em texto. O admin clica para carregar/trocar/remover.
 *
 * `variante` "claro" = fundo azul (header): o logotipo vai numa caixa branca
 * pra continuar legível mesmo se a arte for escura.
 * `editavel={false}` só exibe (sem lápis/menu), ex: no header.
 */
export default function NomeMarca({ textClassName = '', variante = 'padrao', altura = 40, larguraMaxima = 240, Tag = 'span', editavel = true }) {
  const { nomeExibido, logotipoUrl } = useBranding()
  const { podeEditar, salvando, escolherArquivo, remover, inputProps } = useImagemMarca('logotipo')
  const [menuAberto, setMenuAberto] = useState(false)
  const claro = variante === 'claro'

  const conteudo = logotipoUrl ? (
    <span className={`flex items-center ${claro ? 'rounded-[10px] bg-white px-2.5 py-1.5' : ''}`} style={{ maxWidth: larguraMaxima }}>
      {/* Altura em px: assim a largura acompanha a proporção da arte, sem sobra. */}
      <img src={logotipoUrl} alt={nomeExibido} className="block w-auto max-w-full object-contain" style={{ height: claro ? altura - 12 : altura }} />
    </span>
  ) : (
    <Tag className={`${textClassName} truncate`}>{nomeExibido}</Tag>
  )

  if (!podeEditar || !editavel) return logotipoUrl ? <Tag className="min-w-0">{conteudo}</Tag> : conteudo

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => !salvando && setMenuAberto((v) => !v)}
        title={logotipoUrl ? 'Trocar ou remover o logotipo' : 'Carregar o logotipo (nome da marca em imagem)'}
        className={`group flex min-w-0 max-w-full items-center gap-2 rounded-[10px] text-left focus:outline-none focus-visible:ring-2 ${
          claro ? 'focus-visible:ring-white' : 'focus-visible:ring-primary'
        }`}
      >
        {logotipoUrl ? <Tag className="min-w-0">{conteudo}</Tag> : conteudo}
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity ${
            claro ? 'bg-white/15 text-white' : 'bg-primary-light text-primary'
          } ${salvando ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
        >
          {salvando ? <IconLoader2 size={15} className="animate-spin" /> : <IconPencil size={15} />}
        </span>
      </button>
      <input {...inputProps} />
      <MenuMarca
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        titulo="Logotipo: o nome da sua marca em imagem. Ele aparece no lugar do nome em texto."
        opcoes={
          logotipoUrl
            ? [
                { rotulo: 'Trocar logotipo', icone: IconPhotoUp, onClick: escolherArquivo },
                { rotulo: 'Remover e mostrar o nome', icone: IconTrash, onClick: remover, perigo: true },
              ]
            : [{ rotulo: 'Carregar logotipo', icone: IconPhotoUp, onClick: escolherArquivo }]
        }
      />
    </div>
  )
}
