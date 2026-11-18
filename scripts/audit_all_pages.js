import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const tempUserDataDir = path.resolve('node_modules', '.tmp_chrome_user_data_pages');

if (!fs.existsSync(tempUserDataDir)) {
  fs.mkdirSync(tempUserDataDir, { recursive: true });
}

const auditDir = path.resolve('public', 'audit', 'pages');
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

const chromeProc = spawn(browserExe, [
  '--remote-debugging-port=9223',
  '--headless=new',
  '--disable-gpu',
  `--user-data-dir=${tempUserDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

let killed = false;
function cleanup() {
  if (!killed) {
    killed = true;
    try { chromeProc.kill(); } catch {}
  }
}
process.on('exit', cleanup);
process.on('SIGINT', cleanup);

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (res.ok) {
        const json = await res.json();
        return json.webSocketDebuggerUrl;
      }
    } catch {
  await wait(300);
}
  }
  throw new Error('Could not connect to Chrome debugging endpoint');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
    this.consoleLogs = [];
    this.networkErrors = [];

    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        if (msg.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push({
            type: msg.params.type,
            text: msg.params.args.map(a => a.value || a.description).join(' ')
          });
        } else if (msg.method === 'Network.responseReceived') {
          const status = msg.params.response.status;
          if (status >= 400) {
            this.networkErrors.push({
              url: msg.params.response.url,
              status
            });
          }
        }
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to Chrome WebSocket:', wsUrl);

    const newTargetRes = await fetch('http://127.0.0.1:9223/json/new?http://localhost:5173/', { method: 'PUT' });
    const targetInfo = await newTargetRes.json();
    const client = new CDPClient(targetInfo.webSocketDebuggerUrl);
    await client.ready;

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    console.log('Navigating to http://localhost:5173/ ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2500);

    const pages = [
      { id: 'home', name: 'Home' },
      { id: 'story', name: 'Our Story' },
      { id: 'gatherings', name: 'Gatherings' },
      { id: 'journal', name: 'The Journal' },
      { id: 'community', name: 'Community' },
      { id: 'get-involved', name: 'Get Involved' },
      { id: 'contact', name: 'Contact' }
    ];

    const results = {};

    for (const page of pages) {
      console.log(`Auditing page: ${page.name} (${page.id})...`);

      // Switch page in React state via navigation or button click
      await client.send('Runtime.evaluate', {
        expression: `(() => {
          if ('${page.id}' === 'home') {
            const logo = document.querySelector('header a, header button');
            if (logo) { logo.click(); return { clicked: true, text: 'logo' }; }
          }
          const buttons = Array.from(document.querySelectorAll('nav button, nav a, header button, header a'));
          const btn = buttons.find(b => b.textContent.toLowerCase().includes('${page.name.toLowerCase()}') || b.textContent.toLowerCase().includes('${page.id}'));
          if (btn) {
            btn.click();
            return { clicked: true, text: btn.textContent };
          }
          // Fallback: window.__setPage
          window.location.hash = '${page.id}';
          return { clicked: false, fallback: true };
        })()`,
        returnByValue: true
      });

      await wait(1500);

      // Desktop 1440
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await wait(800);

      // Scroll through to trigger Framer Motion
      await client.send('Runtime.evaluate', {
        expression: `(async () => {
          const distance = 400;
          const totalHeight = document.body.scrollHeight;
          let current = 0;
          while (current < totalHeight) {
            window.scrollBy(0, distance);
            current += distance;
            await new Promise(r => setTimeout(r, 50));
          }
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 300));
        })()`,
        awaitPromise: true
      });

      const desktopScreenshot = await client.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true
      });
      fs.writeFileSync(path.join(auditDir, `${page.id}-desktop-1440.png`), Buffer.from(desktopScreenshot.data, 'base64'));

      // Mobile 390
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true
      });
      await wait(800);

      const mobileScreenshot = await client.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true
      });
      fs.writeFileSync(path.join(auditDir, `${page.id}-mobile-390.png`), Buffer.from(mobileScreenshot.data, 'base64'));

      // Check overflow on mobile
      const overflowCheck = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          return {
            hasHorizontalOverflow: Math.max(docEl.scrollWidth, body.scrollWidth) > docEl.clientWidth,
            scrollWidth: Math.max(docEl.scrollWidth, body.scrollWidth),
            clientWidth: docEl.clientWidth
          };
        })()`,
        returnByValue: true
      });

      results[page.id] = {
        name: page.name,
        overflow: overflowCheck.result?.value
      };
    }

    fs.writeFileSync(path.join(auditDir, 'pages-audit-summary.json'), JSON.stringify(results, null, 2));
    console.log('ALL PAGES AUDITED! Results saved in public/audit/pages/');
    console.log(JSON.stringify(results, null, 2));

    client.close();
    cleanup();
  } catch (err) {
    console.error('Pages audit failed:', err);
    cleanup();
    process.exit(1);
  }
}

run();
