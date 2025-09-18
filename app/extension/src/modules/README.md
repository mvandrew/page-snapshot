# Модули Chrome Extension

Организованная структура модулей по зонам ответственности согласно best practices для Chrome расширений.

## Структура

```
src/modules/
├── shared/          # Общие модули для всех частей расширения
├── background/      # Модули для background script (Service Worker)
├── content/         # Модули для content script
├── utils/           # Утилиты и вспомогательные функции
└── index.js         # Главный экспорт всех модулей
```

## Зоны ответственности

### Shared модули
- **Logger**: Централизованное логирование
- **SettingsManager**: Управление настройками
- **DomainValidator**: Валидация доменов
- **HttpClient**: HTTP клиент

### Background модули
- **BackgroundController**: Главный координатор
- **AutoSaveManager**: Автоматическое сохранение
- **NotificationManager**: Уведомления

### Content модули
- **ContentProcessor**: Обработка контента страниц

## Использование

### Импорт всех модулей
```javascript
import * as modules from './src/modules/index.js';
```

### Импорт модулей по зонам
```javascript
// Только shared модули
import { logger, settingsManager } from './src/modules/shared/index.js';

// Только background модули
import { BackgroundController } from './src/modules/background/index.js';

// Только content модули
import { ContentProcessor } from './src/modules/content/index.js';
```

### Импорт конкретного модуля
```javascript
import { Logger } from './src/modules/shared/logger.js';
```

## Принципы организации

1. **Разделение ответственности**: Каждая зона отвечает за свою область
2. **Минимальные зависимости**: Shared модули не зависят от других зон
3. **Единообразие**: Общие паттерны и интерфейсы
4. **Масштабируемость**: Легко добавлять новые модули
5. **Производительность**: Оптимизированная загрузка модулей
