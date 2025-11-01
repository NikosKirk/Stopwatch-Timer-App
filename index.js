// Variables to track time and state
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let lapCount = 0;

// Timer variables
let timerTime = 0;
let timerIntervalId = null;
let isTimerRunning = false;
let originalTimerTime = 0;

// DOM Elements
const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn = document.getElementById('lapBtn');
const lapsContainer = document.getElementById('laps');

// Timer DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerStopBtn = document.getElementById('timerStopBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');

// Mode switching elements
const stopwatchMode = document.getElementById('stopwatchMode');
const timerMode = document.getElementById('timerMode');
const stopwatchContainer = document.getElementById('stopwatchContainer');
const timerContainer = document.getElementById('timerContainer');
const mainContainer = document.querySelector('.container');

// Audio element
const alarmSound = document.getElementById('alarmSound');

// Debouncing variables
let isSwitching = false;
let pendingSwitch = null;

// Format time to HH:MM:SS format
function formatTime(time) {
    let hours = Math.floor(time / 3600000);
    let minutes = Math.floor((time % 3600000) / 60000);
    let seconds = Math.floor((time % 60000) / 1000);
    let milliseconds = Math.floor((time % 1000) / 10);
    
    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(2, '0')
    );
}

// Format time for timer (without milliseconds)
function formatTimerTime(time) {
    let hours = Math.floor(time / 3600000);
    let minutes = Math.floor((time % 3600000) / 60000);
    let seconds = Math.floor((time % 60000) / 1000);
    
    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0')
    );
}

// Stopwatch functions
function start() {
    if (!isRunning) {
        isRunning = true;
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(function() {
            elapsedTime = Date.now() - startTime;
            display.textContent = formatTime(elapsedTime);
        }, 10);
    }
}

function stop() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
    }
}

function reset() {
    stop();
    elapsedTime = 0;
    display.textContent = "00:00:00";
    lapCount = 0;
    lapsContainer.innerHTML = '';
}

function lap() {
    if (isRunning) {
        lapCount++;
        const lapTime = document.createElement('div');
        lapTime.className = 'lap-item';
        lapTime.innerHTML = `
            <span class="lap-number">Lap ${lapCount}</span>
            <span class="lap-time">${formatTime(elapsedTime)}</span>
        `;
        lapsContainer.appendChild(lapTime);
        
        lapsContainer.scrollTop = lapsContainer.scrollHeight;
    }
}

// Timer functions
function setTimer() {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    
    timerTime = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
    originalTimerTime = timerTime;
    timerDisplay.textContent = formatTimerTime(timerTime);
}

// Function to normalize time units (convert 60 seconds to 1 minute, etc.)
function normalizeTimeUnits() {
    let hours = parseInt(hoursInput.value) || 0;
    let minutes = parseInt(minutesInput.value) || 0;
    let seconds = parseInt(secondsInput.value) || 0;
    
    // Convert seconds to minutes
    if (seconds >= 60) {
        minutes += Math.floor(seconds / 60);
        seconds = seconds % 60;
    }
    
    // Convert minutes to hours
    if (minutes >= 60) {
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
    }
    
    // Update the input values
    hoursInput.value = hours;
    minutesInput.value = minutes;
    secondsInput.value = seconds;
    
    setTimer();
}

// Function to evaluate math expressions and set timer
function evaluateAndSetTimer(inputElement) {
    let value = inputElement.value.trim();
    
    // If empty, set to 0
    if (value === '') {
        inputElement.value = '0';
        normalizeTimeUnits();
        return;
    }
    
    // Try to evaluate math expression
    try {
        // Replace common math symbols
        value = value.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Use Function constructor for safe evaluation
        const result = Function('"use strict"; return (' + value + ')')();
        
        if (typeof result === 'number' && !isNaN(result)) {
            // Ensure result is not negative
            const finalValue = Math.max(0, Math.floor(result));
            inputElement.value = finalValue;
            normalizeTimeUnits();
        }
    } catch (error) {
        // If evaluation fails, just use the raw number
        const numValue = parseInt(value) || 0;
        inputElement.value = Math.max(0, numValue);
        normalizeTimeUnits();
    }
}

// Function to prevent negative values and handle empty inputs
function validateInput(inputElement) {
    let value = inputElement.value.trim();
    
    // If empty, set to 0
    if (value === '') {
        inputElement.value = '0';
        normalizeTimeUnits();
        return;
    }
    
    // Remove any non-digit characters except basic math operators for evaluation
    const cleanValue = value.replace(/[^\d+\-*/().]/g, '');
    
    // If it's a simple number, ensure it's not negative
    if (/^\d+$/.test(cleanValue)) {
        const numValue = parseInt(cleanValue) || 0;
        inputElement.value = Math.max(0, numValue);
    }
    
    normalizeTimeUnits();
}

function startTimer() {
    if (!isTimerRunning && timerTime > 0) {
        isTimerRunning = true;
        updateTimerDisplay();
        updateTimerIndicator();
        
        // Clear existing interval if any
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
        }
        
        timerIntervalId = setInterval(function() {
            if (timerTime <= 0) {
                timerFinished();
                return;
            }
            
            timerTime -= 1000;
            updateTimerDisplay();
            
        }, 1000);
    }
}

function stopTimer() {
    if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(timerIntervalId);
        timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse');
        updateTimerIndicator();
    }
}

