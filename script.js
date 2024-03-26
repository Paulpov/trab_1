document.addEventListener('DOMContentLoaded', () => {
    const projectForm = document.getElementById('project-form');
    const projectNameInput = document.getElementById('project-name');
    const projectsList = document.getElementById('projects-list');
    const taskForm = document.getElementById('task-form');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskProjectSelect = document.getElementById('task-project');
    const tasksList = document.getElementById('tasks-list');

    let projects = [];
    let tasks = [];

    projectForm.addEventListener('submit', e => {
        e.preventDefault();
        const projectName = projectNameInput.value.trim();
        if (projectName) {
            const project = { id: projects.length + 1, name: projectName, tasks: [] };
            projects.push(project);
            projectNameInput.value = '';
            updateProjectsList();
            updateTaskProjectSelect();
            updateChart();
        }
    });

    taskForm.addEventListener('submit', e => {
        e.preventDefault();
        const taskDescription = taskDescriptionInput.value.trim();
        const projectId = taskProjectSelect.value;
        if (taskDescription && projectId) {
            const task = { id: tasks.length + 1, description: taskDescription, projectId: parseInt(projectId), status: 'Pendente' };
            tasks.push(task);
            taskDescriptionInput.value = '';
            updateTasksList();
            updateChart();
        }
    });

    function updateProjectsList() {
        projectsList.innerHTML = projects.map(project => {
            return `<li class="list-group-item d-flex justify-content-between align-items-center">
                        ${project.name}
                        <span>
                            <button onclick="deleteProject(${project.id})" class="btn btn-danger btn-sm">Excluir</button>
                        </span>
                    </li>`;
        }).join('');
        updateTaskProjectSelect();
    }

    window.deleteProject = function (projectId) {
        projects = projects.filter(project => project.id !== projectId);
        tasks = tasks.filter(task => task.projectId !== projectId); // Exclui tarefas vinculadas
        updateProjectsList();
        updateTasksList();
        updateChart();
        checkAndUpdateCompletedProjects();
    };



    function updateTaskProjectSelect() {
        taskProjectSelect.innerHTML = projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
    }

    //test
    function updateTasksList() {
        tasksList.innerHTML = ''; // Limpa a lista existente

        projects.forEach(project => {
            // Cria um elemento de lista para o projeto
            const projectLi = document.createElement('li');
            projectLi.className = 'list-group-item';
            projectLi.innerHTML = `<strong>Projeto: ${project.name}</strong>`;
            tasksList.appendChild(projectLi);

            // Filtra as tarefas que pertencem a este projeto
            tasks.filter(task => task.projectId === project.id).forEach(task => {
                const taskLi = document.createElement('li');
                taskLi.className = 'list-group-item d-flex justify-content-between align-items-center';
                taskLi.innerHTML = `
                    ${task.description}
                    <select class="custom-select custom-select-sm" onchange="updateTaskStatus(${task.id}, this)">
                        <option value="Pendente" ${task.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Realizando" ${task.status === 'Realizando' ? 'selected' : ''}>Realizando</option>
                        <option value="Concluido" ${task.status === 'Concluido' ? 'selected' : ''}>Concluído</option>
                        <option value="Cancelado" ${task.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                `;
                tasksList.appendChild(taskLi);
            });
        });
    }


    function updateChart() {
        if (window.myChart) {
            window.myChart.destroy(); // Destruir o gráfico existente para evitar sobreposições
        }

        const ctx = document.getElementById('statusChart').getContext('2d');
        const statuses = ['Pendente', 'Realizando', 'Concluido', 'Cancelado'];
        const dataSets = statuses.map(status => ({
            label: status,
            data: [],
            backgroundColor: generateBackgroundColor(status),
            borderColor: generateBorderColor(status),
            borderWidth: 1
        }));

        projects.forEach(project => {
            statuses.forEach((status, index) => {
                const count = tasks.filter(task => task.projectId === project.id && task.status === status).length;
                dataSets[index].data.push(count);
            });
        });

        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: projects.map(p => p.name),
                datasets: dataSets
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Status das Tarefas por Projeto'
                    }
                }
            }
        });
    }

    function generateBackgroundColor(status) {
        switch (status) {
            case 'Pendente': return 'rgba(255, 206, 86, 0.2)';
            case 'Realizando': return 'rgba(54, 162, 235, 0.2)';
            case 'Concluido': return 'rgba(75, 192, 192, 0.2)';
            case 'Cancelado': return 'rgba(255, 99, 132, 0.2)';
            default: return 'rgba(201, 203, 207, 0.2)';
        }
    }

    function generateBorderColor(status) {
        switch (status) {
            case 'Pendente': return 'rgba(255, 206, 86, 1)';
            case 'Realizando': return 'rgba(54, 162, 235, 1)';
            case 'Concluido': return 'rgba(75, 192, 192, 1)';
            case 'Cancelado': return 'rgba(255, 99, 132, 1)';
            default: return 'rgba(201, 203, 207, 1)';
        }
    }


    // Função para verificar e atualizar projetos concluídos
    function checkAndUpdateCompletedProjects() {
        const completedProjectsList = document.getElementById('completed-projects-list');
        const cancelledProjectsList = document.getElementById('cancelled-projects-list');
        completedProjectsList.innerHTML = ''; // Limpa a lista para reavaliação

        projects.forEach(project => {
            // Verifica se todas as tarefas deste projeto estão concluídas
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            const allTasksCompleted = projectTasks.length > 0 && projectTasks.every(task => task.status === 'Concluido');
            const allTasksCancelled = projectTasks.length > 0 && projectTasks.every(task => task.status === 'Cancelado');   
            if (allTasksCompleted) {
                // Adiciona o projeto à lista de projetos concluídos
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = project.name;
                completedProjectsList.appendChild(li);

                // Remove tarefas concluídas da lista principal (se desejado)
                tasks = tasks.filter(task => task.projectId !== project.id);
            }


            if (allTasksCancelled) {
                // Adiciona o projeto à lista de projetos cancelados
                const li = document.createElement('li');
                li.className = 'list-cancel-item';
                li.textContent = project.name;
                cancelledProjectsList.appendChild(li);

                // Remove tarefas concluídas da lista principal (se desejado)
                tasks = tasks.filter(task => task.projectId !== project.id);
            }
        });

        updateTasksList(); // Atualiza a lista de tarefas após a remoção
    }


    // Carrega o tema escolhido pelo usuário anteriormente
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(`${savedTheme}-mode`);
        updateDarkModeButtonText();
    }


    const toggleDarkModeButton = document.getElementById('toggle-dark-mode');
    toggleDarkModeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        const mode = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', mode); // Salva a preferência do usuário
        updateDarkModeButtonText();
    });

    function updateDarkModeButtonText() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        toggleDarkModeButton.textContent = isDarkMode ? 'Modo Claro' : 'Modo Escuro';
    }

    loadThemePreference();

    window.updateTaskStatus = function (taskId, selectElement) {
        const newStatus = selectElement.value;
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            updateChart();
            checkAndUpdateCompletedProjects();
        }
    };

});
