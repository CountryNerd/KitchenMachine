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
type ThemeName = 'light' | 'dark' | 'fresh';

interface Tool {
  id: ToolName;
  name: string;
  icon: string; // Material Icon name
  render: () => string;
  attachListeners: () => void;
}

interface ThemeOption {
  id: ThemeName;
  label: string;
  icon: string;
  description: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface RelatedInstalledApp {
  id?: string;
  platform: string;
  url?: string;
}

interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<RelatedInstalledApp[]>;
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

const themeOptions: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Fire',
    icon: 'dark_mode',
    description: 'Warm orange and black'
  },
  {
    id: 'fresh',
    label: 'Fresh',
    icon: 'eco',
    description: 'Garden green and bright'
  },
  {
    id: 'light',
    label: 'Paper',
    icon: 'light_mode',
    description: 'Clean light workspace'
  }
];

const savedTool = localStorage.getItem('kitchenToolbox_activeTool') as ToolName | null;
let activeTool: ToolName = savedTool && tools.some(t => t.id === savedTool) ? savedTool : 'timer';
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installedInSession = false;
let hasInstalledRelatedWebApp = false;
const SUPPORT_URL = 'https://buymeacoffee.com/countrynerd';

function getExtendedNavigator(): ExtendedNavigator {
  return window.navigator as ExtendedNavigator;
}

function isStandaloneDisplayMode(): boolean {
  const displayModes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];
  const hasInstalledDisplayMode = displayModes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);
  const isIosStandalone = getExtendedNavigator().standalone === true;
  const hasAndroidAppReferrer = document.referrer.startsWith('android-app://');

  return hasInstalledDisplayMode || isIosStandalone || hasAndroidAppReferrer;
}

function isInstalledExperience(): boolean {
  return isStandaloneDisplayMode() || installedInSession || hasInstalledRelatedWebApp;
}

async function refreshInstalledRelatedAppState() {
  const navigatorWithRelatedApps = getExtendedNavigator();

  if (!navigatorWithRelatedApps.getInstalledRelatedApps) {
    hasInstalledRelatedWebApp = false;
    updateInstallButtonVisibility();
    return;
  }

  try {
    const relatedApps = await navigatorWithRelatedApps.getInstalledRelatedApps();
    hasInstalledRelatedWebApp = relatedApps.some((app) => app.platform === 'webapp');
  } catch {
    hasInstalledRelatedWebApp = false;
  }

  updateInstallButtonVisibility();
}

function getActiveTool(): Tool {
  return tools.find((tool) => tool.id === activeTool) ?? tools[0];
}

function isThemeName(value: string | null | undefined): value is ThemeName {
  return value === 'light' || value === 'dark' || value === 'fresh';
}

function getSavedTheme(): ThemeName {
  const savedTheme = localStorage.getItem('theme');
  return isThemeName(savedTheme) ? savedTheme : 'dark';
}

function getNextTheme(currentTheme: ThemeName): ThemeName {
  if (currentTheme === 'light') {
    return 'dark';
  }
  if (currentTheme === 'dark') {
    return 'fresh';
  }
  return 'light';
}

function renderMobileDock(currentTool: Tool, currentTheme: ThemeName): string {
  const currentThemeOption = themeOptions.find((theme) => theme.id === currentTheme) ?? themeOptions[0];

  return `
    <div class="mobile-dock" aria-label="Mobile toolbar">
      <button
        type="button"
        class="mobile-dock-trigger"
        data-mobile-menu-toggle="true"
        aria-expanded="false"
        aria-controls="mobile-tool-sheet"
      >
        <span class="mobile-dock-trigger-copy">
          <span class="mobile-dock-kicker">Kitchen Toolbox</span>
          <span class="mobile-dock-title" data-mobile-active-label>${currentTool.name}</span>
        </span>
        <span class="mobile-dock-trigger-meta">
          <span class="material-icons mobile-dock-tool-icon" data-mobile-active-icon aria-hidden="true">${currentTool.icon}</span>
          <span class="material-icons mobile-dock-open-icon" aria-hidden="true">apps</span>
        </span>
      </button>

      <button
        type="button"
        class="mobile-theme-cycle"
        data-theme-toggle="true"
        aria-label="Cycle theme"
        title="Cycle theme"
      >
        <span class="material-icons" data-theme-icon aria-hidden="true">${currentThemeOption.icon}</span>
      </button>
    </div>
  `;
}

