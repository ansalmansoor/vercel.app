// Security and Sanitization Utilities for SafeTClaim

/**
 * Escapes HTML characters in a string to prevent Cross-Site Scripting (XSS)
 * @param {string} str - The string to escape
 * @returns {string} The HTML-escaped string
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a SHA-256 hash of a string using Web Crypto API
 * @param {string} text - The input password
 * @returns {Promise<string>} Hexadecimal hash string
 */
export async function hashPassword(text) {
  if (!text) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if a string is a valid SHA-256 hash
 * @param {string} str 
 * @returns {boolean}
 */
export function isHash(str) {
  return typeof str === 'string' && /^[a-f0-9]{64}$/i.test(str);
}
