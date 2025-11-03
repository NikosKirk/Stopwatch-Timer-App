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
let timerEndTime = null;
let isTimerOvertime = false;

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

// Function to enable/disable timer inputs
function setTimerInputsState(enabled) {
    hoursInput.disabled = !enabled;
    minutesInput.disabled = !enabled;
    secondsInput.disabled = !enabled;
    
    if (enabled) {
        hoursInput.classList.remove('disabled');
        minutesInput.classList.remove('disabled');
        secondsInput.classList.remove('disabled');
    } else {
        hoursInput.classList.add('disabled');
        minutesInput.classList.add('disabled');
        secondsInput.classList.add('disabled');
    }
}

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
    const absTime = Math.abs(time);
    let hours = Math.floor(absTime / 3600000);
    let minutes = Math.floor((absTime % 3600000) / 60000);
    let seconds = Math.floor((absTime % 60000) / 1000);
    
    const sign = time < 0 ? '-' : '';
    
    return (
        sign +
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
    
    // If timer is paused and we change the time, update the end time display
    if (!isTimerRunning && timerTime > 0) {
        updateEndTimeDisplay();
    } else {
        clearEndTimeDisplay();
    }
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
    // Don't validate/evaluate if timer is running
    if (isTimerRunning) return;
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
    // Don't validate/evaluate if timer is running
    if (isTimerRunning) return;
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

// Function to update end time display
function updateEndTimeDisplay() {
    // Remove existing end time display
    clearEndTimeDisplay();
    
    if (timerTime > 0) {
        const endTimeElement = document.createElement('div');
        endTimeElement.className = 'end-time-display';
        endTimeElement.id = 'endTimeDisplay';
        
        if (isTimerRunning) {
            // Timer is running - calculate end time from start
            const endTimeString = timerEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            endTimeElement.textContent = `Ends at: ${endTimeString}`;
        } else {
            // Timer is paused - calculate end time from current time + remaining time
            const newEndTime = new Date(Date.now() + timerTime);
            const endTimeString = newEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            endTimeElement.textContent = `Will end at: ${endTimeString}`;
        }
        
        // Add to timer container after the timer display
        const timeDisplay = document.getElementById('timerDisplay');
        timeDisplay.parentNode.insertBefore(endTimeElement, timeDisplay.nextSibling);
    }
}

// Function to clear end time display
function clearEndTimeDisplay() {
    const existingEndTime = document.getElementById('endTimeDisplay');
    if (existingEndTime) {
        existingEndTime.remove();
    }
}

function toggleTimer() {
    if (!isTimerRunning) {
        // Start/Pause button clicked when timer is not running
        isTimerRunning = true;
        isTimerOvertime = false;
        // Disable inputs when timer starts
        setTimerInputsState(false);
        
        // Remove completion buttons if they exist
        removeCompletionButtons();
        
        // Calculate and display end time based on current timerTime
        timerEndTime = new Date(Date.now() + timerTime);
        updateEndTimeDisplay();
        
        // Change button text to "Pause"
        timerStartBtn.textContent = 'Pause';
        timerStartBtn.style.backgroundColor = '#FF9800';
        
        updateTimerDisplay();
        updateTimerIndicator();
        
        // Clear existing interval if any
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
        }
        
        timerIntervalId = setInterval(function() {
            if (timerTime <= 0 && !isTimerOvertime) {
                // Timer reached zero - start counting negative but don't stop
                isTimerOvertime = true;
                // Play alarm when timer reaches zero
                alarmSound.play();
                document.body.classList.add('alarm-active');
                
                // Show completion buttons
                showCompletionButtons();
            }
            
            // Always count down (into negative numbers)
            timerTime -= 1000;
            updateTimerDisplay();
            
        }, 1000);
    } else {
        // Pause button clicked when timer is running
        isTimerRunning = false;
        clearInterval(timerIntervalId);
        timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse', 'timer-overtime');
        updateTimerIndicator();
        
        // Remove completion buttons if paused
        removeCompletionButtons();
        
        // Change button text to "Resume"
        timerStartBtn.textContent = 'Resume';
        timerStartBtn.style.backgroundColor = '#4CAF50';
        
        // ENABLE inputs when timer is paused so user can change time
        setTimerInputsState(true);
        
        // Update end time display when paused (will recalculate based on current timerTime)
        updateEndTimeDisplay();
    }
}



function resetTimer() {
    // Stop timer if running
    if (isTimerRunning) {
        clearInterval(timerIntervalId);
        isTimerRunning = false;
    }
    
    // Remove completion buttons
    removeCompletionButtons();
    
    // Stop alarm
    stopAlarm();
    document.body.classList.remove('alarm-active');
    
    // Reset to original input values, not the current timerTime
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    
    timerTime = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
    originalTimerTime = timerTime;
    timerDisplay.textContent = formatTimerTime(timerTime);
    
    timerDisplay.style.color = '#333';
    timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse', 'timer-overtime');
    updateTimerIndicator();
    
    // Reset button to "Start"
    timerStartBtn.textContent = 'Start';
    timerStartBtn.style.backgroundColor = '#4CAF50';
    
    // Ensure inputs are enabled after reset
    setTimerInputsState(true);
    
    // Reset overtime and end time
    isTimerOvertime = false;
    timerEndTime = null;
    clearEndTimeDisplay();
}


