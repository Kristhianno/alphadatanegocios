import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLogout } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { usePrestadores } from '../../hooks/usePrestadores'
import { useToast } from '../../hooks/useToast'
import StarRating from '../../components/ui/StarRating'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function Perfil() {
  const { user, logout } = useAuth()
  const { getById, updatePrestador } = usePrestadores()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const prestador = getById(user.tecnicoId)
  const [dados, setDados] = useState(prestador ?? {})

  function salvar(e) {
    e.preventDefault()
    updatePrestador(user.tecnicoId, dados)
    showToast('Perfil atualizado com sucesso!')
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (!prestador) return <p className="text-body text-[#999]">Perfil não encontrado.</p>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-h1 text-primary">Meu Perfil ALPHADATA</h1>

      <div className="bg-surface rounded-card shadow-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center text-2xl font-bold">
          {prestador.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <p className="text-h2 text-[#1a1a1a]">{prestador.nome}</p>
          <p className="text-body text-[#666]">{prestador.especialidade}</p>
          <div className="mt-1"><StarRating value={prestador.avaliacao} /></div>
        </div>
        <div className="ml-auto text-center">
          <p className="text-2xl font-bold text-primary">{prestador.totalOS}</p>
          <p className="text-label text-[#666]">OS concluídas</p>
        </div>
      </div>

      <form onSubmit={salvar} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4">
        <h2 className="text-h2 text-[#1a1a1a]">Dados Pessoais</h2>
        <div><label className={labelClasse}>Nome</label><input className={inputClasse} value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} /></div>
        <div><label className={labelClasse}>Telefone</label><input className={inputClasse} value={dados.telefone} onChange={(e) => setDados((d) => ({ ...d, telefone: e.target.value }))} /></div>
        <div><label className={labelClasse}>Email</label><input type="email" className={inputClasse} value={dados.email} onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))} /></div>
        <button type="submit" className="self-end rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar Alterações</button>
      </form>

      <button onClick={handleLogout} className="self-start flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-danger text-white hover:bg-red-600">
        <IconLogout size={18} /> Logout
      </button>
    </div>
  )
}
