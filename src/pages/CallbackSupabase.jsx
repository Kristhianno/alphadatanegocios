import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import AlphaDataLogo from '../components/AlphaDataLogo'

// Página de retorno do OAuth do Google (redirectTo em Login.jsx). O
// supabase-js já processa a URL sozinho ao carregar (detectSessionInUrl,
// ligado por padrão) e deixa a sessão pronta em getSession() — daqui só
// falta trocar essa sessão pelo JWT de sempre via useAuth.entrarComSupabase
// e mandar a pessoa pro mesmo lugar que um login normal mandaria.
export default function CallbackSupabase() {
  const { entrarComSupabase } = useAuth()
  const navigate = useNavigate()
  const [erro, setErro] = useState('')
  const jaProcessou = useRef(false)

  useEffect(() => {
    if (jaProcessou.current) return
    jaProcessou.current = true

    async function processar() {
      if (!supabase) {
        setErro('Login com Google não está configurado neste ambiente.')
        return
      }

      const { data, error } = await supabase.auth.getSession()
      const accessToken = data?.session?.access_token
      if (error || !accessToken) {
        setErro('Não foi possível concluir o login com Google. Tente novamente.')
        return
      }

      const resultado = await entrarComSupabase(accessToken)
      await supabase.auth.signOut() // encerra a sessão do Supabase — só o JWT local importa daqui pra frente
      if (!resultado.ok) {
        setErro(resultado.error)
        return
      }

      if (resultado.precisaEscolherNegocio) {
        navigate('/login', { replace: true, state: { sessaoPendente: resultado.sessao } })
        return
      }
      navigate(resultado.sessao.deveTrocarSenha ? '/trocar-senha' : `/${resultado.sessao.userType}/dashboard`, { replace: true })
    }

    processar()
  }, [entrarComSupabase, navigate])

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
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="text-label text-primary hover:underline"
              >
                Voltar para o login
              </button>
            </>
          ) : (
            <p className="text-body text-[#666]">Entrando com Google...</p>
          )}
        </div>
      </div>
    </div>
  )
}
