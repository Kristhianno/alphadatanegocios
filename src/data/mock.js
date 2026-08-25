// Gerador determinístico de dados fictícios para a ALPHADATA.
// Usa um PRNG com seed fixa para que o dataset seja estável entre builds,
// mas rico o suficiente para popular dashboards, kanban e relatórios.

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const pad = (n, len = 3) => String(n).padStart(len, '0')

// ─── Tipos de Serviço ───────────────────────────────────────────────
export const TIPOS_SERVICO = [
  { id: 'limpeza-residencial', nome: 'Limpeza Residencial', categoria: 'limpeza', min: 150, max: 300 },
  { id: 'limpeza-comercial', nome: 'Limpeza Comercial', categoria: 'limpeza', min: 300, max: 800 },
  { id: 'manutencao-predial', nome: 'Manutenção Predial', categoria: 'manutencao', min: 200, max: 500 },
  { id: 'hvac', nome: 'HVAC', categoria: 'hvac', min: 400, max: 1200 },
  { id: 'encanamento', nome: 'Encanamento', categoria: 'encanamento', min: 100, max: 800 },
  { id: 'paisagismo', nome: 'Paisagismo', categoria: 'paisagismo', min: 150, max: 600 },
  { id: 'eletrico', nome: 'Serviço Elétrico', categoria: 'eletrico', min: 200, max: 600 },
  { id: 'reparos-gerais', nome: 'Reparos Gerais', categoria: 'geral', min: 100, max: 400 },
]

export const ESPECIALIDADES = ['Limpeza', 'Manutenção Predial', 'HVAC', 'Encanamento', 'Paisagismo', 'Elétrico', 'Geral']

export const STATUS_OS = ['Agendada', 'Iniciada', 'Em Andamento', 'Concluída', 'Cancelada']

export const STATUS_CORES = {
  Agendada: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', hex: '#0066CC' },
  Iniciada: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', hex: '#EAB308' },
  'Em Andamento': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', hex: '#F97316' },
  Concluída: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', hex: '#22C55E' },
  Cancelada: { bg: 'bg-gray-200', text: 'text-gray-600', dot: 'bg-gray-400', hex: '#9CA3AF' },
}

// ─── Checklists dinâmicos por categoria de serviço ─────────────────
export const CHECKLIST_TEMPLATES = {
  limpeza: ['Área externa (limpeza)', 'Banheiros (desinfecção)', 'Cozinha (limpeza profunda)', 'Salas (piso e superfícies)', 'Quarto (cama e móveis)'],
  manutencao: ['Inspeção visual', 'Teste funcional', 'Lubrificação', 'Ajustes necessários', 'Limpeza geral'],
  hvac: ['Limpeza de filtros', 'Inspeção do compressor', 'Teste de refrigeração', 'Limpeza de dutos', 'Verificação de vazamentos'],
  encanamento: ['Inspeção de canos', 'Teste de vazamentos', 'Desobstrução', 'Reparos necessários', 'Teste final'],
  paisagismo: ['Poda realizada', 'Limpeza de área', 'Adubação', 'Rega', 'Limpeza de ferramentas'],
  eletrico: ['Inspeção do quadro elétrico', 'Teste de disjuntores', 'Verificação de fiação', 'Troca de componentes', 'Teste final de carga'],
  geral: ['Diagnóstico do problema', 'Execução do reparo', 'Teste de funcionamento', 'Limpeza da área', 'Verificação final'],
}

export const CONSENTIMENTO_ITENS = [
  'Autorizo a realização deste serviço conforme descrito acima',
  'Recebi explicação sobre o serviço',
  'Autorizo a utilização de fotos/registros desta ordem',
  'Concordo com os termos de serviço ALPHADATA',
  'Confirmo que recebi os dados de contato para suporte',
]

