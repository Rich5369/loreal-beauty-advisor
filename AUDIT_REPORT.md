# Final technical audit — November 12, 2026

The frontend works with real AI responses, passes local tests, and fits the three
requested viewport widths. The repository fixes are ready. Full submission
readiness remains conditional on deploying the updated Worker: the live endpoint
reports `gpt-4o-mini-2024-07-18`, whereas the required server source now uses
`gpt-4.1`. No Cloudflare deployment was performed or claimed.

| Requirement | Maximum Points | Status | Evidence |
|---|---:|---|---|
| L'Oréal Branding | 10 | PASS | Supplied logo loads; PDF pages 3–4 inspected; FutureBrand palette matches; Chromium 375/768/1440 screenshots, loaded fonts and no overflow. |
| Chatbot Configuration | 20 | PARTIAL | Real browser request/display succeeds without CORS or JavaScript errors; mock tests cover controls, errors and cancellation. Deployed model differs from required `gpt-4.1`. |
| AI Relevance | 10 | PASS | Five actual live checks: oily-skin routine, serum/moisturizer explanation, programming refusal, FIFA refusal, injection refusal. See live-results.json. Product accuracy is not independently certified. |
| Secure Deployment | 10 | PARTIAL | Live preflight correct; foreign Origin 403; browser system message and empty history 400. Hardened repository Worker passes mocks. Dashboard secret storage, active rate limiting and deployed source cannot be inspected. |
| Conversation History | 10 | PASS | Real Alex/oily-skin follow-up and name recall; mock ordered roles, failure exclusion, reset and bounded history. Live 21-message rejection revealed a bug; live 19-message success establishes the corrected boundary. |
| Display User Questions | 5 | PASS | Immediate chronological user bubbles; safe literal HTML rendering in Node and Chromium; reset clears them. |
| Chat Conversation UI | 10 | PASS | Distinct aligned bubbles, scrolling, loading and wrapping; Chromium screenshots and rendering tests. |
| Reflection: Building Chatbot | 10 | Not part of code audit | Student completes separately. |
| Reflection: Talking Points | 10 | Not part of code audit | Student completes separately. |
| Reflection: L'Oréal Recruiter | 10 | Not part of code audit | Student completes separately. |

Statuses indicate tested behavior, not awarded marks. Technical maximum: 75;
reflection maximum: 30. No full-score claim is made.

## Fixes and root causes

- Unbounded frontend history eventually exceeded the deployed Worker's limit.
  A 21-message request failed with 400; 19 succeeded with an actual AI answer.
  Keep the latest nine complete turns (18 messages), then append the current
  question. Older bubbles stay visible. The interface explains this limit.
- The original repository Worker trusted arbitrary browser roles, allowed `*`,
  used `gpt-4o`, and lacked safe validation/error handling. Replace it with a
  server-enforced beauty prompt, `gpt-4.1`, exact origin validation, POST/OPTIONS,
  streaming body-size checks, bounded message content/count, alternating roles,
  safe failures, a 25-second timeout and optional rate-limit binding. The live
  Worker already has some protections; repository source was not proof of its
  deployed configuration.
- Bound assistant replies to 6,000 characters on both sides so retained history
  remains acceptable to the supplied Worker. Existing cancellation identity
  checks, plain-text rendering and successful-pair history behavior are retained.

## Executed checks

- `node --check script.js`: PASS.
- `node tests/chat.test.cjs`: PASS. Mock-only: blank/oversized input, suggestions,
  counters, Enter/Shift+Enter/IME, duplicate prevention, loading, safe text,
  request format, history roles/order/limits, HTTP/network/malformed JSON/invalid
  response failures, timeout recovery, reset, stale answers and overlapping old
  and new requests.
- `node tests/worker.test.cjs`: PASS. Mock-only: origins, preflight, methods,
  content type, JSON, body limits, message roles/count/size, server prompt/model,
  missing secret, rate-limit rejection, valid contract and sanitized failures.
  These mocks do not establish AI relevance.
- `python3 tests/browser-audit.py`: PASS using temporary Python Playwright and
  Chromium outside the frontend. Real layout and DOM; mocked AI responses.
  375/768/1440 widths, loaded logo/fonts, no horizontal overflow, safe bubbles,
  keyboard newline/submission and reset. No page JavaScript exceptions.
- `python3 tests/browser-audit.py --live`: PASS on the public frontend, including
  a real oily-skin question, actual answer display, and no visible request error.
