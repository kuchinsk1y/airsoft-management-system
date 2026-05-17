# Система рейтингов для пользователей и команд

## 📋 Анализ текущего состояния

### Что уже есть:
1. **PlayerStats** - модель статистики игроков с полями:
   - `gamesPlayed` - количество игр
   - `wins` - количество побед
   - `points` - очки
   - `accuracy` - точность
   - `kdRatio` - K/D ratio
   - `rank` - рейтинг (но не обновляется автоматически)

2. **EventRegistration** - регистрации на события:
   - Связывает пользователей/команды с событиями
   - Имеет статусы (PENDING, APPROVED, REJECTED, CANCELLED)
   - Поддерживает индивидуальные и командные события

3. **TeamMember** - участники команд:
   - `teamContribution` - вклад в команду
   - Связь с пользователями и командами

### Что отсутствует:
1. ❌ Модель для хранения результатов событий (EventResult)
2. ❌ Модель статистики команд (TeamStats)
3. ❌ Автоматическое обновление рейтингов
4. ❌ API endpoints для получения рейтингов/лидербордов
5. ❌ UI компоненты для отображения рейтингов
6. ❌ Система расчета рейтингов на основе результатов

---

## 🎯 Предлагаемая архитектура

### 1. База данных (Prisma Schema)

#### 1.1. Новая модель EventResult
```prisma
enum EventResultStatus {
  PENDING
  CONFIRMED
  DISPUTED
}

enum EventPlacement {
  FIRST
  SECOND
  THIRD
  PARTICIPATED
}

model EventResult {
  id              Int       @id @default(autoincrement())
  eventId         Int
  userId          Int?      // Для индивидуальных событий
  teamId          Int?      // Для командных событий
  placement       EventPlacement
  points          Int       @default(0)
  kills           Int?      @default(0)
  deaths          Int?      @default(0)
  accuracy        Decimal?  @db.Decimal(5, 2)
  status          EventResultStatus @default(PENDING)
  confirmedAt     DateTime?
  confirmedBy     Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  event           Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user            User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  team            Team?     @relation(fields: [teamId], references: [id], onDelete: SetNull)
  confirmer       User?     @relation("EventResultConfirmer", fields: [confirmedBy], references: [id], onDelete: SetNull)

  @@unique([eventId, userId])
  @@unique([eventId, teamId])
  @@index([eventId])
  @@index([userId])
  @@index([teamId])
  @@index([placement])
  @@index([points])
  @@map("EventResults")
}
```

#### 1.2. Новая модель TeamStats
```prisma
model TeamStats {
  teamId          Int       @id
  gamesPlayed     Int       @default(0)
  wins            Int       @default(0)
  totalPoints     Int       @default(0)
  averagePoints   Decimal?  @db.Decimal(10, 2)
  winRate         Decimal?  @db.Decimal(5, 2)
  rank            Int?
  updatedAt       DateTime  @updatedAt

  team            Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([totalPoints])
  @@index([rank])
  @@index([winRate])
  @@map("TeamStats")
}
```

#### 1.3. Обновление существующих моделей

**Event:**
```prisma
model Event {
  // ... существующие поля
  results         EventResult[]
  isCompleted     Boolean   @default(false)
  completedAt     DateTime?
}
```

**User:**
```prisma
model User {
  // ... существующие поля
  eventResults    EventResult[]
  confirmedResults EventResult[] @relation("EventResultConfirmer")
}
```

**Team:**
```prisma
model Team {
  // ... существующие поля
  stats           TeamStats?
  eventResults    EventResult[]
}
```

**PlayerStats - улучшения:**
```prisma
model PlayerStats {
  userId          Int       @id
  gamesPlayed     Int       @default(0)
  wins            Int       @default(0)
  losses          Int       @default(0)  // НОВОЕ
  draws           Int       @default(0)  // НОВОЕ
  points          Int       @default(0)
  totalPoints     Int       @default(0)  // НОВОЕ - накопленные за все время
  averagePoints   Decimal?  @db.Decimal(10, 2)  // НОВОЕ
  accuracy        Decimal?  @db.Decimal(5, 2)
  kdRatio         Decimal?  @db.Decimal(5, 2)
  winRate         Decimal?  @db.Decimal(5, 2)  // НОВОЕ
  rank            Int?
  previousRank    Int?      // НОВОЕ - для отслеживания изменений
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([points])
  @@index([totalPoints])
  @@index([rank])
  @@index([winRate])
  @@map("PlayerStats")
}
```

---

## 🔧 Backend изменения

### 2.1. Новый модуль Ratings

#### Структура модуля:
```
apps/api/src/ratings/
├── ratings.module.ts
├── ratings.controller.ts
├── ratings.service.ts
├── ratings-data.service.ts
├── player-ratings.service.ts
├── team-ratings.service.ts
├── event-results.service.ts
├── dto/
│   ├── event-result-request.dto.ts
│   ├── event-result-response.dto.ts
│   ├── player-rating-response.dto.ts
│   ├── team-rating-response.dto.ts
│   └── leaderboard-query.dto.ts
└── interfaces.ts
```

