import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const tempUserDataDir = path.resolve('node_modules', '.tmp_chrome_user_data');

if (!fs.existsSync(tempUserDataDir)) {
  fs.mkdirSync(tempUserDataDir, { recursive: true });
}

const auditDir = path.resolve('public', 'audit');
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

console.log('Using browser:', browserExe);

const chromeProc = spawn(browserExe, [
  '--remote-debugging-port=9222',
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
      const res = await fetch('http://127.0.0.1:9222/json/version');
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
        if (msg.method === 'Log.entryAdded') {
          this.consoleLogs.push(msg.params.entry);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push({
            type: msg.params.type,
            text: msg.params.args.map(a => a.value || a.description).join(' ')
          });
        } else if (msg.method === 'Network.responseReceived') {
          const status = msg.params.response.status;
          if (status >= 400) {
            this.networkErrors.push({
              url: msg.params.response.url,
              status,
              statusText: msg.params.response.statusText
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

    // Create a new target page
    const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:5173/', { method: 'PUT' });
    const targetInfo = await newTargetRes.json();
    console.log('Created page target:', targetInfo.webSocketDebuggerUrl);

    const client = new CDPClient(targetInfo.webSocketDebuggerUrl);
    await client.ready;

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');
    await client.send('Log.enable');
    await client.send('DOM.enable');

    console.log('Navigating to http://localhost:5173/ ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await wait(3000); // Wait for initial render and animations

    // Test viewports required by the prompt
    const viewports = [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'laptop-1024', width: 1024, height: 768 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'mobile-390', width: 390, height: 844 },
      { name: 'mobile-360', width: 360, height: 800 }
    ];

    const auditResults = {
      viewports: {},
      consoleLogs: [],
      networkErrors: [],
      domAudit: {}
    };

    for (const vp of viewports) {
      console.log(`Auditing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768
      });
      await wait(1200);

      // Check layout overflow
      const overflowCheck = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;
          
          // Find any elements causing overflow
          const overflowingElements = [];
          if (hasHorizontalOverflow) {
            document.querySelectorAll('*').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth + 1) {
                overflowingElements.push({
                  tag: el.tagName,
                  className: (el.className || '').toString().slice(0, 50),
                  rect: { right: Math.round(rect.right), width: Math.round(rect.width) }
                });
              }
            });
          }

          // Measure Hero elements
          const heroH1 = document.querySelector('h1');
          const heroH1Rect = heroH1 ? heroH1.getBoundingClientRect() : null;

          // Check reading movement section
          const movementSection = document.querySelector('section[aria-label="The Aurangabad Reading Movement"]');
          const movementRect = movementSection ? movementSection.getBoundingClientRect() : null;

          return {
            hasHorizontalOverflow,
            scrollWidth,
            clientWidth,
            overflowCount: overflowingElements.length,
            overflowSamples: overflowingElements.slice(0, 3),
            heroH1Rect: heroH1Rect ? { top: Math.round(heroH1Rect.top), bottom: Math.round(heroH1Rect.bottom), height: Math.round(heroH1Rect.height) } : null,
            movementRect: movementRect ? { top: Math.round(movementRect.top), height: Math.round(movementRect.height) } : null
          };
        })()`,
        returnByValue: true
      });

      auditResults.viewports[vp.name] = overflowCheck.result?.value;

      // Viewport Screenshot
      const vpScreenshot = await client.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 1 }
      });
      const vpFile = path.join(auditDir, `screenshot-${vp.name}-above-fold.png`);
      fs.writeFileSync(vpFile, Buffer.from(vpScreenshot.data, 'base64'));

      // Scroll down the page to trigger all in-view animations
      await client.send('Runtime.evaluate', {
        expression: `(async () => {
          const distance = 400;
          const totalHeight = document.body.scrollHeight;
          let current = 0;
          while (current < totalHeight) {
            window.scrollBy(0, distance);
            current += distance;
            await new Promise(r => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 300));
        })()`,
        awaitPromise: true
      });

      // Full Page Screenshot for 1440 and 390
      if (vp.name === 'desktop-1440' || vp.name === 'mobile-390') {
        const fullPageScreenshot = await client.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true
        });
        const fullFile = path.join(auditDir, `screenshot-${vp.name}-fullpage.png`);
        fs.writeFileSync(fullFile, Buffer.from(fullPageScreenshot.data, 'base64'));
      }
    }

    // Now test DOM quality, Headings, Images, Links and Buttons on Desktop
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await wait(500);

    const comprehensiveDomCheck = await client.send('Runtime.evaluate', {
      expression: `(() => {
        // Headings check
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim().slice(0, 60),
          visible: h.offsetParent !== null
        }));

        // Images check (alt tags, broken src, dimensions)
        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt'),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          visible: img.offsetParent !== null
        }));

        // Interactive links and buttons check
        const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim().slice(0, 40),
          ariaLabel: b.getAttribute('aria-label'),
          hasClickOrAction: true,
          disabled: b.disabled
        }));

        // Video and Audio elements
        const videos = Array.from(document.querySelectorAll('video')).map(v => ({
          src: v.currentSrc || v.src,
          paused: v.paused,
          muted: v.muted,
          readyState: v.readyState
        }));

        return {
          headings,
          images: {
            total: images.length,
            missingAlt: images.filter(i => !i.alt).length,
            broken: images.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)
          },
          buttons: {
            total: buttons.length,
            missingAria: buttons.filter(b => !b.text && !b.ariaLabel).length
          },
          videos: {
            total: videos.length,
            list: videos
          }
        };
      })()`,
      returnByValue: true
    });

    auditResults.domAudit = comprehensiveDomCheck.result?.value;
    auditResults.consoleLogs = client.consoleLogs;
    auditResults.networkErrors = client.networkErrors;

    const reportPath = path.join(auditDir, 'audit-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));

    console.log('AUDIT COMPLETE! Results saved to public/audit/');
    console.log('Summary:', JSON.stringify(auditResults.domAudit, null, 2));
    console.log('Network errors:', auditResults.networkErrors.length);
    console.log('Console logs:', auditResults.consoleLogs.length);

    client.close();
    cleanup();
  } catch (err) {
    console.error('Audit failed:', err);
    cleanup();
    process.exit(1);
  }
}

run();
