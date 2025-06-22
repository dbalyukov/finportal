const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const connection = await pool.getConnection();
        
        // Get user from database
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                userRole: user.user_role 
            },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return user data (without password) and token
        const userData = {
            id: user.id,
            username: user.username,
            user_name: user.user_name,
            user_role: user.user_role
        };

        res.json({
            success: true,
            token,
            user: userData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
        
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, username, user_name, user_role FROM users WHERE id = ?',
            [decoded.userId]
        );
        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, username, user_name, user_role, created_at FROM users ORDER BY created_at DESC'
        );
        connection.release();

        res.json(users);

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 