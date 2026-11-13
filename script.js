// Public Cloudflare Worker endpoint; the Worker keeps all API credentials.
// This is a public endpoint, never an API key. A blank value makes no requests.
const WORKER_URL = "https://loreal-beauty-advisor-api.richardtienle.workers.dev";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const newChat = document.getElementById("newChat");
const errorMessage = document.getElementById("errorMessage");
const connectionStatus = document.getElementById("connectionStatus");
const characterCount = document.getElementById("characterCount");
const suggestions = document.querySelectorAll("[data-suggestion]");

// Memory lasts for this page session only. Failed questions stay visible but
// are excluded from future requests so each saved turn has a matching reply.
let messages = [];
let activeRequest = null;

function addMessage(role, content) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "BEAUTY ADVISOR";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  // textContent displays text safely, including angle brackets and line breaks.
  bubble.textContent = content;
  message.append(label, bubble);
  chatWindow.append(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

function updateCount() {
  characterCount.textContent = `${userInput.value.length} / 2000`;
}

function setBusy(busy) {
  sendBtn.disabled = busy;
  suggestions.forEach((button) => { button.disabled = busy; });
  connectionStatus.textContent = busy ? "Thinking about your beauty question…" :
    WORKER_URL ? "Ready to connect" : "Connection not configured";
}

function resetChat() {
  // Cancel the previous request; its result must never enter a new chat.
  if (activeRequest) activeRequest.abort();
  activeRequest = null;
  messages = [];
  chatWindow.replaceChildren();
  addMessage("assistant", "Welcome! Let’s find what works for you. I can help with L’Oréal products, skincare routines, haircare, and makeup. What would you like to explore?");
  errorMessage.hidden = true;
  userInput.value = "";
  updateCount();
  setBusy(false);
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = userInput.value.trim();
  if (!question || question.length > 2000 || activeRequest) return;
  errorMessage.hidden = true;

  // Keep the question editable until an actual endpoint has been provided.
  if (!WORKER_URL) {
    errorMessage.textContent = "The beauty advisor isn’t connected yet. Add the class-hosted Worker URL to WORKER_URL in script.js, then send your question again.";
    errorMessage.hidden = false;
    return;
  }

  const controller = new AbortController();
  activeRequest = controller;
  setBusy(true);
  addMessage("user", question);
  userInput.value = "";
  updateCount();
  const typing = addMessage("assistant", "Thinking…");
  typing.classList.add("typing");
  // A timeout also lets users recover from an endpoint that stops responding.
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, { role: "user", content: question }] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("The advisor couldn’t answer right now. Please try again shortly.");
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim() || reply.length > 6000) {
      throw new Error("The advisor returned an unreadable response. Please try again.");
    }
    if (activeRequest !== controller) return;
    typing.remove();
    addMessage("assistant", reply.trim());
    messages.push({ role: "user", content: question }, { role: "assistant", content: reply.trim() });
    // Keep nine complete turns, matching the Worker’s 19-message request limit.
    messages = messages.slice(-18);
  } catch (error) {
    if (activeRequest !== controller) return;
    typing.remove();
    addMessage("assistant", "I couldn’t answer this question. Please try sending it again.");
    errorMessage.textContent = error.name === "AbortError"
      ? "The request timed out. Please try again."
      : error instanceof TypeError || error instanceof SyntaxError
        ? "Unable to reach the advisor or read its response. Check the Worker URL, connection, and allowed origins, then retry."
        : error.message;
    errorMessage.hidden = false;
    // Restore the failed question unless the user has already typed a new one.
    if (!userInput.value) userInput.value = question;
    updateCount();
  } finally {
    clearTimeout(timeout);
    if (activeRequest === controller) {
      activeRequest = null;
      setBusy(false);
      userInput.focus();
    }
  }
});

// Enter submits; Shift+Enter inserts a line break. Respect IME composition.
userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});
userInput.addEventListener("input", updateCount);
suggestions.forEach((button) => {
  button.addEventListener("click", () => {
    userInput.value = button.dataset.suggestion;
    updateCount();
    userInput.focus();
    chatForm.requestSubmit();
  });
});
newChat.addEventListener("click", () => { resetChat(); userInput.focus(); });
resetChat();
