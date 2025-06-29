const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Get user role from query params (for filtering)
        const userRole = req.query.userRole;
        const userName = req.query.userName;
        
        let query = 'SELECT * FROM projects ORDER BY created_at DESC';
        let params = [];
        
        // Filter projects for key_account_manager
        if (userRole === 'key_account_manager' && userName) {
            query = 'SELECT * FROM projects WHERE project_kam = ? ORDER BY created_at DESC';
            params = [userName];
        }
        
        const [projects] = await connection.execute(query, params);
        connection.release();

        res.json(projects);

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get project by ID
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const connection = await pool.getConnection();
        
        // Get project details
        const [projects] = await connection.execute(
            'SELECT * FROM projects WHERE project_id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Get project stages
        const [stages] = await connection.execute(
            'SELECT * FROM project_stages WHERE project_id = ? ORDER BY stage_number',
            [projectId]
        );
        
        connection.release();
        
        const project = projects[0];
        project.stages = stages;
        
        res.json(project);

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new project
router.post('/', async (req, res) => {
    try {
        const { 
            project_name, 
            project_kam, 
            project_client, 
            project_crm_integration_id,
            stages = [] 
        } = req.body;

        if (!project_name || !project_kam || !project_client) {
            return res.status(400).json({ error: 'Project name, KAM and client are required' });
        }

        const connection = await pool.getConnection();
        
        // Generate project ID
        const projectId = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        // Insert project
        await connection.execute(
            'INSERT INTO projects (project_id, project_name, project_kam, project_client, project_crm_integration_id) VALUES (?, ?, ?, ?, ?)',
            [projectId, project_name, project_kam, project_client, project_crm_integration_id || null]
        );
        
        // Insert stages if provided
        if (stages.length > 0) {
            for (let i = 0; i < stages.length; i++) {
                const stage = stages[i];
                await connection.execute(
                    'INSERT INTO project_stages (project_id, stage_number, stage_name, stage_start_date, stage_end_date, period_type, period_count, planned_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        projectId,
                        i + 1,
                        stage.stage_name || `Этап ${i + 1}`,
                        stage.stage_start_date || null,
                        stage.stage_end_date || null,
                        stage.period_type || 'month',
                        stage.period_count || 1,
                        stage.planned_revenue || 0
                    ]
                );
            }
        }
        
        connection.release();
        
        res.status(201).json({ 
            success: true, 
            project_id: projectId,
            message: 'Project created successfully' 
        });

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update project
router.put('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { 
            project_name, 
            project_kam, 
            project_client, 
            project_crm_integration_id,
            project_status 
        } = req.body;

        const connection = await pool.getConnection();
        
        // Check if project exists
        const [projects] = await connection.execute(
            'SELECT * FROM projects WHERE project_id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Update project
        await connection.execute(
            'UPDATE projects SET project_name = ?, project_kam = ?, project_client = ?, project_crm_integration_id = ?, project_status = ? WHERE project_id = ?',
            [project_name, project_kam, project_client, project_crm_integration_id, project_status, projectId]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Project updated successfully' 
        });

    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete project
router.delete('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const connection = await pool.getConnection();
        
        // Check if project exists
        const [projects] = await connection.execute(
            'SELECT * FROM projects WHERE project_id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Delete project (cascade will delete stages and costs)
        await connection.execute(
            'DELETE FROM projects WHERE project_id = ?',
            [projectId]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Project deleted successfully' 
        });

    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get full project data (with settings, stages, and costs)
router.get('/:projectId/full', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const connection = await pool.getConnection();
        
        // Get project details
        const [projects] = await connection.execute(
            'SELECT * FROM projects WHERE project_id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Get project stages
        const [stages] = await connection.execute(
            'SELECT * FROM project_stages WHERE project_id = ? ORDER BY stage_number',
            [projectId]
        );
        
        // Get project costs
        const [costs] = await connection.execute(
            'SELECT * FROM project_costs WHERE project_id = ? ORDER BY stage_number, cost_type, cost_number',
            [projectId]
        );
        
        connection.release();
        
        const project = projects[0];
        
        // Parse team settings
        try {
            project.project_settings_team = JSON.parse(project.project_settings_team || '[]');
        } catch (e) {
            project.project_settings_team = [];
        }
        
        // Group costs by stage and type
        const groupedCosts = {};
        costs.forEach(cost => {
            if (!groupedCosts[cost.stage_number]) {
                groupedCosts[cost.stage_number] = {
                    external: [],
                    fot: [],
                    internal: []
                };
            }
            groupedCosts[cost.stage_number][cost.cost_type].push(cost);
        });
        
        res.json({
            project: project,
            stages: stages,
            costs: groupedCosts
        });

    } catch (error) {
        console.error('Get full project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save project draft (full project data)
router.post('/:projectId/draft', async (req, res) => {
    try {
        const { projectId } = req.params;
        const {
            project_settings,
            stages = [],
            costs = {},
            project_crm_integration_id,
            project_name,
            project_kam,
            project_client
        } = req.body;

        console.log('Received project data:', {
            projectId,
            project_settings,
            stages: stages.length,
            costs: Object.keys(costs),
            project_crm_integration_id,
            project_name,
            project_kam,
            project_client
        });

        const connection = await pool.getConnection();
        
        // Check if project exists
        const [projects] = await connection.execute(
            'SELECT * FROM projects WHERE project_id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update project settings
        await connection.execute(`
            UPDATE projects SET 
                project_name = ?,
                project_kam = ?,
                project_client = ?,
                project_crm_integration_id = ?,
                project_settings_team = ?,
                project_settings_contract_type = ?,
                project_settings_profitability = ?,
                project_settings_costs = ?,
                project_settings_costs_with_nds = ?,
                project_settings_revenue = ?,
                project_settings_revenue_with_nds = ?,
                project_status = 'draft'
            WHERE project_id = ?
        `, [
            project_name || projects[0].project_name,
            project_kam || projects[0].project_kam,
            project_client || projects[0].project_client,
            project_crm_integration_id || projects[0].project_crm_integration_id,
            JSON.stringify(project_settings?.team || []),
            project_settings?.contract_type || null,
            project_settings?.profitability || null,
            project_settings?.costs || null,
            project_settings?.costs_with_nds || null,
            project_settings?.revenue || null,
            project_settings?.revenue_with_nds || null,
            projectId
        ]);

        // Delete existing stages and costs
        await connection.execute(
            'DELETE FROM project_costs WHERE project_id = ?',
            [projectId]
        );
        await connection.execute(
            'DELETE FROM project_stages WHERE project_id = ?',
            [projectId]
        );

        // Добавляю маппинг periodType для этапов
        const periodTypeMap = {
            'Месяц': 'month',
            'Квартал': 'quarter',
            'month': 'month',
            'quarter': 'quarter'
        };

        // Функция для преобразования даты из DD.MM.YYYY в YYYY-MM-DD
        const formatDateForDB = (dateStr) => {
            if (!dateStr) return null;
            
            // Если дата уже в формате YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }
            
            // Если дата в формате DD.MM.YYYY
            if (dateStr.includes('.')) {
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            return null;
        };

        // Insert stages
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const startDate = formatDateForDB(stage.startDate || stage.stage_start_date);
            const endDate = formatDateForDB(stage.endDate || stage.stage_end_date);
            const periodType = periodTypeMap[stage.periodType] || 'month';
            
            await connection.execute(`
                INSERT INTO project_stages (
                    project_id, stage_number, stage_name, stage_start_date, 
                    stage_end_date, period_type, period_count, planned_revenue
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                projectId,
                i + 1,
                stage.stage_name || stage.name || `Этап ${i + 1}`,
                startDate,
                endDate,
                periodType,
                stage.periodCount || stage.period_count || 1,
                stage.plannedRevenue || stage.planned_revenue || 0
            ]);
        }

        // Insert costs
        for (const stageNumber in costs) {
            const stageCosts = costs[stageNumber];
            console.log(`Processing stage ${stageNumber}:`, stageCosts);
            
            for (const costType of ['external', 'fot', 'internal']) {
                if (stageCosts[costType] && Array.isArray(stageCosts[costType])) {
                    console.log(`Processing ${costType} costs for stage ${stageNumber}:`, stageCosts[costType]);
                    for (let i = 0; i < stageCosts[costType].length; i++) {
                        const cost = stageCosts[costType][i];
                        console.log(`Processing cost ${i + 1}:`, cost);
                        
                        await connection.execute(`
                            INSERT INTO project_costs (
                                project_id, stage_number, cost_number, cost_name, 
                                cost_value, cost_value_for_client, cost_period, 
                                cost_date_start, cost_date_end, cost_type, 
                                cost_deprecation, cost_departamenet, cost_specialist_grade,
                                cost_specialist_hour_cost, cost_specialist_hour_count, cost_service_type
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            projectId,
                            parseInt(stageNumber),
                            i + 1,
                            cost.name || cost.cost_name || '',
                            cost.cost || cost.cost_value || cost.value || 0,
                            cost.costForClient || cost.cost_value_for_client || cost.value_for_client || 0,
                            cost.periodicity || cost.cost_period || cost.period || 'month',
                            formatDateForDB(cost.startDate || cost.cost_date_start || cost.date_start),
                            formatDateForDB(cost.endDate || cost.cost_date_end || cost.date_end),
                            costType,
                            cost.cost_deprecation || cost.deprecation || null,
                            cost.department || cost.cost_departamenet || null,
                            cost.grade || cost.cost_specialist_grade || null,
                            cost.cost_specialist_hour_cost || cost.hour_cost || null,
                            cost.hours || cost.cost_specialist_hour_count || cost.hour_count || null,
                            cost.serviceType || cost.cost_service_type || null
                        ]);
                    }
                }
            }
        }
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Project draft saved successfully' 
        });

    } catch (error) {
        console.error('Save project draft error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 