function resetTimer() {
    stopTimer();
    setTimer();
    timerDisplay.style.color = '#333';
    timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse');
    updateTimerIndicator();
    document.body.classList.remove('alarm-active');
    stopAlarm(); // Stop alarm when resetting timer
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTimerTime(timerTime);
    
    // Remove all animation classes first
    timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse');
    
    // Apply different animations based on time remaining
    if (timerTime <= 10000 && timerTime > 0) {
        // Under 10 seconds: Red to black animation
        timerDisplay.style.color = '#f44336';
        timerDisplay.classList.add('timer-warning-pulse');
    } else if (timerTime > 10000) {
        // Over 10 seconds: Black color with normal pulse
        timerDisplay.style.color = '#333';
        timerDisplay.classList.add('timer-pulse');
    } else {
        // Timer finished or not running
        timerDisplay.style.color = '#333';
    }
}

function updateTimerIndicator() {
    // Remove existing indicator from both places
    const existingIndicators = document.querySelectorAll('.timer-active-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Add indicator if timer is running
    if (isTimerRunning) {
        const indicator = document.createElement('div');
        indicator.className = 'timer-active-indicator';
        indicator.title = 'Timer is running in background';
        
        // If we're in timer mode, add to timer container
        if (timerContainer.classList.contains('active')) {
            timerContainer.appendChild(indicator);
        } 
        // If we're in stopwatch mode, add to timer button
        else {
            timerMode.appendChild(indicator);
        }
    }
}

// Function to stop the alarm sound
function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0; // Reset to beginning
    document.body.classList.remove('alarm-active');
    
    // Remove stop alarm button if it exists
    const stopAlarmBtn = document.getElementById('stopAlarmBtn');
    if (stopAlarmBtn) {
        stopAlarmBtn.remove();
    }
    
    // Reset the timer when stopping alarm
    resetTimer();
}

function timerFinished() {
    stopTimer();
    timerDisplay.textContent = "00:00:00";
    timerDisplay.style.color = '#f44336';
    
    alarmSound.play();
    document.body.classList.add('alarm-active');
    
    // Add a button to stop the alarm manually
    const stopAlarmBtn = document.createElement('button');
    stopAlarmBtn.textContent = 'Stop Alarm & Reset';
    stopAlarmBtn.style.backgroundColor = '#f44336';
    stopAlarmBtn.style.color = 'white';
    stopAlarmBtn.style.marginTop = '10px';
    stopAlarmBtn.onclick = function() {
        stopAlarm();
    };
    
    // Add stop alarm button to timer container
    if (!document.querySelector('#stopAlarmBtn')) {
        stopAlarmBtn.id = 'stopAlarmBtn';
        timerContainer.querySelector('.controls').appendChild(stopAlarmBtn);
    }
}

function switchToStopwatch() {
    if (isSwitching) {
        pendingSwitch = 'stopwatch';
        return;
    }
    
    if (stopwatchContainer.classList.contains('active')) {
        return;
    }
    
    isSwitching = true;
    mainContainer.classList.add('resizing');
    
    timerContainer.style.opacity = '0';
    timerContainer.style.transform = 'translateX(100px) scale(0.95)';
    
    setTimeout(() => {
        stopwatchMode.classList.add('active');
        timerMode.classList.remove('active');
        timerContainer.classList.remove('active');
        stopwatchContainer.classList.add('active');
        
        setTimeout(() => {
            stopwatchContainer.style.opacity = '1';
            stopwatchContainer.style.transform = 'translateX(0) scale(1)';
            updateTimerIndicator();
            
            setTimeout(() => {
                mainContainer.classList.remove('resizing');
                isSwitching = false;
                
                if (pendingSwitch) {
                    const switchType = pendingSwitch;
                    pendingSwitch = null;
                    if (switchType === 'stopwatch') {
                        switchToStopwatch();
                    } else {
                        switchToTimer();
                    }
                }
            }, 200);
        }, 15);
    }, 60);
}

function switchToTimer() {
    if (isSwitching) {
        pendingSwitch = 'timer';
        return;
    }
    
    if (timerContainer.classList.contains('active')) {
        return;
    }
    
    isSwitching = true;
    updateTimerDisplay();
    mainContainer.classList.add('resizing');
    
    stopwatchContainer.style.opacity = '0';
    stopwatchContainer.style.transform = 'translateX(-100px) scale(0.95)';
    
    setTimeout(() => {
        timerMode.classList.add('active');
        stopwatchMode.classList.remove('active');
        stopwatchContainer.classList.remove('active');
        timerContainer.classList.add('active');
        
        setTimeout(() => {
            timerContainer.style.opacity = '1';
            timerContainer.style.transform = 'translateX(0) scale(1)';
            updateTimerIndicator();
            
            setTimeout(() => {
                mainContainer.classList.remove('resizing');
                isSwitching = false;
                
                if (pendingSwitch) {
                    const switchType = pendingSwitch;
                    pendingSwitch = null;
                    if (switchType === 'stopwatch') {
                        switchToStopwatch();
                    } else {
                        switchToTimer();
                    }
                }
            }, 200);
        }, 15);
    }, 60);
}

// Event listeners
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
resetBtn.addEventListener('click', reset);
lapBtn.addEventListener('click', lap);

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Updated input event listeners for math evaluation and time normalization
hoursInput.addEventListener('input', function() {
    validateInput(this);
});

hoursInput.addEventListener('blur', function() {
    evaluateAndSetTimer(this);
});

minutesInput.addEventListener('input', function() {
    validateInput(this);
});

minutesInput.addEventListener('blur', function() {
    evaluateAndSetTimer(this);
});

secondsInput.addEventListener('input', function() {
    validateInput(this);
});

secondsInput.addEventListener('blur', function() {
    evaluateAndSetTimer(this);
});

stopwatchMode.addEventListener('click', switchToStopwatch);
timerMode.addEventListener('click', switchToTimer);

// Initialize
setTimer();
updateTimerIndicator();