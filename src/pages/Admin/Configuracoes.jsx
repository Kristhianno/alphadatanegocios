import { useEffect, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { useBranding } from '../../hooks/useBranding'
import { CHAVE_CONFIG, COR_PRIMARIA_PADRAO, aplicarCorPrimaria } from '../../utils/tema'

const PADRAO = { notifEmail: true, notifSMS: false, notifWhatsapp: true, corPrimaria: COR_PRIMARIA_PADRAO }

export default function Configuracoes() {
  const { showToast } = useToast()
  const { nomeExibido } = useBranding()

  const [config, setConfig] = useState(() => {
    try {
      return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE_CONFIG)) }
    } catch {
      return PADRAO
    }
  })

  useEffect(() => {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config))
  }, [config])

  function selecionarCor(cor) {
    aplicarCorPrimaria(cor)
    setConfig((c) => ({ ...c, corPrimaria: cor }))
  }

  function salvar(e) {
    e.preventDefault()
    showToast('Configurações salvas com sucesso!')
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-h1 text-primary">Configurações {nomeExibido}</h1>

      <form onSubmit={salvar} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-5">
        <div>
          <p className="text-label text-[#666] mb-2">Notificações do sistema</p>
          <div className="flex flex-col gap-2">
            {[
              ['notifEmail', 'Email'],
              ['notifSMS', 'SMS'],
              ['notifWhatsapp', 'WhatsApp'],
            ].map(([campo, label]) => (
              <label key={campo} className="flex items-center gap-2 text-body">
                <input type="checkbox" checked={config[campo]} onChange={(e) => setConfig((c) => ({ ...c, [campo]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-label text-[#666] block mb-1">Cor Primária</label>
          <div className="flex items-center gap-3">
            <input type="color" value={config.corPrimaria} onChange={(e) => selecionarCor(e.target.value)} className="w-12 h-9 rounded-input border border-muted-dark" />
            <span className="text-body text-[#666]">{config.corPrimaria}</span>
          </div>
        </div>

        <button type="submit" className="self-end rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
          Salvar Configurações
        </button>
      </form>
    </div>
  )
}
