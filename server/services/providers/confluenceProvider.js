const axios = require('axios');
const { BaseProvider } = require('./baseProvider');

class ConfluenceProvider extends BaseProvider {
  constructor(accessToken) {
    super(accessToken);
    this.client = axios.create({
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });
    this.cloudId = null;
  }

  /**
   * Helper to fetch the first accessible Confluence Cloud ID for the user.
   */
  async getCloudId() {
    if (this.cloudId) return this.cloudId;
    
    const response = await this.client.get('https://api.atlassian.com/oauth/token/accessible-resources');
    const resources = response.data;
    
    // Find the first Confluence resource
    const confluenceResource = resources.find(r => r.scopes.some(s => s.includes('confluence')));
    if (!confluenceResource) {
      // If we can't find a specifically scoped one, just take the first one
      if (resources.length > 0) {
        this.cloudId = resources[0].id;
      } else {
        throw new Error('No accessible Atlassian resources found for this token.');
      }
    } else {
      this.cloudId = confluenceResource.id;
    }
    
    return this.cloudId;
  }

  /**
   * List available pages in Confluence.
   */
  async listItems() {
    try {
      const cloudId = await this.getCloudId();
      
      const response = await this.client.get(`https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages`, {
        params: {
          limit: 100 // Get up to 100 pages for MVP
        }
      });

      return response.data.results.map(page => ({
        external_id: page.id,
        title: page.title,
        item_type: 'page',
        external_updated_at: page.createdAt // v2 API uses createdAt/version.createdAt
      }));
    } catch (error) {
      console.error('ConfluenceProvider listItems Error:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch plain text content of a specific Confluence page.
   */
  async fetchContent(pageId) {
    try {
      const cloudId = await this.getCloudId();
      
      const response = await this.client.get(`https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages/${pageId}?body-format=storage`);
      
      let htmlContent = '';
      if (response.data.body && response.data.body.storage) {
        htmlContent = response.data.body.storage.value;
      }

      // Simple HTML stripper for Confluence storage format (MVP approach)
      const plainText = htmlContent
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();

      return plainText;
    } catch (error) {
      console.error('ConfluenceProvider fetchContent Error:', error?.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = { ConfluenceProvider };
