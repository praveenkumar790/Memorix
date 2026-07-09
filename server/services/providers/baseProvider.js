/**
 * BaseProvider — Abstract base class for all knowledge source providers.
 *
 * Every provider (Notion, Slack, Confluence) must extend this class
 * and implement the three methods below.
 *
 * This pattern means:
 * - syncService.js never needs to know which provider it's talking to
 * - Adding a new provider (e.g. GitHub) = create a new file, extend BaseProvider, done
 * - All providers are guaranteed to have the same interface
 */
class BaseProvider {
  /**
   * @param {string} accessToken - Decrypted OAuth access token for this integration
   */
  constructor(accessToken) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract — instantiate a concrete provider instead (e.g. NotionProvider)');
    }
    this.accessToken = accessToken;
  }

  /**
   * List all available items (pages, channels, databases) from the provider.
   * @returns {Promise<Array<{external_id, title, item_type, external_updated_at}>>}
   */
  async listItems() {
    throw new Error(`${this.constructor.name} must implement listItems()`);
  }

  /**
   * Fetch the full text content of a single item by its provider ID.
   * @param {string} itemId - The provider's own ID (e.g. Notion page ID)
   * @returns {Promise<string>} - Plain text content, ready for chunking
   */
  async fetchContent(itemId) {
    throw new Error(`${this.constructor.name} must implement fetchContent()`);
  }
}

module.exports = { BaseProvider };
