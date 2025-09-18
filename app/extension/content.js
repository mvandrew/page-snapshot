// Content Script для взаимодействия с веб-страницами

// Инициализация при загрузке страницы
(function () {
    'use strict';

    console.log('Page Snapshot content script loaded');

    // Создание кнопки захвата на странице
    createCaptureButton();

    // Обработка сообщений от popup и background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'getPageInfo':
                sendResponse(getPageInfo());
                break;

            case 'highlightElement':
                highlightElement(request.selector);
                sendResponse({ success: true });
                break;

            case 'removeHighlight':
                removeHighlight();
                sendResponse({ success: true });
                break;

            case 'scrollToElement':
                scrollToElement(request.selector);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ error: 'Unknown action' });
        }
    });

    // Создание кнопки захвата
    function createCaptureButton() {
        // Проверяем, не создана ли уже кнопка
        if (document.getElementById('page-snapshot-btn')) {
            return;
        }

        const button = document.createElement('div');
        button.id = 'page-snapshot-btn';
        button.innerHTML = '📸';
        button.title = 'Сделать снимок страницы';

        // Стили кнопки
        Object.assign(button.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            backgroundColor: '#4285f4',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: '10000',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            userSelect: 'none'
        });

        // Обработчик клика
        button.addEventListener('click', () => {
            capturePage();
        });

        // Эффекты при наведении
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.backgroundColor = '#3367d6';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = '#4285f4';
        });

        document.body.appendChild(button);
    }

    // Функция захвата страницы
    function capturePage() {
        // Отправляем сообщение в background script
        chrome.runtime.sendMessage({
            action: 'capturePage',
            options: {
                captureFormat: 'png',
                quality: 0.9
            }
        }, (response) => {
            if (response && response.success) {
                showNotification('Снимок сохранен!', 'success');
            } else {
                showNotification('Ошибка при создании снимка', 'error');
            }
        });
    }

    // Получение информации о странице
    function getPageInfo() {
        return {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scrollPosition: {
                x: window.scrollX,
                y: window.scrollY
            }
        };
    }

    // Подсветка элемента
    function highlightElement(selector) {
        removeHighlight(); // Убираем предыдущую подсветку

        try {
            const element = document.querySelector(selector);
            if (element) {
                element.style.outline = '3px solid #ff0000';
                element.style.outlineOffset = '2px';
                element.setAttribute('data-page-snapshot-highlight', 'true');
            }
        } catch (error) {
            console.error('Error highlighting element:', error);
        }
    }

    // Удаление подсветки
    function removeHighlight() {
        const highlightedElements = document.querySelectorAll('[data-page-snapshot-highlight="true"]');
        highlightedElements.forEach(element => {
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.removeAttribute('data-page-snapshot-highlight');
        });
    }

    // Прокрутка к элементу
    function scrollToElement(selector) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (error) {
            console.error('Error scrolling to element:', error);
        }
    }

    // Показ уведомления
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;

        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3'
        };

        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            padding: '12px 20px',
            backgroundColor: colors[type] || colors.info,
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: '10001',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            transform: 'translateX(100%)'
        });

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

})();
