const defaultInterval = 25 * 60;

function formatNumber(number) {
    let zeros_count = 2 - number.toString().length;
    return "0".repeat(zeros_count) + number.toString();
}

function formatTime(seconds) {
    return formatNumber(Math.floor(seconds / 60)) + ":" + formatNumber(seconds % 60);
}

class Timer {
    constructor(defaultInterval) {
        this.running = false;
        this.locked = false; // timer locks when it reaches zero, then it has to be reset
        this.defaultInterval = defaultInterval;
        this.countdown = defaultInterval;
        this.intervalID = null;
        this.listeners = new Set();
    }

    notify(event) {
        this.listeners.forEach(listener => listener(event));
    }

    advance() {
        this.countdown -= 1;
        this.notify({type: "timer-advance"});
        if (this.countdown == 0) {
            this.stop();
            this.locked = true;
            this.notify({type: "timer-complete"});
        }
    }

    start() {
        this.running = true;
        this.intervalID = setInterval(() => this.advance(), 1000);
        this.notify({type: "timer-start"});
    }

    stop() {
        this.running = false;
        if (this.intervalID != null) {
            clearInterval(this.intervalID);
            this.intervalID = null;
        }
        this.notify({type: "timer-stop"});
    }

    switch() {
        if (!this.locked) {
            if (this.running) { this.stop(); }
            else { this.start(); }
        }
    }

    reset() {
        this.stop();
        this.countdown = this.defaultInterval;
        this.locked = false;
        this.notify({type: "timer-reset"});
    }
}

class TimerUI {
    constructor(timer) {
        this.timer = timer;
        this.switchButton = document.getElementById('switch-button');
        this.resetButton = document.getElementById('reset-button');
        this.timerDisplay = document.getElementById('timer')

        this.timer.listeners.add( () => this.render() );
        this.switchButton.addEventListener("click", () => this.timer.switch());
        this.resetButton.addEventListener("click", () => this.timer.reset());

        this.render()
    }

    render() {
        const formattedTime = formatTime(this.timer.countdown)
        this.timerDisplay.textContent = formattedTime;
        this.switchButton.textContent = (timer.running) ? "pause" : "start";
        this.switchButton.disabled = timer.locked;
    }
}

const timer = new Timer(defaultInterval);
const timerUI = new TimerUI(timer);