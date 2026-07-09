const crypto = require('crypto');

// TOKEN_ENCRYPTION_KEY must be exactly 32 characters.
// Generate once with: node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"
// WARNING: Never change this key after storing encrypted tokens — all existing tokens will become unreadable.
const KEY = process.env.TOKEN_ENCRYPTION_KEY;

if (!KEY || KEY.length !== 32) {
  throw new Error(
    'TOKEN_ENCRYPTION_KEY must be set in .env and be exactly 32 characters long.\n' +
    'Generate it with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\').slice(0,32))"'
  );
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * @param {string} text - The plaintext to encrypt (e.g. an OAuth access token)
 * @returns {string} - "ivHex:encryptedHex" — safe to store in database
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16); // 16-byte random IV for each encryption
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a string previously encrypted with encrypt().
 * @param {string} text - "ivHex:encryptedHex" string from the database
 * @returns {string} - The original plaintext
 */
function decrypt(text) {
  const [ivHex, encHex] = text.split(':');
  if (!ivHex || !encHex) throw new Error('Invalid encrypted token format');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(KEY),
    Buffer.from(ivHex, 'hex')
  );
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
