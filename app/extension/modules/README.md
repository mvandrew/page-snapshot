# Модульная архитектура Chrome Extension

Этот каталог содержит модули для Chrome Extension, организованные согласно принципам SOLID и современным паттернам проектирования.

## Структура модулей

### 1. SettingsManager (`settings-manager.js`)
**Ответственность**: Управление настройками расширения
- Загрузка и сохранение настроек
- Миграция настроек при обновлениях
- Валидация и нормализация данных
- Восстановление из резервных копий

**Основные методы**:
- `loadSettings()` - загрузка настроек с fallback
- `saveSettings(settings)` - сохранение настроек
- `migrateSettings()` - миграция при обновлении
- `normalizeDomains(domains)` - нормализация доменов
- `isExtensionConfigured(domains, serviceUrl)` - проверка конфигурации

### 2. DomainValidator (`domain-validator.js`)
**Ответственность**: Валидация доменов и URL
- Проверка соответствия URL доменам из настроек
- Валидация доменов
- Нормализация доменов
- Проверка безопасности URL

**Основные методы**:
- `checkDomainMatch(url, domains)` - проверка соответствия домену
- `isValidDomain(domain)` - валидация домена
- `normalizeDomain(domain)` - нормализация домена
- `isSafeUrl(url)` - проверка безопасности URL

### 3. ContentProcessor (`content-processor.js`)
**Ответственность**: Обработка контента страниц
- Получение содержимого страницы
- Обработка и оптимизация HTML
- Вычисление контрольных сумм
- Валидация контента

**Основные методы**:
- `getPageContent(tabId)` - получение содержимого страницы
- `processHtmlContent(content)` - обработка HTML
- `calculateChecksum(pageContent)` - вычисление контрольной суммы
- `hasContentChanged(currentContent, lastChecksum)` - проверка изменений
- `validateContent(content)` - валидация контента

### 4. HttpClient (`http-client.js`)
**Ответственность**: HTTP-запросы к backend
- Отправка контента на сервер
- Обработка ошибок и повторные попытки
- Валидация размера payload
- Проверка доступности сервиса

**Основные методы**:
- `savePageContent(serviceUrl, content, options)` - сохранение контента
- `checkServiceHealth(serviceUrl)` - проверка доступности сервиса
- `pingService(serviceUrl)` - ping сервиса
- `preparePayload(content)` - подготовка данных для отправки

### 5. NotificationManager (`notification-manager.js`)
**Ответственность**: Управление уведомлениями
- Показ уведомлений пользователю
- Различные типы уведомлений
- Обработка разрешений
- Очистка уведомлений

**Основные методы**:
- `showSaveSuccess(message)` - уведомление об успешном сохранении
- `showSaveError(errorMessage)` - уведомление об ошибке
- `showConfigurationMessage(message)` - уведомление о настройке
- `showWarning(message)` - предупреждение
- `isNotificationSupported()` - проверка поддержки уведомлений

### 6. AutoSaveManager (`auto-save-manager.js`)
**Ответственность**: Автоматическое сохранение
- Управление расписанием сохранения
- Проверка изменений контента
- Координация с другими модулями
- Кэширование данных

**Основные методы**:
- `setupAutoSave()` - настройка автоматического сохранения
- `performAutoSave()` - выполнение автоматического сохранения
- `savePageContent(tabId, content)` - сохранение контента
- `checkAndSaveOnUpdate(tabId, url)` - сохранение при обновлении
- `restart()` - перезапуск автоматического сохранения

### 7. BackgroundController (`background-controller.js`)
**Ответственность**: Координация всех модулей
- Обработка событий Chrome Extension
- Координация между модулями
- Управление жизненным циклом
- Централизованная обработка ошибок

**Основные методы**:
- `handleInstallation(details)` - обработка установки
- `handleMessage(request, sender, sendResponse)` - обработка сообщений
- `handleTabUpdate(tabId, changeInfo, tab)` - обработка обновления вкладки
- `getStatus()` - получение статуса всех модулей

## Принципы архитектуры

### 1. Single Responsibility Principle (SRP)
Каждый модуль отвечает за одну конкретную область функциональности.

### 2. Open/Closed Principle (OCP)
Модули открыты для расширения, но закрыты для модификации.

### 3. Liskov Substitution Principle (LSP)
Модули могут быть заменены их реализациями без нарушения функциональности.

### 4. Interface Segregation Principle (ISP)
Модули предоставляют только необходимые методы.

### 5. Dependency Inversion Principle (DIP)
Модули зависят от абстракций, а не от конкретных реализаций.

## Преимущества модульной архитектуры

1. **Читаемость**: Код легче понимать и поддерживать
2. **Тестируемость**: Каждый модуль можно тестировать независимо
3. **Переиспользование**: Модули можно использовать в других проектах
4. **Масштабируемость**: Легко добавлять новую функциональность
5. **Отладка**: Проблемы легче локализовать
6. **Командная разработка**: Разные разработчики могут работать над разными модулями

## Использование модулей

```javascript
// Создание экземпляра контроллера
const controller = new BackgroundController();

// Получение статуса
const status = controller.getStatus();

// Перезапуск
await controller.restart();
```

## Совместимость

Все модули совместимы с:
- Chrome Extension Manifest V3
- Service Workers
- ES6+ синтаксисом
- Асинхронными операциями

## Отладка

Для отладки доступен глобальный объект:
```javascript
// В консоли DevTools
self.backgroundController.getStatus();
```
