/**
 * Client Configuration
 *
 * This file maps account slugs to their respective credentials and settings.
 * Each client has their own set of API credentials, tags, and custom variables.
 */

export const clientConfigs = {
  'smart-compass': {
    desk_id: "b9bfa0df-9ef2-4e9f-813e-fd74302743a4",
    api_key: "manage_vdVf3KsisgkLCBJ2wpBP5",
    account_slug: "smart-compass",
    tag_key: 'sou_eu',
    erv_variable: 'ERV',
    display_name: 'Smart Compass',
    funnel_tags: ['nao_conheco', 'sou_eu', 'bloquear']
  },
  'sicoob': {
    desk_id: "23ef7489-45c6-42c0-95d8-a1205f3d34ea",
    api_key: "manage_3u38b9xJNN8RbU1uxo1VT",
    account_slug: "sicoob",
    tag_key: 'conte_mais',
    erv_variable: 'TOTAL_ATRASO',
    display_name: 'Sicoob',
    funnel_tags: ['nao_conheco', 'conte_mais', 'bloquear']
  },
  "tcadvocacia": {
    desk_id: "4d98e5f4-fd48-4ea3-a716-d03966b7aae0",
    api_key: "manage_Q3n3_4Wkb3jyGFKDo_G0l",
    account_slug: "tcadvocacia",
    tag_key: 'Quero_negociar',
    erv_variable: 'total_do_debito',
    display_name: 'TC Advocacia',
    funnel_tags: ['nao_conheco', 'Quero_negociar', 'bloquear']
  },

  "oi-mobi-2": {
    desk_id: "75d58ca2-3d18-4051-98fa-f5db5e56ff92",
    api_key: "manage_fc4sY19DTtkRCkPZ3OA_W",
    account_slug: "oimobi2buy",
    tag_key: 'cpc_sim_abatimento',
    erv_variable: 'amountBr',
    live_instructions: true,
    display_name: 'Oi Mobi 2',
    funnel_tags: ['cpc_nao', 'cpc_sim_abatimento', 'nao_quer_receber_informe']
  },
  "oi-mobi-inbox": {
    desk_id: "93db94a5-23d4-48da-8853-1f678286f0ca",
    api_key: "manage_fc4sY19DTtkRCkPZ3OA_W",
    account_slug: "oimobi2buy",
    tag_key: 'cpc_sim_abatimento',
    erv_variable: 'amountBr',
    live_instructions: true,
    display_name: 'Oi Mobi Inbox',
    funnel_tags: ['cpc_nao', 'cpc_sim_abatimento', 'nao_quer_receber_informe']
  }

};

/**
 * Get client configuration by account slug
 * @param {string} accountSlug - The account slug to look up
 * @returns {Object|null} - The client configuration or null if not found
 */
export function getClientConfig(accountSlug) {
  return clientConfigs[accountSlug] || null;
}

/**
 * Get all available account slugs
 * @returns {string[]} - Array of all configured account slugs
 */
export function getAllAccountSlugs() {
  return Object.keys(clientConfigs);
}
