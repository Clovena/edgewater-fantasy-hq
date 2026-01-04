/**
 * CONFIG.JS - Environment configuration for GitHub Pages deployment
 *
 * Handles base path for GitHub Pages vs local development
 * This script MUST be loaded in <head> with defer removed so it runs immediately
 */

// Detect if we're on GitHub Pages or local development
const isGitHubPages = window.location.hostname.includes('github.io');

// Set base path based on environment
const BASE_PATH = isGitHubPages ? '/edgewater-fantasy-hq/' : '/';

// Immediately inject base tag if on GitHub Pages
// This must happen before any CSS or other resources load
if (isGitHubPages) {
  const base = document.createElement('base');
  base.href = BASE_PATH;
  // Insert as first element in head
  const firstHeadChild = document.head.firstElementChild;
  if (firstHeadChild) {
    document.head.insertBefore(base, firstHeadChild);
  } else {
    document.head.appendChild(base);
  }
}

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
  // Remove leading slash and add base path
  return BASE_PATH + path.replace(/^\//, '');
}

// Export for use in other scripts
window.EFHQ = {
  BASE_PATH,
  resolvePath,
  isGitHubPages
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
