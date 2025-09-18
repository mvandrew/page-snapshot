// Content Script для взаимодействия с веб-страницами

// Инициализация при загрузке страницы
(function () {
    'use strict';

    console.log('Page Snapshot content script loaded');

    // Проверяем конфигурацию перед созданием кнопки
    checkConfigurationAndInit();

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

    // Проверка конфигурации и инициализация
    function checkConfigurationAndInit() {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        console.log('Page Snapshot: Content script initialized on:', {
            url: currentUrl,
            hostname: currentHostname,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname
        });

        chrome.runtime.sendMessage({ action: 'getSettings' }, function (response) {
            if (chrome.runtime.lastError) {
                console.error('Page Snapshot: Error getting settings:', chrome.runtime.lastError);
                return;
            }

            if (response) {
                console.log('Page Snapshot: Settings received:', {
                    domains: response.domains,
                    serviceUrl: response.serviceUrl,
                    isConfigured: isExtensionConfigured(response.domains, response.serviceUrl)
                });

                const isConfigured = isExtensionConfigured(response.domains, response.serviceUrl);

                if (isConfigured) {
                    // Проверяем соответствие текущего домена
                    checkDomainMatch(response.domains);
                } else {
                    console.log('Page Snapshot: Extension not configured');
                    console.log('Page Snapshot: Current page info:', {
                        url: currentUrl,
                        hostname: currentHostname
                    });
                }
            } else {
                console.log('Page Snapshot: No settings received');
            }
        });
    }

    // Проверка конфигурации расширения
    function isExtensionConfigured(domains, serviceUrl) {
        return (domains && domains.length > 0) && (serviceUrl && serviceUrl.trim() !== '');
    }

    // Функция нормализации доменов (копия из background.js)
    function normalizeDomains(domains) {
        if (!domains || !Array.isArray(domains)) {
            return [];
        }

        return domains.map(domain => {
            if (typeof domain !== 'string') {
                return domain;
            }

            // Убираем протокол если он есть
            let cleanDomain = domain;
            if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
                cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
            }

            // Убираем экранированные точки
            cleanDomain = cleanDomain.replace(/\\\./g, '.');

            // Убираем слеш в конце
            cleanDomain = cleanDomain.replace(/\/$/, '');

            return cleanDomain;
        }).filter(domain => domain && domain.trim() !== '');
    }

    // Локальная проверка соответствия домену
    function checkDomainMatchLocal(domains) {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        if (!domains || domains.length === 0) {
            console.log('Page Snapshot: No domains configured for matching');
            return false;
        }

        console.log('Page Snapshot: Checking domain match locally:', {
            url: currentUrl,
            hostname: currentHostname,
            domains: domains
        });

        // Нормализуем домены
        const normalizedDomains = normalizeDomains(domains);
        console.log('Page Snapshot: Normalized domains:', normalizedDomains);

        for (const domain of normalizedDomains) {
            console.log('Page Snapshot: Testing domain pattern:', domain);

            try {
                // Сначала пробуем как регулярное выражение
                const regex = new RegExp(domain);
                if (regex.test(currentHostname) || regex.test(currentUrl)) {
                    console.log('Page Snapshot: Domain match found (regex):', domain);
                    return true;
                }
            } catch (e) {
                console.log('Page Snapshot: Not a valid regex, trying as string:', domain);

                // Если не регулярное выражение, проверяем как обычную строку
                if (currentHostname === domain || currentHostname.endsWith('.' + domain) ||
                    currentHostname.includes(domain) || currentUrl.includes(domain)) {
                    console.log('Page Snapshot: Domain match found (string):', domain);
                    return true;
                }
            }
        }

        console.log('Page Snapshot: No domain match found');
        return false;
    }

    // Проверка соответствия домену
    function checkDomainMatch(domains) {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        console.log('Page Snapshot: Domains:', domains);
        console.log('Page Snapshot: Checking domain match:', {
            url: currentUrl,
            hostname: currentHostname,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname
        });

        // Сначала проверяем локально
        const localMatch = checkDomainMatchLocal(domains);

        if (localMatch) {
            console.log('Page Snapshot: Domain matches locally, auto-save will work');
            return;
        }

        // Если локальная проверка не сработала, проверяем через background
        chrome.runtime.sendMessage({
            action: 'checkDomainMatch',
            url: currentUrl
        }, function (response) {
            if (chrome.runtime.lastError) {
                console.error('Page Snapshot: Error checking domain match:', chrome.runtime.lastError);
                return;
            }

            if (response && response.match) {
                console.log('Page Snapshot: Domain matches via background, auto-save will work');
            } else {
                console.log('Page Snapshot: Current domain does not match configured domains');
                console.log('Page Snapshot: Current URL:', currentUrl);
                console.log('Page Snapshot: Current hostname:', currentHostname);
                console.log('Page Snapshot: Configured domains:', domains);
            }
        });
    }

    // Получение информации о странице
    function getPageInfo() {
        const pageInfo = {
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

        console.log('Page Snapshot: Page info collected:', {
            url: pageInfo.url,
            hostname: pageInfo.domain,
            title: pageInfo.title,
            protocol: window.location.protocol,
            port: window.location.port,
            pathname: window.location.pathname
        });

        return pageInfo;
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
