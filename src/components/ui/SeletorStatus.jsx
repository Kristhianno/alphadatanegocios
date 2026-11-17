import Selecao from './Selecao'

/**
 * Status editável direto na tabela: aparece como uma etiqueta colorida
 * (igual ao Badge) e, ao clicar, abre a lista com a cor de cada status.
 */

const CORES = {
  azul: { etiqueta: 'bg-blue-50 text-blue-700 hover:bg-blue-100', ponto: 'bg-blue-500' },
  ciano: { etiqueta: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100', ponto: 'bg-cyan-500' },
  amarelo: { etiqueta: 'bg-amber-50 text-amber-700 hover:bg-amber-100', ponto: 'bg-amber-500' },
  laranja: { etiqueta: 'bg-orange-50 text-orange-700 hover:bg-orange-100', ponto: 'bg-orange-500' },
  roxo: { etiqueta: 'bg-violet-50 text-violet-700 hover:bg-violet-100', ponto: 'bg-violet-500' },
  verde: { etiqueta: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', ponto: 'bg-emerald-500' },
  cinza: { etiqueta: 'bg-gray-100 text-gray-600 hover:bg-gray-200', ponto: 'bg-gray-400' },
}

// Cor de cada status usado nas telas (agendamentos, contratos, produções de vídeo).
const COR_DO_STATUS = {
  Agendado: 'azul',
  Confirmado: 'ciano',
  'Em Andamento': 'laranja',
  Concluído: 'verde',
  Cancelado: 'cinza',
  'Pendente Assinatura': 'amarelo',
  Assinado: 'verde',
  Captação: 'azul',
  Edição: 'laranja',
  Revisão: 'roxo',
  Entregue: 'verde',
}

const corDe = (status) => CORES[COR_DO_STATUS[status] ?? 'cinza']

export default function SeletorStatus({ value, onChange, opcoes, 'aria-label': ariaLabel = 'Alterar status' }) {
  return (
    <Selecao
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      indicador={(status) => <span className={`h-2 w-2 shrink-0 rounded-full ${corDe(status).ponto}`} />}
      className={`w-max max-w-full rounded-full px-3 py-1 text-label font-medium whitespace-nowrap cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${corDe(value).etiqueta}`}
    >
      {opcoes.map((s) => <option key={s} value={s}>{s}</option>)}
    </Selecao>
  )
}
