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
