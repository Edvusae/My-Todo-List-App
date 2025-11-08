// --- IMPORTS ---
// Note: We assume the database/auth globals (db, auth, currentUser, unsubscribeFromDB) 
// are managed by the main script setup.
import { 
    signUpUser, signInUser, signOutUser, onAuthStateChange 
} from './modules/auth.js'; 

import { 
    loadTasksFromDB, addTaskToDB, updateTaskInDB, deleteTaskFromDB, deleteCompletedTasksFromDB
} from './modules/database.js';

import { 
    startTimer, stopTimer, resetTimer, clearLocalState 
} from './modules/timer.js'; 

import { 
    setupDOMReferences, toggleVisibility, getTaskFormData, renderTaskList, toggleModal, renderWeather 
} from './dom/render.js';

import { 
    fetchWeather 
} from './modules/weather.js'; // Note: You need to replace the API Key in the weather module

// --- GLOBAL STATE REFERENCE (defined in the initial script setup) ---
const state = window.state;
const DOMElements = setupDOMReferences();
let currentDraggingElement = null;

// --- AUTHENTICATION & UI MANAGEMENT ---

/**
 * Handles the central user authentication state change.
 * This is the CORE function that toggles the Auth/App UI visibility.
 */
function handleAuthStateChange(user) {
    window.currentUser = user;
    DOMElements.authStatus.textContent = user 
        ? `Logged in as: ${user.email || user.uid}` 
        : "Please Sign In or Sign Up.";

    if (user) {
        // 1. Logged In: Show App, Hide Auth
        toggleVisibility(DOMElements.todoListContainer, 'show');
        toggleVisibility(DOMElements.authContainer, 'hide');
        toggleVisibility(DOMElements.authSignOutBtn, 'show');
        
        // 2. Start Database Listener (Real-time sync)
        if (window.unsubscribeFromDB) {
            window.unsubscribeFromDB(); // Stop any previous listener
        }
        window.unsubscribeFromDB = loadTasksFromDB(user.uid, updateUIWithTasks);

        // 3. Fetch Weather
        fetchWeather().then(renderWeather).catch(e => {
            console.error("Weather fetch failed:", e);
            DOMElements.weatherDisplay.innerHTML = '<p class="weather-loading">Weather failed to load.</p>';
        });


    } else {
        // 1. Logged Out: Hide App, Show Auth
        toggleVisibility(DOMElements.todoListContainer, 'hide');
        toggleVisibility(DOMElements.authContainer, 'show');
        toggleVisibility(DOMElements.authSignOutBtn, 'hide');
        DOMElements.taskList.innerHTML = ''; // Clear tasks UI

        // 2. Stop Database Listener
        if (window.unsubscribeFromDB) {
            window.unsubscribeFromDB();
            window.unsubscribeFromDB = null;
        }
        clearLocalState();
    }
}

/**
 * Callback function used by loadTasksFromDB to update the UI.
 * @param {Array<object>} newTasks - The latest array of tasks from Firestore.
 */
function updateUIWithTasks(newTasks) {
    state.tasks = newTasks;
    renderTaskList(state.tasks, handleTaskAction);
    console.log("UI Updated with new task list:", state.tasks);
}


// --- EVENT HANDLERS ---

/**
 * Handles sign-in/sign-up form submission.
 */
async function handleAuthFormSubmit(event) {
    event.preventDefault();
    const email = DOMElements.authEmail.value;
    const password = DOMElements.authPassword.value;

    try {
        if (event.submitter.id === DOMElements.authSignUpBtn.id) {
            await signUpUser(email, password);
            console.log("Sign Up Successful");
        } else if (event.submitter.id === DOMElements.authSignInBtn.id) {
            await signInUser(email, password);
            console.log("Sign In Successful");
        }
    } catch (error) {
        DOMElements.authStatus.textContent = `Error: ${error.message}`;
        console.error("Authentication Error:", error);
    }
}

/**
 * Handles new task form submission.
 */
async function handleNewTaskSubmit(event) {
    event.preventDefault();
    if (!window.currentUser) {
        console.error("Cannot add task: User not logged in.");
        return;
    }

    const { text, timeLimit } = getTaskFormData();

    if (text.trim() === "") {
        DOMElements.todoInput.focus();
        return;
    }

    try {
        await addTaskToDB(window.currentUser.uid, text, timeLimit);
        // Firestore listener will automatically call updateUIWithTasks
        
        // Clear inputs after successful submission
        DOMElements.todoInput.value = '';
        DOMElements.timerInput.value = '';

    } catch (error) {
        console.error("Failed to add task:", error);
    }
}

/**
 * Handles all delegated clicks on the task list.
 */
