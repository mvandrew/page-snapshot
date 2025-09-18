/**
 * Модуль HTTP-клиента
 * Отвечает за отправку запросов к backend сервису
 */

// Логгер уже должен быть загружен в background.js

/**
 * Класс для работы с HTTP-запросами
 */
class HttpClient {
    constructor() {
        this.maxPayloadSize = 10 * 1024 * 1024; // 10MB максимальный размер payload
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Отправляет контент страницы на сервер
     * @param {string} serviceUrl - URL сервиса
     * @param {Object} content - Контент для отправки
     * @param {Object} options - Дополнительные опции
     * @returns {Promise<Object>} Результат отправки
     */
    async savePageContent(serviceUrl, content, options = {}) {
        const {
            maxRetries = 3,
            enableDebug = false,
            enableNotifications = true
        } = options;

        try {
            // Подготавливаем payload
            const payload = this.preparePayload(content);

            // Проверяем размер payload
            this.validatePayloadSize(payload);

            let lastError;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await this.makeRequest(serviceUrl, payload);

                    if (enableDebug) {
                        logger.debug('Backend response received:', response);
                    }

                    // Проверяем успешность операции
                    if (response.success) {
                        if (enableNotifications) {
                            this.showSuccessNotification();
                        }

                        return {
                            success: true,
                            attempt,
                            checksum: response.data?.checksum,
                            id: response.data?.id
                        };
                    } else {
                        throw new Error(response.message || 'Unknown backend error');
                    }

                } catch (error) {
                    lastError = error;
                    logger.error(`Save attempt ${attempt} failed:`, error);

                    if (attempt < maxRetries) {
                        // Ждем перед следующей попыткой (экспоненциальная задержка)
                        const delay = 1000 * Math.pow(2, attempt - 1);
                        await this.delay(delay);
                    }
                }
            }

            throw lastError;

        } catch (error) {
            logger.error('Error saving page content:', error);

            if (enableNotifications) {
                this.showErrorNotification(error.message);
            }

            throw error;
        }
    }

    /**
     * Подготавливает payload для отправки
     * @param {Object} content - Контент страницы
     * @returns {Object} Подготовленный payload
     */
    preparePayload(content) {
        return {
            content: content,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Валидирует размер payload
     * @param {Object} payload - Payload для проверки
     * @throws {Error} Если payload слишком большой
     */
    validatePayloadSize(payload) {
        const payloadSize = JSON.stringify(payload).length;

        if (payloadSize > this.maxPayloadSize) {
            throw new Error(
                `Payload too large: ${(payloadSize / 1024 / 1024).toFixed(2)}MB ` +
                `(max: ${(this.maxPayloadSize / 1024 / 1024).toFixed(2)}MB)`
            );
        }
    }

    /**
     * Выполняет HTTP-запрос
     * @param {string} url - URL для запроса
     * @param {Object} payload - Данные для отправки
     * @returns {Promise<Object>} Ответ сервера
     */
    async makeRequest(url, payload) {
        const response = await fetch(url, {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Проверяет доступность сервиса
     * @param {string} serviceUrl - URL сервиса
     * @returns {Promise<boolean>} Доступен ли сервис
     */
    async checkServiceHealth(serviceUrl) {
        try {
            const response = await fetch(serviceUrl, {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            logger.error('Service health check failed:', error);
            return false;
        }
    }

    /**
     * Выполняет ping-запрос к сервису
     * @param {string} serviceUrl - URL сервиса
     * @returns {Promise<Object>} Результат ping
     */
    async pingService(serviceUrl) {
        try {
            const startTime = Date.now();
            const response = await fetch(serviceUrl, {
                method: 'GET',
                mode: 'no-cors'
            });
            const endTime = Date.now();

            return {
                success: true,
                responseTime: endTime - startTime,
                status: response.status || 'unknown'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: null
            };
        }
    }

    /**
     * Показывает уведомление об успешном сохранении
     */
    showSuccessNotification() {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Page Snapshot',
            message: 'Страница успешно сохранена'
        });
    }

    /**
     * Показывает уведомление об ошибке
     * @param {string} errorMessage - Сообщение об ошибке
     */
    showErrorNotification(errorMessage) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Page Snapshot',
            message: 'Ошибка сохранения: ' + errorMessage
        });
    }

    /**
     * Задержка выполнения
     * @param {number} ms - Время задержки в миллисекундах
     * @returns {Promise} Promise с задержкой
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Создает заголовки запроса
     * @param {Object} customHeaders - Дополнительные заголовки
     * @returns {Object} Объединенные заголовки
     */
    createHeaders(customHeaders = {}) {
        return {
            ...this.defaultHeaders,
            ...customHeaders
        };
    }

    /**
     * Обрабатывает ошибки HTTP-запросов
     * @param {Error} error - Ошибка
     * @returns {Object} Обработанная ошибка
     */
    handleRequestError(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                type: 'NETWORK_ERROR',
                message: 'Ошибка сети. Проверьте подключение к интернету.',
                originalError: error
            };
        }

        if (error.message.includes('HTTP')) {
            return {
                type: 'HTTP_ERROR',
                message: error.message,
                originalError: error
            };
        }

        return {
            type: 'UNKNOWN_ERROR',
            message: error.message,
            originalError: error
        };
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.HttpClient = HttpClient;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.HttpClient = HttpClient;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = HttpClient;
}
