# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

When deploying through Cloudflare, make sure your API request body (in `script.js`) includes a `messages` array and handle the response by extracting `data.choices[0].message.content`.

Enjoy building your L’Oréal beauty assistant! 💄

## Frontend setup

This project uses HTML, CSS, and vanilla JavaScript. No packages or build step
are required. Open `index.html` using the Codespaces Live Server extension.
The supplied logo is reused from `img/loreal-logo.png`.

In `script.js`, `WORKER_URL` is configured as
`https://loreal-beauty-advisor-api.richardtienle.workers.dev`. An
empty value shows a setup error without sending a request or fabricating an
AI response. “Ready to connect” means an endpoint is set, not that it was tested.

Students do not handle OpenAI keys. Never add a key to this repository or the
browser. The class-hosted Cloudflare Worker holds its key as a Worker secret.

## Chat behavior

Send with the arrow button or Enter; Shift+Enter adds a line break. Suggestion
buttons submit a starter question. Input is limited to 2,000 characters.
Only successful user/assistant pairs are retained in page memory and sent on
later turns. The initial welcome, loading messages, and errors are not history.
Failed questions stay visible with an adjacent failure notice, are restored in
the composer if it is empty, and can be retried. Refresh or New Chat clears
memory. New Chat also cancels any pending request. No chat is persisted.

## Worker request and response contract

The browser sends `POST` with `Content-Type: application/json`:

```json
{"messages":[{"role":"user","content":"I have oily skin."},{"role":"assistant","content":"What is your main concern?"},{"role":"user","content":"What about a moisturizer?"}]}
```

The browser reads a nonempty string at `data.choices[0].message.content`:

```json
{"choices":[{"message":{"role":"assistant","content":"A lightweight moisturizer may suit your routine."}}]}
```

These are contract examples, not live responses. Use non-2xx HTTP status codes
for errors, optionally with `{"error":{"message":"Service unavailable"}}`.
The frontend displays its own safe error text for HTTP failures, network/CORS
errors, malformed JSON, missing replies, and a 30-second timeout.

## Worker deployment (maintainer)

`RESOURCE_cloudflare-worker.js` is the server-only implementation. Copy it into
Cloudflare Workers separately; never link it from `index.html`. It uses `gpt-4.1`,
prepends its own beauty-advisor system prompt, rejects browser system/developer
roles, validates alternating conversation roles and content sizes, and handles
upstream errors without forwarding private diagnostics. It allows only
`https://rich5369.github.io`, handles OPTIONS, and rejects other HTTP methods.

The Worker reads `env.OPENAI_API_KEY` exclusively from a Cloudflare secret.
Students do not handle keys. The maintainer must retain the existing secret in
Cloudflare; never add credentials to source files. An optional `RATE_LIMITER`
Cloudflare Rate Limiting binding is supported; configure it in the dashboard
(for example, 10 requests per minute per IP) before relying on abuse protection.
CORS does not prevent non-browser callers from forging the Origin header.

Both client and Worker limit requests to nine completed turns plus the current
question (19 messages). Older complete turns are discarded from request context,
but remain visible until New Chat or refresh. User messages are limited to 2,000
characters and assistant replies to 6,000. Total request bodies are limited to
100,000 bytes. The Worker uses a 25-second upstream timeout; the browser uses
30 seconds. No browser storage is used.

GitHub Pages should publish `main` from `/ (root)` at
https://rich5369.github.io/loreal-beauty-advisor/. All assets use relative paths.
Worker source changes in this repository do not deploy automatically. See
`AUDIT_REPORT.md` for the actual deployment checks and remaining manual steps.

## Testing

Run `node --check script.js`, `node tests/chat.test.cjs`,
`node tests/worker.test.cjs`, and `git diff --check`.
These dependency-free Node tests use mocked DOM/network objects; they do not
verify real AI relevance. The Worker tests run the server source in a sandbox
with mocked upstream responses, without credentials.

Optional browser checks: install Python Playwright and Chromium outside the
frontend, then run `python3 tests/browser-audit.py`. It tests local files at
375, 768 and 1440 pixels with clearly mocked API replies. `--live` checks the
published frontend and sends one real question to the Worker. Temporary
screenshots are written to `/tmp`.

## Corporate-inspired branding

The visual update follows [FutureBrand’s L’Oréal case study](https://www.futurebrand.com/our-work/loreal):
black and white, a restrained vibrant red accent, and a small circular “O” motif.
The supplied `BrandReview_LOREAL.pdf` was reviewed, especially pages 3–4:
2019 paired Avant Garde Gothic with Bauer Bodoni, while 2020 paired Helvetica
Now Display with Halesworth eText. These are historical references, not a claim
that this student project implements L’Oréal’s current proprietary brand system.

Colors are centralized in `style.css`:

| Purpose | HEX |
| --- | --- |
| Black text and user bubbles | `#000000` |
| White background and reversed text | `#FFFFFF` |
| Vibrant red accent, Send, focus and errors | `#D71920` |
| Red hover | `#B51219` |
| Secondary text | `#595959` |
| Subtle borders | `#DEDEDE` |
| Input boundary | `#858585` |
| Assistant surface | `#F5F5F5` |
| Error and hover surface | `#FFF4F4` |

**The red is a visual approximation, not a verified official L’Oréal HEX.**
White on red is approximately 5.19:1; red on the pale red surface is 4.82:1;
secondary text on the assistant surface is 6.42:1. The input boundary against
white is 3.69:1. Focus outlines use red. Reduced-motion preferences disable
animations and transitions; the loading animation changes its border rather
than fading readable text.

[Manrope](https://fonts.google.com/specimen/Manrope) provides a geometric,
readable interface; [Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda)
provides selective serif headings inspired by the historical Bodoni pairing.
Both are open-source fonts available through Google Fonts under the SIL Open
Font License. They are loaded through Google's stylesheet with `display=swap`;
system sans-serif and serif fallbacks remain available if fonts are blocked.
No proprietary fonts are downloaded or redistributed. The supplied official
logo image is used in both header and footer.

### Branding verification

Run `node --check script.js`, `node tests/chat.test.cjs`, and `git diff --check`.
The mock suite covers suggestions, character counting, keyboard controls,
loading, successful history, invalid replies, network and HTTP failures, safe
text rendering, duplicate prevention, and reset/stale-response cancellation.
The initial branding change preserved frontend logic; the final audit adds bounded history and a validated Worker implementation.
Local asset references, selected contrast pairs, and the Google Fonts stylesheet
and referenced font downloads were checked. CSS includes narrow mobile layouts,
44px action controls, wrapping helper text, and reduced-motion support.
No browser preview was available for desktop/mobile visual inspection, and no
live Worker/OpenAI request was made as part of this visual update.
