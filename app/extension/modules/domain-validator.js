/**
 * Модуль валидации доменов
 * Отвечает за проверку соответствия URL доменам из настроек
 */

/**
 * Класс для валидации доменов
 */
class DomainValidator {
    /**
     * Проверяет соответствие URL доменам из настроек
     * @param {string} url - URL для проверки
     * @param {Array} domains - Массив доменов из настроек
     * @returns {boolean} Соответствует ли URL доменам
     */
    async checkDomainMatch(url, domains) {
        if (!domains || domains.length === 0) {
            return false; // Должны быть заданы домены
        }

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            for (const domain of domains) {
                try {
                    // Сначала пробуем как регулярное выражение
                    const regex = new RegExp(domain);
                    if (regex.test(hostname) || regex.test(url)) {
                        return true;
                    }
                } catch (e) {
                    // Если не регулярное выражение, проверяем как обычную строку
                    // Убираем протокол из домена если он есть
                    let cleanDomain = domain;
                    if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
                        cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
                    }

                    // Убираем экранированные точки
                    cleanDomain = cleanDomain.replace(/\\\./g, '.');

                    if (hostname === cleanDomain ||
                        hostname.endsWith('.' + cleanDomain) ||
                        hostname.includes(cleanDomain) ||
                        url.includes(cleanDomain)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking domain match:', error);
            return false;
        }
    }

    /**
     * Проверяет, является ли домен валидным
     * @param {string} domain - Домен для проверки
     * @returns {boolean} Валиден ли домен
     */
    isValidDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            return false;
        }

        try {
            // Проверяем как URL
            const url = domain.startsWith('http') ? domain : `https://${domain}`;
            new URL(url);
            return true;
        } catch (e) {
            // Проверяем как регулярное выражение
            try {
                new RegExp(domain);
                return true;
            } catch (regexError) {
                return false;
            }
        }
    }

    /**
     * Нормализует домен (убирает протокол, слеши и т.д.)
     * @param {string} domain - Домен для нормализации
     * @returns {string} Нормализованный домен
     */
    normalizeDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            return '';
        }

        let cleanDomain = domain.trim();

        // Убираем протокол если он есть
        if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
            cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
        }

        // Убираем экранированные точки
        cleanDomain = cleanDomain.replace(/\\\./g, '.');

        // Убираем слеш в конце
        cleanDomain = cleanDomain.replace(/\/$/, '');

        return cleanDomain;
    }

    /**
     * Извлекает домен из URL
     * @param {string} url - URL для извлечения домена
     * @returns {string|null} Домен или null при ошибке
     */
    extractDomainFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            console.error('Error extracting domain from URL:', error);
            return null;
        }
    }

    /**
     * Проверяет, является ли URL безопасным для обработки
     * @param {string} url - URL для проверки
     * @returns {boolean} Безопасен ли URL
     */
    isSafeUrl(url) {
        try {
            const urlObj = new URL(url);

            // Проверяем протокол
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }

            // Проверяем, что это не локальный файл
            if (urlObj.protocol === 'file:') {
                return false;
            }

            // Проверяем, что это не data URL
            if (urlObj.protocol === 'data:') {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DomainValidator;
} else {
    // Для использования в Chrome Extension
    window.DomainValidator = DomainValidator;
}
