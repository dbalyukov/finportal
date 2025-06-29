-- Создание таблицы ролей команды
CREATE TABLE IF NOT EXISTS team_list (
    team_role_id VARCHAR(50) PRIMARY KEY,
    team_role_name VARCHAR(100) NOT NULL
);

-- Создание таблицы состава команды проекта
CREATE TABLE IF NOT EXISTS project_team_list (
    project_id VARCHAR(20) NOT NULL,
    kam TINYINT(1) DEFAULT 0,
    center_director TINYINT(1) DEFAULT 0,
    calculation_center TINYINT(1) DEFAULT 0,
    project_manager TINYINT(1) DEFAULT 0,
    tech_calc_support_center TINYINT(1) DEFAULT 0,
    arch_support_center TINYINT(1) DEFAULT 0,
    contract_center TINYINT(1) DEFAULT 0,
    cost_effiency_center TINYINT(1) DEFAULT 0,
    PRIMARY KEY (project_id)
);

-- Очистка и наполнение таблицы ролей
DELETE FROM team_list;
INSERT INTO team_list (team_role_id, team_role_name) VALUES
    ('kam', 'КАМ'),
    ('center_director', 'Директор центра'),
    ('calculation_center', 'Рассчетный центр'),
    ('project_manager', 'Администратор проекта'),
    ('tech_calc_support_center', 'ЦОСП'),
    ('arch_support_center', 'ЦТСП'),
    ('contract_center', 'Договорной центр'),
    ('cost_effiency_center', 'СКЭ');

-- Пример наполнения project_team_list (можно удалить или оставить для теста)
-- INSERT INTO project_team_list (project_id, kam, center_director, calculation_center, project_manager, tech_calc_support_center, arch_support_center, contract_center, cost_effiency_center)
-- VALUES ('111', 1, 0, 1, 1, 1, 0, 1, 1), ('1443', 1, 0, 1, 1, 1, 1, 1, 1); 