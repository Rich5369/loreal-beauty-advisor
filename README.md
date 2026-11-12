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

## Worker integration still required (maintainer)

`RESOURCE_cloudflare-worker.js` is the original, unchanged server helper; it
accepts `messages` and forwards the Chat Completions response. It currently uses
`gpt-4o`, trusts browser messages, allows every origin, and does not preserve
upstream error statuses. Do not deploy it unchanged for this application.

Before the separate Worker deployment, the maintainer should:

1. Change the server model to `gpt-4.1` and prepend the system prompt from
   `WORKER_PROMPT.md` on every request. Keep this logic on the server.
2. Validate JSON, message sizes, total request size, and ordered user/assistant
   roles, ending with a user message. Reject browser-supplied system/developer
   messages rather than forwarding them. Set a bounded context budget and a
   helpful error for conversations that exceed it.
3. Configure `OPENAI_API_KEY` exclusively through the Worker secret dashboard;
   never save a credential in a source file. The browser needs no credentials.
4. Configure an `ALLOWED_ORIGIN` environment value for the actual frontend
   origin. Handle OPTIONS preflight and POST with matching CORS headers on
   success and errors; reject unsupported methods and other origins. CORS is
   not authentication: add appropriate abuse controls and rate limits.
5. Call the OpenAI Chat Completions endpoint server-side, handle upstream
   network errors, and return meaningful non-2xx statuses without exposing
   credentials or internal error details. Keep the successful response shape
   above. Apply a server timeout and sensible output limit.
6. Deploy separately, provide the real URL for `WORKER_URL`, and test allowed
   origins, actual replies, multi-turn context, relevance boundaries, and
   failure behavior. Never link the Worker helper from `index.html`.

The frontend is ready for GitHub Pages with `main` as the source branch and
`/ (root)` as the publishing folder. All assets use relative paths. The intended
URL is https://rich5369.github.io/loreal-beauty-advisor/. The Worker should allow
`https://rich5369.github.io` as the frontend origin (origins have no path).

No Worker was deployed and no live OpenAI connection was tested in this work.

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
The frontend logic, Worker URL, and Worker helper are unchanged by branding.
Local asset references, selected contrast pairs, and the Google Fonts stylesheet
and referenced font downloads were checked. CSS includes narrow mobile layouts,
44px action controls, wrapping helper text, and reduced-motion support.
No browser preview was available for desktop/mobile visual inspection, and no
live Worker/OpenAI request was made as part of this visual update.
