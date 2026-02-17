/**
 * Generate namespace for Pinecone based on company and role
 * Format: ns-{companyId}-{roleName}
 */
function generateNamespace(user) {
  const companyId = user.company_id || 'unknown';
  const roleName = (user.role_name || user.role || 'general').toLowerCase().replace(/\s+/g, '-');
  return `ns-${companyId}-${roleName}`;
}

module.exports = { generateNamespace };
