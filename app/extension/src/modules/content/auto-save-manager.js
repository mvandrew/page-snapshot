/**
 * Модуль управления автоматическим сохранением
 * Отвечает за периодическое сохранение контента страницы
 */

/**
 * Класс AutoSaveManager - управление автоматическим сохранением
 */
class AutoSaveManager {
    constructor() {
        this.autoSaveInterval = null;
        this.lastSavedContent = null;
        this.isAutoSaveActive = false;
        this.saveAttempts = 0;
        this.maxSaveAttempts = 3;
        this.retryDelay = 5000; // 5 секунд
    }

    /**
     * Запуск автоматического сохранения
     * @param {Object} settings - Настройки автоматического сохранения
     */
    startAutoSave(settings) {
        // Очищаем предыдущий интервал
        this.stopAutoSave();

        const { saveInterval, saveOnlyOnChange } = settings;

        if (saveInterval > 0) {
            logger.info(`Starting auto-save with interval: ${saveInterval}s`);

            this.autoSaveInterval = setInterval(() => {
                this.performAutoSave(saveOnlyOnChange);
            }, saveInterval * 1000);

            this.isAutoSaveActive = true;
        } else {
            logger.info('Auto-save disabled (interval = 0)');
            this.isAutoSaveActive = false;
        }
    }

    /**
     * Остановка автоматического сохранения
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        this.isAutoSaveActive = false;
        logger.info('Auto-save stopped');
    }

    /**
     * Выполнение автоматического сохранения
     * @param {boolean} saveOnlyOnChange - Сохранять только при изменении
     */
    performAutoSave(saveOnlyOnChange) {
        try {
            // Проверяем, нужно ли сохранять только при изменении
            if (saveOnlyOnChange) {
                const currentContent = document.documentElement.outerHTML;
                if (this.lastSavedContent === currentContent) {
                    logger.debug('Content unchanged, skipping save');
                    return;
                }
                this.lastSavedContent = currentContent;
            }

            this.triggerAutoSave();
        } catch (error) {
            logger.error('Error in auto-save:', error);
        }
    }

    /**
     * Запуск сохранения страницы
     */
    triggerAutoSave() {
        logger.info('Triggering auto-save from content script');

        // Получаем информацию о странице
        const pageInfo = this.getPageInfo();

        // Отправляем в background script для сохранения
        chrome.runtime.sendMessage({
            action: 'savePageContent',
            content: pageInfo
        }, (response) => {
            this.handleSaveResponse(response);
        });
    }

    /**
     * Обработка ответа от background script
     * @param {Object} response - Ответ от background script
     */
    handleSaveResponse(response) {
        if (chrome.runtime.lastError) {
            logger.error('Error triggering auto-save:', chrome.runtime.lastError);
            this.handleSaveError(chrome.runtime.lastError);
            return;
        }

        if (response && response.success) {
            logger.info('Page saved successfully via content script');
            this.saveAttempts = 0; // Сбрасываем счетчик попыток при успехе
            this.notifySaveSuccess();
        } else {
            logger.warn('Failed to save page via content script:', response?.error || 'Unknown error');
            this.handleSaveError(response?.error || 'Unknown error');
        }
    }

    /**
     * Обработка ошибки сохранения
     * @param {string|Object} error - Ошибка сохранения
     */
    handleSaveError(error) {
        this.saveAttempts++;

        logger.error(`Save attempt ${this.saveAttempts} failed:`, error);

        if (this.saveAttempts < this.maxSaveAttempts) {
            logger.info(`Retrying save in ${this.retryDelay}ms (attempt ${this.saveAttempts}/${this.maxSaveAttempts})`);
            setTimeout(() => {
                this.triggerAutoSave();
            }, this.retryDelay);
        } else {
            logger.error('Max save attempts reached, giving up');
            this.notifySaveError(error);
            this.saveAttempts = 0; // Сбрасываем счетчик для следующего цикла
        }
    }

