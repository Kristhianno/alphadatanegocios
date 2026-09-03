import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { ManutencaoService } from '../../../src/services/tipo-especifico/ManutencaoService.js'
import { ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>, papel: 'admin' | 'gestor' | 'tecnico' | 'cliente', clienteId: string | null = null) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Manutenção X', tipo_negocio: 'manutencao', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: `${papel}@x.com`, senha_hash: 'h', nome: papel, papel, cliente_id: clienteId, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userId: usuario['id'] as string }
}

describe('ManutencaoService.criarChamado', () => {
  it('equipe interna sem informar clienteId é rejeitada (precisa dizer em nome de quem está abrindo)', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'admin')
    const service = new ManutencaoService(paraTipado(cliente))

    await expect(service.criarChamado(userId, 'corretiva', 'Torneira vazando')).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('um usuário papel "cliente" sem clienteId vinculado é rejeitado', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', null)
    const service = new ManutencaoService(paraTipado(cliente))

    await expect(service.criarChamado(userId, 'corretiva', 'Torneira vazando')).rejects.toBeInstanceOf(ErroProibido)
  })

  it('equipe interna pode abrir chamado em nome de um cliente da mesma conta', async () => {
    const cliente = criarClienteFake()
    const { userId, contaId } = prepararUsuario(cliente, 'admin')
    const clienteFinal = cliente.semear('clientes', [{ conta_id: contaId, nome: 'Maria', ativo: true, metadados: {} }])[0]!
    const service = new ManutencaoService(paraTipado(cliente))

    const chamado = await service.criarChamado(userId, 'corretiva', 'Vazamento na cozinha', clienteFinal['id'] as string)
    expect(chamado.cliente_id).toBe(clienteFinal['id'])
    expect(chamado.conta_id).toBe(contaId)
  })

  it('equipe interna não consegue abrir chamado em nome de um cliente de outra conta', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'admin')
    const outraConta = cliente.semear('contas', [{ nome_empresa: 'Outra Conta', tipo_negocio: 'manutencao', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
    const clienteDeOutraConta = cliente.semear('clientes', [{ conta_id: outraConta['id'], nome: 'Cliente Alheio', ativo: true, metadados: {} }])[0]!
    const service = new ManutencaoService(paraTipado(cliente))

    await expect(
      service.criarChamado(userId, 'corretiva', 'Vazamento na cozinha', clienteDeOutraConta['id'] as string)
    ).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })

  it('um login "cliente" não consegue abrir chamado em nome de outro cliente forçando o parâmetro', async () => {
    const cliente = criarClienteFake()
    const meuClienteId = randomUUID()
    const { userId, contaId } = prepararUsuario(cliente, 'cliente', meuClienteId)
    const outroCliente = cliente.semear('clientes', [{ conta_id: contaId, nome: 'Outro Cliente', ativo: true, metadados: {} }])[0]!
    const service = new ManutencaoService(paraTipado(cliente))

    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira vazando', outroCliente['id'] as string)
    expect(chamado.cliente_id).toBe(meuClienteId)
  })

  it('exige ao menos 5 caracteres na descrição', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', randomUUID())
    const service = new ManutencaoService(paraTipado(cliente))

    await expect(service.criarChamado(userId, 'corretiva', 'Oi')).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('categoria "emergencia" gera prioridade "urgente" automaticamente; as demais são "normal"', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', randomUUID())
    const service = new ManutencaoService(paraTipado(cliente))

    const emergencia = await service.criarChamado(userId, 'emergencia', 'Vazamento grande no banheiro')
    expect(emergencia.prioridade).toBe('urgente')

    const corretiva = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')
    expect(corretiva.prioridade).toBe('normal')
  })
})

