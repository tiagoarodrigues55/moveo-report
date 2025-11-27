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
    base_url: 'https://api.moveo.ai',
    tag_key: 'sou_eu',
    erv_variable: 'ERV',
    display_name: 'Smart Compass'
  },
  // Add more clients as needed
  // 'client-2-slug': {
  //   desk_id: 'xxx',
  //   api_key: 'xxx',
  //   account_slug: 'client-2-slug',
  //   base_url: 'https://api.moveo.ai',
  //   tag_key: 'custom_tag',
  //   erv_variable: 'DEBT_VALUE',
  //   display_name: 'Client 2'
  // },
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
