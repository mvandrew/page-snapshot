# Page Snapshot Chrome Extension

Расширение для Chrome, позволяющее создавать снимки веб-страниц.

## Функциональность

- 📸 **Захват страниц** - Создание снимков всей страницы или видимой области
- ⚙️ **Настройки** - Выбор формата (PNG, JPEG, WebP) и качества
- 🎨 **Удобный интерфейс** - Простой и интуитивный popup
- 🔧 **Content Script** - Интеграция с веб-страницами
- 💾 **Автосохранение** - Автоматическое сохранение снимков

## Структура проекта

```
app/extension/
├── manifest.json          # Манифест расширения
├── background.js          # Service Worker
├── content.js            # Content Script
├── content.css           # Стили для content script
├── popup.html            # HTML popup
├── popup.css             # Стили popup
├── popup.js              # JavaScript popup
├── icons/                # Иконки расширения
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── assets/               # Статические ресурсы
    └── README.md
```

## Установка

1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `app/extension`

## Разработка

### Требования

- Chrome 88+ (Manifest V3)
- Современный браузер с поддержкой ES6+

### Основные компоненты

#### Manifest V3
- Использует Service Worker вместо Background Page
- Современные разрешения и API
- Улучшенная безопасность

#### Content Script
- Интегрируется с веб-страницами
- Создает кнопку захвата на странице
- Обрабатывает взаимодействие с DOM

#### Popup Interface
- Современный Material Design
- Адаптивный интерфейс
- Настройки и управление

### API

#### Background Script
```javascript
// Захват страницы
chrome.runtime.sendMessage({
  action: 'capturePage',
  options: { format: 'png', quality: 0.9 }
});

// Получение настроек
chrome.runtime.sendMessage({
  action: 'getSettings'
});
```

#### Content Script
```javascript
// Получение информации о странице
chrome.runtime.sendMessage({
  action: 'getPageInfo'
});

// Подсветка элемента
chrome.runtime.sendMessage({
  action: 'highlightElement',
  selector: '#my-element'
});
```

## Настройки

- **Формат**: PNG, JPEG, WebP
- **Качество**: 10% - 100%
- **Автозахват**: Включить/выключить
- **Область захвата**: Вся страница или видимая область

## Разрешения

- `activeTab` - Доступ к активной вкладке
- `storage` - Сохранение настроек
- `downloads` - Скачивание снимков
- `host_permissions` - Доступ ко всем сайтам

## Безопасность

- Использует Manifest V3
- Минимальные необходимые разрешения
- Безопасная обработка пользовательских данных
- Валидация всех входных данных

## Поддержка

- Chrome 88+
- Chromium-based браузеры
- Все современные веб-сайты

## Лицензия

MIT License - см. файл LICENSE в корне проекта.
