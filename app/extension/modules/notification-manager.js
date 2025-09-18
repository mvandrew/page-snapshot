/**
 * Модуль управления уведомлениями
 * Отвечает за показ уведомлений пользователю
 */

// Логгер уже должен быть загружен в background.js

/**
 * Класс для управления уведомлениями
 */
class NotificationManager {
    constructor() {
        this.defaultIconUrl = 'icons/icon48.png';
        this.notificationTypes = {
            SUCCESS: 'success',
            ERROR: 'error',
            INFO: 'info',
            WARNING: 'warning'
        };
    }

    /**
     * Показывает уведомление об успешном сохранении
     * @param {string} message - Сообщение (опционально)
     */
    showSaveSuccess(message = 'Страница успешно сохранена') {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: message
        });
    }

    /**
     * Показывает уведомление об ошибке сохранения
     * @param {string} errorMessage - Сообщение об ошибке
     */
    showSaveError(errorMessage) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: 'Ошибка сохранения: ' + errorMessage
        });
    }

    /**
     * Показывает уведомление о конфигурации
     * @param {string} message - Сообщение
     */
    showConfigurationMessage(message) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot - Настройка',
            message: message
        });
    }

    /**
     * Показывает уведомление о предупреждении
     * @param {string} message - Сообщение
     */
    showWarning(message) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot - Предупреждение',
            message: message
        });
    }

    /**
     * Показывает информационное уведомление
     * @param {string} message - Сообщение
     */
    showInfo(message) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: message
        });
    }

    /**
     * Показывает уведомление о начале автоматического сохранения
     */
    showAutoSaveStarted() {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: 'Автоматическое сохранение активировано'
        });
    }

    /**
     * Показывает уведомление об остановке автоматического сохранения
     */
    showAutoSaveStopped() {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: 'Автоматическое сохранение остановлено'
        });
    }

    /**
     * Показывает уведомление о пропуске сохранения
     * @param {string} reason - Причина пропуска
     */
    showSaveSkipped(reason) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: `Сохранение пропущено: ${reason}`
        });
    }

    /**
     * Показывает уведомление о миграции настроек
     * @param {boolean} success - Успешность миграции
     */
    showMigrationNotification(success) {
        if (success) {
            this.showNotification({
                type: 'basic',
                iconUrl: this.defaultIconUrl,
                title: 'Page Snapshot',
                message: 'Настройки успешно обновлены'
            });
        } else {
            this.showNotification({
                type: 'basic',
                iconUrl: this.defaultIconUrl,
                title: 'Page Snapshot',
                message: 'Ошибка обновления настроек'
            });
        }
    }

    /**
     * Показывает уведомление о восстановлении настроек
     * @param {boolean} success - Успешность восстановления
     */
    showRestoreNotification(success) {
        if (success) {
            this.showNotification({
                type: 'basic',
                iconUrl: this.defaultIconUrl,
                title: 'Page Snapshot',
                message: 'Настройки восстановлены из резервной копии'
            });
        } else {
            this.showNotification({
                type: 'basic',
                iconUrl: this.defaultIconUrl,
                title: 'Page Snapshot',
                message: 'Не удалось восстановить настройки'
            });
        }
    }

    /**
     * Показывает уведомление о превышении лимита размера
     * @param {number} size - Размер в байтах
     * @param {number} maxSize - Максимальный размер в байтах
     */
    showSizeLimitExceeded(size, maxSize) {
        const sizeMB = (size / 1024 / 1024).toFixed(2);
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);

        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot - Превышен лимит',
            message: `Размер страницы ${sizeMB}MB превышает лимит ${maxSizeMB}MB`
        });
    }

    /**
     * Показывает уведомление о проблемах с доменом
     * @param {string} domain - Домен
     */
    showDomainError(domain) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: `Домен ${domain} не настроен для автоматического сохранения`
        });
    }

    /**
     * Показывает уведомление о проблемах с сервисом
     * @param {string} serviceUrl - URL сервиса
     */
    showServiceError(serviceUrl) {
        this.showNotification({
            type: 'basic',
            iconUrl: this.defaultIconUrl,
            title: 'Page Snapshot',
            message: `Не удается подключиться к сервису: ${serviceUrl}`
        });
    }

    /**
     * Базовый метод для показа уведомлений
     * @param {Object} options - Опции уведомления
     */
    showNotification(options) {
        try {
            chrome.notifications.create(options);
        } catch (error) {
            logger.error('Error showing notification:', error);
        }
    }

    /**
     * Очищает все уведомления
     */
    async clearAllNotifications() {
        try {
            const notifications = await chrome.notifications.getAll();
            for (const id of Object.keys(notifications)) {
                chrome.notifications.clear(id);
            }
        } catch (error) {
            logger.error('Error clearing notifications:', error);
        }
    }

    /**
     * Проверяет, поддерживаются ли уведомления
     * @returns {boolean} Поддерживаются ли уведомления
     */
    isNotificationSupported() {
        return 'notifications' in chrome && chrome.notifications;
    }

    /**
     * Запрашивает разрешение на показ уведомлений
     * @returns {Promise<boolean>} Предоставлено ли разрешение
     */
    async requestPermission() {
        try {
            if (this.isNotificationSupported()) {
                return await chrome.notifications.requestPermission();
            }
            return false;
        } catch (error) {
            logger.error('Error requesting notification permission:', error);
            return false;
        }
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.NotificationManager = NotificationManager;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.NotificationManager = NotificationManager;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = NotificationManager;
}
