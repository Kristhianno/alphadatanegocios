export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          atualizado_em: string
          cliente_id: string
          conta_id: string
          criado_em: string
          data_hora_fim: string | null
          data_hora_inicio: string
          endereco: string | null
          id: string
          metadados: Json
          motivo_cancelamento: string | null
          observacoes: string | null
          responsavel_id: string | null
          servico_id: string | null
          status: string
          tipo_negocio: string
          valor_estimado: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          conta_id: string
          criado_em?: string
          data_hora_fim?: string | null
          data_hora_inicio: string
          endereco?: string | null
          id?: string
          metadados?: Json
          motivo_cancelamento?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          servico_id?: string | null
          status?: string
          tipo_negocio: string
          valor_estimado?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          data_hora_fim?: string | null
          data_hora_inicio?: string
          endereco?: string | null
          id?: string
          metadados?: Json
          motivo_cancelamento?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          servico_id?: string | null
          status?: string
          tipo_negocio?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_tipo_negocio_fkey"
            columns: ["tipo_negocio"]
            isOneToOne: false
            referencedRelation: "tipos_negocio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          conta_id: string | null
          criado_em: string
          dados_antes: Json | null
          dados_depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip_origem: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          conta_id?: string | null
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip_origem?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          conta_id?: string | null
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip_origem?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacao_cliente: {
        Row: {
          cliente_id: string
          comentario: string | null
          conta_id: string
          criado_em: string
          id: string
          nota: number
          referencia_id: string
          referencia_tipo: string
          resposta_empresa: string | null
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          conta_id: string
          criado_em?: string
          id?: string
          nota: number
          referencia_id: string
          referencia_tipo: string
          resposta_empresa?: string | null
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          conta_id?: string
          criado_em?: string
          id?: string
          nota?: number
          referencia_id?: string
          referencia_tipo?: string
          resposta_empresa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacao_cliente_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_produtos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string | null
          conta_id: string
          criado_em: string
          custo_producao_estimado: number
          descricao: string | null
          id: string
          margem_lucro_percentual: number | null
          nome: string
          preco_venda: number
          receita_id: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          conta_id: string
          criado_em?: string
          custo_producao_estimado?: number
          descricao?: string | null
          id?: string
          margem_lucro_percentual?: number | null
          nome: string
          preco_venda: number
          receita_id?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          conta_id?: string
          criado_em?: string
          custo_producao_estimado?: number
          descricao?: string | null
          id?: string
          margem_lucro_percentual?: number | null
          nome?: string
          preco_venda?: number
          receita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_produtos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogo_produtos_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados_manutencao: {
        Row: {
          atualizado_em: string
          categoria_manutencao: string
          cliente_id: string
          conta_id: string
          criado_em: string
          descricao: string
          endereco: string | null
          id: string
          prioridade: string
          status: string
          tipo_servico_id: string | null
        }
        Insert: {
          atualizado_em?: string
          categoria_manutencao: string
          cliente_id: string
          conta_id: string
          criado_em?: string
          descricao: string
          endereco?: string | null
          id?: string
          prioridade?: string
          status?: string
          tipo_servico_id?: string | null
        }
        Update: {
          atualizado_em?: string
          categoria_manutencao?: string
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          descricao?: string
          endereco?: string | null
          id?: string
          prioridade?: string
          status?: string
          tipo_servico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_manutencao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_manutencao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_manutencao_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servico_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cidade: string | null
          conta_id: string
          criado_em: string
          documento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          metadados: Json
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cidade?: string | null
          conta_id: string
          criado_em?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          metadados?: Json
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cidade?: string | null
          conta_id?: string
          criado_em?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          metadados?: Json
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas: {
        Row: {
          atualizado_em: string
          configuracoes_gerais: Json
          criado_em: string
          id: string
          nome_empresa: string
          plano: string
          status: string
          tipo_negocio: string | null
        }
        Insert: {
          atualizado_em?: string
          configuracoes_gerais?: Json
          criado_em?: string
          id?: string
          nome_empresa: string
          plano?: string
          status?: string
          tipo_negocio?: string | null
        }
        Update: {
          atualizado_em?: string
          configuracoes_gerais?: Json
          criado_em?: string
          id?: string
          nome_empresa?: string
          plano?: string
          status?: string
          tipo_negocio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_tipo_negocio_fkey"
            columns: ["tipo_negocio"]
            isOneToOne: false
            referencedRelation: "tipos_negocio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      contratos: {
        Row: {
          arquivo_pdf_url: string | null
          assinado_em: string | null
          atualizado_em: string
          cliente_id: string
          conta_id: string
          conteudo: string | null
          criado_em: string
          id: string
          metadados: Json
          referencia_id: string
          referencia_tipo: string
          status: string
          tipo_negocio: string
          titulo: string
          valor_total: number | null
        }
        Insert: {
          arquivo_pdf_url?: string | null
          assinado_em?: string | null
          atualizado_em?: string
          cliente_id: string
          conta_id: string
          conteudo?: string | null
          criado_em?: string
          id?: string
          metadados?: Json
          referencia_id: string
          referencia_tipo: string
          status?: string
          tipo_negocio: string
          titulo: string
          valor_total?: number | null
        }
        Update: {
          arquivo_pdf_url?: string | null
          assinado_em?: string | null
          atualizado_em?: string
          cliente_id?: string
          conta_id?: string
          conteudo?: string | null
          criado_em?: string
          id?: string
          metadados?: Json
          referencia_id?: string
          referencia_tipo?: string
          status?: string
          tipo_negocio?: string
          titulo?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_tipo_negocio_fkey"
            columns: ["tipo_negocio"]
            isOneToOne: false
            referencedRelation: "tipos_negocio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      contratos_evento: {
        Row: {
          assinado_em: string | null
          contrato_id: string | null
          criado_em: string
          evento_id: string
          id: string
          termos: string | null
        }
        Insert: {
          assinado_em?: string | null
          contrato_id?: string | null
          criado_em?: string
          evento_id: string
          id?: string
          termos?: string | null
        }
        Update: {
          assinado_em?: string | null
          contrato_id?: string | null
          criado_em?: string
          evento_id?: string
          id?: string
          termos?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_evento_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_manutencao: {
        Row: {
          cliente_id: string
          contrato_id: string | null
          criado_em: string
          escopo: string | null
          id: string
          sla_horas_resposta: number | null
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          cliente_id: string
          contrato_id?: string | null
          criado_em?: string
          escopo?: string | null
          id?: string
          sla_horas_resposta?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          cliente_id?: string
          contrato_id?: string | null
          criado_em?: string
          escopo?: string | null
          id?: string
          sla_horas_resposta?: number | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_manutencao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_manutencao_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_sessao: {
        Row: {
          assinado_em: string | null
          contrato_id: string | null
          criado_em: string
          id: string
          sessao_id: string
          termos_direitos_autorais: string | null
        }
        Insert: {
          assinado_em?: string | null
          contrato_id?: string | null
          criado_em?: string
          id?: string
          sessao_id: string
          termos_direitos_autorais?: string | null
        }
        Update: {
          assinado_em?: string | null
          contrato_id?: string | null
          criado_em?: string
          id?: string
          sessao_id?: string
          termos_direitos_autorais?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_sessao_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_sessao_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_foto"
            referencedColumns: ["id"]
          },
        ]
      }
      edicoes_foto: {
        Row: {
          concluida_em: string | null
          criado_em: string
          descricao_alteracao: string | null
          editor_id: string | null
          foto_id: string
          id: string
          iniciada_em: string | null
          status: string
        }
        Insert: {
          concluida_em?: string | null
          criado_em?: string
          descricao_alteracao?: string | null
          editor_id?: string | null
          foto_id: string
          id?: string
          iniciada_em?: string | null
          status?: string
        }
        Update: {
          concluida_em?: string | null
          criado_em?: string
          descricao_alteracao?: string | null
          editor_id?: string | null
          foto_id?: string
          id?: string
          iniciada_em?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "edicoes_foto_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edicoes_foto_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "fotos_sessao"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos_evento: {
        Row: {
          condicao_retorno: string | null
          condicao_saida: string | null
          criado_em: string
          data_devolucao_prevista: string | null
          data_devolucao_real: string | null
          data_retirada: string | null
          evento_id: string
          id: string
          nome_equipamento: string
          observacoes: string | null
          quantidade: number
        }
        Insert: {
          condicao_retorno?: string | null
          condicao_saida?: string | null
          criado_em?: string
          data_devolucao_prevista?: string | null
          data_devolucao_real?: string | null
          data_retirada?: string | null
          evento_id: string
          id?: string
          nome_equipamento: string
          observacoes?: string | null
          quantidade?: number
        }
        Update: {
          condicao_retorno?: string | null
          condicao_saida?: string | null
          criado_em?: string
          data_devolucao_prevista?: string | null
          data_devolucao_real?: string | null
          data_retirada?: string | null
          evento_id?: string
          id?: string
          nome_equipamento?: string
          observacoes?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes_evento: {
        Row: {
          cargo: string
          confirmado: boolean
          confirmado_em: string | null
          criado_em: string
          evento_id: string
          id: string
          nome: string
          quantidade: number
          usuario_id: string | null
          valor_pagamento: number | null
        }
        Insert: {
          cargo: string
          confirmado?: boolean
          confirmado_em?: string | null
          criado_em?: string
          evento_id: string
          id?: string
          nome: string
          quantidade?: number
          usuario_id?: string | null
          valor_pagamento?: number | null
        }
        Update: {
          cargo?: string
          confirmado?: boolean
          confirmado_em?: string | null
          criado_em?: string
          evento_id?: string
          id?: string
          nome?: string
          quantidade?: number
          usuario_id?: string | null
          valor_pagamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipes_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_evento_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          agendamento_id: string | null
          atualizado_em: string
          cancelado_em: string | null
          checklist: Json
          cliente_id: string
          conta_id: string
          criado_em: string
          data_evento: string
          id: string
          motivo_cancelamento: string | null
          nome_evento: string
          numero_convidados: number | null
          pacote_id: string | null
          status: string
          tipo_evento: string
          valor_total: number
        }
        Insert: {
          agendamento_id?: string | null
          atualizado_em?: string
          cancelado_em?: string | null
          checklist?: Json
          cliente_id: string
          conta_id: string
          criado_em?: string
          data_evento: string
          id?: string
          motivo_cancelamento?: string | null
          nome_evento: string
          numero_convidados?: number | null
          pacote_id?: string | null
          status?: string
          tipo_evento: string
          valor_total?: number
        }
        Update: {
          agendamento_id?: string | null
          atualizado_em?: string
          cancelado_em?: string | null
          checklist?: Json
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          data_evento?: string
          id?: string
          motivo_cancelamento?: string | null
          nome_evento?: string
          numero_convidados?: number | null
          pacote_id?: string | null
          status?: string
          tipo_evento?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "eventos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_salao"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_evento: {
        Row: {
          categoria: string | null
          criado_em: string
          data_pagamento: string | null
          data_prevista: string | null
          descricao: string | null
          evento_id: string
          id: string
          pago: boolean
          tipo: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          criado_em?: string
          data_pagamento?: string | null
          data_prevista?: string | null
          descricao?: string | null
          evento_id: string
          id?: string
          pago?: boolean
          tipo: string
          valor: number
        }
        Update: {
          categoria?: string | null
          criado_em?: string
          data_pagamento?: string | null
          data_prevista?: string | null
          descricao?: string | null
          evento_id?: string
          id?: string
          pago?: boolean
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          conta_id: string
          criado_em: string
          documento: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          conta_id: string
          criado_em?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          conta_id?: string
          criado_em?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_evento: {
        Row: {
          criado_em: string
          descricao: string | null
          evento_id: string
          id: string
          url: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          evento_id: string
          id?: string
          url: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          evento_id?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_produtos: {
        Row: {
          criado_em: string
          id: string
          ordem: number
          principal: boolean
          produto_id: string
          url: string
        }
        Insert: {
          criado_em?: string
          id?: string
          ordem?: number
          principal?: boolean
          produto_id: string
          url: string
        }
        Update: {
          criado_em?: string
          id?: string
          ordem?: number
          principal?: boolean
          produto_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_sessao: {
        Row: {
          criado_em: string
          foto_original_id: string | null
          id: string
          ordem: number
          selecionada_cliente: boolean
          sessao_id: string
          tipo: string
          url: string
        }
        Insert: {
          criado_em?: string
          foto_original_id?: string | null
          id?: string
          ordem?: number
          selecionada_cliente?: boolean
          sessao_id: string
          tipo: string
          url: string
        }
        Update: {
          criado_em?: string
          foto_original_id?: string | null
          id?: string
          ordem?: number
          selecionada_cliente?: boolean
          sessao_id?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_sessao_foto_original_id_fkey"
            columns: ["foto_original_id"]
            isOneToOne: false
            referencedRelation: "fotos_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_sessao_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_foto"
            referencedColumns: ["id"]
          },
        ]
      }
      frames_video: {
        Row: {
          criado_em: string
          descricao: string | null
          id: string
          producao_id: string
          timestamp_segundos: number
          url_thumbnail: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          id?: string
          producao_id: string
          timestamp_segundos: number
          url_thumbnail: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          id?: string
          producao_id?: string
          timestamp_segundos?: number
          url_thumbnail?: string
        }
        Relationships: [
          {
            foreignKeyName: "frames_video_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producoes_video"
            referencedColumns: ["id"]
          },
        ]
      }
      galeria_cliente: {
        Row: {
          criado_em: string
          expira_em: string
          id: string
          permite_download: boolean
          senha_hash: string | null
          sessao_id: string
          token_acesso: string
          visualizacoes: number
        }
        Insert: {
          criado_em?: string
          expira_em: string
          id?: string
          permite_download?: boolean
          senha_hash?: string | null
          sessao_id: string
          token_acesso: string
          visualizacoes?: number
        }
        Update: {
          criado_em?: string
          expira_em?: string
          id?: string
          permite_download?: boolean
          senha_hash?: string | null
          sessao_id?: string
          token_acesso?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "galeria_cliente_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_foto"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes_estoque: {
        Row: {
          atualizado_em: string
          conta_id: string
          criado_em: string
          custo_unitario: number
          data_validade: string | null
          fornecedor_id: string | null
          id: string
          lote: string | null
          nome: string
          quantidade_atual: number
          quantidade_minima: number
          unidade_medida: string
        }
        Insert: {
          atualizado_em?: string
          conta_id: string
          criado_em?: string
          custo_unitario?: number
          data_validade?: string | null
          fornecedor_id?: string | null
          id?: string
          lote?: string | null
          nome: string
          quantidade_atual?: number
          quantidade_minima?: number
          unidade_medida: string
        }
        Update: {
          atualizado_em?: string
          conta_id?: string
          criado_em?: string
          custo_unitario?: number
          data_validade?: string | null
          fornecedor_id?: string | null
          id?: string
          lote?: string | null
          nome?: string
          quantidade_atual?: number
          quantidade_minima?: number
          unidade_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_estoque_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      inspeccoes: {
        Row: {
          checklist: Json
          cliente_id: string
          conta_id: string
          criado_em: string
          data_inspecao: string
          id: string
          observacoes: string | null
          resultado: string | null
          tecnico_id: string | null
          tipo_servico_id: string | null
        }
        Insert: {
          checklist?: Json
          cliente_id: string
          conta_id: string
          criado_em?: string
          data_inspecao: string
          id?: string
          observacoes?: string | null
          resultado?: string | null
          tecnico_id?: string | null
          tipo_servico_id?: string | null
        }
        Update: {
          checklist?: Json
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          data_inspecao?: string
          id?: string
          observacoes?: string | null
          resultado?: string | null
          tecnico_id?: string | null
          tipo_servico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspeccoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspeccoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspeccoes_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspeccoes_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servico_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      integracao_pagamento: {
        Row: {
          atualizado_em: string
          conta_id: string
          criado_em: string
          id: string
          metodo: string | null
          moeda: string
          pago_em: string | null
          payload_bruto: Json | null
          provedor: string
          provedor_transacao_id: string | null
          referencia_id: string
          referencia_tipo: string
          status: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          conta_id: string
          criado_em?: string
          id?: string
          metodo?: string | null
          moeda?: string
          pago_em?: string | null
          payload_bruto?: Json | null
          provedor: string
          provedor_transacao_id?: string | null
          referencia_id: string
          referencia_tipo: string
          status?: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          conta_id?: string
          criado_em?: string
          id?: string
          metodo?: string | null
          moeda?: string
          pago_em?: string | null
          payload_bruto?: Json | null
          provedor?: string
          provedor_transacao_id?: string | null
          referencia_id?: string
          referencia_tipo?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "integracao_pagamento_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          id: string
          observacoes: string | null
          opcoes_selecionadas: Json
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number | null
        }
        Insert: {
          id?: string
          observacoes?: string | null
          opcoes_selecionadas?: Json
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal?: number | null
        }
        Update: {
          id?: string
          observacoes?: string | null
          opcoes_selecionadas?: Json
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_confeitaria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      laudos_tecnicos: {
        Row: {
          arquivo_pdf_url: string | null
          assinatura_cliente: string | null
          assinatura_tecnico: string | null
          criado_em: string
          diagnostico: string
          fotos: Json
          id: string
          ordem_id: string
          recomendacoes: string | null
          servicos_realizados: string | null
          tecnico_id: string | null
        }
        Insert: {
          arquivo_pdf_url?: string | null
          assinatura_cliente?: string | null
          assinatura_tecnico?: string | null
          criado_em?: string
          diagnostico: string
          fotos?: Json
          id?: string
          ordem_id: string
          recomendacoes?: string | null
          servicos_realizados?: string | null
          tecnico_id?: string | null
        }
        Update: {
          arquivo_pdf_url?: string | null
          assinatura_cliente?: string | null
          assinatura_tecnico?: string | null
          criado_em?: string
          diagnostico?: string
          fotos?: Json
          id?: string
          ordem_id?: string
          recomendacoes?: string | null
          servicos_realizados?: string | null
          tecnico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laudos_tecnicos_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laudos_tecnicos_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes_preventivas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cliente_id: string
          conta_id: string
          criado_em: string
          frequencia: string
          id: string
          proxima_execucao: string
          tipo_servico_id: string | null
          ultima_execucao: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cliente_id: string
          conta_id: string
          criado_em?: string
          frequencia: string
          id?: string
          proxima_execucao: string
          tipo_servico_id?: string | null
          ultima_execucao?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          frequencia?: string
          id?: string
          proxima_execucao?: string
          tipo_servico_id?: string | null
          ultima_execucao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_preventivas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_preventivas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_preventivas_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servico_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_manutencao: {
        Row: {
          ativo: boolean
          conta_id: string
          custo_unitario: number
          estoque_atual: number
          id: string
          nome: string
          unidade_medida: string | null
        }
        Insert: {
          ativo?: boolean
          conta_id: string
          custo_unitario?: number
          estoque_atual?: number
          id?: string
          nome: string
          unidade_medida?: string | null
        }
        Update: {
          ativo?: boolean
          conta_id?: string
          custo_unitario?: number
          estoque_atual?: number
          id?: string
          nome?: string
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_manutencao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_utilizados: {
        Row: {
          criado_em: string
          custo_total: number | null
          custo_unitario_no_momento: number
          id: string
          material_id: string
          ordem_id: string
          quantidade: number
        }
        Insert: {
          criado_em?: string
          custo_total?: number | null
          custo_unitario_no_momento: number
          id?: string
          material_id: string
          ordem_id: string
          quantidade: number
        }
        Update: {
          criado_em?: string
          custo_total?: number | null
          custo_unitario_no_momento?: number
          id?: string
          material_id?: string
          ordem_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "materiais_utilizados_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_utilizados_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          conta_id: string
          criado_em: string
          criado_por: string | null
          id: string
          ingrediente_id: string
          motivo: string | null
          ordem_producao_id: string | null
          quantidade: number
          quantidade_resultante: number
          tipo: string
        }
        Insert: {
          conta_id: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          ingrediente_id: string
          motivo?: string | null
          ordem_producao_id?: string | null
          quantidade: number
          quantidade_resultante: number
          tipo: string
        }
        Update: {
          conta_id?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          ingrediente_id?: string
          motivo?: string | null
          ordem_producao_id?: string | null
          quantidade?: number
          quantidade_resultante?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          canal: string
          conta_id: string
          criado_em: string
          id: string
          lida: boolean
          lida_em: string | null
          mensagem: string | null
          metadados: Json
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          canal?: string
          conta_id: string
          criado_em?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          mensagem?: string | null
          metadados?: Json
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          canal?: string
          conta_id?: string
          criado_em?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          mensagem?: string | null
          metadados?: Json
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      opcoes_customizacao: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          preco_adicional: number
          produto_id: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          preco_adicional?: number
          produto_id: string
          tipo: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          preco_adicional?: number
          produto_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "opcoes_customizacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          chamado_id: string
          criado_em: string
          gerado_automaticamente: boolean
          id: string
          itens: Json
          respondido_em: string | null
          status: string
          validade_dias: number
          valor_mao_obra: number
          valor_materiais: number
          valor_total: number | null
        }
        Insert: {
          chamado_id: string
          criado_em?: string
          gerado_automaticamente?: boolean
          id?: string
          itens?: Json
          respondido_em?: string | null
          status?: string
          validade_dias?: number
          valor_mao_obra?: number
          valor_materiais?: number
          valor_total?: number | null
        }
        Update: {
          chamado_id?: string
          criado_em?: string
          gerado_automaticamente?: boolean
          id?: string
          itens?: Json
          respondido_em?: string | null
          status?: string
          validade_dias?: number
          valor_mao_obra?: number
          valor_materiais?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_manutencao: {
        Row: {
          atualizado_em: string
          chamado_id: string
          conta_id: string
          criado_em: string
          data_agendada: string | null
          hora_fim: string | null
          hora_inicio: string | null
          horas_trabalhadas: number | null
          id: string
          status: string
          tecnico_id: string | null
        }
        Insert: {
          atualizado_em?: string
          chamado_id: string
          conta_id: string
          criado_em?: string
          data_agendada?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          horas_trabalhadas?: number | null
          id?: string
          status?: string
          tecnico_id?: string | null
        }
        Update: {
          atualizado_em?: string
          chamado_id?: string
          conta_id?: string
          criado_em?: string
          data_agendada?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          horas_trabalhadas?: number | null
          id?: string
          status?: string
          tecnico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_manutencao_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_manutencao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_manutencao_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          checklist_etapas: Json
          conta_id: string
          criado_em: string
          custo_producao_real: number | null
          finalizada_em: string | null
          id: string
          iniciada_em: string | null
          pedido_id: string
          responsavel_id: string | null
          status: string
        }
        Insert: {
          checklist_etapas?: Json
          conta_id: string
          criado_em?: string
          custo_producao_real?: number | null
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string | null
          pedido_id: string
          responsavel_id?: string | null
          status?: string
        }
        Update: {
          checklist_etapas?: Json
          conta_id?: string
          criado_em?: string
          custo_producao_real?: number | null
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string | null
          pedido_id?: string
          responsavel_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_confeitaria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          agendamento_id: string | null
          assinatura_cliente: string | null
          atualizado_em: string
          checklist: Json
          cliente_id: string
          concluida_em: string | null
          conta_id: string
          criado_em: string
          fotos: Json
          id: string
          metadados: Json
          numero: string
          responsavel_id: string | null
          status: string
          tipo_negocio: string
          valor_total: number | null
        }
        Insert: {
          agendamento_id?: string | null
          assinatura_cliente?: string | null
          atualizado_em?: string
          checklist?: Json
          cliente_id: string
          concluida_em?: string | null
          conta_id: string
          criado_em?: string
          fotos?: Json
          id?: string
          metadados?: Json
          numero: string
          responsavel_id?: string | null
          status?: string
          tipo_negocio: string
          valor_total?: number | null
        }
        Update: {
          agendamento_id?: string | null
          assinatura_cliente?: string | null
          atualizado_em?: string
          checklist?: Json
          cliente_id?: string
          concluida_em?: string | null
          conta_id?: string
          criado_em?: string
          fotos?: Json
          id?: string
          metadados?: Json
          numero?: string
          responsavel_id?: string | null
          status?: string
          tipo_negocio?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_tipo_negocio_fkey"
            columns: ["tipo_negocio"]
            isOneToOne: false
            referencedRelation: "tipos_negocio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      pacotes_fotografia: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conta_id: string
          criado_em: string
          descricao: string | null
          horas_inclusas: number | null
          id: string
          nome: string
          preco_base: number
          quantidade_fotos_inclusas: number | null
          tipo_sessao: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conta_id: string
          criado_em?: string
          descricao?: string | null
          horas_inclusas?: number | null
          id?: string
          nome: string
          preco_base: number
          quantidade_fotos_inclusas?: number | null
          tipo_sessao: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conta_id?: string
          criado_em?: string
          descricao?: string | null
          horas_inclusas?: number | null
          id?: string
          nome?: string
          preco_base?: number
          quantidade_fotos_inclusas?: number | null
          tipo_sessao?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_fotografia_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes_salao: {
        Row: {
          ativo: boolean
          atualizado_em: string
          capacidade_convidados: number | null
          conta_id: string
          criado_em: string
          descricao: string | null
          id: string
          itens_inclusos: Json
          nome: string
          percentual_multa_cancelamento: number
          politica_cancelamento: string | null
          prazo_cancelamento_dias: number
          preco_base: number
          tipo_evento: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          capacidade_convidados?: number | null
          conta_id: string
          criado_em?: string
          descricao?: string | null
          id?: string
          itens_inclusos?: Json
          nome: string
          percentual_multa_cancelamento?: number
          politica_cancelamento?: string | null
          prazo_cancelamento_dias?: number
          preco_base: number
          tipo_evento: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          capacidade_convidados?: number | null
          conta_id?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          itens_inclusos?: Json
          nome?: string
          percentual_multa_cancelamento?: number
          politica_cancelamento?: string | null
          prazo_cancelamento_dias?: number
          preco_base?: number
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_salao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_confeitaria: {
        Row: {
          agendamento_id: string | null
          atualizado_em: string
          cliente_id: string
          conta_id: string
          criado_em: string
          data_entrega: string | null
          endereco_entrega: string | null
          id: string
          numero: string
          observacoes: string | null
          status: string
          valor_total: number
        }
        Insert: {
          agendamento_id?: string | null
          atualizado_em?: string
          cliente_id: string
          conta_id: string
          criado_em?: string
          data_entrega?: string | null
          endereco_entrega?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          status?: string
          valor_total?: number
        }
        Update: {
          agendamento_id?: string | null
          atualizado_em?: string
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          data_entrega?: string | null
          endereco_entrega?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_confeitaria_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_confeitaria_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_confeitaria_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_fotografo: {
        Row: {
          categoria: string | null
          conta_id: string
          criado_em: string
          direitos_autorais: string
          foto_id: string | null
          fotografo_id: string | null
          id: string
          permissao_cliente: boolean
          permissao_concedida_em: string | null
          publico: boolean
          sessao_id: string | null
          titulo: string | null
        }
        Insert: {
          categoria?: string | null
          conta_id: string
          criado_em?: string
          direitos_autorais?: string
          foto_id?: string | null
          fotografo_id?: string | null
          id?: string
          permissao_cliente?: boolean
          permissao_concedida_em?: string | null
          publico?: boolean
          sessao_id?: string | null
          titulo?: string | null
        }
        Update: {
          categoria?: string | null
          conta_id?: string
          criado_em?: string
          direitos_autorais?: string
          foto_id?: string | null
          fotografo_id?: string | null
          id?: string
          permissao_cliente?: boolean
          permissao_concedida_em?: string | null
          publico?: boolean
          sessao_id?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_fotografo_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_fotografo_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "fotos_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_fotografo_fotografo_id_fkey"
            columns: ["fotografo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_fotografo_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_foto"
            referencedColumns: ["id"]
          },
        ]
      }
      producoes_video: {
        Row: {
          atualizado_em: string
          cliente_id: string
          conta_id: string
          criado_em: string
          duracao_estimada_segundos: number | null
          editor_id: string | null
          id: string
          sessao_id: string | null
          status: string
          titulo: string
          url_entrega: string | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          conta_id: string
          criado_em?: string
          duracao_estimada_segundos?: number | null
          editor_id?: string | null
          id?: string
          sessao_id?: string | null
          status?: string
          titulo: string
          url_entrega?: string | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          duracao_estimada_segundos?: number | null
          editor_id?: string | null
          id?: string
          sessao_id?: string | null
          status?: string
          titulo?: string
          url_entrega?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producoes_video_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_video_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_video_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_video_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_foto"
            referencedColumns: ["id"]
          },
        ]
      }
      receita_ingredientes: {
        Row: {
          id: string
          ingrediente_id: string
          quantidade_necessaria: number
          receita_id: string
        }
        Insert: {
          id?: string
          ingrediente_id: string
          quantidade_necessaria: number
          receita_id: string
        }
        Update: {
          id?: string
          ingrediente_id?: string
          quantidade_necessaria?: number
          receita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receita_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receita_ingredientes_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string | null
          conta_id: string
          criado_em: string
          id: string
          modo_preparo: string | null
          nome: string
          rendimento_quantidade: number | null
          rendimento_unidade: string | null
          tempo_preparo_minutos: number | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          conta_id: string
          criado_em?: string
          id?: string
          modo_preparo?: string | null
          nome: string
          rendimento_quantidade?: number | null
          rendimento_unidade?: string | null
          tempo_preparo_minutos?: number | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          conta_id?: string
          criado_em?: string
          id?: string
          modo_preparo?: string | null
          nome?: string
          rendimento_quantidade?: number | null
          rendimento_unidade?: string | null
          tempo_preparo_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conta_id: string
          criado_em: string
          descricao: string | null
          duracao_estimada_minutos: number | null
          id: string
          metadados: Json
          nome: string
          preco_base: number | null
          tipo_negocio: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conta_id: string
          criado_em?: string
          descricao?: string | null
          duracao_estimada_minutos?: number | null
          id?: string
          metadados?: Json
          nome: string
          preco_base?: number | null
          tipo_negocio: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conta_id?: string
          criado_em?: string
          descricao?: string | null
          duracao_estimada_minutos?: number | null
          id?: string
          metadados?: Json
          nome?: string
          preco_base?: number | null
          tipo_negocio?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_tipo_negocio_fkey"
            columns: ["tipo_negocio"]
            isOneToOne: false
            referencedRelation: "tipos_negocio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      servicos_manutencao: {
        Row: {
          ativo: boolean
          conta_id: string
          descricao: string | null
          id: string
          nome: string
          preco_base: number | null
          tipo_servico_id: string | null
        }
        Insert: {
          ativo?: boolean
          conta_id: string
          descricao?: string | null
          id?: string
          nome: string
          preco_base?: number | null
          tipo_servico_id?: string | null
        }
        Update: {
          ativo?: boolean
          conta_id?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_base?: number | null
          tipo_servico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_manutencao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_manutencao_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servico_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_foto: {
        Row: {
          agendamento_id: string | null
          atualizado_em: string
          cliente_id: string
          conta_id: string
          criado_em: string
          data_sessao: string
          fotografo_id: string | null
          id: string
          local: string | null
          pacote_id: string | null
          percentual_edicao_concluida: number
          status: string
          tipo_sessao: string
          valor_total: number | null
        }
        Insert: {
          agendamento_id?: string | null
          atualizado_em?: string
          cliente_id: string
          conta_id: string
          criado_em?: string
          data_sessao: string
          fotografo_id?: string | null
          id?: string
          local?: string | null
          pacote_id?: string | null
          percentual_edicao_concluida?: number
          status?: string
          tipo_sessao: string
          valor_total?: number | null
        }
        Update: {
          agendamento_id?: string | null
          atualizado_em?: string
          cliente_id?: string
          conta_id?: string
          criado_em?: string
          data_sessao?: string
          fotografo_id?: string | null
          id?: string
          local?: string | null
          pacote_id?: string | null
          percentual_edicao_concluida?: number
          status?: string
          tipo_sessao?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_foto_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_foto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_foto_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_foto_fotografo_id_fkey"
            columns: ["fotografo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_foto_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_fotografia"
            referencedColumns: ["id"]
          },
        ]
      }
      tecnicos: {
        Row: {
          avaliacao_media: number
          criado_em: string
          disponivel: boolean
          especialidades: Json
          id: string
          total_chamados_concluidos: number
          usuario_id: string
        }
        Insert: {
          avaliacao_media?: number
          criado_em?: string
          disponivel?: boolean
          especialidades?: Json
          id?: string
          total_chamados_concluidos?: number
          usuario_id: string
        }
        Update: {
          avaliacao_media?: number
          criado_em?: string
          disponivel?: boolean
          especialidades?: Json
          id?: string
          total_chamados_concluidos?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecnicos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_negocio: {
        Row: {
          ativo: boolean
          codigo: string
          criado_em: string
          descricao: string | null
          icone: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          nome?: string
        }
        Relationships: []
      }
      tipos_servico_manutencao: {
        Row: {
          ativo: boolean
          categoria_manutencao: string
          conta_id: string
          id: string
          nome: string
          tempo_estimado_horas: number | null
        }
        Insert: {
          ativo?: boolean
          categoria_manutencao: string
          conta_id: string
          id?: string
          nome: string
          tempo_estimado_horas?: number | null
        }
        Update: {
          ativo?: boolean
          categoria_manutencao?: string
          conta_id?: string
          id?: string
          nome?: string
          tempo_estimado_horas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_servico_manutencao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          atualizado_em: string
          auth_user_id: string | null
          cliente_id: string | null
          conta_id: string
          criado_em: string
          deve_trocar_senha: boolean
          email: string
          id: string
          nome: string
          papel: string
          senha_hash: string | null
          status: string
          ultimo_login_em: string | null
        }
        Insert: {
          atualizado_em?: string
          auth_user_id?: string | null
          cliente_id?: string | null
          conta_id: string
          criado_em?: string
          deve_trocar_senha?: boolean
          email: string
          id?: string
          nome: string
          papel: string
          senha_hash?: string | null
          status?: string
          ultimo_login_em?: string | null
        }
        Update: {
          atualizado_em?: string
          auth_user_id?: string | null
          cliente_id?: string | null
          conta_id?: string
          criado_em?: string
          deve_trocar_senha?: boolean
          email?: string
          id?: string
          nome?: string
          papel?: string
          senha_hash?: string | null
          status?: string
          ultimo_login_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
