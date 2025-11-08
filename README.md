🚀 My Todo-List-App: Full-Stack Vanilla JS Demo

Welcome to My Todo-List-App – a full-featured, persistent, and authenticated task manager built entirely with Vanilla JavaScript, HTML, and CSS. This project demonstrates mastery of core web technologies and modern architectural patterns without reliance on any major frameworks.

✨ Core & Advanced Features

This application goes beyond basic CRUD to demonstrate real-world scalability:

Authentication & Persistence

🔐 User Authentication: Secure Sign Up and Log In functionality using Firebase Authentication.

💾 Cloud Persistence: Task data is saved per user in Firestore (NoSQL Database), ensuring persistence across devices and sessions.

🔄 Real-time Synchronization: Tasks update instantly for the logged-in user using Firestore's real-time listeners.

Productivity & UX

⏱️ Focused Productivity Timer (FPT): Integrated timer logic to track time spent per task, moving the app from a simple list to a powerful productivity tool.

☁️ Live Weather Integration: Displays local weather using a third-party API Fetch based on user geolocation, providing contextual information for the workday.

🖱️ Advanced UX: Pure Vanilla JS implementation of Drag-and-Drop reordering, showcasing low-level DOM manipulation mastery.

🪟 Modal Editing: A dedicated, custom-built modal for task details and editing, demonstrating advanced CSS transitions and clean DOM control.

📦 Why This Project Stands Out (Technical Highlights)

This project is structured to demonstrate senior-level architectural thinking:

100% Vanilla JavaScript: Every feature, including modals, drag-and-drop, and state management, is implemented without external libraries (e.g., React, Vue, jQuery).

Modular Architecture (ES Modules): Code is logically separated into dedicated modules (state, auth, database, timer, and DOM manipulation), demonstrating a clear separation of concerns crucial for scalability.

External API Integration: Seamlessly handles asynchronous data flow using the native fetch API for the Weather Service and Firebase SDKs.

State-Driven UI: The application is purely driven by the Firebase Auth state, conditionally rendering the login screen or the todo list.

🛠️ Getting Started

Prerequisites

Firebase Account: You must have a Firebase project set up.

API Key: For the weather service, you can use a free key from a provider like OpenWeatherMap.

Installation

Clone the repository:

git clone [https://github.com/yourusername/My-Todo-List-App.git](https://github.com/yourusername/My-Todo-List-App.git)


Configure Environment:

Open the main application file (e.g., index.html if it's a single file) or the main setup script.

Replace the placeholder values for Firebase configuration and the Weather API Key with your actual credentials.

Run Locally:

Open index.html in your browser (a live server extension is recommended for module imports).

Manage Tasks: Sign Up/Log In to create your user-specific list, powered by Firestore.

💡 What You'll Learn (For Reviewers)

This project demonstrates strong command over:

Full-Stack Development with Client-Side JS: Managing user sessions and database interactions using third-party services.

Advanced DOM Manipulation: Handling complex user interactions like drag-and-drop entirely with native APIs.

Asynchronous State Management: Coordinating API calls, Firebase listeners, and local application state.

Maintainable Architecture: Applying modular design patterns to large Vanilla JS applications.

📬 Contact

Questions or feedback? Connect on [LinkedIn] or open an issue!