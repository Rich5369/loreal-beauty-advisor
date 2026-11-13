"""Optional Playwright browser checks. Worker calls are mocked unless --live is used.
Install Playwright outside this project; no frontend dependencies are needed.
"""
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

live = '--live' in sys.argv
url = 'https://rich5369.github.io/loreal-beauty-advisor/' if live else Path('index.html').resolve().as_uri()
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    if not live:
        page.route('**/loreal-beauty-advisor-api.richardtienle.workers.dev', lambda route: route.fulfill(json={'choices': [{'message': {'content': 'Mock beauty advice ' + 'x' * 300}}]}, headers={'Access-Control-Allow-Origin': '*'}))
    page.goto(url)
    page.evaluate('document.fonts.ready')
    assert page.evaluate("document.fonts.check('14px Manrope') && document.fonts.check('34px \"Bodoni Moda\"')")
    page.wait_for_function("document.querySelector('#chatWindow').children.length === 1")
    for width in [375, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}'
        assert page.locator('.brand-logo').evaluate('(img) => img.complete && img.naturalWidth > 0')
        assert page.locator('#sendBtn').is_visible()
        assert page.locator('#newChat').is_visible()
        page.screenshot(path=f'/tmp/loreal-{ "live" if live else "mock" }-{width}.png', full_page=True)
    # Optional external checker is supplied separately, never loaded by the app.
    if Path('/tmp/loreal-axe.js').exists():
        page.add_script_tag(path='/tmp/loreal-axe.js')
        result = page.evaluate("async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']}})")
        print('AXE:', len(result['violations']), 'violations; manual-review checks:', [item['id'] for item in result['incomplete']])
        assert not result['violations'], [(v['id'], v['description']) for v in result['violations']]
    if not live:
        page.locator('#userInput').fill('<img src=x onerror=alert(1)>')
        page.locator('#userInput').press('Enter')
        page.wait_for_function("document.querySelectorAll('.message').length === 3 && !document.querySelector('#sendBtn').disabled")
        assert page.locator('.message.user .bubble').inner_text() == '<img src=x onerror=alert(1)>'
        assert page.locator('#chatWindow img').count() == 0
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#userInput').fill('Line one')
        page.locator('#userInput').press('Shift+Enter')
        assert '\n' in page.locator('#userInput').input_value()
        page.locator('#newChat').click()
        assert page.locator('.message').count() == 1
        assert page.locator('#userInput').input_value() == ''
    else:
        page.locator('#userInput').fill('What is a good skincare routine for oily skin?')
        page.locator('#sendBtn').click()
        page.wait_for_function("!document.querySelector('#sendBtn').disabled", timeout=40000)
        print('LIVE CHAT:', page.locator('#chatWindow').inner_text())
        print('LIVE ERROR:', page.locator('#errorMessage').inner_text() if page.locator('#errorMessage').is_visible() else 'none')
    assert not errors, errors
    print('PASS:', 'live UI' if live else 'mock UI', '375/768/1440px, assets, overflow, controls, no JavaScript errors')
    browser.close()
