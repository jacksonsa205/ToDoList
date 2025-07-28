// Selecionar elementos
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dateInput = document.getElementById('task-date');
const observationInput = document.getElementById('task-observation');
const responsibleInput = document.getElementById('task-responsible');
const priorityInput = document.getElementById('task-priority');
const tagsInput = document.getElementById('task-tags-input');
const addTagsBtn = document.getElementById('add-tags-btn');
const fileUpload = document.getElementById('task-file-upload');
const columns = document.querySelectorAll('.task-list');
const openModalButton = document.getElementById('open-modal');
const closeModalButton = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-task-btn');
const taskModal = document.getElementById('task-modal');
const modalTitle = document.querySelector('.title-modal');
const printScreenBtn = document.getElementById('print-screen');
const exportExcelBtn = document.getElementById('export-excel');
const showTimelineBtn = document.getElementById('show-timeline');
const kanbanBoard = document.getElementById('kanban-board-print');
const tagsContainer = document.getElementById('tags-container');
const attachmentsContainer = document.getElementById('attachments-container');
const detailModal = document.getElementById('detail-modal');
const closeDetailModal = document.getElementById('close-detail-modal');
const taskDetailContent = document.getElementById('task-detail-content');
const saveTaskBtn = document.getElementById('save-task-btn');

// Variáveis de estado
let isEditing = false;
let currentTaskId = null;
let currentTags = [];
let currentAttachments = [];

// Função para gerar IDs únicos
const generateUniqueId = () => `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Função para formatar data
const formatDate = (dateString) => {
  if (!dateString) return 'Sem data';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Função para obter label de prioridade
const getPriorityLabel = (priority) => {
  const labels = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente'
  };
  return labels[priority] || '';
};

// Função para obter classe de prioridade
const getPriorityClass = (priority) => {
  const classes = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'urgent': 'urgent'
  };
  return classes[priority] || 'medium';
};

// Função para atualizar exibição de tags
const updateTagsDisplay = () => {
  tagsContainer.innerHTML = '';
  
  if (currentTags.length === 0) {
    const noTags = document.createElement('span');
    noTags.className = 'no-tags';
    noTags.textContent = 'Nenhuma tag adicionada';
    tagsContainer.appendChild(noTags);
  } else {
    currentTags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'tag';
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove">&times;</span>
      `;
      
      tagElement.querySelector('.tag-remove').addEventListener('click', () => {
        currentTags = currentTags.filter(t => t !== tag);
        updateTagsDisplay();
      });
      
      tagsContainer.appendChild(tagElement);
    });
  }
};

// Função para atualizar exibição de anexos
const updateAttachmentsDisplay = () => {
  attachmentsContainer.innerHTML = '';
  
  if (currentAttachments.length === 0) {
    const noAttachments = document.createElement('p');
    noAttachments.className = 'no-attachments';
    noAttachments.textContent = 'Nenhum arquivo anexado';
    attachmentsContainer.appendChild(noAttachments);
  } else {
    currentAttachments.forEach((file, index) => {
      const attachmentElement = document.createElement('div');
      attachmentElement.className = 'attachment-item';
      attachmentElement.innerHTML = `
        <div class="attachment-info">
          <i class="fas fa-file-alt attachment-icon"></i>
          <span class="attachment-name">${file.name}</span>
        </div>
        <i class="fas fa-times attachment-remove"></i>
      `;
      
      attachmentElement.querySelector('.attachment-remove').addEventListener('click', () => {
        currentAttachments.splice(index, 1);
        updateAttachmentsDisplay();
      });
      
      attachmentsContainer.appendChild(attachmentElement);
    });
  }
};

