# Edgewater Fantasy HQ

A comprehensive fantasy football league management website featuring power rankings, franchise details, and weekly content for multiple leagues.

## Overview

Edgewater Fantasy HQ serves as the central hub for three fantasy football leagues:
- **Epsilon Fantasy** - Redraft league
- **Sixth City Dynasty** - Dynasty league
- **Survivor** - Survivor best-ball league

## Project Structure

```
edgewater-fantasy-hq/
├── assets/             # Static assets
│   ├── fonts/          # Custom team fonts
│   └── logos/          # Team logos
├── css/                # Stylesheets
│   ├── global.css      # Global styles and theme variables
│   ├── epsilon.css     # Epsilon Fantasy theme
│   ├── sixth-city.css  # Sixth City Dynasty theme
│   ├── survivor.css    # Survivor theme
│   └── weekly-hub.css  # Weekly power rankings styles
├── data/               # League data
│   ├── epsilon/        # Epsilon Fantasy data
│   ├── sixth-city/     # Sixth City Dynasty data
│   └── survivor/       # Survivor data
├── pages/              # HTML pages
│   ├── global/         # Cross-league pages
│   ├── epsilon/        # Epsilon specific pages
│   ├── sixth-city/     # Sixth City specific pages
│   └── survivor/       # Survivor specific pages
└── scripts/            # JavaScript files
    └── js/             # Application scripts
```

## Features

### Weekly Hub
- Dynamic power rankings for all leagues
- League and week selection dropdowns
- Print-friendly 8.5x11 layouts
- Team stats with:
  - Current season record
  - Week-to-week ranking movement
  - Last week's matchup results

### Franchise Pages
- Individual team pages with dynamic content
- Custom team fonts loaded from assets
- Team logos and owner information
- League-specific theming

### Data-Driven Design
- CSV-based franchise and schedule data
- YAML-based weekly content (power rankings, blurbs)
- Automatic data loading and caching

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Data Formats**: CSV (franchise/schedule data), YAML (weekly content)
- **Libraries**: js-yaml (YAML parsing)
- **Fonts**: Custom team fonts, Google Fonts (Lato, Bungee)

## Data Structure

### Franchise Data (`fact_franchises.csv`)
Contains team information including:
- Franchise name, abbreviation, owner
- Team colors (primary, secondary, tertiary)
- Custom font assignments
- Conference assignments

### Schedule Data (`fact_schedule.csv`)
Contains game results including:
- Franchise IDs, opponent IDs
- Game results (W/L/T)
- Season and week information

### Weekly Content (`weekXX.yml`)
Contains power rankings for each week:
- Intro (title, subtitle, description, season, week)
- Team rankings (ordered list)
- Team blurbs (analysis for each team)

## Development

### Adding New Weekly Hub content
1. Create `weekXX.yml` in `/data/[league]/content/`
2. Follow the YAML structure with intro, ranks, and blurbs
3. The week will automatically appear in the dropdown

### Adding a New Franchise
1. Add team data to `fact_franchises.csv`
2. Add team logo to `/assets/logos/[ABBREV].png`
3. (Optional) Add custom font to `/assets/fonts/`

### Custom Fonts
- Font files should be placed in `/assets/fonts/`
- Supported formats: .ttf, .otf, .woff, .woff2
- Font names in CSV should match filename (snake_case)

## Code Architecture

### Key Files
- `navigation.js` - Top bar and bottom navigation
- `weekly-hub.js` - Power rankings page logic
- `franchise.js` - Individual franchise page handler
- `franchises.js` - Franchise grid display

### Design Patterns
- CSV/YAML parsing utilities
- Data caching to minimize API calls
- Modular CSS with league-specific themes
- Dynamic font loading via FontFace API

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

<!-- ## Contributing -->

<!-- TODO: Add contribution guidelines -->

<!-- ## License -->

<!-- TODO: Add license information -->

## Accreditation

### Libraries

Special thanks to the creators and maintainers of [`ffscrapr`](https://ffscrapr.ffverse.com/) for their wonderful R package to scrape fantasy platforms. 

### Images

Special thanks to the team at [StatMuse](https://www.statmuse.com/) for their outstanding player images.

### Fonts

- Bungee, Lato, and Rubik by Google Fonts
- All other fonts from Dafont. Used with permission. 

### Misc

- Portions of this project built with the assistance of Claude by Anthropic.

## Acknowledgments

Built for the Edgewater Fantasy Football community.