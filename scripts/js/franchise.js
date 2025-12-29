/**
 * FRANCHISE.JS - Individual Franchise Page Handler
 *
 * Dynamically loads and renders franchise details based on URL parameter
 */

// ========================================
// CONSTANTS
// ========================================

const FRANCHISE_DATA_URL = '/data/sixth-city/api/fact_franchises.csv';
const FONTS_PATH = '/assets/fonts';
const FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2'];

// ========================================
// GLOBAL STATE
// ========================================

let franchiseData = null;
const loadedFonts = new Set();

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Parse CSV line with proper handling of quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Get URL parameter by name
 */
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// ========================================
// DATA LOADING
// ========================================

/**
 * Load franchise data from CSV (with caching)
 */
async function loadFranchiseData() {
  // Return cached data if already loaded
  if (franchiseData) {
    return franchiseData;
  }

  try {
    const response = await fetch(FRANCHISE_DATA_URL);
    if (!response.ok) {
      throw new Error('Failed to load franchise data');
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);

    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    franchiseData = data;
    return data;
  } catch (error) {
    console.error('Error loading franchise data:', error);
    return null;
  }
}

/**
 * Find franchise by abbreviation (most recent season)
 */
function findFranchise(abbrev) {
  if (!franchiseData || !abbrev) {
    return null;
  }

  const matches = franchiseData.filter(f => f.abbrev === abbrev.toUpperCase());
  if (matches.length === 0) return null;

  // Return franchise with most recent season
  return matches.reduce((prev, current) => {
    const prevSeason = parseInt(prev.season) || 0;
    const currentSeason = parseInt(current.season) || 0;
    return currentSeason > prevSeason ? current : prev;
  });
}

/**
 * Load custom font for the team
 */
async function loadTeamFont(fontName) {
  if (!fontName) return false;

  // Check if already loaded
  if (loadedFonts.has(fontName)) return true;

  const fontNameLower = fontName.toLowerCase().replace(/\s+/g, '_');

  for (const ext of FONT_EXTENSIONS) {
    const fontPath = `${FONTS_PATH}/${fontNameLower}.${ext}`;

    try {
      const response = await fetch(fontPath);
      if (!response.ok) continue;

      // Load font data as buffer
      const fontBuffer = await response.arrayBuffer();
      const fontFace = new FontFace(fontName, fontBuffer);
      const loadedFont = await fontFace.load();

      // Add to document and mark as loaded
      document.fonts.add(loadedFont);
      loadedFonts.add(fontName);

      // Wait for font to be ready
      await document.fonts.ready;
      return true;
    } catch (error) {
      // Try next extension
      continue;
    }
  }

  return false;
}

// ========================================
// RENDERING
// ========================================

/**
 * Render error message
 */
function renderErrorMessage(message) {
  const headerContainer = document.getElementById('franchise-header');
  headerContainer.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h2 style="color: var(--gray-dark); font-family: 'Lato', sans-serif;">
        ${message}
      </h2>
      <p style="color: var(--gray-dark); font-family: 'Lato', sans-serif;">
        <a href="/pages/sixth-city/franchises.html" style="color: var(--blue); text-decoration: underline;">
          Return to franchises
        </a>
      </p>
    </div>
  `;
}

/**
 * Render franchise header
 */
function renderFranchiseHeader(franchise) {
  if (!franchise) {
    renderErrorMessage('Franchise not found');
    return;
  }

  const headerContainer = document.getElementById('franchise-header');
  const logoPath = `/assets/logos/${franchise.abbrev}.png`;
  const teamFont = franchise.font || 'Bungee';

  headerContainer.innerHTML = `
    <img src="${logoPath}"
         alt="${franchise.franchise_name}"
         onerror="this.style.display='none'">
    <h1 style="font-family: '${teamFont}', 'Bungee', sans-serif;">
      ${franchise.franchise_name}
    </h1>
    <p>
      ${franchise.owner_name}
    </p>
  `;
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize franchise page
 */
async function initializeFranchisePage() {
  const teamAbbrev = getURLParameter('team');

  if (!teamAbbrev) {
    renderErrorMessage('No team specified');
    return;
  }

  // Load data and find franchise
  await loadFranchiseData();
  const franchise = findFranchise(teamAbbrev);

  // Load custom font if available
  if (franchise?.font) {
    await loadTeamFont(franchise.font);
  }

  // Render header
  renderFranchiseHeader(franchise);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFranchisePage);
} else {
  initializeFranchisePage();
}