describe('ManutencaoService.gerarOrcamento', () => {
  it('sem tipo_servico_id vinculado, usa 2h como estimativa padrão × R$80/h', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', randomUUID())
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')

    const orcamento = await service.gerarOrcamento(chamado.id)
    expect(Number(orcamento.valor_mao_obra)).toBe(160)
    expect(orcamento.status).toBe('pendente')
    expect(orcamento.gerado_automaticamente).toBe(true)
  })

  it('marca o chamado como "orcamento_enviado"', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', randomUUID())
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')
    await service.gerarOrcamento(chamado.id)

    const chamadoAtualizado = cliente.linhasDe('chamados_manutencao').find((c) => c['id'] === chamado.id)
    expect(chamadoAtualizado?.['status']).toBe('orcamento_enviado')
  })
})

describe('ManutencaoService.aceitarOrcamento', () => {
  it('rejeita quando o chamado não pertence ao clienteId informado', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', randomUUID())
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')
    await service.gerarOrcamento(chamado.id)

    await expect(service.aceitarOrcamento(chamado.id, randomUUID())).rejects.toBeInstanceOf(ErroProibido)
  })

  it('aceita quando o clienteId bate com o dono do chamado', async () => {
    const cliente = criarClienteFake()
    const clienteId = randomUUID()
    const { userId } = prepararUsuario(cliente, 'cliente', clienteId)
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')
    await service.gerarOrcamento(chamado.id)

    const orcamento = await service.aceitarOrcamento(chamado.id, clienteId)
    expect(orcamento.status).toBe('aceito')
  })
})

describe('ManutencaoService.buscarOrcamentoPendente', () => {
  it('rejeita quando o chamado não pertence ao clienteId informado', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente, 'cliente', randomUUID())
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')
    await service.gerarOrcamento(chamado.id)

    await expect(service.buscarOrcamentoPendente(chamado.id, randomUUID())).rejects.toBeInstanceOf(ErroProibido)
  })

  it('retorna null quando não há orçamento pendente', async () => {
    const cliente = criarClienteFake()
    const clienteId = randomUUID()
    const { userId } = prepararUsuario(cliente, 'cliente', clienteId)
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')

    expect(await service.buscarOrcamentoPendente(chamado.id, clienteId)).toBeNull()
  })

  it('retorna o orçamento pendente quando o chamado pertence ao cliente', async () => {
    const cliente = criarClienteFake()
    const clienteId = randomUUID()
    const { userId } = prepararUsuario(cliente, 'cliente', clienteId)
    const service = new ManutencaoService(paraTipado(cliente))
    const chamado = await service.criarChamado(userId, 'corretiva', 'Torneira pingando')
    const gerado = await service.gerarOrcamento(chamado.id)

    const orcamento = await service.buscarOrcamentoPendente(chamado.id, clienteId)
    expect(orcamento?.id).toBe(gerado.id)
  })
})

describe('ManutencaoService.registrarMaterialsUsados', () => {
  it('rejeita quando o estoque disponível é menor que a quantidade pedida', async () => {
    const cliente = criarClienteFake()
    const material = cliente.semear('materiais_manutencao', [{ nome: 'Cano PVC', custo_unitario: 10, estoque_atual: 2 }])[0]!
    const service = new ManutencaoService(paraTipado(cliente))

    await expect(service.registrarMaterialsUsados(randomUUID(), [{ materialId: material['id'], quantidade: 5 }])).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('trava o custo_unitario_no_momento e decrementa o estoque', async () => {
    const cliente = criarClienteFake()
    const material = cliente.semear('materiais_manutencao', [{ nome: 'Cano PVC', custo_unitario: 10, estoque_atual: 20 }])[0]!
    const service = new ManutencaoService(paraTipado(cliente))
    const ordemId = randomUUID()

    await service.registrarMaterialsUsados(ordemId, [{ materialId: material['id'], quantidade: 3 }])

    const usados = cliente.linhasDe('materiais_utilizados')
    expect(usados).toHaveLength(1)
    expect(usados[0]?.['custo_unitario_no_momento']).toBe(10)

    const materialAtualizado = cliente.linhasDe('materiais_manutencao').find((m) => m['id'] === material['id'])
    expect(materialAtualizado?.['estoque_atual']).toBe(17)
  })
})
