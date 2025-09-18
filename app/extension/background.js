// Service Worker для Chrome Extension Manifest V3
// Модульная архитектура с разделением ответственности

// Глобальная обработка ошибок
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

// Настройки по умолчанию для fallback
const defaultSettings = {
    domains: [],
    serviceUrl: '',
    enableAutoSave: true,
    saveInterval: 10,
    saveOnlyOnChange: true,
    enableNotifications: true,
    enableDebug: false,
    maxRetries: 3,
    autoCapture: false,
    captureFormat: 'png',
    quality: 0.9,
    lastChecksum: null
};

// Функция для проверки доступности модулей
function checkModulesAvailability() {
    const requiredModules = [
        'SettingsManager',
        'DomainValidator',
        'ContentProcessor',
        'HttpClient',
        'NotificationManager',
        'AutoSaveManager',
        'BackgroundController'
    ];

    const missingModules = requiredModules.filter(module => !self[module]);

    if (missingModules.length > 0) {
        console.error('Missing modules:', missingModules);
        return false;
    }

    return true;
}

// Функция fallback инициализации
function initializeFallback() {
    console.log('Page Snapshot: Using fallback initialization');

    // Обработка установки расширения
    chrome.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'install') {
            chrome.storage.sync.set(defaultSettings, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting default settings:', chrome.runtime.lastError);
                } else {
                    console.log('Default settings set successfully');
                }
            });
        }
    });

    // Простая обработка сообщений
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getSettings') {
            chrome.storage.sync.get(Object.keys(defaultSettings), (settings) => {
                sendResponse({ ...defaultSettings, ...settings });
            });
            return true;
        }

        if (request.action === 'saveSettings') {
            chrome.storage.sync.set(request.settings, () => {
                sendResponse({ success: !chrome.runtime.lastError });
            });
            return true;
        }

        sendResponse({ error: 'Service not available' });
    });
}

// Загружаем модули и инициализируем контроллер
let backgroundController = null;

try {
    // Загружаем все модули
    importScripts(
        'modules/settings-manager.js',
        'modules/domain-validator.js',
        'modules/content-processor.js',
        'modules/http-client.js',
        'modules/notification-manager.js',
        'modules/auto-save-manager.js',
        'modules/background-controller.js'
    );

    // Проверяем доступность модулей
    if (checkModulesAvailability()) {
        backgroundController = new self.BackgroundController();
        console.log('Page Snapshot: Background controller initialized successfully');
    } else {
        throw new Error('Required modules not available');
    }

} catch (error) {
    console.error('Page Snapshot: Failed to initialize background controller:', error);
    initializeFallback();
}

// Экспортируем контроллер для отладки
if (typeof self !== 'undefined') {
    self.backgroundController = backgroundController;
}