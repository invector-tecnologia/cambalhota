import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ProcessingRule from '#models/processing_rule'

const DEFAULT_PROCESSING_RULES = [
  {
    name: 'Reserva de Insumos',
    type: 'stock_reservation',
    priority: 90,
    appliedTo: 'pedido',
    handler: 'PedidoProcessingHandlers.reserveInsumos',
    description: 'Reserva insumos quando um pedido é criado',
  },
  {
    name: 'Dedução de Insumos',
    type: 'stock_deduction',
    priority: 85,
    appliedTo: 'pedido',
    handler: 'PedidoProcessingHandlers.deductInsumos',
    description: 'Deduz insumos do estoque quando pedido fica pronto',
  },
  {
    name: 'Liberação de Insumos',
    type: 'stock_reservation',
    priority: 80,
    appliedTo: 'pedido',
    handler: 'PedidoProcessingHandlers.releaseInsumos',
    description: 'Libera reservas de insumos quando pedido é cancelado',
  },
  {
    name: 'Aplicar Desconto',
    type: 'discount_apply',
    priority: 75,
    appliedTo: 'venda',
    handler: 'VendaProcessingHandlers.applyDiscount',
    description: 'Aplica desconto à venda',
  },
  {
    name: 'Aplicar Taxa de Serviço',
    type: 'custom',
    priority: 74,
    appliedTo: 'venda',
    handler: 'VendaProcessingHandlers.applyServiceCharge',
    description: 'Aplica taxa de serviço à venda',
  },
  {
    name: 'Calcular Lucro',
    type: 'custom',
    priority: 73,
    appliedTo: 'venda',
    handler: 'VendaProcessingHandlers.calculateProfit',
    description: 'Calcula margem de lucro da venda',
  },
  {
    name: 'Vincular Venda ao Pedido',
    type: 'custom',
    priority: 72,
    appliedTo: 'venda',
    handler: 'VendaProcessingHandlers.linkToPedido',
    description: 'Vincula venda ao pedido e marca como pago',
  },
  {
    name: 'Processar NFe',
    type: 'nfe_emit',
    priority: 88,
    appliedTo: 'nfe',
    handler: 'NfeProcessingHandlers.processNfe',
    description: 'Processa XML da NFe e cria registros de insumos',
  },
  {
    name: 'Aplicar Entrada em Estoque',
    type: 'stock_reservation',
    priority: 87,
    appliedTo: 'nfe',
    handler: 'NfeProcessingHandlers.applyStockEntry',
    description: 'Aplica entrada de estoque baseada em NFe processada',
  },
  {
    name: 'Validar Integridade da NFe',
    type: 'custom',
    priority: 95,
    appliedTo: 'nfe',
    handler: 'NfeProcessingHandlers.validateIntegrity',
    description: 'Valida integridade e duplicidade da NFe',
  },
  {
    name: 'Verificar e Fechar Comanda',
    type: 'comanda_closing',
    priority: 70,
    appliedTo: 'comanda',
    handler: 'ComandaProcessingHandlers.checkAndCloseIfCompleted',
    description: 'Verifica se todos os pedidos foram pagos e fecha comanda',
  },
  {
    name: 'Recalcular Totais da Comanda',
    type: 'custom',
    priority: 71,
    appliedTo: 'comanda',
    handler: 'ComandaProcessingHandlers.recalculateTotals',
    description: 'Recalcula totais da comanda baseado em seus pedidos',
  },
  {
    name: 'Sincronizar Status da Comanda',
    type: 'pedido_status_sync',
    priority: 79,
    appliedTo: 'pedido',
    handler: 'PedidoProcessingHandlers.syncComandaStatus',
    description: 'Sincroniza status da comanda quando pedido é pago',
  },
]

export default class ProcessingRuleSeeder extends BaseSeeder {
  async run() {
    // Este seeder deve ser executado por empresa
    // Para cada empresa existente, criar as regras padrão
    const empresaModule = await import('#models/empresa')
    const Empresa = empresaModule.default
    const empresas = await Empresa.all()

    for (const empresa of empresas) {
      console.log(`  Creating default rules for empresa ${empresa.id} (${empresa.razaoSocial})...`)

      for (const ruleData of DEFAULT_PROCESSING_RULES) {
        // Verificar se regra já existe
        const exists = await ProcessingRule.query()
          .where('empresa_id', empresa.id)
          .where('name', ruleData.name)
          .first()

        if (!exists) {
          await ProcessingRule.create({
            empresaId: empresa.id,
            name: ruleData.name,
            type: ruleData.type as any,
            priority: ruleData.priority,
            appliedTo: ruleData.appliedTo as any,
            handler: ruleData.handler,
            description: ruleData.description,
            enabled: true,
            config: null,
          })
        }
      }
    }
  }
}
