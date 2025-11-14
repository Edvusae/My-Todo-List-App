// src/modules/timer.js
import { updateTaskInDB } from './database.js';
import { setupDOMReferences } from '../dom/render.js';

const DOMElements = setupDOMReferences();
const state = window.state;
const TICK_INTERVAL = 1000; // 1 second

/**
 * Updates the UI display for a single task's timer.
 * @param {string} taskId
 * @param {number} timeRemaining
 */
function updateTimerDisplay(taskId, timeRemaining) {
    const li = DOMElements.taskList.querySelector(`[data-id="${taskId}"]`);
    if (!li) return;

    const display = li.querySelector('.task-timer-display');
    if (display) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        display.textContent = `Timer: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

/**
 * Stops the timer for a given task and saves the time remaining to the database.
 * @param {string} taskId
 */
export function stopTimer(taskId) {
    if (state.timers[taskId]) {
        clearInterval(state.timers[taskId]);
        delete state.timers[taskId];
        console.log(`Timer stopped for task ${taskId}`);
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (task && window.currentUser) {
        // Find the current time remaining from the task object
        const timeRemaining = task.timeRemaining; 
        
        // Update the database with the saved time remaining and set active to false
        updateTaskInDB(window.currentUser.uid, taskId, {
            timerActive: false,
            timeRemaining: timeRemaining
        }).catch(error => {
            console.error(`Failed to save remaining time for ${taskId}:`, error);
        });
    }
}

/**
 * Starts the timer for a given task.
 * @param {string} taskId
 */
export function startTimer(taskId) {
    if (state.timers[taskId]) return; // Timer already running

    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !window.currentUser) return;
    
    // 1. Immediately update DB to show the timer is active
    updateTaskInDB(window.currentUser.uid, taskId, { timerActive: true });

    // 2. Set up the interval function
    const intervalId = setInterval(() => {
        // Find the LATEST state of the task from the globally synced state
        const currentTask = state.tasks.find(t => t.id === taskId);

        if (!currentTask || currentTask.timeRemaining <= 0) {
            // Stop if task deleted or time runs out
            stopTimer(taskId); 
            if (currentTask && currentTask.timeRemaining <= 0) {
                console.log(`Task ${taskId} timer reached 0.`);
                // Optionally alert the user or mark as complete
            }
            return;
        }

        const newTimeRemaining = currentTask.timeRemaining - 1;

        // 3. Update the UI directly for smooth ticking
        updateTimerDisplay(taskId, newTimeRemaining);

        // 4. Update the global state copy for the next tick
        currentTask.timeRemaining = newTimeRemaining;
        
        // 5. Update Firestore every 5 seconds (or more/less frequently) to save progress
        if (newTimeRemaining % 5 === 0) {
            updateTaskInDB(window.currentUser.uid, taskId, { 
                timeRemaining: newTimeRemaining 
            }).catch(error => {
                console.error(`Failed to update time remaining in DB for ${taskId}:`, error);
            });
        }

    }, TICK_INTERVAL);

    // 6. Store the interval ID
    state.timers[taskId] = intervalId;
    console.log(`Timer started for task ${taskId}`);
}

/**
 * Resets the timer for a task to its original time limit.
 * @param {string} taskId
 */
export function resetTimer(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !window.currentUser) return;
    
    // First, stop any running timer
    stopTimer(taskId);

    // Reset both the active state and time remaining to the limit
    updateTaskInDB(window.currentUser.uid, taskId, {
        timerActive: false,
        timeRemaining: task.timeLimit 
    }).catch(error => {
        console.error(`Failed to reset timer for ${taskId}:`, error);
    });
}

/**
    * Clears all local timer intervals and resets state.
 */
export function clearLocalState() {
    Object.keys(state.timers).forEach(taskId => {
        clearInterval(state.timers[taskId]);
    });
    state.timers = {};
    state.tasks = [];
}

// --- IGNORE ---