// src/tools/kitchenTimer.ts

/**
 * Kitchen Timer Component
 * Implements a countdown timer with start, pause, and reset functionality.
 * Uses Material Design 3 styling and Material Icons.
 * Supports external initialization from other tools.
 */

let timerInterval: number | null = null;
let remainingSeconds = 0;
let totalSeconds = 0;
let timerAudioContext: AudioContext | null = null;
let titleFlashInterval: number | null = null;
let activeTimerNotification: Notification | null = null;
let lastDocumentTitle = document.title;

interface BeforeInstallableNotification extends NotificationOptions {
    badge?: string;
    vibrate?: number[];
}

function supportsNotifications(): boolean {
    return 'Notification' in window;
}

function supportsAudioContext(): boolean {
    return 'AudioContext' in window || 'webkitAudioContext' in window;
}

async function ensureTimerAudioReady(): Promise<AudioContext | null> {
    if (!supportsAudioContext()) {
        return null;
    }

    if (!timerAudioContext) {
        const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & {
            webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

        if (!AudioContextCtor) {
            return null;
        }

        timerAudioContext = new AudioContextCtor();
    }

    if (timerAudioContext.state === 'suspended') {
        await timerAudioContext.resume();
    }

    return timerAudioContext;
}

function getTimerDurationLabel(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    const parts: string[] = [];

    if (hours > 0) {
        parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    }

    if (remaining > 0 || parts.length === 0) {
        parts.push(`${remaining} second${remaining === 1 ? '' : 's'}`);
    }

    return parts.join(' ');
}

function stopTitleFlash() {
    if (titleFlashInterval !== null) {
        clearInterval(titleFlashInterval);
        titleFlashInterval = null;
        document.title = lastDocumentTitle;
    }
}

function startTitleFlash() {
    stopTitleFlash();
    lastDocumentTitle = document.title;
    let showAlertTitle = true;

    titleFlashInterval = window.setInterval(() => {
        document.title = showAlertTitle ? 'Timer Done • Kitchen Toolbox' : lastDocumentTitle;
        showAlertTitle = !showAlertTitle;
    }, 1000);
}

function stopActiveNotification() {
    activeTimerNotification?.close();
    activeTimerNotification = null;
}

function playTimerAlarm() {
    if (!timerAudioContext) {
        return;
    }

    const now = timerAudioContext.currentTime;
    const beepCount = 4;

    for (let index = 0; index < beepCount; index += 1) {
        const startTime = now + (index * 0.42);
        const oscillator = timerAudioContext.createOscillator();
        const gainNode = timerAudioContext.createGain();

        oscillator.type = index % 2 === 0 ? 'triangle' : 'square';
        oscillator.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, startTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.22, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.26);

        oscillator.connect(gainNode);
        gainNode.connect(timerAudioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.28);
    }
}

async function requestTimerNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!supportsNotifications()) {
        return 'unsupported';
    }

    if (Notification.permission !== 'default') {
        return Notification.permission;
    }

    return await Notification.requestPermission();
}

