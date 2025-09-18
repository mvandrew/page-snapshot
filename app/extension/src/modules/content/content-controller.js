/**
 * Главный контроллер для content script
 * Координирует работу всех модулей content script
 */

/**
 * Класс ContentController - главный координатор content script
 */
class ContentController {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.messageHandlers = new Map();

        // Инициализируем контроллер
        this.initialize();
    }

    /**
     * Инициализация контроллера
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        logger.info('Content controller initializing');

        try {
            // Инициализируем модули
            this.initializeModules();

            // Настраиваем обработчики сообщений
            this.setupMessageHandlers();

            // Запускаем проверку конфигурации
            this.checkConfigurationAndInit();

            this.isInitialized = true;
            logger.info('Content controller initialized successfully');

        } catch (error) {
            logger.error('Error initializing content controller:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Инициализация всех модулей
     */
    initializeModules() {
        // Проверяем доступность модулей
        const requiredModules = [
            'PageInfoCollector',
            'AutoSaveManager',
            'ElementHighlighter',
            'NotificationManager'
        ];

        const missingModules = requiredModules.filter(module => !self[module]);

        if (missingModules.length > 0) {
            throw new Error(`Missing required modules: ${missingModules.join(', ')}`);
        }

        // Создаем экземпляры модулей
        this.modules = {
            pageInfoCollector: new self.PageInfoCollector(),
            autoSaveManager: new self.AutoSaveManager(),
            elementHighlighter: new self.ElementHighlighter(),
            notificationManager: new self.NotificationManager()
        };

        logger.info('All modules initialized');
    }

    /**
     * Настройка обработчиков сообщений
     */
    setupMessageHandlers() {
        // Обработчик сообщений от popup и background
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
        });

        // Регистрируем обработчики для каждого типа сообщений
        this.messageHandlers.set('getPageInfo', (request, sender, sendResponse) => {
            const pageInfo = this.modules.pageInfoCollector.getPageInfo();
            sendResponse(pageInfo);
        });

        this.messageHandlers.set('highlightElement', (request, sender, sendResponse) => {
            this.modules.elementHighlighter.highlightElement(request.selector);
            sendResponse({ success: true });
        });

        this.messageHandlers.set('removeHighlight', (request, sender, sendResponse) => {
            this.modules.elementHighlighter.removeHighlight();
            sendResponse({ success: true });
        });

        this.messageHandlers.set('scrollToElement', (request, sender, sendResponse) => {
            this.modules.elementHighlighter.scrollToElement(request.selector);
            sendResponse({ success: true });
        });

        this.messageHandlers.set('settingsUpdated', (request, sender, sendResponse) => {
            console.log('Page Snapshot: Settings updated, reinitializing');
            this.checkConfigurationAndInit();
            sendResponse({ success: true });
        });

        this.messageHandlers.set('triggerAutoSave', (request, sender, sendResponse) => {
            console.log('Page Snapshot: Manual auto-save triggered');
            this.modules.autoSaveManager.triggerAutoSave();
            sendResponse({ success: true });
        });
    }

    /**
     * Обработка входящих сообщений
     * @param {Object} request - Запрос
     * @param {Object} sender - Отправитель
     * @param {Function} sendResponse - Функция ответа
     */
    handleMessage(request, sender, sendResponse) {
        const handler = this.messageHandlers.get(request.action);

        if (handler) {
            try {
                handler(request, sender, sendResponse);
            } catch (error) {
                console.error(`Page Snapshot: Error handling message ${request.action}:`, error);
                sendResponse({ error: error.message });
            }
        } else {
            console.warn(`Page Snapshot: Unknown action: ${request.action}`);
            sendResponse({ error: 'Unknown action' });
        }
    }

    /**
     * Проверка конфигурации и инициализация
     */
    checkConfigurationAndInit() {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        logger.info('Content script initialized on:', {
            url: currentUrl,
            hostname: currentHostname,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname
        });

        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (chrome.runtime.lastError) {
                logger.error('Error getting settings:', chrome.runtime.lastError);
                return;
            }

            if (response) {
                logger.info('Settings received:', {
                    domains: response.domains,
                    serviceUrl: response.serviceUrl,
                    isConfigured: this.isExtensionConfigured(response.domains, response.serviceUrl)
                });

                const isConfigured = this.isExtensionConfigured(response.domains, response.serviceUrl);

                if (isConfigured) {
                    // Проверяем соответствие текущего домена
                    this.checkDomainMatch(response.domains);

                    // Запускаем автоматическое сохранение
                    this.modules.autoSaveManager.startAutoSave(response);
                } else {
                    logger.info('Extension not configured');
                    logger.info('Current page info:', {
                        url: currentUrl,
                        hostname: currentHostname
                    });
                }
            } else {
                logger.info('No settings received');
            }
        });
    }

    /**
     * Проверка конфигурации расширения
     * @param {Array} domains - Список доменов
     * @param {string} serviceUrl - URL сервиса
     * @returns {boolean} Настроено ли расширение
     */
    isExtensionConfigured(domains, serviceUrl) {
        return (domains && domains.length > 0) && (serviceUrl && serviceUrl.trim() !== '');
    }

    /**
     * Проверка соответствия домену
     * @param {Array} domains - Список доменов для проверки
     */
    checkDomainMatch(domains) {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        logger.info('Domains:', domains);
        logger.info('Checking domain match:', {
            url: currentUrl,
            hostname: currentHostname,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname
        });

        // Сначала проверяем локально
        const localMatch = this.checkDomainMatchLocal(domains);

        if (localMatch) {
            logger.info('Domain matches locally, auto-save will work');
            // Запускаем автоматическое сохранение
            this.modules.autoSaveManager.triggerAutoSave();
            return;
        }

        // Если локальная проверка не сработала, проверяем через background
        chrome.runtime.sendMessage({
            action: 'checkDomainMatch',
            url: currentUrl
        }, (response) => {
            if (chrome.runtime.lastError) {
                logger.error('Error checking domain match:', chrome.runtime.lastError);
                return;
            }

            if (response && response.match) {
                logger.info('Domain matches via background, auto-save will work');
                // Запускаем автоматическое сохранение
                this.modules.autoSaveManager.triggerAutoSave();
            } else {
                logger.info('Current domain does not match configured domains');
                logger.info('Current URL:', currentUrl);
                logger.info('Current hostname:', currentHostname);
                logger.info('Configured domains:', domains);
            }
        });
    }

    /**
     * Локальная проверка соответствия домену
     * @param {Array} domains - Список доменов
     * @returns {boolean} Соответствует ли домен
     */
    checkDomainMatchLocal(domains) {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        if (!domains || domains.length === 0) {
            logger.info('No domains configured for matching');
            return false;
        }

        logger.info('Checking domain match locally:', {
            url: currentUrl,
            hostname: currentHostname,
            domains: domains
        });

        // Нормализуем домены
        const normalizedDomains = this.normalizeDomains(domains);
        logger.info('Normalized domains:', normalizedDomains);

        for (const domain of normalizedDomains) {
            logger.debug('Testing domain pattern:', domain);

            try {
                // Сначала пробуем как регулярное выражение
                const regex = new RegExp(domain);
                if (regex.test(currentHostname) || regex.test(currentUrl)) {
                    logger.info('Domain match found (regex):', domain);
                    return true;
                }
            } catch (e) {
                logger.debug('Not a valid regex, trying as string:', domain);

                // Если не регулярное выражение, проверяем как обычную строку
                if (currentHostname === domain || currentHostname.endsWith('.' + domain) ||
                    currentHostname.includes(domain) || currentUrl.includes(domain)) {
                    logger.info('Domain match found (string):', domain);
                    return true;
                }
            }
        }

        logger.info('No domain match found');
        return false;
    }

    /**
     * Функция нормализации доменов
     * @param {Array} domains - Список доменов
     * @returns {Array} Нормализованные домены
     */
    normalizeDomains(domains) {
        if (!domains || !Array.isArray(domains)) {
            return [];
        }

        return domains.map(domain => {
            if (typeof domain !== 'string') {
                return domain;
            }

            // Убираем протокол если он есть
            let cleanDomain = domain;
            if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
                cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
            }

            // Убираем экранированные точки
            cleanDomain = cleanDomain.replace(/\\\./g, '.');

            // Убираем слеш в конце
            cleanDomain = cleanDomain.replace(/\/$/, '');

            return cleanDomain;
        }).filter(domain => domain && domain.trim() !== '');
    }

    /**
     * Обработка ошибок инициализации
     * @param {Error} error - Ошибка инициализации
     */
    handleInitializationError(error) {
        logger.error('Critical initialization error:', error);

        // Показываем уведомление пользователю
        if (this.modules.notificationManager) {
            this.modules.notificationManager.showNotification(
                'Ошибка инициализации Page Snapshot. Проверьте консоль для подробностей.',
                'error'
            );
        }
    }

    /**
     * Получение состояния контроллера
     * @returns {Object} Состояние контроллера
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            messageHandlers: Array.from(this.messageHandlers.keys())
        };
    }

    /**
     * Перезапуск контроллера
     */
    restart() {
        logger.info('Restarting content controller');
        this.isInitialized = false;
        this.modules = {};
        this.messageHandlers.clear();
        this.initialize();
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.ContentController = ContentController;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.ContentController = ContentController;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = ContentController;
}