#### 2.2. EventResultsService

**Основные методы:**
- `createResult()` - создание результата события
- `updateResult()` - обновление результата
- `confirmResult()` - подтверждение результата админом
- `getEventResults()` - получение результатов события
- `calculateAndUpdateRatings()` - расчет и обновление рейтингов

**Логика расчета очков:**
```typescript
// Примерная формула
const POINTS_BY_PLACEMENT = {
  FIRST: 100,
  SECOND: 75,
  THIRD: 50,
  PARTICIPATED: 25
};

// Бонусы за статистику
const KILL_BONUS = 2;
const ACCURACY_BONUS_MULTIPLIER = 0.5;
```

#### 2.3. PlayerRatingsService

**Основные методы:**
- `updatePlayerStats()` - обновление статистики игрока
- `recalculatePlayerRank()` - пересчет рейтинга
- `getPlayerLeaderboard()` - получение таблицы лидеров
- `getPlayerRating()` - получение рейтинга конкретного игрока

**Алгоритм расчета рейтинга:**
1. Сортировка по `totalPoints` (desc)
2. Присвоение ранга на основе позиции
3. Учет `winRate` для игроков с одинаковыми очками

#### 2.4. TeamRatingsService

**Основные методы:**
- `updateTeamStats()` - обновление статистики команды
- `recalculateTeamRank()` - пересчет рейтинга команды
- `getTeamLeaderboard()` - получение таблицы лидеров команд
- `getTeamRating()` - получение рейтинга конкретной команды

**Особенности:**
- Статистика команды = сумма статистики всех активных участников
- Очки команды распределяются между участниками пропорционально вкладу

#### 2.5. RatingsController

**Endpoints:**
```typescript
// Результаты событий
POST   /events/:eventId/results          // Создать результат
PATCH  /events/:eventId/results/:resultId // Обновить результат
POST   /events/:eventId/results/:resultId/confirm // Подтвердить результат
GET    /events/:eventId/results           // Получить результаты события

// Рейтинги игроков
GET    /ratings/players                   // Таблица лидеров игроков
GET    /ratings/players/:userId           // Рейтинг конкретного игрока
GET    /ratings/players/me                // Мой рейтинг

// Рейтинги команд
GET    /ratings/teams                     // Таблица лидеров команд
GET    /ratings/teams/:teamId             // Рейтинг конкретной команды

// Общее
GET    /ratings/leaderboard               // Общая таблица (игроки + команды)
```

---

## 🎨 Frontend изменения

### 3.1. Новые компоненты

#### Компоненты рейтингов:
```
apps/web/src/components/Ratings/
├── Leaderboard.tsx              // Общая таблица лидеров
├── PlayerLeaderboard.tsx        // Таблица лидеров игроков
├── TeamLeaderboard.tsx          // Таблица лидеров команд
├── RatingCard.tsx                // Карточка рейтинга
├── RatingBadge.tsx               // Бейдж с рейтингом
├── PlayerRatingCard.tsx          // Карточка рейтинга игрока
├── TeamRatingCard.tsx            // Карточка рейтинга команды
└── RatingHistory.tsx             // История изменений рейтинга
```

#### Компоненты результатов событий:
```
apps/web/src/components/EventResults/
├── EventResultsForm.tsx          // Форма ввода результатов
├── EventResultsTable.tsx         // Таблица результатов
├── EventResultCard.tsx            // Карточка результата
└── EventResultModal.tsx           // Модальное окно результата
```

### 3.2. Новые страницы

```
apps/web/src/app/
├── ratings/
│   ├── page.tsx                   // Главная страница рейтингов
│   ├── players/
│   │   └── page.tsx               // Рейтинг игроков
│   └── teams/
│       └── page.tsx               // Рейтинг команд
└── events/
    └── [id]/
        └── results/
            └── page.tsx           // Результаты события
```

### 3.3. API Actions

```
apps/web/src/actions/
├── ratings.ts                      // Действия для рейтингов
└── event-results.ts                // Действия для результатов событий
```

**Примеры функций:**
```typescript
// ratings.ts
export async function getPlayerLeaderboard(params: {
  limit?: number;
  offset?: number;
  sortBy?: 'points' | 'rank' | 'winRate';
}) { ... }

export async function getTeamLeaderboard(params: {
  limit?: number;
  offset?: number;
  sortBy?: 'points' | 'rank' | 'winRate';
}) { ... }

export async function getPlayerRating(userId: number) { ... }

// event-results.ts
export async function createEventResult(
  eventId: number,
  data: EventResultRequest
) { ... }

export async function getEventResults(eventId: number) { ... }
```

### 3.4. Обновление существующих компонентов

**ProfileHeader.tsx:**
- Добавить отображение текущего рейтинга
- Добавить ссылку на страницу рейтингов

**MyTeamPage:**
- Добавить отображение рейтинга команды
- Показать рейтинги участников команды

