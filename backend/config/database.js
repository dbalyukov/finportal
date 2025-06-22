const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'finportal_user',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    database: process.env.DB_NAME || 'finportal_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Initialize database tables
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                user_role ENUM('admin', 'key_account_manager', 'calc_manager', 'cost_effiency_manager') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create projects table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(20) UNIQUE NOT NULL,
                project_name VARCHAR(255) NOT NULL,
                project_kam VARCHAR(100) NOT NULL,
                project_client VARCHAR(255) NOT NULL,
                project_crm_integration_id VARCHAR(50),
                project_status ENUM('draft', 'in_review', 'approved', 'rejected') DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create project_stages table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS project_stages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(20) NOT NULL,
                stage_number INT NOT NULL,
                stage_name VARCHAR(255) NOT NULL,
                stage_start_date DATE,
                stage_end_date DATE,
                period_type ENUM('month', 'quarter', 'year') DEFAULT 'month',
                period_count INT DEFAULT 1,
                planned_revenue DECIMAL(15,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
                UNIQUE KEY unique_stage (project_id, stage_number)
            )
        `);

        // Create project_costs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS project_costs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(20) NOT NULL,
                stage_number INT NOT NULL,
                cost_type ENUM('external', 'fot', 'internal') NOT NULL,
                cost_name VARCHAR(255) NOT NULL,
                cost_value DECIMAL(15,2) DEFAULT 0.00,
                cost_period VARCHAR(10) DEFAULT 'month',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
            )
        `);

        // Create constants table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS constants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                constant_id VARCHAR(50) UNIQUE NOT NULL,
                constant_name VARCHAR(255) NOT NULL,
                constant_value DECIMAL(15,2) NOT NULL,
                constant_unit VARCHAR(50),
                constant_group VARCHAR(100),
                constant_category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Insert default users if they don't exist
        const bcrypt = require('bcryptjs');
        const defaultUsers = [
            {
                username: 'admin',
                password: 'admin123',
                user_name: 'Администратор',
                user_role: 'admin'
            },
            {
                username: 'kam1',
                password: 'kam123',
                user_name: 'Иван Петров',
                user_role: 'key_account_manager'
            },
            {
                username: 'calc1',
                password: 'calc123',
                user_name: 'Мария Сидорова',
                user_role: 'calc_manager'
            },
            {
                username: 'ce1',
                password: 'ce123',
                user_name: 'Алексей Козлов',
                user_role: 'cost_effiency_manager'
            }
        ];

        for (const user of defaultUsers) {
            const passwordHash = await bcrypt.hash(user.password, 10);
            await connection.execute(`
                INSERT IGNORE INTO users (username, password_hash, user_name, user_role)
                VALUES (?, ?, ?, ?)
            `, [user.username, passwordHash, user.user_name, user.user_role]);
        }

        connection.release();
        console.log('✅ Database tables initialized successfully');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase
}; 