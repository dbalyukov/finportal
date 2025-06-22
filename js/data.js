const users = [
    {
        user_id: 1,
        user_name: "Илья Ильин",
        user_password: "12345",
        user_role: "admin",
    },
    {
        user_id: 2,
        user_name: "Иван Иванов",
        user_password: "12345",
        user_role: "key_account_manager",
    },
    {
        user_id: 3,
        user_name: "Арсений Арсеньев",
        user_password: "12345",
        user_role: "director",
    },
    {
        user_id: 4,
        user_name: "Лев Львов",
        user_password: "12345",
        user_role: "calc_manager",
    },
    {
        user_id: 5,
        user_name: "Павел Павлов",
        user_password: "12345",
        user_role: "cost_effiency_manager",
    },
    {
        user_id: 6,
        user_name: "Дмитрий Дмитриев",
        user_password: "12345",
        user_role: "contract_manager",
    },
    {
        user_id: 7,
        user_name: "Анна Анина",
        user_password: "12345",
        user_role: "calc_center",
    },
    {
        user_id: 8,
        user_name: "Антон Антонов",
        user_password: "12345",
        user_role: "project_manager",
    },
    {
        user_id: 9,
        user_name: "Петр Петров",
        user_password: "11111",
        user_role: "key_account_manager",
    },
    {
        user_id: 10,
        user_name: "Алексей Алексеев",
        user_password: "22222",
        user_role: "key_account_manager",
    },
];

const roles = {
    admin: "Администратор системы",
    key_account_manager: "КАМ",
    director: "КАМ+",
    calc_manager: "ЦОСП",
    cost_effiency_manager: "СКЭ",
    contract_manager: "ДЦ",
    calc_center: "РЦ",
    project_manager: "Руководитель проекта",
};

const table_projects = [
    {
        project_id: 1,
        project_name: "Тестовый проект",
        project_kam: "Иван Иванов",
        project_client: "Тест",
        project_crm_integration_id: "12345",
        project_status: "Активный",
    },
    {
        project_id: 2,
        project_name: "НеТест",
        project_kam: "Иван Иванов",
        project_client: "Тест",
        project_crm_integration_id: "10001",
        project_status: "Закрыт",
    },
    {
        project_id: 3,
        project_name: "Тест№3",
        project_kam: "Иван Иванов",
        project_client: "НеКлиент",
        project_crm_integration_id: "-",
        project_status: "Черновик",
    },
    {
        project_id: 4,
        project_name: "Еще один тест",
        project_kam: "Петр Петров",
        project_client: "Клиент",
        project_crm_integration_id: "10003",
        project_status: "Активный",
    },
    {
        project_id: 5,
        project_name: "Точно не тест",
        project_kam: "Петр Петров",
        project_client: "Двойка",
        project_crm_integration_id: "10002",
        project_status: "Закрыт",
    },
    {
        project_id: 6,
        project_name: "Еще раз",
        project_kam: "Петр Петров",
        project_client: "Двойка",
        project_crm_integration_id: "-",
        project_status: "Черновик",
    },
    {
        project_id: 7,
        project_name: "Седьмой",
        project_kam: "Алексей Алексеев",
        project_client: "Тройка",
        project_crm_integration_id: "10004",
        project_status: "Активный",
    },
    {
        project_id: 8,
        project_name: "Восьмой",
        project_kam: "Алексей Алексеев",
        project_client: "Четверка",
        project_crm_integration_id: "10005",
        project_status: "Закрыт",
    },
    {
        project_id: 9,
        project_name: "Девятый",
        project_kam: "Алексей Алексеев",
        project_client: "Пятерка",
        project_crm_integration_id: "-",
        project_status: "Черновик",
    },
    {
        project_id: 10,
        project_name: "Десятый",
        project_kam: "Алексей Алексеев",
        project_client: "Шестерка",
        project_crm_integration_id: "10006",
        project_status: "Активный",
    },
];

