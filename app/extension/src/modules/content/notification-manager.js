/**
 * Модуль управления уведомлениями в контексте страницы
 * Отвечает за показ уведомлений пользователю на веб-странице
 */

/**
 * Класс NotificationManager - управление уведомлениями
 */
class NotificationManager {
    constructor() {
        this.notifications = new Map();
        this.notificationCounter = 0;
        this.defaultOptions = {
            duration: 3000,
            position: 'top-right',
            animation: 'slide',
            closable: true,
            zIndex: 10001
        };
        this.positions = {
            'top-right': { top: '80px', right: '20px' },
            'top-left': { top: '80px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'top-center': { top: '80px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
        };
        this.types = {
            success: { color: '#4caf50', icon: '✓' },
            error: { color: '#f44336', icon: '✗' },
            warning: { color: '#ff9800', icon: '⚠' },
            info: { color: '#2196f3', icon: 'ℹ' },
            loading: { color: '#9c27b0', icon: '⟳' }
        };
    }

    /**
     * Показ уведомления
     * @param {string} message - Текст уведомления
     * @param {string} type - Тип уведомления (success, error, warning, info, loading)
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID уведомления
     */
    showNotification(message, type = 'info', options = {}) {
        try {
            const notificationId = this.generateNotificationId();
            const mergedOptions = { ...this.defaultOptions, ...options };

            const notification = this.createNotificationElement(message, type, notificationId, mergedOptions);
            this.addNotificationToDOM(notification);
            this.notifications.set(notificationId, notification);

            // Автоматическое скрытие
            if (mergedOptions.duration > 0) {
                setTimeout(() => {
                    this.hideNotification(notificationId);
                }, mergedOptions.duration);
            }

            logger.debug(`Notification shown (${type}): ${message}`);
            return notificationId;
        } catch (error) {
            logger.error('Error showing notification:', error);
            return null;
        }
    }

    /**
     * Создание элемента уведомления
     * @param {string} message - Текст уведомления
     * @param {string} type - Тип уведомления
     * @param {string} id - ID уведомления
     * @param {Object} options - Опции
     * @returns {HTMLElement} Элемент уведомления
     */
    createNotificationElement(message, type, id, options) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `page-snapshot-notification page-snapshot-notification-${type}`;

        // Получаем стили для типа
        const typeStyles = this.types[type] || this.types.info;
        const positionStyles = this.positions[options.position] || this.positions['top-right'];

        // Создаем содержимое уведомления
        const content = this.createNotificationContent(message, typeStyles, options);
        notification.appendChild(content);

        // Применяем стили
        this.applyNotificationStyles(notification, typeStyles, positionStyles, options);

        return notification;
    }

    /**
     * Создание содержимого уведомления
     * @param {string} message - Текст уведомления
     * @param {Object} typeStyles - Стили типа
     * @param {Object} options - Опции
     * @returns {HTMLElement} Контейнер содержимого
     */
    createNotificationContent(message, typeStyles, options) {
        const content = document.createElement('div');
        content.className = 'page-snapshot-notification-content';

        // Иконка
        if (options.showIcon !== false) {
            const icon = document.createElement('span');
            icon.className = 'page-snapshot-notification-icon';
            icon.textContent = typeStyles.icon;
            icon.style.color = typeStyles.color;
            content.appendChild(icon);
        }

        // Текст сообщения
        const text = document.createElement('span');
        text.className = 'page-snapshot-notification-message';
        text.textContent = message;
        content.appendChild(text);

        // Кнопка закрытия
        if (options.closable) {
            const closeButton = document.createElement('button');
            closeButton.className = 'page-snapshot-notification-close';
            closeButton.innerHTML = '×';
            closeButton.setAttribute('aria-label', 'Закрыть уведомление');
            closeButton.addEventListener('click', () => {
                this.hideNotification(content.parentElement.id);
            });
            content.appendChild(closeButton);
        }

        return content;
    }

    /**
     * Применение стилей к уведомлению
     * @param {HTMLElement} notification - Элемент уведомления
     * @param {Object} typeStyles - Стили типа
     * @param {Object} positionStyles - Стили позиции
     * @param {Object} options - Опции
     */
    applyNotificationStyles(notification, typeStyles, positionStyles, options) {
        const baseStyles = {
            position: 'fixed',
            padding: '12px 20px',
            backgroundColor: typeStyles.color,
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: options.zIndex.toString(),
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            maxWidth: '400px',
            wordWrap: 'break-word',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.4'
        };

        // Применяем базовые стили
        Object.assign(notification.style, baseStyles);

        // Применяем стили позиции
        Object.assign(notification.style, positionStyles);

        // Применяем анимацию
        this.applyNotificationAnimation(notification, options.animation);
    }

