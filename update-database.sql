-- SQL Script to update database structure for finportal
-- Run this script to add new fields to existing tables

USE finportal_db;

-- Add new fields to projects table
ALTER TABLE projects
  ADD COLUMN project_settings_team JSON,
  ADD COLUMN project_settings_contract_type VARCHAR(100),
  ADD COLUMN project_settings_profitability VARCHAR(100),
  ADD COLUMN project_settings_costs VARCHAR(100),
  ADD COLUMN project_settings_costs_with_nds VARCHAR(100),
  ADD COLUMN project_settings_revenue VARCHAR(100),
  ADD COLUMN project_settings_revenue_with_nds VARCHAR(100);

-- Add new fields to project_costs table
ALTER TABLE project_costs
  ADD COLUMN cost_number INT NOT NULL DEFAULT 1,
  ADD COLUMN cost_value_for_client DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN cost_date_start VARCHAR(10),
  ADD COLUMN cost_date_end VARCHAR(10),
  ADD COLUMN cost_deprecation VARCHAR(10),
  ADD COLUMN cost_departamenet VARCHAR(100),
  ADD COLUMN cost_specialist_grade VARCHAR(100),
  ADD COLUMN cost_specialist_hour_cost DECIMAL(10,2),
  ADD COLUMN cost_specialist_hour_count INT,
  ADD COLUMN cost_service_type VARCHAR(100);

-- Show updated table structures
DESCRIBE projects;
DESCRIBE project_costs;

-- Show success message
SELECT 'Database structure updated successfully!' as status; 