**EventPage:**
- Добавить секцию результатов события
- Показать рейтинги участников события

---

## 📊 Best Practices

### 4.1. Производительность

1. **Индексы БД:**
   - Все поля для сортировки и фильтрации должны быть проиндексированы
   - Составные индексы для частых запросов

2. **Кэширование:**
   - Кэшировать таблицы лидеров (Redis)
   - TTL: 5-15 минут для актуальности

3. **Пагинация:**
   - Все списки рейтингов с пагинацией
   - Лимит: 50-100 записей на страницу

4. **Оптимизация запросов:**
   - Использовать `select` для получения только нужных полей
   - Избегать N+1 запросов (использовать `include` или `join`)

### 4.2. Безопасность

1. **Права доступа:**
   - Создание результатов - только админы/модераторы
   - Подтверждение результатов - только админы
   - Просмотр рейтингов - публично

2. **Валидация:**
   - Проверка корректности данных результатов
   - Защита от манипуляций с рейтингами

3. **Аудит:**
   - Логирование всех изменений рейтингов
   - История изменений для отката

### 4.3. UX/UI

1. **Визуализация:**
   - Анимации при изменении рейтинга
   - Индикаторы роста/падения
   - Графики истории рейтинга

2. **Информативность:**
   - Показывать не только рейтинг, но и статистику
   - Сравнение с другими игроками/командами
   - Прогресс до следующего ранга

3. **Мобильная версия:**
   - Адаптивные таблицы
   - Упрощенный вид на мобильных

### 4.4. Архитектура

1. **Разделение ответственности:**
   - Data Service - работа с БД
   - Business Service - бизнес-логика
   - Controller - HTTP обработка

2. **Обработка ошибок:**
   - Централизованная обработка ошибок
   - Понятные сообщения для пользователей

3. **Тестирование:**
   - Unit тесты для логики расчета рейтингов
   - E2E тесты для критических сценариев

---

## 🚀 План внедрения

### Этап 1: База данных (1-2 дня)
1. ✅ Создать миграции для новых моделей
2. ✅ Обновить существующие модели
3. ✅ Применить миграции

### Этап 2: Backend - Core (2-3 дня)
1. ✅ Создать модуль Ratings
2. ✅ Реализовать EventResultsService
3. ✅ Реализовать PlayerRatingsService
4. ✅ Реализовать TeamRatingsService
5. ✅ Создать контроллеры и DTO

### Этап 3: Backend - Integration (1-2 дня)
1. ✅ Интегрировать с Events модулем
2. ✅ Добавить автоматическое обновление рейтингов
3. ✅ Добавить хуки для обновления статистики

### Этап 4: Frontend - Core (2-3 дня)
1. ✅ Создать API actions
2. ✅ Создать компоненты рейтингов
3. ✅ Создать страницы рейтингов

### Этап 5: Frontend - Integration (1-2 дня)
1. ✅ Интегрировать в существующие страницы
2. ✅ Добавить компоненты результатов событий
3. ✅ Обновить профили и команды

### Этап 6: Testing & Polish (1-2 дня)
1. ✅ Тестирование функциональности
2. ✅ Оптимизация производительности
3. ✅ Улучшение UI/UX

**Общее время: 8-14 дней**

---

## 📝 Дополнительные рекомендации

### 5.1. Система достижений
Рассмотреть добавление системы достижений (badges) на основе рейтингов:
- "Топ-10 игроков"
- "Победитель 10 событий"
- "Команда месяца"

### 5.2. Сезонные рейтинги
Добавить сезонные рейтинги:
- Ежемесячные рейтинги
- Годовые рейтинги
- Сброс рейтингов в начале сезона

### 5.3. Уведомления
Уведомления о:
- Изменении рейтинга
- Достижении нового ранга
- Входе в топ-10/топ-100

### 5.4. Аналитика
Добавить аналитику:
- Графики изменения рейтинга
- Сравнение с другими игроками
- Прогноз рейтинга

---

## ✅ Чеклист реализации

### Backend
- [ ] Создать миграции Prisma
- [ ] Создать модуль Ratings
- [ ] Реализовать EventResultsService
- [ ] Реализовать PlayerRatingsService
- [ ] Реализовать TeamRatingsService
- [ ] Создать RatingsController
- [ ] Добавить DTO и валидацию
- [ ] Интегрировать с Events модулем
- [ ] Добавить автоматическое обновление рейтингов
- [ ] Написать тесты

### Frontend
- [ ] Создать API actions
- [ ] Создать компоненты рейтингов
- [ ] Создать страницы рейтингов
- [ ] Добавить компоненты результатов событий
- [ ] Обновить ProfileHeader
- [ ] Обновить MyTeamPage
- [ ] Обновить EventPage
- [ ] Добавить адаптивность
- [ ] Добавить анимации

### Документация
- [ ] Обновить API документацию
- [ ] Добавить примеры использования
- [ ] Создать руководство для админов
