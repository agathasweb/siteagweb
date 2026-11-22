import { createRequire } from 'node:module';
const require = createRequire('/home/gutto/DDEV/geracao-bethel/e2e/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
await p.goto('file://' + process.cwd() + '/peca.html', { waitUntil: 'networkidle' }); await p.screenshot({ path: 'salomao-chatgpt-1080.jpg', type: 'jpeg', quality: 90 }); await b.close();
