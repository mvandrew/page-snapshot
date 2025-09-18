/**
 * Модуль подсветки и навигации по элементам
 * Отвечает за визуальное выделение элементов на странице
 */

/**
 * Класс ElementHighlighter - подсветка и навигация по элементам
 */
class ElementHighlighter {
    constructor() {
        this.highlightedElements = new Set();
        this.highlightStyle = {
            outline: '3px solid #ff0000',
            outlineOffset: '2px',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
        };
        this.highlightAttribute = 'data-page-snapshot-highlight';
        this.highlightClass = 'page-snapshot-highlight';
    }

    /**
     * Подсветка элемента по селектору
     * @param {string} selector - CSS селектор элемента
     * @returns {boolean} Успешно ли подсвечен элемент
     */
    highlightElement(selector) {
        try {
            // Убираем предыдущую подсветку
            this.removeAllHighlights();

            const element = document.querySelector(selector);
            if (!element) {
                logger.warn(`Element not found for selector: ${selector}`);
                return false;
            }

            this.applyHighlight(element);
            this.highlightedElements.add(element);

            logger.info(`Element highlighted: ${selector}`);
            return true;
        } catch (error) {
            logger.error('Error highlighting element:', error);
            return false;
        }
    }

    /**
     * Подсветка элемента по DOM элементу
     * @param {Element} element - DOM элемент
     * @returns {boolean} Успешно ли подсвечен элемент
     */
    highlightElementByNode(element) {
        try {
            if (!element || !(element instanceof Element)) {
                logger.warn('Invalid element provided for highlighting');
                return false;
            }

            // Убираем предыдущую подсветку
            this.removeAllHighlights();

            this.applyHighlight(element);
            this.highlightedElements.add(element);

            logger.info('Element highlighted by node');
            return true;
        } catch (error) {
            logger.error('Error highlighting element by node:', error);
            return false;
        }
    }

    /**
     * Применение стилей подсветки к элементу
     * @param {Element} element - DOM элемент
     */
    applyHighlight(element) {
        // Сохраняем оригинальные стили
        this.saveOriginalStyles(element);

        // Применяем стили подсветки
        Object.assign(element.style, this.highlightStyle);

        // Добавляем атрибут и класс
        element.setAttribute(this.highlightAttribute, 'true');
        element.classList.add(this.highlightClass);

        // Добавляем обработчик клика для снятия подсветки
        element.addEventListener('click', this.handleHighlightClick.bind(this));
    }

    /**
     * Сохранение оригинальных стилей элемента
     * @param {Element} element - DOM элемент
     */
    saveOriginalStyles(element) {
        if (!element.dataset.originalOutline) {
            element.dataset.originalOutline = element.style.outline || '';
        }
        if (!element.dataset.originalOutlineOffset) {
            element.dataset.originalOutlineOffset = element.style.outlineOffset || '';
        }
        if (!element.dataset.originalBackgroundColor) {
            element.dataset.originalBackgroundColor = element.style.backgroundColor || '';
        }
        if (!element.dataset.originalTransition) {
            element.dataset.originalTransition = element.style.transition || '';
        }
    }

    /**
     * Восстановление оригинальных стилей элемента
     * @param {Element} element - DOM элемент
     */
    restoreOriginalStyles(element) {
        element.style.outline = element.dataset.originalOutline || '';
        element.style.outlineOffset = element.dataset.originalOutlineOffset || '';
        element.style.backgroundColor = element.dataset.originalBackgroundColor || '';
        element.style.transition = element.dataset.originalTransition || '';

        // Удаляем сохраненные данные
        delete element.dataset.originalOutline;
        delete element.dataset.originalOutlineOffset;
        delete element.dataset.originalBackgroundColor;
        delete element.dataset.originalTransition;
    }