function renderMobileSheet(currentTheme: ThemeName): string {
  return `
    <div class="mobile-menu-backdrop" data-mobile-menu-close="true" aria-hidden="true"></div>
    <section
      class="mobile-menu-sheet"
      id="mobile-tool-sheet"
      aria-hidden="true"
      aria-label="Kitchen Toolbox mobile menu"
    >
      <div class="mobile-menu-handle" aria-hidden="true"></div>

      <header class="mobile-menu-header">
        <div>
          <div class="mobile-menu-kicker">Tool Switcher</div>
          <h2>Choose your kitchen helper</h2>
          <p>All tools and themes in one clean mobile menu.</p>
        </div>

        <button
          type="button"
          class="mobile-menu-close"
          data-mobile-menu-close="true"
          aria-label="Close mobile menu"
        >
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      </header>

      <div class="mobile-menu-section">
        <div class="mobile-menu-section-label">Tools</div>
        <div class="mobile-menu-tools" role="navigation" aria-label="Kitchen tools">
          ${tools.map((tool) => `
            <button
              type="button"
              class="mobile-menu-tool ${tool.id === activeTool ? 'active' : ''}"
              data-tool="${tool.id}"
              aria-current="${tool.id === activeTool ? 'page' : 'false'}"
            >
              <span class="material-icons" aria-hidden="true">${tool.icon}</span>
              <span class="mobile-menu-tool-copy">
                <span class="mobile-menu-tool-title">${tool.name}</span>
                <span class="mobile-menu-tool-meta">Open ${tool.name.toLowerCase()}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="mobile-menu-section">
        <div class="mobile-menu-section-label">Themes</div>
        <div class="mobile-theme-grid" role="group" aria-label="Theme selection">
          ${themeOptions.map((theme) => `
            <button
              type="button"
              class="mobile-theme-option ${theme.id === currentTheme ? 'active' : ''}"
              data-theme-select="${theme.id}"
              aria-pressed="${theme.id === currentTheme}"
            >
              <span class="material-icons" aria-hidden="true">${theme.icon}</span>
              <span class="mobile-theme-option-copy">
                <span class="mobile-theme-option-title">${theme.label}</span>
                <span class="mobile-theme-option-meta">${theme.description}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="mobile-menu-section">
        <div class="mobile-menu-section-label">Support</div>
        <a
          class="mobile-support-link"
          href="${SUPPORT_URL}"
          target="_blank"
          rel="noreferrer"
          aria-label="Support Kitchen Toolbox on Buy Me a Coffee"
        >
          <span class="material-icons" aria-hidden="true">local_cafe</span>
          <span class="mobile-support-copy">
            <span class="mobile-support-title">Buy me a coffee</span>
            <span class="mobile-support-meta">Help keep Kitchen Toolbox cooking</span>
          </span>
        </a>
      </div>
    </section>
  `;
}

function renderApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const currentTool = getActiveTool();
  const currentTheme = getSavedTheme();

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
            type="button"
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
        <button class="theme-toggle" data-theme-toggle="true" title="Toggle theme" aria-label="Toggle visual theme">
          <span class="material-icons" data-theme-icon aria-hidden="true">${currentTheme === 'dark' ? 'dark_mode' : currentTheme === 'fresh' ? 'eco' : 'light_mode'}</span>
          <span class="theme-toggle-label">Toggle Theme</span>
        </button>
        <a
          href="${SUPPORT_URL}"
          class="nav-support-link"
          target="_blank"
          rel="noreferrer"
          aria-label="Support Kitchen Toolbox on Buy Me a Coffee"
        >
          <span class="material-icons" aria-hidden="true">local_cafe</span>
          <span class="nav-support-copy">
            <span class="nav-support-title">Buy me a coffee</span>
            <span class="nav-support-meta">Support the toolbox</span>
          </span>
        </a>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <div class="app-topbar">
        <div class="app-topbar-copy">
          <div class="app-topbar-kicker">Kitchen Toolbox</div>
          <div class="app-topbar-title">Everyday kitchen helpers in one place</div>
        </div>
        <div class="app-topbar-actions" id="app-topbar-actions" hidden>
          <button
            type="button"
            id="install-app-btn"
            class="app-install-btn"
            hidden
            aria-label="Install Kitchen Toolbox"
          >
            <span class="material-icons" aria-hidden="true">download_for_offline</span>
            <span class="app-install-btn-label">Install App</span>
          </button>
        </div>
      </div>

      <div class="content-container" id="content-container">
        <div id="tool-content">
          <!-- Tool content will be rendered here -->
        </div>
      </div>
    </main>

    ${renderMobileDock(currentTool, currentTheme)}
    ${renderMobileSheet(currentTheme)}
  `;

  renderToolContent();
  attachNavListeners();
  initializeTheme();
  attachInstallButtonListener();
  updateInstallButtonVisibility();
  void refreshInstalledRelatedAppState();

  // Register PWA service worker
  registerSW({ immediate: true })();
}

function renderToolContent() {
  const toolContent = document.querySelector<HTMLDivElement>('#tool-content')!;
  const contentContainer = document.querySelector<HTMLDivElement>('#content-container');
  const currentTool = getActiveTool();

  if (contentContainer) {
    contentContainer.dataset.tool = activeTool;
    contentContainer.classList.toggle('content-container-wide', activeTool === 'format');
  }

  toolContent.innerHTML = currentTool.render();
  currentTool.attachListeners();
  syncNavigationState();
}

function syncNavigationState() {
  const currentTool = getActiveTool();

  document.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => {
    const isActive = button.getAttribute('data-tool') === activeTool;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  const mobileLabel = document.querySelector<HTMLElement>('[data-mobile-active-label]');
  const mobileIcon = document.querySelector<HTMLElement>('[data-mobile-active-icon]');

  if (mobileLabel) {
    mobileLabel.textContent = currentTool.name;
  }

  if (mobileIcon) {
    mobileIcon.textContent = currentTool.icon;
  }
}

function setMobileMenuOpen(isOpen: boolean) {
  document.body.classList.toggle('mobile-menu-open', isOpen);

  const trigger = document.querySelector<HTMLElement>('[data-mobile-menu-toggle]');
  const backdrop = document.querySelector<HTMLElement>('.mobile-menu-backdrop');
  const sheet = document.querySelector<HTMLElement>('.mobile-menu-sheet');

  if (trigger) {
    trigger.setAttribute('aria-expanded', String(isOpen));
  }

  if (backdrop) {
    backdrop.setAttribute('aria-hidden', String(!isOpen));
  }

  if (sheet) {
    sheet.setAttribute('aria-hidden', String(!isOpen));
  }
}

function setTheme(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
}

function attachNavListeners() {
  const toolButtons = document.querySelectorAll<HTMLButtonElement>('[data-tool]');

  const activateTool = (toolId: ToolName) => {
    if (toolId === activeTool) {
      setMobileMenuOpen(false);
      return;
    }

    activeTool = toolId;
    localStorage.setItem('kitchenToolbox_activeTool', activeTool);
    renderToolContent();
    setMobileMenuOpen(false);

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  toolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const toolId = button.dataset.tool as ToolName;
      activateTool(toolId);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-mobile-menu-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const isOpen = document.body.classList.contains('mobile-menu-open');
      setMobileMenuOpen(!isOpen);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-mobile-menu-close]').forEach((button) => {
    button.addEventListener('click', () => {
      setMobileMenuOpen(false);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-theme-select]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTheme = button.dataset.themeSelect;
      if (isThemeName(nextTheme)) {
        setTheme(nextTheme);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setMobileMenuOpen(false);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  });
}

// Theme management
function initializeTheme() {
  const savedTheme = getSavedTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  syncNavigationState();

  const themeToggles = document.querySelectorAll<HTMLElement>('[data-theme-toggle]');
  themeToggles.forEach((toggle) => {
    toggle.addEventListener('click', toggleTheme);
  });
}

function toggleTheme() {
  const currentTheme = getSavedTheme();
  setTheme(getNextTheme(currentTheme));
}

function updateThemeIcon(theme: ThemeName) {
  const nextIcon = theme === 'light' ? 'light_mode' : theme === 'dark' ? 'dark_mode' : 'eco';

  document.querySelectorAll<HTMLElement>('[data-theme-icon]').forEach((icon) => {
    icon.textContent = nextIcon;
  });

  document.querySelectorAll<HTMLButtonElement>('[data-theme-select]').forEach((button) => {
    const isActive = button.dataset.themeSelect === theme;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateInstallButtonVisibility() {
  const installActions = document.querySelector<HTMLElement>('#app-topbar-actions');
  const installButton = document.querySelector<HTMLButtonElement>('#install-app-btn');
  if (!installButton || !installActions) {
    return;
  }

  const shouldShow = Boolean(deferredInstallPrompt) && !isInstalledExperience();
  installActions.hidden = !shouldShow;
  installButton.hidden = !shouldShow;
}

function attachInstallButtonListener() {
  const installButton = document.querySelector<HTMLButtonElement>('#install-app-btn');
  if (!installButton) {
    return;
  }

  installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    const label = installButton.querySelector<HTMLElement>('.app-install-btn-label');
    installButton.disabled = true;
    if (label) {
      label.textContent = 'Opening...';
    }

    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        installedInSession = true;
        hasInstalledRelatedWebApp = true;
        deferredInstallPrompt = null;
      }
    } finally {
      installButton.disabled = false;
      if (label) {
        label.textContent = 'Install App';
      }
      updateInstallButtonVisibility();
    }
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  if (isInstalledExperience()) {
    deferredInstallPrompt = null;
    updateInstallButtonVisibility();
    return;
  }
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  updateInstallButtonVisibility();
});

window.addEventListener('appinstalled', () => {
  installedInSession = true;
  hasInstalledRelatedWebApp = true;
  deferredInstallPrompt = null;
  updateInstallButtonVisibility();
});

window.addEventListener('focus', () => {
  void refreshInstalledRelatedAppState();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    void refreshInstalledRelatedAppState();
  }
});

// Initialize app
renderApp();
