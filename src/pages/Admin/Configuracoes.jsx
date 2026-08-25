import { useEffect, useState } from 'react'
import { useToast } from '../../hooks/useToast'

const STORAGE_KEY = 'alphadata_config'
const PADRAO = { notifEmail: true, notifSMS: false, notifWhatsapp: true, nomeEmpresa: 'ALPHADATA', corPrimaria: '#0066CC' }

export default function Configuracoes() {
  const { showToast } = useToast()
  const [config, setConfig] = useState(() => {
    try {
      return { ...PADRAO, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }
    } catch {
      return PADRAO
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  function salvar(e) {
    e.preventDefault()
    showToast('Configurações salvas com sucesso!')
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-h1 text-primary">Configurações ALPHADATA</h1>

      <form onSubmit={salvar} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-5">
        <div>
          <label className="text-label text-[#666] block mb-1">Nome da Empresa</label>
          <input
            className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
            value={config.nomeEmpresa}
            onChange={(e) => setConfig((c) => ({ ...c, nomeEmpresa: e.target.value }))}
          />
        </div>

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
            <input type="color" value={config.corPrimaria} onChange={(e) => setConfig((c) => ({ ...c, corPrimaria: e.target.value }))} className="w-12 h-9 rounded-input border border-muted-dark" />
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
