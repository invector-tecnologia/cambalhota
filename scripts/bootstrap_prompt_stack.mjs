import fs from 'node:fs/promises'
import path from 'node:path'

const stackNameArg = process.argv[2]

if (!stackNameArg || !stackNameArg.trim()) {
  console.error('Uso: node scripts/bootstrap_prompt_stack.mjs <STACK_NAME>')
  process.exit(1)
}

const stackName = stackNameArg.trim()
const workspaceRoot = process.cwd()
const targetDir = path.join(workspaceRoot, 'docs', 'prompt-migration', stackName)

const templates = [
  {
    filename: '01-system-overview.md',
    title: 'Visao Geral do Sistema',
    objective: 'Construir um panorama do escopo, modulos e responsabilidades principais.',
    context: 'README, docs principais, package.json e estrutura de pastas relevantes.',
  },
  {
    filename: '02-architecture.md',
    title: 'Arquitetura',
    objective: 'Mapear componentes, fronteiras e fluxo ponta a ponta.',
    context: 'Controllers, services, providers, middlewares e integracoes externas.',
  },
  {
    filename: '03-data-model.md',
    title: 'Modelo de Dados',
    objective: 'Identificar entidades, relacoes e campos criticos para operacao.',
    context: 'Models, migrations e docs de dominio.',
  },
  {
    filename: '04-runtime-config.md',
    title: 'Configuracao de Runtime',
    objective: 'Mapear variaveis de ambiente, defaults e riscos de configuracao.',
    context: 'Config files, env docs e scripts operacionais.',
  },
  {
    filename: '05-observability.md',
    title: 'Observabilidade',
    objective: 'Definir sinais, logs e trilhas de diagnostico para incidentes.',
    context: 'LOGGING, handlers de erro, cloud logs e comandos de debug.',
  },
  {
    filename: '06-routing-and-http.md',
    title: 'Roteamento e HTTP',
    objective: 'Documentar grupos de rota, auth, middleware e contratos HTTP.',
    context: 'start/routes.ts, controllers HTTP, middleware e docs API.',
  },
  {
    filename: '07-domain-module.md',
    title: 'Fluxo de Dominio',
    objective: 'Descrever regras de negocio e maquina de estados do modulo.',
    context: 'Services de dominio, validators e docs funcionais.',
  },
  {
    filename: '08-tests-and-quality.md',
    title: 'Testes e Qualidade',
    objective: 'Mapear cobertura, lacunas e gates de qualidade.',
    context: 'tests, scripts de quality, typecheck/lint/build e docs de teste.',
  },
  {
    filename: '09-deployment.md',
    title: 'Deploy e Operacao',
    objective: 'Documentar checklist de release, smoke tests e rollback.',
    context: 'DEPLOYMENT, Procfile, scripts de release e operacao.',
  },
  {
    filename: '10-performance-db.md',
    title: 'Performance e Banco',
    objective: 'Identificar gargalos de consulta, throughput e backlog.',
    context: 'Queries pesadas, indices, jobs em lote e docs de performance.',
  },
  {
    filename: '11-performance-diagnostics.md',
    title: 'Diagnostico de Performance',
    objective: 'Definir processo de RCA com sinais e verificacoes objetivas.',
    context: 'Incidentes historicos, logs, traces e docs de troubleshooting.',
  },
]

function buildTemplate({ title, objective, context }) {
  return `# Prompt - ${title}\n\nRole: Voce esta atuando como analista tecnico da stack ${stackName}.\nObjetivo: ${objective}\nTom: Analitico para aquisicao de contexto. Diretivo para passos de acao.\n\nContexto\n- Fontes prioritarias: ${context}\n\nPedido\n1) Resuma os pontos centrais com evidencias.\n2) Liste riscos e limites conhecidos.\n3) Marque lacunas de informacao e como verificar.\n4) Se houver acao solicitada, gere plano numerado e verificavel.\n\nFormato de saida\n- Context Summary (8-12 bullets)\n- Source Map (arquivos/URLs usados)\n- Open Questions (apenas se houver)\n- Action Plan (quando houver acao solicitada)\n\nRestricoes\n- Nao invente detalhes.\n- Baseie afirmacoes em evidencias do repositorio ou docs oficiais.\n- Responda em PT-BR, salvo instrucao contraria.\n`
}

await fs.mkdir(targetDir, { recursive: true })

for (const template of templates) {
  const filePath = path.join(targetDir, template.filename)
  try {
    await fs.access(filePath)
    console.log(`SKIP  ${path.relative(workspaceRoot, filePath)} (ja existe)`)
  } catch {
    await fs.writeFile(filePath, buildTemplate(template), 'utf8')
    console.log(`CREATE ${path.relative(workspaceRoot, filePath)}`)
  }
}

console.log('Concluido. Revise os arquivos gerados e atualize docs/prompt-migration/README.md.')