    /**
     * Получение информации о странице
     * @returns {Object} Информация о странице
     */
    getPageInfo() {
        const pageInfo = {
            html: document.documentElement.outerHTML,
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scrollPosition: {
                x: window.scrollX,
                y: window.scrollY
            }
        };

        logger.debug('Page info collected for auto-save:', {
            url: pageInfo.url,
            hostname: window.location.hostname,
            title: pageInfo.title,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname,
            htmlSize: pageInfo.html.length
        });

        return pageInfo;
    }

    /**
     * Уведомление об успешном сохранении
     */
    notifySaveSuccess() {
        // Можно добавить визуальную индикацию успешного сохранения
        // Например, показать краткое уведомление
        logger.debug('Auto-save completed successfully');
    }

    /**
     * Уведомление об ошибке сохранения
     * @param {string|Object} error - Ошибка
     */
    notifySaveError(error) {
        // Можно добавить визуальную индикацию ошибки
        logger.error('Auto-save failed:', error);
    }

    /**
     * Проверка активности автоматического сохранения
     * @returns {boolean} Активно ли автоматическое сохранение
     */
    isActive() {
        return this.isAutoSaveActive && this.autoSaveInterval !== null;
    }

    /**
     * Получение статистики автоматического сохранения
     * @returns {Object} Статистика
     */
    getStatistics() {
        return {
            isActive: this.isActive(),
            saveAttempts: this.saveAttempts,
            maxSaveAttempts: this.maxSaveAttempts,
            retryDelay: this.retryDelay,
            lastSavedContentSize: this.lastSavedContent ? this.lastSavedContent.length : 0
        };
    }

    /**
     * Принудительное сохранение (игнорируя настройки)
     */
    forceSave() {
        logger.info('Force save triggered');
        this.saveAttempts = 0; // Сбрасываем счетчик попыток
        this.triggerAutoSave();
    }

    /**
     * Обновление настроек автоматического сохранения
     * @param {Object} newSettings - Новые настройки
     */
    updateSettings(newSettings) {
        logger.info('Updating auto-save settings:', newSettings);

        // Останавливаем текущее автоматическое сохранение
        this.stopAutoSave();

        // Запускаем с новыми настройками
        this.startAutoSave(newSettings);
    }

    /**
     * Проверка изменений контента
     * @returns {boolean} Изменился ли контент
     */
    hasContentChanged() {
        if (!this.lastSavedContent) {
            return true;
        }

        const currentContent = document.documentElement.outerHTML;
        return currentContent !== this.lastSavedContent;
    }

    /**
     * Получение размера изменений
     * @returns {Object} Информация об изменениях
     */
    getChangeInfo() {
        if (!this.lastSavedContent) {
            return {
                hasChanged: true,
                currentSize: document.documentElement.outerHTML.length,
                previousSize: 0,
                sizeDifference: document.documentElement.outerHTML.length
            };
        }

        const currentContent = document.documentElement.outerHTML;
        const currentSize = currentContent.length;
        const previousSize = this.lastSavedContent.length;
        const sizeDifference = currentSize - previousSize;

        return {
            hasChanged: currentContent !== this.lastSavedContent,
            currentSize,
            previousSize,
            sizeDifference
        };
    }

    /**
     * Очистка кэша сохраненного контента
     */
    clearCache() {
        this.lastSavedContent = null;
        logger.debug('Auto-save cache cleared');
    }

    /**
     * Получение состояния менеджера
     * @returns {Object} Состояние менеджера
     */
    getState() {
        return {
            isActive: this.isActive(),
            saveAttempts: this.saveAttempts,
            hasLastSavedContent: !!this.lastSavedContent,
            lastSavedContentSize: this.lastSavedContent ? this.lastSavedContent.length : 0,
            intervalId: this.autoSaveInterval
        };
    }

    /**
     * Перезапуск менеджера
     */
    restart() {
        logger.info('Restarting auto-save manager');
        this.stopAutoSave();
        this.clearCache();
        this.saveAttempts = 0;
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
