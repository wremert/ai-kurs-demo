const form = document.getElementById('add-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const counter = document.getElementById('task-counter');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

tasks = tasks.map(t => ({
    id: t.id ?? t.createdAt,
    completed: t.completed ?? false,
    ...t
}));

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const remaining = tasks.filter(t => !t.completed).length;
    counter.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;

    const sorted = [
        ...tasks.filter(t => !t.completed),
        ...tasks.filter(t => t.completed)
    ];

    list.innerHTML = '';
    sorted.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.innerHTML = `
            <input type="checkbox" data-id="${task.id}"${task.completed ? ' checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
        `;
        list.appendChild(li);
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        tasks.push({ id: Date.now(), text, createdAt: Date.now(), completed: false });
        saveTasks();
        renderTasks();
        input.value = '';
    }
});

list.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const id = parseInt(e.target.dataset.id, 10);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = e.target.checked;
            saveTasks();
            renderTasks();
        }
    }
});

list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = parseInt(e.target.dataset.id, 10);
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
    }
});

renderTasks();