    /**
     * Применение анимации к уведомлению
     * @param {HTMLElement} notification - Элемент уведомления
     * @param {string} animation - Тип анимации
     */
    applyNotificationAnimation(notification, animation) {
        switch (animation) {
            case 'slide':
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.style.transform = 'translateX(0)';
                }, 100);
                break;
            case 'fade':
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.opacity = '1';
                }, 100);
                break;
            case 'scale':
                notification.style.transform = 'scale(0.8)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.transform = 'scale(1)';
                    notification.style.opacity = '1';
                }, 100);
                break;
            default:
                // Без анимации
                break;
        }
    }

    /**
     * Добавление уведомления в DOM
     * @param {HTMLElement} notification - Элемент уведомления
     */
    addNotificationToDOM(notification) {
        // Создаем контейнер для уведомлений если его нет
        let container = document.getElementById('page-snapshot-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'page-snapshot-notifications';
            container.className = 'page-snapshot-notifications-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10000;
            `;
            document.body.appendChild(container);
        }

        container.appendChild(notification);
    }

    /**
     * Скрытие уведомления
     * @param {string} notificationId - ID уведомления
     */
    hideNotification(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) {
            return;
        }

        try {
            // Анимация скрытия
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';

            // Удаление из DOM после анимации
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(notificationId);
            }, 300);

            logger.debug(`Notification hidden: ${notificationId}`);
        } catch (error) {
            logger.error('Error hiding notification:', error);
        }
    }

    /**
     * Скрытие всех уведомлений
     */
    hideAllNotifications() {
        this.notifications.forEach((notification, id) => {
            this.hideNotification(id);
        });
        logger.info('All notifications hidden');
    }

    /**
     * Генерация уникального ID для уведомления
     * @returns {string} Уникальный ID
     */
    generateNotificationId() {
        return `page-snapshot-notification-${++this.notificationCounter}-${Date.now()}`;
    }

    /**
     * Показ уведомления об успехе
     * @param {string} message - Текст сообщения
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID уведомления
     */
    showSuccess(message, options = {}) {
        return this.showNotification(message, 'success', options);
    }

    /**
     * Показ уведомления об ошибке
     * @param {string} message - Текст сообщения
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID уведомления
     */
    showError(message, options = {}) {
        return this.showNotification(message, 'error', { duration: 5000, ...options });
    }

    /**
     * Показ предупреждения
     * @param {string} message - Текст сообщения
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID уведомления
     */
    showWarning(message, options = {}) {
        return this.showNotification(message, 'warning', options);
    }

    /**
     * Показ информационного уведомления
     * @param {string} message - Текст сообщения
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID уведомления
     */
    showInfo(message, options = {}) {
        return this.showNotification(message, 'info', options);
    }

    /**
     * Показ уведомления о загрузке
     * @param {string} message - Текст сообщения
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID уведомления
     */
    showLoading(message, options = {}) {
        return this.showNotification(message, 'loading', { duration: 0, ...options });
    }

    /**
     * Обновление уведомления о загрузке
     * @param {string} notificationId - ID уведомления
     * @param {string} message - Новый текст сообщения
     * @param {string} type - Новый тип уведомления
     */
    updateNotification(notificationId, message, type = 'info') {
        const notification = this.notifications.get(notificationId);
        if (!notification) {
            return;
        }

        const messageElement = notification.querySelector('.page-snapshot-notification-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // Обновляем тип уведомления
        notification.className = `page-snapshot-notification page-snapshot-notification-${type}`;

        const typeStyles = this.types[type] || this.types.info;
        notification.style.backgroundColor = typeStyles.color;

        const iconElement = notification.querySelector('.page-snapshot-notification-icon');
        if (iconElement) {
            iconElement.textContent = typeStyles.icon;
            iconElement.style.color = typeStyles.color;
        }
    }

    /**
     * Получение информации об активных уведомлениях
     * @returns {Array} Список активных уведомлений
     */
    getActiveNotifications() {
        return Array.from(this.notifications.entries()).map(([id, notification]) => ({
            id,
            message: notification.querySelector('.page-snapshot-notification-message')?.textContent || '',
            type: notification.className.split(' ')[1]?.replace('page-snapshot-notification-', '') || 'info'
        }));
    }

    /**
     * Получение статистики уведомлений
     * @returns {Object} Статистика
     */
    getStatistics() {
        return {
            activeCount: this.notifications.size,
            totalShown: this.notificationCounter,
            defaultOptions: this.defaultOptions,
            availableTypes: Object.keys(this.types),
            availablePositions: Object.keys(this.positions)
        };
    }

    /**
     * Очистка всех уведомлений и данных
     */
    cleanup() {
        this.hideAllNotifications();
        this.notifications.clear();
        this.notificationCounter = 0;

        // Удаляем контейнер уведомлений
        const container = document.getElementById('page-snapshot-notifications');
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }

        logger.info('Notification manager cleaned up');
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
