import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock, IconDownload, IconLogout, IconEdit } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useClientes } from '../../hooks/useClientes'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useToast } from '../../hooks/useToast'
import { usePDF } from '../../hooks/usePDF'
import Modal from '../../components/ui/Modal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-[#999]'
const labelClasse = 'text-label text-[#666] block mb-1'

function chavePreferencias(clienteId) {
  return `alphadata_perfil_${clienteId}`
}

export default function Perfil() {
  const { user, logout, trocarSenha } = useAuth()
  const { getById, updateCliente } = useClientes()
  const { ordens } = useOrdensServico()
  const { showToast } = useToast()
  const { gerarPDF } = usePDF()
  const navigate = useNavigate()

  const cliente = getById(user.clienteId)
  const [editandoDados, setEditandoDados] = useState(false)
  const [dados, setDados] = useState(cliente ?? {})
  const [modalSenha, setModalSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

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

  const [preferencias, setPreferencias] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(chavePreferencias(user.clienteId))) ?? {
        pagamento: { metodo: 'PIX', ultimosDigitos: '', vencimento: '' },
        notificacoes: { email: true, sms: false, whatsapp: true },
        privacidade: 'Privada',
      }
    } catch {
      return { pagamento: { metodo: 'PIX', ultimosDigitos: '', vencimento: '' }, notificacoes: { email: true, sms: false, whatsapp: true }, privacidade: 'Privada' }
    }
  })

  useEffect(() => {
    localStorage.setItem(chavePreferencias(user.clienteId), JSON.stringify(preferencias))
  }, [preferencias, user.clienteId])

  const minhasOrdens = ordens.filter((o) => o.clienteId === user.clienteId)

  function salvarDados(e) {
    e.preventDefault()
    updateCliente(user.clienteId, dados)
    setEditandoDados(false)
    showToast('Perfil atualizado com sucesso!')
  }

  function baixarRecibos() {
    gerarPDF({
      titulo: `Recibos — ${cliente?.nome}`,
      filtrosTexto: [],
      colunas: ['Data', 'Serviço', 'Valor', 'Status'],
      linhas: minhasOrdens.map((o) => [o.dataAgendada, o.tipoServico, `R$ ${o.valor}`, o.status === 'Concluída' ? 'Pago' : 'Pendente']),
      nomeArquivo: `recibos-${user.clienteId}`,
    })
  }

  function baixarDadosLGPD() {
    gerarPDF({
      titulo: 'Meus Dados (LGPD) — ALPHADATA',
      filtrosTexto: [],
      colunas: ['Campo', 'Valor'],
      linhas: [
        ['Nome', cliente?.nome],
        ['Email', cliente?.email],
        ['Telefone', cliente?.telefone],
        ['Endereço', cliente?.endereco],
        ['CNPJ', cliente?.cnpj],
        ['Total de Ordens', String(minhasOrdens.length)],
      ],
      nomeArquivo: `meus-dados-lgpd-${user.clienteId}`,
    })
    showToast('Seus dados foram exportados em PDF.')
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (!cliente) return <p className="text-body text-[#999]">Perfil não encontrado.</p>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-h1 text-primary">Meu Perfil ALPHADATA</h1>

      {/* Seção 1: Dados Pessoais */}
      <form onSubmit={salvarDados} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-[#1a1a1a]">Dados Pessoais</h2>
          {!editandoDados && (
            <button type="button" onClick={() => setEditandoDados(true)} className="flex items-center gap-1.5 text-primary hover:underline text-body font-medium">
              <IconEdit size={16} /> Editar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClasse}>Nome</label><input disabled={!editandoDados} className={inputClasse} value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} /></div>
          <div><label className={labelClasse}>Email</label><input disabled className={inputClasse} value={dados.email} /></div>
          <div><label className={labelClasse}>Telefone</label><input disabled={!editandoDados} className={inputClasse} value={dados.telefone} onChange={(e) => setDados((d) => ({ ...d, telefone: e.target.value }))} /></div>
          <div><label className={labelClasse}>CNPJ</label><input disabled={!editandoDados} className={inputClasse} value={dados.cnpj} onChange={(e) => setDados((d) => ({ ...d, cnpj: e.target.value }))} /></div>
          <div className="md:col-span-2"><label className={labelClasse}>Endereço Principal</label><input disabled={!editandoDados} className={inputClasse} value={dados.endereco} onChange={(e) => setDados((d) => ({ ...d, endereco: e.target.value }))} /></div>
          <div><label className={labelClasse}>Cidade</label><input disabled={!editandoDados} className={inputClasse} value={dados.cidade} onChange={(e) => setDados((d) => ({ ...d, cidade: e.target.value }))} /></div>
          <div><label className={labelClasse}>Estado</label><input disabled={!editandoDados} className={inputClasse} value={dados.estado} onChange={(e) => setDados((d) => ({ ...d, estado: e.target.value }))} /></div>
        </div>
        {editandoDados && (
          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => { setDados(cliente); setEditandoDados(false) }} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
          </div>
        )}
      </form>

      {/* Seção 2: Forma de Pagamento */}
      <div className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4">
        <h2 className="text-h2 text-[#1a1a1a]">Forma de Pagamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasse}>Método</label>
            <select className={inputClasse} value={preferencias.pagamento.metodo} onChange={(e) => setPreferencias((p) => ({ ...p, pagamento: { ...p.pagamento, metodo: e.target.value } }))}>
              <option>Cartão</option>
              <option>PIX</option>
              <option>Boleto</option>
              <option>Transferência</option>
            </select>
          </div>
          {preferencias.pagamento.metodo === 'Cartão' && (
            <div>
              <label className={labelClasse}>Últimos 4 dígitos</label>
              <input maxLength={4} className={inputClasse} value={preferencias.pagamento.ultimosDigitos} onChange={(e) => setPreferencias((p) => ({ ...p, pagamento: { ...p.pagamento, ultimosDigitos: e.target.value } }))} />
            </div>
          )}
        </div>
        <button onClick={() => showToast('Forma de pagamento atualizada!')} className="self-start rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
          Alterar Pagamento
        </button>
      </div>

      {/* Seção 3: Histórico de Pagamentos */}
      <div className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-3">
        <h2 className="text-h2 text-[#1a1a1a]">Histórico de Pagamentos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 text-label font-semibold text-[#666]">Data</th>
                <th className="text-left px-3 py-2 text-label font-semibold text-[#666]">Serviço</th>
                <th className="text-left px-3 py-2 text-label font-semibold text-[#666]">Valor</th>
                <th className="text-left px-3 py-2 text-label font-semibold text-[#666]">Status</th>
              </tr>
            </thead>
            <tbody>
              {minhasOrdens.map((o) => (
                <tr key={o.id} className="border-t border-muted-dark">
                  <td className="px-3 py-2">{o.dataAgendada}</td>
                  <td className="px-3 py-2">{o.tipoServico}</td>
                  <td className="px-3 py-2">R$ {o.valor}</td>
                  <td className="px-3 py-2">
                    <span className={`text-label font-medium rounded-full px-2.5 py-1 ${o.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {o.status === 'Concluída' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={baixarRecibos} className="self-start text-primary hover:underline text-body font-medium">Ver recibos</button>
      </div>

      {/* Seção 4: Configurações */}
      <div className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4">
        <h2 className="text-h2 text-[#1a1a1a]">Configurações</h2>
        <div>
          <p className="text-label text-[#666] mb-2">Receber notificações via</p>
          <div className="flex flex-col gap-2">
            {[['email', 'Email'], ['sms', 'SMS'], ['whatsapp', 'WhatsApp']].map(([campo, label]) => (
              <label key={campo} className="flex items-center gap-2 text-body">
                <input type="checkbox" checked={preferencias.notificacoes[campo]} onChange={(e) => setPreferencias((p) => ({ ...p, notificacoes: { ...p.notificacoes, [campo]: e.target.checked } }))} />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClasse}>Privacidade</label>
          <select className={`${inputClasse} max-w-xs`} value={preferencias.privacidade} onChange={(e) => setPreferencias((p) => ({ ...p, privacidade: e.target.value }))}>
            <option>Pública</option>
            <option>Privada</option>
          </select>
        </div>
      </div>

      {/* Seção 5: Ações */}
      <div className="bg-surface rounded-card shadow-card p-5 flex flex-wrap gap-3">
        <button onClick={() => setModalSenha(true)} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          <IconLock size={18} /> Alterar Senha
        </button>
        <button onClick={baixarDadosLGPD} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          <IconDownload size={18} /> Baixar Meus Dados (LGPD)
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
          <div><label className={labelClasse}>Senha Atual</label><input type="password" className={inputClasse} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} /></div>
          <div><label className={labelClasse}>Nova Senha</label><input type="password" className={inputClasse} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} /></div>
          <div><label className={labelClasse}>Confirmar Nova Senha</label><input type="password" className={inputClasse} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} /></div>
          {erroSenha && <p className="text-danger text-label">{erroSenha}</p>}
        </div>
      </Modal>
    </div>
  )
}
