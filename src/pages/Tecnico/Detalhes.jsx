import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconAlertTriangle, IconConfetti } from '@tabler/icons-react'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useClientes } from '../../hooks/useClientes'
import { useToast } from '../../hooks/useToast'
import { STATUS_OS, CONSENTIMENTO_ITENS } from '../../data/mock'
import Checklist from '../../components/Checklist'
import CameraCapture from '../../components/CameraCapture'
import Assinatura from '../../components/Assinatura'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const ABAS = ['Informações', 'Checklist', 'Fotos', 'Assinatura', 'Consentimento', 'Status & Ação']

export default function Detalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, updateOrdem } = useOrdensServico()
  const { clientes } = useClientes()
  const { showToast } = useToast()

  const ordem = getById(id)
  const [aba, setAba] = useState('Informações')
  const [modalTermos, setModalTermos] = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)

  if (!ordem) {
    return <p className="text-body text-[#999]">Ordem não encontrada.</p>
  }

  const cliente = clientes.find((c) => c.id === ordem.clienteId)

  const checklistCompleto = ordem.checklist.every((i) => i.concluido)
  const temFotoAntes = ordem.fotos.antes.length > 0
  const temFotoDepois = ordem.fotos.depois.length > 0
  const temAssinatura = !!ordem.assinatura
  const consentimentoCompleto = ordem.consentimento.every(Boolean)
  const podeFinalizar = checklistCompleto && temFotoAntes && temFotoDepois && temAssinatura && consentimentoCompleto

  const pendencias = [
    !checklistCompleto && 'Checklist: nem todos os itens foram marcados.',
    !(temFotoAntes && temFotoDepois) && 'Fotos: envie ao menos 1 foto de antes e 1 de depois.',
    !temAssinatura && 'Assinatura: o cliente ainda não assinou.',
    !consentimentoCompleto && 'Consentimento: nem todos os itens foram autorizados.',
  ].filter(Boolean)

  function finalizarOrdem() {
    updateOrdem(id, { status: 'Concluída' })
    setModalFinalizar(false)
    showToast('Ordem finalizada com sucesso!')
    navigate('/tecnico/minhas-ordens')
  }

  const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Ordem de Serviço #{ordem.id}</h1>
        <Badge status={ordem.status} />
      </div>

      <div className="flex gap-1 overflow-x-auto bg-surface rounded-card shadow-card p-1.5">
        {ABAS.map((nome) => (
          <button
            key={nome}
            onClick={() => setAba(nome)}
            className={`shrink-0 rounded-btn px-4 py-2 text-body font-medium transition-colors ${
              aba === nome ? 'bg-primary text-white' : 'text-[#666] hover:bg-primary-light'
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        {aba === 'Informações' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-body">
            <p><span className="text-[#666]">ID da OS:</span> <strong>{ordem.id}</strong></p>
            <p><span className="text-[#666]">Prioridade:</span> {ordem.prioridade}</p>
            <p><span className="text-[#666]">Cliente:</span> {ordem.clienteNome}</p>
            <p><span className="text-[#666]">Telefone:</span> {cliente?.telefone ?? '—'}</p>
            <p><span className="text-[#666]">Email:</span> {cliente?.email ?? '—'}</p>
            <p><span className="text-[#666]">Data/Hora agendada:</span> {ordem.dataAgendada} {ordem.hora}</p>
            <p className="md:col-span-2"><span className="text-[#666]">Endereço:</span> {ordem.endereco}</p>
            <p><span className="text-[#666]">Tipo de Serviço:</span> {ordem.tipoServico}</p>
            <p><span className="text-[#666]">Valor Estimado:</span> R$ {ordem.valor}</p>
            <div className="md:col-span-2">
              <p className="text-[#666] mb-1">Descrição do Serviço:</p>
              <p className="bg-muted rounded-card p-3">{ordem.descricao || 'Sem descrição.'}</p>
            </div>
          </div>
        )}

        {aba === 'Checklist' && (
          <div>
            <h2 className="text-h2 text-[#1a1a1a] mb-4">Checklist do Serviço</h2>
            <Checklist itens={ordem.checklist} onChange={(itens) => updateOrdem(id, { checklist: itens })} />
          </div>
        )}

        {aba === 'Fotos' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-h2 text-[#1a1a1a]">Fotos da Execução</h2>
            <CameraCapture titulo="Antes" fotos={ordem.fotos.antes} onChange={(fotos) => updateOrdem(id, { fotos: { ...ordem.fotos, antes: fotos } })} />
            <CameraCapture titulo="Durante" fotos={ordem.fotos.durante} onChange={(fotos) => updateOrdem(id, { fotos: { ...ordem.fotos, durante: fotos } })} />
            <CameraCapture titulo="Depois" fotos={ordem.fotos.depois} onChange={(fotos) => updateOrdem(id, { fotos: { ...ordem.fotos, depois: fotos } })} />
          </div>
        )}

        {aba === 'Assinatura' && (
          <div>
            <h2 className="text-h2 text-[#1a1a1a] mb-4">Assinatura do Cliente</h2>
            <Assinatura clienteNome={ordem.clienteNome} valorSalvo={ordem.assinatura} onSave={(dataUrl) => { updateOrdem(id, { assinatura: dataUrl }); showToast('Assinatura salva com sucesso!') }} />
          </div>
        )}

        {aba === 'Consentimento' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-[#1a1a1a]">Consentimento e Autorização</h2>
            <div className="flex flex-col gap-3">
              {CONSENTIMENTO_ITENS.map((texto, index) => (
                <label key={index} className="flex items-start gap-3 text-body">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={ordem.consentimento[index]}
                    onChange={(e) => {
                      const novo = [...ordem.consentimento]
                      novo[index] = e.target.checked
                      updateOrdem(id, { consentimento: novo })
                    }}
                  />
                  {texto}
                </label>
              ))}
            </div>
            <button onClick={() => setModalTermos(true)} className="text-primary hover:underline text-body self-start">Ver termos de serviço</button>
            <button
              disabled={!consentimentoCompleto}
              onClick={() => showToast('Consentimento confirmado!')}
              className="self-start rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar Consentimento
            </button>
          </div>
        )}

        {aba === 'Status & Ação' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-h2 text-[#1a1a1a]">Status da Ordem</h2>
            <div>
              <label className="text-label text-[#666] block mb-1">Status</label>
              <select className={inputClasse} value={ordem.status} onChange={(e) => updateOrdem(id, { status: e.target.value })}>
                {STATUS_OS.filter((s) => s !== 'Cancelada').map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="mt-2"><Badge status={ordem.status} /></div>
            </div>

            {pendencias.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-card p-4 flex flex-col gap-1.5">
                <p className="flex items-center gap-2 text-danger font-semibold text-body"><IconAlertTriangle size={18} /> Pendências para finalizar:</p>
                {pendencias.map((p) => <p key={p} className="text-body text-danger">• {p}</p>)}
              </div>
            )}

            <button
              disabled={!podeFinalizar}
              onClick={() => setModalFinalizar(true)}
              className="flex items-center justify-center gap-2 rounded-card px-6 py-4 text-h2 text-white bg-success hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconConfetti size={24} /> FINALIZAR ORDEM
            </button>
          </div>
        )}
      </div>

      <Modal open={modalTermos} onClose={() => setModalTermos(false)} title="Termos de Serviço ALPHADATA" size="md">
        <p className="text-body text-[#333] whitespace-pre-line">
          Ao autorizar este serviço, o cliente concorda com a execução do trabalho descrito nesta ordem, incluindo o
          registro fotográfico da execução e a coleta de assinatura digital como comprovante de conclusão.
          A ALPHADATA garante a qualidade do serviço prestado conforme os padrões técnicos vigentes e se
          compromete a manter a confidencialidade dos dados do cliente, em conformidade com a LGPD.
        </p>
      </Modal>

      <ConfirmModal
        open={modalFinalizar}
        onClose={() => setModalFinalizar(false)}
        onConfirm={finalizarOrdem}
        titulo="Finalizar Ordem"
        mensagem="Tem certeza? Esta ação não pode ser desfeita."
        corConfirmar="bg-success hover:bg-green-600"
        textoConfirmar="Sim, finalizar"
      />
    </div>
  )
}
