import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  IconBuildingStore, IconConfetti, IconCreditCard, IconHourglass, IconLogout, IconMail, IconRefresh, IconSearch, IconUsers,
} from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import AlphaDataLogo from '../../components/AlphaDataLogo'
import KpiCard from '../../components/ui/KpiCard'
import Badge from '../../components/ui/Badge'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { NOME_MARKETING_PLANO, ROTULO_CICLO } from '../../data/planos'

const SITUACAO = {
  pagante: { label: 'Pagante', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  em_teste: { label: 'Em teste', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pendente: { label: 'Pagamento pendente', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  sem_plano: { label: 'Sem plano', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
}

const STATUS_CONTA = {
  ativo: { label: 'Ativa', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  suspenso: { label: 'Suspensa', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  cancelado: { label: 'Cancelada', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
}


function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function PainelSuperadmin() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [aba, setAba] = useState('contas')
  const [resumo, setResumo] = useState(null)
  const [contas, setContas] = useState([])
  const [leads, setLeads] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [confirmando, setConfirmando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const [r, c, l] = await Promise.all([api.get('/plataforma/resumo'), api.get('/plataforma/contas'), api.get('/plataforma/leads')])
      setResumo(r)
      setContas(c)
      setLeads(l)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os dados da plataforma.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (user?.papel === 'superadmin') carregar()
  }, [user?.papel, carregar])

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return contas
    return contas.filter((c) =>
      [c.nomeEmpresa, c.emailAdmin, c.nicho].some((campo) => campo?.toLowerCase().includes(termo)),
    )
  }, [contas, busca])

  if (!user) return <Navigate to="/login" replace />
  if (user.papel !== 'superadmin') return <Navigate to="/" replace />

  function sair() {
    logout()
    navigate('/login')
  }

  async function alterarStatus(conta, status) {
    setConfirmando(null)
    try {
      const atualizada = await api.patch(`/plataforma/contas/${conta.id}/status`, { status })
      setContas((lista) => lista.map((c) => (c.id === atualizada.id ? atualizada : c)))
      showToast(status === 'suspenso' ? `"${conta.nomeEmpresa}" foi suspensa.` : `"${conta.nomeEmpresa}" foi reativada.`)
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao alterar o status.', 'erro')
    }
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-surface border-b border-muted-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AlphaDataLogo tagline={null} className="scale-75 origin-left" />
            <span className="hidden sm:inline text-label font-semibold uppercase tracking-wide text-primary bg-primary-light rounded-btn px-2 py-1">
              Superadmin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-body text-[#666] truncate">{user.email}</span>
            <button onClick={sair} className="flex items-center gap-1.5 rounded-btn px-3 py-2 text-body text-[#666] hover:bg-muted">
              <IconLogout size={18} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-h1 text-[#1a1a1a]">Painel da Plataforma</h1>
            <p className="text-body text-[#666]">Todas as empresas, assinaturas e leads da ALPHADATA Festas & Eventos.</p>
          </div>
          <button
            onClick={carregar}
            disabled={carregando}
            className="flex items-center gap-1.5 rounded-btn border border-muted-dark bg-surface px-3 py-2 text-body text-[#333] hover:bg-muted disabled:opacity-60"
          >
            <IconRefresh size={18} className={carregando ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>

        {erro && <div className="mb-6 rounded-card bg-red-50 text-red-700 px-4 py-3 text-body">{erro}</div>}

        {resumo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon={IconBuildingStore} valor={resumo.totalContas} label="Empresas" sublabel={`+${resumo.contasUltimos30Dias} nos últimos 30 dias`} />
            <KpiCard icon={IconCreditCard} cor="verde" valor={resumo.porSituacao.pagante} label="Pagantes" sublabel={`${resumo.porSituacao.pendente} com pagamento pendente`} />
            <KpiCard icon={IconHourglass} cor="laranja" valor={resumo.porSituacao.em_teste} label="Em teste grátis" sublabel={`${resumo.totalUsuarios} usuários no total`} />
            <KpiCard icon={IconMail} cor="roxo" valor={resumo.totalLeads} label="Leads" sublabel={`+${resumo.leadsUltimos30Dias} nos últimos 30 dias`} />
          </div>
        )}

        {resumo && resumo.porNicho.length > 0 && (
          <div className="bg-surface rounded-card shadow-card p-5 mb-6">
            <p className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wide text-[#999] mb-3">
              <IconConfetti size={15} /> Empresas por nicho
            </p>
            <div className="flex flex-wrap gap-2">
              {resumo.porNicho.map(({ nicho, total }) => (
                <span key={nicho} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-body text-[#333]">
                  {nicho} <span className="font-bold text-primary">{total}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-4 bg-surface rounded-btn shadow-card p-1 w-fit">
          {[
            ['contas', `Empresas (${contas.length})`],
            ['leads', `Leads (${leads.length})`],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              onClick={() => setAba(valor)}
              className={`rounded-btn px-4 py-2 text-body font-medium ${aba === valor ? 'bg-primary text-white' : 'text-[#666] hover:bg-muted'}`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === 'contas' ? (
          <div className="bg-surface rounded-card shadow-card">
            <div className="p-4 border-b border-muted-dark">
              <div className="relative max-w-sm">
                <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar empresa, email ou nicho"
                  className="w-full rounded-input border border-muted-dark pl-10 pr-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="text-left text-label uppercase tracking-wide text-[#999] border-b border-muted-dark">
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Nicho</th>
                    <th className="px-4 py-3 font-semibold">Plano</th>
                    <th className="px-4 py-3 font-semibold">Assinatura</th>
                    <th className="px-4 py-3 font-semibold">Usuários</th>
                    <th className="px-4 py-3 font-semibold">Último acesso</th>
                    <th className="px-4 py-3 font-semibold">Criada em</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {contasFiltradas.map((c) => (
                    <tr key={c.id} className="border-b border-muted-dark last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1a1a1a]">{c.nomeEmpresa}</p>
                        <p className="text-label text-[#999]">{c.emailAdmin ?? 'sem admin'}</p>
                      </td>
                      <td className="px-4 py-3 text-[#333] whitespace-nowrap">{c.nicho ?? <span className="text-[#999]">Não escolhido</span>}</td>
                      <td className="px-4 py-3 text-[#333] whitespace-nowrap">
                        {NOME_MARKETING_PLANO[c.plano] ?? c.plano}
                        {c.cicloCobranca && <span className="text-label text-[#999]"> · {ROTULO_CICLO[c.cicloCobranca] ?? c.cicloCobranca}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge status={c.situacaoAssinatura} cores={SITUACAO} label={SITUACAO[c.situacaoAssinatura]?.label} />
                        {c.situacaoAssinatura === 'em_teste' && (
                          <p className="text-label text-[#999] mt-1">até {formatarData(c.trialTerminaEm)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#333]">
                        <span className="inline-flex items-center gap-1"><IconUsers size={16} className="text-[#999]" /> {c.totalUsuarios}</span>
                      </td>
                      <td className="px-4 py-3 text-[#333] whitespace-nowrap">{formatarData(c.ultimoLoginEm)}</td>
                      <td className="px-4 py-3 text-[#333] whitespace-nowrap">{formatarData(c.criadoEm)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge status={c.status} cores={STATUS_CONTA} label={STATUS_CONTA[c.status]?.label} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {c.status === 'ativo' ? (
                          <button onClick={() => setConfirmando({ conta: c, status: 'suspenso' })} className="text-label font-medium text-red-600 hover:underline">
                            Suspender
                          </button>
                        ) : (
                          <button onClick={() => setConfirmando({ conta: c, status: 'ativo' })} className="text-label font-medium text-primary hover:underline">
                            Reativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!carregando && contasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#999]">Nenhuma empresa encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-card shadow-card overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="text-left text-label uppercase tracking-wide text-[#999] border-b border-muted-dark">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Recebido em</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-muted-dark last:border-0">
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{l.nome}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a>
                    </td>
                    <td className="px-4 py-3 text-[#333]">{l.origem ?? '—'}</td>
                    <td className="px-4 py-3 text-[#333] whitespace-nowrap">{formatarData(l.criadoEm)}</td>
                  </tr>
                ))}
                {!carregando && leads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#999]">Nenhum lead ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {confirmando && (
        <ConfirmModal
          open
          titulo={confirmando.status === 'suspenso' ? 'Suspender empresa?' : 'Reativar empresa?'}
          mensagem={
            confirmando.status === 'suspenso'
              ? `Todos os usuários de "${confirmando.conta.nomeEmpresa}" perdem o acesso na hora, até você reativar.`
              : `Os usuários de "${confirmando.conta.nomeEmpresa}" voltam a acessar normalmente.`
          }
          textoConfirmar={confirmando.status === 'suspenso' ? 'Suspender' : 'Reativar'}
          corConfirmar={confirmando.status === 'suspenso' ? 'bg-red-600 hover:bg-red-700' : undefined}
          onConfirm={() => alterarStatus(confirmando.conta, confirmando.status)}
          onClose={() => setConfirmando(null)}
        />
      )}
    </div>
  )
}
