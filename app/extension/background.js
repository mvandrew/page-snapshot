// Service Worker для Chrome Extension Manifest V3

// Настройки по умолчанию
const defaultSettings = {
    domains: [],
    serviceUrl: '',
    saveInterval: 0,
    saveOnlyOnChange: true,
    enableNotifications: true,
    enableDebug: false,
    maxRetries: 3,
    autoCapture: false,
    captureFormat: 'png',
    quality: 0.9
};

// Переменные для автоматического сохранения
let saveIntervalId = null;
let lastPageContent = null;
let lastChecksum = null;

// Обработка установки расширения
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Page Snapshot extension installed:', details);

    // Инициализация настроек по умолчанию
    chrome.storage.sync.set(defaultSettings);

    // Настройка автоматического сохранения
    setupAutoSave();
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Используем async/await для современного подхода
    (async () => {
        try {
            let result;

            switch (request.action) {
                case 'savePageContent':
                    result = await savePageContent(sender.tab.id, request.content);
                    sendResponse({ success: true, data: result });
                    break;

                case 'getSettings':
                    const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
                    sendResponse({ ...defaultSettings, ...settings });
                    break;

                case 'saveSettings':
                    await chrome.storage.sync.set(request.settings);
                    setupAutoSave(); // Перезапускаем автоматическое сохранение
                    sendResponse({ success: true });
                    break;

                case 'settingsUpdated':
                    setupAutoSave(); // Перезапускаем при обновлении настроек
                    sendResponse({ success: true });
                    break;

                case 'checkDomainMatch':
                    const match = await checkDomainMatch(request.url);
                    sendResponse({ match });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    })();

    // Возвращаем true для асинхронного ответа (все еще требуется в Manifest V3)
    return true;
});

// Функция захвата страницы удалена - теперь только автоматическое сохранение содержимого

// Настройка автоматического сохранения
async function setupAutoSave() {
    // Очищаем предыдущий интервал
    if (saveIntervalId) {
        clearInterval(saveIntervalId);
        saveIntervalId = null;
    }

    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { saveInterval, enableDebug } = { ...defaultSettings, ...settings };

        if (saveInterval > 0) {
            saveIntervalId = setInterval(async () => {
                await performAutoSave();
            }, saveInterval * 1000);

            if (enableDebug) {
                console.log(`Auto-save enabled with interval: ${saveInterval}s`);
            }
        }
    } catch (error) {
        console.error('Error setting up auto-save:', error);
    }
}

// Выполнение автоматического сохранения
async function performAutoSave() {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { domains, serviceUrl, saveOnlyOnChange, enableDebug } = { ...defaultSettings, ...settings };

        // Проверяем обязательные настройки
        if (!isExtensionConfigured(domains, serviceUrl)) {
            if (enableDebug) {
                console.log('Extension not configured: missing domains or service URL');
            }
            return;
        }

        // Получаем активную вкладку
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return;

        // Проверяем соответствие домену
        const domainMatch = await checkDomainMatch(tab.url, domains);
        if (!domainMatch) return;

        // Получаем содержимое страницы
        const pageContent = await getPageContent(tab.id);
        if (!pageContent) return;

        // Вычисляем контрольную сумму для проверки изменений
        const currentChecksum = await calculateChecksumSync(pageContent);

        // Проверяем изменение содержимого по контрольной сумме
        if (saveOnlyOnChange && currentChecksum === lastChecksum) {
            if (enableDebug) {
                console.log('Page content unchanged (checksum match), skipping save');
            }
            return;
        }

        // Сохраняем содержимое
        const result = await savePageContent(tab.id, pageContent);

        // Обновляем кэш только при успешном сохранении
        if (result && result.success) {
            lastPageContent = pageContent;
            lastChecksum = currentChecksum;
        }

        if (enableDebug) {
            console.log('Auto-save completed');
        }

    } catch (error) {
        console.error('Error in auto-save:', error);
    }
}

