 const form = document.getElementById('todo-form');
        const input = document.getElementById('todo-input');
        const list = document.getElementById('todo-list');

        function createTodoItem(text, completed = false) {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = text;
            if (completed) span.classList.add('completed');

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
                li.remove();
            });

            actions.appendChild(checkbox);
            actions.appendChild(delBtn);

            li.appendChild(span);
            li.appendChild(actions);

            return li;
        }

        form.addEventListener('submit', e => {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                list.appendChild(createTodoItem(value));
                input.value = '';
                input.focus();
            }
        });