# Page Snapshot Backend API

NestJS API сервер для приема снимков веб-страниц от Chrome расширения и конвертации их в Markdown формат.

## Назначение

Backend API обрабатывает данные, полученные от Chrome расширения:
- **Принимает снимки страниц** — полный HTML контент с метаданными
- **Сохраняет данные** — в файловом хранилище с контрольными суммами
- **Конвертирует в Markdown** — через систему плагинов для удобного просмотра
- **Предоставляет API** — для frontend приложения

## Как настроить

### Требования
- Node.js 18+
- npm или yarn
- Права на запись в папку хранения

### Установка

1. **Перейдите в папку backend:**
   ```bash
   cd app/backend
   ```

2. **Установите зависимости:**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   **Примечание:** Флаг `--legacy-peer-deps` необходим из-за конфликта версий между @nestjs/swagger@7.4.0 и NestJS 11. Это безопасно, так как API совместимы.

3. **Настройте переменные окружения:**
   ```bash
   cp env.config .env
   ```

4. **Отредактируйте .env файл:**
   ```bash
   # Путь к папке хранения снимков
   SNAPSHOT_STORAGE_PATH=./storage/snapshots
   
   # Лимит размера запросов (по умолчанию 50mb)
   REQUEST_SIZE_LIMIT=50mb
   
   # Порт сервера (по умолчанию 3000)
   PORT=3000
   ```

### Настройка хранения

**SNAPSHOT_STORAGE_PATH** — путь к папке для сохранения снимков:

- `./storage/snapshots` — относительный путь (по умолчанию)
- `C:\snapshots` — абсолютный путь на Windows
- `/var/snapshots` — абсолютный путь на Linux/Mac

**Важно:**
- Папка создается автоматически при первом сохранении
- Убедитесь, что у приложения есть права на запись
- Используйте абсолютные пути для продакшена

## Как запустить

### Режим разработки
```bash
npm run start:dev
```

### Режим отладки
```bash
npm run start:debug
```

### Продакшен
```bash
npm run build
npm run start:prod
```

Сервер запустится на `http://localhost:3000` (или указанном в PORT)

## Как использовать

### Swagger документация

Swagger документация включена по умолчанию и доступна по адресу:
- **URL**: `http://localhost:3000/api/docs`
- **Описание**: Интерактивная документация API с возможностью тестирования endpoints
- **Статус**: Автоматически генерируется из TypeScript декораторов

#### Возможности Swagger

- **Автоматическая генерация** — документация создается из кода
- **Интерактивное тестирование** — можно тестировать API в браузере
- **Валидация** — проверка типов и форматов
- **Примеры** — готовые примеры запросов и ответов
- **Синхронизация** — документация всегда актуальна

#### Экспорт спецификации

```bash
# Получить OpenAPI JSON
curl http://localhost:3000/api/docs-json

# Получить OpenAPI YAML
curl http://localhost:3000/api/docs-yaml
```

### API Endpoints

**Доступные endpoints:**
- `POST /api/snapshot` — принимает снимки страниц от Chrome расширения
- `GET /api/md` — конвертирует сохраненный HTML в Markdown формат

**Детальная документация:** Все endpoints с примерами запросов/ответов, схемами данных и возможностью тестирования доступны в [Swagger UI](http://localhost:3000/api/docs).

### Система плагинов

Backend использует модульную систему плагинов для конвертации HTML в Markdown:

**Структура:**
```
plugins/
├── custom/          # Пользовательские плагины
└── standard/        # Системные плагины
    ├── hh.vacancy.plugin.ts
    └── zzz-title.plugin.ts
```

**Порядок выполнения:**
1. Пользовательские плагины (приоритет)
2. Системные плагины (fallback)
3. Алфавитный порядок внутри категории
4. Остановка при первом успехе

**Создание плагина:**
```typescript
// plugins/custom/my-plugin.plugin.ts
import { MarkdownPlugin } from '../../src/markdown/markdown-plugin.interface';

export class MyPlugin implements MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null {
    // Ваша логика обработки HTML
    return markdownResult; // или null
  }
}
```

### Структура данных

**Сохранение файлов:**
- `{SNAPSHOT_STORAGE_PATH}/index.html` — исходный HTML
- `{SNAPSHOT_STORAGE_PATH}/data.json` — метаданные (ID, URL, заголовок, временные метки, контрольная сумма)

**Контрольные суммы:** SHA-256 хэш для проверки целостности данных и обнаружения дубликатов.

## Архитектура

**Модули:** AppModule, SnapshotModule, MarkdownModule, SharedModule

**Сервисы:** FileStorageService, SnapshotService, MarkdownService, PluginLoaderService

**Валидация:** URL, timestamp (ISO 8601), обязательные поля

## Безопасность

**CORS** настроен для Chrome расширения, **валидация** всех входящих данных, **лимиты** размера запросов, **контрольные суммы** для проверки целостности.

## Производительность

**Лимит запросов** настраивается через `REQUEST_SIZE_LIMIT`, **синхронная обработка** плагинов, **файловое хранилище** для быстрого доступа, **без кеширования** (реальное время).

## Устранение проблем

**Установка:** При конфликтах версий используйте `npm install --legacy-peer-deps`

**Сохранение:** Проверьте права на запись в `SNAPSHOT_STORAGE_PATH` и наличие места на диске

**Конвертация:** Убедитесь, что снимок сохранен через `POST /api/snapshot` и плагины существуют в `plugins/standard/`

**CORS:** Проверьте, что Chrome расширение отправляет запросы на правильный порт

## Разработка

**Команды:** `npm run start:dev`, `npm run start:debug`, `npm run build`, `npm run test`, `npm run lint`

**Технологии:** NestJS 11, TypeScript 5, class-validator, Express, @nestjs/swagger

**Swagger:** Документация и тестирование API доступны по адресу `/api/docs`
