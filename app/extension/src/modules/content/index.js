/**
 * Экспорт всех модулей для content script
 * Предоставляет единую точку входа для импорта content модулей
 */

// Экспорт content модулей
export { ContentProcessor } from './content-processor.js';

// Создание экземпляра для использования в content script
export const contentProcessor = new ContentProcessor();
