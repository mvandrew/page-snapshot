/**
 * Модуль сбора информации о странице
 * Отвечает за получение и обработку данных о текущей странице
 */

/**
 * Класс PageInfoCollector - сбор информации о странице
 */
class PageInfoCollector {
    constructor() {
        this.maxHtmlSize = 2 * 1024 * 1024; // 2MB максимальный размер HTML
        this.lastPageInfo = null;
    }

    /**
     * Получение полной информации о странице
     * @returns {Object} Информация о странице
     */
    getPageInfo() {
        const pageInfo = {
            html: this.getPageHtml(),
            url: this.getPageUrl(),
            title: this.getPageTitle(),
            timestamp: this.getCurrentTimestamp(),
            viewport: this.getViewportInfo(),
            scrollPosition: this.getScrollPosition(),
            metadata: this.getPageMetadata()
        };

        // Логируем информацию о странице
        logger.info('Page info collected:', {
            url: pageInfo.url,
            hostname: window.location.hostname,
            title: pageInfo.title,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname,
            htmlSize: pageInfo.html.length
        });

        // Сохраняем для сравнения
        this.lastPageInfo = pageInfo;

        return pageInfo;
    }

    /**
     * Получение HTML содержимого страницы
     * @returns {string} HTML содержимое
     */
    getPageHtml() {
        try {
            return document.documentElement.outerHTML;
        } catch (error) {
            logger.error('Error getting page HTML:', error);
            return '<html>Error getting page content</html>';
        }
    }

    /**
     * Получение URL страницы
     * @returns {string} URL страницы
     */
    getPageUrl() {
        try {
            return window.location.href;
        } catch (error) {
            logger.error('Error getting page URL:', error);
            return '';
        }
    }

    /**
     * Получение заголовка страницы
     * @returns {string} Заголовок страницы
     */
    getPageTitle() {
        try {
            return document.title || 'Untitled Page';
        } catch (error) {
            logger.error('Error getting page title:', error);
            return 'Untitled Page';
        }
    }

    /**
     * Получение текущей временной метки
     * @returns {string} ISO строка времени
     */
    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Получение информации о viewport
     * @returns {Object} Информация о viewport
     */
    getViewportInfo() {
        try {
            return {
                width: window.innerWidth || 0,
                height: window.innerHeight || 0,
                devicePixelRatio: window.devicePixelRatio || 1,
                screenWidth: screen.width || 0,
                screenHeight: screen.height || 0,
                colorDepth: screen.colorDepth || 24,
                orientation: this.getScreenOrientation()
            };
        } catch (error) {
            logger.error('Error getting viewport info:', error);
            return {
                width: 1920,
                height: 1080,
                devicePixelRatio: 1,
                screenWidth: 1920,
                screenHeight: 1080,
                colorDepth: 24,
                orientation: 'landscape'
            };
        }
    }

