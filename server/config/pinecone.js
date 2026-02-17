const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Missing Pinecone API Key');
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = process.env.PINECONE_INDEX_NAME;

// Initialize index connection
const pineconeIndex = pinecone.Index(indexName);

module.exports = { pinecone, pineconeIndex };
