#!/bin/bash

# Fixed database update script for finportal
echo "🔧 Fixing database structure..."

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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test database connection
echo "🔌 Testing database connection..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    print_status "Database connection successful"
else
    print_error "Failed to connect to database. Please check your credentials."
    exit 1
fi

# Create backup
echo "💾 Creating database backup..."
BACKUP_FILE="finportal_backup_$(date +%Y%m%d_%H%M%S).sql"
if mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"; then
    print_status "Backup created: $BACKUP_FILE"
else
    print_warning "Failed to create backup. Continuing anyway..."
fi

# Function to add column if not exists
add_column_if_not_exists() {
    local table=$1
    local column=$2
    local definition=$3
    
    echo "  - Adding column $column to $table..."
    
    # Check if column exists
    local exists=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -s -e "
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '$DB_NAME' 
        AND TABLE_NAME = '$table' 
        AND COLUMN_NAME = '$column';
    " 2>/dev/null)
    
    if [ "$exists" -eq 0 ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
            ALTER TABLE $table ADD COLUMN $column $definition;
        " 2>/dev/null
        
        if [ $? -eq 0 ]; then
            print_status "Column $column added to $table"
        else
            print_error "Failed to add column $column to $table"
            return 1
        fi
    else
        print_warning "Column $column already exists in $table"
    fi
}

# Update projects table
echo "📋 Updating projects table..."
add_column_if_not_exists "projects" "project_settings_team" "JSON AFTER project_status"
add_column_if_not_exists "projects" "project_settings_contract_type" "VARCHAR(100) AFTER project_settings_team"
add_column_if_not_exists "projects" "project_settings_profitability" "VARCHAR(100) AFTER project_settings_contract_type"
add_column_if_not_exists "projects" "project_settings_costs" "VARCHAR(100) AFTER project_settings_profitability"
add_column_if_not_exists "projects" "project_settings_costs_with_nds" "VARCHAR(100) AFTER project_settings_costs"
add_column_if_not_exists "projects" "project_settings_revenue" "VARCHAR(100) AFTER project_settings_costs_with_nds"
add_column_if_not_exists "projects" "project_settings_revenue_with_nds" "VARCHAR(100) AFTER project_settings_revenue"

# Update project_costs table
echo "📋 Updating project_costs table..."
add_column_if_not_exists "project_costs" "cost_number" "INT NOT NULL DEFAULT 1 AFTER stage_number"
add_column_if_not_exists "project_costs" "cost_value_for_client" "DECIMAL(15,2) DEFAULT 0.00 AFTER cost_value"
add_column_if_not_exists "project_costs" "cost_date_start" "VARCHAR(10) AFTER cost_period"
add_column_if_not_exists "project_costs" "cost_date_end" "VARCHAR(10) AFTER cost_date_start"
add_column_if_not_exists "project_costs" "cost_deprecation" "VARCHAR(10) AFTER cost_type"
add_column_if_not_exists "project_costs" "cost_departamenet" "VARCHAR(100) AFTER cost_deprecation"
add_column_if_not_exists "project_costs" "cost_specialist_grade" "VARCHAR(100) AFTER cost_departamenet"
add_column_if_not_exists "project_costs" "cost_specialist_hour_cost" "DECIMAL(10,2) AFTER cost_specialist_grade"
add_column_if_not_exists "project_costs" "cost_specialist_hour_count" "INT AFTER cost_specialist_hour_cost"
add_column_if_not_exists "project_costs" "cost_service_type" "VARCHAR(100) AFTER cost_specialist_hour_count"

# Show final table structures
echo "📊 Final table structures:"
echo "  - Projects table:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE projects;" 2>/dev/null | head -20

echo "  - Project_costs table:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE project_costs;" 2>/dev/null | head -20

print_status "Database structure updated successfully!"
echo ""
echo "🎉 Fix completed! You can now run:"
echo "   node init-db.js"
echo ""
echo "📁 Backup file: $BACKUP_FILE" 