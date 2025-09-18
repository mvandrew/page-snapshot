/**
 * Модуль автоматического сохранения
 * Отвечает за автоматическое сохранение страниц по расписанию
 */

/**
 * Класс для управления автоматическим сохранением
 */
class AutoSaveManager {
    constructor(settingsManager, domainValidator, contentProcessor, httpClient, notificationManager) {
        this.settingsManager = settingsManager;
        this.domainValidator = domainValidator;
        this.contentProcessor = contentProcessor;
        this.httpClient = httpClient;
        this.notificationManager = notificationManager;

        this.saveIntervalId = null;
        this.lastPageContent = null;
        this.lastChecksum = null;
        this.isSaving = false;
        this.lastSaveTime = 0;
        this.minSaveInterval = 2000; // Минимальный интервал между сохранениями (2 секунды)
    }

    /**
     * Настраивает автоматическое сохранение
     * @returns {Promise<void>}
     */
    async setupAutoSave() {
        // Очищаем предыдущий интервал
        this.clearInterval();

        try {
            const settings = await this.settingsManager.loadSettings();
            const {
                enableAutoSave = true,
                saveInterval = 0,
                enableDebug = false
            } = settings;

            if (enableDebug) {
                console.log('Setting up auto-save:', { enableAutoSave, saveInterval });
            }

            if (enableAutoSave && saveInterval > 0) {
                this.saveIntervalId = setInterval(async () => {
                    await this.performAutoSave();
                }, saveInterval * 1000);

                console.log('Auto-save enabled with interval:', saveInterval);
            } else {
                console.log('Auto-save disabled');
            }
        } catch (error) {
            console.error('Error setting up auto-save:', error);
        }
    }

