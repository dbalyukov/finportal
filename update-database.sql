-- SQL Script to update database structure for finportal
-- Run this script to add new fields to existing tables

USE finportal_db;

-- Add new fields to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_settings_team JSON AFTER project_status,
  ADD COLUMN IF NOT EXISTS project_settings_contract_type VARCHAR(100) AFTER project_settings_team,
  ADD COLUMN IF NOT EXISTS project_settings_profitability VARCHAR(100) AFTER project_settings_contract_type,
  ADD COLUMN IF NOT EXISTS project_settings_costs VARCHAR(100) AFTER project_settings_profitability,
  ADD COLUMN IF NOT EXISTS project_settings_costs_with_nds VARCHAR(100) AFTER project_settings_costs,
  ADD COLUMN IF NOT EXISTS project_settings_revenue VARCHAR(100) AFTER project_settings_costs_with_nds,
  ADD COLUMN IF NOT EXISTS project_settings_revenue_with_nds VARCHAR(100) AFTER project_settings_revenue;

-- Add new fields to project_costs table
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

-- Show updated table structures
DESCRIBE projects;
DESCRIBE project_costs;

-- Show success message
SELECT 'Database structure updated successfully!' as status; 