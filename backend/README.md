# Financial Portal Backend

Backend API для финансового портала на Node.js с Express и MySQL.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Скопируйте `env.example` в `.env` и настройте параметры:
```bash
cp env.example .env
```

Отредактируйте `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=finportal_user
DB_PASSWORD=your_secure_password
DB_NAME=finportal_db

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://90.156.155.229:8080
```

### 3. Инициализация базы данных
```bash
node init-db.js
```

### 4. Запуск сервера
```bash
# Production
npm start

# Development
npm run dev
```

## 📊 Структура базы данных

### Таблицы:
- **users** - Пользователи системы
- **projects** - Проекты
- **project_stages** - Этапы проектов
- **project_costs** - Затраты проектов
- **constants** - Константы системы

### Пользователи по умолчанию:
- `admin/admin123` - Администратор
- `kam1/kam123` - Иван Петров (КАМ)
- `calc1/calc123` - Мария Сидорова (Менеджер расчетов)
- `ce1/ce123` - Алексей Козлов (Менеджер эффективности)

## 🔌 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/verify` - Проверка токена
- `GET /api/auth/users` - Список пользователей

### Проекты
- `GET /api/projects` - Список проектов
- `GET /api/projects/:projectId` - Детали проекта
- `POST /api/projects` - Создание проекта
- `PUT /api/projects/:projectId` - Обновление проекта
- `DELETE /api/projects/:projectId` - Удаление проекта

### Затраты
- `GET /api/costs/:projectId` - Затраты проекта
- `POST /api/costs/:projectId` - Сохранение затрат
- `POST /api/costs/:projectId/stages` - Добавление этапа
- `DELETE /api/costs/:projectId/stages/:stageNumber` - Удаление этапа

### Константы
- `GET /api/constants` - Список констант
- `GET /api/constants/:constantId` - Детали константы
- `POST /api/constants` - Создание константы
- `PUT /api/constants/:constantId` - Обновление константы
- `DELETE /api/constants/:constantId` - Удаление константы
- `POST /api/constants/init` - Инициализация констант по умолчанию

### Система
- `GET /api/health` - Проверка состояния сервера

## 🔒 Безопасность

- JWT аутентификация
- Хеширование паролей (bcrypt)
- CORS настройки
- Rate limiting
- Helmet для безопасности заголовков

## 🛠 Разработка

### Структура проекта:
```
backend/
├── config/
│   └── database.js      # Конфигурация БД
├── routes/
│   ├── auth.js          # Аутентификация
│   ├── projects.js      # Проекты
│   ├── costs.js         # Затраты
│   └── constants.js     # Константы
├── server.js            # Основной сервер
├── init-db.js           # Инициализация БД
├── package.json
└── README.md
```

### Логирование:
- Логи ошибок в консоль
- Возможность подключения внешних логгеров

## 🚀 Развертывание

### На сервере:
1. Установите Node.js и npm
2. Скопируйте файлы бэкенда
3. Настройте `.env`
4. Запустите `node init-db.js`
5. Запустите `npm start`

### С PM2:
```bash
npm install -g pm2
pm2 start server.js --name finportal-backend
pm2 save
pm2 startup
```

## 📝 Лицензия

MIT 