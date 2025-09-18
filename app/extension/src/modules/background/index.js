/**
 * Экспорт всех модулей для background script
 * Предоставляет единую точку входа для импорта background модулей
 */

// Импорт shared модулей
import { logger, settingsManager, domainValidator, httpClient } from '../shared/index.js';

// Экспорт background модулей
export { BackgroundController } from './background-controller.js';
export { AutoSaveManager } from './auto-save-manager.js';
export { NotificationManager } from './notification-manager.js';

// Создание экземпляров с зависимостями
export const notificationManager = new NotificationManager();

// BackgroundController создается с зависимостями в background.js
// AutoSaveManager создается с зависимостями в BackgroundController
