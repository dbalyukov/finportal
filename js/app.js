document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    let currentUser = null; // Store logged in user
    let isPageDirty = false;
    let navigationTarget = null; // { page, data }
    let currentProjectData = null; // To store cost calculation data
    const formatCurrency = (value) => value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });

    window.addEventListener('beforeunload', () => {
        if (app.querySelector('.cost-calculation-page')) {
            captureCostData();
        }
    });

    // --- UTILS ---
    function clearApp() {
        app.innerHTML = '';
    }

    function guardedNavigate(page, data = null) {
        // Специальная обработка для перехода на Проектную калькуляцию - всегда разрешаем
        if (page === 'calculation') {
            if (app.querySelector('.cost-calculation-page')) {
                captureCostData(); // Сохраняем данные, но не показываем модальное окно
            }
            guardedNavigateToCalculation(data);
            return;
        }
        
        // Для остальных страниц - стандартная логика с модальным окном
        if (app.querySelector('.cost-calculation-page') && isPageDirty) {
            captureCostData(); // Capture data before showing modal
            navigationTarget = { page, data };
            showModal('confirm-nav-modal');
        } else {
            if (app.querySelector('.cost-calculation-page')) {
                captureCostData();
            }
            navigate(page, data);
        }
    }

    async function guardedNavigateToCalculation(project = null) {
        // project может быть null, если переход с меню
        let projectId = null;
        if (project && project.project_id) {
            projectId = project.project_id;
        } else if (currentProjectData && currentProjectData.projectId) {
            projectId = currentProjectData.projectId;
        }
        if (projectId) {
            try {
                const fullData = await apiClient.getFullProject(projectId);
                currentProjectData = {
                    ...currentProjectData,
                    projectId: projectId,
                    isCreated: true,
                    isLoadedFromServer: true,
                    team: (fullData.project.project_settings_team || []),
                    stages: fullData.stages || [],
                    costs: fullData.costs || {},
                    contract_type: fullData.project.project_settings_contract_type || '',
                    profitability: fullData.project.project_settings_profitability || '',
                    costs_val: fullData.project.project_settings_costs || '',
                    costs_with_nds: fullData.project.project_settings_costs_with_nds || '',
                    revenue: fullData.project.project_settings_revenue || '',
                    revenue_with_nds: fullData.project.project_settings_revenue_with_nds || ''
                };
            } catch (err) {
                console.error('Ошибка загрузки данных проекта:', err);
                currentProjectData = null;
            }
        } else {
            currentProjectData = null;
        }
        renderProjectCalculation();
    }

    function navigate(page, data = null) {
        sessionStorage.setItem('lastPage', page);

        if (page === 'costs') {
            const newProjectId = data ? data.project_id : null;
            if (currentProjectData && currentProjectData.projectId != newProjectId) {
                currentProjectData = null;
                sessionStorage.removeItem('currentProjectData');
            }
        } else if (page !== 'calculation') {
            currentProjectData = null;
            sessionStorage.removeItem('currentProjectData');
        }

        clearApp();
        switch (page) {
            case 'login':
                renderLogin();
                break;
            case 'projects':
                renderProjects(data);
                break;
            case 'costs':
                renderCostCalculation(data);
                break;
            case 'calculation':
                guardedNavigateToCalculation(data);
                break;
            case 'constants':
                renderConstants();
                break;
        }
    }

    // --- RENDER FUNCTIONS ---

    function renderLogin() {
        isPageDirty = false;
        const loginHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <h1>Финансовый портал</h1>
                    <form id="login-form">
                        <div class="input-group">
                            <label for="login">Логин</label>
                            <input type="text" id="login" name="login" required>
                        </div>
                        <div class="input-group">
                            <label for="password">Пароль</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn">Войти</button>
                        <p id="error-message" class="error-message" style="display: none;"></p>
                    </form>
                </div>
            </div>
        `;
        app.innerHTML = loginHTML;

        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', handleLogin);
    }

    function renderMainLayout(pageContent, pageTitle, pageMenuContent, activeSubPage = null) {
        const isProjectPage = ['list', 'costs', 'calculation'].includes(activeSubPage);
        const projectsSubmenuClass = isProjectPage ? '' : 'collapsed';

        const navbarHTML = `
            <div class="navbar-section">
                <a href="#" data-page="projects" class="navbar-category ${isProjectPage ? 'active' : ''}">Проекты</a>
                <div class="navbar-submenu ${projectsSubmenuClass}">
                    <a href="#" data-page="projects" class="${activeSubPage === 'list' ? 'active' : ''}">Список проектов</a>
                    <a href="#" data-page="costs" class="${activeSubPage === 'costs' ? 'active' : ''}">Расчет затрат</a>
                    <a href="#" data-page="calculation" class="${activeSubPage === 'calculation' ? 'active' : ''}">Проектная калькуляция</a>
                </div>
            </div>
            <div class="navbar-section">
                <a href="#" data-page="constants" class="navbar-category ${activeSubPage === 'constants' ? 'active' : ''}">Константы</a>
            </div>
        `;

        const layoutHTML = `
            <div class="main-layout">
                <nav class="navbar">
                    ${navbarHTML}
                </nav>
                <div class="main-content">
                    <header>
                        <div class="user-menu">
                            <div class="user-data-card" id="user-data-card">
                                <div class="user-info">
                                    <p class="user-name">${currentUser.user_name}</p>
                                    <p class="user-role">${roles[currentUser.user_role]}</p>
                                </div>
                                <div class="user-icon"></div>
                            </div>
                            <div class="context-menu" id="context-menu">
                                <a href="#" id="logout-btn">Выйти</a>
                            </div>
                        </div>
                        <div class="page-menu">
                            ${pageMenuContent}
                        </div>
                    </header>
                    <main class="content-area">
                        ${pageContent}
                    </main>
                </div>
            </div>
            ${renderModals()}
        `;
        app.innerHTML = layoutHTML;

        // Event Listeners for main layout
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        document.getElementById('user-data-card').addEventListener('click', () => {
            document.getElementById('context-menu').classList.toggle('active');
        });

        // Confirmation Modal Handlers
        document.getElementById('confirm-nav-cancel').addEventListener('click', () => {
            closeModal();
            navigationTarget = null;
        });

        document.getElementById('confirm-nav-discard').addEventListener('click', () => {
            isPageDirty = false;
            if (navigationTarget) {
                navigate(navigationTarget.page, navigationTarget.data);
            }
            closeModal();
        });

        document.getElementById('confirm-nav-save').addEventListener('click', async () => {
            try {
                captureCostData();
                let projectId = currentProjectData?.projectId;
                if (!currentProjectData?.isCreated) {
                    const projectPayload = {
                        project_name: document.getElementById('project-name-input')?.value || 'Без названия',
                        project_kam: currentUser?.user_name || '',
                        project_client: '-',
                        project_crm_integration_id: document.getElementById('crm-deal-number-input')?.value || '-',
                        stages: []
                    };
                    const created = await apiClient.createProject(projectPayload);
                    projectId = created.project_id;
                    if (!currentProjectData) currentProjectData = {};
                    currentProjectData.projectId = projectId;
                    currentProjectData.isCreated = true;
                }
                const projectData = {
                    project_settings: {
                        team: Array.from(document.querySelectorAll('#team-display .team-member-tag')).map(t => t.textContent),
                        contract_type: document.getElementById('project_settings_contract_type')?.value || '',
                        profitability: document.getElementById('project_settings_profitability')?.value || '',
                        costs: document.getElementById('project_settings_costs')?.value || '',
                        costs_with_nds: document.getElementById('project_settings_costs_with_nds')?.value || '',
                        revenue: document.getElementById('project_settings_revenue')?.value || '',
                        revenue_with_nds: document.getElementById('project_settings_revenue_with_nds')?.value || ''
                    },
                    project_crm_integration_id: currentProjectData?.project_crm_integration_id || document.getElementById('crm-deal-number-input')?.value || '-',
                    stages: currentProjectData?.stages || [],
                    costs: currentProjectData?.costs || {}
                };
                await apiClient.saveProjectDraft(projectId, projectData);
                isPageDirty = false;
                if (navigationTarget) {
                    navigate(navigationTarget.page, navigationTarget.data);
                }
                closeModal();
            } catch (error) {
                console.error('Failed to save draft:', error);
                alert('Ошибка при сохранении черновика: ' + error.message);
            }
        });

        // Navbar navigation listeners
        document.querySelectorAll('.navbar a[data-page="projects"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                guardedNavigate('projects');
            });
        });
    
        document.querySelectorAll('.navbar a[data-page="costs"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                guardedNavigate('costs', null); // Navigate to a new, empty project
            });
        });
    
        document.querySelectorAll('.navbar a[data-page="calculation"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                guardedNavigate('calculation');
            });
        });

        document.querySelectorAll('.navbar a[data-page="constants"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                guardedNavigate('constants');
            });
        });
    }

    function renderProjects(data) {
        isPageDirty = false;
        const createRoles = ['key_account_manager', 'calc_manager', 'admin'];
        const createButtonHTML = createRoles.includes(currentUser.user_role) 
            ? `<button class="btn" id="create-project-btn">Создать проект</button>`
            : '';

        const pageMenuContent = `
            <h1>Проекты</h1>
            ${createButtonHTML}
        `;

        // Show loading state
        const projectsHTML = `
            <div class="projects-list-container">
                <div class="search-bar">
                    <div class="search-input-container">
                        <input type="text" id="search-input" placeholder="Поиск по названию, КАМ, клиенту или статусу...">
                        <button type="button" id="clear-search-btn" class="clear-search-btn" style="display: none;">✕</button>
                    </div>
                    <div class="search-results-info" id="search-results-info" style="display: none;">
                        <span id="results-count">0</span> из <span id="total-count">0</span> проектов
                    </div>
                </div>
                <div id="projects-loading" style="text-align: center; padding: 2rem;">
                    <p>Загрузка проектов...</p>
                </div>
                <table class="projects-table" id="projects-table" style="display: none;">
                    <thead>
                        <tr>
                            <th>Название проекта</th>
                            <th>КАМ</th>
                            <th>Клиент</th>
                            <th>№ сделки в CRM</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        `;

        renderMainLayout(projectsHTML, 'Проекты', pageMenuContent, 'list');

        // Load projects from API
        loadProjects();

        // Event Listeners
        const createBtn = document.getElementById('create-project-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                guardedNavigate('costs', null); // New project, no data
            });
        }
    }

    async function loadProjects() {
        try {
            const loadingDiv = document.getElementById('projects-loading');
            const table = document.getElementById('projects-table');
            
            // Show loading
            loadingDiv.style.display = 'block';
            table.style.display = 'none';
            
            // Load projects from API
            const projects = await apiClient.getProjects(
                currentUser.user_role === 'key_account_manager' ? 'key_account_manager' : null,
                currentUser.user_role === 'key_account_manager' ? currentUser.user_name : null
            );
            
            // Hide loading
            loadingDiv.style.display = 'none';
            table.style.display = 'table';
            
            // Render projects
            renderProjectsTable(projects);
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            const loadingDiv = document.getElementById('projects-loading');
            loadingDiv.innerHTML = '<p style="color: red;">Ошибка загрузки проектов</p>';
        }
    }

    function renderProjectsTable(projects) {
        const tableBody = document.querySelector('#projects-table tbody');
        tableBody.innerHTML = '';
        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.project_name}</td>
                <td>${project.project_kam}</td>
                <td>${project.project_client}</td>
                <td>${project.project_crm_integration_id}</td>
                <td>${project.project_status}</td>
            `;
            row.addEventListener('click', () => {
                // Передаем объект проекта, чтобы не создавать новый
                guardedNavigate('costs', project);
            });
            tableBody.appendChild(row);
        });
    }

    async function renderCostCalculation(project) {
        isPageDirty = false;
        // Если есть project_id и нет currentProjectData или данные не были загружены, грузим с сервера
        if (project && project.project_id && (!currentProjectData || currentProjectData.projectId !== project.project_id || !currentProjectData.isLoadedFromServer)) {
            try {
                const fullData = await apiClient.getFullProject(project.project_id);
                currentProjectData = {
                    ...currentProjectData, // сохраняем возможные флаги
                    projectId: project.project_id,
                    isCreated: true, // обязательно выставляем!
                    isLoadedFromServer: true,
                    team: (fullData.project.project_settings_team || []),
                    stages: fullData.stages || [],
                    costs: fullData.costs || {},
                    contract_type: fullData.project.project_settings_contract_type || '',
                    profitability: fullData.project.project_settings_profitability || '',
                    costs_val: fullData.project.project_settings_costs || '',
                    costs_with_nds: fullData.project.project_settings_costs_with_nds || '',
                    revenue: fullData.project.project_settings_revenue || '',
                    revenue_with_nds: fullData.project.project_settings_revenue_with_nds || ''
                };
                // Повторно вызываем рендер с уже загруженными данными
                await renderCostCalculation({ ...project });
                return;
            } catch (err) {
                console.error('Ошибка загрузки данных проекта:', err);
            }
        }
        const isNewProject = !project || !project.project_id;
        let projectId = isNewProject ? null : project.project_id;
        
        const editRoles = ['key_account_manager', 'calc_manager', 'admin'];
        const isReadOnly = !editRoles.includes(currentUser.user_role);
        const importCrmButtonHTML = !isReadOnly ? `<button class="btn" id="import-crm-btn">Импортировать из CRM</button>` : '';
        const teamButtonHTML = !isReadOnly ? `<button class="btn" id="team-btn">Команда</button>` : '';
        const addStageButtonHTML = !isReadOnly ? `<button class="btn" id="add-stage-btn">Добавить этап</button>` : '';

        const actionButtonsHTML = !isReadOnly ? `
            <div class="page-menu-actions">
                <button class="btn" id="save-draft-btn">Сохранить черновик</button>
                <button class="btn" id="send-for-approval-btn">Отправить на согласование</button>
            </div>
        ` : '';

        const pageMenuContent = `
            <div class="project-title-container">
                <h1>Проект</h1>
                <input type="text" id="project-name-input" value="${isNewProject ? '' : project.project_name}" placeholder="Введите название проекта" ${isReadOnly ? 'disabled' : ''}>
            </div>
            ${actionButtonsHTML}
        `;
        
        // Используем данные из currentProjectData, если они есть
        const stages = currentProjectData?.stages && currentProjectData.stages.length > 0
            ? currentProjectData.stages
            : (isNewProject ? [] : project_stage.filter(s => s.project_id === project.project_id));

        const teamMembers = currentProjectData?.team || [];
        const contractType = currentProjectData?.contract_type || (project?.project_settings_contract_type || '');
        const profitability = currentProjectData?.profitability || (project?.project_settings_profitability || '');
        const costs = currentProjectData?.costs_val || (project?.project_settings_costs || '');
        const costsWithNds = currentProjectData?.costs_with_nds || (project?.project_settings_costs_with_nds || '');
        const revenue = currentProjectData?.revenue || (project?.project_settings_revenue || '');
        const revenueWithNds = currentProjectData?.revenue_with_nds || (project?.project_settings_revenue_with_nds || '');

        const pageContent = `
            <div class="cost-calculation-page">
                <div class="cards-row">
                    <!-- Main Info Card -->
                    <div class="card" id="main-info-card">
                        <div class="card-header"><h2>Основная информация</h2></div>
                        <div class="main-info-card-content">
                            <div class="form-field">
                                <label>Проектная калькуляция</label>
                                <input type="text" value="${projectId}" disabled>
                            </div>
                            <div class="form-row">
                                <div class="form-field">
                                    <label>Номер сделки</label>
                                    <input type="text" id="crm-deal-number-input" value="${isNewProject ? '-' : project.project_crm_integration_id}" disabled>
                                </div>
                                ${importCrmButtonHTML}
                            </div>
                            <div class="form-row team-row">
                                ${teamButtonHTML}
                                <div id="team-display" class="team-display-container">
                                    ${teamMembers.map(member => `<div class='team-member-tag'>${member}</div>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Indicators Card -->
                    <div class="card" id="project-values-card">
                        <div class="card-header"><h2>Основные показатели проекта</h2></div>
                        <div class="card-content">
                            <div class="form-field">
                                <label>Тип контрактования</label>
                                <select id="project_settings_contract_type">
                                    ${contract_types.map(type => `<option value="${type}" ${type === contractType ? 'selected' : ''}>${type}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Требуемая рентабельность, %</label>
                                <input type="number" id="project_settings_profitability" value="${profitability}">
                            </div>
                            <div class="form-field">
                                <label>Затраты проекта без НДС</label>
                                <input type="text" id="project_settings_costs" value="${costs}" disabled>
                            </div>
                            <div class="form-field">
                                <label>Затраты проекта с НДС</label>
                                <input type="text" id="project_settings_costs_with_nds" value="${costsWithNds}" disabled>
                            </div>
                            <div class="form-field">
                                <label>Расчетная выручка без НДС</label>
                                <input type="text" id="project_settings_revenue" value="${revenue}" disabled>
                            </div>
                            <div class="form-field">
                                <label>Расчетная выручка с НДС</label>
                                <input type="text" id="project_settings_revenue_with_nds" value="${revenueWithNds}" disabled>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stages Card -->
                <div class="card">
                    <div class="card-header">
                        <h2>Этапы</h2>
                        ${addStageButtonHTML}
                    </div>
                    <table class="card-table">
                        <thead>
                            <tr>
                                <th>Название этапа</th>
                                <th>Дата старта</th>
                                <th>Дата завершения</th>
                                <th>Тип периода</th>
                                <th>Кол-во периодов</th>
                                <th>Плановая выручка</th>
                                ${!isReadOnly ? '<th></th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="stages-table-body">
                            ${stages.map(s => renderStageRow(s, `${s.project_id || s.id || ''}-${s.stage_number || s.number || ''}`, isReadOnly)).join('')}
                        </tbody>
                    </table>
                </div>

                <div id="stage-costs-container">
                    ${stages.map(stage => renderStageCosts(stage, project, isReadOnly)).join('')}
                </div>

            </div>
        `;
        
        renderMainLayout(pageContent, 'Проекты', pageMenuContent, 'costs');

        const isRestoring = !!(currentProjectData && (!project || project.project_id == currentProjectData.projectId));

        if (isRestoring) {
            const teamDisplayContainer = document.getElementById('team-display');
            teamDisplayContainer.innerHTML = currentProjectData.team.map(member => {
                const memberTag = document.createElement('div');
                memberTag.className = 'team-member-tag';
                memberTag.textContent = member;
                memberTag.addEventListener('click', (e) => e.currentTarget.remove());
                return memberTag.outerHTML;
            }).join('');
        }

        // Listen for any changes on the page to mark it as "dirty"
        document.querySelector('.cost-calculation-page').addEventListener('input', () => {
            isPageDirty = true;
        });

        // Add event listeners for this page
        const importBtn = document.getElementById('import-crm-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => showModal('crm-modal'));
        }
        
        const teamBtn = document.getElementById('team-btn');
        if (teamBtn) {
            teamBtn.addEventListener('click', () => {
                // Sync modal selection with currently displayed team members
                const teamDisplayContainer = document.getElementById('team-display');
                const currentMembers = Array.from(teamDisplayContainer.querySelectorAll('.team-member-tag')).map(tag => tag.textContent);

                document.querySelectorAll('.team-member-item').forEach(item => {
                    if (currentMembers.includes(item.textContent)) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                });

                showModal('team-modal');
            });
        }

        // Add event listeners for action buttons
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            let isSavingDraft = false;
            saveDraftBtn.addEventListener('click', async () => {
                if (isSavingDraft) return; // Блокируем повторное нажатие
                isSavingDraft = true;
                saveDraftBtn.disabled = true;
                try {
                    captureCostData();
                    let projectId = currentProjectData?.projectId;
                    if (!currentProjectData?.isCreated) {
                        // Создаём проект через API только если он ещё не был создан
                        const projectPayload = {
                            project_name: document.getElementById('project-name-input')?.value || 'Без названия',
                            project_kam: currentUser?.user_name || '',
                            project_client: '-',
                            project_crm_integration_id: document.getElementById('crm-deal-number-input')?.value || '-',
                            stages: []
                        };
                        const created = await apiClient.createProject(projectPayload);
                        projectId = created.project_id;
                        if (!currentProjectData) currentProjectData = {};
                        currentProjectData.projectId = projectId;
                        currentProjectData.isCreated = true;
                    }
                    // Подготавливаем данные для сохранения
                    const projectData = {
                        project_settings: {
                            team: Array.from(document.querySelectorAll('#team-display .team-member-tag')).map(t => t.textContent),
                            contract_type: document.getElementById('project_settings_contract_type')?.value || '',
                            profitability: document.getElementById('project_settings_profitability')?.value || '',
                            costs: document.getElementById('project_settings_costs')?.value || '',
                            costs_with_nds: document.getElementById('project_settings_costs_with_nds')?.value || '',
                            revenue: document.getElementById('project_settings_revenue')?.value || '',
                            revenue_with_nds: document.getElementById('project_settings_revenue_with_nds')?.value || ''
                        },
                        project_crm_integration_id: currentProjectData?.project_crm_integration_id || document.getElementById('crm-deal-number-input')?.value || '-',
                        stages: currentProjectData?.stages || [],
                        costs: currentProjectData?.costs || {}
                    };
                    await apiClient.saveProjectDraft(projectId, projectData);
                    alert('Черновик проекта успешно сохранен!');
                    isPageDirty = false;
                } catch (error) {
                    console.error('Failed to save draft:', error);
                    alert('Ошибка при сохранении черновика: ' + error.message);
                } finally {
                    isSavingDraft = false;
                    saveDraftBtn.disabled = false;
                }
            });
        }

        const sendForApprovalBtn = document.getElementById('send-for-approval-btn');
        if (sendForApprovalBtn) {
            sendForApprovalBtn.addEventListener('click', () => {
                alert('Функция "Отправить на согласование" пока не реализована');
            });
        }

        // --- Modal Logic ---
        // Stop clicks inside modal from closing it (fixes bug)
        document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', e => e.stopPropagation()));

        // Close listeners for TEAM modal (standard behavior)
        document.getElementById('team-modal').addEventListener('click', closeModal);
        document.querySelector('#team-modal .modal-close').addEventListener('click', closeModal);
        
        // Add listeners for team member selection
        document.querySelectorAll('.team-member-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });

        // Add listener for team confirmation
        document.getElementById('team-confirm-btn').addEventListener('click', () => {
            if (isReadOnly) return;
            const selectedMembers = document.querySelectorAll('.team-member-item.selected');
            const teamDisplayContainer = document.getElementById('team-display');
            
            teamDisplayContainer.innerHTML = ''; // Clear previous
            selectedMembers.forEach(member => {
                const memberTag = document.createElement('div');
                memberTag.className = 'team-member-tag';
                memberTag.textContent = member.textContent;
                
                // Add click listener to remove the tag
                memberTag.addEventListener('click', (e) => {
                    e.currentTarget.remove();
                });

                teamDisplayContainer.appendChild(memberTag);
            });

            closeModal();
        });

        // Specific close listener for CRM modal import button
        document.getElementById('crm-import-confirm-btn').addEventListener('click', () => {
            const crmInputValue = document.getElementById('crm-modal-input').value;
            document.getElementById('crm-deal-number-input').value = crmInputValue.trim() || '-';
            closeModal(); // Close all modals
        });

        // --- Stages Logic ---
        const stagesTableBody = document.getElementById('stages-table-body');
        const stageCostsContainer = document.getElementById('stage-costs-container');

        // Add stage
        const addStageBtn = document.getElementById('add-stage-btn');
        if (addStageBtn) {
            addStageBtn.addEventListener('click', () => {
                if (isReadOnly) return;
                const newStageId = `new-stage-${Date.now()}`;
                const newRowHTML = renderStageRow({}, newStageId, isReadOnly);
                stagesTableBody.insertAdjacentHTML('beforeend', newRowHTML);

                const newCostCardsHTML = renderStageCosts({ stage_name: 'Новый этап', stage_number: newStageId }, [], isReadOnly);
                stageCostsContainer.insertAdjacentHTML('beforeend', newCostCardsHTML);
            });
        }

        // Delete stage & Recalculate periods
        stagesTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-stage-btn')) {
                if (isReadOnly) return;
                const row = e.target.closest('tr');
                const stageId = row.dataset.stageId;
                row.remove();
                
                const costBlock = stageCostsContainer.querySelector(`.stage-costs-block[data-stage-id="${stageId}"]`);
                if (costBlock) {
                    costBlock.remove();
                }
                updateAllCalculations();
            }
        });
        
        stagesTableBody.addEventListener('change', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;

            // Update stage name in cost cards
            if (e.target.dataset.field === 'stage-name') {
                const stageId = row.dataset.stageId;
                const costBlock = stageCostsContainer.querySelector(`.stage-costs-block[data-stage-id="${stageId}"]`);
                if (costBlock) {
                    costBlock.querySelector('h3').textContent = `Этап: ${e.target.value}`;
                }
            }

            // Recalculate periods
            if (['stage-start-date', 'stage-end-date', 'stage-period-type'].includes(e.target.dataset.field)) {
                const startDateInput = row.querySelector('[data-field="stage-start-date"]');
                const endDateInput = row.querySelector('[data-field="stage-end-date"]');
                const periodTypeSelect = row.querySelector('[data-field="stage-period-type"]');
                const periodCountInput = row.querySelector('[data-field="stage-period-count"]');

                const startDate = new Date(startDateInput.value);
                const endDate = new Date(endDateInput.value);

                if (startDateInput.value && endDateInput.value && startDate <= endDate) {
                    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
                    months -= startDate.getMonth();
                    months += endDate.getMonth();
                    months += 1;

                    const periodDivisor = periodTypeSelect.value === 'Квартал' ? 3 : 1;
                    periodCountInput.value = Math.ceil(months / periodDivisor);
                } else {
                    periodCountInput.value = 0;
                }
            }
        });

         // --- Costs Logic ---
         stageCostsContainer.addEventListener('click', (e) => {
            // Add a new cost row
            if (e.target.matches('.add-cost-btn')) {
                if (isReadOnly) return;
                const costType = e.target.dataset.costType;
                const tableBody = e.target.closest('.card').querySelector('tbody');
                let newRowHtml = '';

                if (costType === 'external') newRowHtml = renderExternalCostRow({}, isReadOnly);
                else if (costType === 'fot') newRowHtml = renderFotCostRow({}, isReadOnly);
                else if (costType === 'internal') newRowHtml = renderInternalCostRow({}, isReadOnly);

                if (newRowHtml) {
                    tableBody.insertAdjacentHTML('beforeend', newRowHtml);
                }
            }

            // Delete a cost row
            if (e.target.matches('.delete-cost-btn')) {
                if (isReadOnly) return;
                e.target.closest('tr').remove();
                updateAllCalculations();
            }
         });

        // --- Full Page Calculation Logic ---
        const costPageContainer = document.querySelector('.cost-calculation-page');
        costPageContainer.addEventListener('input', (e) => {
            const target = e.target;

            // Handle disabling end-date for one-time costs
            if (target.dataset.field === 'periodicity') {
                const row = target.closest('tr');
                const endDateInput = row.querySelector('[data-field="end-date"]');
                if (endDateInput) {
                    if (target.value === 'Разовое') {
                        endDateInput.value = '';
                        endDateInput.disabled = true;
                    } else {
                        endDateInput.disabled = false;
                    }
                }
            }
            
            updateAllCalculations();
        });

        // Call it once on render to initialize values for existing projects
        if (!isNewProject) {
            updateAllCalculations();
        }
    }

    function renderStageCosts(stage, project, isReadOnly = false) {
        // Используем данные из currentProjectData.costs, если они есть, иначе из хардкода
        let costs = [];
        const stageNumber = stage.stage_number || stage.number || 1;
        
        if (currentProjectData && currentProjectData.costs && currentProjectData.costs[stageNumber]) {
            // Данные из currentProjectData
            const stageCosts = currentProjectData.costs[stageNumber];
            costs = [
                ...(stageCosts.external || []).map(c => ({ ...c, cost_type: 'Внешние закупки' })),
                ...(stageCosts.fot || []).map(c => ({ ...c, cost_type: 'ФОТ' })),
                ...(stageCosts.internal || []).map(c => ({ ...c, cost_type: 'Внутренние продукты' }))
            ];
        } else {
            // Fallback к хардкоду
            costs = project ? project_cost.filter(c => c.stage_number === stageNumber) : [];
        }
        
        const externalCosts = costs.filter(c => c.cost_type === 'Внешние закупки');
        const fotCosts = costs.filter(c => c.cost_type === 'ФОТ');
        const internalCosts = costs.filter(c => c.cost_type === 'Внутренние продукты');
        const stageId = project ? `${project.project_id}-${stageNumber}` : stageNumber;
        const deleteColumnHeader = !isReadOnly ? '<th></th>' : '';
    
        return `
            <div class="stage-costs-block card" data-stage-id="${stageId}">
                <h3>Этап: ${stage.stage_name || stage.name || 'Новый этап'}</h3>
                <div class="costs-grid">
                    <div class="card">
                        <div class="card-header">
                            <h2>Внешние закупки</h2>
                            ${!isReadOnly ? `<button class="btn add-cost-btn" data-cost-type="external">Добавить позицию</button>` : ''}
                        </div>
                        <table class="card-table">
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Дата старта</th>
                                    <th>Дата завершения</th>
                                    <th>Тип</th>
                                    <th>Периодичность</th>
                                    <th>Стоимость</th>
                                    <th>Стоимость для клиента</th>
                                    ${deleteColumnHeader}
                                </tr>
                            </thead>
                            <tbody>
                                ${externalCosts.map(c => renderExternalCostRow(c, isReadOnly)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h2>ФОТ</h2>
                            ${!isReadOnly ? `<button class="btn add-cost-btn" data-cost-type="fot">Добавить позицию</button>` : ''}
                        </div>
                         <table class="card-table">
                             <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Дата старта</th>
                                    <th>Дата завершения</th>
                                    <th>Периодичность</th>
                                    <th>Отдел</th>
                                    <th>Грейд</th>
                                    <th>Ставка</th>
                                    <th>Часы</th>
                                    <th>Стоимость</th>
                                    <th>Стоимость для клиента</th>
                                    ${deleteColumnHeader}
                                </tr>
                             </thead>
                             <tbody>
                                  ${fotCosts.map(c => renderFotCostRow(c, isReadOnly)).join('')}
                             </tbody>
                         </table>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h2>Внутренние продукты</h2>
                            ${!isReadOnly ? `<button class="btn add-cost-btn" data-cost-type="internal">Добавить позицию</button>` : ''}
                        </div>
                         <table class="card-table">
                             <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Дата старта</th>
                                    <th>Дата завершения</th>
                                    <th>Тип услуги</th>
                                    <th>Периодичность</th>
                                    <th>Стоимость</th>
                                    <th>Стоимость для клиента</th>
                                    ${deleteColumnHeader}
                                </tr>
                             </thead>
                             <tbody>
                                 ${internalCosts.map(c => renderInternalCostRow(c, isReadOnly)).join('')}
                             </tbody>
                         </table>
                    </div>
                </div>
            </div>
        `;
    }

    function renderProjectCalculation() {
        if (!currentProjectData || !currentProjectData.stages || !currentProjectData.costs) {
            const emptyStateHTML = `
                <div class="project-calculation-page">
                    <div class="card">
                        <h2>Проектная калькуляция</h2>
                        <p>Нет данных для отображения. Сначала заполните и сохраните "Расчет затрат".</p>
                        <button id="back-to-costs-empty" class="btn">Вернуться к расчету</button>
                    </div>
                </div>
            `;
            renderMainLayout(emptyStateHTML, 'Проектная калькуляция', '<h1>Проектная калькуляция</h1>', 'calculation');
            document.getElementById('back-to-costs-empty').addEventListener('click', (e) => {
                e.preventDefault();
                // Try to find a project to return to, otherwise go to a new one
                const projectToLoad = currentProjectData ? projects.find(p => p.project_id === currentProjectData.projectId) : null;
                navigate('costs', projectToLoad);
            });
            return;
        }

        const { stages, costs } = currentProjectData;
        const allDates = stages.flatMap(s => [new Date(s.startDate), new Date(s.endDate)]);
        const minYear = Math.min(...allDates.map(d => d.getFullYear()));
        const maxYear = Math.max(...allDates.map(d => d.getFullYear()));
        const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

        const approveRoles = ['admin', 'cost_effiency_manager'];
        const actionButtonsHTML = approveRoles.includes(currentUser.user_role) ? `
            <div class="page-menu-actions">
                <button class="btn">Согласовать</button>
                <button class="btn btn-secondary">Отправить на доработку</button>
            </div>
        ` : '';

        const pageMenuContent = `
            <div class="project-title-container">
                <h1>Проектная калькуляция №: ${currentProjectData.projectId}</h1>
            </div>
            ${actionButtonsHTML}
        `;

        const summaryHTML = generateSummaryHTML(currentProjectData, years);
        renderMainLayout(summaryHTML, 'Проектная калькуляция', pageMenuContent, 'calculation');

        const backBtn = document.getElementById('back-to-costs');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectToLoad = table_projects.find(p => p.project_id === currentProjectData.projectId);
                navigate('costs', projectToLoad);
            });
        }
    }

    function generateSummaryHTML(data, years) {
        const { stages, costs } = data;

        // Собираем все затраты в один массив
        const allCosts = Object.values(costs)
          .flatMap(stage => [
            ...(stage.external || []),
            ...(stage.fot || []),
            ...(stage.internal || [])
          ]);

        // Выручка от внутренних продуктов
        const revenue = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
        allCosts.filter(c => c.cost_type === 'internal').forEach(cost => {
            const values = distributePeriodicValue(cost, 'cost_value_for_client');
            years.forEach(y => revenue[y] += parseFloat(values[y]) || 0);
        });
        const revenueItems = { 'Выручка от внутренних продуктов': revenue };

        // Прямые затраты (себестоимость внутренних продуктов)
        const direct = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
        allCosts.filter(c => c.cost_type === 'internal').forEach(cost => {
            const values = distributePeriodicValue(cost, 'cost_value');
            years.forEach(y => direct[y] += parseFloat(values[y]) || 0);
        });
        const directCostItems = { 'Себестоимость внутренних продуктов': direct };

        // ФОТ
        const fot = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
        allCosts.filter(c => c.cost_type === 'fot').forEach(cost => {
            const values = distributePeriodicValue(cost, 'cost_value');
            years.forEach(y => fot[y] += parseFloat(values[y]) || 0);
        });

        // Внешние закупки
        const external = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
        allCosts.filter(c => c.cost_type === 'external').forEach(cost => {
            const values = distributePeriodicValue(cost, 'cost_value');
            years.forEach(y => external[y] += parseFloat(values[y]) || 0);
        });

        // Прочие производственные затраты
        const otherCostItems = {
            'ФОТ': fot,
            'Внешние закупки': external
        };

        // Финансовые показатели (пример: просто копируем прочие производственные затраты)
        const finalTotals = otherCostItems;

        const toRows = (items) => Object.keys(items).map(name => ({ name, values: items[name] }));

        const revenueTable = generateSummaryTable('Выручка', toRows(revenueItems), years, 'card-green');
        const directCostsTable = generateSummaryTable('Прямые затраты', toRows(directCostItems), years, 'card-pink');
        const otherCostsTable = generateSummaryTable('Прочие производственные затраты', toRows(otherCostItems), years, 'card-yellow');
        const finalTotalsTable = generateSummaryTable('Финансовые показатели', toRows(finalTotals), years, 'card-gray');

        const stagesTable = `
            <div class="card">
                <h2>Этапы</h2>
                <table class="card-table">
                    <thead><tr><th>Название этапа</th><th>Дата старта</th><th>Дата завершения</th><th>Тип периода</th><th>Кол-во периодов</th><th>Плановая выручка</th></tr></thead>
                    <tbody>
                        ${stages.map(s => renderStageRow(s, s.id, true)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        return `
            <div class="project-calculation-page">
                ${stagesTable}
                <div class="card">
                    <h2>Итоговые показатели проекта</h2>
                    ${revenueTable}
                    <br/>
                    ${directCostsTable}
                    <br/>
                    ${otherCostsTable}
                    <br/>
                    ${finalTotalsTable}
                </div>
                <button id="back-to-costs" class="btn">Вернуться к расчету</button>
            </div>
        `;
    }

    function generateSummaryTable(title, rows, years, colorClass) {
        return `
            <div class="summary-table-container">
                <h3>${title}</h3>
                <table class="summary-table ${colorClass}">
                     <thead>
                        <tr>
                            <th>Статья затрат</th>
                            ${years.map(y => `<th>${y}</th>`).join('')}
                        </tr>
                     </thead>
                     <tbody>
                        ${rows.map(row => `
                            <tr>
                                <td>${row.name}</td>
                                ${years.map(y => `<td>${formatCurrency(row.values[y] || 0)}</td>`).join('')}
                            </tr>
                        `).join('')}
                     </tbody>
                </table>
            </div>
        `;
    }

    function updateAllCalculations() {
        const profitabilityInput = document.getElementById('project_settings_profitability');
        const profitability = parseFloat(profitabilityInput.value) / 100 || 0;
    
        let totalCosts = 0;
        let totalRevenue = 0;
    
        // --- FOT Calculations ---
        document.querySelectorAll('.fot-cost-row').forEach(row => {
            const department = row.querySelector('[data-field="department"]').value;
            const grade = row.querySelector('[data-field="grade"]').value;
            const hoursInput = row.querySelector('[data-field="hours"]');
            const rateInput = row.querySelector('[data-field="rate"]');
            const costInput = row.querySelector('[data-field="cost"]');
            const costForClientInput = row.querySelector('[data-field="cost-for-client"]');
    
            const gradeInfo = grades_list.find(g => g['Отдел'] === department && g['Грейд'] === grade);
            const rate = gradeInfo ? gradeInfo['Стоимость часа'] : 0;
            rateInput.value = rate;
    
            const hours = parseFloat(hoursInput.value) || 0;
            const cost = hours * rate;
            costInput.value = cost.toFixed(0);
    
            const costForClient = cost * (1 + profitability);
            costForClientInput.value = costForClient.toFixed(2);
        });
    
        // --- External and Internal Purchases ---
        document.querySelectorAll('.external-cost-row, .internal-cost-row').forEach(row => {
            const costInput = row.querySelector('[data-field="cost"]');
            const costForClientInput = row.querySelector('[data-field="cost-for-client"]');
    
            const cost = parseFloat(costInput.value) || 0;
            const costForClient = cost * (1 + profitability);
            costForClientInput.value = costForClient.toFixed(2);
        });
    
        // --- Summing Grand Totals ---
        document.querySelectorAll('[data-field="cost"]').forEach(input => {
            totalCosts += parseFloat(input.value) || 0;
        });
    
        document.querySelectorAll('[data-field="cost-for-client"]').forEach(input => {
            totalRevenue += parseFloat(input.value) || 0;
        });
    
        // --- Per-Stage Revenue Calculation ---
        document.querySelectorAll('#stages-table-body tr').forEach(stageRow => {
            const stageId = stageRow.dataset.stageId;
            const stageRevenueInput = stageRow.querySelector('[data-field="stage-revenue"]');
    
            if (stageId && stageRevenueInput) {
                let stageRevenue = 0;
                const costBlock = document.querySelector(`.stage-costs-block[data-stage-id="${stageId}"]`);
                if (costBlock) {
                    costBlock.querySelectorAll('[data-field="cost-for-client"]').forEach(costInput => {
                        stageRevenue += parseFloat(costInput.value) || 0;
                    });
                }
                stageRevenueInput.value = formatCurrency(stageRevenue);
            }
        });

        // --- Updating Main Indicators Card ---
        document.getElementById('project_settings_costs').value = formatCurrency(totalCosts);
        document.getElementById('project_settings_costs_with_nds').value = formatCurrency(totalCosts * 1.2);
        document.getElementById('project_settings_revenue').value = formatCurrency(totalRevenue);
        document.getElementById('project_settings_revenue_with_nds').value = formatCurrency(totalRevenue * 1.2);
    }

    function captureCostData() {
        const page = document.getElementById('app');
        if (!page.querySelector('.cost-calculation-page')) return;

        const getVal = (el) => el ? el.value : null;
        const getNum = (el) => parseFloat(getVal(el) || 0);

        // Функция для преобразования даты из YYYY-MM-DD в DD.MM.YYYY
        const formatDateForServer = (dateStr) => {
            if (!dateStr) return '';
            if (dateStr.includes('-')) {
                // Формат YYYY-MM-DD -> DD.MM.YYYY
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}.${parts[1]}.${parts[0]}`;
                }
            }
            return dateStr;
        };

        const stages = Array.from(page.querySelectorAll('#stages-table-body tr')).map(row => ({
            id: row.dataset.stageId,
            name: row.querySelector('[data-field="stage-name"]').value,
            startDate: formatDateForServer(row.querySelector('[data-field="stage-start-date"]').value),
            endDate: formatDateForServer(row.querySelector('[data-field="stage-end-date"]').value),
            periodType: row.querySelector('[data-field="stage-period-type"]').value,
            periodCount: row.querySelector('[data-field="stage-period-count"]').value,
            plannedRevenue: getNum(row.querySelector('[data-field="stage-revenue"]')),
        }));

        // Группируем затраты по этапам и типам
        const costsByStage = {};
        page.querySelectorAll('.stage-costs-block').forEach(stageBlock => {
            const stageId = stageBlock.dataset.stageId;
            const stageNumber = stageId.split('-').pop(); // Получаем номер этапа
            
            if (!costsByStage[stageNumber]) {
                costsByStage[stageNumber] = {
                    external: [],
                    fot: [],
                    internal: []
                };
            }

            // Внешние закупки
            stageBlock.querySelectorAll('.external-cost-row').forEach(row => {
                costsByStage[stageNumber].external.push({
                    name: row.querySelector('input:first-child').value,
                    startDate: formatDateForServer(row.querySelector('[data-field="start-date"]').value),
                    endDate: formatDateForServer(row.querySelector('[data-field="end-date"]').value),
                    periodicity: row.querySelector('[data-field="periodicity"]').value,
                    cost: parseFloat(row.querySelector('[data-field="cost"]').value || 0),
                    costForClient: parseFloat(row.querySelector('[data-field="cost-for-client"]').value || 0),
                });
            });

            // ФОТ
            stageBlock.querySelectorAll('.fot-cost-row').forEach(row => {
                costsByStage[stageNumber].fot.push({
                    name: row.querySelector('input:first-child').value,
                    startDate: formatDateForServer(row.querySelector('[data-field="start-date"]').value),
                    endDate: formatDateForServer(row.querySelector('[data-field="end-date"]').value),
                    periodicity: row.querySelector('[data-field="periodicity"]').value,
                    department: row.querySelector('[data-field="department"]').value,
                    grade: row.querySelector('[data-field="grade"]').value,
                    hours: getNum(row.querySelector('[data-field="hours"]')),
                    cost: parseFloat(row.querySelector('[data-field="cost"]').value || 0),
                    costForClient: parseFloat(row.querySelector('[data-field="cost-for-client"]').value || 0),
                });
            });

            // Внутренние продукты
            stageBlock.querySelectorAll('.internal-cost-row').forEach(row => {
                costsByStage[stageNumber].internal.push({
                    name: row.querySelector('input:first-child').value,
                    startDate: formatDateForServer(row.querySelector('[data-field="start-date"]').value),
                    endDate: formatDateForServer(row.querySelector('[data-field="end-date"]').value),
                    periodicity: row.querySelector('[data-field="periodicity"]').value,
                    serviceType: row.querySelector('[data-field="service-type"]').value,
                    cost: parseFloat(row.querySelector('[data-field="cost"]').value || 0),
                    costForClient: parseFloat(row.querySelector('[data-field="cost-for-client"]').value || 0),
                });
            });
        });
   
        currentProjectData = {
            ...currentProjectData, // сохраняем возможные флаги
            projectId: currentProjectData?.projectId,
            isCreated: currentProjectData?.isCreated,
            projectName: page.querySelector('#project-name-input').value,
            project_crm_integration_id: getVal(page.querySelector('#crm-deal-number-input')),
            stages,
            costs: costsByStage,
            mainIndicators: {
                profitability: getNum('#project_settings_profitability'),
            },
            team: Array.from(page.querySelectorAll('#team-display .team-member-tag')).map(t => t.textContent),
        };

        if (currentProjectData) {
            sessionStorage.setItem('currentProjectData', JSON.stringify(currentProjectData));
        }
    }

    function renderModals() {
        return `
            <div class="modal-backdrop" id="crm-modal" style="display:none;">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Импорт из CRM</h2>
                        <button class="modal-close" style="display: none;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <input id="crm-modal-input" type="text" placeholder="Введите номер сделки" style="width:100%; padding: 0.5rem">
                    </div>
                    <div class="modal-footer" style="margin-top: 1rem; text-align:right;">
                        <button class="btn" id="crm-import-confirm-btn">Импортировать</button>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop" id="team-modal" style="display:none;">
                <div class="modal">
                     <div class="modal-header">
                        <h2>Команда проекта</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body team-modal-body">
                       ${team_members.map(m => `<div class="team-member-item" data-member="${m}">${m}</div>`).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" id="team-confirm-btn">Готово</button>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop" id="confirm-nav-modal" style="display:none;">
                <div class="modal">
                    <div class="modal-body" style="text-align: center; padding: 1rem 0;">
                        <h3>Вы уходите со страницы, хотите сохранить изменения?</h3>
                    </div>
                    <div class="modal-footer" style="justify-content: center; gap: 1rem;">
                        <button class="btn" id="confirm-nav-save">Сохранить и выйти</button>
                        <button class="btn btn-secondary" id="confirm-nav-discard">Выйти без сохранения</button>
                        <button class="btn btn-danger" id="confirm-nav-cancel">Остаться</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderStageRow(stage = {}, stageId, isReadOnly = false) {
        const stageName = stage.name || stage.stage_name || '';
        
        // Преобразуем даты из различных форматов в YYYY-MM-DD для input type="date"
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            if (dateStr.includes('.')) {
                // Формат DD.MM.YYYY -> YYYY-MM-DD
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            return dateStr;
        };
        
        const startDate = formatDateForInput(stage.startDate || stage.stage_start_date || '');
        const endDate = formatDateForInput(stage.endDate || stage.stage_end_date || '');
        const periodType = stage.periodType || stage.stage_period_type || 'Месяц';
        const disabled = isReadOnly ? 'disabled' : '';
        const periodTypes = ['Месяц', 'Квартал'];

        let periodCount = stage.periodCount || stage.stage_period_count || 0;
        if (startDate && endDate) {
            const d1 = new Date(startDate);
            const d2 = new Date(endDate);
            if (d1 <= d2) {
                let months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth();
                months += d2.getMonth();
                months += 1;
                const divisor = periodType === 'Квартал' ? 3 : 1;
                periodCount = Math.ceil(months / divisor);
            }
        }

        // Новый расчет плановой выручки для этапа
        let plannedRevenue = 0;
        if (window.currentProjectData && window.currentProjectData.costs) {
            const allCosts = Object.values(window.currentProjectData.costs)
                .flatMap(stageCosts => [
                    ...(stageCosts.external || []),
                    ...(stageCosts.fot || []),
                    ...(stageCosts.internal || [])
                ]);
            plannedRevenue = allCosts
                .filter(cost =>
                    String(cost.stage_number) === String(stage.stage_number) ||
                    String(cost.stage_number) === String(stage.id) ||
                    String(cost.stage_number) === String(stage.number)
                )
                .reduce((sum, cost) => sum + parseFloat(cost.cost_value_for_client || 0), 0);
        } else {
            plannedRevenue = stage.plannedRevenue || stage.stage_planned_revenue || 0;
        }
    
        return `
            <tr data-stage-id="${stageId}">
                <td><input type="text" data-field="stage-name" class="form-field" value="${stageName}" placeholder="Название этапа" ${disabled}></td>
                <td><input type="date" class="form-field" data-field="stage-start-date" value="${startDate}" ${disabled}></td> 
                <td><input type="date" class="form-field" data-field="stage-end-date" value="${endDate}" ${disabled}></td>
                <td><select class="form-field" data-field="stage-period-type" ${disabled}>${periodTypes.map(p => `<option ${p === periodType ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" data-field="stage-period-count" value="${periodCount}" disabled></td>
                <td><input type="text" class="form-field" data-field="stage-revenue" value="${formatCurrency(plannedRevenue)}" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-stage-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }

    function renderExternalCostRow(cost = {}, isReadOnly = false) {
        const isOneTime = (cost.periodicity || cost.cost_period || 'Разовое') === 'Разовое';
        
        // Преобразуем даты из различных форматов в YYYY-MM-DD для input type="date"
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            
            // Если дата уже в формате YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }
            
            // Если дата в формате ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
            if (dateStr.includes('T')) {
                return dateStr.split('T')[0];
            }
            
            // Если дата в формате DD.MM.YYYY
            if (dateStr.includes('.')) {
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            return dateStr;
        };
        
        return `
            <tr class="external-cost-row">
                <td><input type="text" class="form-field" value="${cost.name || cost.cost_name || ''}" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="${formatDateForInput(cost.startDate || cost.cost_date_start || '')}" data-field="start-date" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="${formatDateForInput(cost.endDate || cost.cost_date_end || '')}" data-field="end-date" ${isOneTime ? 'disabled' : ''} ${isReadOnly ? 'disabled' : ''}></td>
                <td><select class="form-field" data-field="type" ${isReadOnly ? 'disabled' : ''}>${external_cost_types.map(o => `<option ${cost.cost_type === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="periodicity" ${isReadOnly ? 'disabled' : ''}>${cost_periods.map(o => `<option ${(cost.periodicity || cost.cost_period) === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" value="${cost.cost || cost.cost_value || 0}" data-field="cost" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="number" class="form-field" value="${cost.costForClient || cost.cost_value_for_client || 0}" data-field="cost-for-client" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-cost-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }
    
    function renderFotCostRow(cost = {}, isReadOnly = false) {
        const isOneTime = (cost.periodicity || cost.cost_period || 'Разовое') === 'Разовое';
        
        // Преобразуем даты из различных форматов в YYYY-MM-DD для input type="date"
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            
            // Если дата уже в формате YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }
            
            // Если дата в формате ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
            if (dateStr.includes('T')) {
                return dateStr.split('T')[0];
            }
            
            // Если дата в формате DD.MM.YYYY
            if (dateStr.includes('.')) {
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            return dateStr;
        };
        
        return `
            <tr class="fot-cost-row">
                <td><input type="text" class="form-field" value="${cost.name || cost.cost_name || ''}" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="${formatDateForInput(cost.startDate || cost.cost_date_start || '')}" data-field="start-date" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="${formatDateForInput(cost.endDate || cost.cost_date_end || '')}" data-field="end-date" ${isOneTime ? 'disabled' : ''} ${isReadOnly ? 'disabled' : ''}></td>
                <td><select class="form-field" data-field="periodicity" ${isReadOnly ? 'disabled' : ''}>${cost_periods.map(o => `<option ${(cost.periodicity || cost.cost_period) === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="department" ${isReadOnly ? 'disabled' : ''}>${fot_departments.map(o => `<option ${(cost.department || cost.cost_departamenet) === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="grade" ${isReadOnly ? 'disabled' : ''}>${fot_grades.map(o => `<option ${(cost.grade || cost.cost_specialist_grade) === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" value="${cost.cost_specialist_hour_cost || 0}" data-field="rate" disabled></td>
                <td><input type="number" class="form-field" value="${cost.hours || cost.cost_specialist_hour_count || 0}" data-field="hours" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="number" class="form-field" value="${cost.cost || cost.cost_value || 0}" data-field="cost" disabled></td>
                <td><input type="number" class="form-field" value="${cost.costForClient || cost.cost_value_for_client || 0}" data-field="cost-for-client" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-cost-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }
    
    function renderInternalCostRow(cost = {}, isReadOnly = false) {
        const isOneTime = (cost.periodicity || cost.cost_period || 'Разовое') === 'Разовое';
        
        // Преобразуем даты из различных форматов в YYYY-MM-DD для input type="date"
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            
            // Если дата уже в формате YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }
            
            // Если дата в формате ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
            if (dateStr.includes('T')) {
                return dateStr.split('T')[0];
            }
            
            // Если дата в формате DD.MM.YYYY
            if (dateStr.includes('.')) {
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            return dateStr;
        };
        
        return `
            <tr class="internal-cost-row">
                <td><input type="text" class="form-field" value="${cost.name || cost.cost_name || ''}" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="${formatDateForInput(cost.startDate || cost.cost_date_start || '')}" data-field="start-date" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="${formatDateForInput(cost.endDate || cost.cost_date_end || '')}" data-field="end-date" ${isOneTime ? 'disabled' : ''} ${isReadOnly ? 'disabled' : ''}></td>
                <td><select class="form-field" data-field="service-type" ${isReadOnly ? 'disabled' : ''}>${internal_service_types.map(o => `<option ${(cost.serviceType || cost.cost_service_type) === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="periodicity" ${isReadOnly ? 'disabled' : ''}>${cost_periods.map(o => `<option ${(cost.periodicity || cost.cost_period) === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" value="${cost.cost || cost.cost_value || 0}" data-field="cost" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="number" class="form-field" value="${cost.costForClient || cost.cost_value_for_client || 0}" data-field="cost-for-client" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-cost-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }

    function renderConstants() {
        isPageDirty = false;

        const pageMenuContent = `<h1>Константы</h1>`;

        const getConstant = (id) => table_constants.find(c => c.id === id);
        const renderConstant = (c, showLabel = true) => `
           <div class="constant-item" data-constant-name="${c.constant_name}">
               ${showLabel ? `<label>${c.constant_name}:</label>` : ''}
               <div class="constant-value">
                   <input type="text" value="${c.constant_count}" disabled>
                   <span>${c.constant_metric}</span>
               </div>
           </div>
       `;

        const pageContent = `
            <div class="constants-page">
                <div class="search-bar">
                    <input type="text" id="constants-search-input" placeholder="Поиск...">
                </div>
                <div class="constants-grid">
                    
                    <div class="card constants-card" data-card-title="Экономические показатели">
                        <div class="card-header"><h2>Экономические показатели</h2></div>
                        <div class="card-content-grid">
                            ${renderConstant(getConstant(1))}
                            ${renderConstant(getConstant(2))}
                            ${renderConstant(getConstant(3))}
                        </div>
                    </div>

                    <div class="card constants-card" data-card-title="Минимальные показатели экономической эффективности">
                        <div class="card-header"><h2>Минимальные показатели экономической эффективности</h2></div>
                        <div class="card-content-grid">
                           ${renderConstant(getConstant(10))}
                           ${renderConstant(getConstant(11))}
                        </div>
                    </div>

                    <div class="card constants-card" data-card-title="Показатели для ВГО">
                        <div class="card-header"><h2>Показатели для ВГО</h2></div>
                        <div class="card-content-grid vgo-grid">
                            <div class="constants-group">
                                <h4>Меморандум "Публичное облако"</h4>
                                ${renderConstant(getConstant(4), false)}
                                ${renderConstant(getConstant(5), false)}
                            </div>
                            <div class="constants-group">
                                <h4>Меморандум "Colocation"</h4>
                                ${renderConstant(getConstant(6), false)}
                                ${renderConstant(getConstant(7), false)}
                            </div>
                            <div class="constants-group full-width">
                                ${renderConstant(getConstant(8))}
                            </div>
                             <div class="constants-group full-width">
                                ${renderConstant(getConstant(9))}
                            </div>
                        </div>
                    </div>

                    <div class="card constants-card" data-card-title="Показатели для расчетов">
                        <div class="card-header"><h2>Показатели для расчетов</h2></div>
                        <div class="card-content-grid">
                           <div class="constants-group">
                                <h4>Стоимость за 1 кВт:</h4>
                                ${renderConstant(getConstant(12))}
                                ${renderConstant(getConstant(13))}
                            </div>
                            <div class="constants-group">
                                 <h4>&nbsp;</h4>
                                ${renderConstant(getConstant(14))}
                                ${renderConstant(getConstant(15))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        renderMainLayout(pageContent, 'Константы', pageMenuContent, 'constants');

        const searchInput = document.getElementById('constants-search-input');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            document.querySelectorAll('.constants-card').forEach(card => {
               let cardVisible = false;
               card.querySelectorAll('.constant-item').forEach(item => {
                   const name = item.dataset.constantName.toLowerCase();
                   const isMatch = name.includes(searchTerm);
                   item.style.display = isMatch ? '' : 'none';
                   if (isMatch) cardVisible = true;
               });
               // Hide the whole card if no items match
               card.style.display = cardVisible || searchTerm === '' ? '' : 'none';
            });
        });
    }

    // --- EVENT HANDLERS ---

    function handleLogin(event) {
        event.preventDefault();
        
        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        // Clear previous error
        errorMessage.style.display = 'none';
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Вход...';
        submitBtn.disabled = true;
        
        // Try to login with API
        apiClient.login(login, password)
            .then(response => {
                if (response.success && response.user) {
                    currentUser = response.user;
                    
                    // Save user data to session
                    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                    sessionStorage.setItem('authToken', response.token);
                    
                    // Navigate to projects page after successful login
                    navigate('projects');
                } else {
                    throw new Error('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                errorMessage.textContent = error.message || 'Ошибка входа. Проверьте логин и пароль.';
                errorMessage.style.display = 'block';
                
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
    }

    function handleLogout(event) {
        event.preventDefault();
        
        // Clear API token
        apiClient.clearToken();
        
        // Clear session data
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('lastPage');
        sessionStorage.removeItem('currentProjectData');
        
        // Reset current user
        currentUser = null;
        currentProjectData = null;
        
        // Navigate to login
        navigate('login');
    }

    function showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    function closeModal() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
    }

    // --- INIT ---
    function init() {
        // Check if user is already logged in
        const savedUser = sessionStorage.getItem('currentUser');
        const savedToken = sessionStorage.getItem('authToken');
        
        if (savedUser && savedToken) {
            try {
                currentUser = JSON.parse(savedUser);
                apiClient.setToken(savedToken);
                
                // Verify token with server
                apiClient.verifyToken()
                    .then(response => {
                        if (response.success) {
                            // Token is valid, navigate to last page
                            const lastPage = sessionStorage.getItem('lastPage') || 'projects';
                            navigate(lastPage);
                        } else {
                            // Token is invalid, clear session
                            handleLogout({ preventDefault: () => {} });
                        }
                    })
                    .catch(error => {
                        console.error('Token verification failed:', error);
                        // Token verification failed, clear session
                        handleLogout({ preventDefault: () => {} });
                    });
            } catch (error) {
                console.error('Failed to parse saved user:', error);
                handleLogout({ preventDefault: () => {} });
            }
        } else {
            // No saved session, show login
            navigate('login');
        }
    }

    init();
}); 