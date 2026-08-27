import { Link } from 'react-router-dom'
import {
  IconArrowLeft, IconCookie, IconDatabase, IconMailForward, IconScale, IconShieldLock, IconUserCheck,
} from '@tabler/icons-react'
import AlphaDataLogo from '../components/AlphaDataLogo'

// Dados da controladora — preencher com a razão social, CNPJ e endereço reais
// antes de publicar. É informação exigida pela LGPD (identificação do
// controlador) e falta hoje em qualquer outro lugar do app.
const CONTROLADORA = {
  razaoSocial: '[RAZÃO SOCIAL DA EMPRESA]',
  cnpj: '[CNPJ]',
  endereco: '[ENDEREÇO COMPLETO]',
  emailDpo: 'privacidade@alphadata.com.br',
}

const VIGENCIA = '27 de agosto de 2026'

const SUBOPERADORES = [
  { nome: 'Stripe', finalidade: 'Processamento de pagamentos e cobrança recorrente da assinatura' },
  { nome: 'Supabase', finalidade: 'Banco de dados e autenticação — onde os registros da Conta e dos clientes ficam armazenados' },
  { nome: 'Cloudflare', finalidade: 'Hospedagem, CDN e proteção contra abuso do site e da API' },
  { nome: 'Provedor de e-mail transacional', finalidade: 'Envio de e-mails de acesso, convite e notificações do sistema' },
]

const DADOS_COLETADOS = [
  { categoria: 'Conta e equipe', dados: 'Nome, e-mail, telefone, senha (com hash), cargo/tipo de usuário', titular: 'Quem contrata e a equipe dela' },
  { categoria: 'Clientes finais (portal do cliente)', dados: 'Nome, e-mail, telefone, CPF ou CNPJ, endereço, histórico de agendamentos e contratos', titular: 'Clientes da Conta (ex.: quem contrata um salão de festas)' },
  { categoria: 'Pagamento', dados: 'Dados de cobrança processados pela Stripe — a Alpha não armazena número de cartão', titular: 'Quem contrata (Conta)' },
  { categoria: 'Uso e navegação', dados: 'Endereço IP, tipo de dispositivo/navegador, páginas acessadas, cookies essenciais de sessão', titular: 'Qualquer visitante ou usuário logado' },
]

const RETENCAO = [
  { tipo: 'Dados de conta ativa', prazo: 'Enquanto a assinatura estiver ativa' },
  { tipo: 'Dados após cancelamento', prazo: '30 dias (permite reativar sem perder histórico), depois anonimização ou exclusão' },
  { tipo: 'Registros fiscais e de cobrança', prazo: '5 anos, por obrigação legal' },
  { tipo: 'Logs de acesso e conexão', prazo: '6 meses, conforme Marco Civil da Internet (Lei 12.965/2014)' },
]

const DIREITOS = [
  'Confirmar se tratamos algum dado seu e acessar esse dado',
  'Corrigir dado incompleto, inexato ou desatualizado',
  'Solicitar anonimização, bloqueio ou eliminação de dado desnecessário',
  'Solicitar a portabilidade dos seus dados a outro fornecedor',
  'Revogar o consentimento dado anteriormente',
  'Pedir informação sobre com quem compartilhamos seus dados',
  'Se opor a um tratamento feito com base em legítimo interesse',
]

const COOKIES = [
  { nome: 'Sessão / autenticação', tipo: 'Essencial', finalidade: 'Manter você logado durante o uso do sistema', podeRecusar: 'Não — o sistema não funciona sem ele' },
  { nome: 'Preferências de interface', tipo: 'Essencial', finalidade: 'Lembrar escolhas simples, como aba ou filtro selecionado', podeRecusar: 'Não' },
  { nome: 'Métricas de uso', tipo: 'Analítico', finalidade: 'Entender quais páginas são mais usadas, para priorizar melhorias', podeRecusar: 'Sim, quando ativado' },
]

