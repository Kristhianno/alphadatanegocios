import { useEffect, useMemo, useState } from 'react'
import { IconFileTypePdf, IconFileSpreadsheet, IconTrash, IconDownload } from '@tabler/icons-react'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useClientes } from '../../hooks/useClientes'
import { usePrestadores } from '../../hooks/usePrestadores'
import { useToast } from '../../hooks/useToast'
import { usePDF } from '../../hooks/usePDF'
import { useBranding } from '../../hooks/useBranding'
import { STATUS_OS } from '../../data/mock'
import Badge from '../../components/ui/Badge'

const TIPOS_RELATORIO = ['Ordens de Serviço', 'Faturamento', 'Desempenho por Técnico', 'Satisfação do Cliente']
const RELATORIOS_KEY = 'alphadata_relatorios'
const FILTROS_INICIAIS = { dataInicio: '', dataFim: '', tipo: TIPOS_RELATORIO[0], tecnicoId: '', clienteId: '', status: '' }

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function carregarRelatorios() {
  try {
    return JSON.parse(localStorage.getItem(RELATORIOS_KEY)) ?? []
  } catch {
    return []
  }
}

export default function Relatorios() {
  const { ordens } = useOrdensServico()
  const { clientes } = useClientes()
  const { prestadores } = usePrestadores()
  const { showToast } = useToast()
  const { gerarPDF, gerarExcel } = usePDF()
  const { nomeExibido } = useBranding()

  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [relatorios, setRelatorios] = useState(carregarRelatorios)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    localStorage.setItem(RELATORIOS_KEY, JSON.stringify(relatorios))
  }, [relatorios])

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      if (filtros.dataInicio && o.dataAgendada < filtros.dataInicio) return false
      if (filtros.dataFim && o.dataAgendada > filtros.dataFim) return false
      if (filtros.tecnicoId && o.tecnicoId !== filtros.tecnicoId) return false
      if (filtros.clienteId && o.clienteId !== filtros.clienteId) return false
      if (filtros.status && o.status !== filtros.status) return false
      return true
    })
  }, [ordens, filtros])

  function montarRelatorio() {
    if (filtros.tipo === 'Ordens de Serviço') {
      const colunas = ['ID', 'Cliente', 'Técnico', 'Serviço', 'Data', 'Status', 'Valor']
      const linhas = ordensFiltradas.map((o) => [o.id, o.clienteNome, o.tecnicoNome ?? '—', o.tipoServico, o.dataAgendada, o.status, `R$ ${o.valor}`])
      const total = ordensFiltradas.reduce((s, o) => s + o.valor, 0)
      return {
        colunas, linhas,
        kpis: [{ label: 'Total de Ordens', valor: ordensFiltradas.length }, { label: 'Valor Total', valor: `R$ ${total}` }],
        dadosGrafico: STATUS_OS.map((s) => ({ label: s, valor: ordensFiltradas.filter((o) => o.status === s).length })),
      }
    }
    if (filtros.tipo === 'Faturamento') {
      const colunas = ['ID', 'Cliente', 'Serviço', 'Data', 'Valor']
      const linhas = ordensFiltradas.map((o) => [o.id, o.clienteNome, o.tipoServico, o.dataAgendada, `R$ ${o.valor}`])
      const total = ordensFiltradas.reduce((s, o) => s + o.valor, 0)
      const ticketMedio = ordensFiltradas.length ? (total / ordensFiltradas.length).toFixed(2) : 0
      return {
        colunas, linhas,
        kpis: [{ label: 'Faturamento Total', valor: `R$ ${total}` }, { label: 'Ticket Médio', valor: `R$ ${ticketMedio}` }],
        dadosGrafico: [{ label: 'Faturamento', valor: total }],
      }
    }
    if (filtros.tipo === 'Desempenho por Técnico') {
      const colunas = ['Técnico', 'Especialidade', 'Total OS', 'Concluídas', 'Avaliação']
      const linhas = prestadores.map((p) => {
        const doTecnico = ordensFiltradas.filter((o) => o.tecnicoId === p.id)
        return [p.nome, p.especialidade, doTecnico.length, doTecnico.filter((o) => o.status === 'Concluída').length, p.avaliacao]
      })
      return {
        colunas, linhas,
        kpis: [{ label: 'Técnicos Ativos', valor: prestadores.filter((p) => p.ativo).length }],
        dadosGrafico: prestadores.map((p) => ({ label: p.nome, valor: ordensFiltradas.filter((o) => o.tecnicoId === p.id).length })),
      }
    }
    // Satisfação do Cliente
    const avaliadas = ordensFiltradas.filter((o) => o.avaliacao)
    const colunas = ['ID', 'Cliente', 'Técnico', 'Estrelas', 'Comentário']
    const linhas = avaliadas.map((o) => [o.id, o.clienteNome, o.tecnicoNome ?? '—', o.avaliacao.estrelas, o.avaliacao.comentario])
    const media = avaliadas.length ? (avaliadas.reduce((s, o) => s + o.avaliacao.estrelas, 0) / avaliadas.length).toFixed(1) : 0
    return {
      colunas, linhas,
      kpis: [{ label: 'Avaliações Recebidas', valor: avaliadas.length }, { label: 'Média de Satisfação', valor: media }],
      dadosGrafico: [1, 2, 3, 4, 5].map((n) => ({ label: `${n} estrela(s)`, valor: avaliadas.filter((o) => o.avaliacao.estrelas === n).length })),
    }
  }

  function handleGerar() {
    const relatorio = montarRelatorio()
    const novo = {
      id: `REL-${Date.now()}`,
      nome: `${filtros.tipo} — ${new Date().toLocaleDateString('pt-BR')}`,
      tipo: filtros.tipo,
      dataGerado: new Date().toLocaleString('pt-BR'),
      filtrosTexto: [
        filtros.dataInicio && `De ${filtros.dataInicio}`,
        filtros.dataFim && `Até ${filtros.dataFim}`,
        filtros.status && `Status: ${filtros.status}`,
      ].filter(Boolean),
      ...relatorio,
    }
    setRelatorios((prev) => [novo, ...prev])
    setPreview(novo)
    showToast('Relatório gerado com sucesso!')
  }

  function baixarPDF(relatorio) {
    gerarPDF({ titulo: relatorio.tipo, filtrosTexto: relatorio.filtrosTexto, colunas: relatorio.colunas, linhas: relatorio.linhas, nomeArquivo: relatorio.id })
  }
  function baixarExcel(relatorio) {
    gerarExcel({ kpis: relatorio.kpis, colunas: relatorio.colunas, linhas: relatorio.linhas, dadosGrafico: relatorio.dadosGrafico, nomeArquivo: relatorio.id })
  }
  function deletarRelatorio(id) {
    setRelatorios((prev) => prev.filter((r) => r.id !== id))
    if (preview?.id === id) setPreview(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Relatórios {nomeExibido}</h1>

      <div className="bg-surface rounded-card shadow-card p-5">
        <h2 className="text-h2 text-[#1a1a1a] mb-4">Gerador de Relatórios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClasse}>Data inicial</label><input type="date" className={inputClasse} value={filtros.dataInicio} onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))} /></div>
              <div><label className={labelClasse}>Data final</label><input type="date" className={inputClasse} value={filtros.dataFim} onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))} /></div>
            </div>
            <div>
              <label className={labelClasse}>Tipo de Relatório</label>
              <select className={inputClasse} value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
                {TIPOS_RELATORIO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClasse}>Técnico (opcional)</label>
              <select className={inputClasse} value={filtros.tecnicoId} onChange={(e) => setFiltros((f) => ({ ...f, tecnicoId: e.target.value }))}>
                <option value="">Todos</option>
                {prestadores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Cliente (opcional)</label>
              <select className={inputClasse} value={filtros.clienteId} onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value }))}>
                <option value="">Todos</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Status (opcional)</label>
              <select className={inputClasse} value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
                <option value="">Todos</option>
                {STATUS_OS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-muted-dark">
          <button onClick={() => setFiltros(FILTROS_INICIAIS)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Limpar Filtros</button>
          <button onClick={handleGerar} className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Gerar Relatório</button>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <h2 className="text-h2 text-[#1a1a1a] mb-4">Relatórios Recentes</h2>
        {relatorios.length === 0 && <p className="text-body text-[#999]">Nenhum relatório gerado ainda.</p>}
        <div className="flex flex-col gap-2">
          {relatorios.map((r) => (
            <div key={r.id} className="flex items-center justify-between border border-muted-dark rounded-card p-3">
              <div className="flex items-center gap-3 min-w-0">
                <IconFileTypePdf size={22} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-body font-medium truncate">{r.nome}</p>
                  <p className="text-label text-[#999]">Gerado em {r.dataGerado}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setPreview(r)} className="p-1.5 rounded-btn hover:bg-muted text-primary" aria-label="Visualizar"><IconDownload size={18} /></button>
                <button onClick={() => deletarRelatorio(r.id)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Deletar"><IconTrash size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="bg-surface rounded-card shadow-card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-h2 text-[#1a1a1a]">Visualização Prévia — {preview.tipo}</h2>
            <div className="flex gap-2">
              <button onClick={() => baixarPDF(preview)} className="flex items-center gap-2 rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
                📥 Baixar PDF
              </button>
              <button onClick={() => baixarExcel(preview)} className="flex items-center gap-2 rounded-btn px-3 py-2 text-body font-medium bg-success text-white hover:bg-green-600">
                📊 Baixar Excel
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            {preview.kpis.map((k) => (
              <div key={k.label} className="bg-muted rounded-card px-4 py-2">
                <p className="text-label text-[#666]">{k.label}</p>
                <p className="text-body font-bold text-primary">{k.valor}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-card border border-muted-dark">
            <table className="w-full text-body">
              <thead className="bg-muted">
                <tr>{preview.colunas.map((c) => <th key={c} className="text-left px-4 py-2 text-label font-semibold text-[#666] whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.linhas.map((linha, i) => (
                  <tr key={i} className={`border-t border-muted-dark ${i % 2 ? 'bg-muted/50' : ''}`}>
                    {linha.map((valor, j) => <td key={j} className="px-4 py-2 whitespace-nowrap">{String(valor)}</td>)}
                  </tr>
                ))}
                {preview.linhas.length === 0 && (
                  <tr><td colSpan={preview.colunas.length} className="px-4 py-6 text-center text-[#999]">Nenhum dado para os filtros selecionados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
