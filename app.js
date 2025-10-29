// src/app.js

import { loadState, addTask, deleteTask, toggleCompleted, reorderTask, state } from './modules/state.js';
import { renderTaskList, renderWeather, setupDOMReferences, toggleModal, getTaskFormData } from './dom/render.js';
import { fetchWeather } from './modules/weather.js';
import { startTimer, stopTimer } from './modules/timer.js';

// --- Global DOM References (Loaded from render.js) ---
let DOMElements;

/**
 * Handles the submission of the new/edit task form.
 * @param {Event} e - The form submit event.
 */
function handleTaskSubmit(e) {
    e.preventDefault();
    
    // 1. Get data from the form (implementation assumed in render.js)
    const { text, timeLimit } = getTaskFormData(); 

    if (text.trim() === '') {
        alert('Task description cannot be empty!');
        return;
    }

    // 2. Update state and re-render
    addTask(text, timeLimit); 
    renderTaskList(state.tasks, handleTaskAction);

    // 3. Clean up UI
    DOMElements.newTaskForm.reset();
    toggleModal('hide'); // Hide the modal after submission
}

/**
 * Handles all task-related actions (clicks on buttons within a task).
 * Uses event delegation for efficiency and modern practice.
 * @param {Event} e - The click event.
 */
function handleTaskAction(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const taskId = parseInt(taskItem.dataset.id);

    if (e.target.classList.contains('task-delete-btn')) {
        deleteTask(taskId);
    } else if (e.target.classList.contains('task-complete-cb')) {
        toggleCompleted(taskId);
    } else if (e.target.classList.contains('task-timer-btn')) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.timerActive) {
            stopTimer(taskId);
        } else {
            startTimer(taskId);
        }
    } else if (e.target.classList.contains('task-text')) {
        // Feature: Open detail modal for editing (Logic implemented in render.js)
        toggleModal('show', taskId);
    }
    
    // Re-render the list after any action
    renderTaskList(state.tasks, handleTaskAction);
}

/**
 * Handles drag and drop events for reordering tasks.
 */
function handleDragAction() {
    let draggedId = null;

    DOMElements.taskList.addEventListener('dragstart', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            draggedId = parseInt(taskItem.dataset.id);
            // Must set data for drag to work
            e.dataTransfer.setData('text/plain', draggedId.toString());
            // Optional: Add a CSS class for visual feedback
            setTimeout(() => taskItem.classList.add('dragging'), 0);
        }
    });

    DOMElements.taskList.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
    });

    DOMElements.taskList.addEventListener('dragover', (e) => {
        e.preventDefault(); // Crucial: Allows a drop
        
        // Visual feedback for where the item will drop (pure JS skill!)
        const afterElement = getDragAfterElement(DOMElements.taskList, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            DOMElements.taskList.appendChild(draggable);
        } else {
            DOMElements.taskList.insertBefore(draggable, afterElement);
        }
    });

    DOMElements.taskList.addEventListener('drop', (e) => {
        e.preventDefault();
        
        const droppedElement = document.querySelector('.dragging');
        if (!droppedElement) return;

        const droppedId = parseInt(droppedElement.dataset.id);
        const nextElement = droppedElement.nextElementSibling;
        
        let targetId = nextElement ? parseInt(nextElement.dataset.id) : null;
        
        // 1. Update the state based on the final DOM order
        reorderTask(droppedId, targetId); 
        
        // 2. Clean up and re-render the final list
        droppedElement.classList.remove('dragging');
        renderTaskList(state.tasks, handleTaskAction);
    });
}

/**
 * Helper function for dragover to determine insertion point.
 * This is the tricky part of Vanilla JS Drag-and-Drop!
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


/**
 * Initializes the entire application.
 */
async function init() {
    // 1. Setup DOM References
    DOMElements = setupDOMReferences();

    // 2. Load and Render Initial State
    loadState();
    renderTaskList(state.tasks, handleTaskAction);

    // 3. Initialize Weather Feature
    const weatherData = await fetchWeather();
    if (weatherData) {
        renderWeather(weatherData); // Display weather in its dedicated DOM area
    }

    // 4. Attach Main Event Listeners
    DOMElements.newTaskForm.addEventListener('submit', handleTaskSubmit);
    DOMElements.taskList.addEventListener('click', handleTaskAction); // Event delegation for task clicks
    DOMElements.openModalBtn.addEventListener('click', () => toggleModal('show'));

    // 5. Initialize Drag and Drop
    handleDragAction();
    
    console.log('Todo List App Initialized (Vanilla JS Mastered!)');
}

// Start the application!
document.addEventListener('DOMContentLoaded', init);