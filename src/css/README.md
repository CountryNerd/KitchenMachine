# CSS Architecture

This folder contains the modular CSS architecture for the Kitchen Toolbox application.

## Structure

```
css/
├── main.css                 # Main entry point - imports all CSS modules
├── variables.css            # CSS custom properties (spacing, typography)
├── base.css                # Reset styles, body, #app
├── layout.css              # Navigation rail, main content area
├── themes/                 # Theme-specific styles
│   ├── light.css          # Light theme with kitchen tile background
│   ├── dark.css           # Dark theme with fire/flame effects
│   └── fresh.css          # Fresh green theme
├── components/             # Reusable component styles
│   ├── cards.css          # Card container styles
│   ├── buttons.css        # Buttons and category chips
│   ├── forms.css          # Form inputs, selects, textareas
│   ├── results.css        # Result displays and animations
│   └── footer.css         # Footer and notices
└── tools/                  # Tool-specific styles
    ├── timer.css          # Kitchen timer component
    └── misc.css           # Other tool-specific styles

## Import Order

The CSS files are imported in a specific order in `main.css`:

1. **Variables** - Define CSS custom properties
2. **Base** - Reset and foundational styles
3. **Themes** - Theme color schemes and backgrounds
4. **Layout** - Page structure and navigation
5. **Components** - Reusable UI components
6. **Tools** - Tool-specific styles

## Adding New Styles

### For a new component:
Create a new file in `components/` and import it in `main.css`

### For a new theme:
Create a new file in `themes/` and import it in `main.css`

### For a new tool:
Create a new file in `tools/` and import it in `main.css`

## Theme System

Themes are activated by setting `data-theme` attribute on the root element:
- `data-theme="light"` - Light theme
- `data-theme="dark"` - Dark theme
- `data-theme="fresh"` - Fresh theme

Each theme file defines:
- Color tokens (--md-sys-color-*)
- Elevation shadows (--elevation-*)
- Background patterns
- Theme-specific component overrides