// ─── Clientes (50) ──────────────────────────────────────────────────
const NOMES_EMPRESA = [
  'Acme Facilities', 'Grupo Horizonte', 'Condomínio Jardim das Flores', 'Torre Sul Empresarial', 'Residencial Bela Vista',
  'Mercado Central', 'Clínica Vida Nova', 'Escola Novo Saber', 'Shopping Praça Norte', 'Hotel Estrela do Sul',
  'Restaurante Sabor & Arte', 'Edifício Copacabana Office', 'Condomínio Vale Verde', 'Indústria Metalfer', 'Farmácia Bem Estar',
  'Academia Corpo em Forma', 'Auto Peças Rodavia', 'Escritório Almeida & Souza', 'Hospital São Lucas', 'Padaria Pão Dourado',
  'Studio Criativo Design', 'Condomínio Alto da Serra', 'Loja Moda Center', 'Petshop Amigo Fiel', 'Igreja Comunidade Viva',
  'Universidade Nova Era', 'Clube Recreativo União', 'Banco Popular Agência 12', 'Distribuidora Rio Claro', 'Fábrica TêxtilBom',
  'Residencial Monte Azul', 'Consultório Odonto Sorriso', 'Galpão Logístico Norte', 'Supermercado Economia', 'Edifício Central Park',
  'Pousada Recanto do Sol', 'Salão Beleza Pura', 'Escritório Contábil Fortes', 'Condomínio Parque das Águas', 'Cinema Estrela Plaza',
  'Creche Mundo Encantado', 'Laboratório Análises Rio', 'Concessionária AutoMax', 'Restaurante Cantina Italiana', 'Torre Empresarial Atlântico',
  'Condomínio Recanto Feliz', 'Livraria Página Viva', 'Clínica Fisio Ativa', 'Depósito ArmazémBom', 'Residencial Flor de Lis',
]
const CIDADES_UF = [
  ['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Curitiba', 'PR'], ['Porto Alegre', 'RS'],
  ['Salvador', 'BA'], ['Fortaleza', 'CE'], ['Recife', 'PE'], ['Brasília', 'DF'], ['Campinas', 'SP'],
]
const RUAS = ['Rua das Palmeiras', 'Av. Paulista', 'Rua Sete de Setembro', 'Av. Brasil', 'Rua das Acácias', 'Av. Independência', 'Rua XV de Novembro', 'Av. Atlântica', 'Rua do Comércio', 'Alameda Santos']

function gerarTelefone() {
  return `(${randInt(11, 85)}) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`
}
function gerarCNPJ() {
  return `${randInt(10, 99)}.${randInt(100, 999)}.${randInt(100, 999)}/0001-${randInt(10, 99)}`
}
function gerarData(diasAtras, diasFrente = 0) {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras + diasFrente)
  return d.toISOString().slice(0, 10)
}
function slugEmail(nome) {
  return nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')
}

export const CLIENTES = NOMES_EMPRESA.map((nome, i) => {
  const [cidade, uf] = pick(CIDADES_UF)
  const totalOS = randInt(0, 8)
  return {
    id: `CLI-${pad(i + 1, 2)}`,
    nome,
    telefone: gerarTelefone(),
    email: `contato@${slugEmail(nome)}.com.br`,
    endereco: `${pick(RUAS)}, ${randInt(10, 2500)}`,
    cidade,
    estado: uf,
    cnpj: gerarCNPJ(),
    ativo: rand() > 0.15,
    totalOS,
    ultimaOS: totalOS > 0 ? gerarData(randInt(1, 180)) : null,
  }
})

// ─── Prestadores / Técnicos (10) ───────────────────────────────────
const NOMES_TECNICOS = [
  'Carlos Santos', 'Marcos Oliveira', 'Fernanda Lima', 'Roberto Alves', 'Juliana Costa',
  'Paulo Henrique', 'Aline Ferreira', 'Ricardo Souza', 'Patrícia Gomes', 'Eduardo Martins',
]
export const PRESTADORES = NOMES_TECNICOS.map((nome, i) => {
  const especialidade = i === 0 ? 'Limpeza' : pick(ESPECIALIDADES)
  return {
    id: `TEC-${pad(i + 1, 2)}`,
    nome,
    especialidade,
    telefone: gerarTelefone(),
    email: `${slugEmail(nome)}@alphadata.com`,
    avaliacao: Number((3 + rand() * 2).toFixed(1)),
    totalOS: randInt(8, 60),
    ativo: rand() > 0.1,
  }
})

// ─── Ordens de Serviço (30) ─────────────────────────────────────────
const PRIORIDADES = ['Normal', 'Alta', 'Urgente']
const COMENTARIOS_AVALIACAO = [
  'Excelente atendimento, muito profissional!',
  'Serviço bem executado, dentro do prazo.',
  'Bom trabalho, mas poderia ter chegado mais cedo.',
  'Ótima comunicação e capricho no serviço.',
  'Resolveu o problema rapidamente.',
  'Técnico muito atencioso e educado.',
]

function gerarChecklist(categoria, preenchido) {
  return CHECKLIST_TEMPLATES[categoria].map((item, idx) => ({
    id: idx,
    label: item,
    concluido: preenchido ? true : rand() > 0.5,
    observacao: preenchido && rand() > 0.6 ? 'Executado conforme solicitado.' : '',
  }))
}

function gerarFotos(qtd) {
  return Array.from({ length: qtd }, (_, i) => `https://placehold.co/400x300?text=Foto+${i + 1}`)
}

const ASSINATURA_MOCK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#FFFFFF"/><path d="M60,200 C100,120 140,240 180,160 S260,80 300,180 S380,220 420,140 S500,100 540,190" stroke="#111111" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`
  )

