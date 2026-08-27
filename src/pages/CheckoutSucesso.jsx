import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AlphaDataLogo from '../components/AlphaDataLogo'

// Volta do Checkout hospedado do Stripe (success_url em BillingService).
// Confirma a assinatura na conta e libera o dashboard — mesmo raciocínio
// de CallbackSupabase.jsx (troca um retorno externo pelo estado interno
// de sempre antes de navegar).
export default function CheckoutSucesso() {
  const { isAuthenticated, confirmarCheckout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [erro, setErro] = useState('')
  const jaProcessou = useRef(false)

  useEffect(() => {
    if (jaProcessou.current) return
    jaProcessou.current = true

    async function processar() {
      const sessionId = searchParams.get('session_id')
      if (!sessionId) {
        setErro('Sessão de pagamento não encontrada.')
        return
      }
      const resultado = await confirmarCheckout(sessionId)
      if (!resultado.ok) {
        setErro(resultado.error)
        return
      }
      navigate('/admin/dashboard', { replace: true })
    }

    processar()
  }, [confirmarCheckout, navigate, searchParams])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <AlphaDataLogo variant="branco" />
        </div>
        <div className="bg-surface rounded-card shadow-cardHover p-6 sm:p-8 text-center">
          {erro ? (
            <>
              <p className="text-danger text-body mb-4">{erro}</p>
              <button type="button" onClick={() => navigate('/checkout', { replace: true })} className="text-label text-primary hover:underline">
                Tentar de novo
              </button>
            </>
          ) : (
            <p className="text-body text-[#666]">Confirmando sua assinatura...</p>
          )}
        </div>
      </div>
    </div>
  )
}
