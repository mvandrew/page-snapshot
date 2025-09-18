/**
 * Экспорт всех общих модулей
 * Предоставляет единую точку входа для импорта shared модулей
 */

// Экспорт логгера
export { Logger } from './logger.js';

// Экспорт менеджера настроек
export { SettingsManager } from './settings-manager.js';

// Экспорт валидатора доменов
export { DomainValidator } from './domain-validator.js';

// Экспорт HTTP клиента
export { HttpClient } from './http-client.js';

// Создание глобальных экземпляров для удобства использования
export const logger = new Logger();
export const settingsManager = new SettingsManager();
export const domainValidator = new DomainValidator();
export const httpClient = new HttpClient();
