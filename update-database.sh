#!/bin/bash

# Database update script for finportal
# This script updates the database structure with new fields

echo "🚀 Starting database update for finportal..."

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
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL client is not installed. Please install it first."
    exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    print_status "Database connection successful"
else
    print_error "Failed to connect to database. Please check your credentials."
    exit 1
fi

# Create backup before making changes
echo "💾 Creating database backup..."
BACKUP_FILE="finportal_backup_$(date +%Y%m%d_%H%M%S).sql"
if mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"; then
    print_status "Backup created: $BACKUP_FILE"
else
    print_warning "Failed to create backup. Continuing anyway..."
fi

# Update database structure
echo "📋 Updating database structure..."

# Add new fields to projects table
echo "  - Updating projects table..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << 'EOF'
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_settings_team JSON AFTER project_status,
  ADD COLUMN IF NOT EXISTS project_settings_contract_type VARCHAR(100) AFTER project_settings_team,
  ADD COLUMN IF NOT EXISTS project_settings_profitability VARCHAR(100) AFTER project_settings_contract_type,
  ADD COLUMN IF NOT EXISTS project_settings_costs VARCHAR(100) AFTER project_settings_profitability,
  ADD COLUMN IF NOT EXISTS project_settings_costs_with_nds VARCHAR(100) AFTER project_settings_costs,
  ADD COLUMN IF NOT EXISTS project_settings_revenue VARCHAR(100) AFTER project_settings_costs_with_nds,
  ADD COLUMN IF NOT EXISTS project_settings_revenue_with_nds VARCHAR(100) AFTER project_settings_revenue;
EOF

if [ $? -eq 0 ]; then
    print_status "Projects table updated successfully"
else
    print_error "Failed to update projects table"
    exit 1
fi

# Add new fields to project_costs table
echo "  - Updating project_costs table..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << 'EOF'
ALTER TABLE project_costs
  ADD COLUMN IF NOT EXISTS cost_number INT NOT NULL DEFAULT 1 AFTER stage_number,
  ADD COLUMN IF NOT EXISTS cost_value_for_client DECIMAL(15,2) DEFAULT 0.00 AFTER cost_value,
  ADD COLUMN IF NOT EXISTS cost_date_start VARCHAR(10) AFTER cost_period,
  ADD COLUMN IF NOT EXISTS cost_date_end VARCHAR(10) AFTER cost_date_start,
  ADD COLUMN IF NOT EXISTS cost_deprecation VARCHAR(10) AFTER cost_type,
  ADD COLUMN IF NOT EXISTS cost_departamenet VARCHAR(100) AFTER cost_deprecation,
  ADD COLUMN IF NOT EXISTS cost_specialist_grade VARCHAR(100) AFTER cost_departamenet,
  ADD COLUMN IF NOT EXISTS cost_specialist_hour_cost DECIMAL(10,2) AFTER cost_specialist_grade,
  ADD COLUMN IF NOT EXISTS cost_specialist_hour_count INT AFTER cost_specialist_hour_cost,
  ADD COLUMN IF NOT EXISTS cost_service_type VARCHAR(100) AFTER cost_specialist_hour_count;
EOF

if [ $? -eq 0 ]; then
    print_status "Project_costs table updated successfully"
else
    print_error "Failed to update project_costs table"
    exit 1
fi

# Show updated table structures
echo "📊 Updated table structures:"
echo "  - Projects table:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE projects;" 2>/dev/null | head -20

echo "  - Project_costs table:"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE project_costs;" 2>/dev/null | head -20

print_status "Database structure updated successfully!"
echo ""
echo "🎉 Update completed! You can now run:"
echo "   node init-db.js"
echo ""
echo "📁 Backup file: $BACKUP_FILE" 