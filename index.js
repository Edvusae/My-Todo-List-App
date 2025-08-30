const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const clearCompletedBtn = document.getElementById('clear-completed');

// Create a new todo item
function createTodoItem(text, completed = false) {
    const li = document.createElement('li'); // Create the list item
    const span = document.createElement('span');
    span.textContent = text;
    if (completed) span.classList.add('completed'); // Add completed class if needed
    li.appendChild(span);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.addEventListener('change', () => {
        span.classList.toggle('completed');
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
        list.removeChild(li);
    });

    actions.appendChild(checkbox);
    actions.appendChild(delBtn);
    li.appendChild(actions); // Append actions to the list item
    return li; // Return the list item for appending to the list
}

list.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
        e.target.closest('li').remove();
    }
});

// Handle form submission
form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value.trim();
    if (value) {
        list.appendChild(createTodoItem(value)); // Append the new todo item
        input.value = '';
        input.focus();
    }
});

clearCompletedBtn.addEventListener('click', () => {
    const completedItems = list.querySelectorAll('.completed');
    completedItems.forEach(item => item.closest('li').remove()); // Remove completed items
});