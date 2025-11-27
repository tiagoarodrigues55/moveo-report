# Relatório Moveo

Aplicação Next.js para análise visual de conversas e ERV da plataforma Moveo.ai

## Instalação

```bash
npm install
```

## Configuração

As credenciais da API já estão configuradas no arquivo `.env.local`

## Execução

```bash
npm run dev
```

Acesse: http://localhost:3000

## Funcionalidades

- Filtro de período (última semana, último mês, todo período)
- Análise de conversas por etapas de interação (>3, >5, >7, >10)
- Métricas de volume, ERV médio e ERV total
- Análise por tags (nao_conheco, sou_eu, bloquear)
- Gráficos de evolução linear
- Design minimalista e profissional

## Tecnologias

- Next.js 14
- React
- Tailwind CSS
- Recharts
- Axios
