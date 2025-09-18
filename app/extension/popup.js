// JavaScript для popup расширения

document.addEventListener('DOMContentLoaded', function () {
    // Элементы DOM
    const captureBtn = document.getElementById('capture-btn');
    const captureVisibleBtn = document.getElementById('capture-visible-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const statusMessage = document.getElementById('status-message');

    // Настройки
    const formatSelect = document.getElementById('format-select');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const autoCaptureCheckbox = document.getElementById('auto-capture');
    const saveSettingsBtn = document.getElementById('save-settings');
    const resetSettingsBtn = document.getElementById('reset-settings');

    // Инициализация
    init();

    function init() {
        loadPageInfo();
        loadSettings();
        setupEventListeners();
    }

    // Загрузка информации о странице
    function loadPageInfo() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                const tab = tabs[0];

                // Отправляем запрос в content script для получения детальной информации
                chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, function (response) {
                    if (response) {
                        document.getElementById('page-url').textContent =
                            response.url.length > 50 ? response.url.substring(0, 50) + '...' : response.url;
                        document.getElementById('page-title').textContent =
                            response.title.length > 30 ? response.title.substring(0, 30) + '...' : response.title;
                        document.getElementById('page-size').textContent =
                            `${response.viewport.width} × ${response.viewport.height}`;
                    } else {
                        // Fallback к базовой информации
                        document.getElementById('page-url').textContent =
                            tab.url.length > 50 ? tab.url.substring(0, 50) + '...' : tab.url;
                        document.getElementById('page-title').textContent =
                            tab.title.length > 30 ? tab.title.substring(0, 30) + '...' : tab.title;
                        document.getElementById('page-size').textContent = 'Недоступно';
                    }
                });
            }
        });
    }

    // Загрузка настроек
    function loadSettings() {
        chrome.runtime.sendMessage({ action: 'getSettings' }, function (response) {
            if (response) {
                formatSelect.value = response.captureFormat || 'png';
                qualitySlider.value = response.quality || 0.9;
                qualityValue.textContent = Math.round((response.quality || 0.9) * 100) + '%';
                autoCaptureCheckbox.checked = response.autoCapture || false;

                // Показываем статус настроек
                updateSettingsStatus(response);
            }
        });
    }

    // Обновление статуса настроек
    function updateSettingsStatus(settings) {
        const statusInfo = [];

        if (settings.domains && settings.domains.length > 0) {
            statusInfo.push(`Домены: ${settings.domains.length}`);
        } else {
            statusInfo.push('Домены: все');
        }

        if (settings.serviceUrl) {
            statusInfo.push('Сервис: настроен');
        } else {
            statusInfo.push('Сервис: не настроен');
        }

        if (settings.saveInterval > 0) {
            statusInfo.push(`Автосохранение: ${settings.saveInterval}с`);
        } else {
            statusInfo.push('Автосохранение: отключено');
        }

        // Обновляем информацию о странице с учетом настроек
        updatePageInfoWithSettings(settings);
    }

    // Обновление информации о странице с учетом настроек
    function updatePageInfoWithSettings(settings) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                const tab = tabs[0];

                // Проверяем соответствие домену
                chrome.runtime.sendMessage({
                    action: 'checkDomainMatch',
                    url: tab.url
                }, function (response) {
                    if (response && response.match) {
                        document.getElementById('page-size').textContent += ' ✓';
                    } else if (settings.domains && settings.domains.length > 0) {
                        document.getElementById('page-size').textContent += ' ✗';
                    }
                });
            }
        });
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Кнопки захвата
        captureBtn.addEventListener('click', () => capturePage('full'));
        captureVisibleBtn.addEventListener('click', () => capturePage('visible'));

        // Кнопка сохранения на сервер
        document.getElementById('save-page-btn').addEventListener('click', savePageManually);

        // Кнопка настроек
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        // Слайдер качества
        qualitySlider.addEventListener('input', function () {
            qualityValue.textContent = Math.round(this.value * 100) + '%';
        });

        // Кнопки настроек
        saveSettingsBtn.addEventListener('click', saveSettings);
        resetSettingsBtn.addEventListener('click', resetSettings);

        // Ссылки в футере
        document.getElementById('help-link').addEventListener('click', showHelp);
        document.getElementById('feedback-link').addEventListener('click', showFeedback);
    }

    // Функция для ручного сохранения страницы
    function savePageManually() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageInfo' }, function (response) {
                    if (response) {
                        chrome.runtime.sendMessage({
                            action: 'savePageContent',
                            content: response
                        }, function (saveResponse) {
                            if (saveResponse && saveResponse.success) {
                                showStatus('Страница сохранена на сервер', 'success');
                            } else {
                                showStatus('Ошибка сохранения на сервер', 'error');
                            }
                        });
                    }
                });
            }
        });
    }

    // Захват страницы
    function capturePage(type) {
        const options = {
            captureFormat: formatSelect.value,
            quality: parseFloat(qualitySlider.value)
        };

        // Показываем статус загрузки
        showStatus('Создание снимка...', 'info');

        // Отправляем запрос в background script
        chrome.runtime.sendMessage({
            action: 'capturePage',
            options: options
        }, function (response) {
            if (chrome.runtime.lastError) {
                showStatus('Ошибка: ' + chrome.runtime.lastError.message, 'error');
                return;
            }

            if (response && response.success) {
                showStatus('Снимок сохранен!', 'success');

                // Обновляем статистику
                updateStats();
            } else {
                showStatus('Ошибка при создании снимка', 'error');
            }
        });
    }

    // Сохранение настроек
    function saveSettings() {
        const settings = {
            captureFormat: formatSelect.value,
            quality: parseFloat(qualitySlider.value),
            autoCapture: autoCaptureCheckbox.checked
        };

        chrome.storage.sync.set(settings, function () {
            showStatus('Настройки сохранены', 'success');

            // Скрываем панель настроек через 1 секунду
            setTimeout(() => {
                toggleSettings();
            }, 1000);
        });
    }

    // Сброс настроек
    function resetSettings() {
        if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
            chrome.storage.sync.clear(function () {
                loadSettings();
                showStatus('Настройки сброшены', 'info');
            });
        }
    }

    // Показ статуса
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message show ${type}`;

        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 3000);
    }

    // Обновление статистики
    function updateStats() {
        // Здесь можно добавить логику для обновления статистики
        // Например, счетчик созданных снимков
    }

    // Показ справки
    function showHelp() {
        chrome.tabs.create({
            url: 'https://github.com/your-repo/page-snapshot/wiki'
        });
    }

    // Показ формы обратной связи
    function showFeedback() {
        chrome.tabs.create({
            url: 'https://github.com/your-repo/page-snapshot/issues'
        });
    }

    // Обработка сообщений от background script
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'updateStatus') {
            showStatus(request.message, request.type);
        }
    });

    // Обработка ошибок
    window.addEventListener('error', function (event) {
        console.error('Popup error:', event.error);
        showStatus('Произошла ошибка', 'error');
    });

    // Обработка необработанных промисов
    window.addEventListener('unhandledrejection', function (event) {
        console.error('Unhandled promise rejection:', event.reason);
        showStatus('Произошла ошибка', 'error');
    });
});