async function handleTaskAction(event) {
    const target = event.target;
    const listItem = target.closest('.task-item');
    if (!listItem) return;
    
    const taskId = listItem.dataset.id;
    if (!taskId) return;

    if (target.classList.contains('task-delete-btn')) {
        // DELETE
        try {
            stopTimer(taskId); // Stop timer before deletion
            await deleteTaskFromDB(window.currentUser.uid, taskId);
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    } else if (target.classList.contains('task-complete-cb') || target.classList.contains('checkmark')) {
        // TOGGLE COMPLETION (Clicking the checkbox or the custom checkmark)
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            const newCompletedState = !task.completed;
            try {
                // If completing, stop the timer
                if (newCompletedState) {
                    stopTimer(taskId); 
                }
                await updateTaskInDB(window.currentUser.uid, taskId, { completed: newCompletedState });
            } catch (error) {
                console.error("Failed to update completion:", error);
            }
        }
    } else if (target.classList.contains('task-timer-btn')) {
        // START/STOP TIMER
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            if (task.timerActive) {
                stopTimer(taskId);
            } else {
                startTimer(taskId);
            }
        }
    } else if (target.classList.contains('task-timer-reset-btn')) {
        // RESET TIMER
        resetTimer(taskId); 
    } else if (target.classList.contains('task-text') || listItem.contains(target) && !target.closest('.task-actions') && !target.closest('.task-checkbox-container')) {
        // OPEN MODAL FOR EDITING (Clicking the task text)
        toggleModal('show', taskId);
    }
}

/**
 * Handles saving changes from the edit modal.
 */
async function handleEditTaskSubmit(event) {
    event.preventDefault();
    if (!window.currentUser) return;

    const taskId = DOMElements.editTaskID.value;
    const newText = DOMElements.editTaskText.value;
    const newTimeLimit = parseInt(DOMElements.editTaskTimeLimit.value) || 0;

    if (!taskId || newText.trim() === "") {
        return;
    }

    try {
        await updateTaskInDB(window.currentUser.uid, taskId, {
            text: newText,
            timeLimit: newTimeLimit,
            // When updating timeLimit, reset timeRemaining if it's currently at the old limit
            timeRemaining: newTimeLimit 
        });
        
        // Close modal and clear form
        toggleModal('hide');
    } catch (error) {
        console.error("Failed to edit task:", error);
    }
}

/**
 * Clears all completed tasks from the database.
 */
async function handleClearCompleted() {
    if (!window.currentUser) return;
    try {
        await deleteCompletedTasksFromDB(window.currentUser.uid);
    } catch (error) {
        console.error("Failed to clear completed tasks:", error);
    }
}

// --- DRAG-AND-DROP LOGIC (Reordering - optional) ---

// function handleDragStart(e) {
//     currentDraggingElement = e.target;
//     e.dataTransfer.effectAllowed = 'move';
//     // Optionally set data for other listeners
//     e.dataTransfer.setData('text/plain', e.target.dataset.id);
//     setTimeout(() => e.target.classList.add('dragging'), 0);
// }

// function handleDragOver(e) {
//     e.preventDefault(); 
//     const afterElement = getDragAfterElement(DOMElements.taskList, e.clientY);
//     const currentElement = currentDraggingElement;
    
//     if (afterElement == null) {
//         DOMElements.taskList.appendChild(currentElement);
//     } else {
//         DOMElements.taskList.insertBefore(currentElement, afterElement);
//     }
// }

// function handleDragEnd(e) {
//     e.target.classList.remove('dragging');
//     currentDraggingElement = null;
//     // NOTE: A full implementation here would update the 'timestamp' or 'order' field 
//     // for all tasks in the list to persist the new order in Firestore.
//     // This is complex and often requires a dedicated 'order' field. 
//     // For simplicity, we are skipping the Firestore order update here.
// }

// function getDragAfterElement(container, y) {
//     const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
//     return draggableElements.reduce((closest, child) => {
//         const box = child.getBoundingClientRect();
//         const offset = y - box.top - box.height / 2;
//         if (offset < 0 && offset > closest.offset) {
//             return { offset: offset, element: child };
//         } else {
//             return closest;
//         }
//     }, { offset: Number.NEGATIVE_INFINITY }).element;
// }


// --- INITIALIZATION ---

function initializeApp() {
    // 1. Set up all primary event listeners
    DOMElements.authForm.onsubmit = handleAuthFormSubmit;
    DOMElements.authSignOutBtn.onclick = signOutUser;
    
    DOMElements.newTaskForm.onsubmit = handleNewTaskSubmit;
    DOMElements.clearCompletedBtn.onclick = handleClearCompleted;
    
    DOMElements.editTaskForm.onsubmit = handleEditTaskSubmit;
    DOMElements.modalCloseBtn.onclick = () => toggleModal('hide');
    DOMElements.modalOverlay.onclick = (e) => {
        if (e.target.id === DOMElements.modalOverlay.id) {
            toggleModal('hide');
        }
    };

    // 2. Start Auth State Listener (Critical for conditional rendering)
    onAuthStateChange(handleAuthStateChange);

    // 3. Setup Drag-and-Drop listeners (Currently commented out for simplicity, uncomment for full feature)
    // DOMElements.taskList.addEventListener('dragstart', handleDragStart);
    // DOMElements.taskList.addEventListener('dragover', handleDragOver);
    // DOMElements.taskList.addEventListener('dragend', handleDragEnd);
}

// Ensure initialization runs after all code is parsed
window.onload = initializeApp;// --- DOM RENDERING MODULE (src/dom/render.js) ---