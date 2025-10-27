// state.js
export const state = {
    tasks: [], // Array of task objects
    nextId: 1
};

export function addTask(text, timeLimit) {
    const newTask = {
        id: state.nextId++,
        text: text,
        timeLimit: parseInt(timeLimit) || 0, // Time in seconds
        completed: false,
        timerActive: false,
        timeRemaining: parseInt(timeLimit) || 0
    };
    state.tasks.push(newTask);
    // Persist to localStorage after every change (Crucial for recruiters!)
    saveState(); 
    return newTask;
}

// ... other functions like toggleCompleted, deleteTask

function saveState() {
    localStorage.setItem('todo-tasks', JSON.stringify(state.tasks));
}

export function loadState() {
    const savedTasks = localStorage.getItem('todo-tasks');
    if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
        // Find the max ID to prevent key collisions
        state.nextId = state.tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    }
}