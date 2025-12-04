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

/**
 * Adds a new task to the database.
 * @param {string} userId - The unique ID of the current user.
 * @param {string} text - The task text/description.
 * @param {number} timeLimit - Time limit in seconds.
 * @returns {Promise} Firestore document reference.
 */
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

/**
 * Updates an existing task in the database.
 * @param {string} userId - The unique ID of the current user.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} updates - Object containing fields to update.
 * @returns {Promise} Firestore update promise.
 */
export async function updateTaskInDB(userId, taskId, updates) {
    return await db.collection('users').doc(userId).collection('tasks').doc(taskId).update(updates);
}

/**
 * Deletes a single task from the database.
 * @param {string} userId - The unique ID of the current user.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise} Firestore delete promise.
 */
export async function deleteTaskFromDB(userId, taskId) {
    return await db.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
}

/**
 * STEP 4: Deletes all completed tasks from the database.
 * This function queries for all tasks where completed === true and deletes them.
 * @param {string} userId - The unique ID of the current user.
 * @returns {Promise} Resolves when all deletions are complete.
 */
export async function deleteCompletedTasksFromDB(userId) {
    try {
        // Query all completed tasks
        const completedTasksQuery = await db
            .collection('users')
            .doc(userId)
            .collection('tasks')
            .where('completed', '==', true)
            .get();

        // If no completed tasks, exit early
        if (completedTasksQuery.empty) {
            console.log('No completed tasks to delete.');
            return;
        }

        // Create a batch operation for efficient deletion
        const batch = db.batch();
        
        completedTasksQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Execute all deletions at once
        await batch.commit();
        console.log(`Deleted ${completedTasksQuery.docs.length} completed task(s).`);
        
    } catch (error) {
        console.error('Error deleting completed tasks:', error);
        throw error;
    }
}

// src/modules/weather.js