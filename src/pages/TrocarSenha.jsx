import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock, IconKey } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import PasswordInput from '../components/ui/PasswordInput'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function TrocarSenha() {
  const { user, trocarSenha } = useAuth()
  const navigate = useNavigate()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const forcada = user?.deveTrocarSenha === true

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 8) {
      setErro('A nova senha precisa de ao menos 8 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('A confirmação não confere com a nova senha.')
      return
    }
    setEnviando(true)
    const resultado = await trocarSenha(senhaAtual, novaSenha)
    setEnviando(false)
    if (!resultado.ok) {
      setErro(resultado.error)
      return
    }
    navigate(`/${user.userType}/dashboard`, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">ALPHADATA</h1>
          <p className="text-blue-100 mt-1 text-body">Negócios</p>
        </div>

        <div className="bg-surface rounded-card shadow-cardHover p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <IconKey size={22} className="text-primary" />
            <p className="text-h2 text-[#1a1a1a]">Troque sua senha</p>
          </div>
          <p className="text-body text-[#666] mb-5">
            {forcada
              ? 'Você está usando uma senha temporária. Defina uma senha nova antes de continuar.'
              : 'Defina uma nova senha para sua conta.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClasse}>{forcada ? 'Senha temporária' : 'Senha atual'}</label>
              <PasswordInput required className={inputClasse} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Nova senha</label>
              <PasswordInput required minLength={8} className={inputClasse} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Confirmar nova senha</label>
              <PasswordInput required minLength={8} className={inputClasse} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
            </div>

            {erro && <p className="text-danger text-label">{erro}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold disabled:opacity-60"
            >
              <IconLock size={18} />
              {enviando ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            {!forcada && (
              <button type="button" onClick={() => navigate(-1)} className="text-center text-label text-primary hover:underline">
                Cancelar
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
