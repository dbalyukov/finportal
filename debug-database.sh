#!/bin/bash

# Debug script to check database structure
echo "🔍 Debugging database structure..."

# Database configuration
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="finportal_user"
DB_PASSWORD="your_secure_password"
DB_NAME="finportal_db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test connection
echo "🔌 Testing database connection..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    print_status "Database connection successful"
else
    print_error "Failed to connect to database"
    exit 1
fi

# Check if tables exist
echo "📋 Checking table existence..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null

# Check projects table structure
echo ""
echo "📊 Projects table structure:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE projects;" 2>/dev/null

# Check project_costs table structure
echo ""
echo "📊 Project_costs table structure:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE project_costs;" 2>/dev/null

# Check if new fields exist
echo ""
echo "🔍 Checking for new fields in projects table:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'projects' 
AND COLUMN_NAME LIKE 'project_settings_%'
ORDER BY COLUMN_NAME;
" 2>/dev/null

echo ""
echo "🔍 Checking for new fields in project_costs table:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'project_costs' 
AND (COLUMN_NAME LIKE 'cost_%' OR COLUMN_NAME = 'cost_number')
ORDER BY COLUMN_NAME;
" 2>/dev/null 