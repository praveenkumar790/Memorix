const { BaseProvider } = require('./baseProvider');
const axios = require('axios');

/**
 * GitHubProvider — fetches documentation files from GitHub repositories.
 *
 * Follows the same BaseProvider contract as NotionProvider, SlackProvider, etc.
 * syncService.js can use it without any changes to the sync logic itself.
 *
 * What it syncs:
 * - Files under /docs, /adr, /architecture, /decisions directories
 * - README.md, ARCHITECTURE.md, CONTRIBUTING.md at repo root
 * - Any .md, .txt, .rst file in the above paths
 */

const SYNC_PATHS = ['docs/', 'adr/', 'architecture/', 'decisions/', 'doc/'];
const ROOT_FILES = ['readme.md', 'architecture.md', 'contributing.md', 'overview.md'];
const TEXT_EXTENSIONS = ['.md', '.txt', '.rst', '.adoc'];
const MAX_REPOS = 5;
const MAX_FILES_PER_REPO = 20;

class GitHubProvider extends BaseProvider {
  /**
   * @param {string} accessToken - Decrypted GitHub OAuth access token
   */
  constructor(accessToken) {
    super(accessToken);
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    });
  }

  /**
   * Lists documentation files from the user's repos that match our sync paths.
   * Returns items in the BaseProvider format for syncService.js.
   * @returns {Promise<Array<{external_id, title, item_type, external_updated_at}>>}
   */
  async listItems() {
    const { data: repos } = await this.client.get(
      '/user/repos?per_page=30&sort=updated&visibility=all'
    );

    const items = [];

    for (const repo of repos.slice(0, MAX_REPOS)) {
      try {
        const files = await this._getDocFiles(repo.full_name, repo.default_branch || 'main');
        files.forEach(file => {
          items.push({
            // external_id encodes both repo and path so fetchContent can reconstruct them
            external_id: `${repo.full_name}::${file.path}`,
            title: `${repo.name} / ${file.path}`,
            item_type: 'file',
            external_updated_at: repo.updated_at,
            url: `https://github.com/${repo.full_name}/blob/${repo.default_branch || 'main'}/${file.path}`
          });
        });
      } catch (err) {
        // Skip repos we can't read (private, archived, no tree access)
        console.warn(`[GitHubProvider] Skipping repo ${repo.full_name}: ${err.message}`);
        continue;
      }
    }

    return items;
  }

  /**
   * Fetches the full text content of a single file from GitHub.
   * GitHub returns base64-encoded content in the contents API.
   * @param {string} itemId - Format: "owner/repo::path/to/file.md"
   * @returns {Promise<string>} - Decoded UTF-8 text content
   */
  async fetchContent(itemId) {
    const separatorIndex = itemId.indexOf('::');
    if (separatorIndex === -1) throw new Error(`Invalid GitHub itemId format: ${itemId}`);

    const repoFullName = itemId.slice(0, separatorIndex);
    const filePath = itemId.slice(separatorIndex + 2);

    const { data } = await this.client.get(
      `/repos/${repoFullName}/contents/${filePath}`
    );

    if (!data.content) throw new Error(`No content returned for ${filePath}`);

    // GitHub returns base64 with newlines every 60 chars — strip them before decoding
    const cleaned = data.content.replace(/\n/g, '');
    return Buffer.from(cleaned, 'base64').toString('utf-8');
  }

  /**
   * Walks the repository file tree and returns files matching doc paths/extensions.
   * Uses the git trees API (single request) rather than recursive directory listing.
   * @param {string} repoFullName - e.g. "octocat/Hello-World"
   * @param {string} branch - default branch name
   * @returns {Promise<Array<{path: string}>>}
   */
  async _getDocFiles(repoFullName, branch) {
    const { data } = await this.client.get(
      `/repos/${repoFullName}/git/trees/${branch}?recursive=1`
    );

    if (!data.tree) return [];

    return data.tree
      .filter(node => {
        if (node.type !== 'blob') return false;
        const lowerPath = node.path.toLowerCase();
        const hasTextExt = TEXT_EXTENSIONS.some(ext => lowerPath.endsWith(ext));
        if (!hasTextExt) return false;

        // Allow root-level doc files
        const isRootDocFile = !lowerPath.includes('/') && ROOT_FILES.includes(lowerPath);
        // Allow files inside documentation directories
        const isInDocDir = SYNC_PATHS.some(dir => lowerPath.startsWith(dir));

        return isRootDocFile || isInDocDir;
      })
      .slice(0, MAX_FILES_PER_REPO);
  }
}

module.exports = { GitHubProvider };