const project_stage = [
    { project_id: 1, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 1, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 1, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 2, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 2, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 2, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 3, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 3, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 3, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 4, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 4, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 4, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 5, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 5, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 5, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 6, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 6, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 6, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 7, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 7, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 7, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 8, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 8, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 8, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 9, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 9, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 9, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
    { project_id: 10, stage_number: 1, stage_name: "ПНР", stage_date_start: "01.01.2025", stage_date_end: "30.06.2025", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 1000000 },
    { project_id: 10, stage_number: 2, stage_name: "Первый год", stage_date_start: "01.07.2025", stage_date_end: "31.12.2026", stage_period_type: "Месяц", stage_period_count: 6, stage_planned_revenue: 3000000 },
    { project_id: 10, stage_number: 3, stage_name: "Второй год", stage_date_start: "01.01.2026", stage_date_end: "31.12.2027", stage_period_type: "Квартал", stage_period_count: 4, stage_planned_revenue: 6000000 },
]

const project_cost = [
    { stage_number: 1, stage_name: "ПНР", cost_number: 1, cost_name: "Серверы", cost_date_start: "01.01.2025", cost_date_end: "-", cost_type: "Внешние закупки", cost_period: "Разовый", cost_deprecation: 36, cost_cost: 500000, cost_cost_for_client: 625000, cost_departamenet: null, cost_specialist_grade: null, cost_specialist_hour_cost: null, cost_specialist_hour_count: null, cost_service_type: null },
    { stage_number: 1, stage_name: "ПНР", cost_number: 2, cost_name: "Установка", cost_date_start: "01.03.2025", cost_date_end: "-", cost_type: "ФОТ", cost_period: "Разовый", cost_deprecation: null, cost_cost: 10000, cost_cost_for_client: 12500, cost_departamenet: "Эксплуатация", cost_specialist_grade: "Младший инженер", cost_specialist_hour_cost: 1000, cost_specialist_hour_count: 10, cost_service_type: null },
    { stage_number: 1, stage_name: "ПНР", cost_number: 3, cost_name: "Коло", cost_date_start: "01.03.2025", cost_date_end: "-", cost_type: "Внутренние продукты", cost_period: "Разовый", cost_deprecation: null, cost_cost: 50000, cost_cost_for_client: 62500, cost_departamenet: null, cost_specialist_grade: null, cost_specialist_hour_cost: null, cost_specialist_hour_count: null, cost_service_type: "Colocation" },
    { stage_number: 2, stage_name: "Первый год", cost_number: 1, cost_name: "Расходники", cost_date_start: "01.01.2025", cost_date_end: "-", cost_type: "Внешние закупки", cost_period: "Ежегодный", cost_deprecation: 12, cost_cost: 500000, cost_cost_for_client: 625000, cost_departamenet: null, cost_specialist_grade: null, cost_specialist_hour_cost: null, cost_specialist_hour_count: null, cost_service_type: null },
    { stage_number: 2, stage_name: "Первый год", cost_number: 2, cost_name: "Поддержка", cost_date_start: "01.03.2025", cost_date_end: "-", cost_type: "ФОТ", cost_period: "Ежемесячный", cost_deprecation: null, cost_cost: 15000, cost_cost_for_client: 18750, cost_departamenet: "Эксплуатация", cost_specialist_grade: "Инженер", cost_specialist_hour_cost: 1500, cost_specialist_hour_count: 10, cost_service_type: null },
    { stage_number: 2, stage_name: "Первый год", cost_number: 3, cost_name: "Публичное облако", cost_date_start: "01.03.2025", cost_date_end: "-", cost_type: "Внутренние продукты", cost_period: "Ежемесячный", cost_deprecation: null, cost_cost: 50000, cost_cost_for_client: 62500, cost_departamenet: null, cost_specialist_grade: null, cost_specialist_hour_cost: null, cost_specialist_hour_count: null, cost_service_type: "Colocation" },
    { stage_number: 3, stage_name: "Второй год", cost_number: 1, cost_name: "Расходники", cost_date_start: "01.01.2025", cost_date_end: "-", cost_type: "Внешние закупки", cost_period: "Ежегодный", cost_deprecation: 12, cost_cost: 500000, cost_cost_for_client: 625000, cost_departamenet: null, cost_specialist_grade: null, cost_specialist_hour_cost: null, cost_specialist_hour_count: null, cost_service_type: null },
    { stage_number: 3, stage_name: "Второй год", cost_number: 2, cost_name: "Поддержка", cost_date_start: "01.03.2025", cost_date_end: "-", cost_type: "ФОТ", cost_period: "Ежемесячный", cost_deprecation: null, cost_cost: 30000, cost_cost_for_client: 37500, cost_departamenet: "Эксплуатация", cost_specialist_grade: "Старший инженер", cost_specialist_hour_cost: 3000, cost_specialist_hour_count: 10, cost_service_type: null },
    { stage_number: 3, stage_name: "Второй год", cost_number: 3, cost_name: "Публичное облако", cost_date_start: "01.03.2025", cost_date_end: "-", cost_type: "Внутренние продукты", cost_period: "Ежемесячный", cost_deprecation: null, cost_cost: 50000, cost_cost_for_client: 62500, cost_departamenet: null, cost_specialist_grade: null, cost_specialist_hour_cost: null, cost_specialist_hour_count: null, cost_service_type: "Colocation" },
]

const grades_list = [
    { "Отдел": "Эксплуатация", "Грейд": "Младший инженер", "Стоимость часа": 1000 },
    { "Отдел": "Эксплуатация", "Грейд": "Инженер", "Стоимость часа": 1500 },
    { "Отдел": "Эксплуатация", "Грейд": "Старший инженер", "Стоимость часа": 2500 },
    { "Отдел": "Информационная безопасность", "Грейд": "Младший инженер", "Стоимость часа": 1500 },
    { "Отдел": "Информационная безопасность", "Грейд": "Инженер", "Стоимость часа": 2500 },
    { "Отдел": "Информационная безопасность", "Грейд": "Старший инженер", "Стоимость часа": 5000 },
    { "Отдел": "Сетевой отдел", "Грейд": "Младший инженер", "Стоимость часа": 1500 },
    { "Отдел": "Сетевой отдел", "Грейд": "Инженер", "Стоимость часа": 2000 },
    { "Отдел": "Сетевой отдел", "Грейд": "Старший инженер", "Стоимость часа": 3000 },
];

const team_members = [
    "КАМ",
    "Директор центра",
    "Рассчетный центр",
    "Администратор проекта",
    "ЦОСП",
    "ЦТСП",
    "Договорной центр",
    "СКЭ"
]

const contract_types = [
    "ПАО",
    "Прямая продажа",
    "Внутренняя перепродажа",
    "ЦТ"
]

const external_cost_types = [
    "Оборудование", "Расходники", "Программное обеспечение"
]

const cost_periods = [
    "Разовое", "Ежемесячно", "Ежеквартально", "Ежегодно"
]

const fot_departments = [
    "Эксплуатация", "Информационная безопасность", "Сетевой отдел"
]

const fot_grades = [
    "Младший инженер", "Инженер", "Старший инженер"
]

const internal_service_types = [
    "IaaS", "Colocation", "Unit-Colo"
]

const stage_period_types = [
    "Месяц", "Квартал"
]

const table_constants = [
    { id: 1, constant_type: "economic", constant_name: "Процентная ставка", constant_count: 7.5, constant_metric: "%", constant_subtype: "-" },
    { id: 2, constant_type: "economic", constant_name: "Курс доллара", constant_count: 90, constant_metric: "руб.", constant_subtype: "-" },
    { id: 3, constant_type: "economic", constant_name: "Накладные расходы", constant_count: 15, constant_metric: "%", constant_subtype: "-" },
    { id: 4, constant_type: "vgo_indicators", constant_name: "Первый год", constant_count: 25, constant_metric: "%", constant_subtype: "Меморандум \"Публичное облако\"" },
    { id: 5, constant_type: "vgo_indicators", constant_name: "После первого года", constant_count: 35, constant_metric: "%", constant_subtype: "Меморандум \"Публичное облако\"" },
    { id: 6, constant_type: "vgo_indicators", constant_name: "Первый год", constant_count: 20, constant_metric: "%", constant_subtype: "Меморандум \"Colocation\"" },
    { id: 7, constant_type: "vgo_indicators", constant_name: "После первого года", constant_count: 30, constant_metric: "%", constant_subtype: "Меморандум \"Colocation\"" },
    { id: 8, constant_type: "vgo_indicators", constant_name: "Рамочный договор ПАО - ЦХД \"Облако-КИИ\"", constant_count: 5, constant_metric: "%", constant_subtype: "-" },
    { id: 9, constant_type: "vgo_indicators", constant_name: "Перепродажа внутри АО ЦХД", constant_count: 10, constant_metric: "%", constant_subtype: "-" },
    { id: 10, constant_type: "data_for_calc", constant_name: "Минимальный срок амортизации оборудования", constant_count: 36, constant_metric: "мес.", constant_subtype: "Минимальные показатели экономической эффективности проекта" },
    { id: 11, constant_type: "data_for_calc", constant_name: "Net Profit Margin", constant_count: 15, constant_metric: "%", constant_subtype: "Минимальные показатели экономической эффективности проекта" },
    { id: 12, constant_type: "data_for_calc", constant_name: "ПНК-1", constant_count: 7.5, constant_metric: "руб. / кВт", constant_subtype: "Стоимость электроэнергии" },
    { id: 13, constant_type: "data_for_calc", constant_name: "ПНК-2", constant_count: 8.2, constant_metric: "руб. / кВт", constant_subtype: "Стоимость электроэнергии" },
    { id: 14, constant_type: "data_for_calc", constant_name: "NORD", constant_count: 6.8, constant_metric: "руб. / кВт", constant_subtype: "Стоимость электроэнергии" },
    { id: 15, constant_type: "data_for_calc", constant_name: "OST", constant_count: 7.1, constant_metric: "руб. / кВт", constant_subtype: "Стоимость электроэнергии" }
]; 