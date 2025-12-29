// ========================================
// WEEKLY-HUB.JS - Dynamic YAML-based content loading
// ========================================

// Global storage for loaded data
let weeklyData = {
  epsilon: null,
  sixthCity: null,
  survivor: null
};

let teamMetadata = {};

// ========================================
// STATE MANAGEMENT
// ========================================

let currentLeague = 'sixth-city'; // Default league
let currentWeek = 1;
let availableWeeks = {}; // Store available weeks per league

// ========================================
// INITIALIZATION
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

// Load team metadata (colors, abbrevs, etc.) from fact_franchises.csv
async function loadTeamMetadata(league) {
  try {
    const response = await fetch(`/data/${league}/api/fact_franchises.csv`);
    if (response.ok) {
      const csvText = await response.text();
      
      // Parse CSV
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
      
      // Create name-to-metadata lookup with most recent season data
      const nameMap = {};
      rawData.forEach(row => {
        const name = row.franchise_name;
        const season = parseInt(row.season);
        
        if (!nameMap[name] || season > nameMap[name].season) {
          nameMap[name] = {
            primary: row.primary,
            secondary: row.secondary,
            tertiary: row.tertiary,
            season: season
          };
        }
      });
      
      teamMetadata[league] = nameMap;
    }
  } catch (error) {
    console.log(`No team metadata found for ${league}, using defaults`);
  }
}

// Load and parse YAML file using js-yaml library
async function loadYAML(league, week) {
  const leagueMap = {
    'epsilon': 'epsilon',
    'sixthCity': 'sixth-city',
    'survivor': 'survivor'
  };
  
  const leaguePath = leagueMap[league];
  
  try {
    const response = await fetch(`/data/${leaguePath}/content/week${week.toString().padStart(2, '0')}.yml`);
    if (!response.ok) {
      throw new Error(`Week ${week} data not found`);
    }
    
    const yamlText = await response.text();
    const data = jsyaml.load(yamlText);
    weeklyData[league] = data;
    
    return data;
  } catch (error) {
    console.error(`Error loading YAML for ${league} week ${week}:`, error);
    return null;
  }
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

// Create a ranking section element
function createRankingSection(teamName, blurb, league) {
  const section = document.createElement('section');
  section.className = 'ranking-section';

  const header = document.createElement('h2');
  header.textContent = teamName;

  // Apply team-specific styling if available
  if (teamMetadata[league] && teamMetadata[league][teamName]) {
    const team = teamMetadata[league][teamName];

    // Apply background color
    if (team.primary) {
      header.style.backgroundColor = team.primary;
    }
  }

  // Create subheader with team stats (dummy data for now)
  const subheader = document.createElement('div');
  subheader.className = 'team-stats';
  subheader.textContent = '7-7 • +1 • TW: vs MIS';

  const paragraph = document.createElement('p');
  paragraph.textContent = blurb;

  section.appendChild(header);
  section.appendChild(subheader);
  section.appendChild(paragraph);

  return section;
}

// Get league CSS class name for styling
function getLeagueClass(league) {
  return `${league}-page`;
}

// Render the current league's power rankings
function renderCurrentLeague() {
  const container = document.getElementById('print-container');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Get data for current league
  const leagueKey = currentLeague === 'sixth-city' ? 'sixthCity' : currentLeague;
  const data = weeklyData[leagueKey];

  if (!data) {
    container.innerHTML = '<p>No data available for this league.</p>';
    return;
  }

  // Apply league-specific styling to container
  container.className = `print-pages ${getLeagueClass(currentLeague)}`;

  const totalItems = Math.min(data.ranks?.length || 0, data.blurbs?.length || 0);
  const firstPageItems = 2;
  const subsequentPageItems = 3;

  let currentIndex = 0;

  // Calculate total pages needed
  const remainingItems = Math.max(0, totalItems - firstPageItems);
  const totalPages = totalItems === 0 ? 0 : 1 + Math.ceil(remainingItems / subsequentPageItems);

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    // Create print page
    const printPage = document.createElement('div');
    printPage.className = 'print-page';

    // Create page inner container
    const pageInner = document.createElement('div');
    pageInner.className = 'page-inner';

    // First page: Add header with intro
    if (pageNum === 0 && data.intro) {
      const header = document.createElement('header');
      header.className = 'print-page-header';

      const title = document.createElement('h1');
      title.textContent = data.intro.title || '';

      const subtitle = document.createElement('div');
      subtitle.className = 'subtitle';
      subtitle.textContent = data.intro.subtitle || '';

      const intro = document.createElement('p');
      intro.className = 'intro-text';
      intro.textContent = data.intro.description || '';

      header.appendChild(title);
      header.appendChild(subtitle);
      header.appendChild(intro);
      pageInner.appendChild(header);
    }

    // Main content area
    const mainContent = document.createElement('main');
    mainContent.className = 'print-page-content';

    // Determine items for this page: 2 for first page, 3 for subsequent pages
    const itemsPerPage = (pageNum === 0) ? firstPageItems : subsequentPageItems;
    const itemsOnThisPage = Math.min(itemsPerPage, totalItems - currentIndex);

    for (let i = 0; i < itemsOnThisPage; i++) {
      const section = createRankingSection(
        data.ranks[currentIndex],
        data.blurbs[currentIndex],
        currentLeague
      );
      mainContent.appendChild(section);
      currentIndex++;
    }

    pageInner.appendChild(mainContent);
    printPage.appendChild(pageInner);
    container.appendChild(printPage);
  }
}

