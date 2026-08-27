import { useEffect, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { useBranding } from '../../hooks/useBranding'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { diasRestantesTrial } from '../../utils/trial'

const CHAVE_CONFIG = 'alphadata_config'
const PADRAO = { notifEmail: true, notifSMS: false, notifWhatsapp: true }

// Espelha `nomeMarketing` de server/src/config/planos.config.ts, só pra exibição aqui.
const NOME_MARKETING_PLANO = { startup: 'Starter', profissional: 'Pro', enterprise: 'Enterprise' }

/** Escolha de plano/ciclo sem cartão — só aparece durante o trial (ver CardAssinatura). */
function SeletorPlanoTrial({ planoInicial, cicloInicial, enviando, onCancelar, onConfirmar }) {
  const [planos, setPlanos] = useState(null)
  const [plano, setPlano] = useState(planoInicial)
  const [ciclo, setCiclo] = useState(cicloInicial)

  useEffect(() => {
    api.get('/config/planos-disponiveis', { comAuth: false }).then(setPlanos).catch(() => setPlanos([]))
  }, [])

  return (
    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-muted-dark">
      {!planos ? (
        <p className="text-label text-[#999]">Carregando planos...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {planos.map((p) => (
            <button
              key={p.plano}
              type="button"
              onClick={() => setPlano(p.plano)}
              className={`rounded-card border px-3 py-2 text-left transition-colors ${
                plano === p.plano ? 'border-primary bg-primary-light' : 'border-muted-dark hover:bg-muted'
              }`}
            >
              <span className="block text-body font-semibold text-[#1a1a1a]">{p.nomeMarketing}</span>
              <span className="block text-label text-[#999]">
                {((ciclo === 'anual' ? p.precoAnualMensalCentavos : p.precoMensalCentavos) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex rounded-btn bg-muted p-1">
        {[['mensal', 'Mensal'], ['anual', 'Anual']].map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setCiclo(valor)}
            className={`flex-1 rounded-btn py-1.5 text-label font-medium transition-colors ${ciclo === valor ? 'bg-surface shadow-card text-primary' : 'text-[#666]'}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className="flex-1 rounded-btn border border-muted-dark py-2 text-body text-[#666] hover:bg-muted">
          Cancelar
        </button>
        <button
          type="button"
          disabled={enviando || !planos}
          onClick={() => onConfirmar(plano, ciclo)}
          className="flex-1 rounded-btn bg-primary hover:bg-primary-dark text-white py-2 text-body font-semibold disabled:opacity-60"
        >
          {enviando ? 'Salvando...' : 'Salvar plano'}
        </button>
      </div>
    </div>
  )
}

function CardAssinatura() {
  const { user, abrirPortalAssinatura, trocarPlanoTrial } = useAuth()
  const { showToast } = useToast()
  const [abrindo, setAbrindo] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState(false)
  const [salvandoPlano, setSalvandoPlano] = useState(false)

  const dias = diasRestantesTrial(user?.trialTerminaEm)
  // Ainda dentro do trial local (sem Stripe) — trocar de plano aqui não pede cartão.
  // Fora do trial (expirado ou já é assinante pago), "mudar de plano" vira Stripe.
  const emTrial = dias != null

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

  async function confirmarTrocaPlano(plano, ciclo) {
    setSalvandoPlano(true)
    const resultado = await trocarPlanoTrial(plano, ciclo)
    setSalvandoPlano(false)
    if (!resultado.ok) {
      showToast(resultado.error, 'erro')
      return
    }
    showToast('Plano atualizado!')
    setEditandoPlano(false)
  }

  return (
    <div className="bg-surface rounded-card shadow-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-label text-[#666] mb-1">Assinatura</p>
          <p className="text-body font-semibold text-[#1a1a1a]">
            Plano {NOME_MARKETING_PLANO[user?.plano] ?? user?.plano} · {user?.cicloCobranca === 'anual' ? 'cobrança anual' : 'cobrança mensal'}
          </p>
          <p className="text-body text-[#666] mt-0.5">
            {emTrial ? `${dias} ${dias === 1 ? 'dia' : 'dias'} de teste grátis restantes — sem necessidade de cartão` : 'Assinatura ativa'}
          </p>
        </div>
        {emTrial ? (
          !editandoPlano && (
            <button
              type="button"
              onClick={() => setEditandoPlano(true)}
              className="rounded-btn px-4 py-2.5 text-body font-medium bg-primary text-white hover:bg-primary-dark whitespace-nowrap"
            >
              Mudar de plano
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={gerenciar}
            disabled={abrindo}
            className="rounded-btn px-4 py-2.5 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60 whitespace-nowrap"
          >
            {abrindo ? 'Abrindo...' : 'Mudar de plano / forma de pagamento'}
          </button>
        )}
      </div>

      {emTrial && editandoPlano && (
        <SeletorPlanoTrial
          planoInicial={user?.plano ?? 'startup'}
          cicloInicial={user?.cicloCobranca ?? 'mensal'}
          enviando={salvandoPlano}
          onCancelar={() => setEditandoPlano(false)}
          onConfirmar={confirmarTrocaPlano}
        />
      )}
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

        <button type="submit" className="self-end rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
          Salvar Configurações
        </button>
      </form>
    </div>
  )
}
