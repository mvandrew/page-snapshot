/**
 * Экспорт всех модулей для content script
 * Предоставляет единую точку входа для импорта content модулей
 */

// Экспорт content модулей
export { ContentProcessor } from './content-processor.js';
export { ContentController } from './content-controller.js';
export { PageInfoCollector } from './page-info-collector.js';
export { AutoSaveManager } from './auto-save-manager.js';
export { ElementHighlighter } from './element-highlighter.js';
export { NotificationManager } from './notification-manager.js';

// Создание экземпляров для использования в content script
export const contentProcessor = new ContentProcessor();
export const contentController = new ContentController();
export const pageInfoCollector = new PageInfoCollector();
export const autoSaveManager = new AutoSaveManager();
export const elementHighlighter = new ElementHighlighter();
export const notificationManager = new NotificationManager();
