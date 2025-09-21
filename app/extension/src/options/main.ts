const STORAGE_KEY = "endpointUrl";
const STATUS_CLEAR_DELAY = 3000;

const form = document.getElementById("options-form") as HTMLFormElement | null;
const endpointInput = document.getElementById("endpoint-url") as HTMLInputElement | null;
const statusBox = document.getElementById("status") as HTMLDivElement | null;
const submitButton = form?.querySelector("button[type='submit']") as HTMLButtonElement | null;

if (!form || !endpointInput || !statusBox || !submitButton) {
  throw new Error("Options page failed to initialize: required DOM nodes are missing.");
}

let statusResetTimer: number | undefined;

const setStatus = (message: string, variant: "success" | "error" | "info" = "info") => {
  window.clearTimeout(statusResetTimer);
  statusBox.textContent = message;
  statusBox.classList.remove("status--error", "status--success");

  if (variant === "error") {
    statusBox.classList.add("status--error");
  } else if (variant === "success") {
    statusBox.classList.add("status--success");
  }

  if (message) {
    statusResetTimer = window.setTimeout(() => {
      statusBox.textContent = "";
      statusBox.classList.remove("status--error", "status--success");
    }, STATUS_CLEAR_DELAY);
  }
};

const loadStoredEndpoint = async () => {
  try {
    submitButton.disabled = true;
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const storedValue = result[STORAGE_KEY];

    if (typeof storedValue === "string") {
      endpointInput.value = storedValue;
    }
  } catch (error) {
    console.error("Failed to read endpoint URL from storage", error);
    setStatus("Could not load the saved endpoint. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
};

const validateEndpoint = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Endpoint URL is required.";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Enter a valid URL.";
  }

  if (parsed.protocol !== "https:") {
    return "Endpoint must use HTTPS.";
  }

  return "";
};

const handleSubmit = async (event: SubmitEvent) => {
  event.preventDefault();
  const value = endpointInput.value;
  const validationError = validateEndpoint(value);

  if (validationError) {
    setStatus(validationError, "error");
    endpointInput.focus();
    return;
  }

  try {
    submitButton.disabled = true;
    await chrome.storage.sync.set({ [STORAGE_KEY]: value.trim() });
    setStatus("Endpoint saved.", "success");
  } catch (error) {
    console.error("Failed to persist endpoint URL", error);
    setStatus("Could not save the endpoint. Check permissions and try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
};

form.addEventListener("submit", handleSubmit);
void loadStoredEndpoint();