// Garante que as contas de demonstração (CLI-01 / TEC-01) sempre tenham
// ordens visíveis nos dashboards, independentemente do sorteio aleatório.
const ORDENS_DEMO_FIXAS = {
  0: { clienteId: CLIENTES[0].id, tecnicoId: PRESTADORES[0].id, status: 'Agendada' },
  1: { clienteId: CLIENTES[0].id, tecnicoId: PRESTADORES[1].id, status: 'Em Andamento' },
  2: { clienteId: CLIENTES[0].id, tecnicoId: PRESTADORES[0].id, status: 'Concluída' },
  3: { clienteId: CLIENTES[1].id, tecnicoId: PRESTADORES[0].id, status: 'Iniciada' },
  4: { clienteId: CLIENTES[2].id, tecnicoId: PRESTADORES[0].id, status: 'Concluída' },
}

export const ORDENS_SERVICO = Array.from({ length: 30 }, (_, i) => {
  const fixa = ORDENS_DEMO_FIXAS[i]
  const tipo = pick(TIPOS_SERVICO)
  const cliente = fixa ? CLIENTES.find((c) => c.id === fixa.clienteId) : pick(CLIENTES)
  const tecnico = fixa ? PRESTADORES.find((p) => p.id === fixa.tecnicoId) : pick(PRESTADORES)
  const status = fixa ? fixa.status : i < 6 ? 'Concluída' : pick(STATUS_OS)
  const isConcluida = status === 'Concluída'
  const isCancelada = status === 'Cancelada'
  const diasAtras = isConcluida ? randInt(1, 90) : -randInt(0, 20)
  const valor = randInt(tipo.min, tipo.max)
  const semTecnico = !fixa && status === 'Agendada' && rand() > 0.7

  return {
    id: `OS-${pad(i + 1)}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    tecnicoId: semTecnico ? null : tecnico.id,
    tecnicoNome: semTecnico ? null : tecnico.nome,
    tipoServicoId: tipo.id,
    tipoServico: tipo.nome,
    categoria: tipo.categoria,
    descricao: `${tipo.nome} conforme solicitação do cliente ${cliente.nome}.`,
    dataAgendada: gerarData(diasAtras),
    hora: `${pad(randInt(7, 17), 2)}:${pick(['00', '15', '30', '45'])}`,
    endereco: cliente.endereco,
    valor,
    notasInternas: rand() > 0.6 ? 'Cliente prefere contato via WhatsApp.' : '',
    prioridade: pick(PRIORIDADES),
    status,
    checklist: gerarChecklist(tipo.categoria, isConcluida),
    fotos: {
      antes: isConcluida || status === 'Em Andamento' ? gerarFotos(randInt(1, 3)) : [],
      durante: isConcluida ? gerarFotos(randInt(0, 2)) : [],
      depois: isConcluida ? gerarFotos(randInt(1, 3)) : [],
    },
    assinatura: isConcluida ? ASSINATURA_MOCK : null,
    consentimento: isConcluida ? CONSENTIMENTO_ITENS.map(() => true) : CONSENTIMENTO_ITENS.map(() => false),
    avaliacao: isConcluida && rand() > 0.2 ? { estrelas: randInt(3, 5), comentario: pick(COMENTARIOS_AVALIACAO) } : null,
    criadaEm: gerarData(diasAtras + randInt(1, 10)),
    canceladaMotivo: isCancelada ? 'Cliente remarcou para outra data.' : null,
  }
})

// ─── Credenciais dos 3 usuários de demonstração ────────────────────
export const USUARIOS_DEMO = {
  admin: { email: 'admin@alphadata.com', senha: 'admin123', nome: 'João Silva', papel: 'Gerente Geral', userType: 'admin' },
  tecnico: { email: 'tecnico@alphadata.com', senha: 'tecnico123', nome: 'Carlos Santos', papel: 'Técnico Especializado', userType: 'tecnico', tecnicoId: 'TEC-01' },
  cliente: { email: 'cliente@alphadata.com', senha: 'cliente123', nome: 'Acme Facilities', papel: 'Cliente', userType: 'cliente', clienteId: 'CLI-01' },
}

// ─── Faturamento mensal mockado (12 meses) para gráfico de linha ───
export const RECEITA_MENSAL = Array.from({ length: 12 }, (_, i) => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return { mes: meses[i], valor: randInt(15000, 45000) }
})

// =====================================================================
// CONFEITARIA E SALGADOS — dados mockados
// =====================================================================
const NOMES_CLIENTES_CONFEITARIA = [
  'Buffet Doce Encanto', 'Maria Fernandes', 'Condomínio Vila Nova', 'Ana Beatriz Costa',
  'Escritório Almeida & Souza', 'Igreja Comunidade Viva', 'Academia Corpo em Forma', 'Juliana Ramos',
  'Padaria Pão Dourado', 'Roberto Nunes', 'Creche Mundo Encantado', 'Camila Santos',
  'Clínica Vida Nova', 'Fernando Alves', 'Petshop Amigo Fiel', 'Beatriz Lima',
  'Salão Beleza Pura', 'Marcos Vinícius', 'Empresa TechSoft', 'Patrícia Gomes',
]

export const CLIENTES_CONFEITARIA = NOMES_CLIENTES_CONFEITARIA.map((nome, i) => {
  const [cidade, uf] = pick(CIDADES_UF)
  return {
    id: `CLI-CF-${pad(i + 1, 2)}`,
    nome,
    telefone: gerarTelefone(),
    email: `contato@${slugEmail(nome)}.com.br`,
    cidade,
    estado: uf,
  }
})

const CATEGORIAS_RECEITA = ['Bolos', 'Doces', 'Salgados', 'Tortas', 'Sobremesas']
const NOMES_RECEITAS = [
  'Bolo de Chocolate com Ganache', 'Brigadeiro Gourmet', 'Coxinha de Frango', 'Torta de Limão',
  'Pudim de Leite Condensado', 'Bolo Red Velvet', 'Empada de Palmito', 'Bolo de Cenoura com Cobertura',
  'Beijinho', 'Quiche de Alho-poró', 'Torta Holandesa', 'Bolo Naked Cake',
]
export const RECEITAS_CONFEITARIA = NOMES_RECEITAS.map((nome, i) => ({
  id: `REC-${pad(i + 1, 2)}`,
  nome,
  categoria: pick(CATEGORIAS_RECEITA),
  tempoPreparoMinutos: randInt(30, 180),
  rendimento: `${randInt(10, 50)} unidades`,
}))

const CATALOGO_PRODUTOS_CONFEITARIA = [
  { nome: 'Bolo de Chocolate 20cm', preco: 120 }, { nome: 'Cento de Brigadeiros', preco: 90 },
  { nome: 'Cento de Coxinhas', preco: 110 }, { nome: 'Torta de Limão Grande', preco: 85 },
  { nome: 'Kit Festa Infantil (50 pessoas)', preco: 450 }, { nome: 'Bolo de Casamento 3 Andares', preco: 1200 },
  { nome: 'Cento de Empadas', preco: 130 }, { nome: 'Bolo Red Velvet 25cm', preco: 160 },
  { nome: 'Mesa de Doces Completa', preco: 680 }, { nome: 'Bolo Naked Cake', preco: 220 },
]
export const PRODUTOS_CONFEITARIA = CATALOGO_PRODUTOS_CONFEITARIA.map((p, i) => ({
  id: `PRD-${pad(i + 1, 2)}`,
  nome: p.nome,
  precoVenda: p.preco,
  categoria: pick(CATEGORIAS_RECEITA),
  ativo: rand() > 0.1,
  descricao: `${p.nome}, feito sob encomenda com ingredientes selecionados. Consulte opções de personalização de sabor e tamanho.`,
  fotos: [
    `https://placehold.co/500x350?text=${encodeURIComponent(p.nome)}+1`,
    `https://placehold.co/500x350?text=${encodeURIComponent(p.nome)}+2`,
    `https://placehold.co/500x350?text=${encodeURIComponent(p.nome)}+3`,
  ],
}))

