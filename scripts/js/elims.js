/**
 * ELIMS.JS - Survivor Elimination Archives Handler
 *
 * Displays season-by-season final standings with highlighted top 3 finishers
 */

// ========================================
// CONSTANTS
// ========================================

const STANDINGS_DATA_URL = '/data/survivor/api/v_fact_standings.csv';

// ========================================
// GLOBAL STATE
// ========================================

let standingsData = null;
let availableSeasons = [];

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

// ========================================
// DATA LOADING
// ========================================

/**
 * Load standings data from CSV
 */
async function loadStandingsData() {
  if (standingsData) {
    return standingsData;
  }

  try {
    const response = await fetch(STANDINGS_DATA_URL);
    if (!response.ok) {
      throw new Error('Failed to load standings data');
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

    standingsData = data;

    // Extract unique seasons and sort descending
    availableSeasons = [...new Set(data.map(row => parseInt(row.season)))].sort((a, b) => b - a);

    return data;
  } catch (error) {
    console.error('Error loading standings data:', error);
    return null;
  }
}

/**
 * Get standings for a specific season, sorted by weeks_alive descending
 */
function getSeasonStandings(season) {
  if (!standingsData) return [];

  return standingsData
    .filter(row => parseInt(row.season) === parseInt(season))
    .sort((a, b) => parseInt(b.weeks_alive) - parseInt(a.weeks_alive));
}

// ========================================
// RENDERING
// ========================================

/**
 * Render season dropdown
 */
function renderSeasonSelector() {
  const select = document.getElementById('season-select');

  if (availableSeasons.length === 0) {
    select.innerHTML = '<option>No seasons available</option>';
    return;
  }

  select.innerHTML = availableSeasons
    .map(season => `<option value="${season}">${season}</option>`)
    .join('');

  // Set to most recent season (first in descending array)
  select.value = availableSeasons[0];
}

/**
 * Render standings table for selected season
 */
function renderStandingsTable(season) {
  const tbody = document.getElementById('standings-tbody');
  const standings = getSeasonStandings(season);

  if (standings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = standings
    .map((row, index) => {
      const place = index + 1;
      let placeClass = '';
      let placeText = place;

      // Determine styling for top 3
      if (place === 1) {
        placeClass = 'place-first';
        placeText = '1st';
      } else if (place === 2) {
        placeClass = 'place-second';
        placeText = '2nd';
      } else if (place === 3) {
        placeClass = 'place-third';
        placeText = '3rd';
      } else {
        placeText = `${place}th`;
      }

      return `
        <tr class="${placeClass}">
          <td class="place-cell">${placeText}</td>
          <td class="owner-cell">${row.owner_name}</td>
          <td class="weeks-cell">${row.weeks_alive}</td>
        </tr>
      `;
    })
    .join('');
}

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Initialize season selector event listener
 */
function initializeSeasonSelector() {
  const select = document.getElementById('season-select');

  select.addEventListener('change', (e) => {
    const selectedSeason = e.target.value;
    renderStandingsTable(selectedSeason);
  });
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize elimination archives page
 */
async function initializeElimsPage() {
  // Load data
  await loadStandingsData();

  // Render season selector
  renderSeasonSelector();

  // Render standings for most recent season
  if (availableSeasons.length > 0) {
    renderStandingsTable(availableSeasons[0]);
  }

  // Initialize event listeners
  initializeSeasonSelector();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeElimsPage);
} else {
  initializeElimsPage();
}