- axe-core 4.10.3: zero violations for WCAG 2 A/AA, WCAG 2.1 AA and best-practice
  rules in the local browser. Two checks require manual review. Automated checks
  do not establish complete accessibility conformance; assistive-technology
  announcements were not tested with a screen reader.
- Source inspection: semantic landmarks, input label, accessible names, focus
  outlines, alert/status/log announcements, 44px buttons and reduced motion.
  Existing documented contrast pairs meet the applicable minimums.
- Secret-pattern scan: all 28 reachable commits at audit start, zero matching
  file versions for common OpenAI/GitHub/AWS key formats. No matched content was
  printed. This is a pattern scan, not a guarantee that arbitrary secrets never
  existed. No credentials were added or requested.
- `git diff --check`: PASS. Remote main and local main matched before changes.

Evidence: [live replies](tests/evidence/live-results.json),
[history boundary results](tests/evidence/history-boundaries.json),
[mobile](tests/evidence/mobile-375.png), [tablet](tests/evidence/tablet-768.png),
[desktop](tests/evidence/desktop-1440.png). Screenshots show the final local UI;
AI replies in local UI tests are mocks. Live responses were sampled separately.

The supplied `BrandReview_LOREAL.pdf` was accessible and inspected, particularly
its historical Avant Garde/Bodoni and Helvetica Now/Halesworth examples. Its
pre-existing untracked file was preserved and excluded from the commit.
[FutureBrand's case study](https://www.futurebrand.com/our-work/loreal) supports
black/white/red, serif/sans typography and the O motif. Existing Manrope and
Bodoni Moda are open-source substitutes, not redistributed proprietary fonts.
The red remains an approximation; the supplied logo was preserved, not replaced.

## Remaining deployment and manual checks

1. Deploy `RESOURCE_cloudflare-worker.js` through the authorized Cloudflare
   maintainer dashboard. Retain the existing `OPENAI_API_KEY` Worker secret;
   never put a credential in source. No Cloudflare management tools are connected.
2. Configure a `RATE_LIMITER` binding (e.g. 10 requests/minute/IP). Optional support
   is implemented and mock-tested; active deployed abuse protection is unknown.
   CORS alone is not authentication and does not prevent scripted abuse.
3. Repeat a small set of relevance/context tests after switching to `gpt-4.1`;
   current live evidence applies to the existing `gpt-4o-mini` deployment.
4. Check suggested product names/claims against official local labels. Live
   answers included confident product details and scrub/cleanser confusion;
   no product catalog was available to certify them. The replacement prompt
   requires uncertainty and category-level guidance when details are unknown.
5. Complete a screen-reader check of live announcements and the three reflections.

No known frontend bug remains from the tested cases. Production behavior after
Worker deployment remains unverified. GitHub Pages publishes independently of
pushing source; verify its published script matches main after the build.

Frontend: https://rich5369.github.io/loreal-beauty-advisor/

Worker: https://loreal-beauty-advisor-api.richardtienle.workers.dev

Files changed: `script.js`, `index.html`, `RESOURCE_cloudflare-worker.js`,
`README.md`, `tests/chat.test.cjs`, new `tests/worker.test.cjs`,
`tests/browser-audit.py`, `tests/evidence/*`, and this report. CSS and logo remain
unchanged. The final response records the exact verified local and remote commits; the
report belongs to that commit (embedding its own hash would change it).

## Commit and push result

The tested changes were committed locally on `main`. The requested push was
attempted without force and rejected by GitHub with HTTP 403:
`Permission to Rich5369/loreal-beauty-advisor.git denied to Rich5369.`
The remote was verified afterward and remains at
`d91aef86d2a8e37c7fd62c001835925162b8549d`. This is a GitHub write-permission
failure, not an automatic approval-review rejection. Authenticate with an account
or repository credential that has write permission, then run `git push origin main`.
Do not put credentials into project files. The final response supplies the local
commit hash. The live frontend still contains the previous source, so the new
history fix has been verified locally but has not been published.


## Later exact-rubric verification

The user supplied the actual rubric screenshots after this audit. See
`RUBRIC_CHECKLIST.md` for the criterion-by-criterion mapping. All Node checks
passed again. The screenshot rubric does not specify a model; the gpt-4.1
requirement belongs to the earlier expanded request.

This check supersedes the earlier frontend publication status: remote main now
contains `8750bb3cc58c919cb70cf2f6f9c6d0ed111a024b`. The public `script.js` was
downloaded and is byte-for-byte identical to the tested local script, including
the nine-turn history fix. My new checklist push still failed with HTTP 403, so
only the later documentation remains unpublished. The Worker deployment and
student reflection steps remain separate.
