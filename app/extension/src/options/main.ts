/**
 * Главный модуль страницы настроек расширения Page Snapshot
 * Обеспечивает настройку endpoint URL и тестирование подключения
 */

// Константы
const STORAGE_KEY = "endpointUrl";
const STATUS_CLEAR_DELAY = 5000;
const TEST_TIMEOUT = 10000; // 10 секунд

// DOM элементы
const form = document.getElementById("options-form") as HTMLFormElement | null;
const endpointInput = document.getElementById("endpoint-url") as HTMLInputElement | null;
const statusBox = document.getElementById("status") as HTMLDivElement | null;
const submitButton = form?.querySelector("button[type='submit']") as HTMLButtonElement | null;
const testButton = document.getElementById("test-btn") as HTMLButtonElement | null;
const testResults = document.getElementById("test-results") as HTMLDivElement | null;
const testDetails = document.getElementById("test-details") as HTMLDivElement | null;

// Проверка наличия необходимых DOM элементов
if (!form || !endpointInput || !statusBox || !submitButton || !testButton || !testResults || !testDetails) {
  throw new Error("Options page failed to initialize: required DOM nodes are missing.");
}

let statusResetTimer: number | undefined;

/**
 * Интерфейс для результатов тестирования API
 */
interface ApiTestResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Показывает статусное сообщение пользователю
 * @param message - текст сообщения
 * @param variant - тип сообщения (success, error, warning, info)
 * @param duration - длительность показа в миллисекундах
 */
const setStatus = (message: string, variant: "success" | "error" | "warning" | "info" = "info", duration: number = STATUS_CLEAR_DELAY): void => {
  window.clearTimeout(statusResetTimer);
  statusBox.textContent = message;
  statusBox.className = 'status';

  // Добавляем соответствующий класс типа
  statusBox.classList.add(`status-${variant}`);
  statusBox.classList.add('show');

  if (message) {
    statusResetTimer = window.setTimeout(() => {
      statusBox.classList.remove('show');
      setTimeout(() => {
        statusBox.textContent = '';
        statusBox.className = 'status';
      }, 300); // Время для анимации исчезновения
    }, duration);
  }
};

/**
 * Устанавливает состояние загрузки для кнопки
 * @param button - кнопка для установки состояния
 * @param isLoading - состояние загрузки
 */
const setButtonLoading = (button: HTMLButtonElement, isLoading: boolean): void => {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
  }
};

/**
 * Загружает сохраненный endpoint URL из хранилища
 */
const loadStoredEndpoint = async (): Promise<void> => {
  try {
    setButtonLoading(submitButton, true);
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const storedValue = result[STORAGE_KEY];

    if (typeof storedValue === "string" && storedValue.trim()) {
      endpointInput.value = storedValue;
    }
  } catch (error) {
    console.error("Failed to read endpoint URL from storage", error);
    setStatus("Не удалось загрузить сохраненный endpoint. Попробуйте еще раз.", "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
};

/**
 * Валидирует URL endpoint
 * @param value - URL для валидации
 * @returns строка с ошибкой или пустая строка если валидация прошла
 */
const validateEndpoint = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Endpoint URL обязателен.";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Введите корректный URL.";
  }

  if (parsed.protocol !== "https:") {
    return "Endpoint должен использовать HTTPS.";
  }

  // Дополнительная проверка на валидность домена
  if (!parsed.hostname || parsed.hostname.length < 3) {
    return "Введите корректный домен.";
  }

  return "";
};

/**
 * Тестирует доступность API endpoint
 * @param url - URL для тестирования
 * @returns результат тестирования
 */
const testApiEndpoint = async (url: string): Promise<ApiTestResult> => {
  const startTime = Date.now();

  try {
    // Создаем тестовый payload в том же формате, что будет использоваться для снимков
    const testPayload = {
      content: {
        html: "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Page</h1></body></html>",
        url: "https://example.com/test",
        title: "Test Page",
        timestamp: new Date().toISOString()
      },
      userAgent: navigator.userAgent
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': navigator.userAgent
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Собираем информацию о заголовках ответа
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Читаем тело ответа (ограничиваем размер для безопасности)
    let body = '';
    try {
      const text = await response.text();
      body = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
    } catch {
      body = 'Не удалось прочитать тело ответа';
    }

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      headers,
      body
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          responseTime,
          error: `Таймаут подключения (${TEST_TIMEOUT}мс)`
        };
      }

      return {
        success: false,
        responseTime,
        error: error.message
      };
    }

    return {
      success: false,
      responseTime,
      error: 'Неизвестная ошибка при тестировании'
    };
  }
};

