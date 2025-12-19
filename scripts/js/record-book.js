// ========================================
// RECORD-BOOK.JS - Sixth City Dynasty Record Book
// ========================================

let standingsData = [];
let selectedSeasons = new Set();

// ========================================
// DATA LOADING
// ========================================

async function loadStandingsData() {
  try {
    const response = await fetch('/data/sixth-city/api/standings.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    standingsData = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    
    // Initialize UI
    populateSeasonFilter();
    renderStandingsTable();
  } catch (error) {
    console.error('Error loading standings data:', error);
    document.getElementById('standings-body').innerHTML = 
      '<tr><td colspan="8" class="error-message">Error loading data</td></tr>';
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
// SEASON FILTER
// ========================================

function populateSeasonFilter() {
  // Get unique seasons
  const seasons = [...new Set(standingsData.map(row => parseInt(row.season)))].sort((a, b) => b - a);
  
  // Initialize with all seasons selected
  seasons.forEach(season => selectedSeasons.add(season));
  
  const checkboxContainer = document.getElementById('season-checkboxes');
  checkboxContainer.innerHTML = '';
  
  seasons.forEach(season => {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = season;
    checkbox.checked = true;
    checkbox.classList.add('season-checkbox');
    checkbox.addEventListener('change', handleSeasonChange);
    
    const span = document.createElement('span');
    span.textContent = season;
    
    label.appendChild(checkbox);
    label.appendChild(span);
    div.appendChild(label);
    checkboxContainer.appendChild(div);
  });
  
  updateSeasonLabel();
}

function handleSeasonChange(event) {
  const season = parseInt(event.target.value);
  const selectAll = document.getElementById('select-all-seasons');
  
  if (event.target.checked) {
    selectedSeasons.add(season);
  } else {
    selectedSeasons.delete(season);
    selectAll.checked = false;
  }
  
  // Update select all checkbox
  const allCheckboxes = document.querySelectorAll('.season-checkbox');
  const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
  selectAll.checked = allChecked;
  
  updateSeasonLabel();
  renderStandingsTable();
}

function handleSelectAllSeasons(event) {
  const checkboxes = document.querySelectorAll('.season-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = event.target.checked;
    const season = parseInt(checkbox.value);
    if (event.target.checked) {
      selectedSeasons.add(season);
    } else {
      selectedSeasons.delete(season);
    }
  });
  
  updateSeasonLabel();
  renderStandingsTable();
}

function updateSeasonLabel() {
  const label = document.getElementById('season-label');
  const allCheckboxes = document.querySelectorAll('.season-checkbox');
  const checkedCount = selectedSeasons.size;
  const totalCount = allCheckboxes.length;
  
  if (checkedCount === 0) {
    label.textContent = 'Select Seasons';
  } else if (checkedCount === totalCount) {
    label.textContent = 'All Seasons';
  } else if (checkedCount === 1) {
    label.textContent = [...selectedSeasons][0];
  } else {
    const sortedSeasons = [...selectedSeasons].sort((a, b) => b - a);
    label.textContent = `${sortedSeasons[0]}, ${sortedSeasons[1]}${checkedCount > 2 ? ', ...' : ''}`;
  }
}

// ========================================
// DATA AGGREGATION
// ========================================

function aggregateStandings() {
  if (selectedSeasons.size === 0) return [];
  
  // Filter data by selected seasons
  const filteredData = standingsData.filter(row => 
    selectedSeasons.has(parseInt(row.season))
  );
  
  // Group by franchise
  const franchiseMap = new Map();
  
  filteredData.forEach(row => {
    const franchiseName = row.franchise_name;
    
    if (!franchiseMap.has(franchiseName)) {
      franchiseMap.set(franchiseName, {
        franchise_name: franchiseName,
        h2h_wins: 0,
        h2h_losses: 0,
        points_for: 0,
        points_against: 0,
        potential_points: 0
      });
    }
    
    const franchise = franchiseMap.get(franchiseName);
    franchise.h2h_wins += parseFloat(row.h2h_wins) || 0;
    franchise.h2h_losses += parseFloat(row.h2h_losses) || 0;
    franchise.points_for += parseFloat(row.points_for) || 0;
    franchise.points_against += parseFloat(row.points_against) || 0;
    franchise.potential_points += parseFloat(row.potential_points) || 0;
  });
  
  // Calculate win percentage and sort
  const aggregated = Array.from(franchiseMap.values()).map(franchise => {
    const totalGames = franchise.h2h_wins + franchise.h2h_losses;
    franchise.h2h_winpct = totalGames > 0 ? franchise.h2h_wins / totalGames : 0;
    return franchise;
  });
  
  // Sort by win percentage (descending), then by points for
  aggregated.sort((a, b) => {
    if (Math.abs(a.h2h_winpct - b.h2h_winpct) > 0.001) {
      return b.h2h_winpct - a.h2h_winpct;
    }
    return b.points_for - a.points_for;
  });
  
  return aggregated;
}

// ========================================
// SORTING
// ========================================

let currentSortColumn = 'h2h_winpct';
let currentSortDirection = 'desc';

function setupTableSorting() {
  const headers = document.querySelectorAll('.data-table th[data-sort]');
  
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const sortKey = header.dataset.sort;
      
      // Toggle direction if clicking same column
      if (currentSortColumn === sortKey) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = sortKey;
        currentSortDirection = 'desc'; // Default to descending for new column
      }
      
      // Update visual indicators
      updateSortIndicators();
      
      // Re-render table with new sort
      renderStandingsTable();
    });
  });
}

