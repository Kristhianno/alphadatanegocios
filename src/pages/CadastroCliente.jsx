import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconBuildingStore, IconCheck, IconAlertTriangle, IconCopy } from '@tabler/icons-react'
import { api, ApiError } from '../services/api'
import AlphaDataLogo from '../components/AlphaDataLogo'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

const CAMPOS_INICIAIS = { nome: '', email: '', telefone: '', documento: '', endereco: '', cidade: '', estado: '' }

export default function CadastroCliente() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [infoConvite, setInfoConvite] = useState(null)
  const [erroConvite, setErroConvite] = useState('')
  const [carregandoInfo, setCarregandoInfo] = useState(true)

  const [dados, setDados] = useState(CAMPOS_INICIAIS)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [resultado, setResultado] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let cancelado = false
    api
      .get(`/convites/clientes/${token}`, { comAuth: false })
      .then((info) => {
        if (!cancelado) setInfoConvite(info)
      })
      .catch((erro) => {
        if (!cancelado) setErroConvite(erro instanceof ApiError ? erro.message : 'Não foi possível carregar este convite.')
      })
      .finally(() => {
        if (!cancelado) setCarregandoInfo(false)
      })
    return () => {
      cancelado = true
    }
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setErroEnvio('')
    try {
      const dadosEnviados = { ...dados }
      if (!dadosEnviados.telefone) delete dadosEnviados.telefone
      if (!dadosEnviados.documento) delete dadosEnviados.documento
      if (!dadosEnviados.endereco) delete dadosEnviados.endereco
      if (!dadosEnviados.cidade) delete dadosEnviados.cidade
      if (!dadosEnviados.estado) delete dadosEnviados.estado

      const resposta = await api.post(`/convites/clientes/${token}`, dadosEnviados, { comAuth: false })
      setResultado(resposta)
    } catch (erro) {
      setErroEnvio(erro instanceof ApiError ? erro.message : 'Falha ao enviar o cadastro. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function copiarCredenciais() {
    try {
      await navigator.clipboard.writeText(`Login: ${resultado.email}\nSenha temporária: ${resultado.senhaTemporaria}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* clipboard indisponível — o usuário copia manualmente da tela */
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <AlphaDataLogo variant="branco" tagline="Cadastro de Cliente" />
        </div>

        <div className="bg-surface rounded-card shadow-cardHover p-6 sm:p-8">
          {carregandoInfo && <p className="text-body text-[#666] text-center py-8">Carregando convite...</p>}

          {!carregandoInfo && erroConvite && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <IconAlertTriangle size={40} className="text-danger" />
              <p className="text-h2 text-[#1a1a1a]">Link inválido</p>
              <p className="text-body text-[#666]">{erroConvite}</p>
              <button onClick={() => navigate('/login')} className="mt-2 text-primary hover:underline text-body font-medium">
                Ir para o login
              </button>
            </div>
          )}

          {!carregandoInfo && infoConvite && !resultado && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <IconBuildingStore size={22} className="text-primary" />
                <p className="text-h2 text-[#1a1a1a]">{infoConvite.nomeEmpresa}</p>
              </div>
              <p className="text-body text-[#666] mb-5">
                Preencha seus dados para se cadastrar. Você receberá um login e uma senha temporária para acompanhar
                todo o seu atendimento pela plataforma.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className={labelClasse}>Nome completo *</label>
                  <input required className={inputClasse} value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClasse}>Email *</label>
                  <input required type="email" className={inputClasse} value={dados.email} onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasse}>Telefone</label>
                    <input className={inputClasse} placeholder="(11) 98765-4321" value={dados.telefone} onChange={(e) => setDados((d) => ({ ...d, telefone: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClasse}>CPF ou CNPJ</label>
                    <input className={inputClasse} value={dados.documento} onChange={(e) => setDados((d) => ({ ...d, documento: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={labelClasse}>Endereço</label>
                  <input className={inputClasse} value={dados.endereco} onChange={(e) => setDados((d) => ({ ...d, endereco: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasse}>Cidade</label>
                    <input className={inputClasse} value={dados.cidade} onChange={(e) => setDados((d) => ({ ...d, cidade: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClasse}>Estado</label>
                    <input className={inputClasse} maxLength={2} value={dados.estado} onChange={(e) => setDados((d) => ({ ...d, estado: e.target.value.toUpperCase() }))} />
                  </div>
                </div>

                {erroEnvio && <p className="text-danger text-label">{erroEnvio}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Concluir cadastro'}
                </button>
              </form>
            </>
          )}

          {resultado && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <IconCheck size={26} className="text-success" />
              </div>
              <p className="text-h2 text-[#1a1a1a]">Cadastro concluído!</p>
              <p className="text-body text-[#666]">
                Anote suas credenciais agora — a senha temporária não será mostrada novamente. No primeiro acesso você
                será solicitado a trocá-la.
              </p>

              <div className="w-full bg-muted rounded-card p-4 text-left flex flex-col gap-1.5">
                <p className="text-body">
                  <span className="text-[#666]">Login:</span> <span className="font-semibold">{resultado.email}</span>
                </p>
                <p className="text-body">
                  <span className="text-[#666]">Senha temporária:</span>{' '}
                  <span className="font-semibold font-mono">{resultado.senhaTemporaria}</span>
                </p>
              </div>

              <button onClick={copiarCredenciais} className="flex items-center gap-1.5 text-primary hover:underline text-body font-medium">
                <IconCopy size={16} /> {copiado ? 'Copiado!' : 'Copiar credenciais'}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full mt-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold"
              >
                Ir para o login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