// ========================================
// WEEK DISCOVERY
// ========================================

// Discover available weeks for a league by attempting to fetch week files
async function discoverWeeks(league) {
  const leagueMap = {
    'epsilon': 'epsilon',
    'sixth-city': 'sixth-city',
    'sixthCity': 'sixth-city',
    'survivor': 'survivor'
  };

  const leaguePath = leagueMap[league];
  const weeks = [];

  // Try weeks 1-18 (standard NFL regular season)
  for (let week = 1; week <= 18; week++) {
    const weekStr = week.toString().padStart(2, '0');
    try {
      const response = await fetch(`/data/${leaguePath}/content/week${weekStr}.yml`, {
        method: 'HEAD' // Use HEAD to avoid downloading full file
      });
      if (response.ok) {
        weeks.push(week);
      }
    } catch (error) {
      // File doesn't exist, continue
    }
  }

  return weeks;
}

// Populate week dropdown with available weeks
function populateWeekDropdown(weeks) {
  const dropdown = document.getElementById('week-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = '';

  weeks.forEach(week => {
    const option = document.createElement('option');
    option.value = week;
    option.textContent = `Week ${week}`;
    dropdown.appendChild(option);
  });

  // Set current week as selected
  dropdown.value = currentWeek;
}

// ========================================
// DROPDOWN HANDLING
// ========================================

// Handle league dropdown change
async function handleLeagueChange(event) {
  currentLeague = event.target.value;

  // Update available weeks for new league
  const weeks = availableWeeks[currentLeague];
  if (weeks && weeks.length > 0) {
    populateWeekDropdown(weeks);
    // Keep current week if available, otherwise use first available week
    if (!weeks.includes(currentWeek)) {
      currentWeek = weeks[0];
    }
    await loadWeekData(currentWeek);
  }

  renderCurrentLeague();
}

// Handle week dropdown change
async function handleWeekChange(event) {
  currentWeek = parseInt(event.target.value);
  await loadWeekData(currentWeek);
  renderCurrentLeague();
}

// Load week data for current league
async function loadWeekData(week) {
  const leagueKey = currentLeague === 'sixth-city' ? 'sixthCity' : currentLeague;
  await loadYAML(leagueKey, week);
}

// Setup dropdown event listeners
function setupDropdowns() {
  const leagueDropdown = document.getElementById('league-dropdown');
  const weekDropdown = document.getElementById('week-dropdown');

  if (leagueDropdown) {
    leagueDropdown.value = currentLeague;
    leagueDropdown.addEventListener('change', handleLeagueChange);
  }

  if (weekDropdown) {
    weekDropdown.addEventListener('change', handleWeekChange);
  }
}

// ========================================
// PUBLIC API
// ========================================

// Load and render all weekly data
async function loadWeeklyHub(week = 1) {
  currentWeek = week;

  // Load team metadata for all leagues
  await Promise.all([
    loadTeamMetadata('epsilon'),
    loadTeamMetadata('sixth-city'),
    loadTeamMetadata('survivor')
  ]);

  // Discover available weeks for all leagues
  const [epsilonWeeks, sixthCityWeeks, survivorWeeks] = await Promise.all([
    discoverWeeks('epsilon'),
    discoverWeeks('sixth-city'),
    discoverWeeks('survivor')
  ]);

  availableWeeks = {
    'epsilon': epsilonWeeks,
    'sixth-city': sixthCityWeeks,
    'survivor': survivorWeeks
  };

  // Set initial week to first available week for default league if specified week not available
  const defaultLeagueWeeks = availableWeeks[currentLeague];
  if (defaultLeagueWeeks && defaultLeagueWeeks.length > 0) {
    if (!defaultLeagueWeeks.includes(currentWeek)) {
      currentWeek = defaultLeagueWeeks[0];
    }
  }

  // Load YAML data for current week
  const leagueKey = currentLeague === 'sixth-city' ? 'sixthCity' : currentLeague;
  await loadYAML(leagueKey, currentWeek);

  // Populate week dropdown with available weeks for current league
  populateWeekDropdown(defaultLeagueWeeks);

  // Setup dropdowns
  setupDropdowns();

  // Render the default league
  renderCurrentLeague();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => loadWeeklyHub(1));
} else {
  loadWeeklyHub(1);
}
