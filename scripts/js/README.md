# JavaScript Artifacts

## Navigation 

This JS file handles all dynamic behavior for the site.

### Key Features
1. Page Context Detection
  - Automatically detects which league/section you're on
  - Returns: `'epsilon'`, `'sixth-city'`, `'survivor'`, `'weekly'`, `'global'`, or `'home'`
1. Template Loading
  - Loads bottom nav, header, and appropriate menu
  - Uses async/await for clean asynchronous loading
  - Error handling included
1. Top Bar Management
  - Updates title based on page context
  - Hides hamburger button on home page
  - Shows it everywhere else
1. Active State Highlighting
  - Highlights current tab in bottom navigation
  - Uses data-page attributes to match
1. Hamburger Menu Behavior
  - Opens on button click
  - Closes on:
    - Close button click
    - Clicking overlay background
    - Clicking any menu item
  - Prevents body scrolling when menu is open
1. Smooth Scrolling
  - For Weekly Hub anchor links
  - Smooth scroll to section on click

### Functionality

Example: User visits `/pages/sixth-city/franchises.html`

1. Page loads → `detectPageContext()` returns `'sixth-city'`
1. Templates load:
  - Bottom nav loads
  - Header loads
  - Sixth City menu loads into `#menu-content`
1. `setupPage()` runs:
  - Top bar title = "Sixth City Dynasty"
  - Hamburger button shown
  - Bottom nav "6" icon highlighted
  - Hamburger menu ready to open
1. User taps hamburger → menu slides in
1. User taps "Franchises" → menu closes, stays on same page (or navigates if different page)