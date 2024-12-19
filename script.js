// Selecionar elementos
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dateInput = document.getElementById('task-date');
const observationInput = document.getElementById('task-observation');
const columns = document.querySelectorAll('.task-list');
const openModalButton = document.getElementById('open-modal');
const closeModalButton = document.getElementById('close-modal');
const taskModal = document.getElementById('task-modal');
const modalTitle = document.querySelector('.title-modal'); // Seleciona o título do modal

// Variável para rastrear se estamos adicionando ou editando uma tarefa
let isEditing = false;
let currentTask = null;

// Função para salvar tarefas no LocalStorage
const saveTasksToLocalStorage = () => {
  const tasks = Array.from(document.querySelectorAll('.task-list li')).map(task => {
    return {
      text: task.querySelector('.task-text').textContent,
      date: task.querySelector('.task-date').getAttribute('data-date'), // Salvar a data ISO
      observation: task.querySelector('.task-observation').textContent.replace('Obs: ', ''),
      column: task.parentElement.id // Salva a coluna (ID da lista)
    };
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Função para carregar tarefas do LocalStorage
const loadTasksFromLocalStorage = () => {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks.forEach(({ text, date, observation, column }) => {
    const task = createTask(text, date, observation);
    document.getElementById(column).appendChild(task); // Adiciona a tarefa à coluna correspondente
  });
};

// Abrir o modal para adicionar uma nova tarefa
openModalButton.addEventListener('click', () => {
  isEditing = false; // Indicamos que é uma nova tarefa
  form.reset(); // Limpamos os campos do formulário
  form.querySelector('button').textContent = 'Adicionar'; // Botão mostra "Adicionar"
  modalTitle.textContent = 'Adicionar Tarefa'; // Título mostra "Adicionar Tarefa"
  taskModal.style.display = 'flex'; // Mostramos o modal
});

// Abrir o modal para editar uma tarefa existente
const openEditModal = (task, taskText, taskDate, taskObservation) => {
  isEditing = true; // Indicamos que é uma edição
  currentTask = task; // Armazenamos a tarefa que está sendo editada

  // Preenchemos os campos do formulário com os valores da tarefa
  input.value = taskText;
  dateInput.value = taskDate; // Preenche o input de data com o formato ISO
  observationInput.value = taskObservation;

  form.querySelector('button').textContent = 'Salvar'; // Botão mostra "Salvar"
  modalTitle.textContent = 'Editar Tarefa'; // Título mostra "Editar Tarefa"
  taskModal.style.display = 'flex'; // Mostramos o modal
};

// Fechar o modal ao clicar no botão de fechar
closeModalButton.addEventListener('click', () => {
  taskModal.style.display = 'none'; // Escondemos o modal
});

// Fechar o modal ao clicar fora do conteúdo
window.addEventListener('click', (event) => {
  if (event.target === taskModal) {
    taskModal.style.display = 'none';
  }
});

// Função para criar uma nova tarefa
const createTask = (taskText, taskDate, taskObservation) => {
  const task = document.createElement('li');
  
  // Container para o conteúdo da tarefa
  const contentContainer = document.createElement('div');
  contentContainer.className = 'task-content';

  // Nome da tarefa
  const textContainer = document.createElement('span');
  textContainer.textContent = taskText;
  textContainer.className = 'task-text';

  // Formatar a data para exibição
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z'); 
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Criar o container de data com o formato correto
  const dateContainer = document.createElement('span');
  dateContainer.textContent = `Data conclusão: ${formatDate(taskDate)}`;
  dateContainer.className = 'task-date';
  dateContainer.setAttribute('data-date', taskDate); // Salva o formato ISO como atributo

  // Observação
  const observationContainer = document.createElement('p');
  observationContainer.textContent = `Obs: ${taskObservation}`;
  observationContainer.className = 'task-observation';

  // Adicionar conteúdo ao container
  contentContainer.appendChild(textContainer);
  contentContainer.appendChild(observationContainer);
  contentContainer.appendChild(dateContainer);

  // Container para os ícones
  const iconsContainer = document.createElement('div');
  iconsContainer.className = 'task-icons';

  // Ícone de edição
  const editIcon = document.createElement('i');
  editIcon.className = 'fas fa-pencil-alt edit';
  editIcon.title = 'Editar';
  editIcon.addEventListener('click', () => {
    openEditModal(task, taskText, taskDate, taskObservation); // Abrimos o modal para edição
  });

  // Ícone de exclusão
  const deleteIcon = document.createElement('i');
  deleteIcon.className = 'fas fa-trash delete';
  deleteIcon.title = 'Excluir';
  deleteIcon.addEventListener('click', () => {
    task.remove();
    saveTasksToLocalStorage(); // Atualizamos o LocalStorage ao excluir
  });

  // Adicionar ícones ao container
  iconsContainer.appendChild(editIcon);
  iconsContainer.appendChild(deleteIcon);

  // Adicionar containers ao item da lista
  task.appendChild(contentContainer);
  task.appendChild(iconsContainer);

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

// Evento de submit no formulário (Adicionar ou Editar)
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const taskText = input.value;
  const taskDate = dateInput.value; // Captura o formato ISO
  const taskObservation = observationInput.value;

  if (isEditing && currentTask) {
    // Atualizar a tarefa existente
    currentTask.querySelector('.task-text').textContent = taskText;
    currentTask.querySelector('.task-date').textContent = `Data conclusão: ${formatDate(taskDate)}`;
    currentTask.querySelector('.task-date').setAttribute('data-date', taskDate); // Atualiza o atributo ISO
    currentTask.querySelector('.task-observation').textContent = `Obs: ${taskObservation}`;
  } else {
    // Criar uma nova tarefa
    const task = createTask(taskText, taskDate, taskObservation);
    document.getElementById('pending-tasks').appendChild(task);
  }

  // Salvar as tarefas no LocalStorage
  saveTasksToLocalStorage();

  // Fechar o modal e limpar os campos
  taskModal.style.display = 'none';
  form.reset();
});

// Evento para arrastar e soltar
columns.forEach((column) => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingTask = document.querySelector('.dragging');
    column.appendChild(draggingTask);
    saveTasksToLocalStorage(); // Atualizamos o LocalStorage ao arrastar
  });
});

// Carregar tarefas ao iniciar
document.addEventListener('DOMContentLoaded', loadTasksFromLocalStorage);