export function renderKitchenTimer(): string {
    return `
    <div class="card timer-card">
      <h2 class="timer-title">Kitchen Timer</h2>

      <div class="timer-circle">
        <svg class="timer-progress-ring" width="400" height="400">
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--md-sys-color-primary)" />
              <stop offset="100%" stop-color="var(--md-sys-color-error)" />
            </linearGradient>
          </defs>
          <circle class="timer-progress-ring-bg" cx="200" cy="200" r="180" />
          <circle class="timer-progress-ring-fill" cx="200" cy="200" r="180" id="timer-progress-circle" />
        </svg>
        <div class="timer-display-container">
          <div class="timer-display-editable">
            <input type="text" id="timer-hours" class="timer-digit-input" value="00" maxlength="2" />
            <span class="timer-separator">:</span>
            <input type="text" id="timer-minutes" class="timer-digit-input" value="05" maxlength="2" />
            <span class="timer-separator">:</span>
            <input type="text" id="timer-seconds" class="timer-digit-input" value="00" maxlength="2" />
          </div>
          <div class="timer-label">
            <span class="material-icons" aria-hidden="true">touch_app</span>
            <span class="timer-label-desktop">Click to edit • Use ↑↓ arrows</span>
            <span class="timer-label-mobile">Tap time to edit</span>
          </div>
        </div>
      </div>

      <div class="timer-quick-actions" role="group" aria-label="Quick add time">
        <button class="timer-quick-btn" id="add-30-sec" title="Add 30 seconds" aria-label="Add 30 seconds">
          <span class="material-icons" aria-hidden="true">add</span>
          <span>30 sec</span>
        </button>
        <button class="timer-quick-btn" id="add-1-min" title="Add 1 minute" aria-label="Add 1 minute">
          <span class="material-icons" aria-hidden="true">add</span>
          <span>1 min</span>
        </button>
        <button class="timer-quick-btn" id="add-5-min" title="Add 5 minutes" aria-label="Add 5 minutes">
          <span class="material-icons" aria-hidden="true">add</span>
          <span>5 min</span>
        </button>
      </div>

      <div class="timer-alerts" aria-live="polite">
        <div id="timer-alert-status" class="timer-alert-status">
          Sound is ready when you start the timer.
        </div>
        <button type="button" id="timer-enable-notifications" class="timer-notify-btn" hidden>
          <span class="material-icons" aria-hidden="true">notifications_active</span>
          Enable notifications
        </button>
      </div>

      <div class="timer-controls" role="group" aria-label="Timer controls">
        <button class="timer-btn timer-btn-start" id="timer-start" title="Start" aria-label="Start timer">
          <span class="material-icons" aria-hidden="true">play_arrow</span>
        </button>
        <button class="timer-btn" id="timer-pause" title="Pause" aria-label="Pause timer">
          <span class="material-icons" aria-hidden="true">pause</span>
        </button>
        <button class="timer-btn" id="timer-reset" title="Reset" aria-label="Reset timer">
          <span class="material-icons" aria-hidden="true">restart_alt</span>
        </button>
      </div>
    </div>
  `;
}