// Função para salvar tarefas no LocalStorage
const saveTasksToLocalStorage = () => {
  const tasks = Array.from(document.querySelectorAll('.task-list li')).map(task => {
    return {
      id: task.getAttribute('data-id'),
      text: task.querySelector('.task-text').textContent,
      date: task.querySelector('.task-date').getAttribute('data-date'),
      observation: task.querySelector('.task-observation')?.textContent || '',
      priority: task.querySelector('.task-priority')?.className.replace('task-priority ', '') || 'medium',
      responsible: task.querySelector('.task-responsible')?.textContent.replace('<i class="fas fa-user"></i> ', '') || '',
      tags: Array.from(task.querySelectorAll('.task-tag')).map(tag => tag.textContent),
      attachments: JSON.parse(task.getAttribute('data-attachments') || '[]'),
      column: task.parentElement.id
    };
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Função para carregar tarefas do LocalStorage
const loadTasksFromLocalStorage = () => {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  
  tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  tasks.forEach(task => {
    const taskElement = createTaskElement(task.id, {
      text: task.text,
      date: task.date,
      observation: task.observation,
      priority: task.priority,
      responsible: task.responsible,
      tags: task.tags,
      attachments: task.attachments
    });
    document.getElementById(task.column).appendChild(taskElement);
  });
};

// Função para mostrar detalhes da tarefa
const showTaskDetails = (taskData) => {
  taskDetailContent.innerHTML = `
    <div class="detail-group">
      <span class="detail-label">Tarefa</span>
      <div class="detail-value">${taskData.text}</div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Status</span>
      <div class="detail-value">${taskData.column.replace('pending', 'Pendente').replace('in-progress', 'Em Andamento').replace('completed', 'Concluído')}</div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Responsável</span>
      <div class="detail-value">${taskData.responsible || 'Não atribuído'}</div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Prioridade</span>
      <div class="detail-value">
        <span class="detail-priority ${getPriorityClass(taskData.priority)}">${getPriorityLabel(taskData.priority)}</span>
      </div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Data de Conclusão</span>
      <div class="detail-value">${formatDate(taskData.date)}</div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Tags</span>
      <div class="detail-value">
        <div class="detail-tags">
          ${taskData.tags && taskData.tags.length > 0 
            ? taskData.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('') 
            : 'Nenhuma tag'}
        </div>
      </div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Observações</span>
      <div class="detail-value">${taskData.observation || 'Nenhuma observação'}</div>
    </div>
    
    <div class="detail-group">
      <span class="detail-label">Anexos</span>
      <div class="detail-value">
        ${taskData.attachments && taskData.attachments.length > 0 
          ? taskData.attachments.map(file => `<div><i class="fas fa-paperclip"></i> ${file.name}</div>`).join('') 
          : 'Nenhum anexo'}
      </div>
    </div>
  `;
  
  detailModal.style.display = 'flex';
};

// Função para criar elemento de tarefa
const createTaskElement = (id, taskData) => {
  const task = document.createElement('li');
  task.setAttribute('data-id', id);
  task.setAttribute('data-attachments', JSON.stringify(taskData.attachments || []));

  const contentContainer = document.createElement('div');
  contentContainer.className = 'task-content';

  const headerContainer = document.createElement('div');
  headerContainer.className = 'task-header';
  
  const titleContainer = document.createElement('div');
  titleContainer.className = 'task-title-container';
  
  const textContainer = document.createElement('span');
  textContainer.textContent = taskData.text;
  textContainer.className = 'task-text';
  
  if (taskData.priority) {
    const priorityContainer = document.createElement('span');
    priorityContainer.className = `task-priority ${taskData.priority}`;
    priorityContainer.textContent = getPriorityLabel(taskData.priority);
    titleContainer.appendChild(priorityContainer);
  }
  
  titleContainer.appendChild(textContainer);
  headerContainer.appendChild(titleContainer);
  
  if (taskData.responsible) {
    const responsibleContainer = document.createElement('span');
    responsibleContainer.className = 'task-responsible';
    responsibleContainer.innerHTML = `<i class="fas fa-user"></i> ${taskData.responsible}`;
    contentContainer.appendChild(responsibleContainer);
  }

  if (taskData.tags && taskData.tags.length > 0) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'task-tags';
    taskData.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'task-tag';
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
    contentContainer.appendChild(tagsContainer);
  }

  if (taskData.observation) {
    const observationContainer = document.createElement('p');
    observationContainer.className = 'task-observation';
    observationContainer.textContent = taskData.observation;
    contentContainer.appendChild(observationContainer);
  }

  const dateContainer = document.createElement('span');
  dateContainer.className = 'task-date';
  dateContainer.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(taskData.date)}`;
  dateContainer.setAttribute('data-date', taskData.date);

  if (taskData.attachments && taskData.attachments.length > 0) {
    const attachmentsContainer = document.createElement('div');
    attachmentsContainer.className = 'task-attachments';
    attachmentsContainer.innerHTML = `<i class="fas fa-paperclip"></i> ${taskData.attachments.length} anexo(s)`;
    contentContainer.appendChild(attachmentsContainer);
  }

  contentContainer.insertBefore(headerContainer, contentContainer.firstChild);
  contentContainer.appendChild(dateContainer);

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'task-actions';

  const viewIcon = document.createElement('i');
  viewIcon.className = 'fas fa-search view';
  viewIcon.title = 'Visualizar';
  viewIcon.addEventListener('click', () => {
    showTaskDetails({
      ...taskData,
      column: task.parentElement.id
    });
  });

  const editIcon = document.createElement('i');
  editIcon.className = 'fas fa-pencil-alt edit';
  editIcon.title = 'Editar';
  editIcon.addEventListener('click', () => {
    openEditModal(task);
  });

  const deleteIcon = document.createElement('i');
  deleteIcon.className = 'fas fa-trash delete';
  deleteIcon.title = 'Excluir';
  deleteIcon.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      task.remove();
      saveTasksToLocalStorage();
    }
  });

  actionsContainer.appendChild(viewIcon);
  actionsContainer.appendChild(editIcon);
  actionsContainer.appendChild(deleteIcon);

  task.appendChild(contentContainer);
  task.appendChild(actionsContainer);

  task.draggable = true;

  task.addEventListener('dragstart', () => {
    task.classList.add('dragging');
  });

  task.addEventListener('dragend', () => {
    task.classList.remove('dragging');
    saveTasksToLocalStorage();
  });

  return task;
};

// Função para abrir modal de edição
const openEditModal = (taskElement) => {
  isEditing = true;
  currentTaskId = taskElement.getAttribute('data-id');
  
  const taskData = {
    text: taskElement.querySelector('.task-text').textContent,
    date: taskElement.querySelector('.task-date').getAttribute('data-date'),
    observation: taskElement.querySelector('.task-observation')?.textContent || '',
    priority: taskElement.querySelector('.task-priority')?.className.replace('task-priority ', '') || 'medium',
    responsible: taskElement.querySelector('.task-responsible')?.textContent.replace('<i class="fas fa-user"></i> ', '') || '',
    tags: Array.from(taskElement.querySelectorAll('.task-tag')).map(tag => tag.textContent),
    attachments: JSON.parse(taskElement.getAttribute('data-attachments') || '[]')
  };
  
  input.value = taskData.text;
  dateInput.value = taskData.date;
  dateInput.removeAttribute('min'); // Remove data mínima para edição
  observationInput.value = taskData.observation;
  priorityInput.value = taskData.priority;
  
  // Configura o responsável corretamente
  if (taskData.responsible) {
    const options = Array.from(responsibleInput.options);
    const foundOption = options.find(option => option.text === taskData.responsible);
    
    if (foundOption) {
      responsibleInput.value = foundOption.value;
    } else {
      // Se não encontrar, adiciona como nova opção
      const newOption = new Option(taskData.responsible, taskData.responsible);
      responsibleInput.add(newOption);
      responsibleInput.value = taskData.responsible;
    }
  } else {
    responsibleInput.value = '';
  }
  
  currentTags = taskData.tags;
  updateTagsDisplay();
  
  currentAttachments = taskData.attachments.map(file => {
    return new File([], file.name, { type: file.type });
  });
  updateAttachmentsDisplay();
  
  saveTaskBtn.textContent = 'Salvar Alterações';
  modalTitle.textContent = 'Editar Tarefa';
  taskModal.style.display = 'flex';
};

// Função para resetar o modal
const resetModal = () => {
  form.reset();
  currentTags = [];
  currentAttachments = [];
  updateTagsDisplay();
  updateAttachmentsDisplay();
  
  // Define data mínima apenas para novas tarefas
  if (!isEditing) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  } else {
    dateInput.removeAttribute('min');
  }
};

// Função para capturar a tela
const captureScreen = () => {
  const originalStyles = {};
  const taskLists = document.querySelectorAll('.task-list');
  
  taskLists.forEach(list => {
    originalStyles[list.id] = {
      maxHeight: list.style.maxHeight,
      overflow: list.style.overflow
    };
    list.style.maxHeight = 'none';
    list.style.overflow = 'visible';
  });

  html2canvas(kanbanBoard, {
    scale: 1,
    logging: false,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0
  }).then(canvas => {
    taskLists.forEach(list => {
      list.style.maxHeight = originalStyles[list.id].maxHeight;
      list.style.overflow = originalStyles[list.id].overflow;
    });

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
      'RESPONSÁVEL': task.querySelector('.task-responsible')?.textContent.replace('<i class="fas fa-user"></i> ', '') || 'Não atribuído',
      'PRIORIDADE': getPriorityLabel(task.querySelector('.task-priority')?.className.replace('task-priority ', '') || 'medium'),
      'OBSERVAÇÃO': task.querySelector('.task-observation')?.textContent || '',
      'DATA_CONCLUSAO': task.querySelector('.task-date').getAttribute('data-date'),
      'TAGS': Array.from(task.querySelectorAll('.task-tag')).map(tag => tag.textContent).join(', '),
      'ANEXOS': JSON.parse(task.getAttribute('data-attachments') || '[]').map(f => f.name).join(', ')
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(tasks);
  XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
  XLSX.writeFile(wb, 'tarefas-kanban.xlsx');
};

// Função para mostrar linha do tempo
const showTimeline = () => {
  window.location.href = 'timeline.html';
};

// Event Listeners
openModalButton.addEventListener('click', () => {
  isEditing = false;
  currentTaskId = null;
  resetModal();
  saveTaskBtn.textContent = 'Adicionar';
  modalTitle.textContent = 'Adicionar Tarefa';
  taskModal.style.display = 'flex';
});

closeModalButton.addEventListener('click', () => {
  taskModal.style.display = 'none';
  resetModal();
});

closeDetailModal.addEventListener('click', () => {
  detailModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
  taskModal.style.display = 'none';
  resetModal();
});

window.addEventListener('click', (event) => {
  if (event.target === taskModal) {
    taskModal.style.display = 'none';
    resetModal();
  }
  
  if (event.target === detailModal) {
    detailModal.style.display = 'none';
  }
});

addTagsBtn.addEventListener('click', () => {
  if (tagsInput.value.trim()) {
    const newTags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    currentTags = [...new Set([...currentTags, ...newTags])];
    updateTagsDisplay();
    tagsInput.value = '';
  }
});

fileUpload.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    currentAttachments = [...currentAttachments, ...Array.from(e.target.files)];
    updateAttachmentsDisplay();
    e.target.value = '';
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const taskText = input.value.trim();
  const taskDate = dateInput.value;
  const taskObservation = observationInput.value.trim();
  const taskPriority = priorityInput.value;
  const taskResponsible = responsibleInput.value;

  if (!taskText || !taskDate) {
    alert('Preencha pelo menos o nome e a data da tarefa.');
    return;
  }

  const taskData = {
    text: taskText,
    date: taskDate,
    observation: taskObservation,
    priority: taskPriority,
    responsible: taskResponsible,
    tags: currentTags,
    attachments: currentAttachments.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    }))
  };

  if (isEditing && currentTaskId) {
    const currentTask = document.querySelector(`[data-id='${currentTaskId}']`);
    if (currentTask) {
      const newTask = createTaskElement(currentTaskId, taskData);
      currentTask.replaceWith(newTask);
    }
  } else {
    const taskId = generateUniqueId();
    const task = createTaskElement(taskId, taskData);
    document.getElementById('pending-tasks').appendChild(task);
  }

  saveTasksToLocalStorage();
  taskModal.style.display = 'none';
  resetModal();
});

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
  });
});

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

printScreenBtn.addEventListener('click', captureScreen);
exportExcelBtn.addEventListener('click', exportToExcel);
showTimelineBtn.addEventListener('click', showTimeline);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadTasksFromLocalStorage();
});