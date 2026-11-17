import { useRef, useState } from 'react'
import { IconBuildingStore, IconCamera, IconLoader2, IconPhotoUp, IconTrash } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { useBranding } from '../hooks/useBranding'
import { useToast } from '../hooks/useToast'
import { prepararLogo } from '../utils/logo'

/**
 * Logotipo da empresa ao lado do nome. O admin clica e troca/remove ali
 * mesmo; os demais usuários só veem a imagem.
 *
 * `tamanho` em px; `variante` "claro" é pra fundo azul (header), "padrao" pra fundo claro.
 */
export default function LogoEmpresa({ tamanho = 40, variante = 'padrao' }) {
  const { user, atualizarBranding } = useAuth()
  const { nomeExibido, logoUrl } = useBranding()
  const { showToast } = useToast()
  const inputRef = useRef(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const podeEditar = user?.userType === 'admin'
  const claro = variante === 'claro'

  async function salvar(novoLogo) {
    setSalvando(true)
    const resultado = await atualizarBranding({ logoUrl: novoLogo })
    setSalvando(false)
    showToast(resultado.ok ? (novoLogo ? 'Logotipo atualizado!' : 'Logotipo removido.') : resultado.error, resultado.ok ? 'sucesso' : 'erro')
  }

  async function aoEscolher(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    try {
      await salvar(await prepararLogo(arquivo))
    } catch (erro) {
      showToast(erro.message, 'erro')
    }
  }

  function aoClicar() {
    if (salvando) return
    if (logoUrl) setMenuAberto((v) => !v)
    else inputRef.current?.click()
  }

  const caixa = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${
    logoUrl ? 'bg-white' : claro ? 'border-2 border-dashed border-white/50 bg-white/10' : 'border-2 border-dashed border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-primary-light'
  }`
  const estilo = { width: tamanho, height: tamanho }
  const conteudo = logoUrl ? (
    <img src={logoUrl} alt={`Logotipo ${nomeExibido}`} className="h-full w-full object-contain p-[3px]" />
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
        onClick={aoClicar}
        title={logoUrl ? 'Trocar ou remover o logotipo' : 'Adicionar logotipo'}
        aria-label={logoUrl ? 'Trocar ou remover o logotipo' : 'Adicionar logotipo'}
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
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={aoEscolher} />

      {menuAberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-card border border-muted-dark bg-white text-[#333] shadow-cardHover">
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false)
                inputRef.current?.click()
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body hover:bg-primary-light"
            >
              <IconPhotoUp size={18} /> Trocar logotipo
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false)
                salvar(null)
              }}
              className="flex w-full items-center gap-2 border-t border-muted-dark px-4 py-2.5 text-left text-body text-danger hover:bg-red-50"
            >
              <IconTrash size={18} /> Remover logotipo
            </button>
          </div>
        </>
      )}
    </div>
  )
}
