const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const timerInput = document.getElementById('todo-timer');
const list = document.getElementById('todo-list');
const clearCompletedBtn = document.getElementById('clear-completed');

// Create a new todo item with a timer
function createTodoItem(text, timeLimit = 300) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    li.appendChild(span);

    const timerDisplay = document.createElement('span');
    timerDisplay.className = 'timer';
    li.appendChild(timerDisplay);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', () => {
        span.classList.toggle('completed');
        clearInterval(timerInterval); // Stop timer when completed
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
        list.removeChild(li);
        clearInterval(timerInterval); // Clear timer on delete
    });

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Timer';
    clearBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerDisplay.textContent = 'Timer cleared';
    });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Timer';
    resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timeLimit = initialTimeLimit; // Reset to original time
        updateTimerDisplay();
        startTimer();
    });

    actions.appendChild(checkbox);
    actions.appendChild(delBtn);
    actions.appendChild(clearBtn);
    actions.appendChild(resetBtn);
    li.appendChild(actions);

    // Timer functionality
    let timerInterval;
    let initialTimeLimit = timeLimit; // Store initial time
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLimit / 60);
        const seconds = timeLimit % 60;
        timerDisplay.textContent = `Timer: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            if (timeLimit > 0) {
                timeLimit--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                alert(`${text} time's up!`);
            }
        }, 1000);
    }
    
    updateTimerDisplay(); // Initial display
    startTimer(); // Start the timer when the todo is created
    
    return li; // Return the list item for appending to the list
}

// Handle form submission
form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value.trim();
    const timeValue = parseInt(timerInput.value.trim(), 10);
    if (value && timeValue > 0) {
        list.appendChild(createTodoItem(value, timeValue)); // Append the new todo item with timer
        input.value = '';
        timerInput.value = ''; // Reset timer input
        input.focus();
    }
});

clearCompletedBtn.addEventListener('click', () => {
    const completedItems = list.querySelectorAll('.completed');
    completedItems.forEach(item => item.closest('li').remove());
});