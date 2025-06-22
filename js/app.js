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
                renderProjectCalculation();
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

        document.getElementById('confirm-nav-save').addEventListener('click', () => {
            // NOTE: Save logic is not implemented yet. For now, it behaves like discard.
            isPageDirty = false;
            if (navigationTarget) {
                navigate(navigationTarget.page, navigationTarget.data);
            }
            closeModal();
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

        let projectsToRender = [...table_projects];
        if (currentUser.user_role === 'key_account_manager') {
            projectsToRender = table_projects.filter(p => p.project_kam === currentUser.user_name);
        }

        // Helper function to highlight search terms
        function highlightText(text, searchTerm) {
            if (!searchTerm) return text;
            const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        }

        let projectsHTML = `
            <div class="projects-list-container">
                <div class="search-bar">
                    <div class="search-input-container">
                        <input type="text" id="search-input" placeholder="Поиск по названию, КАМ, клиенту или статусу...">
                        <button type="button" id="clear-search-btn" class="clear-search-btn" style="display: none;">✕</button>
                    </div>
                    <div class="search-results-info" id="search-results-info" style="display: none;">
                        <span id="results-count">0</span> из <span id="total-count">${projectsToRender.length}</span> проектов
                    </div>
                </div>
                <table class="projects-table" id="projects-table">
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
                        ${projectsToRender.map(p => `
                            <tr data-project-id="${p.project_id}">
                                <td>${p.project_name}</td>
                                <td>${p.project_kam}</td>
                                <td>${p.project_client}</td>
                                <td>${p.project_crm_integration_id}</td>
                                <td>${p.project_status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        renderMainLayout(projectsHTML, 'Проекты', pageMenuContent, 'list');

        // Event Listeners
        const createBtn = document.getElementById('create-project-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                guardedNavigate('costs', null); // New project, no data
            });
        }

        function updateProjectTable(filteredProjects, searchTerm = '') {
            const tableBody = document.getElementById('projects-table').querySelector('tbody');
            const resultsInfo = document.getElementById('search-results-info');
            const resultsCount = document.getElementById('results-count');
            const totalCount = document.getElementById('total-count');
            const clearBtn = document.getElementById('clear-search-btn');

            // Update results info
            resultsCount.textContent = filteredProjects.length;
            totalCount.textContent = projectsToRender.length;
            
            if (searchTerm) {
                resultsInfo.style.display = 'block';
                clearBtn.style.display = 'block';
            } else {
                resultsInfo.style.display = 'none';
                clearBtn.style.display = 'none';
            }

            // Update table with highlighted text
            tableBody.innerHTML = filteredProjects.map(p => `
                <tr data-project-id="${p.project_id}">
                    <td>${highlightText(p.project_name, searchTerm)}</td>
                    <td>${highlightText(p.project_kam, searchTerm)}</td>
                    <td>${highlightText(p.project_client, searchTerm)}</td>
                    <td>${p.project_crm_integration_id}</td>
                    <td>${highlightText(p.project_status, searchTerm)}</td>
                </tr>
            `).join('');

            // Re-attach click handlers
            tableBody.querySelectorAll('tr').forEach(row => {
                row.addEventListener('click', (e) => {
                    const projectId = e.currentTarget.dataset.projectId;
                    const project = table_projects.find(p => p.project_id == projectId);
                    guardedNavigate('costs', project);
                });
            });
        }

        // Initial table setup
        updateProjectTable(projectsToRender);
        
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search-btn');

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                updateProjectTable(projectsToRender);
                return;
            }

            const filteredProjects = projectsToRender.filter(p => 
                p.project_name.toLowerCase().includes(searchTerm) ||
                p.project_kam.toLowerCase().includes(searchTerm) ||
                p.project_client.toLowerCase().includes(searchTerm) ||
                p.project_status.toLowerCase().includes(searchTerm)
            );
            
            updateProjectTable(filteredProjects, searchTerm);
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            updateProjectTable(projectsToRender);
            searchInput.focus();
        });

        // Keyboard shortcuts
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                updateProjectTable(projectsToRender);
            }
        });
    }

    function renderCostCalculation(project) {
        isPageDirty = false;
        const isNewProject = project === null;
        const projectId = isNewProject ? Math.floor(10000000 + Math.random() * 90000000) : project.project_id;
        
        const editRoles = ['key_account_manager', 'calc_manager', 'admin'];
        const isReadOnly = !editRoles.includes(currentUser.user_role);
        const importCrmButtonHTML = !isReadOnly ? `<button class="btn" id="import-crm-btn">Импортировать из CRM</button>` : '';
        const teamButtonHTML = !isReadOnly ? `<button class="btn" id="team-btn">Команда</button>` : '';
        const addStageButtonHTML = !isReadOnly ? `<button class="btn" id="add-stage-btn">Добавить этап</button>` : '';

        const actionButtonsHTML = !isReadOnly ? `
            <div class="page-menu-actions">
                <button class="btn">Сохранить черновик</button>
                <button class="btn">Отправить на согласование</button>
            </div>
        ` : '';

        const pageMenuContent = `
            <div class="project-title-container">
                <h1>Проект</h1>
                <input type="text" id="project-name-input" value="${isNewProject ? '' : project.project_name}" placeholder="Введите название проекта" ${isReadOnly ? 'disabled' : ''}>
            </div>
            ${actionButtonsHTML}
        `;
        
        const stages = isNewProject ? [] : project_stage.filter(s => s.project_id === project.project_id);

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
                                    <!-- Selected team members will appear here -->
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
                                    ${contract_types.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Требуемая рентабельность, %</label>
                                <input type="number" id="project_settings_profitability" value="0">
                            </div>
                            <div class="form-field">
                                <label>Затраты проекта без НДС</label>
                                <input type="text" id="project_settings_costs" value="0.00 руб." disabled>
                            </div>
                            <div class="form-field">
                                <label>Затраты проекта с НДС</label>
                                <input type="text" id="project_settings_costs_with_nds" value="0.00 руб." disabled>
                            </div>
                            <div class="form-field">
                                <label>Расчетная выручка без НДС</label>
                                <input type="text" id="project_settings_revenue" value="0.00 руб." disabled>
                            </div>
                            <div class="form-field">
                                <label>Расчетная выручка с НДС</label>
                                <input type="text" id="project_settings_revenue_with_nds" value="0.00 руб." disabled>
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
                            ${stages.map(s => renderStageRow(s, `${s.project_id}-${s.stage_number}`, isReadOnly)).join('')}
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
        const costs = project ? project_cost.filter(c => c.stage_number === stage.stage_number) : [];
        const externalCosts = costs.filter(c => c.cost_type === 'Внешние закупки');
        const fotCosts = costs.filter(c => c.cost_type === 'ФОТ');
        const internalCosts = costs.filter(c => c.cost_type === 'Внутренние продукты');
        const stageId = project ? `${project.project_id}-${stage.stage_number}` : stage.stage_number;
        const deleteColumnHeader = !isReadOnly ? '<th></th>' : '';
    
        return `
            <div class="stage-costs-block card" data-stage-id="${stageId}">
                <h3>Этап: ${stage.stage_name || 'Новый этап'}</h3>
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

        const distributePeriodicValue = (item, valueField) => {
            const valuesByYear = years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {});
            if (!item.startDate) return valuesByYear;
    
            const startDate = new Date(item.startDate);
            const endDate = item.endDate && item.endDate >= item.startDate ? new Date(item.endDate) : startDate;
            const value = item[valueField] || 0;
            const periodicity = item.periodicity || 'Разовое';
    
            if (periodicity === 'Разовое') {
                const year = startDate.getFullYear();
                if (valuesByYear[year] !== undefined) valuesByYear[year] += value;
                return valuesByYear;
            }
    
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const year = currentDate.getFullYear();
                if (valuesByYear[year] !== undefined) {
                     if (periodicity === 'Ежегодно') {
                        valuesByYear[year] += value;
                    } else if (periodicity === 'Ежемесячно') {
                        // Distribute monthly value over the year
                         const startMonth = currentDate.getFullYear() === startDate.getFullYear() ? startDate.getMonth() : 0;
                         const endMonth = currentDate.getFullYear() === endDate.getFullYear() ? endDate.getMonth() : 11;
                         const monthsInYear = endMonth - startMonth + 1;
                         valuesByYear[year] += value * monthsInYear;
                         // Jump to next year
                         currentDate.setFullYear(year + 1);
                         currentDate.setMonth(0);
                         continue; // skip default increment
                    }
                }
                
                if (periodicity === 'Ежегодно') {
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                } else { // Fallback for monthly to avoid infinite loops on bad data
                     currentDate.setFullYear(currentDate.getFullYear() + 1);
                }
            }
            return valuesByYear;
        };

        const toRows = (items) => Object.keys(items).map(name => ({ name, values: items[name] }));

        // 1. Revenue from internal services
        const revenueItems = {};
        costs.filter(c => c.type === 'internal').forEach(cost => {
            const key = cost.serviceType;
            if (!key) return;
            if (!revenueItems[key]) revenueItems[key] = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
            const revenueValues = distributePeriodicValue(cost, 'costForClient');
            years.forEach(y => revenueItems[key][y] += revenueValues[y]);
        });

        // 2. Direct Costs (costs of internal services)
        const directCostItems = {};
        costs.filter(c => c.type === 'internal').forEach(cost => {
            const key = cost.serviceType;
            if (!key) return;
            if (!directCostItems[key]) directCostItems[key] = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
            const costValues = distributePeriodicValue(cost, 'cost');
            years.forEach(y => directCostItems[key][y] += costValues[y]);
        });

        // 3. Other Production Costs
        const otherCostItems = {};
        const fotTotalByYear = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
        costs.filter(c => c.type === 'ФОТ').forEach(cost => {
            const fotValues = distributePeriodicValue(cost, 'cost');
            years.forEach(y => fotTotalByYear[y] += fotValues[y]);
        });
        otherCostItems['Прямой ФОТ'] = fotTotalByYear;
        otherCostItems['Затраты на персонал'] = fotTotalByYear; // Per requirement
        otherCostItems['Налог'] = years.reduce((acc, y) => ({ ...acc, [y]: fotTotalByYear[y] * 0.13 }), {});
        const otherCostCategories = ['Материалы', 'Услуги сторонних организаций', 'Накладные расходы'];
        costs.filter(c => otherCostCategories.includes(c.name)).forEach(cost => {
            if (!otherCostItems[cost.name]) otherCostItems[cost.name] = years.reduce((acc, y) => ({ ...acc, [y]: 0 }), {});
            const costValues = distributePeriodicValue(cost, 'cost');
            years.forEach(y => otherCostItems[cost.name][y] += costValues[y]);
        });

        // 4. Final Totals - made same as "Прочие производственные затраты" per image
        const finalTotals = otherCostItems;

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

        const stages = Array.from(page.querySelectorAll('#stages-table-body tr')).map(row => ({
            id: row.dataset.stageId,
            name: row.querySelector('[data-field="stage-name"]').value,
            startDate: row.querySelector('[data-field="stage-start-date"]').value,
            endDate: row.querySelector('[data-field="stage-end-date"]').value,
            periodType: row.querySelector('[data-field="stage-period-type"]').value,
            plannedRevenue: getNum(row.querySelector('[data-field="stage-revenue"]')),
        }));

        const costs = [];
        page.querySelectorAll('.stage-costs-block').forEach(stageBlock => {
            const stageId = stageBlock.dataset.stageId;

            stageBlock.querySelectorAll('.external-cost-row').forEach(row => costs.push({
                stageId,
                type: 'Внешние закупки',
                name: row.querySelector('input:first-child').value,
                startDate: row.querySelector('[data-field="start-date"]').value,
                endDate: row.querySelector('[data-field="end-date"]').value,
                periodicity: row.querySelector('[data-field="periodicity"]').value,
                cost: parseFloat(row.querySelector('[data-field="cost"]').value || 0),
                costForClient: parseFloat(row.querySelector('[data-field="cost-for-client"]').value || 0),
            }));

            stageBlock.querySelectorAll('.fot-cost-row').forEach(row => costs.push({
                stageId,
                type: 'ФОТ',
                name: row.querySelector('input:first-child').value,
                startDate: row.querySelector('[data-field="start-date"]').value,
                endDate: row.querySelector('[data-field="end-date"]').value,
                periodicity: row.querySelector('[data-field="periodicity"]').value,
                department: row.querySelector('[data-field="department"]').value,
                grade: row.querySelector('[data-field="grade"]').value,
                hours: getNum(row.querySelector('[data-field="hours"]')),
                cost: parseFloat(row.querySelector('[data-field="cost"]').value || 0),
                costForClient: parseFloat(row.querySelector('[data-field="cost-for-client"]').value || 0),
            }));

            stageBlock.querySelectorAll('.internal-cost-row').forEach(row => costs.push({
                stageId,
                type: 'internal',
                name: row.querySelector('input:first-child').value,
                startDate: row.querySelector('[data-field="start-date"]').value,
                endDate: row.querySelector('[data-field="end-date"]').value,
                periodicity: row.querySelector('[data-field="periodicity"]').value,
                serviceType: row.querySelector('[data-field="service-type"]').value,
                cost: parseFloat(row.querySelector('[data-field="cost"]').value || 0),
                costForClient: parseFloat(row.querySelector('[data-field="cost-for-client"]').value || 0),
            }));
        });
   
        currentProjectData = {
            projectId: page.querySelector('#main-info-card input').value,
            projectName: page.querySelector('#project-name-input').value,
            stages,
            costs,
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
        const startDate = stage.startDate || (stage.stage_date_start ? stage.stage_date_start.split('.').reverse().join('-') : '');
        const endDate = stage.endDate || (stage.stage_date_end ? stage.stage_date_end.split('.').reverse().join('-') : '');
        const periodType = stage.periodType || stage.stage_period_type || 'Месяц';
        const plannedRevenue = stage.plannedRevenue || stage.stage_planned_revenue || 0;
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
    
        return `
            <tr data-stage-id="${stageId}">
                <td><input type="text" data-field="stage-name" class="form-field" value="${stageName}" placeholder="Название этапа" ${disabled}></td>
                <td><input type="date" class="form-field" data-field="stage-start-date" value="${stage.stage_date_start ? new Date(stage.stage_date_start.split('.').reverse().join('-')).toISOString().split('T')[0] : ''}" ${disabled}></td> 
                <td><input type="date" class="form-field" data-field="stage-end-date" value="${stage.stage_date_end ? new Date(stage.stage_date_end.split('.').reverse().join('-')).toISOString().split('T')[0] : ''}" ${disabled}></td>
                <td><select class="form-field" data-field="stage-period-type" ${disabled}>${periodTypes.map(p => `<option ${p === (stage.periodType || stage.stage_period_type) ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" data-field="stage-period-count" value="${stage.periodCount || stage.stage_period_count || 0}" disabled></td>
                <td><input type="text" class="form-field" data-field="stage-revenue" value="${formatCurrency(stage.plannedRevenue || stage.stage_planned_revenue || 0)}" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-stage-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }

    function renderExternalCostRow(cost = {}, isReadOnly = false) {
        const isOneTime = (cost.cost_period || 'Разовое') === 'Разовое';
        return `
            <tr class="external-cost-row">
                <td><input type="text" class="form-field" value="${cost.cost_name || ''}" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="" data-field="start-date" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="" data-field="end-date" ${isOneTime ? 'disabled' : ''} ${isReadOnly ? 'disabled' : ''}></td>
                <td><select class="form-field" data-field="type" ${isReadOnly ? 'disabled' : ''}>${external_cost_types.map(o => `<option ${cost.cost_type === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="periodicity" ${isReadOnly ? 'disabled' : ''}>${cost_periods.map(o => `<option ${cost.cost_period === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" value="${cost.cost_cost || 0}" data-field="cost" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="number" class="form-field" value="${cost.cost_cost_for_client || 0}" data-field="cost-for-client" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-cost-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }
    
    function renderFotCostRow(cost = {}, isReadOnly = false) {
        const isOneTime = (cost.cost_period || 'Разовое') === 'Разовое';
        return `
            <tr class="fot-cost-row">
                <td><input type="text" class="form-field" value="${cost.cost_name || ''}" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="" data-field="start-date" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="" data-field="end-date" ${isOneTime ? 'disabled' : ''} ${isReadOnly ? 'disabled' : ''}></td>
                <td><select class="form-field" data-field="periodicity" ${isReadOnly ? 'disabled' : ''}>${cost_periods.map(o => `<option ${cost.cost_period === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="department" ${isReadOnly ? 'disabled' : ''}>${fot_departments.map(o => `<option ${cost.cost_departamenet === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="grade" ${isReadOnly ? 'disabled' : ''}>${fot_grades.map(o => `<option ${cost.cost_specialist_grade === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" value="${cost.cost_specialist_hour_cost || 0}" data-field="rate" disabled></td>
                <td><input type="number" class="form-field" value="${cost.cost_specialist_hour_count || 0}" data-field="hours" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="number" class="form-field" value="${cost.cost_cost || 0}" data-field="cost" disabled></td>
                <td><input type="number" class="form-field" value="${cost.cost_cost_for_client || 0}" data-field="cost-for-client" disabled></td>
                ${!isReadOnly ? `<td><button class="btn btn-danger delete-cost-btn">Удалить</button></td>` : ''}
            </tr>
        `;
    }
    
    function renderInternalCostRow(cost = {}, isReadOnly = false) {
        const isOneTime = (cost.cost_period || 'Разовое') === 'Разовое';
        return `
            <tr class="internal-cost-row">
                <td><input type="text" class="form-field" value="${cost.cost_name || ''}" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="" data-field="start-date" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="date" class="form-field" value="" data-field="end-date" ${isOneTime ? 'disabled' : ''} ${isReadOnly ? 'disabled' : ''}></td>
                <td><select class="form-field" data-field="service-type" ${isReadOnly ? 'disabled' : ''}>${internal_service_types.map(o => `<option ${cost.cost_service_type === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><select class="form-field" data-field="periodicity" ${isReadOnly ? 'disabled' : ''}>${cost_periods.map(o => `<option ${cost.cost_period === o ? 'selected': ''}>${o}</option>`).join('')}</select></td>
                <td><input type="number" class="form-field" value="${cost.cost_cost || 0}" data-field="cost" ${isReadOnly ? 'disabled' : ''}></td>
                <td><input type="number" class="form-field" value="${cost.cost_cost_for_client || 0}" data-field="cost-for-client" disabled></td>
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
        const loginInput = document.getElementById('login').value;
        const passwordInput = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        const user = users.find(u => u.user_name === loginInput && u.user_password === passwordInput);

        if (user) {
            currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            navigate('projects');
        } else {
            errorMessage.textContent = 'Некорректный логин или пароль.';
            errorMessage.style.display = 'block';
        }
    }

    function handleLogout(event) {
        event.preventDefault();
        currentUser = null;
        sessionStorage.clear();
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
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            const lastPage = sessionStorage.getItem('lastPage') || 'projects';
            const storedProjectData = sessionStorage.getItem('currentProjectData');
            if (storedProjectData) {
                currentProjectData = JSON.parse(storedProjectData);
            }
            navigate(lastPage);
        } else {
            navigate('login');
        }
    }

    init();
}); 