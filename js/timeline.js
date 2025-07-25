document.addEventListener('DOMContentLoaded', function() {
  // Elementos da página
  const backButton = document.getElementById('back-to-kanban');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const pendingCount = document.getElementById('pending-count');
  const inProgressCount = document.getElementById('in-progress-count');
  const completedCount = document.getElementById('completed-count');
  const timelineDataBody = document.getElementById('timeline-data');
  const timelinePointsContainer = document.getElementById('timeline-points');

  // Variáveis globais
  let tasks = [];
  let currentData = {};

  // Botão para voltar ao Kanban
  backButton.addEventListener('click', function() {
    window.location.href = 'index.html';
  });

  // Carregar tarefas do LocalStorage
  function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
    updateTimeline();
  }

  // Aplicar filtros
  applyFiltersBtn.addEventListener('click', function() {
    updateTimeline();
  });

  // Atualizar a linha do tempo com os dados
  function updateTimeline() {
    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

    // Filtrar tarefas por período
    let filteredTasks = tasks;
    if (startDate || endDate) {
      filteredTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        taskDate.setDate(taskDate.getDate() + 1);
        
        return (!startDate || taskDate >= startDate) && 
               (!endDate || taskDate <= endDate);
      });
    }

    // Agrupar tarefas por data e status
    const tasksByDate = {};
    filteredTasks.forEach(task => {
      const taskDate = new Date(task.date);
      taskDate.setDate(taskDate.getDate() + 1);
      const dateKey = taskDate.toISOString().split('T')[0];

      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = {
          pending: 0,
          inProgress: 0,
          completed: 0,
          total: 0,
          dateObj: taskDate
        };
      }

      if (task.column === 'pending-tasks') {
        tasksByDate[dateKey].pending++;
      } else if (task.column === 'in-progress-tasks') {
        tasksByDate[dateKey].inProgress++;
      } else if (task.column === 'completed-tasks') {
        tasksByDate[dateKey].completed++;
      }
      tasksByDate[dateKey].total++;
    });

    // Salvar dados atuais para uso nos tooltips
    currentData = tasksByDate;

    // Ordenar datas
    const sortedDates = Object.keys(tasksByDate).sort();

    // Atualizar contagens gerais
    const totalPending = filteredTasks.filter(t => t.column === 'pending-tasks').length;
    const totalInProgress = filteredTasks.filter(t => t.column === 'in-progress-tasks').length;
    const totalCompleted = filteredTasks.filter(t => t.column === 'completed-tasks').length;

    pendingCount.textContent = totalPending;
    inProgressCount.textContent = totalInProgress;
    completedCount.textContent = totalCompleted;

    // Atualizar timeline visual
    updateTimelineVisual(sortedDates, tasksByDate);

    // Atualizar tabela
    updateTable(sortedDates, tasksByDate);
  }

  // Atualizar timeline visual
  function updateTimelineVisual(dates, data) {
    timelinePointsContainer.innerHTML = '';

    if (dates.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-timeline';
      emptyMessage.textContent = 'Nenhum dado disponível para o período selecionado';
      timelinePointsContainer.appendChild(emptyMessage);
      return;
    }

    dates.forEach(date => {
      const point = document.createElement('div');
      point.className = 'timeline-point';
      
      // Formatar data para exibição
      const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
      });
      
      const dateData = data[date];
      
      // Determinar cor do marcador baseado no progresso
      let markerColor = '#4a6baf'; // padrão
      if (dateData.completed / dateData.total > 0.7) {
        markerColor = '#2f9e44'; // verde para maioria concluída
      } else if (dateData.pending / dateData.total > 0.5) {
        markerColor = '#f03e3e'; // vermelho para maioria pendente
      }
      
      point.innerHTML = `
        <div class="point-marker" style="background-color: ${markerColor}">${dateData.total}</div>
        <div class="point-date">${formattedDate}</div>
      `;
      
      // Adicionar tooltip
      point.setAttribute('title', 
        `Pendentes: ${dateData.pending}\nEm andamento: ${dateData.inProgress}\nConcluídas: ${dateData.completed}`);
      
      // Adicionar evento de clique para destacar na tabela
      point.addEventListener('click', () => {
        highlightTableRow(date);
      });
      
      timelinePointsContainer.appendChild(point);
    });
  }

  // Destacar linha na tabela
  function highlightTableRow(date) {
    const rows = timelineDataBody.querySelectorAll('tr');
    rows.forEach(row => {
      row.classList.remove('highlighted-row');
      if (row.dataset.date === date) {
        row.classList.add('highlighted-row');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Atualizar tabela com os dados
  function updateTable(dates, data) {
    timelineDataBody.innerHTML = '';

    if (dates.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 20px;">Nenhuma tarefa encontrada no período selecionado.</td>
      `;
      timelineDataBody.appendChild(emptyRow);
      return;
    }

    dates.forEach(date => {
      const row = document.createElement('tr');
      row.dataset.date = date;
      
      // Formatar data para exibição
      const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${data[date].pending}</td>
        <td>${data[date].inProgress}</td>
        <td>${data[date].completed}</td>
        <td>${data[date].total}</td>
      `;
      
      // Adicionar evento de hover
      row.addEventListener('mouseenter', () => {
        highlightTimelinePoint(date);
      });
      
      row.addEventListener('mouseleave', () => {
        removeTimelineHighlight();
      });
      
      timelineDataBody.appendChild(row);
    });

    // Adicionar linha de totais
    const totals = dates.reduce((acc, date) => {
      acc.pending += data[date].pending;
      acc.inProgress += data[date].inProgress;
      acc.completed += data[date].completed;
      acc.total += data[date].total;
      return acc;
    }, { pending: 0, inProgress: 0, completed: 0, total: 0 });

    const totalsRow = document.createElement('tr');
    totalsRow.classList.add('totals-row');
    totalsRow.innerHTML = `
      <td><strong>Total</strong></td>
      <td><strong>${totals.pending}</strong></td>
      <td><strong>${totals.inProgress}</strong></td>
      <td><strong>${totals.completed}</strong></td>
      <td><strong>${totals.total}</strong></td>
    `;
    timelineDataBody.appendChild(totalsRow);
  }

  // Destacar ponto na timeline
  function highlightTimelinePoint(date) {
    const points = timelinePointsContainer.querySelectorAll('.timeline-point');
    points.forEach(point => {
      const pointDate = point.querySelector('.point-date').textContent;
      const fullDate = new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
      });
      
      if (pointDate === fullDate) {
        point.querySelector('.point-marker').style.transform = 'scale(1.3)';
        point.querySelector('.point-marker').style.boxShadow = '0 0 0 3px rgba(74, 107, 175, 0.3)';
      }
    });
  }

  // Remover destaque da timeline
  function removeTimelineHighlight() {
    const markers = timelinePointsContainer.querySelectorAll('.point-marker');
    markers.forEach(marker => {
      marker.style.transform = '';
      marker.style.boxShadow = '';
    });
  }

  // Inicializar a página
  function init() {
    // Definir datas padrão (últimos 30 dias)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Formatando para o input type="date"
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    startDateInput.value = formatDateForInput(thirtyDaysAgo);
    endDateInput.value = formatDateForInput(today);

    // Carregar tarefas
    loadTasks();
  }

  init();
});