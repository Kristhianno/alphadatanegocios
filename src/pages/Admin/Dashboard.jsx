import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { IconListCheck, IconCurrencyReal, IconUsers, IconTarget, IconFileTypePdf } from '@tabler/icons-react'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { usePrestadores } from '../../hooks/usePrestadores'
import { STATUS_OS, STATUS_CORES, RECEITA_MENSAL } from '../../data/mock'
import KpiCard from '../../components/ui/KpiCard'
import Badge from '../../components/ui/Badge'
import DataTable from '../../components/ui/DataTable'

export default function Dashboard() {
  const { ordens } = useOrdensServico()
  const { prestadores } = usePrestadores()
  const navigate = useNavigate()

  const mesAtual = new Date().getMonth()
  const ordensDoMes = useMemo(() => ordens.filter((o) => new Date(o.dataAgendada).getMonth() === mesAtual), [ordens, mesAtual])

  const receitaEstimada = ordensDoMes.reduce((soma, o) => soma + o.valor, 0)
  const tecnicosAtivos = prestadores.filter((p) => p.ativo).length
  const concluidas = ordens.filter((o) => o.status === 'Concluída').length
  const taxaConclusao = ordens.length ? Math.round((concluidas / ordens.length) * 100) : 0

  const dadosPizza = STATUS_OS.map((status) => ({
    name: status,
    value: ordens.filter((o) => o.status === status).length,
    hex: STATUS_CORES[status].hex,
  })).filter((d) => d.value > 0)

  const ultimasOrdens = [...ordens]
    .sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm))
    .slice(0, 10)

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Técnico', accessorKey: 'tecnicoNome', cell: (info) => info.getValue() ?? '—' },
    { header: 'Serviço', accessorKey: 'tipoServico' },
    { header: 'Data', accessorKey: 'dataAgendada' },
    { header: 'Status', accessorKey: 'status', cell: (info) => <Badge status={info.getValue()} /> },
    { header: 'Valor', accessorKey: 'valor', cell: (info) => `R$ ${info.getValue()}` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Dashboard ALPHADATA</h1>
        <button
          onClick={() => navigate('/admin/relatorios')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium"
        >
          <IconFileTypePdf size={18} /> Novo Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={IconListCheck} valor={ordensDoMes.length} label="Total de OS (mês)" sublabel="Ordens este mês" cor="azul" />
        <KpiCard icon={IconCurrencyReal} valor={`R$ ${receitaEstimada.toLocaleString('pt-BR')}`} label="Receita Estimada" sublabel="Faturamento estimado" cor="verde" />
        <KpiCard icon={IconUsers} valor={tecnicosAtivos} label="Técnicos Ativos" sublabel="Em atividade" cor="laranja" />
        <KpiCard icon={IconTarget} valor={`${taxaConclusao}%`} label="Taxa de Conclusão" sublabel="Ordens finalizadas" cor="roxo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card shadow-card p-5">
          <h2 className="text-h2 text-[#1a1a1a] mb-4">Ordens por Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={dadosPizza} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                {dadosPizza.map((d) => (
                  <Cell key={d.name} fill={d.hex} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-card shadow-card p-5">
          <h2 className="text-h2 text-[#1a1a1a] mb-4">Receita Mensal</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={RECEITA_MENSAL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} />
              <Line type="monotone" dataKey="valor" stroke="#0066CC" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <h2 className="text-h2 text-[#1a1a1a] mb-4">10 Últimas Ordens</h2>
        <DataTable data={ultimasOrdens} columns={colunas} pageSize={10} />
        <button onClick={() => navigate('/admin/ordens')} className="text-primary hover:underline text-body font-medium mt-3">
          Ver todas as ordens →
        </button>
      </div>
    </div>
  )
}
