/**
 * Модуль обработки контента страниц
 * Отвечает за получение, обработку и оптимизацию контента страниц
 */

/**
 * Класс для обработки контента страниц
 */
class ContentProcessor {
    constructor() {
        this.maxHtmlSize = 2 * 1024 * 1024; // 2MB максимальный размер HTML
    }

    /**
     * Получает содержимое страницы через content script
     * @param {number} tabId - ID вкладки
     * @returns {Promise<Object|null>} Содержимое страницы или null при ошибке
     */
    async getPageContent(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => {
                    return {
                        html: document.documentElement.outerHTML,
                        url: window.location.href,
                        title: document.title,
                        timestamp: new Date().toISOString()
                    };
                }
            });

            return results[0]?.result || null;
        } catch (error) {
            console.error('Error getting page content:', error);
            // Возвращаем базовую информацию о странице при ошибке
            try {
                const tab = await chrome.tabs.get(tabId);
                return {
                    html: '<html>Content not available</html>',
                    url: tab.url,
                    title: tab.title,
                    timestamp: new Date().toISOString()
                };
            } catch (tabError) {
                console.error('Error getting tab info:', tabError);
                return null;
            }
        }
    }

    /**
     * Обрабатывает HTML-контент для уменьшения размера
     * @param {Object} content - Контент страницы
     * @returns {Object} Обработанный контент
     */
    processHtmlContent(content) {
        if (!content || !content.html) {
            return content;
        }

        let processedHtml = content.html;

        try {
            // 1. Удаляем лишние пробелы и переносы строк
            processedHtml = processedHtml.replace(/\s+/g, ' ');

            // 2. Удаляем комментарии HTML
            processedHtml = processedHtml.replace(/<!--[\s\S]*?-->/g, '');

            // 3. Удаляем лишние атрибуты (оставляем только важные)
            processedHtml = processedHtml.replace(/\s+(style|class|id|href|src|alt|title)="[^"]*"/g, '');

            // 4. Удаляем пустые теги
            processedHtml = processedHtml.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '');

            // 5. Сжимаем JavaScript и CSS
            processedHtml = processedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
                // Оставляем только внешние скрипты
                if (match.includes('src=')) {
                    return match;
                }
                // Удаляем встроенные скрипты
                return '';
            });

            processedHtml = processedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

            // 6. Ограничиваем размер HTML
            if (processedHtml.length > this.maxHtmlSize) {
                console.warn(`Page Snapshot: HTML too large (${processedHtml.length} bytes), truncating to ${this.maxHtmlSize} bytes`);
                processedHtml = processedHtml.substring(0, this.maxHtmlSize) + '... [TRUNCATED]';
            }

            console.log('HTML processed for size optimization');

        } catch (error) {
            console.error('Page Snapshot: Error processing HTML:', error);
            // В случае ошибки возвращаем оригинальный контент
            return content;
        }

        return {
            ...content,
            html: processedHtml
        };
    }

    /**
     * Вычисляет контрольную сумму контента для проверки изменений
     * @param {Object} pageContent - Контент страницы
     * @returns {Promise<string>} Контрольная сумма
     */
    async calculateChecksum(pageContent) {
        // Создаем строку для хэширования из всех важных данных (как в backend)
        const dataToHash = JSON.stringify({
            html: pageContent.html,
            url: pageContent.url
        });

        // Вычисляем SHA-256 хэш (используем Web Crypto API)
        const encoder = new TextEncoder();
        const data = encoder.encode(dataToHash);

        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Проверяет, изменился ли контент по сравнению с предыдущим
     * @param {Object} currentContent - Текущий контент
     * @param {string} lastChecksum - Предыдущая контрольная сумма
     * @returns {Promise<{changed: boolean, checksum: string}>} Результат проверки
     */
    async hasContentChanged(currentContent, lastChecksum) {
        const currentChecksum = await this.calculateChecksum(currentContent);
        return {
            changed: currentChecksum !== lastChecksum,
            checksum: currentChecksum
        };
    }

    /**
     * Валидирует контент страницы
     * @param {Object} content - Контент для валидации
     * @returns {Object} Результат валидации
     */
    validateContent(content) {
        const errors = [];

        if (!content) {
            errors.push('Content is null or undefined');
            return { isValid: false, errors };
        }

        if (!content.html || typeof content.html !== 'string') {
            errors.push('HTML content is missing or invalid');
        }

        if (!content.url || typeof content.url !== 'string') {
            errors.push('URL is missing or invalid');
        }

        if (!content.title || typeof content.title !== 'string') {
            errors.push('Title is missing or invalid');
        }

        if (!content.timestamp || typeof content.timestamp !== 'string') {
            errors.push('Timestamp is missing or invalid');
        }

        // Проверяем размер HTML
        if (content.html && content.html.length > this.maxHtmlSize) {
            errors.push(`HTML content too large: ${content.html.length} bytes (max: ${this.maxHtmlSize} bytes)`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Создает сжатый контент для отправки
     * @param {Object} content - Исходный контент
     * @returns {Object} Сжатый контент
     */
    createCompressedContent(content) {
        const processedContent = this.processHtmlContent(content);

        return {
            ...processedContent,
            compressed: true,
            originalSize: content.html ? content.html.length : 0,
            compressedSize: processedContent.html ? processedContent.html.length : 0
        };
    }

    /**
     * Создает метаданные страницы
     * @param {Object} content - Контент страницы
     * @returns {Object} Метаданные
     */
    createPageMetadata(content) {
        return {
            url: content.url,
            title: content.title,
            timestamp: content.timestamp,
            domain: this.extractDomain(content.url),
            userAgent: navigator.userAgent,
            viewport: this.getViewportInfo()
        };
    }

    /**
     * Извлекает домен из URL
     * @param {string} url - URL для извлечения домена
     * @returns {string|null} Домен или null при ошибке
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            console.error('Error extracting domain:', error);
            return null;
        }
    }

    /**
     * Получает информацию о viewport
     * @returns {Object} Информация о viewport
     */
    getViewportInfo() {
        // В Service Worker нет доступа к window, возвращаем значения по умолчанию
        if (typeof window !== 'undefined') {
            return {
                width: window.innerWidth || 0,
                height: window.innerHeight || 0,
                devicePixelRatio: window.devicePixelRatio || 1
            };
        }

        // Значения по умолчанию для Service Worker
        return {
            width: 1920,
            height: 1080,
            devicePixelRatio: 1
        };
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.ContentProcessor = ContentProcessor;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.ContentProcessor = ContentProcessor;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = ContentProcessor;
}
