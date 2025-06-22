const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all constants
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [constants] = await connection.execute(
            'SELECT * FROM constants ORDER BY constant_group, constant_category, constant_name'
        );
        
        connection.release();
        
        // Group constants by category
        const groupedConstants = {};
        constants.forEach(constant => {
            if (!groupedConstants[constant.constant_group]) {
                groupedConstants[constant.constant_group] = {};
            }
            if (!groupedConstants[constant.constant_group][constant.constant_category]) {
                groupedConstants[constant.constant_group][constant.constant_category] = [];
            }
            groupedConstants[constant.constant_group][constant.constant_category].push(constant);
        });
        
        res.json(groupedConstants);

    } catch (error) {
        console.error('Get constants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get constant by ID
router.get('/:constantId', async (req, res) => {
    try {
        const { constantId } = req.params;
        
        const connection = await pool.getConnection();
        
        const [constants] = await connection.execute(
            'SELECT * FROM constants WHERE constant_id = ?',
            [constantId]
        );
        
        connection.release();
        
        if (constants.length === 0) {
            return res.status(404).json({ error: 'Constant not found' });
        }
        
        res.json(constants[0]);

    } catch (error) {
        console.error('Get constant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new constant
router.post('/', async (req, res) => {
    try {
        const { 
            constant_id, 
            constant_name, 
            constant_value, 
            constant_unit,
            constant_group,
            constant_category 
        } = req.body;

        if (!constant_id || !constant_name || constant_value === undefined) {
            return res.status(400).json({ error: 'Constant ID, name and value are required' });
        }

        const connection = await pool.getConnection();
        
        // Check if constant already exists
        const [existing] = await connection.execute(
            'SELECT * FROM constants WHERE constant_id = ?',
            [constant_id]
        );
        
        if (existing.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'Constant with this ID already exists' });
        }
        
        // Insert new constant
        await connection.execute(
            'INSERT INTO constants (constant_id, constant_name, constant_value, constant_unit, constant_group, constant_category) VALUES (?, ?, ?, ?, ?, ?)',
            [constant_id, constant_name, constant_value, constant_unit, constant_group, constant_category]
        );
        
        connection.release();
        
        res.status(201).json({ 
            success: true, 
            message: 'Constant created successfully' 
        });

    } catch (error) {
        console.error('Create constant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update constant
router.put('/:constantId', async (req, res) => {
    try {
        const { constantId } = req.params;
        const { 
            constant_name, 
            constant_value, 
            constant_unit,
            constant_group,
            constant_category 
        } = req.body;

        const connection = await pool.getConnection();
        
        // Check if constant exists
        const [constants] = await connection.execute(
            'SELECT * FROM constants WHERE constant_id = ?',
            [constantId]
        );
        
        if (constants.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Constant not found' });
        }
        
        // Update constant
        await connection.execute(
            'UPDATE constants SET constant_name = ?, constant_value = ?, constant_unit = ?, constant_group = ?, constant_category = ? WHERE constant_id = ?',
            [constant_name, constant_value, constant_unit, constant_group, constant_category, constantId]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Constant updated successfully' 
        });

    } catch (error) {
        console.error('Update constant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete constant
router.delete('/:constantId', async (req, res) => {
    try {
        const { constantId } = req.params;
        
        const connection = await pool.getConnection();
        
        // Check if constant exists
        const [constants] = await connection.execute(
            'SELECT * FROM constants WHERE constant_id = ?',
            [constantId]
        );
        
        if (constants.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Constant not found' });
        }
        
        // Delete constant
        await connection.execute(
            'DELETE FROM constants WHERE constant_id = ?',
            [constantId]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Constant deleted successfully' 
        });

    } catch (error) {
        console.error('Delete constant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize default constants
router.post('/init', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const defaultConstants = [
            // VGO Constants
            { id: 'vgo_1', name: 'VGO 1', value: 1000, unit: 'руб/т', group: 'VGO', category: 'Основные' },
            { id: 'vgo_2', name: 'VGO 2', value: 1500, unit: 'руб/т', group: 'VGO', category: 'Основные' },
            { id: 'vgo_3', name: 'VGO 3', value: 2000, unit: 'руб/т', group: 'VGO', category: 'Основные' },
            
            // Other constants
            { id: 'constant_1', name: 'Константа 1', value: 500, unit: 'руб', group: 'Общие', category: 'Основные' },
            { id: 'constant_2', name: 'Константа 2', value: 750, unit: 'руб', group: 'Общие', category: 'Основные' }
        ];
        
        for (const constant of defaultConstants) {
            await connection.execute(
                'INSERT IGNORE INTO constants (constant_id, constant_name, constant_value, constant_unit, constant_group, constant_category) VALUES (?, ?, ?, ?, ?, ?)',
                [constant.id, constant.name, constant.value, constant.unit, constant.group, constant.category]
            );
        }
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Default constants initialized successfully' 
        });

    } catch (error) {
        console.error('Initialize constants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 