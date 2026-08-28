import { useState } from 'react'
import { IconPlus, IconLink, IconCopy, IconCheck, IconUserOff } from '@tabler/icons-react'
import { useEquipe } from '../../hooks/useEquipe'
import { useToast } from '../../hooks/useToast'
import { useBranding } from '../../hooks/useBranding'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const ROTULO_PAPEL = { gestor: 'Gestor', tecnico: 'Técnico' }

export default function Equipe() {
  const { equipe, carregando, desativarMembro, gerarConviteEquipe } = useEquipe()
  const { showToast } = useToast()
  const { nomeExibido } = useBranding()

  const [papelConvite, setPapelConvite] = useState('tecnico')
  const [gerandoConvite, setGerandoConvite] = useState(false)
  const [linkConvite, setLinkConvite] = useState(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [modalConvite, setModalConvite] = useState(false)
  const [paraDesativar, setParaDesativar] = useState(null)

  function abrirConvite() {
    setPapelConvite('tecnico')
    setLinkConvite(null)
    setLinkCopiado(false)
    setModalConvite(true)
  }

  async function handleGerarConvite() {
    setGerandoConvite(true)
    try {
      const link = await gerarConviteEquipe(papelConvite)
      setLinkConvite(link)
    } catch (erro) {
      showToast(erro.message ?? 'Falha ao gerar o convite.', 'erro')
    } finally {
      setGerandoConvite(false)
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkConvite)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch {
      showToast('Não foi possível copiar automaticamente — selecione e copie manualmente.', 'erro')
    }
  }

  async function handleDesativar() {
    try {
      await desativarMembro(paraDesativar.id)
      showToast('Acesso desativado.')
    } catch (erro) {
      showToast(erro.message ?? 'Falha ao desativar o acesso.', 'erro')
    } finally {
      setParaDesativar(null)
    }
  }

  const colunas = [
    { header: 'Nome', accessorKey: 'nome' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Papel', accessorKey: 'papel', cell: (info) => ROTULO_PAPEL[info.getValue()] ?? info.getValue() },
    { header: 'Status', accessorKey: 'status', cell: (info) => (
        <span className={`text-label font-medium rounded-full px-2.5 py-1 ${info.getValue() === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {info.getValue() === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      ) },
    { header: 'Ações', id: 'acoes', cell: (info) => (
        info.row.original.status === 'ativo' && (
          <button
            onClick={() => setParaDesativar(info.row.original)}
            className="flex items-center gap-1.5 text-danger hover:underline text-label font-medium"
          >
            <IconUserOff size={16} /> Desativar
          </button>
        )
      ) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Equipe {nomeExibido}</h1>
        <button onClick={abrirConvite} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Convidar Membro
        </button>
      </div>

      <p className="text-body text-[#666]">
        Convide gestores e técnicos para acessar a plataforma. Cada convite gera um link único — quem abrir preenche o
        próprio cadastro e já recebe login e senha temporária.
      </p>

      <div className="bg-surface rounded-card shadow-card p-5">
        {carregando ? (
          <p className="text-body text-[#999] text-center py-6">Carregando equipe...</p>
        ) : equipe.length === 0 ? (
          <p className="text-body text-[#999] text-center py-6">Nenhum membro de equipe cadastrado ainda.</p>
        ) : (
          <DataTable data={equipe} columns={colunas} />
        )}
      </div>

      <Modal open={modalConvite} onClose={() => setModalConvite(false)} title="Convidar Membro da Equipe" size="sm">
        <div className="flex flex-col gap-4">
          {!linkConvite ? (
            <>
              <div>
                <label className="text-label text-[#666] block mb-1">Papel</label>
                <select
                  className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                  value={papelConvite}
                  onChange={(e) => setPapelConvite(e.target.value)}
                >
                  <option value="tecnico">Técnico</option>
                  <option value="gestor">Gestor</option>
                </select>
              </div>
              <button
                onClick={handleGerarConvite}
                disabled={gerandoConvite}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2.5 text-body font-medium disabled:opacity-60"
              >
                <IconLink size={18} /> {gerandoConvite ? 'Gerando link...' : 'Gerar link de convite'}
              </button>
            </>
          ) : (
            <>
              <p className="text-body text-[#666]">
                Envie este link para o futuro {ROTULO_PAPEL[papelConvite]?.toLowerCase()}. Ele preenche o próprio
                cadastro e já recebe login e senha temporária. O link expira em 7 dias.
              </p>
              <div className="flex items-center gap-2">
                <input readOnly value={linkConvite} className="flex-1 rounded-input border border-muted-dark px-3 py-2 text-body bg-muted" onFocus={(e) => e.target.select()} />
                <button
                  onClick={copiarLink}
                  className="flex items-center gap-1.5 shrink-0 rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark"
                >
                  {linkCopiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  {linkCopiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={!!paraDesativar}
        onClose={() => setParaDesativar(null)}
        onConfirm={handleDesativar}
        titulo="Desativar acesso"
        mensagem={`Tem certeza que deseja desativar o acesso de ${paraDesativar?.nome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Desativar"
      />
    </div>
  )
}
