import { useEffect, useState } from 'react'
import { IconBuildingStore, IconCalendarEvent, IconClipboardList, IconUsers } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useClientes } from '../../hooks/useClientes'
import { api } from '../../services/api'
import KpiCard from '../../components/ui/KpiCard'

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
        <KpiCard icon={IconClipboardList} valor={resumo?.ordensServico.total ?? '—'} label="Ordens de Serviço" sublabel="Total" cor="laranja" />
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
            <h2 className="text-h2 text-[#1a1a1a] mb-4">Ordens de serviço por status</h2>
            {Object.keys(resumo.ordensServico.porStatus).length === 0 && <p className="text-body text-[#999]">Nenhuma ordem ainda.</p>}
            <div className="flex flex-col gap-2">
              {Object.entries(resumo.ordensServico.porStatus).map(([status, qtd]) => (
                <div key={status} className="flex items-center justify-between border-b border-muted-dark pb-2">
                  <span className="text-body">{ROTULOS_STATUS[status] ?? status}</span>
                  <span className="text-body font-semibold">{qtd}</span>
                </div>
              ))}
            </div>
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
