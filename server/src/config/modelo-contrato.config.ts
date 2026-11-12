/**
 * Campos que podem ser marcados no texto do modelo de contrato como
 * {{campo}} — a IA do WhatsApp coleta esses dados com o cliente e o sistema
 * troca cada marcação pelo valor (sem a IA reescrever cláusulas).
 * Espelhado no front em src/pages/Admin/ModeloContrato (CAMPOS_CONTRATO).
 */
export const CAMPOS_CONTRATO: readonly { chave: string; rotulo: string; exemplo: string }[] = [
  { chave: 'cliente_nome', rotulo: 'Nome do cliente', exemplo: 'Ana Souza' },
  { chave: 'cliente_cpf_cnpj', rotulo: 'CPF ou CNPJ', exemplo: '123.456.789-00' },
  { chave: 'cliente_rg', rotulo: 'RG', exemplo: '12.345.678-9' },
  { chave: 'cliente_endereco', rotulo: 'Endereço do cliente', exemplo: 'Rua das Flores, 100 - Centro' },
  { chave: 'cliente_telefone', rotulo: 'Telefone do cliente', exemplo: '(11) 98765-4321' },
  { chave: 'cliente_email', rotulo: 'E-mail do cliente', exemplo: 'ana@email.com' },
  { chave: 'evento_tipo', rotulo: 'Tipo de evento', exemplo: 'Aniversário infantil' },
  { chave: 'evento_data', rotulo: 'Data do evento', exemplo: '14/12/2026' },
  { chave: 'evento_horario', rotulo: 'Horário do evento', exemplo: '15h às 19h' },
  { chave: 'evento_local', rotulo: 'Local do evento', exemplo: 'Salão Festa Mágica' },
  { chave: 'convidados', rotulo: 'Nº de convidados', exemplo: '80' },
  { chave: 'pacote_nome', rotulo: 'Pacote / kit contratado', exemplo: 'Kit Unicórnio' },
  { chave: 'itens_inclusos', rotulo: 'Itens inclusos', exemplo: 'Mesa decorada, painel, 50 balões' },
  { chave: 'adicionais', rotulo: 'Adicionais', exemplo: 'Pula-pula extra' },
  { chave: 'valor_total', rotulo: 'Valor total', exemplo: 'R$ 890,00' },
  { chave: 'valor_sinal', rotulo: 'Valor do sinal', exemplo: 'R$ 300,00' },
  { chave: 'forma_pagamento', rotulo: 'Forma de pagamento', exemplo: 'PIX' },
  { chave: 'empresa_nome', rotulo: 'Nome da sua empresa', exemplo: 'Festa Mágica' },
  { chave: 'data_hoje', rotulo: 'Data de hoje', exemplo: '12/11/2026' },
]

export const ENTIDADE_MODELO_CONTRATO = 'modelo_contrato'
export const TAMANHO_MAXIMO_TEXTO = 50_000
