// src/dom/render.js

let DOMElements = {};

/**
 * 1. Collects all necessary DOM elements for global reference.
 * @returns {object} An object containing all referenced DOM elements.
 */
function initializeDOMReferences() {
    DOMElements = {
        // --- Auth UI Elements ---
        authContainer: document.getElementById('auth-container'),
        authForm: document.getElementById('auth-form'),
        authEmail: document.getElementById('auth-email'),
        authPassword: document.getElementById('auth-password'),
        authSignUpBtn: document.getElementById('auth-sign-up-btn'),
        authSignInBtn: document.getElementById('auth-sign-in-btn'),
        authSignOutBtn: document.getElementById('auth-sign-out-btn'),
        authStatus: document.getElementById('auth-status'),

        // --- Main App Elements ---
        todoListContainer: document.getElementById('todo-list-container'),
        taskList: document.getElementById('todo-list'),
        newTaskForm: document.getElementById('todo-form'),
        todoInput: document.getElementById('todo-input'),
        timerInput: document.getElementById('todo-timer-input'),
        openModalBtn: document.getElementById('add-task-btn'), // Assuming the 'Add Task' button opens a modal/form
        clearCompletedBtn: document.getElementById('clear-completed'),

        // --- Modal Elements ---
        modalOverlay: document.getElementById('task-modal-overlay'),
        modalContent: document.getElementById('task-modal-content'),
        modalCloseBtn: document.getElementById('modal-close-btn'),
        editTaskForm: document.getElementById('edit-task-form'),
        editTaskID: document.getElementById('edit-task-id'),
        editTaskText: document.getElementById('edit-task-text'),
        editTaskTimeLimit: document.getElementById('edit-task-time-limit'),
        
        // --- Weather Element ---
        weatherDisplay: document.getElementById('weather-display'),
    };
    return DOMElements;
}

/**
 * EXPORTED: Getter function for DOM elements, called by other modules.
 * This ensures external modules can access the references after initialization.
 * @returns {object} The collected DOM elements.
 */
export function getDOMElements() {
    // If references haven't been collected yet, initialize them now.
    if (Object.keys(DOMElements).length === 0) {
        initializeDOMReferences();
    }
    return DOMElements;
}


/**
 * Helper to get form data for a new task.
 * @returns {object} { text, timeLimit }
 */
export function getTaskFormData() {
    return {
        text: DOMElements.todoInput.value,
        timeLimit: DOMElements.timerInput.value,
    };
}

/**
 * 2. Helper to display an element or add the 'hidden' class.
 * This is CRITICAL for managing the conditional UI state.
 * @param {HTMLElement} element 
 * @param {'show'|'hide'} action 
 */
export function toggleVisibility(element, action) {
    if (!element) return;
    if (action === 'show') {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Helper to convert seconds into MM:SS format.
 * @param {number} totalSeconds 
 * @returns {string} Formatted time string.
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
}


/**
 * Renders a single task item.
 * @param {object} task - The task object from state/database.
 * @param {function} handleAction - The event handler for task buttons.
 * @returns {HTMLElement} The complete task list item.
 */
function createTaskElement(task, handleAction) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id; // CRITICAL: Use the Firebase document ID as the task ID
    li.setAttribute('draggable', true);

    // Checkbox (Custom styled container)
    const checkboxContainer = document.createElement('label');
    checkboxContainer.className = 'task-checkbox-container';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'task-complete-cb';
    
    const checkmarkSpan = document.createElement('span');
    checkmarkSpan.className = 'checkmark';

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkmarkSpan);
    
    // Task Text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;
    
    // Timer Display
    const timerDisplay = document.createElement('span');
    timerDisplay.className = 'task-timer-display';
    timerDisplay.textContent = `Timer: ${formatTime(task.timeRemaining)}`;
    
    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    
    // Timer Button
    const timerBtn = document.createElement('button');
    timerBtn.className = `btn ${task.timerActive ? 'btn-secondary' : 'btn-success'} task-timer-btn`;
    timerBtn.textContent = task.timerActive ? 'Stop Timer' : 'Start Timer';
    
    // Reset Timer Button (New Feature)
    const resetTimerBtn = document.createElement('button');
    resetTimerBtn.className = 'btn btn-secondary task-timer-reset-btn';
    resetTimerBtn.textContent = 'Reset Timer';
    
    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger task-delete-btn';
    deleteBtn.textContent = 'Delete';
    
    actionsDiv.appendChild(timerBtn);
    actionsDiv.appendChild(resetTimerBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkboxContainer);
    li.appendChild(textSpan);
    if (task.timeLimit > 0) {
        li.appendChild(timerDisplay);
        li.appendChild(actionsDiv);
    } else {
        // If no timer, just append the delete button container
        li.appendChild(actionsDiv); 
    }
    
    return li;
}

/**
 * Renders the entire list of tasks.
 * @param {Array<object>} tasks - The current state.tasks array.
 * @param {function} handleAction - The event handler for task buttons.
 */
export function renderTaskList(tasks, handleAction) {
    if (!DOMElements.taskList) return;

    DOMElements.taskList.innerHTML = '';
    
    // If the tasks list is empty, display a placeholder message
    if (tasks.length === 0) {
        DOMElements.taskList.innerHTML = '<li class="text-center text-gray-500 py-8">No tasks yet. Add one to get started!</li>';
    } else {
        tasks.forEach(task => {
            const taskElement = createTaskElement(task, handleAction);
            DOMElements.taskList.appendChild(taskElement);
        });
    }

    // Re-attach the main delegation listener after full re-render
    DOMElements.taskList.onclick = handleAction; 
}


/**
 * Handles showing or hiding the task edit modal.
 * @param {'show'|'hide'} action 
 * @param {string} taskId - The ID of the task to load (if showing).
 */
export function toggleModal(action, taskId = null) {
    if (!DOMElements.modalOverlay) return;

    if (action === 'show') {
        DOMElements.modalOverlay.classList.add('visible');
        
        if (taskId) {
            const task = window.state.tasks.find(t => t.id === taskId);
            if (task) {
                // Populate the form with current task data
                DOMElements.editTaskID.value = taskId;
                DOMElements.editTaskText.value = task.text;
                // Use the original timeLimit for editing, not timeRemaining
                DOMElements.editTaskTimeLimit.value = task.timeLimit; 
            }
        }
    } else {
        DOMElements.modalOverlay.classList.remove('visible');
    }
}

/**
 * Renders the fetched weather data.
 * @param {object} data - Weather API response data.
 */
export function renderWeather(data) {
    if (!data || !DOMElements.weatherDisplay) return;

    const { name, weather, main } = data;
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    
    DOMElements.weatherDisplay.innerHTML = `
        <div class="weather-city">${name}</div>
        <img src="${iconUrl}" alt="${weather[0].description}" class="weather-icon">
        <div class="weather-temp">${Math.round(main.temp)}°C</div>
        <div class="weather-description">${weather[0].description}</div>
    `;
}

// *** REMOVED: The self-executing setupDOMReferences() call ***
// The references will now be initialized when getDOMElements() is called by app.js.

