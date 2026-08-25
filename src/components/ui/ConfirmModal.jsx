import Modal from './Modal'

export default function ConfirmModal({ open, onClose, onConfirm, titulo = 'Confirmar ação', mensagem, corConfirmar = 'bg-primary hover:bg-primary-dark', textoConfirmar = 'Confirmar' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`rounded-btn px-4 py-2 text-body font-medium text-white ${corConfirmar}`}>
            {textoConfirmar}
          </button>
        </>
      }
    >
      <p className="text-body text-[#333]">{mensagem}</p>
    </Modal>
  )
}
