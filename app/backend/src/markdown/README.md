# Markdown Module

Модуль для конвертации HTML файлов в Markdown через систему плагинов.

## API Endpoint

### GET /api/md

Конвертирует активный HTML файл в Markdown формат.

**Параметры:** отсутствуют

**Ответ:**
- **Успех (200):** Markdown контент в формате plain text
- **Ошибка:** JSON с описанием ошибки и соответствующим HTTP статус кодом

**Пример запроса:**
```bash
curl http://localhost:3000/api/md
```

**Пример успешного ответа (200 OK):**
```
Content-Type: text/plain; charset=utf-8

# Заголовок страницы
```

**Пример ответа при ошибке (404 Not Found):**
```json
{
  "success": false,
  "message": "HTML файл не найден",
  "error": "Error",
  "timestamp": "2025-09-21T08:50:54.000Z"
}
```

**Возможные HTTP статус коды:**
- `200 OK` - успешная конвертация
- `404 Not Found` - HTML файл не найден
- `503 Service Unavailable` - нет доступных плагинов для обработки
- `500 Internal Server Error` - ошибка доступа к файлу или другая внутренняя ошибка

## Система плагинов

### Архитектура

Плагины реализуют интерфейс `MarkdownPlugin`:

```typescript
interface MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null;
}
```

### Порядок выполнения

1. **Пользовательские плагины** (`plugins/custom/`) - приоритет
2. **Системные плагины** (`plugins/standard/`) - fallback
3. **Алфавитный порядок** внутри каждой категории
4. **Остановка при первом успехе** - как только плагин возвращает непустой результат

### Структура каталогов

```
plugins/
├── custom/          # Пользовательские плагины (исключены из git)
└── standard/        # Системные плагины (под контролем git)
    └── zzz-title.plugin.ts  # Плагин по умолчанию
```

### Стандартный плагин

**Файл:** `plugins/standard/zzz-title.plugin.ts`

**Функция:** извлекает заголовок страницы из тега `<title>` и добавляет ссылку на оригинальную страницу

**Возврат:** `# {заголовок}\n\n[Открыть оригинал]({url})` или `null` если тег отсутствует

## Создание собственного плагина

1. Создайте файл в `plugins/custom/` с суффиксом `.plugin.ts`
2. Реализуйте интерфейс `MarkdownPlugin`:

```typescript
import { MarkdownPlugin } from '../../src/markdown/markdown-plugin.interface';
import * as fs from 'fs';

export class MyCustomPlugin implements MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null {
    try {
      const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
      
      // Ваша логика обработки HTML
      // pageUrl содержит URL сохраненной страницы из data.json
      // ...
      
      return markdownResult; // или null если не удалось обработать
    } catch (error) {
      console.error('Ошибка в плагине:', error.message);
      return null;
    }
  }
}
```

## Обработка ошибок

- Все ошибки логируются в консоль сервера
- Если ни один плагин не смог обработать файл, возвращается HTTP 500
- Плагины, которые выбрасывают исключения, пропускаются

## Производительность

- Синхронная обработка в реальном времени
- Кеширование не используется
- Размер файла ограничен параметром `REQUEST_SIZE_LIMIT`
