import { useState } from 'react'
import { IconBuildingStore, IconCamera, IconLoader2, IconPhotoUp, IconTrash } from '@tabler/icons-react'
import { useBranding } from '../hooks/useBranding'
import { useImagemMarca } from '../hooks/useImagemMarca'
import MenuMarca from './MenuMarca'

/**
 * Logo da empresa (o símbolo) no quadrado ao lado do nome. O admin clica
 * e adiciona/troca/remove ali mesmo; os demais usuários só veem a imagem.
 *
 * `tamanho` em px; `variante` "claro" é pra fundo azul (header), "padrao" pra fundo claro.
 */
export default function LogoEmpresa({ tamanho = 40, variante = 'padrao' }) {
  const { nomeExibido, logoUrl } = useBranding()
  const { podeEditar, salvando, escolherArquivo, remover, inputProps } = useImagemMarca('logo')
  const [menuAberto, setMenuAberto] = useState(false)
  const claro = variante === 'claro'

  const caixa = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${
    logoUrl
      ? 'bg-white'
      : claro
        ? 'border-2 border-dashed border-white/50 bg-white/10'
        : 'border-2 border-dashed border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-primary-light'
  }`
  const estilo = { width: tamanho, height: tamanho }
  const conteudo = logoUrl ? (
    <img src={logoUrl} alt={`Logo ${nomeExibido}`} className="h-full w-full object-contain p-[3px]" />
  ) : podeEditar ? (
    <IconPhotoUp size={Math.round(tamanho * 0.45)} className={claro ? 'text-white' : 'text-primary'} />
  ) : (
    <IconBuildingStore size={Math.round(tamanho * 0.5)} className={claro ? 'text-white' : 'text-primary'} />
  )

  if (!podeEditar) {
    return (
      <span className={caixa} style={estilo}>
        {conteudo}
      </span>
    )
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => !salvando && (logoUrl ? setMenuAberto((v) => !v) : escolherArquivo())}
        title={logoUrl ? 'Trocar ou remover a logo' : 'Adicionar a logo (símbolo da marca)'}
        aria-label={logoUrl ? 'Trocar ou remover a logo' : 'Adicionar a logo'}
        className={`${caixa} group focus:outline-none focus-visible:ring-2 ${claro ? 'focus-visible:ring-white' : 'focus-visible:ring-primary'}`}
        style={estilo}
      >
        {conteudo}
        <span
          className={`absolute inset-0 flex items-center justify-center bg-[#0B1F44]/55 text-white transition-opacity ${
            salvando ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${logoUrl || salvando ? '' : 'hidden'}`}
        >
          {salvando ? <IconLoader2 size={Math.round(tamanho * 0.4)} className="animate-spin" /> : <IconCamera size={Math.round(tamanho * 0.4)} />}
        </span>
      </button>
      <input {...inputProps} />
      <MenuMarca
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        titulo="Logo: o símbolo da marca, no quadrado."
        opcoes={[
          { rotulo: 'Trocar logo', icone: IconPhotoUp, onClick: escolherArquivo },
          { rotulo: 'Remover logo', icone: IconTrash, onClick: remover, perigo: true },
        ]}
      />
    </div>
  )
}
