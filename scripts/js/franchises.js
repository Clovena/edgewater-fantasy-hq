// ========================================
// FRANCHISES.JS - Sixth City Dynasty Franchises Page
// ========================================

let franchiseData = [];

// ========================================
// DATA LOADING
// ========================================

async function loadFranchiseData() {
  try {
    const response = await fetch('/data/sixth-city/api/fact_franchises.csv');
    const csvText = await response.text();

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);

    const allFranchises = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });

    // Get most recent season
    const maxSeason = Math.max(...allFranchises.map((f) => parseInt(f.season)));

    // Filter to most recent season only
    franchiseData = allFranchises.filter(
      (f) => parseInt(f.season) === maxSeason
    );

    // Render franchises
    renderFranchises();
  } catch (error) {
    console.error('Error loading franchise data:', error);
  }
}

// Simple CSV parser (handles quoted fields)
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

// ========================================
// RENDERING
// ========================================

function renderFranchises() {
  // Separate by conference
  const sccFranchises = franchiseData
    .filter((f) => f.conference === 'SCC')
    .sort((a, b) => a.abbrev.localeCompare(b.abbrev));

  const hccFranchises = franchiseData
    .filter((f) => f.conference === 'HCC')
    .sort((a, b) => a.abbrev.localeCompare(b.abbrev));

  // Render SCC Conference
  renderConference('scc-franchises', sccFranchises);

  // Render HCC Conference
  renderConference('hcc-franchises', hccFranchises);
}

function renderConference(containerId, franchises) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Create 3-row layout: 2-3-2
  const rowSizes = [2, 3, 2];
  let franchiseIndex = 0;

  rowSizes.forEach((rowSize) => {
    const row = document.createElement('div');
    row.className = 'franchise-row';

    for (let i = 0; i < rowSize && franchiseIndex < franchises.length; i++) {
      const franchise = franchises[franchiseIndex];
      const franchiseCard = createFranchiseCard(franchise);
      row.appendChild(franchiseCard);
      franchiseIndex++;
    }

    container.appendChild(row);
  });
}

function createFranchiseCard(franchise) {
  const card = document.createElement('div');
  card.className = 'franchise-card';

  // Create link wrapper to franchise page
  const link = document.createElement('a');
  link.href = `/pages/sixth-city/franchise.html?team=${franchise.abbrev}`;
  link.className = 'franchise-link';

  // Hexagon background container
  const hexagon = document.createElement('div');
  hexagon.className = 'franchise-hexagon';
  hexagon.style.backgroundColor = franchise.primary;

  // Logo image
  const logo = document.createElement('img');
  logo.src = `/assets/logos/${franchise.abbrev}.png`;
  logo.alt = `${franchise.franchise_name} logo`;
  logo.className = 'franchise-logo';

  // Franchise name
  const name = document.createElement('h3');
  name.textContent = franchise.franchise_name;
  name.className = 'franchise-name';

  hexagon.appendChild(logo);
  link.appendChild(hexagon);
  link.appendChild(name);
  card.appendChild(link);

  return card;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  loadFranchiseData();
});