function updateTimerDisplay() {
    // Handle negative time (overtime)
    if (timerTime < 0) {
        timerDisplay.textContent = formatTimerTime(timerTime);
        timerDisplay.style.color = '#f44336';
        timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse');
        timerDisplay.classList.add('timer-overtime');
    } else {
        timerDisplay.textContent = formatTimerTime(timerTime);
        
        // Remove all animation classes first
        timerDisplay.classList.remove('timer-pulse', 'timer-warning-pulse', 'timer-overtime');
        
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
            // Timer at zero or not running
            timerDisplay.style.color = '#333';
        }
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
    alarmSound.currentTime = 0;
    document.body.classList.remove('alarm-active');
}

// Function to show completion buttons when timer reaches zero
function showCompletionButtons() {
    // Remove existing completion buttons if any
    removeCompletionButtons();
    
    // Create container for completion buttons
    const completionContainer = document.createElement('div');
    completionContainer.className = 'completion-buttons';
    completionContainer.id = 'completionButtons';
    
    // Create Stop Timer button
    const stopTimerBtn = document.createElement('button');
    stopTimerBtn.textContent = 'Stop Timer';
    stopTimerBtn.style.backgroundColor = '#f44336';
    stopTimerBtn.style.color = 'white';
    stopTimerBtn.style.marginTop = '10px';
    stopTimerBtn.onclick = function() {
        resetTimer();
    };
    
    // Create Extend 5 Minutes button
    const extendBtn = document.createElement('button');
    extendBtn.textContent = 'Extend 5 Minutes';
    extendBtn.style.backgroundColor = '#2196F3';
    extendBtn.style.color = 'white';
    extendBtn.style.marginTop = '10px';
    extendBtn.style.marginLeft = '10px';
    extendBtn.onclick = function() {
        extendTimer(5); // Extend by 5 minutes
    };
    
    // Add buttons to container
    completionContainer.appendChild(stopTimerBtn);
    completionContainer.appendChild(extendBtn);
    
    // Add container to timer controls
    const controls = timerContainer.querySelector('.controls');
    controls.appendChild(completionContainer);
    
    // Hide the normal controls
    timerStartBtn.style.display = 'none';
    timerResetBtn.style.display = 'none';
}

// Function to remove completion buttons
function removeCompletionButtons() {
    const completionButtons = document.getElementById('completionButtons');
    if (completionButtons) {
        completionButtons.remove();
    }
    
    // Show normal controls
    timerStartBtn.style.display = 'block';
    timerResetBtn.style.display = 'block';
}

// Function to extend timer by minutes
function extendTimer(minutes) {
    // Add time to current timer (can be negative)
    timerTime += minutes * 60000; // Convert minutes to milliseconds
    
    // Stop alarm
    stopAlarm();
    document.body.classList.remove('alarm-active');
    
    // Remove completion buttons
    removeCompletionButtons();
    
    // Update display
    updateTimerDisplay();
    
    // If timer was in overtime and now has positive time, reset overtime flag
    if (timerTime > 0 && isTimerOvertime) {
        isTimerOvertime = false;
    }
    
    // Recalculate end time
    timerEndTime = new Date(Date.now() + timerTime);
    updateEndTimeDisplay();
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

timerStartBtn.addEventListener('click', toggleTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Updated input event listeners for math evaluation and time normalization
hoursInput.addEventListener('input', function() {
    validateInput(this);
    // If timer is paused, update the timer display and end time
    if (!isTimerRunning) {
        setTimer();
    }
});

hoursInput.addEventListener('blur', function() {
    evaluateAndSetTimer(this);
    // If timer is paused, update the timer display and end time
    if (!isTimerRunning) {
        setTimer();
    }
});

minutesInput.addEventListener('input', function() {
    validateInput(this);
    // If timer is paused, update the timer display and end time
    if (!isTimerRunning) {
        setTimer();
    }
});

minutesInput.addEventListener('blur', function() {
    evaluateAndSetTimer(this);
    // If timer is paused, update the timer display and end time
    if (!isTimerRunning) {
        setTimer();
    }
});

secondsInput.addEventListener('input', function() {
    validateInput(this);
    // If timer is paused, update the timer display and end time
    if (!isTimerRunning) {
        setTimer();
    }
});

secondsInput.addEventListener('blur', function() {
    evaluateAndSetTimer(this);
    // If timer is paused, update the timer display and end time
    if (!isTimerRunning) {
        setTimer();
    }
});

stopwatchMode.addEventListener('click', switchToStopwatch);
timerMode.addEventListener('click', switchToTimer);

// Initialize
setTimer();
updateTimerIndicator();
setTimerInputsState(true); // Ensure inputs are enabled on startup