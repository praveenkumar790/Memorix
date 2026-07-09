const { model } = require('../config/gemini');

/**
 * Classifies a document by type and extracts mentioned technology stack.
 * Uses the first 2000 characters of extracted text — enough context, low token cost.
 *
 * @param {string} textSample - First N chars of extracted document text
 * @returns {Promise<{ doc_type: string, technologies: string[] }>}
 *
 * doc_type values: 'adr' | 'runbook' | 'policy' | 'api_spec' | 'readme' | 'general'
 */
async function classifyDocument(textSample) {
  if (!textSample || textSample.trim().length < 50) {
    return { doc_type: 'general', technologies: [] };
  }

  const prompt = `You are a technical document classifier. Analyze the following document excerpt and respond ONLY with valid JSON (no markdown, no code fences, no extra text).

Choose doc_type from exactly one of: adr, runbook, policy, api_spec, readme, general
- adr: Architecture Decision Record (documents a technical decision and its rationale)
- runbook: Operational runbook or incident playbook
- policy: Company or team policy, process guide, or compliance doc
- api_spec: API documentation, OpenAPI/Swagger, endpoint reference
- readme: README, onboarding guide, getting started doc
- general: Anything else

Extract up to 8 technology names mentioned (e.g. postgres, redis, react, kubernetes, aws, graphql). Use lowercase.

Respond with ONLY this JSON:
{"doc_type":"<type>","technologies":["<tech1>","<tech2>"]}

Document excerpt:
"""
${textSample.slice(0, 2000)}
"""`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    // Validate and sanitize response
    const validTypes = ['adr', 'runbook', 'policy', 'api_spec', 'readme', 'general'];
    return {
      doc_type: validTypes.includes(parsed.doc_type) ? parsed.doc_type : 'general',
      technologies: Array.isArray(parsed.technologies)
        ? parsed.technologies.slice(0, 8).map(t => String(t).toLowerCase().trim())
        : []
    };
  } catch (err) {
    // Fail silently — never block ingestion
    console.warn('[classificationService] Classification failed silently:', err.message);
    return { doc_type: 'general', technologies: [] };
  }
}

module.exports = { classifyDocument };
