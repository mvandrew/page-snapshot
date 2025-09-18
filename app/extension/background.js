// Service Worker для Chrome Extension Manifest V3
// Модульная архитектура с разделением ответственности

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

// Создаем и инициализируем главный контроллер
let backgroundController;

try {
    backgroundController = new BackgroundController();
    console.log('Page Snapshot: Background controller initialized successfully');
} catch (error) {
    console.error('Page Snapshot: Failed to initialize background controller:', error);

    // Fallback: базовая инициализация в случае ошибки
    console.log('Page Snapshot: Using fallback initialization');

    // Простая инициализация настроек по умолчанию
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

    // Устанавливаем настройки по умолчанию при первой установке
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
}

// Экспортируем контроллер для отладки (если доступен)
if (typeof self !== 'undefined') {
    self.backgroundController = backgroundController;
}