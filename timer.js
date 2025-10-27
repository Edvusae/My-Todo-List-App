// timer.js
import { state, updateTaskTime } from './state.js';
import { updateTaskDisplay } from './dom.js'; // A function we'd create in dom.js

let timerIntervals = {}; // To hold all active timer IDs

export function startTimer(taskId) {
    if (timerIntervals[taskId]) return; // Timer is already running

    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.timeRemaining <= 0) return;

    task.timerActive = true;
    updateTaskDisplay(task); // Update DOM to show timer is running

    timerIntervals[taskId] = setInterval(() => {
        task.timeRemaining--;

        // Update the DOM for this specific task
        updateTaskDisplay(task);

        if (task.timeRemaining <= 0) {
            stopTimer(taskId);
            // Fire a user notification/alert for completion (Recruiter bonus!)
            alert(`${task.text} time is up!`);
        }
    }, 1000);
}

export function stopTimer(taskId) {
    if (timerIntervals[taskId]) {
        clearInterval(timerIntervals[taskId]);
        delete timerIntervals[taskId];

        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.timerActive = false;
            updateTaskDisplay(task); // Update DOM to show timer is stopped
        }
    }
}