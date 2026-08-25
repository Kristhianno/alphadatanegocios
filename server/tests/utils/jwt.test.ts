import { describe, expect, it } from 'vitest'
import { assinarToken, verificarToken } from '../../src/utils/jwt.js'
import { ErroNaoAutorizado } from '../../src/errors/AppError.js'

const PAYLOAD = { sub: 'usuario-1', contaId: 'conta-1', papel: 'admin' as const, email: 'a@b.com', clienteId: null }

describe('assinarToken / verificarToken', () => {
  it('roundtrip: o que foi assinado é o que volta na verificação', async () => {
    const token = await assinarToken(PAYLOAD)
    const payload = await verificarToken(token)
    expect(payload).toEqual(PAYLOAD)
  })

  it('preserva clienteId quando informado', async () => {
    const token = await assinarToken({ ...PAYLOAD, papel: 'cliente', clienteId: 'cliente-9' })
    const payload = await verificarToken(token)
    expect(payload.clienteId).toBe('cliente-9')
  })

  it('rejeita um token adulterado', async () => {
    const token = await assinarToken(PAYLOAD)
    const adulterado = token.slice(0, -2) + (token.at(-2) === 'a' ? 'b' : 'a') + token.at(-1)
    await expect(verificarToken(adulterado)).rejects.toBeInstanceOf(ErroNaoAutorizado)
  })

  it('rejeita uma string qualquer que não é um JWT', async () => {
    await expect(verificarToken('isso-nao-e-um-token')).rejects.toBeInstanceOf(ErroNaoAutorizado)
  })
})
