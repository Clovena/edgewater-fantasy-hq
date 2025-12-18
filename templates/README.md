# HTML Page Templates

Templates are used to display universal elements across pages.

## Top Header

This is the top bar which contains an adaptable hamburger menu with contents based on the active league in the bottom nav (below).

### Key Features

1. Top Bar
  - Hamburger button: three-line icon which opens the menu
  - Title: displays page/league name
  - Spacer: balances the layout
1. Hamburger Menu Overlay
  - Overlay: full-screen dark background
  - Menu: Slides in from the left
  - Close button: X icon to close menu
  - Menu content: dynamically loaded based on active league

### Functionality
- `navigation.js` will:
  - Detect current active page
  - Update `top-bar-title` text accordingly
  - Hide hamburger button if on home page
  - Load appropriate menu content
- Hamburger menu click or tap will:
  - Add `.active` class to overlay
  - Prevent body scrolling
- Cose or overlay click will:
  - Remove `.active` class to hide menu
  - Re-enable body scrolling

## Bottom Nav

This is the fixed bottom navigation bar with 5 tabs.

### Key Features

1. Icon Design
  - **Home**: house icon 
  - **Epsilon (Ɛ)**: epsilon symbol in Knewave font
  - **Sixth City (6)**: numeral 6 in Bungee font
  - **Survivor (S)**: letter S in Rubik Dirt font
  - **Weekly**: calendar icon
1. Data Attributes
```html
data-page="home"
```
  - JavaScript will use these to highlight the active tab
  - Matches against current page url
1. Structure
  - Each nav item has:
    - svg icon, styled via CSS
    - Text label; can be hidden on mobile if needed
    - Absolute path link

### Functionality
- `navigation.js` will:
  - Check the current page url
  - Add `.active` class to the matching nav item
  - Style it differently (brighter color, underline, etc.)
