const supabase = require('../config/supabase');

/**
 * Wraps any provider API call with a 401 handler.
 * If the token is expired or revoked, marks the integration as 'error'
 * so the frontend can show a "Reconnect" CTA to the user.
 *
 * Usage:
 *   const data = await withTokenRefresh(integration, () =>
 *     notionClient.search({ auth: token })
 *   );
 *
 * @param {object} integration - The integration row from the DB (must have .id)
 * @param {Function} apiCall   - An async function that makes the provider API call
 * @returns {Promise<any>}     - The result of the API call
 */
async function withTokenRefresh(integration, apiCall) {
  try {
    return await apiCall();
  } catch (err) {
    // Catch 401 Unauthorized — token was revoked or expired
    const isAuthError =
      err.status === 401 ||
      err.code === 'unauthorized' ||
      err.message?.toLowerCase().includes('unauthorized');

    if (isAuthError) {
      // Mark the integration as errored so the frontend shows "Reconnect"
      await supabase
        .from('integrations')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', integration.id);

      throw new Error(
        `Integration token expired or revoked for provider "${integration.provider}". ` +
        `Please reconnect it in the Integrations page.`
      );
    }

    // Re-throw all other errors unchanged
    throw err;
  }
}

module.exports = { withTokenRefresh };
