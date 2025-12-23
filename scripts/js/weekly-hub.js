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
  
  const paragraph = document.createElement('p');
  paragraph.textContent = blurb;
  
  section.appendChild(header);
  section.appendChild(paragraph);
  
  return section;
}

// Render a single league's power rankings
function renderLeaguePage(pageId, league, data) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return;
  
  // Clear all existing content
  pageElement.innerHTML = '';
  
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
        league
      );
      mainContent.appendChild(section);
      currentIndex++;
    }
    
    pageInner.appendChild(mainContent);
    printPage.appendChild(pageInner);
    pageElement.appendChild(printPage);
  }
}

// ========================================
// PUBLIC API
// ========================================

// Load and render all weekly data
async function loadWeeklyHub(week = 1) {
  // Load team metadata for all leagues
  await Promise.all([
    loadTeamMetadata('epsilon'),
    loadTeamMetadata('sixth-city'),
    loadTeamMetadata('survivor')
  ]);
  
  // Load YAML data for all leagues
  const [epsilonData, sixthCityData, survivorData] = await Promise.all([
    loadYAML('epsilon', week),
    loadYAML('sixthCity', week),
    loadYAML('survivor', week)
  ]);
  
  // Render each league's page
  if (epsilonData) {
    renderLeaguePage('epsilon-prs', 'epsilon', epsilonData);
  }
  
  if (sixthCityData) {
    renderLeaguePage('sixth-city-prs', 'sixth-city', sixthCityData);
  }
  
  if (survivorData) {
    renderLeaguePage('survivor-prs', 'survivor', survivorData);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => loadWeeklyHub(1));
} else {
  loadWeeklyHub(1);
}