    /**
     * Получение ориентации экрана
     * @returns {string} Ориентация экрана
     */
    getScreenOrientation() {
        try {
            if (screen.orientation) {
                return screen.orientation.type || 'unknown';
            }

            // Fallback для старых браузеров
            const width = window.innerWidth || screen.width;
            const height = window.innerHeight || screen.height;
            return width > height ? 'landscape' : 'portrait';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Получение позиции прокрутки
     * @returns {Object} Позиция прокрутки
     */
    getScrollPosition() {
        try {
            return {
                x: window.scrollX || window.pageXOffset || 0,
                y: window.scrollY || window.pageYOffset || 0,
                maxScrollX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
                maxScrollY: Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
            };
        } catch (error) {
            logger.error('Error getting scroll position:', error);
            return { x: 0, y: 0, maxScrollX: 0, maxScrollY: 0 };
        }
    }

    /**
     * Получение метаданных страницы
     * @returns {Object} Метаданные страницы
     */
    getPageMetadata() {
        try {
            return {
                domain: this.extractDomain(window.location.href),
                protocol: window.location.protocol,
                port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
                pathname: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash,
                referrer: document.referrer || '',
                userAgent: navigator.userAgent,
                language: navigator.language || 'en',
                languages: navigator.languages || [navigator.language || 'en'],
                platform: navigator.platform || 'unknown',
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                doNotTrack: navigator.doNotTrack || 'unspecified',
                timezone: this.getTimezone(),
                pageLoadTime: this.getPageLoadTime(),
                documentReadyState: document.readyState,
                documentCharacterSet: document.characterSet || document.charset || 'UTF-8'
            };
        } catch (error) {
            logger.error('Error getting page metadata:', error);
            return {
                domain: 'unknown',
                protocol: 'unknown',
                port: 'unknown',
                pathname: 'unknown',
                search: '',
                hash: '',
                referrer: '',
                userAgent: 'unknown',
                language: 'en',
                languages: ['en'],
                platform: 'unknown',
                cookieEnabled: false,
                onLine: true,
                doNotTrack: 'unspecified',
                timezone: 'UTC',
                pageLoadTime: 0,
                documentReadyState: 'unknown',
                documentCharacterSet: 'UTF-8'
            };
        }
    }

    /**
     * Извлечение домена из URL
     * @param {string} url - URL для извлечения домена
     * @returns {string|null} Домен или null при ошибке
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            logger.error('Error extracting domain:', error);
            return null;
        }
    }

    /**
     * Получение временной зоны
     * @returns {string} Временная зона
     */
    getTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (error) {
            return 'UTC';
        }
    }

    /**
     * Получение времени загрузки страницы
     * @returns {number} Время загрузки в миллисекундах
     */
    getPageLoadTime() {
        try {
            if (performance && performance.timing) {
                const timing = performance.timing;
                return timing.loadEventEnd - timing.navigationStart;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Проверка изменений на странице
     * @returns {boolean} Изменилась ли страница
     */
    hasPageChanged() {
        if (!this.lastPageInfo) {
            return true;
        }

        const currentHtml = this.getPageHtml();
        return currentHtml !== this.lastPageInfo.html;
    }

    /**
     * Получение изменений страницы
     * @returns {Object|null} Информация об изменениях или null
     */
    getPageChanges() {
        if (!this.lastPageInfo) {
            return null;
        }

        const currentInfo = this.getPageInfo();
        const changes = {};

        // Проверяем изменения в основных полях
        if (currentInfo.url !== this.lastPageInfo.url) {
            changes.url = { from: this.lastPageInfo.url, to: currentInfo.url };
        }

        if (currentInfo.title !== this.lastPageInfo.title) {
            changes.title = { from: this.lastPageInfo.title, to: currentInfo.title };
        }

        if (currentInfo.html !== this.lastPageInfo.html) {
            changes.html = {
                from: this.lastPageInfo.html.length,
                to: currentInfo.html.length,
                sizeChange: currentInfo.html.length - this.lastPageInfo.html.length
            };
        }

        if (JSON.stringify(currentInfo.scrollPosition) !== JSON.stringify(this.lastPageInfo.scrollPosition)) {
            changes.scrollPosition = {
                from: this.lastPageInfo.scrollPosition,
                to: currentInfo.scrollPosition
            };
        }

        return Object.keys(changes).length > 0 ? changes : null;
    }

    /**
     * Валидация информации о странице
     * @param {Object} pageInfo - Информация о странице
     * @returns {Object} Результат валидации
     */
    validatePageInfo(pageInfo) {
        const errors = [];

        if (!pageInfo) {
            errors.push('Page info is null or undefined');
            return { isValid: false, errors };
        }

        if (!pageInfo.html || typeof pageInfo.html !== 'string') {
            errors.push('HTML content is missing or invalid');
        }

        if (!pageInfo.url || typeof pageInfo.url !== 'string') {
            errors.push('URL is missing or invalid');
        }

        if (!pageInfo.title || typeof pageInfo.title !== 'string') {
            errors.push('Title is missing or invalid');
        }

        if (!pageInfo.timestamp || typeof pageInfo.timestamp !== 'string') {
            errors.push('Timestamp is missing or invalid');
        }

        // Проверяем размер HTML
        if (pageInfo.html && pageInfo.html.length > this.maxHtmlSize) {
            errors.push(`HTML content too large: ${pageInfo.html.length} bytes (max: ${this.maxHtmlSize} bytes)`);
        }

        // Проверяем валидность URL
        if (pageInfo.url) {
            try {
                new URL(pageInfo.url);
            } catch (error) {
                errors.push('Invalid URL format');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Создание сжатой версии информации о странице
     * @param {Object} pageInfo - Исходная информация о странице
     * @returns {Object} Сжатая информация о странице
     */
    createCompressedPageInfo(pageInfo) {
        const compressed = { ...pageInfo };

        // Сжимаем HTML если он слишком большой
        if (compressed.html && compressed.html.length > this.maxHtmlSize) {
            logger.warn(`HTML too large (${compressed.html.length} bytes), truncating to ${this.maxHtmlSize} bytes`);
            compressed.html = compressed.html.substring(0, this.maxHtmlSize) + '... [TRUNCATED]';
            compressed.truncated = true;
            compressed.originalSize = pageInfo.html.length;
        }

        return compressed;
    }

    /**
     * Получение статистики страницы
     * @returns {Object} Статистика страницы
     */
    getPageStatistics() {
        const pageInfo = this.getPageInfo();

        return {
            htmlSize: pageInfo.html ? pageInfo.html.length : 0,
            titleLength: pageInfo.title ? pageInfo.title.length : 0,
            urlLength: pageInfo.url ? pageInfo.url.length : 0,
            viewportArea: pageInfo.viewport ? pageInfo.viewport.width * pageInfo.viewport.height : 0,
            scrollPercentage: this.getScrollPercentage(),
            elementCount: this.getElementCount(),
            linkCount: this.getLinkCount(),
            imageCount: this.getImageCount(),
            formCount: this.getFormCount()
        };
    }

    /**
     * Получение процента прокрутки
     * @returns {number} Процент прокрутки (0-100)
     */
    getScrollPercentage() {
        try {
            const scrollPosition = this.getScrollPosition();
            if (scrollPosition.maxScrollY === 0) return 0;
            return Math.round((scrollPosition.y / scrollPosition.maxScrollY) * 100);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Подсчет элементов на странице
     * @returns {number} Количество элементов
     */
    getElementCount() {
        try {
            return document.querySelectorAll('*').length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Подсчет ссылок на странице
     * @returns {number} Количество ссылок
     */
    getLinkCount() {
        try {
            return document.querySelectorAll('a[href]').length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Подсчет изображений на странице
     * @returns {number} Количество изображений
     */
    getImageCount() {
        try {
            return document.querySelectorAll('img').length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Подсчет форм на странице
     * @returns {number} Количество форм
     */
    getFormCount() {
        try {
            return document.querySelectorAll('form').length;
        } catch (error) {
            return 0;
        }
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.PageInfoCollector = PageInfoCollector;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.PageInfoCollector = PageInfoCollector;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = PageInfoCollector;
}
