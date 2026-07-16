import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    /**
     * Seed roles
     */
    await db.rawQuery(`
      INSERT INTO roles (name, description, permissions, active, created_at, updated_at)
      VALUES
        ('admin', 'Administrador do sistema', '{"dashboard":{"create":true,"read":true,"update":true,"delete":true},"cardapio":{"create":true,"read":true,"update":true,"delete":true},"pedidos":{"create":true,"read":true,"update":true,"delete":true},"vendas":{"create":true,"read":true,"update":true,"delete":true},"estoque":{"create":true,"read":true,"update":true,"delete":true},"caixa":{"create":true,"read":true,"update":true,"delete":true},"relatorios":{"create":true,"read":true,"update":true,"delete":true},"configuracoes":{"create":true,"read":true,"update":true,"delete":true},"usuarios":{"create":true,"read":true,"update":true,"delete":true},"mesas":{"create":true,"read":true,"update":true,"delete":true}}', true, NOW(), NOW()),
        ('gerente', 'Gerente do estabelecimento', '{"dashboard":{"create":false,"read":true,"update":false,"delete":false},"cardapio":{"create":true,"read":true,"update":true,"delete":false},"pedidos":{"create":true,"read":true,"update":true,"delete":false},"vendas":{"create":true,"read":true,"update":true,"delete":false},"estoque":{"create":true,"read":true,"update":true,"delete":false},"caixa":{"create":true,"read":true,"update":true,"delete":false},"relatorios":{"create":false,"read":true,"update":false,"delete":false},"configuracoes":{"create":false,"read":true,"update":false,"delete":false},"usuarios":{"create":false,"read":true,"update":false,"delete":false},"mesas":{"create":true,"read":true,"update":true,"delete":false}}', true, NOW(), NOW()),
        ('funcionario', 'Funcionário padrão', '{"dashboard":{"create":false,"read":true,"update":false,"delete":false},"cardapio":{"create":false,"read":true,"update":false,"delete":false},"pedidos":{"create":true,"read":true,"update":true,"delete":false},"vendas":{"create":true,"read":true,"update":false,"delete":false},"estoque":{"create":false,"read":true,"update":false,"delete":false},"caixa":{"create":false,"read":false,"update":false,"delete":false},"relatorios":{"create":false,"read":false,"update":false,"delete":false},"configuracoes":{"create":false,"read":false,"update":false,"delete":false},"usuarios":{"create":false,"read":false,"update":false,"delete":false},"mesas":{"create":false,"read":true,"update":true,"delete":false}}', true, NOW(), NOW()),
        ('superadmin', 'Super Administrador do Sistema', '{"dashboard":{"create":true,"read":true,"update":true,"delete":true},"cardapio":{"create":true,"read":true,"update":true,"delete":true},"pedidos":{"create":true,"read":true,"update":true,"delete":true},"vendas":{"create":true,"read":true,"update":true,"delete":true},"estoque":{"create":true,"read":true,"update":true,"delete":true},"caixa":{"create":true,"read":true,"update":true,"delete":true},"relatorios":{"create":true,"read":true,"update":true,"delete":true},"configuracoes":{"create":true,"read":true,"update":true,"delete":true},"usuarios":{"create":true,"read":true,"update":true,"delete":true},"mesas":{"create":true,"read":true,"update":true,"delete":true}}', true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `)

    /**
     * Seed funcoes
     */
    await db.rawQuery(`
      INSERT INTO funcoes (name, description, created_at, updated_at)
      VALUES
        ('Atendente', 'Atendimento ao cliente', NOW(), NOW()),
        ('Cozinheiro', 'Preparação de alimentos', NOW(), NOW()),
        ('Gerente', 'Gerenciamento do estabelecimento', NOW(), NOW()),
        ('Caixa', 'Operação do caixa', NOW(), NOW()),
        ('Auxiliar de Cozinha', 'Auxílio na cozinha', NOW(), NOW()),
        ('Barman', 'Preparação de bebidas', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `)
  }
}
