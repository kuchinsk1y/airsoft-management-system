# Как использовать сиды (seeds)

## 📋 Доступные сиды

В проекте есть следующие сиды:

1. **seed:admin** - Создает администратора
2. **seed:cities** - Создает города
3. **seed:teams** - Создает команды и пользователей
4. **seed:products** - Создает продукты
5. **seed:events** - Создает события
6. **seed:template** - Создает шаблоны
7. **seed:ratings** - Создает результаты событий и рейтинги ⭐ **НОВЫЙ**

## 🚀 Как запустить сиды

### Запуск отдельного сида

```bash
# Из корня проекта
npm run seed:ratings --workspace=api

# Или из папки apps/api
cd apps/api
npm run seed:ratings
```

### Запуск всех сидов (полная настройка БД)

```bash
# Из корня проекта
npm run setup:db --workspace=api

# Или из папки apps/api
cd apps/api
npm run setup:db
```

Этот скрипт выполнит:
1. Генерацию Prisma Client
2. Применение миграций
3. Запуск всех сидов по порядку:
   - admin
   - cities
   - teams
   - products
   - events
   - template
   - ratings

## 📝 Порядок запуска сидов

**Важно:** Сиды нужно запускать в правильном порядке, так как они зависят друг от друга:

1. ✅ **seed:admin** - создает администратора (независимый)
2. ✅ **seed:cities** - создает города (независимый)
3. ✅ **seed:teams** - создает команды и пользователей (зависит от cities)
4. ✅ **seed:products** - создает продукты (зависит от cities)
5. ✅ **seed:events** - создает события (зависит от cities, admin)
6. ✅ **seed:template** - создает шаблоны (независимый)
7. ✅ **seed:ratings** - создает рейтинги (зависит от events, teams)

## 🎯 Сид рейтингов (seed:ratings)

### Что делает:

1. **Находит завершенные события** или помечает некоторые как завершенные
2. **Создает результаты событий** для участников:
   - Для командных событий → результаты для команд
   - Для индивидуальных событий → результаты для игроков
   - Генерирует случайную статистику (убийства, смерти, точность)
   - Рассчитывает очки по формуле
   - Помечает результаты как подтвержденные (CONFIRMED)

3. **Обновляет статистику игроков**:
   - Подсчитывает игры, победы, поражения, ничьи
   - Рассчитывает общие очки, средние очки, win rate
   - Рассчитывает K/D ratio и точность

4. **Обновляет статистику команд**:
   - Подсчитывает игры и победы
   - Рассчитывает общие очки и win rate

5. **Пересчитывает рейтинги**:
   - Сортирует игроков/команды по totalPoints
   - Присваивает ранги (1, 2, 3, ...)

### Требования:

Перед запуском `seed:ratings` должны быть выполнены:
- ✅ `seed:events` - для создания событий
- ✅ `seed:teams` - для создания команд и пользователей
- ✅ Пользователи должны быть зарегистрированы на события (через `seed:events`)

### Пример вывода:

```
🌱 Starting ratings seed...
⚠️  No completed events found. Marking some events as completed...
📅 Found 5 events to process
🧹 Cleared existing event results
✅ Created 15 event results
📊 Updating player statistics...
✅ Updated 8 player statistics
👥 Updating team statistics...
✅ Updated 3 team statistics
🏆 Calculating ranks...
✅ Calculated ranks for 8 players
✅ Calculated ranks for 3 teams
🎉 Ratings seed completed successfully!
```

## 🔄 Перезапуск сидов

### Очистка и перезапуск всех сидов:

```bash
# Остановить проект
# Удалить базу данных
docker-compose down -v

# Запустить базу данных заново
docker-compose up -d

# Применить миграции и запустить все сиды
npm run setup:db --workspace=api
```

### Перезапуск только рейтингов:

```bash
# Сид автоматически очищает существующие результаты перед созданием новых
npm run seed:ratings --workspace=api
```

## ⚙️ Настройка сида рейтингов

Если нужно изменить параметры генерации данных, отредактируйте файл:
`apps/api/src/seeds/seed-ratings.ts`

### Параметры генерации:

```typescript
// Для команд
const kills = Math.floor(Math.random() * 20) + 5;      // 5-25 убийств
const deaths = Math.floor(Math.random() * 10) + 2;     // 2-12 смертей
const accuracy = Math.random() * 30 + 60;               // 60-90% точность

// Для игроков
const kills = Math.floor(Math.random() * 15) + 3;       // 3-18 убийств
const deaths = Math.floor(Math.random() * 8) + 1;      // 1-9 смертей
const accuracy = Math.random() * 25 + 65;              // 65-90% точность
```

## 🐛 Решение проблем

### Ошибка: "No completed events found"

**Причина:** Нет завершенных событий с регистрациями

**Решение:**
1. Убедитесь, что запущен `seed:events`
2. Убедитесь, что события имеют одобренные регистрации
3. Сид автоматически пометит некоторые события как завершенные

### Ошибка: "Connection url is empty"

**Причина:** Не настроен `.env` файл

**Решение:**
```bash
cd apps/api
cp env.example .env
# Отредактируйте .env и укажите DATABASE_URL
```

### Ошибка: "Cannot find module"

**Причина:** Не установлены зависимости

**Решение:**
```bash
npm install
npm run prisma:generate --workspace=api
```

## 📚 Дополнительная информация

- Все сиды находятся в `apps/api/src/seeds/`
- Сиды используют Prisma Client для работы с БД
- Сиды можно запускать многократно (используют `upsert` где возможно)
- Сид рейтингов очищает существующие результаты перед созданием новых
