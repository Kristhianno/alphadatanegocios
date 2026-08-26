import { useMemo, useState } from 'react'
import { IconMapPin, IconUserCircle } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useToast } from '../../hooks/useToast'
import { STATUS_OS } from '../../data/mock'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import StarRating from '../../components/ui/StarRating'
import Checklist from '../../components/Checklist'
import Assinatura from '../../components/Assinatura'

const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function MinhasOrdens() {
  const { user } = useAuth()
  const { nomeExibido } = useBranding()
  const { ordens, updateOrdem } = useOrdensServico()
  const { showToast } = useToast()

  const [status, setStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [detalhesOrdem, setDetalhesOrdem] = useState(null)
  const [ordemAvaliando, setOrdemAvaliando] = useState(null)
  const [estrelas, setEstrelas] = useState(5)
  const [comentario, setComentario] = useState('')

  const minhasOrdens = useMemo(() => {
    return ordens.filter((o) => {
      if (o.clienteId !== user.clienteId) return false
      if (status && o.status !== status) return false
      if (dataInicio && o.dataAgendada < dataInicio) return false
      if (dataFim && o.dataAgendada > dataFim) return false
      return true
    })
  }, [ordens, user.clienteId, status, dataInicio, dataFim])

  function enviarAvaliacao(e) {
    e.preventDefault()
    updateOrdem(ordemAvaliando.id, { avaliacao: { estrelas, comentario } })
    showToast('Avaliação enviada com sucesso!')
    setOrdemAvaliando(null)
    setEstrelas(5)
    setComentario('')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Minhas Ordens {nomeExibido}</h1>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClasse}>Status</label>
          <select className={inputClasse} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className={labelClasse}>De</label><input type="date" className={inputClasse} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
        <div><label className={labelClasse}>Até</label><input type="date" className={inputClasse} value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {minhasOrdens.map((o) => (
          <div key={o.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <Badge>{o.id}</Badge>
              <Badge status={o.status} />
            </div>
            <p className="text-body font-semibold text-[#1a1a1a]">{o.tipoServico}</p>
            <p className="text-label text-[#666] mt-1">{o.dataAgendada} · {o.hora}</p>
            <p className="text-label text-[#666] flex items-center gap-1 mt-1"><IconMapPin size={13} /> {o.endereco}</p>
            {o.tecnicoNome && (
              <p className="text-label text-[#666] flex items-center gap-1 mt-1"><IconUserCircle size={14} /> {o.tecnicoNome}</p>
            )}
            {o.status === 'Em Andamento' && <p className="text-label text-warning font-medium mt-1">Técnico a caminho</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setDetalhesOrdem(o)} className="flex-1 rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
                Ver Detalhes
              </button>
              {o.status === 'Concluída' && (
                <button
                  onClick={() => { setOrdemAvaliando(o); setEstrelas(o.avaliacao?.estrelas ?? 5); setComentario(o.avaliacao?.comentario ?? '') }}
                  className="rounded-btn px-3 py-2 text-body font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                >
                  Avaliar
                </button>
              )}
            </div>
          </div>
        ))}
        {minhasOrdens.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhuma ordem encontrada.</p>}
      </div>

      <Modal open={!!detalhesOrdem} onClose={() => setDetalhesOrdem(null)} title={`Ordem ${detalhesOrdem?.id ?? ''}`} size="lg">
        {detalhesOrdem && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-body">
              <p><span className="text-[#666]">Serviço:</span> {detalhesOrdem.tipoServico}</p>
              <p><span className="text-[#666]">Técnico:</span> {detalhesOrdem.tecnicoNome ?? 'A definir'}</p>
              <p><span className="text-[#666]">Data/Hora:</span> {detalhesOrdem.dataAgendada} {detalhesOrdem.hora}</p>
              <p><span className="text-[#666]">Valor:</span> R$ {detalhesOrdem.valor}</p>
              <p className="md:col-span-2"><span className="text-[#666]">Endereço:</span> {detalhesOrdem.endereco}</p>
              {detalhesOrdem.status === 'Concluída' && <p><span className="text-[#666]">Concluída em:</span> {detalhesOrdem.dataAgendada}</p>}
            </div>

            <div>
              <p className="text-label text-[#666] mb-2">Fotos</p>
              <div className="flex flex-wrap gap-2">
                {['antes', 'durante', 'depois'].flatMap((etapa) =>
                  detalhesOrdem.fotos[etapa].map((foto, i) => (
                    <img key={`${etapa}-${i}`} src={foto} alt={etapa} className="w-20 h-20 object-cover rounded-card border border-muted-dark" />
                  ))
                )}
                {Object.values(detalhesOrdem.fotos).every((arr) => arr.length === 0) && <p className="text-body text-[#999]">Nenhuma foto registrada ainda.</p>}
              </div>
            </div>

            <div>
              <p className="text-label text-[#666] mb-2">Checklist</p>
              <Checklist itens={detalhesOrdem.checklist} onChange={() => {}} readOnly />
            </div>

            <Assinatura clienteNome={detalhesOrdem.clienteNome} valorSalvo={detalhesOrdem.assinatura} readOnly />

            {detalhesOrdem.status === 'Concluída' && (
              <button
                onClick={() => { setOrdemAvaliando(detalhesOrdem); setEstrelas(detalhesOrdem.avaliacao?.estrelas ?? 5); setComentario(detalhesOrdem.avaliacao?.comentario ?? ''); setDetalhesOrdem(null) }}
                className="self-start rounded-btn px-4 py-2 text-body font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              >
                Deixar Avaliação
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!ordemAvaliando} onClose={() => setOrdemAvaliando(null)} title={`Avaliar Ordem ${ordemAvaliando?.id ?? ''}`} size="sm">
        <form onSubmit={enviarAvaliacao} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Sua nota</label>
            <StarRating value={estrelas} size={26} onChange={setEstrelas} showNumber={false} />
          </div>
          <div>
            <label className={labelClasse}>Comentário</label>
            <textarea rows={3} className={`${inputClasse} w-full`} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Conte como foi o serviço..." />
          </div>
          <button type="submit" className="self-end rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Enviar Avaliação</button>
        </form>
      </Modal>
    </div>
  )
}
