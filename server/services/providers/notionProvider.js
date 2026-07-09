const { Client } = require('@notionhq/client');
const { BaseProvider } = require('./baseProvider');

/**
 * NotionProvider — fetches pages and content from a user's Notion workspace.
 *
 * Uses the official @notionhq/client SDK.
 * Extends BaseProvider so it can be swapped with any other provider
 * in syncService.js without changing the sync logic.
 */
class NotionProvider extends BaseProvider {
  /**
   * @param {string} accessToken - Decrypted Notion OAuth access token
   */
  constructor(accessToken) {
    super(accessToken);
    this.client = new Client({ auth: accessToken });
  }

  /**
   * Lists up to 50 pages the user has shared with this Notion integration.
   * Sorted by most recently edited first.
   * @returns {Promise<Array>}
   */
  async listItems() {
    const res = await this.client.search({
      filter: { property: 'object', value: 'page' },
      page_size: 50,
      sort: { direction: 'descending', timestamp: 'last_edited_time' }
    });

    return res.results.map(page => ({
      external_id: page.id,
      // Notion pages can have different title property names
      title:
        page.properties?.title?.title?.[0]?.plain_text ||
        page.properties?.Name?.title?.[0]?.plain_text ||
        page.properties?.['Page']?.title?.[0]?.plain_text ||
        'Untitled',
      item_type: 'page',
      url: page.url,
      external_updated_at: page.last_edited_time
    }));
  }

  /**
   * Fetches and converts a Notion page's block content to plain text.
   * Handles heading levels with markdown-style markers for better chunking context.
   * @param {string} pageId - The Notion page ID
   * @returns {Promise<string>} - Plain text content ready for chunking
   */
  async fetchContent(pageId) {
    const blocks = await this.client.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    return this._blocksToText(blocks.results);
  }

  /**
   * Converts an array of Notion block objects into a plain text string.
   * Skips unsupported block types (images, videos, embeds, etc.)
   * @param {Array} blocks - Raw block objects from Notion API
   * @returns {string}
   */
  _blocksToText(blocks) {
    return blocks
      .map(block => {
        const type = block.type;
        const content = block[type];

        // Most text blocks have a rich_text array
        if (!content?.rich_text) return '';

        const text = content.rich_text
          .map(t => t.plain_text)
          .join('');

        // Preserve heading structure as markdown for better semantic chunking
        if (type === 'heading_1') return `\n# ${text}\n`;
        if (type === 'heading_2') return `\n## ${text}\n`;
        if (type === 'heading_3') return `\n### ${text}\n`;

        // Bullet and numbered list items
        if (type === 'bulleted_list_item') return `• ${text}`;
        if (type === 'numbered_list_item') return `${text}`;

        // Code blocks — wrap with backticks so chunker knows it's code
        if (type === 'code') return `\`\`\`\n${text}\n\`\`\``;

        // Quote, callout, toggle — treat as regular paragraph text
        return text;
      })
      .filter(Boolean)
      .join('\n');
  }
}

module.exports = { NotionProvider };
