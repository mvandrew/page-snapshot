/**
 * Централизованная система логирования для Chrome Extension
 * Обеспечивает единообразное форматирование и управление логами
 */

class Logger {
    constructor() {
        // Префикс для всех логов расширения
        this.PREFIX = 'Page Snapshot';

        // Уровни логирования
        this.LEVELS = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        // Текущий уровень логирования (по умолчанию INFO)
        this.currentLevel = this.LEVELS.INFO;

        // Кэш для настроек отладки
        this.debugEnabled = false;
        this.loadDebugSettings();
    }

    /**
     * Загружает настройки отладки из storage
     */
    async loadDebugSettings() {
        try {
            const result = await chrome.storage.sync.get(['enableDebug']);
            this.debugEnabled = result.enableDebug || false;

            // Устанавливаем уровень логирования на основе настроек
            this.currentLevel = this.debugEnabled ? this.LEVELS.DEBUG : this.LEVELS.INFO;
        } catch (error) {
            // В случае ошибки используем значения по умолчанию
            this.debugEnabled = false;
            this.currentLevel = this.LEVELS.INFO;
        }
    }

    /**
     * Обновляет настройки отладки
     * @param {boolean} enabled - Включена ли отладка
     */
    updateDebugSettings(enabled) {
        this.debugEnabled = enabled;
        this.currentLevel = enabled ? this.LEVELS.DEBUG : this.LEVELS.INFO;
    }

    /**
     * Форматирует сообщение с префиксом
     * @param {string} level - Уровень логирования
     * @param {string} message - Сообщение
     * @param {...any} args - Дополнительные аргументы
     * @returns {Array} Массив аргументов для console метода
     */
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${this.PREFIX} [${level}]: ${message}`;
        return [formattedMessage, ...args];
    }

    /**
     * Проверяет, нужно ли логировать сообщение на данном уровне
     * @param {number} level - Уровень сообщения
     * @returns {boolean} true если нужно логировать
     */
    shouldLog(level) {
        return level <= this.currentLevel;
    }

    /**
     * Логирует ошибку
     * @param {string} message - Сообщение об ошибке
     * @param {...any} args - Дополнительные аргументы
     */
    error(message, ...args) {
        if (this.shouldLog(this.LEVELS.ERROR)) {
            const formattedArgs = this.formatMessage('ERROR', message, ...args);
            console.error(...formattedArgs);
        }
    }

    /**
     * Логирует предупреждение
     * @param {string} message - Сообщение предупреждения
     * @param {...any} args - Дополнительные аргументы
     */
    warn(message, ...args) {
        if (this.shouldLog(this.LEVELS.WARN)) {
            const formattedArgs = this.formatMessage('WARN', message, ...args);
            console.warn(...formattedArgs);
        }
    }

    /**
     * Логирует информационное сообщение
     * @param {string} message - Информационное сообщение
     * @param {...any} args - Дополнительные аргументы
     */
    info(message, ...args) {
        if (this.shouldLog(this.LEVELS.INFO)) {
            const formattedArgs = this.formatMessage('INFO', message, ...args);
            console.log(...formattedArgs);
        }
    }

    /**
     * Логирует отладочное сообщение
     * @param {string} message - Отладочное сообщение
     * @param {...any} args - Дополнительные аргументы
     */
    debug(message, ...args) {
        if (this.shouldLog(this.LEVELS.DEBUG)) {
            const formattedArgs = this.formatMessage('DEBUG', message, ...args);
            console.log(...formattedArgs);
        }
    }

    /**
     * Логирует сообщение с кастомным уровнем
     * @param {string} level - Кастомный уровень
     * @param {string} message - Сообщение
     * @param {...any} args - Дополнительные аргументы
     */
    log(level, message, ...args) {
        const formattedArgs = this.formatMessage(level, message, ...args);
        console.log(...formattedArgs);
    }

    /**
     * Логирует группу сообщений
     * @param {string} groupName - Название группы
     * @param {Function} callback - Функция с логированием внутри группы
     */
    group(groupName, callback) {
        const formattedName = `${this.PREFIX}: ${groupName}`;
        console.group(formattedName);
        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Логирует группу сообщений (сворачиваемая)
     * @param {string} groupName - Название группы
     * @param {Function} callback - Функция с логированием внутри группы
     */
    groupCollapsed(groupName, callback) {
        const formattedName = `${this.PREFIX}: ${groupName}`;
        console.groupCollapsed(formattedName);
        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Логирует таблицу данных
     * @param {any} data - Данные для отображения в таблице
     * @param {string} message - Описание таблицы
     */
    table(data, message = '') {
        if (this.shouldLog(this.LEVELS.DEBUG)) {
            if (message) {
                this.debug(message);
            }
            console.table(data);
        }
    }

    /**
     * Логирует объект с форматированием
     * @param {any} obj - Объект для логирования
     * @param {string} message - Описание объекта
     */
    object(obj, message = '') {
        if (this.shouldLog(this.LEVELS.DEBUG)) {
            if (message) {
                this.debug(message);
            }
            console.log(obj);
        }
    }

    /**
     * Логирует стек вызовов
     * @param {string} message - Сообщение
     */
    trace(message = 'Trace') {
        if (this.shouldLog(this.LEVELS.DEBUG)) {
            const formattedMessage = `${this.PREFIX}: ${message}`;
            console.trace(formattedMessage);
        }
    }

    /**
     * Логирует время выполнения операции
     * @param {string} label - Метка для измерения времени
     */
    time(label) {
        if (this.shouldLog(this.LEVELS.DEBUG)) {
            const formattedLabel = `${this.PREFIX}: ${label}`;
            console.time(formattedLabel);
        }
    }

    /**
     * Завершает измерение времени
     * @param {string} label - Метка для измерения времени
     */
    timeEnd(label) {
        if (this.shouldLog(this.LEVELS.DEBUG)) {
            const formattedLabel = `${this.PREFIX}: ${label}`;
            console.timeEnd(formattedLabel);
        }
    }
}

// Создаем глобальный экземпляр логгера
const logger = new Logger();

// Экспортируем логгер для использования в других модулях
if (typeof self !== 'undefined') {
    self.Logger = Logger;
    self.logger = logger;
}

// Экспортируем для ES6 модулей (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, logger };
}