function Secao({ id, icon: Icon, titulo, children }) {
  return (
    <section id={id} className="scroll-mt-24 py-10 border-t border-muted-dark first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-btn bg-primary-light flex items-center justify-center shrink-0">
          <Icon size={19} className="text-primary" />
        </div>
        <h2 className="text-h2 text-[#1a1a1a]">{titulo}</h2>
      </div>
      <div className="flex flex-col gap-3 text-body text-[#333] [&_p]:max-w-[68ch]">
        {children}
      </div>
    </section>
  )
}

function Tabela({ colunas, linhas }) {
  return (
    <div className="overflow-x-auto rounded-card border border-muted-dark mt-1">
      <table className="w-full text-body">
        <thead>
          <tr className="bg-muted">
            {colunas.map((c) => (
              <th key={c} className="text-left px-4 py-2.5 text-label font-semibold text-[#666] uppercase tracking-wide">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className="border-t border-muted-dark">
              {linha.map((celula, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-[#333]">{celula}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-muted-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <AlphaDataLogo tagline={null} className="scale-75 origin-left" />
          <Link to="/" className="flex items-center gap-1.5 text-body text-[#333] hover:text-primary">
            <IconArrowLeft size={17} /> Voltar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <span className="text-label font-semibold text-primary uppercase tracking-wide">Rascunho para revisão jurídica</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mt-2 mb-3 leading-tight">Política de Privacidade e Cookies</h1>
        <p className="text-body text-[#666]">
          Vigente a partir de {VIGENCIA}. Esta política explica quais dados a {CONTROLADORA.razaoSocial} coleta, por quê,
          por quanto tempo e quais direitos você tem sobre eles, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>

        <div className="rounded-card bg-muted p-5 mt-8 text-body text-[#666]">
          <p className="mb-1"><strong className="text-[#333]">Dois papéis, uma plataforma.</strong> Quando você é dono(a) de uma Conta (o negócio que assina o Alpha), somos <strong>controladores</strong> dos seus dados e dos da sua equipe. Quando você é cliente de uma Conta (por exemplo, contratou um salão de festas que usa o Alpha), tratamos seus dados <strong>em nome dessa Conta</strong> — ela decide o que coletar sobre você, e nós apenas processamos com segurança.</p>
        </div>

        <Secao id="dados" icon={IconDatabase} titulo="1. Quais dados coletamos">
          <p>Coletamos apenas o que é necessário para o funcionamento do sistema, dividido em quatro grupos:</p>
          <Tabela
            colunas={['Categoria', 'Dados', 'De quem']}
            linhas={DADOS_COLETADOS.map((d) => [d.categoria, d.dados, d.titular])}
          />
        </Secao>

        <Secao id="finalidade" icon={IconScale} titulo="2. Para que usamos cada dado, e com que base legal">
          <p>Todo tratamento de dado tem uma finalidade específica e se apoia em uma das bases legais previstas no art. 7º da LGPD:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li><strong>Execução de contrato</strong> — criar sua conta, processar cobrança, permitir agendamentos e o uso diário do sistema.</li>
            <li><strong>Cumprimento de obrigação legal</strong> — emissão de nota fiscal, guarda de registros fiscais e de acesso.</li>
            <li><strong>Legítimo interesse</strong> — prevenção a fraude, segurança da plataforma, melhoria do produto a partir de métricas de uso agregadas.</li>
            <li><strong>Consentimento</strong> — envio de comunicação de marketing e cookies não essenciais (você pode recusar a qualquer momento).</li>
          </ul>
        </Secao>

        <Secao id="compartilhamento" icon={IconMailForward} titulo="3. Com quem compartilhamos seus dados">
          <p>Não vendemos dados a terceiros. Compartilhamos o mínimo necessário com prestadores que nos ajudam a operar o serviço:</p>
          <Tabela
            colunas={['Empresa', 'Para quê']}
            linhas={SUBOPERADORES.map((s) => [s.nome, s.finalidade])}
          />
          <p className="text-[#666]">Alguns desses prestadores podem processar dados fora do Brasil. Nesses casos, exigimos contratualmente que mantenham um nível de proteção compatível com a LGPD.</p>
        </Secao>

        <Secao id="retencao" icon={IconShieldLock} titulo="4. Por quanto tempo guardamos seus dados">
          <Tabela
            colunas={['Tipo de dado', 'Prazo de guarda']}
            linhas={RETENCAO.map((r) => [r.tipo, r.prazo])}
          />
          <p>Depois do prazo, o dado é anonimizado ou eliminado, exceto quando a lei exigir guarda mais longa.</p>
        </Secao>

        <Secao id="direitos" icon={IconUserCheck} titulo="5. Seus direitos como titular dos dados">
          <p>Conforme o art. 18 da LGPD, a qualquer momento você pode:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            {DIREITOS.map((d) => <li key={d}>{d}</li>)}
          </ul>
          <p>
            Para exercer qualquer um desses direitos, escreva para{' '}
            <a href={`mailto:${CONTROLADORA.emailDpo}`} className="text-primary hover:underline">{CONTROLADORA.emailDpo}</a>.
            Respondemos em até 15 dias.
          </p>
        </Secao>

        <Secao id="seguranca" icon={IconShieldLock} titulo="6. Como protegemos seus dados">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Conexão criptografada (HTTPS) em todo o site e na API.</li>
            <li>Senhas armazenadas com hash — nunca em texto puro.</li>
            <li>Acesso aos dados restrito por papel: um técnico não vê o financeiro, um cliente não vê dados de outro cliente.</li>
            <li>Dados de cartão de crédito nunca passam pelos nossos servidores — ficam só com a Stripe.</li>
          </ul>
          <p>Nenhum sistema é 100% imune a incidentes. Se algo assim acontecer, avisamos a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados dentro de um prazo razoável, com informações sobre o que ocorreu e o que estamos fazendo a respeito.</p>
        </Secao>

        <Secao id="cookies" icon={IconCookie} titulo="7. Cookies e tecnologias semelhantes">
          <p>Cookies são pequenos arquivos que o navegador guarda para lembrar informações entre uma visita e outra. Usamos três tipos:</p>
          <Tabela
            colunas={['Cookie', 'Tipo', 'Para quê', 'Dá pra recusar?']}
            linhas={COOKIES.map((c) => [c.nome, c.tipo, c.finalidade, c.podeRecusar])}
          />
          <p className="mt-1">Cookies <strong>essenciais</strong> não pedem consentimento, porque o sistema não funciona sem eles (ex.: manter você logado). Cookies <strong>analíticos</strong> só são ativados com sua permissão, dada no banner exibido na primeira visita — você pode mudar de ideia a qualquer momento apagando os cookies nas configurações do seu navegador.</p>
          <p>Não usamos cookies de publicidade nem compartilhamos dados de navegação com redes de anúncio.</p>
        </Secao>

        <Secao id="dpo" icon={IconUserCheck} titulo="8. Encarregado de Proteção de Dados (DPO)">
          <p>
            Nosso encarregado é o canal oficial de contato para qualquer assunto de privacidade, inclusive com a ANPD.
            Fale com a gente em <a href={`mailto:${CONTROLADORA.emailDpo}`} className="text-primary hover:underline">{CONTROLADORA.emailDpo}</a>.
          </p>
        </Secao>

        <Secao id="menores" icon={IconUserCheck} titulo="9. Crianças e adolescentes">
          <p>O Alpha é uma ferramenta de gestão de negócios e não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados de crianças ou adolescentes.</p>
        </Secao>

        <Secao id="alteracoes" icon={IconScale} titulo="10. Alterações desta política">
          <p>Podemos atualizar esta política para refletir mudanças no produto ou na legislação. Mudanças relevantes são avisadas por e-mail às Contas ativas, com antecedência mínima de 15 dias antes de entrarem em vigor.</p>
        </Secao>

        <Secao id="contato" icon={IconMailForward} titulo="11. Fale com a gente">
          <p>
            {CONTROLADORA.razaoSocial} — CNPJ {CONTROLADORA.cnpj}<br />
            {CONTROLADORA.endereco}<br />
            <a href={`mailto:${CONTROLADORA.emailDpo}`} className="text-primary hover:underline">{CONTROLADORA.emailDpo}</a>
          </p>
        </Secao>
      </div>

      <footer className="border-t border-muted-dark py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-3">
          <AlphaDataLogo />
          <p className="text-label text-[#999]">© 2026 ALPHADATA - Negócios</p>
        </div>
      </footer>
    </div>
  )
}
