const form = document.getElementById('add-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const counter = document.getElementById('task-counter');
const themeToggle = document.getElementById('theme-toggle');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

tasks = tasks.map(t => ({
    id: t.id ?? t.createdAt,
    completed: t.completed ?? false,
    ...t
}));

// Dark mode
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.dataset.theme = 'dark';
    themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    if (isDark) {
        delete document.documentElement.dataset.theme;
        localStorage.removeItem('theme');
        themeToggle.textContent = '🌙';
    } else {
        document.documentElement.dataset.theme = 'dark';
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '☀️';
    }
});

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
        li.setAttribute('draggable', 'true');
        li.dataset.id = task.id;
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

// Inline editing — double-click task text to edit
list.addEventListener('dblclick', (e) => {
    const span = e.target.closest('.task-text');
    if (!span) return;
    const li = span.closest('.task-item');
    const id = parseInt(li.dataset.id, 10);
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = task.text;
    span.replaceWith(editInput);
    editInput.focus();
    editInput.select();

    function commitEdit() {
        if (!editInput.isConnected) return;
        const newText = editInput.value.trim();
        if (newText) {
            task.text = newText;
            saveTasks();
        }
        renderTasks();
    }

    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') renderTasks();
    });
    editInput.addEventListener('blur', commitEdit);
});

// Drag-to-reorder
let dragSrcId = null;

list.addEventListener('dragstart', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    dragSrcId = parseInt(li.dataset.id, 10);
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
});

list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const li = e.target.closest('.task-item');
    if (!li || parseInt(li.dataset.id, 10) === dragSrcId) return;
    document.querySelectorAll('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    li.classList.add('drag-over');
});

list.addEventListener('dragleave', (e) => {
    const li = e.target.closest('.task-item');
    if (li) li.classList.remove('drag-over');
});

list.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetLi = e.target.closest('.task-item');
    if (!targetLi) return;
    const targetId = parseInt(targetLi.dataset.id, 10);
    targetLi.classList.remove('drag-over');
    if (dragSrcId === null || dragSrcId === targetId) return;

    const srcIndex = tasks.findIndex(t => t.id === dragSrcId);
    const tgtIndex = tasks.findIndex(t => t.id === targetId);
    if (srcIndex === -1 || tgtIndex === -1) return;

    const [moved] = tasks.splice(srcIndex, 1);
    tasks.splice(tgtIndex, 0, moved);
    saveTasks();
    renderTasks();
});

list.addEventListener('dragend', () => {
    dragSrcId = null;
    document.querySelectorAll('.task-item.dragging, .task-item.drag-over').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
});

renderTasks();
