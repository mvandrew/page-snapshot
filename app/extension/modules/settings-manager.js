/**
 * Модуль управления настройками расширения
 * Отвечает за загрузку, сохранение, миграцию и валидацию настроек
 */

// Настройки по умолчанию
const DEFAULT_SETTINGS = {
    domains: [],
    serviceUrl: '',
    enableAutoSave: true,
    saveInterval: 10, // Минимальная задержка 10 секунд по умолчанию
    saveOnlyOnChange: true,
    enableNotifications: true,
    enableDebug: false,
    maxRetries: 3,
    autoCapture: false,
    captureFormat: 'png',
    quality: 0.9,
    lastChecksum: null
};

// Константы для ограничений интервала
const MIN_SAVE_INTERVAL_SECONDS = 5; // Минимальная задержка 5 секунд
const MAX_SAVE_INTERVAL_SECONDS = 60; // Максимальная задержка 60 секунд

// Версия настроек для миграции
const SETTINGS_VERSION = '1.0.0';

/**
 * Класс для управления настройками расширения
 */
class SettingsManager {
    constructor() {
        this.defaultSettings = { ...DEFAULT_SETTINGS };
    }

    /**
     * Загружает настройки с восстановлением из резервной копии при необходимости
     * @returns {Promise<Object>} Настройки расширения
     */
    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(Object.keys(this.defaultSettings));

            // Если настройки пустые, пытаемся восстановить из резервной копии
            if (!settings || Object.keys(settings).length === 0) {
                const restored = await this.restoreSettingsFromBackup();
                if (restored) {
                    // Повторно получаем настройки после восстановления
                    const restoredSettings = await chrome.storage.sync.get(Object.keys(this.defaultSettings));
                    return this.ensureAllSettingsFields({ ...this.defaultSettings, ...restoredSettings });
                }
            }

            // Принудительно добавляем все поля из defaultSettings
            const mergedSettings = this.ensureAllSettingsFields({ ...this.defaultSettings, ...settings });

            // Нормализуем домены
            if (mergedSettings.domains) {
                mergedSettings.domains = this.normalizeDomains(mergedSettings.domains);
            }

            // Нормализуем интервал сохранения
            if (mergedSettings.saveInterval !== undefined) {
                const originalInterval = mergedSettings.saveInterval;
                mergedSettings.saveInterval = this.normalizeSaveInterval(mergedSettings.saveInterval);

                if (originalInterval !== mergedSettings.saveInterval) {
                    console.log('Save interval normalized during load');
                }
            }

