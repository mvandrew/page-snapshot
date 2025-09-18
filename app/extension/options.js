// JavaScript для страницы настроек расширения

class SettingsManager {
    constructor() {
        this.defaultSettings = {
            domains: [],
            serviceUrl: '',
            serviceMethod: 'POST',
            serviceHeaders: '{}',
            enableAutoSave: true,
            saveInterval: 10, // Минимальная задержка 10 секунд по умолчанию
            saveOnlyOnChange: true,
            enableNotifications: true,
            enableDebug: false,
            maxRetries: 3
        };

        // Константы для ограничений интервала
        this.MIN_SAVE_INTERVAL = 5; // Минимальная задержка 5 секунд
        this.MAX_SAVE_INTERVAL = 60; // Максимальная задержка 60 секунд

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
        this.updateIntervalDescription();

        // Инициализируем состояние элементов управления автоматическим сохранением
        const enableAutoSave = document.getElementById('enable-auto-save').checked;
        this.toggleAutoSaveControls(enableAutoSave);
    }

    setupEventListeners() {
        // Форма настроек
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Слайдер интервала
        document.getElementById('save-interval').addEventListener('input', (e) => {
            this.updateIntervalDescription();
        });

        // Чекбокс включения/отключения автоматического сохранения
        document.getElementById('enable-auto-save').addEventListener('change', (e) => {
            this.toggleAutoSaveControls(e.target.checked);
        });

        // Добавление домена
        document.getElementById('add-domain-btn').addEventListener('click', () => {
            this.addDomain();
        });

        // Enter в поле домена
        document.getElementById('new-domain').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addDomain();
            }
        });

        // Кнопки управления
        document.getElementById('reset-settings').addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('test-connection').addEventListener('click', () => {
            this.testConnection();
        });

        // Ссылки в футере
        document.getElementById('help-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.openHelp();
        });

        document.getElementById('feedback-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.openFeedback();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(Object.keys(this.defaultSettings));
            const settings = { ...this.defaultSettings, ...result };

            // Загружаем домены
            this.loadDomains(settings.domains);

            // Загружаем остальные настройки
            document.getElementById('service-url').value = settings.serviceUrl;
            document.getElementById('enable-auto-save').checked = settings.enableAutoSave !== false;
            document.getElementById('save-interval').value = settings.saveInterval;
            document.getElementById('save-only-on-change').checked = settings.saveOnlyOnChange;
            document.getElementById('enable-notifications').checked = settings.enableNotifications;
            document.getElementById('enable-debug').checked = settings.enableDebug;
            document.getElementById('max-retries').value = settings.maxRetries;

            this.showStatus('Настройки загружены', 'success');
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Ошибка загрузки настроек', 'error');
        }
    }

    loadDomains(domains) {
        const domainsList = document.getElementById('domains-list');
        domainsList.innerHTML = '';

        domains.forEach((domain, index) => {
            this.createDomainItem(domain, index);
        });
    }

    createDomainItem(domain, index) {
        const domainsList = document.getElementById('domains-list');

        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';
        domainItem.innerHTML = `
      <span class="domain-text">${this.escapeHtml(domain)}</span>
      <div class="domain-actions">
        <button type="button" class="domain-btn edit" title="Редактировать" data-index="${index}">✏️</button>
        <button type="button" class="domain-btn delete" title="Удалить" data-index="${index}">🗑️</button>
      </div>
    `;

        // Обработчики для кнопок
        domainItem.querySelector('.domain-btn.edit').addEventListener('click', () => {
            this.editDomain(index);
        });

        domainItem.querySelector('.domain-btn.delete').addEventListener('click', () => {
            this.deleteDomain(index);
        });

        domainsList.appendChild(domainItem);
    }

    addDomain() {
        const input = document.getElementById('new-domain');
        const domain = input.value.trim();

        if (!domain) {
            this.showStatus('Введите домен', 'error');
            return;
        }

        // Валидация регулярного выражения
        if (!this.isValidRegex(domain)) {
            this.showStatus('Некорректное регулярное выражение', 'error');
            return;
        }

        // Проверка на дубликаты
        const currentDomains = this.getCurrentDomains();
        if (currentDomains.includes(domain)) {
            this.showStatus('Домен уже добавлен', 'error');
            return;
        }

        // Добавляем домен
        currentDomains.push(domain);
        this.loadDomains(currentDomains);

        input.value = '';
        this.showStatus('Домен добавлен', 'success');
    }

    editDomain(index) {
        const currentDomains = this.getCurrentDomains();
        const domain = currentDomains[index];

        const newDomain = prompt('Редактировать домен:', domain);
        if (newDomain === null) return; // Отменено

        const trimmedDomain = newDomain.trim();
        if (!trimmedDomain) {
            this.showStatus('Домен не может быть пустым', 'error');
            return;
        }

        if (!this.isValidRegex(trimmedDomain)) {
            this.showStatus('Некорректное регулярное выражение', 'error');
            return;
        }

        currentDomains[index] = trimmedDomain;
        this.loadDomains(currentDomains);
        this.showStatus('Домен обновлен', 'success');
    }

    deleteDomain(index) {
        if (!confirm('Удалить домен?')) return;

        const currentDomains = this.getCurrentDomains();
        currentDomains.splice(index, 1);
        this.loadDomains(currentDomains);
        this.showStatus('Домен удален', 'success');
    }

    getCurrentDomains() {
        const domainItems = document.querySelectorAll('.domain-item .domain-text');
        return Array.from(domainItems).map(item => item.textContent);
    }

    isValidRegex(pattern) {
        try {
            new RegExp(pattern);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Функция нормализации интервала сохранения
    normalizeSaveInterval(interval) {
        // Преобразуем в число
        const numInterval = parseInt(interval, 10);

        // Если не число или меньше 0, возвращаем минимальное значение
        if (isNaN(numInterval) || numInterval < 0) {
            return this.MIN_SAVE_INTERVAL;
        }

        // Если 0, отключаем автоматическое сохранение
        if (numInterval === 0) {
            return 0;
        }

        // Ограничиваем минимальным и максимальным значением
        return Math.max(this.MIN_SAVE_INTERVAL, Math.min(this.MAX_SAVE_INTERVAL, numInterval));
    }

    toggleAutoSaveControls(enabled) {
        const saveIntervalInput = document.getElementById('save-interval');
        const saveOnlyOnChangeInput = document.getElementById('save-only-on-change');

        saveIntervalInput.disabled = !enabled;
        saveOnlyOnChangeInput.disabled = !enabled;

        if (enabled) {
            this.updateIntervalDescription();
        } else {
            document.getElementById('interval-description').textContent = 'Автоматическое сохранение отключено';
        }
    }

    updateIntervalDescription() {
        const interval = parseInt(document.getElementById('save-interval').value);
        const normalizedInterval = this.normalizeSaveInterval(interval);
        const valueSpan = document.getElementById('interval-value');
        const descriptionSpan = document.getElementById('interval-description');

        // Обновляем значение слайдера, если оно было нормализовано
        if (interval !== normalizedInterval) {
            document.getElementById('save-interval').value = normalizedInterval;
            valueSpan.textContent = normalizedInterval;
        } else {
            valueSpan.textContent = interval;
        }

        if (normalizedInterval === 0) {
            descriptionSpan.textContent = 'Автоматическое сохранение отключено';
        } else if (normalizedInterval < 60) {
            descriptionSpan.textContent = `Сохранение каждые ${normalizedInterval} секунд`;
        } else {
            const minutes = Math.floor(normalizedInterval / 60);
            const seconds = normalizedInterval % 60;
            const timeStr = minutes > 0 ? `${minutes}м ${seconds}с` : `${seconds}с`;
            descriptionSpan.textContent = `Сохранение каждые ${timeStr}`;
        }
    }

    async saveSettings() {
        try {
            const rawInterval = parseInt(document.getElementById('save-interval').value);
            const normalizedInterval = this.normalizeSaveInterval(rawInterval);

            const enableAutoSave = document.getElementById('enable-auto-save').checked;
            const settings = {
                domains: this.getCurrentDomains(),
                serviceUrl: document.getElementById('service-url').value.trim(),
                enableAutoSave: enableAutoSave,
                saveInterval: enableAutoSave ? normalizedInterval : 0,
                saveOnlyOnChange: document.getElementById('save-only-on-change').checked,
                enableNotifications: document.getElementById('enable-notifications').checked,
                enableDebug: document.getElementById('enable-debug').checked,
                maxRetries: parseInt(document.getElementById('max-retries').value)
            };

            // Валидация
            const validation = this.validateSettings(settings);
            if (!validation.isValid) {
                this.showStatus(validation.message, 'error');
                return;
            }

            // Показываем предупреждение, если интервал был нормализован
            if (rawInterval !== normalizedInterval) {
                this.showStatus(`Интервал автоматически скорректирован с ${rawInterval} до ${normalizedInterval} секунд`, 'info');
            }

            // Сохраняем настройки
            await chrome.storage.sync.set(settings);

            // Уведомляем background script об обновлении настроек
            chrome.runtime.sendMessage({
                action: 'settingsUpdated',
                settings: settings
            });

            this.showStatus('Настройки сохранены успешно', 'success');

            // Скрываем статус через 3 секунды
            setTimeout(() => {
                this.hideStatus();
            }, 3000);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Ошибка сохранения настроек', 'error');
        }
    }

    validateSettings(settings) {
        // Валидация URL сервиса
        if (settings.serviceUrl) {
            try {
                new URL(settings.serviceUrl);
            } catch (e) {
                return {
                    isValid: false,
                    message: 'Некорректный URL сервиса'
                };
            }
        }


        // Валидация интервала
        if (settings.saveInterval < 0 || settings.saveInterval > this.MAX_SAVE_INTERVAL) {
            return {
                isValid: false,
                message: `Интервал должен быть от 0 до ${this.MAX_SAVE_INTERVAL} секунд`
            };
        }

        // Дополнительная проверка для ненулевых значений
        if (settings.saveInterval > 0 && settings.saveInterval < this.MIN_SAVE_INTERVAL) {
            return {
                isValid: false,
                message: `Минимальный интервал: ${this.MIN_SAVE_INTERVAL} секунд`
            };
        }

        // Валидация количества попыток
        if (settings.maxRetries < 1 || settings.maxRetries > 10) {
            return {
                isValid: false,
                message: 'Количество попыток должно быть от 1 до 10'
            };
        }

        return { isValid: true };
    }

    async resetSettings() {
        if (!confirm('Сбросить все настройки к значениям по умолчанию?')) {
            return;
        }

        try {
            await chrome.storage.sync.clear();
            await this.loadSettings();
            this.showStatus('Настройки сброшены', 'success');
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showStatus('Ошибка сброса настроек', 'error');
        }
    }

    async testConnection() {
        const serviceUrl = document.getElementById('service-url').value.trim();

        if (!serviceUrl) {
            this.showStatus('Укажите URL сервиса', 'error');
            return;
        }

        try {
            this.showStatus('Проверка соединения...', 'info');

            // Отправляем тестовый запрос
            const response = await fetch(serviceUrl, {
                method: 'HEAD',
                mode: 'no-cors'
            });

            this.showStatus('Соединение успешно', 'success');
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showStatus('Ошибка соединения: ' + error.message, 'error');
        }
    }

    showStatus(message, type) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        statusMessage.className = `status-message show ${type}`;
    }

    hideStatus() {
        const statusMessage = document.getElementById('status-message');
        statusMessage.classList.remove('show');
    }

    openHelp() {
        chrome.tabs.create({
            url: 'https://github.com/your-repo/page-snapshot/wiki'
        });
    }

    openFeedback() {
        chrome.tabs.create({
            url: 'https://github.com/your-repo/page-snapshot/issues'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Settings page error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
