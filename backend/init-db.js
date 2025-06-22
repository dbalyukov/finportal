require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    let connection;
    
    try {
        // Connect to MySQL with existing user
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'finportal_user',
            password: process.env.DB_PASSWORD || 'your_secure_password',
            database: process.env.DB_NAME || 'finportal_db'
        });

        console.log('🔌 Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'finportal_db';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created/verified`);

        // Switch to the database
        await connection.execute(`USE ${dbName}`);

        // Create tables
        console.log('📋 Creating tables...');

        // Users table
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

        // Projects table
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

        // Project stages table
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

        // Project costs table
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

        // Constants table
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

        console.log('✅ All tables created successfully');

        // Insert default users
        console.log('👥 Creating default users...');
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

        console.log('✅ Default users created successfully');

        // Insert sample projects
        console.log('📊 Creating sample projects...');
        const sampleProjects = [
            {
                project_id: '12345678',
                project_name: 'Разработка веб-приложения',
                project_kam: 'Иван Петров',
                project_client: 'ООО "Технологии"',
                project_crm_integration_id: 'CRM-001',
                project_status: 'draft'
            },
            {
                project_id: '87654321',
                project_name: 'Мобильное приложение',
                project_kam: 'Иван Петров',
                project_client: 'ИП "Инновации"',
                project_crm_integration_id: 'CRM-002',
                project_status: 'in_review'
            }
        ];

        for (const project of sampleProjects) {
            await connection.execute(`
                INSERT IGNORE INTO projects (project_id, project_name, project_kam, project_client, project_crm_integration_id, project_status)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [project.project_id, project.project_name, project.project_kam, project.project_client, project.project_crm_integration_id, project.project_status]);
        }

        console.log('✅ Sample projects created successfully');

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Database: ${dbName}`);
        console.log(`   User: ${process.env.DB_USER || 'finportal_user'}`);
        console.log(`   Tables: users, projects, project_stages, project_costs, constants`);
        console.log('\n🔑 Default login credentials:');
        console.log('   admin/admin123 (Администратор)');
        console.log('   kam1/kam123 (Иван Петров - КАМ)');
        console.log('   calc1/calc123 (Мария Сидорова - Менеджер расчетов)');
        console.log('   ce1/ce123 (Алексей Козлов - Менеджер эффективности)');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('\n✅ Database setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase }; 