/**
 * CONFIG.JS - Environment configuration for GitHub Pages deployment
 *
 * Handles base path for GitHub Pages vs local development
 * MUST be loaded before any other scripts
 */

// Detect if we're on GitHub Pages or local development
const isGitHubPages = window.location.hostname.includes('github.io');

// Set base path based on environment
const BASE_PATH = isGitHubPages ? '/edgewater-fantasy-hq' : '';

/**
 * Resolve a path with the appropriate base
 * @param {string} path - Path starting with /
 * @returns {string} - Full path with base
 */
function resolvePath(path) {
  // Handle paths that already have the base
  if (path.startsWith(BASE_PATH)) {
    return path;
  }
  return `${BASE_PATH}${path}`;
}

// Export for use in other scripts
window.EFHQ = {
  BASE_PATH,
  resolvePath
};

// Monkey-patch fetch to automatically add base path
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Only modify relative URLs starting with /
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
    url = resolvePath(url);
  }
  return originalFetch(url, options);
};
