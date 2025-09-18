// Content Script для взаимодействия с веб-страницами
// Модульная архитектура с разделением ответственности

// Загружаем все необходимые модули
importScripts(
    'src/modules/shared/logger.js',
    'src/modules/content/page-info-collector.js',
    'src/modules/content/auto-save-manager.js',
    'src/modules/content/element-highlighter.js',
    'src/modules/content/notification-manager.js',
    'src/modules/content/content-controller.js'
);

// Инициализация при загрузке страницы
(function () {
    'use strict';

    // Логгер уже загружен через importScripts
    const logger = self.logger;

    logger.info('Content script loaded');

    // Проверяем доступность модулей
    if (!self.ContentController) {
        logger.error('ContentController module not available');
        return;
    }

    // Инициализируем главный контроллер
    const contentController = new self.ContentController();

    // Экспортируем контроллер для отладки
    if (typeof window !== 'undefined') {
        window.pageSnapshotController = contentController;
    }

    logger.info('Content script initialized with modular architecture');

})();
