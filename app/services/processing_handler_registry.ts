import { PedidoProcessingHandlers } from '#services/pedido_processing_handlers'
import { ComandaProcessingHandlers } from '#services/comanda_processing_handlers'
import { VendaProcessingHandlers } from '#services/venda_processing_handlers'
import { NfeProcessingHandlers } from '#services/nfe_processing_handlers'

const registry: Record<string, any> = {
  PedidoProcessingHandlers,
  ComandaProcessingHandlers,
  VendaProcessingHandlers,
  NfeProcessingHandlers,
}

export default class ProcessingHandlerRegistry {
  static resolve(serviceName: string): any | null {
    return registry[serviceName] || null
  }
}
