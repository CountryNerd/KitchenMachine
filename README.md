# Kitchen Toolbox 🍳

A modern, fast, and comprehensive web application built with TypeScript and Vite to assist with everyday cooking and baking tasks. It provides a suite of 10 kitchen utilities designed to make recipe management, conversions, and timing effortless.

## ✨ Features

- **Timer**: Simple kitchen timer with start, pause, and reset functionality.
- **Temperature Converter**: Quickly convert between Celsius, Fahrenheit, and Kelvin.
- **Cook Time Calculator**: Calculate exact cooking times based on weight and meat type.
- **Recipe Scaler**: Scale your recipe ingredients up or down based on servings.
- **Volume & Weight Converters**: Convert between common culinary measurements (e.g., cups to ml, oz to grams).
- **Kitchen Conversions**: Quick reference for standard kitchen unit equivalents.
- **Doneness Guide**: Temperature guides for safely cooking various types of meat.
- **Substitutes Guide**: Find common ingredient substitutions when you're missing something in the pantry.
- **Recipe Formatter**: Format and organize messy recipe text into clean steps and ingredient lists.

## 🛠️ Tech Stack

- **Framework**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with customized Material Design principles
- **Icons**: Material Icons

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd TempConvertionTool
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 💡 Proposed Improvements

Based on an analysis of the current codebase, here are several recommended improvements to enhance the app's architecture, user experience, and code quality:

### 1. Progressive Web App (PWA) Integration
- **Implementation**: Add `vite-plugin-pwa` to enable offline support and allow users to install the app on their mobile devices.
- **Benefit**: Kitchen tools are mostly used on phones or tablets while cooking; offline access and full-screen experience are essential.

### 2. State Persistence
- **Implementation**: Utilize `localStorage` to save the active timer in the background, remember the last opened tool, and store user preferences (e.g., default unit system: Metric vs Imperial).
- **Benefit**: Users won't lose their running timers or preferred settings if they accidentally refresh the page.

### 3. Cleanup Unused Dependencies and Typo Fixes
- **Implementation**: Remove the `@material/web` dependency from `package.json` as the app relies on custom CSS and Google Font imports for Material Icons, instead of the `@material/web` web components.
- **Implementation**: Rename the repository and package name from `tempconvertiontool` to `kitchen-toolbox` to reflect the expanded scope and fix the spelling error.

### 4. CSS Architecture Optimization
- **Implementation**: Migrate the 14 separate vanilla CSS files imported in `main.ts` to a more robust styling solution like CSS Modules, SCSS, or Tailwind CSS. Alternatively, utilize modern CSS `@import` or nesting to keep the entrypoint cleaner.
- **Benefit**: Better scoping of styles and easier maintainability as the application grows.

### 5. Mobile Responsiveness / Layout Enhancements
- **Implementation**: Update `layout.css` to transition the side `nav-rail` into a bottom navigation bar (`bottom-nav`) on mobile viewports (`@media (max-width: 768px)`).
- **Benefit**: Greatly improves ergonomics for phone users.

### 6. Automated Testing Setup
- **Implementation**: Introduce `Vitest` to test the pure transformation logic located in `src/utils/` (such as `conversion.ts`, `recipeScaler.ts`, etc.).
- **Benefit**: Ensures that unit conversions and recipe scaling calculations remain accurate and prevent regressions in future updates.

### 7. Accessibility (a11y) Improvements
- **Implementation**: Add semantic HTML tags, proper `aria-labels` to buttons (especially icon-only buttons), and ensure robust keyboard navigation (focus states).
- **Benefit**: Makes the application inclusive and usable for people relying on screen readers or keyboard navigation.