export function attachKitchenTimerListeners(): void {
    const startBtn = document.getElementById('timer-start') as HTMLButtonElement;
    const pauseBtn = document.getElementById('timer-pause') as HTMLButtonElement;
    const resetBtn = document.getElementById('timer-reset') as HTMLButtonElement;
    const hoursInput = document.getElementById('timer-hours') as HTMLInputElement;
    const minutesInput = document.getElementById('timer-minutes') as HTMLInputElement;
    const secondsInput = document.getElementById('timer-seconds') as HTMLInputElement;
    const progressCircle = document.getElementById('timer-progress-circle') as unknown as SVGCircleElement;
    const alertsContainer = document.querySelector('.timer-alerts') as HTMLDivElement | null;
    const alertStatus = document.getElementById('timer-alert-status') as HTMLDivElement | null;
    const enableNotificationsBtn = document.getElementById('timer-enable-notifications') as HTMLButtonElement | null;

    let isRunning = false;
    let isFinished = false;

    // Calculate circle circumference (2πr where r=180)
    const radius = 180;
    const circumference = 2 * Math.PI * radius;

    // Set up the SVG circle
    if (progressCircle) {
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircle.style.strokeDashoffset = `0`;
    }

    function updateAlertsVisibility() {
        if (!alertsContainer) {
            return;
        }

        const shouldShow = isFinished
            || isRunning
            || (supportsNotifications() && Notification.permission !== 'granted');

        alertsContainer.hidden = !shouldShow;
    }

    function updateAlertStatus(message?: string) {
        if (!alertStatus) {
            return;
        }

        if (message) {
            alertStatus.textContent = message;
            updateAlertsVisibility();
            return;
        }

        if (isFinished) {
            alertStatus.textContent = 'Time is up. Alarm, vibration, and browser alerts have been triggered.';
            updateAlertsVisibility();
            return;
        }

        const soundState = supportsAudioContext()
            ? 'Sound is ready when you start the timer.'
            : 'Sound may be limited in this browser.';

        if (!supportsNotifications()) {
            alertStatus.textContent = isRunning
                ? 'Timer running. Sound alarm is armed for this device.'
                : soundState;
            updateAlertsVisibility();
            return;
        }

        if (Notification.permission === 'granted') {
            alertStatus.textContent = isRunning
                ? 'Timer running. Sound and notifications are armed.'
                : soundState;
            updateAlertsVisibility();
            return;
        }

        if (Notification.permission === 'denied') {
            alertStatus.textContent = isRunning
                ? 'Timer running. Browser notifications are blocked in your browser settings.'
                : `${soundState} Browser notifications are blocked in your browser settings.`;
            updateAlertsVisibility();
            return;
        }

        alertStatus.textContent = isRunning
            ? 'Timer running. Enable browser notifications for background alerts.'
            : `${soundState} Enable browser notifications for background alerts.`;
        updateAlertsVisibility();
    }

    function updateNotificationButton() {
        if (!enableNotificationsBtn) {
            return;
        }

        if (!supportsNotifications()) {
            enableNotificationsBtn.hidden = true;
            updateAlertsVisibility();
            return;
        }

        if (Notification.permission === 'default') {
            enableNotificationsBtn.hidden = false;
            enableNotificationsBtn.disabled = false;
            updateAlertsVisibility();
            return;
        }

        enableNotificationsBtn.hidden = true;
        updateAlertsVisibility();
    }

    function clearCompletionState() {
        isFinished = false;
        document.querySelector('.timer-card')?.classList.remove('timer-complete');
        stopTitleFlash();
        stopActiveNotification();
        updateAlertStatus();
    }

    function updateProgress() {
        if (!progressCircle || totalSeconds === 0) return;

        const percentage = remainingSeconds / totalSeconds;
        const offset = circumference * (1 - percentage);
        progressCircle.style.strokeDashoffset = `${offset}`;
    }

    // Auto-select content when input is focused
    [hoursInput, minutesInput, secondsInput].forEach(input => {
        input.addEventListener('focus', () => input.select());
        input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            // Only allow digits
            target.value = target.value.replace(/[^0-9]/g, '');
            // Pad with leading zero if needed
            if (target.value.length === 2 && target !== secondsInput) {
                const nextInput = target === hoursInput ? minutesInput : secondsInput;
                nextInput.focus();
            }

            // If timer is running and user manually edits time
            if (isRunning && remainingSeconds > 0) {
                const newSeconds = getSecondsFromDisplay();
                remainingSeconds = newSeconds;

                // If new time is larger than original start time, reset the ring
                if (remainingSeconds > totalSeconds) {
                    totalSeconds = remainingSeconds;
                }
                // Otherwise progress ring adjusts proportionally to original start time

                updateProgress();
            }

            if (!isRunning) {
                clearCompletionState();
            }
        });

        // Arrow key controls
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const currentValue = parseInt(input.value) || 0;
                const delta = e.key === 'ArrowUp' ? 1 : -1;
                let newValue = currentValue + delta;

                // Set max values based on field
                let maxValue = 99; // hours default
                if (input === minutesInput || input === secondsInput) {
                    maxValue = 59;
                }

                // Wrap around
                if (newValue > maxValue) newValue = 0;
                if (newValue < 0) newValue = maxValue;

                input.value = newValue.toString().padStart(2, '0');

                // If timer is running and user uses arrow keys
                if (isRunning && remainingSeconds > 0) {
                    const newSeconds = getSecondsFromDisplay();
                    remainingSeconds = newSeconds;

                    // If new time is larger than original start time, reset the ring
                    if (remainingSeconds > totalSeconds) {
                        totalSeconds = remainingSeconds;
                    }
                    // Otherwise progress ring adjusts proportionally to original start time

                    updateProgress();
                }

                if (!isRunning) {
                    clearCompletionState();
                }
            }
        });
    });

    function updateDisplayFromSeconds(seconds: number) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        hoursInput.value = hours.toString().padStart(2, '0');
        minutesInput.value = mins.toString().padStart(2, '0');
        secondsInput.value = secs.toString().padStart(2, '0');
    }

    function getSecondsFromDisplay(): number {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    async function notifyTimerComplete() {
        if (supportsNotifications() && Notification.permission === 'granted') {
            try {
                stopActiveNotification();
                activeTimerNotification = new Notification('Kitchen timer finished', {
                    body: `${getTimerDurationLabel(totalSeconds || remainingSeconds)} is up.`,
                    icon: '/icon-192.png',
                    badge: '/icon-maskable-192.png',
                    tag: 'kitchen-toolbox-timer',
                    requireInteraction: true,
                    vibrate: [220, 120, 220, 120, 420]
                } as BeforeInstallableNotification);
                activeTimerNotification.onclick = () => {
                    window.focus();
                    stopActiveNotification();
                    stopTitleFlash();
                };
            } catch (error) {
                console.warn('Failed to show timer notification', error);
            }
        }
    }

    async function completeTimer() {
        localStorage.removeItem('kitchenToolbox_timerState');
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        isRunning = false;
        isFinished = true;
        remainingSeconds = 0;
        totalSeconds = 0;
        updateDisplayFromSeconds(0);
        updateProgress();
        [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = false);
        document.querySelector('.timer-card')?.classList.add('timer-complete');

        try {
            await ensureTimerAudioReady();
            playTimerAlarm();
        } catch (error) {
            console.warn('Timer alarm audio failed', error);
        }

        if ('vibrate' in navigator) {
            navigator.vibrate?.([220, 120, 220, 120, 420]);
        }

        startTitleFlash();
        updateAlertStatus();
        await notifyTimerComplete();
    }

    // Check if timer was initialized from another tool
    const urlParams = new URLSearchParams(window.location.search);
    const presetMinutes = urlParams.get('timerMinutes');
    if (presetMinutes) {
        const totalMinutes = parseFloat(presetMinutes);
        if (!isNaN(totalMinutes) && totalMinutes > 0) {
            remainingSeconds = Math.round(totalMinutes * 60);
            updateDisplayFromSeconds(remainingSeconds);
            // Clear the URL parameter
            window.history.replaceState({}, '', window.location.pathname);
            // Auto-start the timer
            void startTimer();
        }
    }

    // Listen for custom event from other tools
    window.addEventListener('initTimer', (e: Event) => {
        const customEvent = e as CustomEvent;
        const totalMinutes = customEvent.detail.minutes;
        if (totalMinutes && totalMinutes > 0) {
            remainingSeconds = Math.round(totalMinutes * 60);
            updateDisplayFromSeconds(remainingSeconds);
            // Clear the URL parameter
            window.history.replaceState({}, '', window.location.pathname);
            // Auto-start the timer
            void startTimer();
        }
    });

    async function startTimer(fromUserGesture = false) {
        if (timerInterval !== null) return; // already running

        clearCompletionState();

        if (remainingSeconds <= 0) {
            remainingSeconds = getSecondsFromDisplay();

            if (remainingSeconds <= 0) {
                alert('Please enter a valid duration');
                return;
            }
        }

        if (fromUserGesture) {
            try {
                await ensureTimerAudioReady();
            } catch (error) {
                console.warn('Unable to arm timer audio', error);
            }

            if (supportsNotifications() && Notification.permission === 'default') {
                await requestTimerNotificationPermission();
            }
            updateNotificationButton();
        }

        // Set total seconds for progress calculation
        totalSeconds = remainingSeconds;
        updateProgress();

        isRunning = true;
        isFinished = false;
        [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = true);
        updateAlertStatus();

        timerInterval = window.setInterval(() => {
            remainingSeconds--;
            localStorage.setItem('kitchenToolbox_timerState', JSON.stringify({ remainingSeconds, totalSeconds, timestamp: Date.now() }));
            updateProgress();
            if (remainingSeconds <= 0) {
                void completeTimer();
                return;
            }
            updateDisplayFromSeconds(Math.max(remainingSeconds, 0));
        }, 1000);
    }

    startBtn.addEventListener('click', () => {
        void startTimer(true);
    });

    pauseBtn.addEventListener('click', () => {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = false);
            updateAlertStatus();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
        remainingSeconds = 0;
        totalSeconds = 0;
        localStorage.removeItem('kitchenToolbox_timerState');
        hoursInput.value = '00';
        minutesInput.value = '05';
        secondsInput.value = '00';
        [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = false);
        clearCompletionState();

        // Reset progress circle
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = `0`;
        }
    });

    // Quick action buttons
    const add30SecBtn = document.getElementById('add-30-sec') as HTMLButtonElement;
    const add1MinBtn = document.getElementById('add-1-min') as HTMLButtonElement;
    const add5MinBtn = document.getElementById('add-5-min') as HTMLButtonElement;

    function addSeconds(seconds: number) {
        clearCompletionState();
        // If timer is running, add to remainingSeconds
        if (isRunning && remainingSeconds > 0) {
            remainingSeconds += seconds;

            // If new time is larger than original start time, reset the ring
            if (remainingSeconds > totalSeconds) {
                totalSeconds = remainingSeconds;
            }
            // Otherwise progress ring adjusts proportionally to original start time

            updateDisplayFromSeconds(remainingSeconds);
            updateProgress();
        } else {
            // If timer is not running, just update the display
            const currentSeconds = getSecondsFromDisplay();
            const newSeconds = currentSeconds + seconds;
            updateDisplayFromSeconds(newSeconds);
        }
    }

    add30SecBtn.addEventListener('click', () => addSeconds(30));
    add1MinBtn.addEventListener('click', () => addSeconds(60));
    add5MinBtn.addEventListener('click', () => addSeconds(300));

    enableNotificationsBtn?.addEventListener('click', async () => {
        enableNotificationsBtn.disabled = true;
        const previousLabel = enableNotificationsBtn.innerHTML;
        enableNotificationsBtn.innerHTML = '<span class="material-icons" aria-hidden="true">notifications</span> Enabling...';

        try {
            await requestTimerNotificationPermission();
        } finally {
            enableNotificationsBtn.disabled = false;
            enableNotificationsBtn.innerHTML = previousLabel;
            updateNotificationButton();
            updateAlertStatus();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            stopTitleFlash();
        }
    });

    // Restore state from localStorage
    const savedTimer = localStorage.getItem('kitchenToolbox_timerState');
    if (savedTimer) {
        try {
            const state = JSON.parse(savedTimer);
            const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);
            const remaining = state.remainingSeconds - elapsed;
            if (remaining > 0) {
                remainingSeconds = remaining;
                totalSeconds = state.totalSeconds;
                updateDisplayFromSeconds(remainingSeconds);
                void startTimer();
            } else {
                localStorage.removeItem('kitchenToolbox_timerState');
            }
        } catch (e) {
            console.error('Failed to parse timer state', e);
        }
    }

    updateNotificationButton();
    updateAlertStatus();
}

// Export function to allow other tools to start the timer
export function startTimerWithDuration(minutes: number): void {
    // Navigate to timer with query parameter
    window.location.href = `${window.location.pathname}?timerMinutes=${minutes}#timer`;
}
