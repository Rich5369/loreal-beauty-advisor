// Local mock only: no network requests or real AI responses are used.
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

class Element {
  constructor() { this.value = ''; this.children = []; this.listeners = {}; this.dataset = {}; this.classList = { add() {} }; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
  replaceChildren() { this.children = []; }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  focus() {}
  requestSubmit() { return this.listeners.submit({ preventDefault() {} }); }
}

function setup(configured = true) {
  const ids = {};
  const suggestion = new Element();
  suggestion.dataset.suggestion = "Build my skincare routine";
  const document = {
    getElementById(id) { return ids[id] ||= new Element(); },
    createElement() { return new Element(); },
    querySelectorAll() { return [suggestion]; },
  };
  const requests = [];
  let respond;
  let rejectRequest;
  const context = vm.createContext({ document, AbortController, setTimeout, clearTimeout,
    fetch(url, options) { requests.push({ url, options }); return new Promise((resolve, reject) => { respond = resolve; rejectRequest = reject; }); },
  });
  const source = readFileSync('script.js', 'utf8');
  // Override the endpoint for both test modes; never contact the live Worker.
  const testUrl = configured ? "https://mock.invalid/" : "";
  vm.runInContext(source.replace(/const WORKER_URL = "[^"]*";/, `const WORKER_URL = "${testUrl}";`), context);
  return { ids, requests, suggestion, fail() { rejectRequest(new TypeError("Mock network failure")); }, reply(data, ok = true) { respond({ ok, json: async () => data }); },
    send(text) { ids.userInput.value = text; return ids.chatForm.requestSubmit(); },
    history() { return JSON.parse(vm.runInContext('JSON.stringify(messages)', context)); },
  };
}

(async () => {
  let app = setup(false);
  await app.send('Hello');
  assert.equal(app.requests.length, 0);
  assert.equal(app.ids.errorMessage.hidden, false);
  assert.equal(app.ids.userInput.value, 'Hello');

  app = setup();
  const first = app.send('<img src=x onerror=alert(1)>');
  assert.equal(app.ids.chatWindow.children[1].children[1].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(app.ids.sendBtn.disabled, true);
  await app.send('duplicate');
  assert.equal(app.requests.length, 1);
  app.reply({ choices: [{ message: { content: 'Mock skincare answer' } }] });
  await first;
  assert.equal(app.history().length, 2);
  assert.equal(app.ids.sendBtn.disabled, false);
  const second = app.send('What about moisturizer?');
  assert.equal(JSON.parse(app.requests[1].options.body).messages.length, 3);
  app.reply({ choices: [] });
  await second;
  assert.equal(app.history().length, 2);
  assert.equal(app.ids.errorMessage.hidden, false);
  assert.equal(app.ids.userInput.value, 'What about moisturizer?');

  const pending = app.send('Another question');
  app.ids.newChat.listeners.click();
  assert.equal(app.requests[2].options.signal.aborted, true);
  app.reply({ choices: [{ message: { content: 'Stale mock answer' } }] });
  await pending;
  assert.equal(app.history().length, 0);
  assert.equal(app.ids.chatWindow.children.length, 1);
  assert.equal(app.ids.sendBtn.disabled, false);

  const httpError = app.send('Try again');
  app.reply({}, false);
  await httpError;
  assert.equal(app.history().length, 0);
  assert.equal(app.ids.errorMessage.hidden, false);
  const networkError = app.send('Network test');
  app.fail();
  await networkError;
  assert.equal(app.ids.errorMessage.hidden, false);
  assert.equal(app.ids.sendBtn.disabled, false);
  let submissions = 0;
  app.ids.chatForm.requestSubmit = () => { submissions += 1; };
  const keydown = app.ids.userInput.listeners.keydown;
  keydown({ key: 'Enter', shiftKey: true, preventDefault() { throw new Error('Newline was blocked'); } });
  keydown({ key: 'Enter', isComposing: true, preventDefault() { throw new Error('Composition was blocked'); } });
  keydown({ key: 'Enter', preventDefault() {} });
  assert.equal(submissions, 1);
  app = setup();
  app.suggestion.listeners.click();
  assert.equal(JSON.parse(app.requests[0].options.body).messages[0].content, 'Build my skincare routine');
  assert.equal(app.suggestion.disabled, true);
  app.reply({ choices: [{ message: { content: 'Suggested routine' } }] });
  // Let the asynchronous submit handler finish updating the interface.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.suggestion.disabled, false);
  app.ids.userInput.value = 'Beauty';
  app.ids.userInput.listeners.input();
  assert.equal(app.ids.characterCount.textContent, '6 / 2000');
  assert.equal(app.history().length, 2);
  console.log('PASS: suggestions, character counter, keyboard controls, network errors, unconfigured endpoint, safe text, duplicate prevention, loading, history, invalid reply, HTTP failure, reset, and stale-response cancellation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
