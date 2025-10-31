// src/modules/database.js

const db = window.db; // Firestore instance from index.html setup

/**
 * Establishes a real-time listener for the user's tasks collection.
 * This function handles the *reading* and *initial rendering* of the list.
 * @param {string} userId - The unique ID of the current user.
 * @param {function} callback - Function to execute with the new task array.
 * @returns {function} The unsubscribe function to stop the listener.
 */
export function loadTasksFromDB(userId, callback) {
    const tasksRef = db.collection('users').doc(userId).collection('tasks').orderBy('timestamp', 'asc');

    // onSnapshot sets up the real-time listener
    const unsubscribe = tasksRef.onSnapshot(snapshot => {
        const newTasks = snapshot.docs.map(doc => ({
            id: doc.id, // Firestore uses a string ID; we use this as our internal taskId
            ...doc.data()
        }));
        
        // Execute the callback (handleAuthStateChange) with the new data
        callback(newTasks); 
    }, error => {
        console.error("Firestore real-time error:", error);
    });

    return unsubscribe; // Return the function to allow the app to stop listening on logout
}

// --- CRUD Operations ---

export async function addTaskToDB(userId, text, timeLimit) {
    return await db.collection('users').doc(userId).collection('tasks').add({
        text: text,
        timeLimit: parseInt(timeLimit) || 0,
        completed: false,
        timerActive: false,
        timeRemaining: parseInt(timeLimit) || 0,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // For reliable ordering
    });
}

export async function updateTaskInDB(userId, taskId, updates) {
    return await db.collection('users').doc(userId).collection('tasks').doc(taskId).update(updates);
}

export async function deleteTaskFromDB(userId, taskId) {
    return await db.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
}