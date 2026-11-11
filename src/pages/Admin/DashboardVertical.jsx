import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconBuildingStore, IconCalendarEvent, IconLayoutKanban, IconLock, IconTrophy, IconUsers } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { temCrm } from '../../data/planos'
import { useClientes } from '../../hooks/useClientes'
import { api } from '../../services/api'
import KpiCard from '../../components/ui/KpiCard'

/** Etapas do CRM em kanban — mesmas de Admin/CrmLeads.jsx. */
const ETAPAS_CRM = [
  { id: 'novo', titulo: 'Novo lead', cor: 'bg-blue-500' },
  { id: 'primeiro_contato', titulo: 'Primeiro contato', cor: 'bg-violet-500' },
  { id: 'follow_up', titulo: 'Follow-up', cor: 'bg-orange-500' },
  { id: 'concluido', titulo: 'Concluído', cor: 'bg-emerald-500' },
]

const ROTULOS_STATUS = {
  agendado: 'Agendado', confirmado: 'Confirmado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado',
  aberta: 'Aberta',
}

// Dashboard genérico pros verticais que ainda não têm tela própria
// (confeitaria, salão de festas, fotografia) — usa GET /dashboard e
// GET /clientes de verdade, ao contrário de Admin/Dashboard.jsx (que é
// específico de manutenção e usa o dataset mockado de Ordens de Serviço).
export default function DashboardVertical() {
  const { user } = useAuth()
  const { clientes } = useClientes()
  const [resumo, setResumo] = useState(null)
  const [erro, setErro] = useState('')
  const crmLiberado = temCrm(user)

  useEffect(() => {
    let cancelado = false
    api
      .get('/dashboard')
      .then((r) => {
        if (!cancelado) setResumo(r)
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconBuildingStore size={28} className="text-primary" />
        <div>
          <h1 className="text-h1 text-primary">{user?.nomeEmpresa ?? 'Dashboard'}</h1>
          <p className="text-label text-[#999]">Dados reais desta conta, direto da API</p>
        </div>
      </div>

      {erro && <p className="text-danger text-body">{erro}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard icon={IconUsers} valor={clientes.length} label="Clientes cadastrados" sublabel="Total ativo + inativo" cor="azul" />
        <KpiCard icon={IconCalendarEvent} valor={resumo?.agendamentos.total ?? '—'} label="Agendamentos" sublabel="Total" cor="verde" />
        {crmLiberado ? (
          <KpiCard
            icon={IconLayoutKanban}
            valor={resumo ? (resumo.crm ? resumo.crm.total - resumo.crm.porEtapa.concluido : '—') : '—'}
            label="Leads em andamento"
            sublabel={resumo?.crm?.paradosNoFollowUp ? `${resumo.crm.paradosNoFollowUp} parado(s) no follow-up` : 'No CRM de Leads'}
            cor="laranja"
          />
        ) : (
          <Link to="/admin/crm" className="block">
            <KpiCard icon={IconLock} valor="CRM" label="Funil de leads" sublabel="Disponível no plano Completo" cor="laranja" />
          </Link>
        )}
      </div>

      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface rounded-card shadow-card p-5">
            <h2 className="text-h2 text-[#1a1a1a] mb-4">Agendamentos por status</h2>
            {Object.keys(resumo.agendamentos.porStatus).length === 0 && <p className="text-body text-[#999]">Nenhum agendamento ainda.</p>}
            <div className="flex flex-col gap-2">
              {Object.entries(resumo.agendamentos.porStatus).map(([status, qtd]) => (
                <div key={status} className="flex items-center justify-between border-b border-muted-dark pb-2">
                  <span className="text-body">{ROTULOS_STATUS[status] ?? status}</span>
                  <span className="text-body font-semibold">{qtd}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-card shadow-card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-h2 text-[#1a1a1a]">Funil de leads</h2>
              <Link to="/admin/crm" className="text-label font-semibold text-primary hover:underline">
                {crmLiberado ? 'Abrir CRM →' : 'Conhecer →'}
              </Link>
            </div>
            {!crmLiberado ? (
              <div className="flex items-start gap-3 rounded-card bg-muted p-4">
                <IconLock size={20} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-body text-[#555]">
                  Acompanhe cada contato do primeiro "oi" até fechar a festa, com alerta de follow-up. Faz parte do plano Completo.
                </p>
              </div>
            ) : !resumo.crm ? (
              <p className="text-body text-[#999]">Funil indisponível no momento.</p>
            ) : resumo.crm.total === 0 ? (
              <p className="text-body text-[#999]">Nenhum lead ainda. Cadastre o primeiro no CRM de Leads.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {ETAPAS_CRM.map((etapa) => {
                  const qtd = resumo.crm.porEtapa[etapa.id] ?? 0
                  return (
                    <div key={etapa.id}>
                      <div className="flex items-center justify-between text-body mb-1">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${etapa.cor}`} /> {etapa.titulo}
                        </span>
                        <span className="font-semibold">{qtd}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${etapa.cor}`} style={{ width: `${(qtd / resumo.crm.total) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-label font-semibold text-emerald-700">
                    <IconTrophy size={14} /> {resumo.crm.ganhos} fechado(s)
                  </span>
                  {resumo.crm.paradosNoFollowUp > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-label font-semibold text-orange-700">
                      <IconAlertTriangle size={14} /> {resumo.crm.paradosNoFollowUp} sem resposta há mais de 3 dias
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-card shadow-card p-5">
        <h2 className="text-h2 text-[#1a1a1a] mb-2">Clientes recentes</h2>
        <div className="flex flex-col gap-2">
          {clientes.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-muted-dark pb-2">
              <span className="text-body">{c.nome}</span>
              <span className="text-label text-[#999]">{c.cidade}{c.cidade && c.estado ? '/' : ''}{c.estado}</span>
            </div>
          ))}
          {clientes.length === 0 && <p className="text-body text-[#999]">Nenhum cliente cadastrado ainda.</p>}
        </div>
      </div>
    </div>
  )
}
