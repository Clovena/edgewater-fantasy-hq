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

// Load team metadata (colors, abbrevs, etc.)
async function loadTeamMetadata(league) {
  try {
    const response = await fetch(`/data/${league}/ref/team_metadata.json`);
    if (response.ok) {
      const metadata = await response.json();
      // Create a name-to-metadata lookup map for easy access
      const nameMap = {};
      for (const [franchiseId, info] of Object.entries(metadata)) {
        nameMap[info.franchise_name] = info;
      }
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
  
  // Apply team-specific color if available
  if (teamMetadata[league] && teamMetadata[league][teamName]) {
    header.style.backgroundColor = teamMetadata[league][teamName].primary;
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
    renderLeaguePage('sixth-city-prs', 'sixthCity', sixthCityData);
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
