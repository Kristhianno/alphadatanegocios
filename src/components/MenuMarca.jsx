/**
 * Menu suspenso (fundo branco, abre abaixo) usado pela logo e pelo
 * logotipo da marca. `opcoes`: [{ rotulo, icone: Icon, onClick, perigo? }].
 */
export default function MenuMarca({ aberto, onFechar, opcoes, titulo }) {
  if (!aberto) return null
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onFechar} />
      <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-card border border-muted-dark bg-white text-[#333] shadow-cardHover">
        {titulo && <p className="border-b border-muted-dark px-4 py-2.5 text-label leading-snug text-[#777]">{titulo}</p>}
        {opcoes.map(({ rotulo, icone: Icone, onClick, perigo }) => (
          <button
            key={rotulo}
            type="button"
            onClick={() => {
              onFechar()
              onClick()
            }}
            className={`flex w-full items-center gap-2 border-t border-muted-dark px-4 py-2.5 text-left text-body first-of-type:border-t-0 ${
              perigo ? 'text-danger hover:bg-red-50' : 'hover:bg-primary-light'
            }`}
          >
            <Icone size={18} className="shrink-0" /> {rotulo}
          </button>
        ))}
      </div>
    </>
  )
}
