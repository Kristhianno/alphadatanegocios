import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const AZUL_ALPHA = [0, 102, 204]

function timestamp() {
  return new Date().toLocaleString('pt-BR')
}

/**
 * Gera um PDF com cabeçalho ALPHADATA, filtros aplicados e uma tabela de dados.
 * colunas: string[] · linhas: array de arrays (mesma ordem das colunas)
 */
function gerarPDF({ titulo, filtrosTexto = [], colunas, linhas, nomeArquivo }) {
  const doc = new jsPDF()

  doc.setFillColor(...AZUL_ALPHA)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ALPHADATA', 14, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em ${timestamp()}`, 196, 14, { align: 'right' })

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 32)

  let y = 40
  if (filtrosTexto.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90, 90, 90)
    doc.text(`Filtros aplicados: ${filtrosTexto.join(' · ')}`, 14, y)
    y += 6
  }

  autoTable(doc, {
    startY: y + 2,
    head: [colunas],
    body: linhas,
    theme: 'striped',
    headStyles: { fillColor: AZUL_ALPHA, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, 105, 290, { align: 'center' })
    },
  })

  doc.save(`${nomeArquivo}.pdf`)
}

/**
 * Gera um Excel com 3 abas: Sumário (KPIs), Detalhes (tabela) e Gráficos (dados agregados).
 */
function gerarExcel({ kpis = [], colunas, linhas, dadosGrafico = [], nomeArquivo }) {
  const wb = XLSX.utils.book_new()

  const sumarioAoa = [['ALPHADATA - Sumário do Relatório'], [`Gerado em ${timestamp()}`], [], ['Indicador', 'Valor'], ...kpis.map((k) => [k.label, k.valor])]
  const wsSumario = XLSX.utils.aoa_to_sheet(sumarioAoa)
  wsSumario['!cols'] = [{ wch: 30 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSumario, 'Sumário')

  const detalhesAoa = [colunas, ...linhas]
  const wsDetalhes = XLSX.utils.aoa_to_sheet(detalhesAoa)
  wsDetalhes['!cols'] = colunas.map(() => ({ wch: 18 }))
  XLSX.utils.book_append_sheet(wb, wsDetalhes, 'Detalhes')

  const graficoAoa = [['Categoria', 'Valor'], ...dadosGrafico.map((d) => [d.label, d.valor])]
  const wsGraficos = XLSX.utils.aoa_to_sheet(graficoAoa)
  XLSX.utils.book_append_sheet(wb, wsGraficos, 'Gráficos')

  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`)
}

export function usePDF() {
  return { gerarPDF, gerarExcel }
}