// Вычисление контрольной суммы по алгоритму backend
function calculateChecksum(pageContent) {
    // Создаем строку для хэширования из всех важных данных (как в backend)
    const dataToHash = JSON.stringify({
        html: pageContent.html,
        url: pageContent.url
    });

    // Вычисляем SHA-256 хэш (используем Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);

    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

// Синхронная версия для использования в условиях
async function calculateChecksumSync(pageContent) {
    const dataToHash = JSON.stringify({
        html: pageContent.html,
        url: pageContent.url
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Проверка конфигурации расширения
function isExtensionConfigured(domains, serviceUrl) {
    // Проверяем, что задан хотя бы один домен
    if (!domains || domains.length === 0) {
        return false;
    }

    // Проверяем, что задан URL сервиса
    if (!serviceUrl || serviceUrl.trim() === '') {
        return false;
    }

    return true;
}

// Проверка соответствия домену
async function checkDomainMatch(url, domains) {
    if (!domains || domains.length === 0) return false; // Должны быть заданы домены

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        for (const domain of domains) {
            try {
                const regex = new RegExp(domain);
                if (regex.test(hostname) || regex.test(url)) {
                    return true;
                }
            } catch (e) {
                // Если не регулярное выражение, проверяем как обычную строку
                if (hostname.includes(domain) || url.includes(domain)) {
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

// Получение содержимого страницы
async function getPageContent(tabId) {
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
        return null;
    }
}

// Сохранение содержимого страницы на сервер
async function savePageContent(tabId, content) {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { domains, serviceUrl, maxRetries, enableNotifications, enableDebug } = { ...defaultSettings, ...settings };

        // Проверяем конфигурацию перед сохранением
        if (!isExtensionConfigured(domains, serviceUrl)) {
            throw new Error('Extension not configured: missing domains or service URL');
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        const payload = {
            content: content,
            userAgent: navigator.userAgent
        };

        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(serviceUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // Парсим ответ от backend
                const responseData = await response.json();

                if (enableDebug) {
                    console.log('Backend response:', responseData);
                }

                // Проверяем успешность операции
                if (responseData.success) {
                    if (enableNotifications) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon48.png',
                            title: 'Page Snapshot',
                            message: 'Страница успешно сохранена'
                        });
                    }

                    return {
                        success: true,
                        attempt,
                        checksum: responseData.data?.checksum,
                        id: responseData.data?.id
                    };
                } else {
                    throw new Error(responseData.message || 'Unknown backend error');
                }

            } catch (error) {
                lastError = error;
                console.error(`Save attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    // Ждем перед следующей попыткой
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError;

    } catch (error) {
        console.error('Error saving page content:', error);

        if (enableNotifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Page Snapshot',
                message: 'Ошибка сохранения: ' + error.message
            });
        }

        throw error;
    }
}

// Обработка обновления вкладки
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Сбрасываем кэш содержимого и контрольной суммы при обновлении страницы
        lastPageContent = null;
        lastChecksum = null;

        // Проверяем, нужно ли сохранить страницу сразу
        checkAndSaveOnUpdate(tabId, tab.url);
    }
});

// Проверка и сохранение при обновлении страницы
async function checkAndSaveOnUpdate(tabId, url) {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { domains, serviceUrl, saveOnlyOnChange, enableDebug } = { ...defaultSettings, ...settings };

        // Проверяем конфигурацию
        if (!isExtensionConfigured(domains, serviceUrl)) {
            if (enableDebug) {
                console.log('Extension not configured: missing domains or service URL');
            }
            return;
        }

        const domainMatch = await checkDomainMatch(url, domains);
        if (!domainMatch) return;

        // Небольшая задержка для полной загрузки страницы
        setTimeout(async () => {
            const pageContent = await getPageContent(tabId);
            if (pageContent) {
                // Вычисляем контрольную сумму для проверки изменений
                const currentChecksum = await calculateChecksumSync(pageContent);

                // Проверяем изменение содержимого по контрольной сумме
                if (saveOnlyOnChange && currentChecksum === lastChecksum) {
                    if (enableDebug) {
                        console.log('Page content unchanged (checksum match), skipping save on update');
                    }
                    return;
                }

                const result = await savePageContent(tabId, pageContent);

                // Обновляем кэш только при успешном сохранении
                if (result && result.success) {
                    lastPageContent = pageContent;
                    lastChecksum = currentChecksum;
                }
            }
        }, 2000);

    } catch (error) {
        console.error('Error in checkAndSaveOnUpdate:', error);
    }
}
