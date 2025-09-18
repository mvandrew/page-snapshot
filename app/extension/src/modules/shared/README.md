# Shared модули

Общие модули, которые могут использоваться в любой части расширения (background, content, popup, options).

## Модули

### Logger (`logger.js`)
Централизованная система логирования с единообразным форматированием и управлением уровнями.

**Использование:**
```javascript
import { logger } from './shared/index.js';

logger.info('Информационное сообщение');
logger.error('Ошибка:', error);
logger.debug('Отладочная информация');
```

### SettingsManager (`settings-manager.js`)
Управление настройками расширения с валидацией, миграцией и синхронизацией.

**Использование:**
```javascript
import { settingsManager } from './shared/index.js';

const settings = await settingsManager.getSettings();
await settingsManager.updateSettings({ enableAutoSave: true });
```

### DomainValidator (`domain-validator.js`)
Валидация URL на соответствие доменам из настроек.

**Использование:**
```javascript
import { domainValidator } from './shared/index.js';

const isValid = await domainValidator.checkDomainMatch(url, domains);
```

### HttpClient (`http-client.js`)
HTTP клиент для отправки запросов к backend сервису.

**Использование:**
```javascript
import { httpClient } from './shared/index.js';

const result = await httpClient.savePageContent(serviceUrl, content, options);
```

## Принципы

- **Переиспользование**: Модули могут использоваться в любой части расширения
- **Независимость**: Минимальные зависимости между модулями
- **Единообразие**: Общие паттерны и интерфейсы
- **Производительность**: Оптимизированы для работы в разных контекстах
