/**
 * Generate namespace for Pinecone based on workspace
 * Format: ns-{workspaceId}
 */
function generateNamespace(user) {
  const workspaceId = user.workspace_id || 'unknown';
  return `ns-${workspaceId}`;
}

module.exports = { generateNamespace };
