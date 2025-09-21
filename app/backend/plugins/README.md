# Система плагинов для конвертации HTML в Markdown

## Обзор

Система плагинов позволяет расширять функциональность конвертации HTML в Markdown через модульную архитектуру. Плагины загружаются автоматически и выполняются в определенном порядке.

## Структура каталогов

```
plugins/
├── custom/          # Пользовательские плагины (исключены из git)
│   └── .gitignore   # Исключает все файлы из git
└── standard/        # Системные плагины (под контролем git)
    └── zzz-title.plugin.ts  # Плагин по умолчанию
```

## Порядок выполнения плагинов

1. **Пользовательские плагины** (`plugins/custom/`) - высший приоритет
2. **Системные плагины** (`plugins/standard/`) - fallback
3. **Алфавитный порядок** внутри каждой категории
4. **Остановка при первом успехе** - как только плагин возвращает непустой результат

## Интерфейс плагина

Все плагины должны реализовывать интерфейс `MarkdownPlugin`:

```typescript
interface MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null;
}
```

### Параметры

- `htmlFilePath` - путь к HTML файлу для обработки
- `pageUrl` - URL сохраненной страницы из data.json

### Возвращаемое значение

- `string` - Markdown код, если плагин успешно обработал файл
- `null` - если плагин не может обработать файл

## Создание плагина

### 1. Создайте файл плагина

Создайте файл в соответствующей папке с суффиксом `.plugin.ts`:

- `plugins/custom/my-plugin.plugin.ts` - пользовательский плагин
- `plugins/standard/another-plugin.plugin.ts` - системный плагин

### 2. Реализуйте интерфейс

```typescript
import { MarkdownPlugin } from '../../src/markdown/markdown-plugin.interface';
import * as fs from 'fs';

export class MyPlugin implements MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null {
    try {
      // Читаем HTML файл
      const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
      
      // Ваша логика обработки HTML
      // pageUrl содержит URL сохраненной страницы из data.json
      // ...
      
      // Возвращаем результат или null
      return markdownResult;
    } catch (error) {
      console.error('Ошибка в плагине:', error.message);
      return null;
    }
  }
}
```

### 3. Пересоберите проект

```bash
npm run build
```

## Стандартные плагины

### zzz-title.plugin.ts

Извлекает заголовок страницы из тега `<title>` и возвращает его в формате Markdown:

```html
<title>Мой заголовок</title>
```

Результат:
```markdown
# Мой заголовок
```

## Обработка ошибок

- Все ошибки в плагинах логируются в консоль
- Плагины, которые выбрасывают исключения, пропускаются
- Если ни один плагин не смог обработать файл, возвращается ошибка

## Примеры использования

### Извлечение заголовков

```typescript
export class HeadersPlugin implements MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Ищем все заголовки h1-h6
    const headers = htmlContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
    
    if (headers && headers.length > 0) {
      let result = headers
        .map(header => {
          const level = header.match(/<h([1-6])/)?.[1] || '1';
          const text = header.replace(/<[^>]*>/g, '').trim();
          return '#'.repeat(parseInt(level)) + ' ' + text;
        })
        .join('\n\n');
      
      // Добавляем ссылку на оригинальную страницу
      if (pageUrl) {
        result += `\n\n[Открыть оригинал](${pageUrl})`;
      }
      
      return result;
    }
    
    return null;
  }
}
```

### Извлечение ссылок

```typescript
export class LinksPlugin implements MarkdownPlugin {
  convert(htmlFilePath: string, pageUrl: string): string | null {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    const links = htmlContent.match(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi);
    
    if (links && links.length > 0) {
      let result = links
        .map(link => {
          const href = link.match(/href="([^"]+)"/)?.[1] || '';
          const text = link.replace(/<[^>]*>/g, '').trim();
          return `[${text}](${href})`;
        })
        .join('\n');
      
      // Добавляем ссылку на оригинальную страницу
      if (pageUrl) {
        result += `\n\n[Открыть оригинал](${pageUrl})`;
      }
      
      return result;
    }
    
    return null;
  }
}
```

## Отладка

Для отладки плагинов используйте консольные логи:

```typescript
console.log(`[MyPlugin] Обрабатываем файл: ${htmlFilePath}`);
console.log(`[MyPlugin] Найден контент: ${content}`);
```

Логи будут видны в консоли сервера при выполнении API запросов.