export const STATUS_PEDIDO_CONFEITARIA = ['Novo', 'Confirmado', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado']
export const STATUS_PEDIDO_CONFEITARIA_CORES = {
  Novo: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Confirmado: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  'Em Produção': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  Pronto: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Entregue: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Cancelado: { bg: 'bg-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
}

export const PEDIDOS_CONFEITARIA = Array.from({ length: 28 }, (_, i) => {
  const cliente = pick(CLIENTES_CONFEITARIA)
  const itens = Array.from({ length: randInt(1, 3) }, () => {
    const produto = pick(PRODUTOS_CONFEITARIA)
    return { produtoNome: produto.nome, quantidade: randInt(1, 5), precoUnitario: produto.precoVenda }
  })
  const valorTotal = itens.reduce((soma, it) => soma + it.quantidade * it.precoUnitario, 0)
  const status = i < 8 ? 'Entregue' : pick(STATUS_PEDIDO_CONFEITARIA)
  const diasAtras = status === 'Entregue' ? randInt(1, 60) : -randInt(1, 15)
  return {
    id: `PED-${pad(i + 1)}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    itens,
    valorTotal,
    dataEntrega: gerarData(diasAtras),
    enderecoEntrega: `${pick(RUAS)}, ${randInt(10, 2500)}`,
    status,
    observacoes: rand() > 0.7 ? 'Sem glúten, por favor.' : '',
    criadoEm: gerarData(diasAtras + randInt(1, 10)),
  }
})

// =====================================================================
// SALÃO DE FESTAS — dados mockados
// =====================================================================
const NOMES_CLIENTES_SALAO = [
  'Ana Paula Ribeiro', 'Empresa TechNova Ltda', 'Carlos & Juliana (Casamento)', 'Escola Novo Saber',
  'Fernanda Costa', 'Clube Recreativo União', 'Rodrigo & Camila (Casamento)', 'Universidade Nova Era',
  'Mariana Alves', 'Distribuidora Rio Claro', 'Lucas Pereira (15 anos)', 'Banco Popular Agência 12',
  'Beatriz Souza', 'Concessionária AutoMax', 'Thiago & Renata (Casamento)', 'Igreja Comunidade Viva',
  'Isabela Martins', 'Laboratório Análises Rio', 'Gustavo Lima (Formatura)', 'Hospital São Lucas',
]
export const CLIENTES_SALAO = NOMES_CLIENTES_SALAO.map((nome, i) => {
  const [cidade, uf] = pick(CIDADES_UF)
  return {
    id: `CLI-SL-${pad(i + 1, 2)}`,
    nome,
    telefone: gerarTelefone(),
    email: `contato@${slugEmail(nome)}.com.br`,
    cidade,
    estado: uf,
  }
})

const TIPOS_EVENTO = ['Aniversário', 'Casamento', 'Corporativo', 'Formatura', 'Confraternização', 'Outro']

export const PACOTES_SALAO = [
  {
    id: 'PCT-01', nome: 'Pacote Bronze', precoBase: 3500, capacidade: 80,
    itensInclusos: ['Decoração básica', 'Som', 'Buffet simples'],
    descricao: 'Ideal para aniversários e confraternizações menores, com decoração básica, som ambiente e buffet simples para até 80 convidados.',
    fotos: ['https://placehold.co/500x350?text=Pacote+Bronze+1', 'https://placehold.co/500x350?text=Pacote+Bronze+2', 'https://placehold.co/500x350?text=Pacote+Bronze+3'],
  },
  {
    id: 'PCT-02', nome: 'Pacote Prata', precoBase: 6500, capacidade: 120,
    itensInclusos: ['Decoração temática', 'Som e iluminação', 'Buffet completo'],
    descricao: 'Perfeito para casamentos e formaturas de médio porte: decoração temática, som e iluminação profissionais e buffet completo para até 120 convidados.',
    fotos: ['https://placehold.co/500x350?text=Pacote+Prata+1', 'https://placehold.co/500x350?text=Pacote+Prata+2', 'https://placehold.co/500x350?text=Pacote+Prata+3'],
  },
  {
    id: 'PCT-03', nome: 'Pacote Ouro', precoBase: 12000, capacidade: 200,
    itensInclusos: ['Decoração premium', 'Som, luz e telão', 'Buffet + open bar'],
    descricao: 'A opção mais requisitada para eventos corporativos e casamentos: decoração premium, som, luz e telão, buffet completo com open bar para até 200 convidados.',
    fotos: ['https://placehold.co/500x350?text=Pacote+Ouro+1', 'https://placehold.co/500x350?text=Pacote+Ouro+2', 'https://placehold.co/500x350?text=Pacote+Ouro+3'],
  },
  {
    id: 'PCT-04', nome: 'Pacote Premium', precoBase: 22000, capacidade: 350,
    itensInclusos: ['Cenografia completa', 'Estrutura de palco', 'Buffet gourmet + open bar'],
    descricao: 'Experiência completa para grandes celebrações: cenografia exclusiva, estrutura de palco, buffet gourmet e open bar para até 350 convidados.',
    fotos: ['https://placehold.co/500x350?text=Pacote+Premium+1', 'https://placehold.co/500x350?text=Pacote+Premium+2', 'https://placehold.co/500x350?text=Pacote+Premium+3'],
  },
]

export const STATUS_EVENTO = ['Orçamento', 'Confirmado', 'Em Andamento', 'Finalizado', 'Cancelado']
export const STATUS_EVENTO_CORES = {
  Orçamento: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  Confirmado: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Em Andamento': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Finalizado: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Cancelado: { bg: 'bg-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
}

const CHECKLIST_EVENTO_PADRAO = [
  'Contrato assinado', 'Sinal recebido', 'Equipe confirmada', 'Equipamentos separados',
  'Decoração montada', 'Som e iluminação testados', 'Espaço limpo pós-evento',
]

export const EVENTOS_SALAO = Array.from({ length: 24 }, (_, i) => {
  const cliente = pick(CLIENTES_SALAO)
  const pacote = pick(PACOTES_SALAO)
  const tipoEvento = pick(TIPOS_EVENTO)
  const status = i < 6 ? 'Finalizado' : pick(STATUS_EVENTO)
  const diasAtras = status === 'Finalizado' ? randInt(1, 90) : -randInt(1, 60)
  return {
    id: `EVT-${pad(i + 1)}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    nomeEvento: `${tipoEvento} de ${cliente.nome}`,
    tipoEvento,
    pacoteId: pacote.id,
    pacoteNome: pacote.nome,
    dataEvento: gerarData(diasAtras),
    numeroConvidados: randInt(40, pacote.capacidade),
    valorTotal: pacote.precoBase,
    status,
    checklist: CHECKLIST_EVENTO_PADRAO.map((label, idx) => ({
      id: idx,
      label,
      concluido: status === 'Finalizado' ? true : rand() > 0.5,
      observacao: '',
    })),
    criadoEm: gerarData(diasAtras + randInt(5, 20)),
  }
})

// =====================================================================
// FOTOGRAFIA E VÍDEO — dados mockados
// =====================================================================
const NOMES_CLIENTES_FOTOGRAFIA = [
  'Beatriz e Rafael (Casamento)', 'Studio Criativo Design', 'Larissa Mendes (Gestante)', 'Auto Peças Rodavia',
  'Escritório Contábil Fortes', 'Pedro Henrique (15 anos)', 'Camila e Diego (Casamento)', 'Restaurante Cantina Italiana',
  'Sofia Martins (Ensaio)', 'Torre Empresarial Atlântico', 'Rafaela Costa (Gestante)', 'Livraria Página Viva',
  'André e Bianca (Casamento)', 'Clínica Fisio Ativa', 'Gabriel Souza (Formatura)', 'Depósito ArmazémBom',
  'Letícia Alves (Ensaio)', 'Hotel Estrela do Sul', 'Vitor Hugo (15 anos)', 'Farmácia Bem Estar',
]
export const CLIENTES_FOTOGRAFIA = NOMES_CLIENTES_FOTOGRAFIA.map((nome, i) => {
  const [cidade, uf] = pick(CIDADES_UF)
  return {
    id: `CLI-FT-${pad(i + 1, 2)}`,
    nome,
    telefone: gerarTelefone(),
    email: `contato@${slugEmail(nome)}.com.br`,
    cidade,
    estado: uf,
  }
})

const TIPOS_SESSAO = ['Ensaio', 'Casamento', 'Evento', 'Produto', 'Institucional', 'Outro']

export const PACOTES_FOTOGRAFIA = [
  {
    id: 'PCF-01', nome: 'Ensaio Fotográfico', precoBase: 450, fotosInclusas: 30, horasInclusas: 2,
    descricao: 'Sessão de retratos em estúdio ou externa, com iluminação profissional e 30 fotos editadas inclusas.',
    fotos: ['https://placehold.co/500x350?text=Ensaio+Fotografico+1', 'https://placehold.co/500x350?text=Ensaio+Fotografico+2', 'https://placehold.co/500x350?text=Ensaio+Fotografico+3'],
  },
  {
    id: 'PCF-02', nome: 'Cobertura de Casamento', precoBase: 3800, fotosInclusas: 300, horasInclusas: 8,
    descricao: 'Cobertura completa da cerimônia e da festa, com 2 fotógrafos, 8 horas de cobertura e 300 fotos editadas.',
    fotos: ['https://placehold.co/500x350?text=Cobertura+Casamento+1', 'https://placehold.co/500x350?text=Cobertura+Casamento+2', 'https://placehold.co/500x350?text=Cobertura+Casamento+3'],
  },
  {
    id: 'PCF-03', nome: 'Sessão Corporativa', precoBase: 900, fotosInclusas: 50, horasInclusas: 3,
    descricao: 'Fotos institucionais da equipe, dos produtos ou do ambiente da empresa, com 50 fotos editadas inclusas.',
    fotos: ['https://placehold.co/500x350?text=Sessao+Corporativa+1', 'https://placehold.co/500x350?text=Sessao+Corporativa+2', 'https://placehold.co/500x350?text=Sessao+Corporativa+3'],
  },
  {
    id: 'PCF-04', nome: 'Vídeo Institucional', precoBase: 2200, fotosInclusas: 0, horasInclusas: 6,
    descricao: 'Produção de vídeo institucional com captação e edição profissional, incluindo 6 horas de gravação.',
    fotos: ['https://placehold.co/500x350?text=Video+Institucional+1', 'https://placehold.co/500x350?text=Video+Institucional+2', 'https://placehold.co/500x350?text=Video+Institucional+3'],
  },
]

export const STATUS_SESSAO = ['Agendada', 'Realizada', 'Em Edição', 'Entregue', 'Cancelada']
export const STATUS_SESSAO_CORES = {
  Agendada: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Realizada: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  'Em Edição': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  Entregue: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Cancelada: { bg: 'bg-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
}

const LOCAIS_SESSAO = ['Estúdio principal', 'Externa — Parque da Cidade', 'Externa — Praia', 'Local do cliente']

export const SESSOES_FOTOGRAFIA = Array.from({ length: 26 }, (_, i) => {
  const cliente = pick(CLIENTES_FOTOGRAFIA)
  const pacote = pick(PACOTES_FOTOGRAFIA)
  const status = i < 7 ? 'Entregue' : pick(STATUS_SESSAO)
  const diasAtras = status === 'Entregue' || status === 'Realizada' ? randInt(1, 90) : -randInt(1, 30)
  const percentualEdicaoConcluida = status === 'Entregue' ? 100 : status === 'Em Edição' ? randInt(10, 90) : 0
  return {
    id: `SES-${pad(i + 1)}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    tipoSessao: pick(TIPOS_SESSAO),
    pacoteId: pacote.id,
    pacoteNome: pacote.nome,
    dataSessao: gerarData(diasAtras),
    local: pick(LOCAIS_SESSAO),
    valorTotal: pacote.precoBase,
    quantidadeFotos: pacote.fotosInclusas,
    percentualEdicaoConcluida,
    status,
    criadoEm: gerarData(diasAtras + randInt(3, 15)),
  }
})

// =====================================================================
// AGENDAMENTOS — genérico, um dataset por vertical (mesma forma nos 3:
// confeitaria, salão de festas e fotografia usam a mesma tela)
// =====================================================================
export const STATUS_AGENDAMENTO = ['Agendado', 'Confirmado', 'Em Andamento', 'Concluído', 'Cancelado']
export const STATUS_AGENDAMENTO_CORES = {
  Agendado: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Confirmado: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  'Em Andamento': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Concluído: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Cancelado: { bg: 'bg-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
}

function gerarAgendamentos(quantidade, clientes, tiposServico, prefixoId) {
  return Array.from({ length: quantidade }, (_, i) => {
    const cliente = pick(clientes)
    const status = i < Math.round(quantidade * 0.3) ? 'Concluído' : pick(STATUS_AGENDAMENTO)
    const diasAtras = status === 'Concluído' ? randInt(1, 60) : -randInt(0, 25)
    return {
      id: `${prefixoId}-${pad(i + 1, 3)}`,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      tipoServico: pick(tiposServico),
      data: gerarData(diasAtras),
      hora: `${pad(randInt(8, 18), 2)}:${pick(['00', '15', '30', '45'])}`,
      endereco: `${pick(RUAS)}, ${randInt(10, 2500)}`,
      status,
      criadoEm: gerarData(diasAtras + randInt(1, 10)),
    }
  })
}

export const AGENDAMENTOS_CONFEITARIA = gerarAgendamentos(
  16, CLIENTES_CONFEITARIA, CATALOGO_PRODUTOS_CONFEITARIA.map((p) => p.nome), 'AGD-CF'
)
export const AGENDAMENTOS_SALAO = gerarAgendamentos(
  16, CLIENTES_SALAO, PACOTES_SALAO.map((p) => p.nome), 'AGD-SL'
)
export const AGENDAMENTOS_FOTOGRAFIA = gerarAgendamentos(
  16, CLIENTES_FOTOGRAFIA, PACOTES_FOTOGRAFIA.map((p) => p.nome), 'AGD-FT'
)

// =====================================================================
// ESTOQUE DE INGREDIENTES — Confeitaria e Salgados
// =====================================================================
const CATALOGO_INGREDIENTES = [
  { nome: 'Farinha de Trigo', unidade: 'kg' }, { nome: 'Açúcar Refinado', unidade: 'kg' },
  { nome: 'Chocolate Belga', unidade: 'kg' }, { nome: 'Ovos', unidade: 'dúzia' },
  { nome: 'Manteiga', unidade: 'kg' }, { nome: 'Leite Condensado', unidade: 'lata' },
  { nome: 'Fermento em Pó', unidade: 'kg' }, { nome: 'Essência de Baunilha', unidade: 'ml' },
  { nome: 'Frango Desfiado', unidade: 'kg' }, { nome: 'Queijo Mussarela', unidade: 'kg' },
  { nome: 'Palmito', unidade: 'kg' }, { nome: 'Massa Folhada', unidade: 'kg' },
]
export const INGREDIENTES_CONFEITARIA = CATALOGO_INGREDIENTES.map((ing, i) => {
  const quantidadeMinima = randInt(5, 15)
  const quantidadeAtual = rand() > 0.2 ? randInt(quantidadeMinima, quantidadeMinima * 6) : randInt(0, quantidadeMinima - 1)
  return {
    id: `ING-${pad(i + 1, 2)}`,
    nome: ing.nome,
    unidadeMedida: ing.unidade,
    quantidadeAtual,
    quantidadeMinima,
    custoUnitario: Number((rand() * 40 + 2).toFixed(2)),
  }
})

// =====================================================================
// EQUIPE E EQUIPAMENTOS — Salão de Festas
// =====================================================================
const CARGOS_EQUIPE_SALAO = ['Garçom', 'Garçonete', 'Segurança', 'Recepcionista', 'DJ', 'Cerimonialista', 'Cozinheiro', 'Auxiliar de Cozinha']
const NOMES_EQUIPE = [
  'Wesley Rocha', 'Débora Nascimento', 'Anderson Melo', 'Priscila Farias', 'Diego Barbosa',
  'Vanessa Teixeira', 'Bruno Cardoso', 'Aline Moreira', 'Felipe Duarte', 'Tatiane Correia',
]
export const EQUIPE_SALAO = NOMES_EQUIPE.map((nome, i) => ({
  id: `EQP-${pad(i + 1, 2)}`,
  nome,
  cargo: pick(CARGOS_EQUIPE_SALAO),
  telefone: gerarTelefone(),
  disponivel: rand() > 0.15,
}))

const CATALOGO_EQUIPAMENTOS_SALAO = [
  'Sistema de Som Profissional', 'Iluminação de Palco', 'Telão e Projetor', 'Mesa de Buffet (10un)',
  'Cadeiras Tiffany (100un)', 'Toalhas de Mesa (20un)', 'Gerador de Energia', 'Pista de Dança Iluminada',
  'Máquina de Fumaça', 'Tenda 10x10m',
]
export const EQUIPAMENTOS_SALAO = CATALOGO_EQUIPAMENTOS_SALAO.map((nome, i) => {
  const quantidadeTotal = randInt(1, 10)
  return {
    id: `EQM-${pad(i + 1, 2)}`,
    nome,
    quantidadeTotal,
    quantidadeEmUso: randInt(0, quantidadeTotal),
    condicao: pick(['Ótimo', 'Bom', 'Regular', 'Manutenção']),
  }
})

// =====================================================================
// PRODUÇÕES DE VÍDEO — Fotografia e Vídeo
// =====================================================================
export const STATUS_PRODUCAO_VIDEO = ['Captação', 'Edição', 'Revisão', 'Entregue']
export const STATUS_PRODUCAO_VIDEO_CORES = {
  Captação: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Edição: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  Revisão: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Entregue: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
}
const EDITORES_VIDEO = ['Rafael Nogueira', 'Camila Duarte', 'Bruno Faria']
const TITULOS_PRODUCAO_VIDEO = [
  'Making Of Casamento', 'Vídeo Institucional', 'Save the Date', 'Highlights do Evento',
  'Vídeo Convite Digital', 'Cobertura Completa (Longa Metragem)', 'Reels para Redes Sociais',
]
export const PRODUCOES_VIDEO_FOTOGRAFIA = Array.from({ length: 12 }, (_, i) => {
  const cliente = pick(CLIENTES_FOTOGRAFIA)
  const status = i < 4 ? 'Entregue' : pick(STATUS_PRODUCAO_VIDEO)
  const diasAtras = status === 'Entregue' ? randInt(5, 90) : -randInt(1, 30)
  return {
    id: `VID-${pad(i + 1, 2)}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    titulo: `${pick(TITULOS_PRODUCAO_VIDEO)} — ${cliente.nome}`,
    duracaoEstimadaSegundos: randInt(60, 600),
    editor: pick(EDITORES_VIDEO),
    status,
    criadoEm: gerarData(diasAtras + randInt(2, 10)),
  }
})

// =====================================================================
// PORTFÓLIO — Fotografia e Vídeo
// =====================================================================
export const PORTFOLIO_FOTOGRAFIA = Array.from({ length: 18 }, (_, i) => {
  const cliente = pick(CLIENTES_FOTOGRAFIA)
  const tipoSessao = pick(TIPOS_SESSAO)
  return {
    id: `PORT-${pad(i + 1, 2)}`,
    fotoUrl: `https://placehold.co/400x400?text=Foto+${i + 1}`,
    clienteNome: cliente.nome,
    tipoSessao,
    permissaoCliente: true,
    publico: rand() > 0.1,
    criadoEm: gerarData(randInt(5, 200)),
  }
})
