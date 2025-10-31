// src/app.js

import { state, clearLocalState } from './modules/state.js';
import { renderTaskList, renderWeather, setupDOMReferences, toggleModal, getTaskFormData, toggleVisibility } from './dom/render.js';
import { fetchWeather } from './modules/weather.js';
import { startTimer, stopTimer } from './modules/timer.js';
import { onAuthStateChange, signInUser, signUpUser, signOutUser } from './modules/auth.js';
import { addTaskToDB, updateTaskInDB, deleteTaskFromDB, loadTasksFromDB } from './modules/database.js';

// --- Global Context and DOM References ---
let DOMElements;
let unsubscribeFromAuth = null;

// --- CRITICAL: Overwrite the local state functions to use the Database ---
// We redefine the state management to call the database module instead of local storage.

const addTask = async (text, timeLimit) => {
    if (window.currentUser) {
        await addTaskToDB(window.currentUser.uid, text, timeLimit);
        // Database listener will re-render the list, no need to call renderTaskList here.
    }
};

const toggleCompleted = async (taskId) => {
    if (window.currentUser) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            await updateTaskInDB(window.currentUser.uid, taskId, { completed: !task.completed });
        }
    }
};

const deleteTask = async (taskId) => {
    if (window.currentUser) {
        await deleteTaskFromDB(window.currentUser.uid, taskId);
    }
};

const reorderTask = async (draggedId, targetId) => {
    // NOTE: Drag-and-drop state updates are complex with a real-time database.
    // For this demonstration, we'll let the user reorder visually in the UI, 
    // but the final state update requires saving the new 'order' property to DB.
    // A robust solution would update the 'order' field of every item in the dragged range.
    // For now, we'll log the action and rely on the database's order.
    console.warn(`Drag-and-Drop: Order change detected (Task ${draggedId}) - 
                 You would implement batch updates to Firestore here.`);
    // A simple, effective implementation updates the database with the new array order.
    // In a real app, we'd update a numeric 'order' field for all tasks.
};

// --- AUTHENTICATION & UI Management ---

/**
 * Handles all authentication form actions (Sign In/Up).
 * @param {Event} e - The form submit event.
 */
async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = DOMElements.authEmail.value;
    const password = DOMElements.authPassword.value;

    try {
        if (e.submitter.id === 'auth-sign-up-btn') {
            await signUpUser(email, password);
        } else {
            await signInUser(email, password);
        }
        DOMElements.authForm.reset();
    } catch (error) {
        alert("Authentication Failed: " + error.message);
    }
}

/**
 * Core function to switch the UI and load data based on user authentication status.
 * This is triggered by Firebase on every login/logout event.
 * @param {object | null} user - The Firebase User object or null if logged out.
 */
function handleAuthStateChange(user) {
    window.currentUser = user;
    
    // Clear any previous database listeners before establishing a new state
    if (window.unsubscribeFromDB) {
        window.unsubscribeFromDB();
    }

    if (user) {
        // --- LOGGED IN STATE ---
        DOMElements.authStatus.textContent = `Welcome, ${user.email}!`;
        toggleVisibility(DOMElements.authForm, 'hide');
        toggleVisibility(DOMElements.authSignOutBtn, 'show');
        toggleVisibility(DOMElements.todoListContainer, 'show'); // Show main app
        
        // 🔑 KEY CHANGE: Start listening for real-time data from Firestore
        window.unsubscribeFromDB = loadTasksFromDB(user.uid, (newTasks) => {
             // This callback runs whenever the database data changes
             state.tasks = newTasks;
             renderTaskList(state.tasks, handleTaskAction);
        });

    } else {
        // --- LOGGED OUT STATE ---
        DOMElements.authStatus.textContent = 'Please Sign In or Sign Up.';
        toggleVisibility(DOMElements.authForm, 'show');
        toggleVisibility(DOMElements.authSignOutBtn, 'hide');
        toggleVisibility(DOMElements.todoListContainer, 'hide'); // Hide main app

        // Clear local state and UI
        clearLocalState(); // function to clear state.tasks and localStorage if any
        renderTaskList(state.tasks, handleTaskAction);
    }
}

// --- INITIALIZATION ---

async function init() {
    // 1. Setup DOM References
    DOMElements = setupDOMReferences();

    // 2. Initialize Weather Feature (Doesn't require user login)
    const weatherData = await fetchWeather();
    if (weatherData) {
        renderWeather(weatherData);
    }

    // 3. Setup Authentication Listener
    // This listener is the true app initializer now.
    unsubscribeFromAuth = onAuthStateChange(handleAuthStateChange);

    // 4. Attach Main Event Listeners
    DOMElements.authForm.addEventListener('submit', handleAuthSubmit);
    DOMElements.authSignOutBtn.addEventListener('click', signOutUser);

    // Task-specific event listeners (now call the DB-wrapped functions)
    DOMElements.newTaskForm.addEventListener('submit', handleTaskSubmit);
    DOMElements.taskList.addEventListener('click', handleTaskAction); // Event delegation
    DOMElements.openModalBtn.addEventListener('click', () => toggleModal('show'));
    
    // 5. Initialize Drag and Drop (Still important for UX)
    handleDragAction();
    
    // Cleanup listener on window close (good practice)
    window.addEventListener('beforeunload', () => {
        if (unsubscribeFromAuth) unsubscribeFromAuth();
        if (window.unsubscribeFromDB) window.unsubscribeFromDB();
    });
    
    console.log('Todo App: Fully initialized with Firebase Authentication and Firestore listeners.');
}

// Start the application!
document.addEventListener('DOMContentLoaded', init);