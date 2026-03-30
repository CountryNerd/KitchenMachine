# Project Overview: Kitchen Toolbox
This is a front-end web application built with Vanilla TypeScript and Vite. The application consists of various kitchen utility tools (Timers, Unit Converters, Ingredient Substitutions, etc.).

## 1. Tech Stack & Architecture
- **Language**: TypeScript (Strict typing enabled).
- **Build Tool**: Vite.
- **Framework**: NONE. This is a purely Vanilla DOM manipulation project. Do NOT use React, Vue, Svelte, or jQuery.
- **Component Pattern**: Components are built using two distinct functions per tool:
  1. `render[ToolName]()`: Returns a raw HTML string using template literals.
  2. `attach[ToolName]Listeners()`: Queries the DOM and attaches all necessary event listeners, state management, and real-time calculation logic.

## 2. Styling & UI Standards
- **CSS Framework**: NONE. We use semantic custom CSS classes. Do NOT use Tailwind CSS or Bootstrap utility classes.
- **Design System**: Material Design 3 (MD3). Use defining CSS variables (e.g., `var(--md-sys-color-primary)`) for color themes.
- **Typography**: `Inter` for standard text and `Outfit` for display/headers.
- **Icons**: Utilize Google Material Icons (e.g., `<span class="material-icons">icon_name</span>`).
- **Aesthetics**: Premium, modern, and interactive. Use cards, clear visual hierarchies, glassmorphism, or subtle shadows where appropriate.
- **Class Naming**: Use `kebab-case` for all CSS classes and HTML IDs (e.g., `.timer-card`, `#tc-temp-input`). Prefix tool-specific classes to avoid global collisions (e.g., `tc-` for Temperature Converter).

## 3. State Management & Data
- **Persistence**: Use `localStorage` to persist state across page reloads (e.g., running timers). Use namespaced keys like `kitchenToolbox_[stateName]`.
- **Inter-tool Communication**: Use URL Query Parameters or `window.addEventListener` / `CustomEvent` for tools to talk to each other (e.g., starting a timer from a recipe).
- **Data Structures**: Keep static data (like ingredient substitutions or conversion rates) isolated in dedicated files within `src/data/` using typed Arrays/Objects. Do not hardcode large datasets in component files.

## 4. Coding Conventions
- **Naming**: 
  - `camelCase` for TypeScript variables and functions.
  - `PascalCase` for Interfaces and Types.
- **DOM Selection**: Always strongly type your DOM selections (e.g., `const btn = document.getElementById('my-btn') as HTMLButtonElement;`).
- **Event Listeners**: Clean up intervals/listeners where appropriate to prevent memory leaks if components are ever dynamically destroyed.
- **Input Validation**: When handling inputs (like time or temperature), prevent invalid keystrokes, strip non-numeric characters automatically, and provide easy + / - adjustment buttons.

## 5. Workflow for AI Assistants
When adding a new tool to this project:
1. Define the UI layout in a `render[ToolName].ts` function returning an HTML string.
2. Define the UX/Logic in an `attach[ToolName]Listeners.ts` function.
3. Create an isolated CSS file (e.g., `src/css/tools/[tool].css`) for its styles.
4. Export and hook them up in `src/main.ts`.
