import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { IconArrowRight, IconLoader2 } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import AlphaDataLogo from '../components/AlphaDataLogo'

function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Tela obrigatória entre o onboarding e o dashboard pra quem veio de um
// CTA de plano na landing (user.assinaturaPendente — ver Layout.jsx e
// Login.jsx/irParaDashboard). Deixa trocar plano/ciclo antes de ir pro
// Stripe, mas sempre parte do que foi escolhido na landing.
export default function Checkout() {
  const { user, isAuthenticated, iniciarCheckout, logout } = useAuth()
  const navigate = useNavigate()

  const [planos, setPlanos] = useState(null)
  const [plano, setPlano] = useState(user?.plano ?? 'startup')
  const [ciclo, setCiclo] = useState(user?.cicloCobranca ?? 'mensal')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/config/planos-disponiveis', { comAuth: false })
      .then(setPlanos)
      .catch(() => setErro('Não foi possível carregar os planos. Recarregue a página.'))
  }, [])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  async function continuar() {
    setErro('')
    setEnviando(true)
    const resultado = await iniciarCheckout(plano, ciclo)
    if (!resultado.ok) {
      setEnviando(false)
      setErro(resultado.error)
      return
    }
    window.location.href = resultado.url
  }

  const configEscolhido = planos?.find((p) => p.plano === plano)
  const preco = configEscolhido ? (ciclo === 'anual' ? configEscolhido.precoAnualMensalCentavos : configEscolhido.precoMensalCentavos) : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <AlphaDataLogo variant="branco" />
        </div>
        <div className="bg-surface rounded-card shadow-cardHover p-6 sm:p-8">
          <p className="text-h2 text-[#1a1a1a] mb-1">Só falta ativar seu teste grátis</p>
          <p className="text-body text-[#666] mb-6">7 dias grátis, cancele quando quiser. Cobramos só depois que o teste terminar.</p>

          {!planos && !erro && (
            <div className="flex justify-center py-8">
              <IconLoader2 size={28} className="animate-spin text-primary" />
            </div>
          )}

          {planos && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {planos.map((p) => (
                  <button
                    key={p.plano}
                    type="button"
                    onClick={() => setPlano(p.plano)}
                    className={`rounded-card border px-4 py-3 text-left transition-colors ${
                      plano === p.plano ? 'border-primary bg-primary-light' : 'border-muted-dark hover:bg-muted'
                    }`}
                  >
                    <span className="block text-body font-semibold text-[#1a1a1a]">{p.nomeMarketing}</span>
                    <span className="block text-label text-[#999]">{formatarPreco(p.precoMensalCentavos)}/mês</span>
                  </button>
                ))}
              </div>

              <div className="flex rounded-btn bg-muted p-1 mb-5">
                {[
                  ['mensal', 'Mensal'],
                  ['anual', 'Anual'],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setCiclo(valor)}
                    className={`flex-1 rounded-btn py-2 text-body font-medium transition-colors ${
                      ciclo === valor ? 'bg-surface shadow-card text-primary' : 'text-[#666]'
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              {preco != null && (
                <div className="rounded-card bg-primary-light px-4 py-3 mb-5">
                  <p className="text-body text-[#1a1a1a]">
                    <span className="font-semibold">{formatarPreco(preco)}/mês</span>
                    {ciclo === 'anual' && <span className="text-label text-[#666]"> — cobrado uma vez por ano</span>}
                  </p>
                  <p className="text-label text-[#666] mt-0.5">7 dias grátis, depois cobrança automática. Cancele quando quiser.</p>
                </div>
              )}
            </>
          )}

          {erro && <p className="text-danger text-label mb-4">{erro}</p>}

          <button
            type="button"
            onClick={continuar}
            disabled={enviando || !planos}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold transition-colors disabled:opacity-60"
          >
            {enviando ? 'Abrindo pagamento...' : 'Continuar para pagamento'}
            {!enviando && <IconArrowRight size={18} />}
          </button>

          <button
            type="button"
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            className="w-full text-center text-label text-[#999] hover:underline mt-4"
          >
            Sair e continuar depois
          </button>
        </div>
      </div>
    </div>
  )
}
