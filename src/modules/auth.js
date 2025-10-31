// src/modules/auth.js

// Firebase objects are exposed via the window object
const auth = window.auth; 

/**
 * Handles user sign up with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} User credential object
 */
export async function signUpUser(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return userCredential;
    } catch (error) {
        // Return or throw a specific error for UI feedback
        console.error("Sign up error:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Handles user sign in with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} User credential object
 */
export async function signInUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential;
    } catch (error) {
        console.error("Sign in error:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Signs the currently logged-in user out.
 * @returns {Promise<void>}
 */
export async function signOutUser() {
    try {
        await auth.signOut();
        // Clear local state/UI here if needed (handled in app.js listener)
    } catch (error) {
        console.error("Sign out error:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Sets up a listener to monitor the user's authentication state.
 * This is the most reliable way to manage user sessions.
 * @param {function} callback - Function to run when auth state changes (on login/logout)
 */
export function onAuthStateChange(callback) {
    // The Firebase listener returns a function to unsubscribe when called
    return auth.onAuthStateChanged(callback);
}