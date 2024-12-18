// Selecionar elementos
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const columns = document.querySelectorAll('.task-list');

// Função para criar uma nova tarefa
const createTask = (taskText) => {
  const task = document.createElement('li');
  task.textContent = taskText;

  // Botões de edição e exclusão
  const editButton = document.createElement('button');
  editButton.textContent = 'Editar';
  editButton.className = 'edit';
  editButton.addEventListener('click', () => {
    const newText = prompt('Edite sua tarefa:', task.textContent);
    if (newText) task.firstChild.textContent = newText;
  });

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Excluir';
  deleteButton.className = 'delete';
  deleteButton.addEventListener('click', () => task.remove());

  // Adicionar botões e arrastar
  task.appendChild(editButton);
  task.appendChild(deleteButton);
  task.draggable = true;

  // Evento de arrastar
  task.addEventListener('dragstart', () => {
    task.classList.add('dragging');
  });

  task.addEventListener('dragend', () => {
    task.classList.remove('dragging');
  });

  return task;
};

// Evento de adicionar tarefa
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const task = createTask(input.value);
  document.getElementById('pending-tasks').appendChild(task);
  input.value = '';
});

// Evento para arrastar e soltar
columns.forEach((column) => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingTask = document.querySelector('.dragging');
    column.appendChild(draggingTask);
  });
});
