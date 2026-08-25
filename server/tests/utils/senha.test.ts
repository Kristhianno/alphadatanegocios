import { describe, expect, it } from 'vitest'
import { hashSenha, verificarSenha } from '../../src/utils/senha.js'

describe('hashSenha / verificarSenha', () => {
  it('a senha correta verifica como válida', async () => {
    const hash = await hashSenha('minhaSenhaSegura123')
    await expect(verificarSenha('minhaSenhaSegura123', hash)).resolves.toBe(true)
  })

  it('senha errada é rejeitada', async () => {
    const hash = await hashSenha('minhaSenhaSegura123')
    await expect(verificarSenha('senhaErrada', hash)).resolves.toBe(false)
  })

  it('duas chamadas pra mesma senha geram hashes diferentes (salt aleatório)', async () => {
    const hash1 = await hashSenha('mesmaSenha')
    const hash2 = await hashSenha('mesmaSenha')
    expect(hash1).not.toBe(hash2)
    await expect(verificarSenha('mesmaSenha', hash1)).resolves.toBe(true)
    await expect(verificarSenha('mesmaSenha', hash2)).resolves.toBe(true)
  })

  it('um hash malformado (sem o separador salt:hash) é tratado como inválido, não lança', async () => {
    await expect(verificarSenha('qualquer', 'hash-sem-separador')).resolves.toBe(false)
  })
})
