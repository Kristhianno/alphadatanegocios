import { useEffect, useState } from 'react'
import { IconDeviceMobileDown, IconShare2, IconSquarePlus, IconX } from '@tabler/icons-react'
import { abrirInstalacao, ehIOS, ouvirInstalacao, podeInstalarDireto, rodandoComoApp } from '../utils/appInstalado'

/**
 * "Instalar app": no Chrome/Edge/Android abre a instalação nativa; no
 * iPhone/iPad (que não tem essa janela) mostra o passo a passo do Safari.
 * Some quando o sistema já está rodando como app instalado.
 */
export default function BotaoInstalarApp({ className = '', classeTexto = '' }) {
  const [disponivel, setDisponivel] = useState(podeInstalarDireto)
  const [ajudaIOS, setAjudaIOS] = useState(false)
  const ios = ehIOS()

  useEffect(() => ouvirInstalacao(() => setDisponivel(podeInstalarDireto())), [])

  if (rodandoComoApp() || (!disponivel && !ios)) return null

  async function instalar() {
    if (podeInstalarDireto()) await abrirInstalacao()
    else setAjudaIOS(true)
  }

  return (
    <>
      <button type="button" onClick={instalar} className={className} title="Instalar app">
        <IconDeviceMobileDown size={17} /> <span className={classeTexto}>Instalar app</span>
      </button>

      {ajudaIOS && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={() => setAjudaIOS(false)}>
          <div className="w-full max-w-sm rounded-card bg-surface p-5 text-[#333] shadow-cardHover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-body font-semibold">Instalar o AlphaData no iPhone</h2>
              <button type="button" onClick={() => setAjudaIOS(false)} aria-label="Fechar" className="text-[#999] hover:text-[#333]">
                <IconX size={20} />
              </button>
            </div>
            <ol className="space-y-3 text-body">
              <li className="flex items-center gap-2">
                <span className="font-semibold">1.</span> No Safari, toque em <IconShare2 size={18} className="text-primary shrink-0" /> <b>Compartilhar</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold">2.</span> Escolha <IconSquarePlus size={18} className="text-primary shrink-0" /> <b>Adicionar à Tela de Início</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold">3.</span> Toque em <b>Adicionar</b>
              </li>
            </ol>
            <p className="mt-4 text-label text-[#999]">O ícone abre o sistema direto na tela de login.</p>
          </div>
        </div>
      )}
    </>
  )
}
