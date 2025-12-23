// ========================================
// COLORS.JS - Team Color Display
// ========================================

let franchiseData = [];

// ========================================
// DATA LOADING
// ========================================

// Parse a CSV line handling quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
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

async function loadFranchiseData() {
  try {
    const response = await fetch('/data/sixth-city/api/fact_franchises.csv');
    const csvText = await response.text();
    
    // Parse CSV (handles quoted values)
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    const rawData = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    // Group by franchise and get max season
    const groupedData = new Map();
    
    rawData.forEach(row => {
      const key = `${row.franchise_id}_${row.franchise_name}_${row.abbrev}_${row.owner_name}_${row.primary}_${row.secondary}_${row.tertiary}`;
      const season = parseInt(row.season);
      
      if (!groupedData.has(key) || season < groupedData.get(key).season) {
        groupedData.set(key, {
          franchise_id: row.franchise_id,
          franchise_name: row.franchise_name,
          abbrev: row.abbrev,
          owner_name: row.owner_name,
          primary: row.primary,
          secondary: row.secondary,
          tertiary: row.tertiary,
          season: season
        });
      }
    });
    
    // Convert to array and add team_select
    franchiseData = Array.from(groupedData.values()).map(item => ({
      ...item,
      team_select: `${item.abbrev} (${item.season})`
    }));
    
    // Sort by abbreviation
    franchiseData.sort((a, b) => a.abbrev.localeCompare(b.abbrev));
    
    populateDropdown();
    
  } catch (error) {
    console.error('Error loading franchise data:', error);
  }
}

// ========================================
// UI RENDERING
// ========================================

function populateDropdown() {
  const dropdown = document.getElementById('team-select');
  
  // Clear existing options
  dropdown.innerHTML = '<option value="">Select a team...</option>';
  
  // Add team options
  franchiseData.forEach((team, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = team.team_select;
    dropdown.appendChild(option);
  });
  
  // Add event listener
  dropdown.addEventListener('change', handleTeamSelection);
}

function handleTeamSelection(event) {
  const selectedIndex = event.target.value;
  
  if (selectedIndex === '') {
    // No team selected
    document.getElementById('color-display').style.display = 'none';
    document.getElementById('team-info').style.display = 'none';
    return;
  }
  
  const team = franchiseData[selectedIndex];
  displayColors(team);
  displayTeamInfo(team);
}

function displayColors(team) {
  const colorDisplay = document.getElementById('color-display');
  const primaryBox = document.getElementById('primary-box');
  const secondaryBox = document.getElementById('secondary-box');
  const tertiaryBox = document.getElementById('tertiary-box');
  
  // Set background colors
  primaryBox.style.backgroundColor = team.primary || '#cccccc';
  secondaryBox.style.backgroundColor = team.secondary || '#cccccc';
  tertiaryBox.style.backgroundColor = team.tertiary || '#cccccc';
  
  // Set hex values
  primaryBox.querySelector('.color-hex').textContent = team.primary || 'N/A';
  secondaryBox.querySelector('.color-hex').textContent = team.secondary || 'N/A';
  tertiaryBox.querySelector('.color-hex').textContent = team.tertiary || 'N/A';
  
  // Determine text color for contrast
  setTextColor(primaryBox, team.primary);
  setTextColor(secondaryBox, team.secondary);
  setTextColor(tertiaryBox, team.tertiary);
  
  // Show color display
  colorDisplay.style.display = 'flex';
}

function displayTeamInfo(team) {
  const teamInfo = document.getElementById('team-info');
  
  document.getElementById('team-name').textContent = team.franchise_name;
  document.getElementById('team-abbrev').textContent = team.abbrev;
  document.getElementById('team-owner').textContent = team.owner_name;
  document.getElementById('team-season').textContent = team.season;
  
  teamInfo.style.display = 'block';
}

// Determine if text should be light or dark based on background color
function setTextColor(element, hexColor) {
  if (!hexColor || hexColor === '') {
    element.style.color = '#000000';
    return;
  }
  
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Set text color based on luminance
  element.style.color = luminance > 0.5 ? '#000000' : '#ffffff';
}

// ========================================
// INITIALIZATION
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFranchiseData);
} else {
  loadFranchiseData();
}
