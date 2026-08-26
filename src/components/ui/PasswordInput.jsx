import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

export default function PasswordInput({ className = '', ...props }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <input {...props} type={visivel ? 'text' : 'password'} className={`${className} pr-10`} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
      >
        {visivel ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </div>
  )
}
