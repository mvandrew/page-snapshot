/**
 * Главный модуль-координатор для background script
 * Управляет всеми модулями и обрабатывает события Chrome Extension
 */

/**
 * Класс-координатор для background script
 */
class BackgroundController {
    constructor() {
        // Инициализируем модули
        this.settingsManager = new SettingsManager();
        this.domainValidator = new DomainValidator();
        this.contentProcessor = new ContentProcessor();
        this.httpClient = new HttpClient();
        this.notificationManager = new NotificationManager();
        this.autoSaveManager = new AutoSaveManager(
            this.settingsManager,
            this.domainValidator,
            this.contentProcessor,
            this.httpClient,
            this.notificationManager
        );

        // Настройки по умолчанию для инициализации
        this.defaultSettings = {
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

        this.initialize();
    }

    /**
     * Инициализирует контроллер
     */
    initialize() {
        this.setupEventListeners();
        this.setupErrorHandling();
    }

    /**
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        // Обработка установки расширения
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Обработка сообщений от content script и popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Для асинхронного ответа
        });

        // Обработка обновления вкладки
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Обработка запуска расширения
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });

        // Обработка приостановки расширения
        chrome.runtime.onSuspend.addListener(() => {
            this.handleSuspend();
        });
    }

    /**
     * Настраивает глобальную обработку ошибок
     */
    setupErrorHandling() {
        self.addEventListener('error', (event) => {
            console.error('Service Worker error:', event.error);
        });

        self.addEventListener('unhandledrejection', (event) => {
            console.error('Service Worker unhandled rejection:', event.reason);
        });
    }

    /**
     * Обрабатывает установку расширения
     * @param {Object} details - Детали установки
     */
    async handleInstallation(details) {
        try {
            if (details.reason === 'install') {
                // Инициализация настроек по умолчанию только при первой установке
                await chrome.storage.sync.set(this.defaultSettings);
                console.log('Default settings initialized');
            } else if (details.reason === 'update') {
                // При обновлении мигрируем настройки
                await this.settingsManager.migrateSettings();
                console.log('Settings migrated');
            }

            // Настройка автоматического сохранения
            await this.autoSaveManager.setupAutoSave();
        } catch (error) {
            console.error('Error handling installation:', error);
        }
    }

    /**
     * Обрабатывает сообщения от content script и popup
     * @param {Object} request - Запрос
     * @param {Object} sender - Отправитель
     * @param {Function} sendResponse - Функция ответа
     */
    async handleMessage(request, sender, sendResponse) {
        try {
            let result;

            switch (request.action) {
                case 'savePageContent':
                    result = await this.handleSavePageContent(request, sender);
                    sendResponse({ success: true, data: result });
                    break;

                case 'getSettings':
                    result = await this.handleGetSettings();
                    sendResponse(result);
                    break;

                case 'saveSettings':
                    result = await this.handleSaveSettings(request);
                    sendResponse(result);
                    break;

                case 'settingsUpdated':
                    result = await this.handleSettingsUpdated();
                    sendResponse(result);
                    break;

                case 'checkDomainMatch':
                    result = await this.handleCheckDomainMatch(request);
                    sendResponse(result);
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Page Snapshot: Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    /**
     * Обрабатывает сохранение содержимого страницы
     * @param {Object} request - Запрос
     * @param {Object} sender - Отправитель
     * @returns {Promise<Object>} Результат сохранения
     */
    async handleSavePageContent(request, sender) {
        // Получаем tabId из sender или из активной вкладки
        let tabId = null;
        if (sender.tab && sender.tab.id) {
            tabId = sender.tab.id;
        } else {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    tabId = tab.id;
                }
            } catch (error) {
                console.error('Error getting active tab:', error);
            }
        }

        if (!tabId) {
            throw new Error('Invalid tab information');
        }

        return await this.autoSaveManager.savePageContent(tabId, request.content);
    }

    /**
     * Обрабатывает получение настроек
     * @returns {Promise<Object>} Настройки
     */
    async handleGetSettings() {
        try {
            const settings = await this.settingsManager.loadSettings();
            return settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return { ...this.defaultSettings };
        }
    }

    /**
     * Обрабатывает сохранение настроек
     * @param {Object} request - Запрос с настройками
     * @returns {Promise<Object>} Результат сохранения
     */
    async handleSaveSettings(request) {
        try {
            const success = await this.settingsManager.saveSettings(request.settings);
            if (success) {
                await this.autoSaveManager.restart(); // Перезапускаем автоматическое сохранение
            }
            return { success };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { error: 'Failed to save settings' };
        }
    }

    /**
     * Обрабатывает обновление настроек
     * @returns {Promise<Object>} Результат обновления
     */
    async handleSettingsUpdated() {
        try {
            await this.autoSaveManager.restart(); // Перезапускаем при обновлении настроек
            return { success: true };
        } catch (error) {
            console.error('Error handling settings update:', error);
            return { error: 'Failed to update settings' };
        }
    }

    /**
     * Обрабатывает проверку соответствия домену
     * @param {Object} request - Запрос с URL
     * @returns {Promise<Object>} Результат проверки
     */
    async handleCheckDomainMatch(request) {
        try {
            const settings = await this.settingsManager.loadSettings();
            const match = await this.domainValidator.checkDomainMatch(request.url, settings.domains);
            return { match };
        } catch (error) {
            console.error('Error checking domain match:', error);
            return { match: false };
        }
    }

    /**
     * Обрабатывает обновление вкладки
     * @param {number} tabId - ID вкладки
     * @param {Object} changeInfo - Информация об изменении
     * @param {Object} tab - Объект вкладки
     */
    async handleTabUpdate(tabId, changeInfo, tab) {
        try {
            if (changeInfo.status === 'complete' && tab.url) {
                // Сбрасываем кэш содержимого и контрольной суммы при обновлении страницы
                this.autoSaveManager.resetCache();

                // Проверяем, нужно ли сохранить страницу сразу
                await this.autoSaveManager.checkAndSaveOnUpdate(tabId, tab.url);
            }
        } catch (error) {
            console.error('Error in tab update handler:', error);
        }
    }

    /**
     * Обрабатывает запуск расширения
     */
    async handleStartup() {
        try {
            // Миграция настроек при запуске
            await this.settingsManager.migrateSettings();

            // Настройка автоматического сохранения при запуске
            await this.autoSaveManager.setupAutoSave();
        } catch (error) {
            console.error('Error handling startup:', error);
        }
    }

    /**
     * Обрабатывает приостановку расширения
     */
    handleSuspend() {
        try {
            // Очищаем интервал при приостановке
            this.autoSaveManager.stop();
        } catch (error) {
            console.error('Error handling suspend:', error);
        }
    }

    /**
     * Получает статус всех модулей
     * @returns {Object} Статус модулей
     */
    getStatus() {
        return {
            autoSave: this.autoSaveManager.getStatus(),
            settings: {
                isConfigured: this.settingsManager.isExtensionConfigured(
                    this.settingsManager.defaultSettings.domains,
                    this.settingsManager.defaultSettings.serviceUrl
                )
            }
        };
    }

    /**
     * Перезапускает все модули
     * @returns {Promise<void>}
     */
    async restart() {
        try {
            await this.autoSaveManager.restart();
            console.log('Background controller restarted');
        } catch (error) {
            console.error('Error restarting background controller:', error);
        }
    }
}

// Экспортируем класс для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundController;
} else {
    // Для использования в Chrome Extension
    window.BackgroundController = BackgroundController;
}
