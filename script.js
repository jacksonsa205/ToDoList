// Selecionar elementos
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dateInput = document.getElementById('task-date');
const observationInput = document.getElementById('task-observation');
const columns = document.querySelectorAll('.task-list');
const openModalButton = document.getElementById('open-modal');
const closeModalButton = document.getElementById('close-modal');
const taskModal = document.getElementById('task-modal');
const modalTitle = document.querySelector('.title-modal');
const printScreenBtn = document.getElementById('print-screen');
const exportExcelBtn = document.getElementById('export-excel');
const showTimelineBtn = document.getElementById('show-timeline');
const kanbanBoard = document.getElementById('kanban-board-print');

// Variável para rastrear se estamos adicionando ou editando uma tarefa
let isEditing = false;
let currentTaskId = null;

// Função para gerar IDs únicos
const generateUniqueId = () => `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Função para salvar tarefas no LocalStorage
const saveTasksToLocalStorage = () => {
  const tasks = Array.from(document.querySelectorAll('.task-list li')).map(task => {
    return {
      id: task.getAttribute('data-id'),
      text: task.querySelector('.task-text').textContent,
      date: task.querySelector('.task-date').getAttribute('data-date'),
      observation: task.querySelector('.task-observation').textContent.replace('Obs: ', ''),
      column: task.parentElement.id
    };
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Função para carregar tarefas do LocalStorage
const loadTasksFromLocalStorage = () => {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  
  // Ordenar tarefas por data (mais antiga primeiro)
  tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  tasks.forEach(({ id, text, date, observation, column }) => {
    const task = createTask(id, text, date, observation);
    document.getElementById(column).appendChild(task);
  });
};

// Função para criar uma nova tarefa
const createTask = (id, taskText, taskDate, taskObservation) => {
  const task = document.createElement('li');
  task.setAttribute('data-id', id);

  // Container para o conteúdo da tarefa
  const contentContainer = document.createElement('div');
  contentContainer.className = 'task-content';

  // Nome da tarefa
  const textContainer = document.createElement('span');
  textContainer.textContent = taskText;
  textContainer.className = 'task-text';

  // Formatar a data para exibição
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Criar o container de data com o formato correto
  const dateContainer = document.createElement('span');
  dateContainer.textContent = `Data conclusão: ${formatDate(taskDate)}`;
  dateContainer.className = 'task-date';
  dateContainer.setAttribute('data-date', taskDate);

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
    openEditModal(id, textContainer.textContent, dateContainer.getAttribute('data-date'), observationContainer.textContent.replace('Obs: ', ''));
  });

  // Ícone de exclusão
  const deleteIcon = document.createElement('i');
  deleteIcon.className = 'fas fa-trash delete';
  deleteIcon.title = 'Excluir';
  deleteIcon.addEventListener('click', () => {
    task.remove();
    saveTasksToLocalStorage();
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

// Função para capturar a tela (com todas as tarefas visíveis)
const captureScreen = () => {
  // Salvar os estilos originais
  const originalStyles = {};
  const taskLists = document.querySelectorAll('.task-list');
  
  // Remover scroll e altura máxima temporariamente
  taskLists.forEach(list => {
    originalStyles[list.id] = {
      maxHeight: list.style.maxHeight,
      overflow: list.style.overflow
    };
    list.style.maxHeight = 'none';
    list.style.overflow = 'visible';
  });

  // Capturar a tela
  html2canvas(kanbanBoard, {
    scale: 1,
    logging: false,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0
  }).then(canvas => {
    // Restaurar os estilos originais
    taskLists.forEach(list => {
      list.style.maxHeight = originalStyles[list.id].maxHeight;
      list.style.overflow = originalStyles[list.id].overflow;
    });

    // Criar e baixar a imagem
    const link = document.createElement('a');
    link.download = 'kanban-board.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
};

// Função para exportar para Excel
const exportToExcel = () => {
  const tasks = Array.from(document.querySelectorAll('.task-list li')).map(task => {
    return {
      'TAREFA': task.querySelector('.task-text').textContent,
      'STATUS': task.parentElement.id.replace('-tasks', '').replace('pending', 'Pendente').replace('in-progress', 'Em Andamento').replace('completed', 'Concluído'),
      'OBS': task.querySelector('.task-observation').textContent.replace('Obs: ', ''),
      'DATA_CONCLUSAO': task.querySelector('.task-date').getAttribute('data-date')
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(tasks);
  XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
  XLSX.writeFile(wb, 'tarefas-kanban.xlsx');
};

// Função para mostrar linha do tempo (placeholder)
const showTimeline = () => {
  alert('Funcionalidade de linha do tempo será implementada em breve!');
};

// Abrir o modal para adicionar uma nova tarefa
openModalButton.addEventListener('click', () => {
  isEditing = false;
  currentTaskId = null;
  form.reset();
  form.querySelector('button').textContent = 'Adicionar';
  modalTitle.textContent = 'Adicionar Tarefa';
  taskModal.style.display = 'flex';
});

// Abrir o modal para editar uma tarefa existente
const openEditModal = (taskId, taskText, taskDate, taskObservation) => {
  isEditing = true;
  currentTaskId = taskId;
  input.value = taskText;
  dateInput.value = taskDate;
  observationInput.value = taskObservation;
  form.querySelector('button').textContent = 'Salvar';
  modalTitle.textContent = 'Editar Tarefa';
  taskModal.style.display = 'flex';
};

// Fechar o modal ao clicar no botão de fechar
closeModalButton.addEventListener('click', () => {
  taskModal.style.display = 'none';
  form.reset();
});

// Fechar o modal ao clicar fora do conteúdo
window.addEventListener('click', (event) => {
  if (event.target === taskModal) {
    taskModal.style.display = 'none';
    form.reset();
  }
});

// Evento de submit no formulário (Adicionar ou Editar)
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const taskText = input.value.trim();
  const taskDate = dateInput.value;
  const taskObservation = observationInput.value.trim();

  if (!taskText || !taskDate || !taskObservation) {
    alert('Preencha todos os campos antes de salvar.');
    return;
  }

  if (isEditing && currentTaskId) {
    const currentTask = document.querySelector(`[data-id='${currentTaskId}']`);
    if (currentTask) {
      currentTask.querySelector('.task-text').textContent = taskText;
      currentTask.querySelector('.task-date').textContent = `Data conclusão: ${taskDate.split('-').reverse().join('/')}`;
      currentTask.querySelector('.task-date').setAttribute('data-date', taskDate);
      currentTask.querySelector('.task-observation').textContent = `Obs: ${taskObservation}`;
      isEditing = false;
      currentTaskId = null;
    }
  } else {
    const taskId = generateUniqueId();
    const task = createTask(taskId, taskText, taskDate, taskObservation);
    document.getElementById('pending-tasks').appendChild(task);
  }

  saveTasksToLocalStorage();
  taskModal.style.display = 'none';
  form.reset();
});

// Eventos de arrastar e soltar
columns.forEach((column) => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingTask = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(column, e.clientY);
    
    if (afterElement == null) {
      column.appendChild(draggingTask);
    } else {
      column.insertBefore(draggingTask, afterElement);
    }
    
    saveTasksToLocalStorage();
  });
});

// Função auxiliar para determinar a posição do arraste
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Eventos dos botões de ação
printScreenBtn.addEventListener('click', captureScreen);
exportExcelBtn.addEventListener('click', exportToExcel);
showTimelineBtn.addEventListener('click', showTimeline);

// Carregar tarefas ao iniciar
document.addEventListener('DOMContentLoaded', loadTasksFromLocalStorage);