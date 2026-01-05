/**
 * FRANCHISE.JS - Individual Franchise Page Handler
 *
 * Dynamically loads and renders franchise details based on URL parameter
 */

// ========================================
// CONSTANTS
// ========================================

const FRANCHISE_DATA_URL = '/data/sixth-city/api/fact_franchises.csv';
const SCHEDULE_DATA_URL = '/data/sixth-city/api/v_fact_schedule.csv';
const FONTS_PATH = '/assets/fonts';
const FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2'];

// ========================================
// GLOBAL STATE
// ========================================

let franchiseData = null;
let scheduleData = null;
let currentFranchise = null;
const loadedFonts = new Set();
let statsAggregationMode = 'owner_name'; // 'franchise_id' or 'owner_name'
let selectedGameTypes = new Set([0]); // Start with regular season (game_type = 0) selected

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

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
function getRelativeLuminance(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine whether to use white or dark text based on background color
 */
function getContrastTextColor(hexColor) {
  const luminance = getRelativeLuminance(hexColor);
  // Use white text for dark backgrounds, dark text for light backgrounds
  return luminance > 0.5 ? '#22283A' : '#ffffff';
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
 * Load schedule data from CSV (with caching)
 */
async function loadScheduleData() {
  // Return cached data if already loaded
  if (scheduleData) {
    return scheduleData;
  }

  try {
    const response = await fetch(SCHEDULE_DATA_URL);
    if (!response.ok) {
      throw new Error('Failed to load schedule data');
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

    scheduleData = data;
    return data;
  } catch (error) {
    console.error('Error loading schedule data:', error);
    return null;
  }
}

/**
 * Calculate franchise statistics based on aggregation mode
 */
function calculateFranchiseStats(franchise, scheduleData, aggregationMode, gameTypesSet) {
  if (!franchise || !scheduleData) return null;

  // Filter schedule data based on aggregation mode
  const filterValue = franchise[aggregationMode];
  let filteredGames = scheduleData.filter(game => game[aggregationMode] === filterValue);

  // Apply game type filter based on selected game types
  if (gameTypesSet && gameTypesSet.size > 0) {
    filteredGames = filteredGames.filter(game => gameTypesSet.has(parseInt(game.game_type)));
  }

  if (filteredGames.length === 0) return null;

  // Conference games only
  const confGames = filteredGames.filter(game => parseInt(game.is_intra_conf) === 1);

  // Calculate stats
  const totalGames = filteredGames.length;
  const totalWins = filteredGames.reduce((sum, game) => sum + parseInt(game.result || 0), 0);
  const totalLosses = totalGames - totalWins;

  const confWins = confGames.reduce((sum, game) => sum + parseInt(game.result || 0), 0);
  const confLosses = confGames.length - confWins;

  const avgScore = filteredGames.reduce((sum, game) => sum + parseFloat(game.franchise_score || 0), 0) / totalGames;
  const avgScoreAgainst = filteredGames.reduce((sum, game) => sum + parseFloat(game.opponent_score || 0), 0) / totalGames;

  const highestScore = Math.max(...filteredGames.map(game => parseFloat(game.franchise_score || 0)));
  const lowestScore = Math.min(...filteredGames.map(game => parseFloat(game.franchise_score || 0)));

  return {
    record: `${totalWins}-${totalLosses}`,
    winPct: (totalWins / totalGames).toFixed(3),
    confRecord: `${confWins}-${confLosses}`,
    confWinPct: confGames.length > 0 ? (confWins / confGames.length).toFixed(3) : 'N/A',
    avgScore: avgScore.toFixed(2),
    avgScoreAgainst: avgScoreAgainst.toFixed(2),
    highestScore: highestScore.toFixed(2),
    lowestScore: lowestScore.toFixed(2)
  };
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
  const description = franchise.description || '';

  // Check for former franchise iterations (different owner on same franchise_id)
  const sameFranchiseId = franchiseData.filter(f => f.franchise_id === franchise.franchise_id);
  const uniqueOwners = [...new Set(sameFranchiseId.map(f => f.owner_name))];

  let formerFranchiseLink = '';
  if (uniqueOwners.length > 1) {
    // Find a franchise iteration with a different owner
    const formerIteration = sameFranchiseId.find(f =>
      f.owner_name !== franchise.owner_name &&
      f.franchise_name !== franchise.franchise_name
    );

    if (formerIteration) {
      formerFranchiseLink = `<p class="franchise-former-link">See also the <a href="/pages/sixth-city/franchise.html?team=${formerIteration.abbrev}">${formerIteration.franchise_name}</a>...</p>`;
    }
  }

  headerContainer.innerHTML = `
    <img src="${logoPath}"
         alt="${franchise.franchise_name}"
         onerror="this.style.display='none'">
    <h1 style="font-family: '${teamFont}', 'Bungee', sans-serif;">
      ${franchise.franchise_name}
    </h1>
    <p class="franchise-owner">
      Franchise owner: ${franchise.owner_name}
    </p>
    ${description ? `<p class="franchise-description">${description}</p>` : ''}
    ${formerFranchiseLink}
  `;
}

/**
 * Render franchise summary statistics (non-interactive)
 */
function renderFranchiseSummaryStats(franchise) {
  if (!franchise) return;

  const summaryStatsContainer = document.getElementById('franchise-summary-stats');

  // Calculate number of seasons for this owner
  const ownerSeasons = franchiseData.filter(f => f.owner_name === franchise.owner_name);
  const numberOfSeasons = ownerSeasons.length;

  // Placeholder for best finish (will be populated from ref data later)
  const bestFinish = '3rd';

  summaryStatsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${numberOfSeasons}</div>
      <div class="stat-label">Number of Seasons</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${bestFinish}</div>
      <div class="stat-label">Best Finish</div>
    </div>
  `;
}

/**
 * Render franchise statistics grid
 */
async function renderFranchiseStats(franchise) {
  if (!franchise) return;

  const statsContainer = document.getElementById('franchise-stats');
  const teamFont = franchise.font || 'Bungee';

  // Load schedule data and calculate stats
  const schedule = await loadScheduleData();
  const calculatedStats = calculateFranchiseStats(franchise, schedule, statsAggregationMode, selectedGameTypes);

  if (!calculatedStats) {
    statsContainer.innerHTML = '<p>No stats available</p>';
    return;
  }

  const stats = [
    { value: calculatedStats.record, label: 'All-time record' },
    { value: calculatedStats.winPct, label: 'All-time win percent' },
    { value: calculatedStats.confRecord, label: 'Conference record' },
    { value: calculatedStats.confWinPct, label: 'Conference win percent' },
    { value: calculatedStats.avgScore, label: 'Average score' },
    { value: calculatedStats.avgScoreAgainst, label: 'Average score against' },
    { value: calculatedStats.highestScore, label: 'Highest all-time score' },
    { value: calculatedStats.lowestScore, label: 'Lowest all-time score' }
  ];

  const secondaryColor = franchise.secondary || '#ffffff'; // Default to white if no color
  const textColor = getContrastTextColor(secondaryColor);
  const labelOpacity = textColor === '#ffffff' ? '0.9' : '0.7';

  statsContainer.innerHTML = stats.map(stat => `
    <div class="stat-item" style="background-color: ${secondaryColor};">
      <div class="stat-value" style="font-family: 'Bungee', sans-serif; color: ${textColor};">
        ${stat.value}
      </div>
      <div class="stat-label" style="color: ${textColor}; opacity: ${labelOpacity};">
        ${stat.label}
      </div>
    </div>
  `).join('');
}

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Initialize toggle button and checkbox event listeners
 * @param {boolean} initializeToggle - Whether to initialize the aggregation mode toggle buttons
 */
function initializeToggleButtons(initializeToggle = true) {
  // Aggregation mode toggles (only if toggle should be shown)
  if (initializeToggle) {
    const franchiseToggle = document.getElementById('franchise-toggle');
    const ownerToggle = document.getElementById('owner-toggle');

    if (franchiseToggle && ownerToggle) {
      franchiseToggle.addEventListener('click', async () => {
        statsAggregationMode = 'franchise_id';
        franchiseToggle.classList.add('active');
        ownerToggle.classList.remove('active');

        // Re-render stats with franchise aggregation
        if (currentFranchise) {
          await renderFranchiseStats(currentFranchise);
        }
      });

      ownerToggle.addEventListener('click', async () => {
        statsAggregationMode = 'owner_name';
        ownerToggle.classList.add('active');
        franchiseToggle.classList.remove('active');

        // Re-render stats with owner aggregation
        if (currentFranchise) {
          await renderFranchiseStats(currentFranchise);
        }
      });
    }
  }

  // Game type filter checkboxes
  const regularCheckbox = document.getElementById('regular-season-checkbox');
  const playoffsCheckbox = document.getElementById('playoffs-checkbox');
  const consolationCheckbox = document.getElementById('consolation-checkbox');
  const selectAllButton = document.getElementById('select-all-games');

  const checkboxes = [regularCheckbox, playoffsCheckbox, consolationCheckbox].filter(cb => cb);

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      // Handle comma-separated values (e.g., "-1,-2" for consolation)
      const gameTypes = checkbox.value.split(',').map(v => parseInt(v.trim()));

      if (checkbox.checked) {
        gameTypes.forEach(gt => selectedGameTypes.add(gt));
      } else {
        gameTypes.forEach(gt => selectedGameTypes.delete(gt));
      }

      // Re-render stats with updated game type filter
      if (currentFranchise) {
        await renderFranchiseStats(currentFranchise);
      }
    });
  });

  // Select all button
  if (selectAllButton) {
    selectAllButton.addEventListener('click', async () => {
      // Check all checkboxes and add all their game types
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        // Handle comma-separated values
        const gameTypes = checkbox.value.split(',').map(v => parseInt(v.trim()));
        gameTypes.forEach(gt => selectedGameTypes.add(gt));
      });

      // Re-render stats
      if (currentFranchise) {
        await renderFranchiseStats(currentFranchise);
      }
    });
  }
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

  // Store current franchise for toggle functionality
  currentFranchise = franchise;

  // Load custom font if available
  if (franchise?.font) {
    await loadTeamFont(franchise.font);
  }

  // Check if toggle should be shown (only if multiple owners for this franchise_id)
  const sameFranchiseId = franchiseData.filter(f => f.franchise_id === franchise.franchise_id);
  const uniqueOwners = [...new Set(sameFranchiseId.map(f => f.owner_name))];
  const showToggle = uniqueOwners.length > 1;

  // Show/hide toggle container
  const toggleContainer = document.querySelector('.stats-toggle-container');
  if (toggleContainer) {
    toggleContainer.style.display = showToggle ? 'flex' : 'none';
  }

  // Render header, summary stats, and detailed stats
  renderFranchiseHeader(franchise);
  renderFranchiseSummaryStats(franchise);
  await renderFranchiseStats(franchise);

  // Initialize toggle buttons and filters
  initializeToggleButtons(showToggle);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFranchisePage);
} else {
  initializeFranchisePage();
}