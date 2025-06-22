const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get project costs
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const connection = await pool.getConnection();
        
        // Get project costs grouped by stage and type
        const [costs] = await connection.execute(
            `SELECT 
                pc.*,
                ps.stage_name
            FROM project_costs pc
            LEFT JOIN project_stages ps ON pc.project_id = ps.project_id AND pc.stage_number = ps.stage_number
            WHERE pc.project_id = ?
            ORDER BY pc.stage_number, pc.cost_type, pc.cost_name`,
            [projectId]
        );
        
        connection.release();
        
        // Group costs by stage and type
        const groupedCosts = {};
        costs.forEach(cost => {
            if (!groupedCosts[cost.stage_number]) {
                groupedCosts[cost.stage_number] = {
                    stage_name: cost.stage_name,
                    external: [],
                    fot: [],
                    internal: []
                };
            }
            groupedCosts[cost.stage_number][cost.cost_type].push(cost);
        });
        
        res.json(groupedCosts);

    } catch (error) {
        console.error('Get costs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save project costs
router.post('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { costs } = req.body;
        
        const connection = await pool.getConnection();
        
        // Delete existing costs for this project
        await connection.execute(
            'DELETE FROM project_costs WHERE project_id = ?',
            [projectId]
        );
        
        // Insert new costs
        for (const stageNumber in costs) {
            const stageCosts = costs[stageNumber];
            
            for (const costType of ['external', 'fot', 'internal']) {
                if (stageCosts[costType] && Array.isArray(stageCosts[costType])) {
                    for (const cost of stageCosts[costType]) {
                        await connection.execute(
                            'INSERT INTO project_costs (project_id, stage_number, cost_type, cost_name, cost_value, cost_period) VALUES (?, ?, ?, ?, ?, ?)',
                            [
                                projectId,
                                parseInt(stageNumber),
                                costType,
                                cost.cost_name || cost.name || '',
                                cost.cost_value || cost.value || 0,
                                cost.cost_period || cost.period || 'month'
                            ]
                        );
                    }
                }
            }
        }
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Costs saved successfully' 
        });

    } catch (error) {
        console.error('Save costs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add stage to project
router.post('/:projectId/stages', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { stage_name, stage_start_date, stage_end_date, period_type, period_count, planned_revenue } = req.body;
        
        const connection = await pool.getConnection();
        
        // Get next stage number
        const [stages] = await connection.execute(
            'SELECT MAX(stage_number) as max_stage FROM project_stages WHERE project_id = ?',
            [projectId]
        );
        
        const nextStageNumber = (stages[0].max_stage || 0) + 1;
        
        // Insert new stage
        await connection.execute(
            'INSERT INTO project_stages (project_id, stage_number, stage_name, stage_start_date, stage_end_date, period_type, period_count, planned_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                projectId,
                nextStageNumber,
                stage_name || `Этап ${nextStageNumber}`,
                stage_start_date || null,
                stage_end_date || null,
                period_type || 'month',
                period_count || 1,
                planned_revenue || 0
            ]
        );
        
        connection.release();
        
        res.status(201).json({ 
            success: true, 
            stage_number: nextStageNumber,
            message: 'Stage added successfully' 
        });

    } catch (error) {
        console.error('Add stage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete stage from project
router.delete('/:projectId/stages/:stageNumber', async (req, res) => {
    try {
        const { projectId, stageNumber } = req.params;
        
        const connection = await pool.getConnection();
        
        // Delete stage costs first
        await connection.execute(
            'DELETE FROM project_costs WHERE project_id = ? AND stage_number = ?',
            [projectId, stageNumber]
        );
        
        // Delete stage
        await connection.execute(
            'DELETE FROM project_stages WHERE project_id = ? AND stage_number = ?',
            [projectId, stageNumber]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Stage deleted successfully' 
        });

    } catch (error) {
        console.error('Delete stage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 