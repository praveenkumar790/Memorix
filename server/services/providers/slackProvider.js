const axios = require('axios');
const { BaseProvider } = require('./baseProvider');

class SlackProvider extends BaseProvider {
  constructor(accessToken) {
    super(accessToken);
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * List all public channels in the Slack workspace.
   */
  async listItems() {
    try {
      const response = await this.client.get('/conversations.list', {
        params: {
          types: 'public_channel',
          exclude_archived: true,
          limit: 100
        }
      });

      if (!response.data.ok) {
        throw new Error(`Slack API Error: ${response.data.error}`);
      }

      return response.data.channels.map(channel => ({
        external_id: channel.id,
        title: `#${channel.name}`,
        item_type: 'channel',
        external_updated_at: new Date(channel.updated * 1000).toISOString()
      }));
    } catch (error) {
      console.error('SlackProvider listItems Error:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch recent message history from a specific channel.
   * We concatenate the messages into a single text document for chunking.
   */
  async fetchContent(channelId) {
    try {
      // Fetch the last 100 messages from the channel
      const response = await this.client.get('/conversations.history', {
        params: {
          channel: channelId,
          limit: 100
        }
      });

      if (!response.data.ok) {
        throw new Error(`Slack API Error: ${response.data.error}`);
      }

      const messages = response.data.messages || [];
      
      // Reverse to get chronological order, filter out system messages (usually don't have text)
      // and map to a readable format
      const content = messages
        .filter(msg => msg.type === 'message' && msg.text)
        .reverse()
        .map(msg => `[User: ${msg.user || 'Unknown'}] ${msg.text}`)
        .join('\n\n');

      return content;
    } catch (error) {
      console.error('SlackProvider fetchContent Error:', error?.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = { SlackProvider };