function updateSortIndicators() {
  const headers = document.querySelectorAll('.data-table th[data-sort]');
  
  headers.forEach(header => {
    const icon = header.querySelector('.sort-icon');
    const sortKey = header.dataset.sort;
    
    if (sortKey === currentSortColumn) {
      header.classList.add('sorted');
      icon.textContent = currentSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
      icon.style.opacity = '1';
    } else {
      header.classList.remove('sorted');
      icon.textContent = 'unfold_more';
      icon.style.opacity = '0.3';
    }
  });
}

function sortData(data) {
  return data.sort((a, b) => {
    let aVal = a[currentSortColumn];
    let bVal = b[currentSortColumn];
    
    // Handle string comparisons (franchise name)
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
      
      if (currentSortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    }
    
    // Handle numeric comparisons
    if (currentSortDirection === 'asc') {
      return aVal - bVal;
    } else {
      return bVal - aVal;
    }
  });
}

// ========================================
// TABLE RENDERING
// ========================================

function renderStandingsTable() {
  const tbody = document.getElementById('standings-body');
  let aggregated = aggregateStandings();
  
  if (aggregated.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-message">No data for selected seasons</td></tr>';
    return;
  }
  
  // Apply sorting
  aggregated = sortData(aggregated);
  
  tbody.innerHTML = '';
  
  aggregated.forEach((franchise, index) => {
    const row = document.createElement('tr');
    
    // Rank
    const rankCell = document.createElement('td');
    rankCell.textContent = index + 1;
    row.appendChild(rankCell);
    
    // Franchise Name
    const nameCell = document.createElement('td');
    nameCell.textContent = franchise.franchise_name;
    nameCell.className = 'franchise-name';
    row.appendChild(nameCell);
    
    // Wins
    const winsCell = document.createElement('td');
    winsCell.textContent = Math.round(franchise.h2h_wins);
    row.appendChild(winsCell);
    
    // Losses
    const lossesCell = document.createElement('td');
    lossesCell.textContent = Math.round(franchise.h2h_losses);
    row.appendChild(lossesCell);
    
    // Win %
    const winPctCell = document.createElement('td');
    winPctCell.textContent = franchise.h2h_winpct.toFixed(3);
    row.appendChild(winPctCell);
    
    // Points For
    const pfCell = document.createElement('td');
    pfCell.textContent = franchise.points_for.toFixed(2);
    row.appendChild(pfCell);
    
    // Max Points For (Potential Points)
    const maxPfCell = document.createElement('td');
    maxPfCell.textContent = franchise.potential_points.toFixed(2);
    row.appendChild(maxPfCell);
    
    // Points Against
    const paCell = document.createElement('td');
    paCell.textContent = franchise.points_against.toFixed(2);
    row.appendChild(paCell);
    
    tbody.appendChild(row);
  });
}

// ========================================
// DROPDOWN TOGGLE
// ========================================

function setupDropdownToggle() {
  const toggle = document.getElementById('season-toggle');
  const menu = document.getElementById('season-menu');
  const selectAll = document.getElementById('select-all-seasons');
  
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('show');
  });
  
  selectAll.addEventListener('change', handleSelectAllSeasons);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.multi-select-dropdown')) {
      menu.classList.remove('show');
    }
  });
  
  // Prevent dropdown from closing when clicking inside
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  setupDropdownToggle();
  setupTableSorting();
  loadStandingsData();
});
