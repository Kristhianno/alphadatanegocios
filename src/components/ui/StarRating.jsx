import { IconStarFilled, IconStar } from '@tabler/icons-react'

export default function StarRating({ value = 0, size = 16, onChange, showNumber = true }) {
  const estrelas = [1, 2, 3, 4, 5]
  return (
    <span className="inline-flex items-center gap-0.5">
      {estrelas.map((n) => {
        const preenchida = n <= Math.round(value)
        const Icon = preenchida ? IconStarFilled : IconStar
        return (
          <Icon
            key={n}
            size={size}
            className={`${preenchida ? 'text-yellow-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer' : ''}`}
            onClick={() => onChange?.(n)}
          />
        )
      })}
      {showNumber && <span className="text-label text-[#666] ml-1">{value?.toFixed ? value.toFixed(1) : value}</span>}
    </span>
  )
}