            return mergedSettings;
        } catch (error) {
            console.error('Page Snapshot: Error loading settings:', error);
            console.error('Page Snapshot: Error stack:', error.stack);
            return { ...this.defaultSettings };
        }
    }

    /**
     * Сохраняет настройки с нормализацией
     * @param {Object} settings - Настройки для сохранения
     * @returns {Promise<boolean>} Успешность сохранения
     */
    async saveSettings(settings) {
        try {
            // Нормализуем настройки перед сохранением
            const normalizedSettings = { ...settings };

            // Нормализуем домены
            if (normalizedSettings.domains) {
                normalizedSettings.domains = this.normalizeDomains(normalizedSettings.domains);
            }

            // Нормализуем интервал сохранения
            if (normalizedSettings.saveInterval !== undefined) {
                const originalInterval = normalizedSettings.saveInterval;
                normalizedSettings.saveInterval = this.normalizeSaveInterval(normalizedSettings.saveInterval);

                if (originalInterval !== normalizedSettings.saveInterval) {
                    console.log('Save interval normalized on save');
                }
            }

            await chrome.storage.sync.set(normalizedSettings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Выполняет миграцию настроек при обновлении расширения
     * @returns {Promise<void>}
     */
    async migrateSettings() {
        try {
            // Получаем текущие настройки
            const existingSettings = await chrome.storage.sync.get(null);

            // Проверяем версию настроек
            if (existingSettings.settingsVersion !== SETTINGS_VERSION) {
                // Создаем резервную копию существующих настроек
                const backupSettings = { ...existingSettings };
                backupSettings.backupDate = new Date().toISOString();
                await chrome.storage.local.set({ settingsBackup: backupSettings });

                // Создаем объект с настройками по умолчанию
                const migratedSettings = { ...this.defaultSettings };

                // Переносим существующие настройки, если они есть
                for (const [key, value] of Object.entries(existingSettings)) {
                    if (key in this.defaultSettings && value !== undefined) {
                        migratedSettings[key] = value;
                    }
                }

                // Нормализуем настройки после миграции
                if (migratedSettings.domains) {
                    migratedSettings.domains = this.normalizeDomains(migratedSettings.domains);
                }

                if (migratedSettings.saveInterval !== undefined) {
                    const originalInterval = migratedSettings.saveInterval;
                    migratedSettings.saveInterval = this.normalizeSaveInterval(migratedSettings.saveInterval);

                    if (originalInterval !== migratedSettings.saveInterval) {
                        console.log('Save interval normalized during migration');
                    }
                }

                // Добавляем версию настроек
                migratedSettings.settingsVersion = SETTINGS_VERSION;

                // Сохраняем мигрированные настройки
                await chrome.storage.sync.set(migratedSettings);
            }
        } catch (error) {
            console.error('Page Snapshot: Error migrating settings:', error);
        }
    }

    /**
     * Восстанавливает настройки из резервной копии
     * @returns {Promise<boolean>} Успешность восстановления
     */
    async restoreSettingsFromBackup() {
        try {
            const backup = await chrome.storage.local.get(['settingsBackup']);
            if (backup.settingsBackup) {
                await chrome.storage.sync.set(backup.settingsBackup);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Page Snapshot: Error restoring settings from backup:', error);
            return false;
        }
    }

    /**
     * Нормализует список доменов
     * @param {Array} domains - Массив доменов
     * @returns {Array} Нормализованный массив доменов
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
     * Нормализует интервал сохранения
     * @param {number} interval - Интервал в секундах
     * @returns {number} Нормализованный интервал
     */
    normalizeSaveInterval(interval) {
        // Преобразуем в число
        const numInterval = parseInt(interval, 10);

        // Если не число или меньше 0, возвращаем минимальное значение
        if (isNaN(numInterval) || numInterval < 0) {
            return MIN_SAVE_INTERVAL_SECONDS;
        }

        // Если 0, отключаем автоматическое сохранение
        if (numInterval === 0) {
            return 0;
        }

        // Ограничиваем минимальным и максимальным значением
        return Math.max(MIN_SAVE_INTERVAL_SECONDS, Math.min(MAX_SAVE_INTERVAL_SECONDS, numInterval));
    }

    /**
     * Гарантирует наличие всех полей настроек
     * @param {Object} settings - Настройки для проверки
     * @returns {Object} Настройки с гарантированными полями
     */
    ensureAllSettingsFields(settings) {
        const ensuredSettings = { ...this.defaultSettings };

        // Копируем только существующие поля из переданных настроек
        for (const [key, value] of Object.entries(settings)) {
            if (key in this.defaultSettings && value !== undefined) {
                ensuredSettings[key] = value;
            }
        }

        // Логируем отсутствующие поля
        const missingFields = [];
        for (const key of Object.keys(this.defaultSettings)) {
            if (!(key in settings) || settings[key] === undefined) {
                missingFields.push(key);
            }
        }

        if (missingFields.length > 0) {
            console.log('Missing fields, using defaults:', missingFields);
        }

        return ensuredSettings;
    }

    /**
     * Проверяет, настроено ли расширение
     * @param {Array} domains - Массив доменов
     * @param {string} serviceUrl - URL сервиса
     * @returns {boolean} Настроено ли расширение
     */
    isExtensionConfigured(domains, serviceUrl) {
        // Проверяем, что задан хотя бы один домен
        if (!domains || domains.length === 0) {
            return false;
        }

        // Проверяем, что задан URL сервиса
        if (!serviceUrl || serviceUrl.trim() === '') {
            return false;
        }

        return true;
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.SettingsManager = SettingsManager;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.SettingsManager = SettingsManager;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = SettingsManager;
}
