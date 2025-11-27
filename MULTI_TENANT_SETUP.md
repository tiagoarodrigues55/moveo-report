# Multi-Tenant Setup Guide

Este projeto suporta múltiplos clientes, cada um com suas próprias configurações e credenciais.

## Estrutura de Arquivos

```
moveo-report/
├── config/
│   └── clients.js          # Configurações dos clientes
├── app/
│   ├── page.js             # Página inicial (lista de clientes)
│   ├── [account_slug]/
│   │   └── page.js         # Dashboard dinâmico por cliente
│   └── api/
│       └── [account_slug]/
│           └── conversations/
│               └── route.js # API dinâmica por cliente
```

## Como Adicionar um Novo Cliente

### 1. Editar o arquivo `config/clients.js`

Adicione uma nova entrada no objeto `clientConfigs`:

```javascript
export const clientConfigs = {
  'smart-compass': {
    desk_id: process.env.DESK_ID,
    api_key: process.env.API_KEY,
    account_slug: process.env.ACCOUNT_SLUG,
    base_url: process.env.BASE_URL || 'https://api.moveo.ai',
    tag_key: 'sou_eu',
    erv_variable: 'ERV',
    display_name: 'Smart Compass'
  },
  'novo-cliente': {
    desk_id: 'desk_id_do_cliente',
    api_key: 'api_key_do_cliente',
    account_slug: 'novo-cliente',
    base_url: 'https://api.moveo.ai',
    tag_key: 'tag_principal',       // Tag principal para análise
    erv_variable: 'VALOR_DIVIDA',   // Nome da variável no live_instructions
    display_name: 'Novo Cliente'
  }
};
```

### 2. Configuração dos Parâmetros

Cada cliente possui os seguintes parâmetros:

- **desk_id**: ID do desk no Moveo
- **api_key**: Chave de API do Moveo
- **account_slug**: Slug da conta (usado na URL)
- **base_url**: URL base da API do Moveo
- **tag_key**: Nome da tag principal para análise detalhada (ex: 'sou_eu', 'interessado', etc.)
- **erv_variable**: Nome da variável que contém o valor da dívida/ERV no `live_instructions`
- **display_name**: Nome amigável do cliente (exibido no dashboard)

### 3. Estrutura de URLs

Após adicionar um cliente, as seguintes URLs estarão disponíveis:

- **Home**: `http://localhost:3000/` - Lista todos os clientes configurados
- **Dashboard do Cliente**: `http://localhost:3000/[account_slug]` - Dashboard específico do cliente
- **API do Cliente**: `http://localhost:3000/api/[account_slug]/conversations?period=week`

Exemplo:
```
http://localhost:3000/smart-compass
http://localhost:3000/api/smart-compass/conversations?period=month
```

## Variáveis de Ambiente

O primeiro cliente pode usar variáveis de ambiente do `.env.local`:

```env
DESK_ID=seu_desk_id
API_KEY=sua_api_key
ACCOUNT_SLUG=seu_account_slug
BASE_URL=https://api.moveo.ai
```

Para clientes adicionais, você pode:
1. Adicionar diretamente no `config/clients.js`
2. Criar variáveis de ambiente adicionais (ex: `DESK_ID_CLIENT2`, `API_KEY_CLIENT2`)

## Customização por Cliente

### Tag Principal (tag_key)

Cada cliente pode ter uma tag principal diferente para análise. Esta tag será usada para:
- Análise detalhada com tabelas e gráficos específicos
- Gráficos de evolução por interações
- Cálculo de ERV por tag

Exemplos de tags:
- `sou_eu` - Cliente confirmou ser o responsável
- `interessado` - Cliente demonstrou interesse
- `qualificado` - Cliente passou pela qualificação

### Variável de Valor (erv_variable)

Cada cliente pode ter uma variável diferente que armazena o valor da dívida/ERV no objeto `live_instructions` da conversa.

Exemplos:
- `ERV` - Valor Estimado da Recuperação
- `VALOR_DIVIDA` - Valor da Dívida
- `DEBT_VALUE` - Valor da Dívida (inglês)
- `VALOR_TOTAL` - Valor Total

## Exemplo Completo

```javascript
export const clientConfigs = {
  // Cliente 1 - Smart Compass (usando .env)
  'smart-compass': {
    desk_id: process.env.DESK_ID,
    api_key: process.env.API_KEY,
    account_slug: process.env.ACCOUNT_SLUG,
    base_url: process.env.BASE_URL || 'https://api.moveo.ai',
    tag_key: 'sou_eu',
    erv_variable: 'ERV',
    display_name: 'Smart Compass'
  },

  // Cliente 2 - Empresa XYZ
  'empresa-xyz': {
    desk_id: 'xyz_desk_123',
    api_key: 'xyz_api_key_456',
    account_slug: 'empresa-xyz',
    base_url: 'https://api.moveo.ai',
    tag_key: 'interessado',
    erv_variable: 'VALOR_DIVIDA',
    display_name: 'Empresa XYZ'
  },

  // Cliente 3 - Cobrança ABC
  'cobranca-abc': {
    desk_id: 'abc_desk_789',
    api_key: 'abc_api_key_012',
    account_slug: 'cobranca-abc',
    base_url: 'https://api.moveo.ai',
    tag_key: 'qualificado',
    erv_variable: 'DEBT_VALUE',
    display_name: 'Cobrança ABC'
  }
};
```

## Como Testar

1. Adicione o novo cliente no `config/clients.js`
2. Reinicie o servidor de desenvolvimento: `npm run dev`
3. Acesse `http://localhost:3000/`
4. Clique no botão do novo cliente
5. Verifique se o dashboard carrega corretamente com os dados do cliente

## Segurança

**IMPORTANTE**: Nunca faça commit de credenciais reais no arquivo `config/clients.js`.

Opções seguras:
1. Use variáveis de ambiente para todos os clientes
2. Crie um arquivo `config/clients.local.js` e adicione ao `.gitignore`
3. Use um serviço de gerenciamento de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)

## Troubleshooting

### Cliente não aparece na lista
- Verifique se o slug está correto no `config/clients.js`
- Reinicie o servidor de desenvolvimento

### Erro 404 ao acessar dashboard
- Verifique se o `account_slug` está correto
- Confirme que o cliente existe no `config/clients.js`

### Dados não carregam
- Verifique as credenciais (desk_id, api_key)
- Confirme que o `account_slug` está correto na API do Moveo
- Verifique a variável `erv_variable` no `live_instructions`
- Confirme que a `tag_key` existe nas conversas

### Tag principal não aparece
- Verifique se a tag existe nas conversas
- Confirme que o nome da tag está correto (case-sensitive)
- A seção só aparece se houver conversas com aquela tag
