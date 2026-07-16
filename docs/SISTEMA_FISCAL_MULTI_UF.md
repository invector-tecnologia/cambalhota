# Sistema fiscal multi-UF

## Rotas relacionadas

- API: /api/fiscal/*

## Objetivo

Suportar emissao de NFC-e em todas as UFs com roteamento automatico para a SEFAZ correta.

## Componentes chave

- FiscalRoutingService (resolve endpoints por UF e ambiente)
- FiscalTransmitter (usa endpoints resolvidos)
- FiscalService (valida UF e preenche uf/serie/numero na nota)

## Migrations

Rodar a migration multi-UF para adicionar uf/serie/numero e indices.

## Como usar

1. Configure o estado da empresa (empresa.state ou state_override).
2. Emita via POST /api/fiscal/emit com venda_id.
3. A nota salva uf/serie/numero automaticamente.

## Mapeamento de UFs (resumo)

- SVRS: AC, AL, AP, DF, ES, PB, RJ, RN, RO, RR, SC, SE, TO
- SVAN: MA
- SEFAZ PROPRIA: AM, BA, CE, GO, MG, MS, MT, PA, PE, PI, PR, RS, SP
