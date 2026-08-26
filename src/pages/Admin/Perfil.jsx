import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock, IconLogout, IconEdit } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { NOME_PLATAFORMA_PADRAO, TAMANHO_MAX_LOGO_BYTES } from '../../hooks/useBranding'
import { useToast } from '../../hooks/useToast'
import Modal from '../../components/ui/Modal'
import PasswordInput from '../../components/ui/PasswordInput'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-[#999]'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function Perfil() {
  const { user, logout, atualizarPerfil, atualizarBranding, trocarSenha } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [editandoDados, setEditandoDados] = useState(false)
  const [dados, setDados] = useState({ nome: user?.nome ?? '', email: user?.email ?? '' })
  const [salvandoDados, setSalvandoDados] = useState(false)

  const [nomeFantasia, setNomeFantasia] = useState(user?.nomeEmpresa ?? '')
  const [logoPreview, setLogoPreview] = useState(user?.logoUrl ?? null)
  const [salvandoMarca, setSalvandoMarca] = useState(false)

  const [modalSenha, setModalSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    setNomeFantasia(user?.nomeEmpresa ?? '')
    setLogoPreview(user?.logoUrl ?? null)
  }, [user?.nomeEmpresa, user?.logoUrl])

  async function salvarDados(e) {
    e.preventDefault()
    setSalvandoDados(true)
    const resultado = await atualizarPerfil(dados)
    setSalvandoDados(false)
    if (!resultado.ok) {
      showToast(resultado.error, 'erro')
      return
    }
    setEditandoDados(false)
    showToast('Perfil atualizado com sucesso!')
  }

  function selecionarLogo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      showToast('Escolha um arquivo de imagem.', 'erro')
      return
    }
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      showToast('Imagem muito grande. Escolha um arquivo de até 300KB.', 'erro')
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => setLogoPreview(leitor.result)
    leitor.readAsDataURL(arquivo)
  }

  async function salvarMarca(e) {
    e.preventDefault()
    if (nomeFantasia.trim().length < 2) {
      showToast('Informe um nome fantasia com ao menos 2 caracteres.', 'erro')
      return
    }
    setSalvandoMarca(true)
    const resultado = await atualizarBranding({ nomeEmpresa: nomeFantasia.trim(), logoUrl: logoPreview })
    setSalvandoMarca(false)
    showToast(resultado.ok ? 'Marca personalizada com sucesso!' : resultado.error, resultado.ok ? 'sucesso' : 'erro')
  }

  async function salvarNovaSenha() {
    setErroSenha('')
    if (novaSenha.length < 8) {
      setErroSenha('A nova senha precisa de ao menos 8 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('A confirmação não confere com a nova senha.')
      return
    }
    setSalvandoSenha(true)
    const resultado = await trocarSenha(senhaAtual, novaSenha)
    setSalvandoSenha(false)
    if (!resultado.ok) {
      setErroSenha(resultado.error)
      return
    }
    setModalSenha(false)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    showToast('Senha alterada com sucesso!')
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-h1 text-primary">Meu Perfil</h1>

      {/* Seção 1: Dados do responsável */}
      <form onSubmit={salvarDados} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-[#1a1a1a]">Dados do Responsável</h2>
          {!editandoDados && (
            <button type="button" onClick={() => setEditandoDados(true)} className="flex items-center gap-1.5 text-primary hover:underline text-body font-medium">
              <IconEdit size={16} /> Editar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasse}>Nome</label>
            <input disabled={!editandoDados} className={inputClasse} value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} />
          </div>
          <div>
            <label className={labelClasse}>Email</label>
            <input disabled={!editandoDados} type="email" className={inputClasse} value={dados.email} onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))} />
          </div>
        </div>
        {editandoDados && (
          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button
              type="button"
              onClick={() => { setDados({ nome: user?.nome ?? '', email: user?.email ?? '' }); setEditandoDados(false) }}
              className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button type="submit" disabled={salvandoDados} className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
              {salvandoDados ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </form>

      {/* Seção 2: Marca do negócio */}
      <form onSubmit={salvarMarca} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-5">
        <div>
          <h2 className="text-h2 text-[#1a1a1a]">Marca do Negócio</h2>
          <p className="text-label text-[#666] mt-1">
            O nome fantasia e o logotipo substituem "{NOME_PLATAFORMA_PADRAO}" em toda a plataforma, pra sua equipe e seus clientes.
          </p>
        </div>

        <div>
          <label className={labelClasse}>Nome Fantasia</label>
          <input
            className={inputClasse}
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            placeholder={NOME_PLATAFORMA_PADRAO}
          />
        </div>

        <div>
          <label className="text-label text-[#666] block mb-2">Logotipo (foto de perfil da conta)</label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <img src={logoPreview} alt="Logotipo" className="h-16 w-16 rounded-card object-cover border border-muted-dark" />
            ) : (
              <div className="h-16 w-16 rounded-card border border-dashed border-muted-dark flex items-center justify-center text-label text-[#999] text-center px-1">
                sem logo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-btn px-3 py-1.5 text-label font-medium bg-muted border border-muted-dark hover:bg-primary-light text-center">
                Escolher imagem
                <input type="file" accept="image/*" className="hidden" onChange={selecionarLogo} />
              </label>
              {logoPreview && (
                <button type="button" onClick={() => setLogoPreview(null)} className="text-label text-danger hover:underline text-left">
                  Remover logo
                </button>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={salvandoMarca} className="self-end rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
          {salvandoMarca ? 'Salvando...' : 'Salvar Marca'}
        </button>
      </form>

      {/* Seção 3: Ações */}
      <div className="bg-surface rounded-card shadow-card p-5 flex flex-wrap gap-3">
        <button onClick={() => setModalSenha(true)} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          <IconLock size={18} /> Alterar Senha
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-danger text-white hover:bg-red-600">
          <IconLogout size={18} /> Logout
        </button>
      </div>

      <Modal
        open={modalSenha}
        onClose={() => setModalSenha(false)}
        title="Alterar Senha"
        size="sm"
        footer={
          <button onClick={salvarNovaSenha} disabled={salvandoSenha} className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
            {salvandoSenha ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          <div><label className={labelClasse}>Senha Atual</label><PasswordInput className={inputClasse} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} /></div>
          <div><label className={labelClasse}>Nova Senha</label><PasswordInput className={inputClasse} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} /></div>
          <div><label className={labelClasse}>Confirmar Nova Senha</label><PasswordInput className={inputClasse} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} /></div>
          {erroSenha && <p className="text-danger text-label">{erroSenha}</p>}
        </div>
      </Modal>
    </div>
  )
}
