/// <reference types="vite-plugin-pwa/client" />
import './css/index.css';
import { registerSW } from 'virtual:pwa-register';
import { renderKitchenTimer, attachKitchenTimerListeners } from './tools/kitchenTimer';
import { renderTemperatureConverter, attachTemperatureConverterListeners } from './tools/temperatureConverter';
import { renderUnitConverter, attachUnitConverterListeners } from './tools/unitConverter';
import { renderRecipeScaler, attachRecipeScalerListeners } from './tools/recipeScaler';
import { renderRecipeFormatter, attachRecipeFormatterListeners } from './tools/recipeFormatter';
import { renderSubstitutionGuide, attachSubstitutionGuideListeners } from './tools/substitutionGuide';
import { renderDonenessGuide, attachDonenessGuideListeners } from './tools/donenessGuide';
import { renderMeasurementConverter, attachMeasurementConverterListeners } from './tools/measurementConverter';
import { renderCookingTimeCalculator, attachCookingTimeCalculatorListeners } from './tools/cookingTimeCalculator';
import { renderKitchenUnitCalculator, attachKitchenUnitCalculatorListeners } from './tools/kitchenUnitCalculator';

type ToolName = 'temp' | 'units' | 'scale' | 'format' | 'timer' | 'subs' | 'doneness' | 'measure' | 'cooktime' | 'kitchenunit';

interface Tool {
  id: ToolName;
  name: string;
  icon: string; // Material Icon name
  render: () => string;
  attachListeners: () => void;
}

const tools: Tool[] = [
  {
    id: 'timer',
    name: 'Timer',
    icon: 'hourglass_empty',
    render: renderKitchenTimer,
    attachListeners: attachKitchenTimerListeners,
  },
  {
    id: 'temp',
    name: 'Temperature',
    icon: 'thermostat',
    render: renderTemperatureConverter,
    attachListeners: attachTemperatureConverterListeners,
  },
  {
    id: 'cooktime',
    name: 'Cook Time',
    icon: 'timer',
    render: renderCookingTimeCalculator,
    attachListeners: attachCookingTimeCalculatorListeners,
  },
  {
    id: 'scale',
    name: 'Recipe Scaler',
    icon: 'scale',
    render: renderRecipeScaler,
    attachListeners: attachRecipeScalerListeners,
  },
  {
    id: 'units',
    name: 'Volume',
    icon: 'water_drop',
    render: renderUnitConverter,
    attachListeners: attachUnitConverterListeners,
  },
  {
    id: 'measure',
    name: 'Weight',
    icon: 'monitor_weight',
    render: renderMeasurementConverter,
    attachListeners: attachMeasurementConverterListeners,
  },
  {
    id: 'kitchenunit',
    name: 'Conversions',
    icon: 'kitchen',
    render: renderKitchenUnitCalculator,
    attachListeners: attachKitchenUnitCalculatorListeners,
  },
  {
    id: 'doneness',
    name: 'Doneness',
    icon: 'local_fire_department',
    render: renderDonenessGuide,
    attachListeners: attachDonenessGuideListeners,
  },
  {
    id: 'subs',
    name: 'Substitutes',
    icon: 'swap_horiz',
    render: renderSubstitutionGuide,
    attachListeners: attachSubstitutionGuideListeners,
  },
  {
    id: 'format',
    name: 'Format Recipe',
    icon: 'format_list_bulleted',
    render: renderRecipeFormatter,
    attachListeners: attachRecipeFormatterListeners,
  },
];

const savedTool = localStorage.getItem('kitchenToolbox_activeTool') as ToolName | null;
let activeTool: ToolName = savedTool && tools.some(t => t.id === savedTool) ? savedTool : 'timer';

function renderApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  app.innerHTML = `
    <!-- Navigation Rail -->
    <nav class="nav-rail">
      <div class="nav-header">
        <span class="material-icons nav-logo-icon" aria-hidden="true">restaurant_menu</span>
        <span class="nav-title">Kitchen Toolbox</span>
      </div>

      <div class="nav-items" role="navigation" aria-label="Main Navigation">
        ${tools.map(tool => `
          <button
            class="nav-item ${tool.id === activeTool ? 'active' : ''}"
            data-tool="${tool.id}"
            title="${tool.name}"
            aria-label="${tool.name}"
            aria-current="${tool.id === activeTool ? 'page' : 'false'}"
          >
            <span class="material-icons" aria-hidden="true">${tool.icon}</span>
            <span class="nav-item-label">${tool.name}</span>
          </button>
        `).join('')}
      </div>

      <div class="theme-toggle-container">
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme" aria-label="Toggle visual theme">
          <span class="material-icons" id="theme-icon" aria-hidden="true">light_mode</span>
          <span class="theme-toggle-label">Toggle Theme</span>
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-container">
        <div id="tool-content">
          <!-- Tool content will be rendered here -->
        </div>
      </div>
    </main>
  `;

  renderToolContent();
  attachNavListeners();
  initializeTheme();

  // Register PWA service worker
  registerSW({ immediate: true })();
}

function renderToolContent() {
  const toolContent = document.querySelector<HTMLDivElement>('#tool-content')!;
  const currentTool = tools.find(t => t.id === activeTool)!;

  toolContent.innerHTML = currentTool.render();
  currentTool.attachListeners();
}

function attachNavListeners() {
  const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-item');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const toolId = button.dataset.tool as ToolName;
      if (toolId !== activeTool) {
        activeTool = toolId;
        localStorage.setItem('kitchenToolbox_activeTool', activeTool);

        // Update active state
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Render new tool content
        renderToolContent();

        // Scroll to top
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  });
}

// Theme management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  // Cycle through: light → dark → fresh → light
  let newTheme: string;
  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'fresh';
  } else {
    newTheme = 'light';
  }

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme: string) {
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    if (theme === 'light') {
      themeIcon.textContent = 'light_mode';
    } else if (theme === 'dark') {
      themeIcon.textContent = 'dark_mode';
    } else {
      themeIcon.textContent = 'eco'; // Green leaf icon for Fresh theme
    }
  }
}

// Initialize app
renderApp();
