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

module.exports = router; 