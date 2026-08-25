import { useNavigate, useParams } from 'react-router-dom'
import { IconTools } from '@tabler/icons-react'

export default function EmConstrucao() {
  const { modulo } = useParams()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
        <IconTools size={30} className="text-primary" />
      </div>
      <h1 className="text-h1 text-primary">{decodeURIComponent(modulo ?? '')}</h1>
      <p className="text-body text-[#666] max-w-md">
        Esse módulo já existe na API, com dados reais prontos pra usar — só a tela ainda não foi construída no frontend.
      </p>
      <button onClick={() => navigate(-1)} className="text-primary hover:underline text-body font-medium">
        Voltar
      </button>
    </div>
  )
}
