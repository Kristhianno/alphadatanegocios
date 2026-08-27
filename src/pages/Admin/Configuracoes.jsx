import { useEffect, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { useBranding } from '../../hooks/useBranding'
import { useAuth } from '../../hooks/useAuth'
import { CHAVE_CONFIG, COR_PRIMARIA_PADRAO, aplicarCorPrimaria } from '../../utils/tema'

const PADRAO = { notifEmail: true, notifSMS: false, notifWhatsapp: true, corPrimaria: COR_PRIMARIA_PADRAO }

// Espelha `nomeMarketing` de server/src/config/planos.config.ts, só pra exibição aqui.
const NOME_MARKETING_PLANO = { startup: 'Starter', profissional: 'Pro', enterprise: 'Enterprise' }

function diasRestantesTrial(trialTerminaEm) {
  if (!trialTerminaEm) return null
  const diff = new Date(trialTerminaEm).getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function CardAssinatura() {
  const { user, abrirPortalAssinatura } = useAuth()
  const { showToast } = useToast()
  const [abrindo, setAbrindo] = useState(false)

  const dias = diasRestantesTrial(user?.trialTerminaEm)

  async function gerenciar() {
    setAbrindo(true)
    const resultado = await abrirPortalAssinatura()
    setAbrindo(false)
    if (!resultado.ok) {
      showToast(resultado.error, 'erro')
      return
    }
    window.location.href = resultado.url
  }

  return (
    <div className="bg-surface rounded-card shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div>
        <p className="text-label text-[#666] mb-1">Assinatura</p>
        <p className="text-body font-semibold text-[#1a1a1a]">
          Plano {NOME_MARKETING_PLANO[user?.plano] ?? user?.plano} · {user?.cicloCobranca === 'anual' ? 'cobrança anual' : 'cobrança mensal'}
        </p>
        <p className="text-body text-[#666] mt-0.5">{dias != null ? `${dias} dias de teste grátis restantes` : 'Assinatura ativa'}</p>
      </div>
      <button
        type="button"
        onClick={gerenciar}
        disabled={abrindo}
        className="rounded-btn px-4 py-2.5 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60 whitespace-nowrap"
      >
        {abrindo ? 'Abrindo...' : 'Mudar de plano / forma de pagamento'}
      </button>
    </div>
  )
}

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

      <CardAssinatura />

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
