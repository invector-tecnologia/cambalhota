---
name: adonis-backend
description: >
  Padrões obrigatórios de implementação TypeScript/AdonisJS para o backend do tavolo.
  Ativar quando o agente eng for gerar código backend, criar controllers, services, models, migrations ou testes unitários.
---

# Padrões de Backend AdonisJS — tavolo

## 1. Visão Geral

O backend do tavolo é construído com a seguinte stack:

| Tecnologia         | Finalidade                                  |
|--------------------|---------------------------------------------|
| `AdonisJS v6`      | Framework Node.js/TypeScript MVC            |
| `Lucid ORM`        | Acesso ao PostgreSQL, Models e Migrations   |
| `Vine.js`          | Validação de dados (requests)               |
| `Japa`             | Test runner (unitários, funcionais)         |
| `Edge.js`          | Renderização de views (frontend acoplado)   |

> [!IMPORTANT]
> Todo código backend gerado DEVE seguir os padrões descritos neste documento.
> Respeite a separação de responsabilidades: Controllers magros, Services gordos.

---

## 2. Arquitetura e Camadas

### 2.1. Fluxo MVC Expandido
```
Router → Middleware → Controller → Service → Model (Lucid) → PostgreSQL
```

- **Router**: Configurado em `start/routes.ts`. Mapeia rotas para métodos dos Controllers.
- **Controller**: Trata a entrada HTTP, valida via `Vine.js`, invoca o Service, retorna a view ou JSON.
- **Service**: Concentra regras de negócio pesadas e regras multi-tenant (`app/services/`).
- **Model**: Herdado do Lucid (`BaseModel`). Define tipagens estáticas de tabela, relacionamentos, scopes.

---

## 3. Regras de Banco de Dados e Migrations

> [!CAUTION]
> NUNCA use o schema `public`. As tabelas devem estar sempre no schema `tavolo`.

### 3.1. Migrations

As migrations devem sempre prefixar a tabela com o schema ou forçar o `withSchema`:

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tavolo.animais' // ❌ Incorreto (acoplado à string da tabela)
  // ✅ CORRETO:
  
  async up() {
    this.schema.withSchema('tavolo').createTable('mesas', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('empresa_id').notNullable().references('id').inTable('tavolo.empresas')
      table.string('numero').notNullable()
      table.string('status').notNullable().defaultTo('livre')
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.withSchema('tavolo').dropTable('mesas')
  }
}
```

### 3.2. Models (Multi-tenancy)

Todos os modelos que pertencem a um restaurante devem possuir relacionamento com a `Empresa` e usar tipagem rigorosa.

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from '#models/empresa'

export default class Mesa extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare empresaId: string

  @column()
  declare numero: string

  @column()
  declare status: 'livre' | 'ocupada' | 'reservada'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Empresa)
  declare empresa: BelongsTo<typeof Empresa>
}
```

---

## 4. Validação (Vine.js)

Não faça validações de corpo de requisição com "ifs" manuais. Use Vine.js dentro do Controller.

```typescript
// app/validators/mesa_validator.ts
import vine from '@vinejs/vine'

export const criarMesaValidator = vine.compile(
  vine.object({
    numero: vine.string().trim().minLength(1).maxLength(10),
    status: vine.enum(['livre', 'ocupada', 'reservada']).optional(),
  })
)
```

```typescript
// app/controllers/mesas_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { criarMesaValidator } from '#validators/mesa_validator'
import MesaService from '#services/mesa_service'

export default class MesasController {
  async store({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(criarMesaValidator)
    const empresaId = auth.user!.empresaId // Multi-tenancy isolado
    
    const mesa = await MesaService.criarMesa(empresaId, data)
    return response.created(mesa)
  }
}
```

---

## 5. Serviços (Lógica de Negócio)

Os services são classes utilitárias ou Singletons para realizar as lógicas pesadas.

```typescript
// app/services/mesa_service.ts
import Mesa from '#models/mesa'

export default class MesaService {
  static async criarMesa(empresaId: string, payload: { numero: string, status?: string }) {
    // Verifica duplicidade no mesmo tenant
    const existente = await Mesa.query()
      .where('empresaId', empresaId)
      .where('numero', payload.numero)
      .first()

    if (existente) {
      throw new Error('Mesa com este número já existe no estabelecimento.')
    }

    return Mesa.create({
      empresaId,
      numero: payload.numero,
      status: (payload.status as any) || 'livre'
    })
  }
}
```

---

## 6. Testes com Japa

Sempre implemente testes usando a API do Japa (`node ace test`).

```typescript
// tests/functional/mesas.spec.ts
import { test } from '@japa/runner'
import User from '#models/user'

test.group('Mesas', (group) => {
  test('cria uma nova mesa isolada por empresa', async ({ client }) => {
    const user = await User.find(1) // Helper de mock
    
    const response = await client.post('/api/mesas')
      .loginAs(user)
      .json({
        numero: '12'
      })

    response.assertStatus(201)
    response.assertBodyContains({ numero: '12' })
  })
})
```