    /**
     * Выполняет автоматическое сохранение
     * @returns {Promise<void>}
     */
    async performAutoSave() {
        try {
            const settings = await this.settingsManager.loadSettings();
            const {
                domains = [],
                serviceUrl = '',
                saveOnlyOnChange = true,
                enableDebug = false
            } = settings;

            if (enableDebug) {
                console.log('Performing auto-save check');
            }

            // Проверяем обязательные настройки
            if (!this.settingsManager.isExtensionConfigured(domains, serviceUrl)) {
                if (enableDebug) {
                    console.log('Extension not configured for auto-save');
                }
                return;
            }

            // Получаем активную вкладку
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) return;

            // Проверяем соответствие домену
            const domainMatch = await this.domainValidator.checkDomainMatch(tab.url, domains);
            if (!domainMatch) return;

            // Получаем содержимое страницы
            const pageContent = await this.contentProcessor.getPageContent(tab.id);
            if (!pageContent) return;

            // Вычисляем контрольную сумму для проверки изменений
            const currentChecksum = await this.contentProcessor.calculateChecksum(pageContent);

            // Проверяем изменение содержимого по контрольной сумме
            if (saveOnlyOnChange && currentChecksum === this.lastChecksum) {
                if (enableDebug) {
                    console.log('Page content unchanged, skipping save');
                }
                return;
            }

            // Сохраняем содержимое
            const result = await this.savePageContent(tab.id, pageContent);

            // Обновляем кэш только при успешном сохранении
            if (result && result.success) {
                this.lastPageContent = pageContent;
                this.lastChecksum = currentChecksum;
            } else if (result && result.error) {
                if (enableDebug) {
                    console.log('Save skipped:', result.error);
                }
            }

            if (enableDebug) {
                console.log('Auto-save completed');
            }

        } catch (error) {
            console.error('Error in auto-save:', error);
        }
    }

    /**
     * Сохраняет содержимое страницы
     * @param {number} tabId - ID вкладки
     * @param {Object} content - Содержимое страницы
     * @returns {Promise<Object>} Результат сохранения
     */
    async savePageContent(tabId, content) {
        try {
            // Защита от одновременных запросов
            if (this.isSaving) {
                return { success: false, error: 'Save already in progress' };
            }

            // Проверяем минимальный интервал между сохранениями
            const now = Date.now();
            if (now - this.lastSaveTime < this.minSaveInterval) {
                return { success: false, error: 'Too soon to save' };
            }

            // Устанавливаем флаг сохранения
            this.isSaving = true;
            this.lastSaveTime = now;

            const settings = await this.settingsManager.loadSettings();
            const {
                serviceUrl,
                maxRetries,
                enableNotifications,
                enableDebug
            } = settings;

            if (enableDebug) {
                console.log('Saving page content to:', serviceUrl);
            }

            // Обрабатываем контент
            const processedContent = this.contentProcessor.processHtmlContent(content);

            // Сохраняем через HTTP-клиент
            const result = await this.httpClient.savePageContent(serviceUrl, processedContent, {
                maxRetries,
                enableDebug,
                enableNotifications
            });

            return result;

        } catch (error) {
            console.error('Error saving page content:', error);
            throw error;
        } finally {
            // Сбрасываем флаг сохранения в любом случае
            this.isSaving = false;
        }
    }

    /**
     * Проверяет и сохраняет при обновлении страницы
     * @param {number} tabId - ID вкладки
     * @param {string} url - URL страницы
     * @returns {Promise<void>}
     */
    async checkAndSaveOnUpdate(tabId, url) {
        try {
            const settings = await this.settingsManager.loadSettings();
            const {
                domains = [],
                serviceUrl = '',
                saveOnlyOnChange = true,
                enableDebug = false
            } = settings;

            if (enableDebug) {
                console.log('Checking save on page update');
            }

            // Проверяем конфигурацию
            if (!this.settingsManager.isExtensionConfigured(domains, serviceUrl)) {
                if (enableDebug) {
                    console.log('Extension not configured for save on update');
                }
                return;
            }

            const domainMatch = await this.domainValidator.checkDomainMatch(url, domains);
            if (!domainMatch) return;

            // Небольшая задержка для полной загрузки страницы
            setTimeout(async () => {
                const pageContent = await this.contentProcessor.getPageContent(tabId);
                if (pageContent) {
                    // Вычисляем контрольную сумму для проверки изменений
                    const currentChecksum = await this.contentProcessor.calculateChecksum(pageContent);

                    // Проверяем изменение содержимого по контрольной сумме
                    if (saveOnlyOnChange && currentChecksum === this.lastChecksum) {
                        if (enableDebug) {
                            console.log('Page content unchanged, skipping save on update');
                        }
                        return;
                    }

                    const result = await this.savePageContent(tabId, pageContent);

                    // Обновляем кэш только при успешном сохранении
                    if (result && result.success) {
                        this.lastPageContent = pageContent;
                        this.lastChecksum = currentChecksum;
                    }
                }
            }, 2000);

        } catch (error) {
            console.error('Error in checkAndSaveOnUpdate:', error);
        }
    }

    /**
     * Очищает интервал автоматического сохранения
     */
    clearInterval() {
        if (this.saveIntervalId) {
            clearInterval(this.saveIntervalId);
            this.saveIntervalId = null;
        }
    }

    /**
     * Сбрасывает кэш содержимого и контрольной суммы
     */
    resetCache() {
        this.lastPageContent = null;
        this.lastChecksum = null;
    }

    /**
     * Проверяет, активно ли автоматическое сохранение
     * @returns {boolean} Активно ли автоматическое сохранение
     */
    isAutoSaveActive() {
        return this.saveIntervalId !== null;
    }

    /**
     * Получает статус автоматического сохранения
     * @returns {Object} Статус автоматического сохранения
     */
    getStatus() {
        return {
            isActive: this.isAutoSaveActive(),
            isSaving: this.isSaving,
            lastSaveTime: this.lastSaveTime,
            hasCachedContent: this.lastPageContent !== null,
            lastChecksum: this.lastChecksum
        };
    }

    /**
     * Останавливает автоматическое сохранение
     */
    stop() {
        this.clearInterval();
        this.resetCache();
        console.log('Auto-save stopped');
    }

    /**
     * Перезапускает автоматическое сохранение
     * @returns {Promise<void>}
     */
    async restart() {
        this.stop();
        await this.setupAutoSave();
        console.log('Auto-save restarted');
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.AutoSaveManager = AutoSaveManager;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.AutoSaveManager = AutoSaveManager;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = AutoSaveManager;
}