    /**
     * Обработчик клика по подсвеченному элементу
     * @param {Event} event - Событие клика
     */
    handleHighlightClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.removeHighlight(event.target);
    }

    /**
     * Удаление подсветки с элемента
     * @param {Element} element - DOM элемент
     */
    removeHighlight(element) {
        try {
            if (!element) {
                return;
            }

            // Восстанавливаем оригинальные стили
            this.restoreOriginalStyles(element);

            // Удаляем атрибут и класс
            element.removeAttribute(this.highlightAttribute);
            element.classList.remove(this.highlightClass);

            // Удаляем обработчик клика
            element.removeEventListener('click', this.handleHighlightClick);

            // Удаляем из множества подсвеченных элементов
            this.highlightedElements.delete(element);

            logger.debug('Element highlight removed');
        } catch (error) {
            logger.error('Error removing highlight:', error);
        }
    }

    /**
     * Удаление всех подсветок
     */
    removeAllHighlights() {
        try {
            // Удаляем подсветку с элементов в памяти
            this.highlightedElements.forEach(element => {
                this.removeHighlight(element);
            });

            // Удаляем подсветку с элементов по атрибуту (на случай если что-то осталось)
            const highlightedElements = document.querySelectorAll(`[${this.highlightAttribute}="true"]`);
            highlightedElements.forEach(element => {
                this.removeHighlight(element);
            });

            // Очищаем множество
            this.highlightedElements.clear();

            logger.info('All highlights removed');
        } catch (error) {
            logger.error('Error removing all highlights:', error);
        }
    }

    /**
     * Прокрутка к элементу
     * @param {string} selector - CSS селектор элемента
     * @returns {boolean} Успешно ли прокручен к элементу
     */
    scrollToElement(selector) {
        try {
            const element = document.querySelector(selector);
            if (!element) {
                logger.warn(`Element not found for scrolling: ${selector}`);
                return false;
            }

            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });

            logger.info(`Scrolled to element: ${selector}`);
            return true;
        } catch (error) {
            logger.error('Error scrolling to element:', error);
            return false;
        }
    }

    /**
     * Прокрутка к элементу по DOM элементу
     * @param {Element} element - DOM элемент
     * @returns {boolean} Успешно ли прокручен к элементу
     */
    scrollToElementByNode(element) {
        try {
            if (!element || !(element instanceof Element)) {
                logger.warn('Invalid element provided for scrolling');
                return false;
            }

            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });

            logger.info('Scrolled to element by node');
            return true;
        } catch (error) {
            logger.error('Error scrolling to element by node:', error);
            return false;
        }
    }

    /**
     * Подсветка и прокрутка к элементу
     * @param {string} selector - CSS селектор элемента
     * @returns {boolean} Успешно ли выполнена операция
     */
    highlightAndScrollToElement(selector) {
        const highlighted = this.highlightElement(selector);
        if (highlighted) {
            const scrolled = this.scrollToElement(selector);
            return highlighted && scrolled;
        }
        return false;
    }

    /**
     * Получение информации о подсвеченных элементах
     * @returns {Array} Информация о подсвеченных элементах
     */
    getHighlightedElementsInfo() {
        return Array.from(this.highlightedElements).map(element => ({
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            textContent: element.textContent?.substring(0, 100) + (element.textContent?.length > 100 ? '...' : ''),
            selector: this.getElementSelector(element)
        }));
    }

    /**
     * Получение CSS селектора для элемента
     * @param {Element} element - DOM элемент
     * @returns {string} CSS селектор
     */
    getElementSelector(element) {
        try {
            if (element.id) {
                return `#${element.id}`;
            }

            if (element.className) {
                const classes = element.className.split(' ').filter(cls => cls.trim());
                if (classes.length > 0) {
                    return `.${classes.join('.')}`;
                }
            }

            // Создаем селектор по пути
            const path = [];
            let current = element;

            while (current && current !== document.documentElement) {
                let selector = current.tagName.toLowerCase();

                if (current.id) {
                    selector += `#${current.id}`;
                    path.unshift(selector);
                    break;
                } else {
                    let sibling = current;
                    let nth = 1;
                    while (sibling = sibling.previousElementSibling) {
                        if (sibling.tagName.toLowerCase() === selector) {
                            nth++;
                        }
                    }
                    if (nth !== 1) {
                        selector += `:nth-of-type(${nth})`;
                    }
                }
                path.unshift(selector);
                current = current.parentElement;
            }

            return path.join(' > ');
        } catch (error) {
            logger.error('Error creating element selector:', error);
            return element.tagName.toLowerCase();
        }
    }

    /**
     * Поиск элементов по тексту
     * @param {string} text - Текст для поиска
     * @param {boolean} exactMatch - Точное совпадение
     * @returns {Array} Найденные элементы
     */
    findElementsByText(text, exactMatch = false) {
        try {
            const allElements = document.querySelectorAll('*');
            const foundElements = [];

            allElements.forEach(element => {
                const elementText = element.textContent?.trim();
                if (elementText) {
                    const matches = exactMatch
                        ? elementText === text
                        : elementText.toLowerCase().includes(text.toLowerCase());

                    if (matches) {
                        foundElements.push(element);
                    }
                }
            });

            return foundElements;
        } catch (error) {
            logger.error('Error finding elements by text:', error);
            return [];
        }
    }

    /**
     * Подсветка всех найденных элементов
     * @param {string} text - Текст для поиска
     * @param {boolean} exactMatch - Точное совпадение
     * @returns {number} Количество подсвеченных элементов
     */
    highlightElementsByText(text, exactMatch = false) {
        const elements = this.findElementsByText(text, exactMatch);

        // Убираем предыдущую подсветку
        this.removeAllHighlights();

        // Подсвечиваем найденные элементы
        elements.forEach(element => {
            this.applyHighlight(element);
            this.highlightedElements.add(element);
        });

        logger.info(`Highlighted ${elements.length} elements by text: "${text}"`);
        return elements.length;
    }

    /**
     * Обновление стилей подсветки
     * @param {Object} newStyle - Новые стили
     */
    updateHighlightStyle(newStyle) {
        this.highlightStyle = { ...this.highlightStyle, ...newStyle };

        // Применяем новые стили к уже подсвеченным элементам
        this.highlightedElements.forEach(element => {
            Object.assign(element.style, this.highlightStyle);
        });

        logger.debug('Highlight style updated');
    }

    /**
     * Получение статистики подсветки
     * @returns {Object} Статистика
     */
    getStatistics() {
        return {
            highlightedCount: this.highlightedElements.size,
            highlightStyle: this.highlightStyle,
            highlightAttribute: this.highlightAttribute,
            highlightClass: this.highlightClass
        };
    }

    /**
     * Очистка всех данных подсветки
     */
    cleanup() {
        this.removeAllHighlights();
        this.highlightedElements.clear();
        logger.info('Element highlighter cleaned up');
    }
}

// Экспортируем класс для использования в других модулях
if (typeof self !== 'undefined') {
    // Для Service Worker
    self.ElementHighlighter = ElementHighlighter;
} else if (typeof window !== 'undefined') {
    // Для обычных скриптов
    window.ElementHighlighter = ElementHighlighter;
} else if (typeof module !== 'undefined' && module.exports) {
    // Для Node.js
    module.exports = ElementHighlighter;
}