/**
 * Отображает результаты тестирования API
 * @param result - результат тестирования
 */
const displayTestResults = (result: ApiTestResult): void => {
  testDetails.innerHTML = '';

  // Основной статус
  const statusDetail = document.createElement('div');
  statusDetail.className = 'test-detail';
  statusDetail.innerHTML = `
    <span class="test-detail-label">Статус</span>
    <span class="test-detail-value ${result.success ? 'success' : 'error'}">
      ${result.success ? '✓ Успешно' : '✗ Ошибка'}
    </span>
  `;
  testDetails.appendChild(statusDetail);

  // Код ответа
  if (result.statusCode !== undefined) {
    const statusCodeDetail = document.createElement('div');
    statusCodeDetail.className = 'test-detail';
    statusCodeDetail.innerHTML = `
      <span class="test-detail-label">HTTP код</span>
      <span class="test-detail-value ${result.statusCode >= 200 && result.statusCode < 300 ? 'success' : 'error'}">
        ${result.statusCode}
      </span>
    `;
    testDetails.appendChild(statusCodeDetail);
  }

  // Время ответа
  if (result.responseTime !== undefined) {
    const responseTimeDetail = document.createElement('div');
    responseTimeDetail.className = 'test-detail';
    responseTimeDetail.innerHTML = `
      <span class="test-detail-label">Время ответа</span>
      <span class="test-detail-value">${result.responseTime}мс</span>
    `;
    testDetails.appendChild(responseTimeDetail);
  }

  // Ошибка
  if (result.error) {
    const errorDetail = document.createElement('div');
    errorDetail.className = 'test-detail';
    errorDetail.innerHTML = `
      <span class="test-detail-label">Ошибка</span>
      <span class="test-detail-value error">${result.error}</span>
    `;
    testDetails.appendChild(errorDetail);
  }

  // Заголовки ответа (показываем только важные)
  if (result.headers) {
    const importantHeaders = ['content-type', 'content-length', 'server', 'date'];
    importantHeaders.forEach(headerName => {
      const headerValue = result.headers[headerName];
      if (headerValue) {
        const headerDetail = document.createElement('div');
        headerDetail.className = 'test-detail';
        headerDetail.innerHTML = `
          <span class="test-detail-label">${headerName}</span>
          <span class="test-detail-value">${headerValue}</span>
        `;
        testDetails.appendChild(headerDetail);
      }
    });
  }

  // Тело ответа (если есть)
  if (result.body) {
    const bodyDetail = document.createElement('div');
    bodyDetail.className = 'test-detail';
    bodyDetail.innerHTML = `
      <span class="test-detail-label">Ответ сервера</span>
      <span class="test-detail-value">${result.body}</span>
    `;
    testDetails.appendChild(bodyDetail);
  }

  testResults.classList.add('show');
};

/**
 * Обработчик клика по кнопке тестирования
 */
const handleTestClick = async (): Promise<void> => {
  const url = endpointInput.value.trim();
  const validationError = validateEndpoint(url);

  if (validationError) {
    setStatus(validationError, "error");
    endpointInput.focus();
    return;
  }

  try {
    setButtonLoading(testButton, true);
    setStatus("Тестирование подключения...", "info");
    testResults.classList.remove('show');

    const result = await testApiEndpoint(url);

    if (result.success) {
      setStatus("Подключение успешно! Endpoint доступен.", "success");
    } else {
      setStatus(`Ошибка подключения: ${result.error || 'Неизвестная ошибка'}`, "error");
    }

    displayTestResults(result);

  } catch (error) {
    console.error("Error during API test:", error);
    setStatus("Произошла ошибка при тестировании подключения", "error");
  } finally {
    setButtonLoading(testButton, false);
  }
};

/**
 * Обработчик отправки формы
 */
const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  const value = endpointInput.value;
  const validationError = validateEndpoint(value);

  if (validationError) {
    setStatus(validationError, "error");
    endpointInput.focus();
    return;
  }

  try {
    setButtonLoading(submitButton, true);
    await chrome.storage.sync.set({ [STORAGE_KEY]: value.trim() });
    setStatus("Настройки сохранены успешно!", "success");
  } catch (error) {
    console.error("Failed to persist endpoint URL", error);
    setStatus("Не удалось сохранить настройки. Проверьте разрешения и попробуйте еще раз.", "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
};

// Настраиваем обработчики событий
form.addEventListener("submit", handleSubmit);
testButton.addEventListener("click", handleTestClick);

// Загружаем сохраненные настройки при инициализации
void loadStoredEndpoint();
