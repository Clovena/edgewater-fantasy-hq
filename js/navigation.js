// navigation.js - Handles template loading, menu behavior, and navigation state

document.addEventListener('DOMContentLoaded', function () {
  // Detect current page context
  const currentPath = window.location.pathname;
  const pageContext = detectPageContext(currentPath);

  // Load templates
  loadTemplates(pageContext);

  // Initialize navigation behavior
  initializeNavigation(pageContext);
});

/**
 * Detect which league/page context we're in
 */
function detectPageContext(path) {
  if (path.includes('/epsilon/')) return 'epsilon';
  if (path.includes('/sixth-city/')) return 'sixth-city';
  if (path.includes('/survivor/')) return 'survivor';
  if (path.includes('weekly-hub')) return 'weekly';
  if (path.includes('/global/')) return 'global'; // not sure about this line yet; TODO later
  return 'home';
}

/**
 * Load all template files
 */
async function loadTemplates(context) {
  try {
    // Load bottom navigation (always present)
    await loadTemplate('/templates/bottom-nav.html', 'bottom-nav');

    // Load header (always present)
    await loadTemplate('/templates/header.html', 'top-bar');

    // Load appropriate menu content based on context
    if (context !== 'home') {
      const menuFile = getMenuFile(context);
      await loadTemplate(menuFile, 'menu-content');
    }

    // After templates load, set up the page
    setupPage(context);
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

/**
 * Load a single template file
 */
async function loadTemplate(templatePath, targetId) {
  const response = await fetch(templatePath);
  const html = await response.text();
  const target = document.getElementById(targetId);
  if (target) {
    target.innerHTML = html;
  }
}

/**
 * Get the appropriate menu file for the context
 */
function getMenuFile(context) {
  const menuFiles = {
    epsilon: '/templates/epsilon-menu.html',
    'sixth-city': '/templates/sixth-city-menu.html',
    survivor: '/templates/survivor-menu.html',
    weekly: '/templates/weekly-menu.html',
    global: '/templates/weekly-menu.html', // Use weekly menu for now, can create global-menu.html later
  };
  return menuFiles[context] || '/templates/epsilon-menu.html';
}

/**
 * Set up page after templates are loaded
 */
function setupPage(context) {
  // Update top bar title
  updateTopBarTitle(context);

  // Show/hide hamburger button
  toggleHamburgerButton(context);

  // Highlight active navigation items
  highlightActiveNav(context);

  // Set up hamburger menu interactions
  setupHamburgerMenu();

  // Set up smooth scrolling for anchor links (Weekly Hub)
  setupSmoothScrolling();
}

/**
 * Update the top bar title based on context
 */
function updateTopBarTitle(context) {
  const titleElement = document.getElementById('top-bar-title');
  if (!titleElement) return;

  const titles = {
    home: 'Fantasy HQ',
    epsilon: 'Epsilon Fantasy',
    'sixth-city': 'Sixth City Dynasty',
    survivor: 'Survivor',
    weekly: 'Weekly Hub',
    global: 'Manager Directory',
  };

  titleElement.textContent = titles[context] || 'Fantasy HQ';
}

/**
 * Show or hide hamburger button (hide on home page)
 */
function toggleHamburgerButton(context) {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  if (!hamburgerBtn) return;

  if (context === 'home') {
    hamburgerBtn.style.display = 'none';
  } else {
    hamburgerBtn.style.display = 'flex';
  }
}

/**
 * Highlight the active navigation item in bottom nav
 */
function highlightActiveNav(context) {
  // Remove all active classes
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => item.classList.remove('active'));

  // Add active class to current context
  const activeItem = document.querySelector(
    `.nav-item[data-page="${context}"]`
  );
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

/**
 * Set up hamburger menu open/close behavior
 */
function setupHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const hamburgerClose = document.getElementById('hamburger-close');
  const hamburgerOverlay = document.getElementById('hamburger-overlay');

  if (!hamburgerBtn || !hamburgerOverlay) return;

  // Open menu
  hamburgerBtn.addEventListener('click', function () {
    hamburgerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });

  // Close menu - close button
  if (hamburgerClose) {
    hamburgerClose.addEventListener('click', function () {
      closeMenu();
    });
  }

  // Close menu - click overlay background
  hamburgerOverlay.addEventListener('click', function (e) {
    if (e.target === hamburgerOverlay) {
      closeMenu();
    }
  });

  // Close menu when clicking a menu item
  const menuItems = hamburgerOverlay.querySelectorAll('.menu-item');
  menuItems.forEach((item) => {
    item.addEventListener('click', function () {
      closeMenu();
    });
  });
}

/**
 * Close the hamburger menu
 */
function closeMenu() {
  const hamburgerOverlay = document.getElementById('hamburger-overlay');
  if (hamburgerOverlay) {
    hamburgerOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
}

/**
 * Set up smooth scrolling for anchor links (Weekly Hub)
 */
function setupSmoothScrolling() {
  document.addEventListener('click', function (e) {
    const target = e.target.closest('a[href^="#"]');
    if (!target) return;

    e.preventDefault();
    const targetId = target.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });
}
