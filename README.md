# StrikeShop

Monorepo проект с тремя приложениями для разработки:

- **API** - NestJS backend (порт 3101)
- **Web** - Next.js веб-приложение (порт 3100)
- **Admin** - Next.js админ-панель (порт 3200)

## 🚀 Пошаговая инструкция по запуску

> **Примечание:** Если у вас уже есть локальный репозиторий, переходите сразу к [Шагу 1: Установка зависимостей](#шаг-1-установка-зависимостей)

### Клонирование репозитория

Клонируйте репозиторий с веткой `dev`:

```bash
git clone -b dev https://github.com/strikeshopmanager/strike-shop.git
cd StrikeShop
```

### Шаг 1: Установка зависимостей

Установите все зависимости для всех проектов:

```bash
npm install
```

Это установит зависимости для:

- Корневого проекта (concurrently, prisma, typescript)
- apps/api (NestJS, Prisma, и т.д.)
- apps/web (Next.js, React, и т.д.)
- apps/admin (Next.js, React, и т.д.)

### Шаг 2: Настройка переменных окружения

#### 2.1. API (apps/api)

Создайте файл `.env` в папке `apps/api`:

```bash
# Windows PowerShell
Copy-Item apps\api\env.example apps\api\.env

# Linux/Mac
cp apps/api/env.example apps/api/.env
```

Все необходимые значения уже настроены в `env.example` и являются общими для команды.

#### 2.2. Web (apps/web)

Создайте файл `.env` в папке `apps/web`:

```bash
# Windows PowerShell
Copy-Item apps\web\env.example apps\web\.env

# Linux/Mac
cp apps/web/env.example apps/web/.env
```

Все необходимые значения уже настроены в `env.example`.

#### 2.3. Admin (apps/admin)

Создайте файл `.env` в папке `apps/admin`:

```bash
# Windows PowerShell
Copy-Item apps\admin\env.example apps\admin\.env

# Linux/Mac
cp apps/admin/env.example apps/admin/.env
```

Все необходимые значения уже настроены в `env.example`.

### Шаг 3: Запуск проекта

Просто запустите:

```bash
npm run dev
```

**Что произойдет автоматически:**

1. ✅ Запустятся базы данных (PostgreSQL и MongoDB) через Docker Compose
2. ✅ Применятся миграции Prisma
3. ✅ Сгенерируется Prisma Client
4. ✅ Заполнится база данных тестовыми данными (города, продукты, события, админ)
5. ✅ Запустятся все три приложения:
   - API на `http://localhost:3101`
   - Web на `http://localhost:3100`
   - Admin на `http://localhost:3200`

### Шаг 4: Проверка работы

1. **API Health Check:**
   - Откройте: `http://localhost:3101/health`
   - Должен вернуть статус API

2. **Web приложение:**
   - Откройте: `http://localhost:3100`
   - Должна открыться главная страница

3. **Admin панель:**
   - Откройте: `http://localhost:3200`
   - Должна открыться админ-панель

## 🔧 Полезные команды

### Запуск отдельных проектов

Если нужно запустить только один проект, есть два способа:

#### Способ 1: Из корня проекта (через workspace)

**API:**

```bash
npm run dev --workspace=api
```

**Web:**

```bash
npm run dev --workspace=web
```

**Admin:**

```bash
npm run dev --workspace=admin
```

#### Способ 2: Из папки проекта

**API:**

```bash
cd apps/api
npm run dev
```

**Web:**

```bash
cd apps/web
npm run dev
```

**Admin:**

```bash
cd apps/admin
npm run dev
```

**Важно:** При запуске отдельных проектов убедитесь, что базы данных запущены:

```bash
# Запуск в фоновом режиме (не блокирует терминал)
docker-compose up -d

# Или запуск с выводом логов (блокирует терминал)
docker-compose up
```

### Работа с базой данных

```bash
# Создать новую миграцию и применить её
npm run prisma:migrate:dev --workspace=api -- --name migration_name

# Применить существующие миграции к базе данных
npm run prisma:migrate:deploy --workspace=api

# Сгенерировать Prisma Client
npm run prisma:generate --workspace=api

# Открыть Prisma Studio (GUI для БД)
npx prisma studio --workspace=api

# Заполнить базу данных тестовыми данными
npm run setup:db --workspace=api
```

### Docker команды

```bash
# Запустить базы данных в фоновом режиме
docker-compose up -d

# Запустить базы данных с выводом логов
docker-compose up

# Остановить базы данных
docker-compose down

# Пересоздать базы данных (удалит все данные!)
docker-compose down -v
docker-compose up -d

# Посмотреть логи
docker-compose logs postgres
docker-compose logs mongo

# Проверить статус контейнеров
docker-compose ps
```

### Сборка проектов

```bash
# Собрать все проекты
npm run build

# Собрать конкретный проект
npm run build --workspace=api
npm run build --workspace=web
npm run build --workspace=admin
```

## 🔑 Учетные данные по умолчанию

После запуска `npm run dev` автоматически создается администратор:

- **Email:** `admin@example.com`
- **Password:** `Passw0rd!`
- **Nickname:** `admin`

## ⚠️ Решение проблем

### База данных не подключается

1. Проверьте, что Docker запущен:

   ```bash
   docker ps
   ```

2. Проверьте, что контейнеры работают:

   ```bash
   docker-compose ps
   ```

3. Пересоздайте базы данных:

   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

4. Попробуйте запустить проект снова:
   ```bash
   npm run dev
   ```

### Ошибки при миграциях

1. Убедитесь, что база данных запущена и доступна:

   ```bash
   docker-compose up -d
   ```

2. Проверьте `DATABASE_URL` в `apps/api/.env`:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/strikeshop?schema=public"
   ```

3. Попробуйте пересоздать миграции:
   ```bash
   npm run prisma:migrate:dev --workspace=api
   ```

### Порт занят

Если порт занят, освободите его:

1. Найдите процесс, использующий порт:

   ```bash
   # Windows
   netstat -ano | findstr :3101
   netstat -ano | findstr :3100
   netstat -ano | findstr :3200

   # Linux/Mac
   lsof -i :3101
   lsof -i :3100
   lsof -i :3200
   ```

2. Остановите процесс или освободите порт другим способом

**Важно:** Не меняйте порты в конфигурации - используйте стандартные порты проекта

### Docker контейнеры не запускаются

1. Проверьте, что Docker Desktop запущен
2. Проверьте, что порты 5432 и 27017 свободны
3. Остановите другие контейнеры, использующие эти порты:
   ```bash
   docker ps
   docker stop <container_id>
   ```

## 📚 Дополнительная информация

- **Prisma Studio:** `npx prisma studio --workspace=api` - GUI для работы с БД
- **Docker:** Используется для локальной разработки (PostgreSQL и MongoDB)
