import { useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { useToast } from './useToast'
import { prepararLogo } from '../utils/logo'

const CONFIG = {
  logo: { campo: 'logoUrl', salvo: 'Logo atualizada!', removido: 'Logo removida.' },
  logotipo: { campo: 'logotipoUrl', salvo: 'Logotipo atualizado! Ele aparece no lugar do nome.', removido: 'Logotipo removido. O nome volta a aparecer em texto.' },
}

/**
 * Envio/remoção da logo (símbolo do quadrado) ou do logotipo (nome da
 * marca em imagem). Só o admin edita — `podeEditar` diz isso pra tela.
 */
export function useImagemMarca(tipo) {
  const { user, atualizarBranding } = useAuth()
  const { showToast } = useToast()
  const inputRef = useRef(null)
  const [salvando, setSalvando] = useState(false)
  const { campo, salvo, removido } = CONFIG[tipo]

  async function salvar(valor) {
    setSalvando(true)
    const resultado = await atualizarBranding({ [campo]: valor })
    setSalvando(false)
    showToast(resultado.ok ? (valor ? salvo : removido) : resultado.error, resultado.ok ? 'sucesso' : 'erro')
  }

  async function aoEscolher(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    try {
      await salvar(await prepararLogo(arquivo, tipo))
    } catch (erro) {
      showToast(erro.message, 'erro')
    }
  }

  return {
    podeEditar: user?.userType === 'admin',
    salvando,
    escolherArquivo: () => inputRef.current?.click(),
    remover: () => salvar(null),
    inputProps: {
      ref: inputRef,
      type: 'file',
      accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif',
      className: 'hidden',
      onChange: aoEscolher,
    },
  }
}
