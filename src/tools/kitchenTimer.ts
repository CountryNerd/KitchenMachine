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
          <div class="timer-label"><span class="material-icons" style="font-size: 14px; vertical-align: middle;">touch_app</span> Click to edit • Use ↑↓ arrows</div>
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
        <button class="timer-quick-btn" id="add-3-min" title="Add 3 minutes" aria-label="Add 3 minutes">
          <span class="material-icons" aria-hidden="true">add</span>
          <span>3 min</span>
        </button>
        <button class="timer-quick-btn" id="add-5-min" title="Add 5 minutes" aria-label="Add 5 minutes">
          <span class="material-icons" aria-hidden="true">add</span>
          <span>5 min</span>
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

    let isRunning = false;

    // Calculate circle circumference (2πr where r=180)
    const radius = 180;
    const circumference = 2 * Math.PI * radius;

    // Set up the SVG circle
    if (progressCircle) {
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircle.style.strokeDashoffset = `0`;
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
            startTimer();
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
            startTimer();
        }
    });

    function startTimer() {
        if (timerInterval !== null) return; // already running

        if (remainingSeconds <= 0) {
            remainingSeconds = getSecondsFromDisplay();

            if (remainingSeconds <= 0) {
                alert('Please enter a valid duration');
                return;
            }
        }

        // Set total seconds for progress calculation
        totalSeconds = remainingSeconds;
        updateProgress();

        isRunning = true;
        [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = true);

        timerInterval = window.setInterval(() => {
            remainingSeconds--;
            localStorage.setItem('kitchenToolbox_timerState', JSON.stringify({ remainingSeconds, totalSeconds, timestamp: Date.now() }));
            updateProgress();
            if (remainingSeconds <= 0) {
                localStorage.removeItem('kitchenToolbox_timerState');
                clearInterval(timerInterval!);
                timerInterval = null;
                isRunning = false;
                totalSeconds = 0;
                [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = false);
                alert('⏰ Time is up!');
                // Play a sound if possible
                try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eeeTRAMUKfj8LZjHAY4ktjyzHksBSR3yPDdkEAKFF606+uoVRQKRp/g8r5sIQUrgsz');
                    audio.play();
                } catch (e) {
                    // Ignore audio errors
                }
            }
            updateDisplayFromSeconds(Math.max(remainingSeconds, 0));
        }, 1000);
    }

    startBtn.addEventListener('click', startTimer);

    pauseBtn.addEventListener('click', () => {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            [hoursInput, minutesInput, secondsInput].forEach(input => input.disabled = false);
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

        // Reset progress circle
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = `0`;
        }
    });

    // Quick action buttons
    const add30SecBtn = document.getElementById('add-30-sec') as HTMLButtonElement;
    const add1MinBtn = document.getElementById('add-1-min') as HTMLButtonElement;
    const add3MinBtn = document.getElementById('add-3-min') as HTMLButtonElement;
    const add5MinBtn = document.getElementById('add-5-min') as HTMLButtonElement;

    function addSeconds(seconds: number) {
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
    add3MinBtn.addEventListener('click', () => addSeconds(180));
    add5MinBtn.addEventListener('click', () => addSeconds(300));

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
                startTimer();
            } else {
                localStorage.removeItem('kitchenToolbox_timerState');
            }
        } catch (e) {
            console.error('Failed to parse timer state', e);
        }
    }
}

// Export function to allow other tools to start the timer
export function startTimerWithDuration(minutes: number): void {
    // Navigate to timer with query parameter
    window.location.href = `${window.location.pathname}?timerMinutes=${minutes}#timer`;
}
