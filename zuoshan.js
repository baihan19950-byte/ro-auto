// RO 倖存者 全自動：左膳 服事 漢斯（設定先沿用旗湘）
// 由載入器（篡改猴或 iPhone 書籤）從 GitHub 讀取執行；帳密不放在這裡。
(() => {
  window.stopAll?.(); window.stopAutoPick?.(); window.stopCircle?.();
  const CFG = {
    map: '普隆德拉原野',
    lobby: '米德加德',   // 出現「選擇大廳」時要點的大廳
    pickup: '史詩以上',   // 戰鬥中「撿取：」要切到這個（空白＝不動）
    loot: ['紫', '金'],   // 看到這些顏色的光柱就跑過去撿（紫、金）
    must: ['天使之光', '治癒術', '天使之淚', '天使之賜福'],
    banish: ['光獵'],   // 出現時各點一次「放逐」
    focusOn: ['天使之光', '治癒術'],    // 每局第一次出現這張卡時，先點它下面的「專注」按鈕
    chestMust: ['採集', '豐饒', '驚奇', '堅壁之神', '護甲', '吸血', '傷害'],
    rarity: { '傳說': 400, '神話': 400, '史詩': 300, '稀有': 200, '優良': 150, '精良': 150, '技能': 100, '普通': 50 },
    newSkillBonus: 120,
    prefer: ['傷害', '攻擊速度', '目標'],
    preferBase: 200,
    avoid: ['光獵'],
    stepMs: 200,
    holdMs: 50,   // 每個方向實際按住多久（毫秒），越小圈越小；2x 速度下建議 100
    circle: true,       // false = 在地圖裡站著不動；true = 繞圈
    user: (window.RO_LOGIN || {}).user,
    pass: (window.RO_LOGIN || {}).pass,
    charName: '左膳',
    server: '米德加德',   // 選伺服器時要點的伺服器
    speed: true,   // 進戰場後自動把 1x 切成 2x
    log: true,
  };
  const CFG_KEY = 'roCfg_' + location.host + '_左膳';
  const CFG_FIELDS = [
    ['map', '地圖', 'text'],
    ['lobby', '大廳（出現「選擇大廳」時點這個）', 'text'],
    ['pickup', '撿取（例：全部、史詩以上；空白＝不動）', 'text'],
    ['loot', '跑去撿的光（紫，金；空白＝不撿）', 'list'],
    ['must', '技能優先（順序）', 'list'],
    ['focusOn', '專注', 'list'],
    ['banish', '放逐', 'list'],
    ['avoid', '永遠不選', 'list'],
    ['chestMust', '寶箱優先（順序）', 'list'],
    ['holdMs', '繞圈大小（數字越大圈越大）', 'num'],
    ['stepMs', '每步間隔（毫秒）', 'num'],
    ['circle', '繞圈（關掉＝站著不動）', 'bool'],
    ['speed', '進戰鬥自動 2x', 'bool'],
    ['chest', '看到箱子跑過去', 'bool'],
  ].filter(f => f[0] in CFG);
  try { const sv = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); for (const [k] of CFG_FIELDS) if (k in sv) CFG[k] = sv[k]; } catch (e) {}
  const SMALL = /iPhone|iPad|Android/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
  const badge = (() => { let b = document.getElementById('ro-badge'); if (!b) { b = document.createElement('div'); b.id = 'ro-badge'; b.style.cssText = SMALL ? 'position:fixed;left:6px;bottom:6px;z-index:2147483647;background:rgba(0,0,0,.7);color:#fff;font:bold 12px sans-serif;padding:6px 10px;border-radius:8px;border:1px solid #fff;max-width:60vw;cursor:pointer;user-select:none' : 'position:fixed;left:10px;bottom:10px;z-index:2147483647;background:rgba(0,0,0,.8);color:#fff;font:bold 22px sans-serif;padding:16px 24px;border-radius:14px;border:3px solid #fff;max-width:80vw;min-width:260px;cursor:pointer;user-select:none'; document.body.appendChild(b); } b.onclick = () => window.roToggle?.(); return b; })();
  const roHist = window.__roHist = window.__roHist || []; const log = (...a) => { if (CFG.log) console.log('[RO]', ...a); const d = new Date(); const msg = a.join(' ').slice(0, 60); if (!msg.startsWith('狀態：') || roHist[roHist.length - 1]?.slice(9) !== msg) { roHist.push(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0') + ' ' + msg); if (roHist.length > 40) roHist.shift(); } badge.textContent = 'RO自動：' + a.join(' ').slice(0, 40) + '（點我暫停）'; };
  const vis = (e) => e && e.offsetParent !== null;
  const findText = (txt, exact = true) => {
    const els = [...document.querySelectorAll('button, a, div, span, p, b, strong, label')]
      .filter(e => vis(e) && (exact ? e.textContent.trim() === txt : e.textContent.includes(txt)));
    return els.find(e => ![...e.children].some(c => c.textContent.includes(txt))) || els[0] || null;
  };
  const center = (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const cards = () => [...document.querySelectorAll('button.pk-card')].filter(vis);
  const area = (e) => { const r = e.getBoundingClientRect(); return r.width * r.height; };
  const allExact = (txt) => [...document.querySelectorAll('button, a, div, span')].filter(e => vis(e) && e.textContent.trim() === txt);
  const setVal = (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // ---- 防暫停 ----
  if (!window.__roNoPause) {
    window.__roNoPause = true;
    const block = (e) => { if (e.target === window || e.target === document) e.stopImmediatePropagation(); };
    ['blur', 'visibilitychange', 'webkitvisibilitychange', 'pagehide'].forEach(t => {
      window.addEventListener(t, block, true);
      document.addEventListener(t, block, true);
    });
    try {
      Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
      document.hasFocus = () => true;
    } catch (e) {}
  }
  clearInterval(window.__roResume);

  // ---- 調暗：dim(0.7) 變暗，dim(0) 恢復 ----
  window.dim = (v) => {
    let d = document.getElementById('ro-dim');
    if (!d) {
      d = document.createElement('div');
      d.id = 'ro-dim';
      d.style.cssText = 'position:fixed;inset:0;background:#000;pointer-events:none;z-index:2147483647';
      document.body.appendChild(d);
    }
    d.style.opacity = v;
    console.log('[RO] 亮度遮罩：' + v);
  };

  // ---- 按鍵 ----
  const KC = { ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ArrowLeft: 37, ' ': 32, Escape: 27, Enter: 13 };
  const mk = (type, k) => {
    const e = new KeyboardEvent(type, { key: k, code: k === ' ' ? 'Space' : k, bubbles: false, cancelable: true });
    Object.defineProperty(e, 'keyCode', { get: () => KC[k] });
    Object.defineProperty(e, 'which', { get: () => KC[k] });
    return e;
  };
  const send = (type, k) => new Set([window, document, document.body, document.activeElement, ...document.querySelectorAll('canvas')])
    .forEach(t => t && t.dispatchEvent(mk(type, k)));
  let held = [];
  const hold = (keys) => { held.filter(k => !keys.includes(k)).forEach(k => send('keyup', k)); keys.filter(k => !held.includes(k)).forEach(k => send('keydown', k)); held = keys; };
  const release = () => hold([]);
  const tap = (k) => { send('keydown', k); setTimeout(() => send('keyup', k), 80); };

  // ---- 選卡 ----
  const lines = (c) => c.innerText.split('\n').map(s => s.trim()).filter(Boolean);
  const hasName = (c, key) => lines(c).some(l => l === key || (l.length <= 12 && l.endsWith(key) && /[：:]/.test(l)));
  const score = (c) => {
    const t = c.innerText.replace(/\s+/g, ' ');
    let s = 0;
    for (const [k, v] of Object.entries(CFG.rarity)) if (t.includes(k)) s = Math.max(s, v);
    if (/新\s*[!！]/.test(t)) s += CFG.newSkillBonus;
    CFG.prefer.forEach((k, i) => { if (t.includes(k)) s += Math.max(CFG.preferBase - i * 20, 20); });
    CFG.avoid.forEach((k) => { if (t.includes(k)) s -= 500; });
    return { s, t };
  };
  let pickBusy = false, swapDone = false, banished = new Set(), focused = new Set();
  const nameHit = (c, key) => hasName(c, key) || lines(c).some(l => l.length <= 8 && l.includes(key));
  // 找某張卡片下方的「專注」小按鈕
  const actBtn = (card, word) => {
    // 用位置找：卡片正下方、水平位置最接近的「專注／放逐」按鈕
    const acts = [...document.querySelectorAll('.pk-acts')].filter(vis);
    const scope = (card.parentElement && card.parentElement.querySelectorAll('button.pk-card').length === 1 && card.parentElement.querySelector('.pk-acts')) || acts[cards().indexOf(card)];
    if (scope) { const els = [...scope.querySelectorAll('button, a, div, span')].filter(e => vis(e) && e.textContent.includes(word) && e.textContent.trim().length <= 8); const hit = els.find(e => e.tagName === 'BUTTON') || els.find(e => ![...e.children].some(c => c.textContent.includes(word))) || els[0]; if (hit) return hit.closest('button') || hit; }
    const cr = card.getBoundingClientRect(), cx = cr.x + cr.width / 2;
    const cands = [...document.querySelectorAll('button, a, div, span')].filter(e => vis(e) && !card.contains(e) && e.textContent.includes(word) && e.textContent.trim().length <= 8 && ![...e.children].some(c => c.textContent.includes(word) && c.tagName !== 'BUTTON'));
    const below = cands.filter(e => { const r = e.getBoundingClientRect(); return r.y >= cr.y + cr.height * 0.5; });
    const pool = below.length ? below : cands;
    pool.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return Math.abs(ra.x + ra.width / 2 - cx) - Math.abs(rb.x + rb.width / 2 - cx); });
    const best = pool[0];
    if (!best) return null;
    return best.closest('button') || best;
  };
  const doPick = () => {
    if (pickBusy) return;
    pickBusy = true;
    setTimeout(() => {
      const live = cards();
      if (live.length) {
        let ranked = live.map(c => ({ c, ...score(c) })).sort((a, b) => b.s - a.s); const ok = ranked.filter(r => !CFG.avoid.some(k => r.t.includes(k))); if (ok.length) ranked = ok;
        let pick = null, why = '分數最高';
        const isLevelUp = /Level\s*Up/i.test(document.body.innerText);
        if (!isLevelUp) for (const key of CFG.chestMust) { const hit = ranked.find(r => r.t.includes(key)); if (hit) { pick = hit; why = '寶箱優先：' + key; break; } }
        for (const name of CFG.banish || []) {
          if (banished.has(name)) continue;
          const hit = live.find(c => nameHit(c, name));
          if (!hit) continue;
          const bb = actBtn(hit, '放逐');
          if (bb) { banished.add(name); log('放逐：' + name); bb.click(); setTimeout(() => { pickBusy = false; }, 1200); return; }
          log('找不到 ' + name + ' 的放逐按鈕');
        }
        for (const key of [].concat(CFG.focusOn || [])) {
          if (focused.has(key)) continue;
          const sw = ranked.find(r => nameHit(r.c, key));
          if (!sw) continue;
          const fb = actBtn(sw.c, '專注');
          if (fb) { focused.add(key); log(key + ' 首次出現：點 專注'); fb.click(); setTimeout(() => { pickBusy = false; }, 1200); return; }
          log('找不到 ' + key + ' 的專注按鈕，照常選卡');
        }
        if (!pick) for (const key of CFG.must) { const hit = ranked.find(r => hasName(r.c, key)); if (hit) { pick = hit; why = '優先技能：' + key; break; } }
        pick = pick || ranked[0];
        log('選卡 →', why, '｜', pick.t.slice(0, 30));
        pick.c.click();
      }
      setTimeout(() => { pickBusy = false; }, 400);
    }, 600);
  };

  // ---- 主迴圈 ----
  // ---- 撿紫光／金光掉落 ----
  const lootOff = document.createElement('canvas'); const lootCtx = lootOff.getContext('2d', { willReadFrequently: true });
  let lootLast = null, lootRes = null, lootBusy = false, lastLootScan = 0, lootStart = 0, lootIgnore = 0, lootUntil = 0;
  const scanLoot = () => {
    if (lootBusy) return; lootBusy = true;
    requestAnimationFrame(() => {
      lootBusy = false; lastLootScan = Date.now();
      const cv = document.querySelector('canvas.world3d') || document.querySelector('canvas'); if (!cv) { lootRes = null; return; }
      const r = cv.getBoundingClientRect(), SC = 3, w = Math.max(1, Math.round(r.width / SC)), h = Math.max(1, Math.round(r.height / SC));
      lootOff.width = w; lootOff.height = h;
      try { lootCtx.drawImage(cv, 0, 0, w, h); } catch (e) { lootRes = null; return; }
      const d = lootCtx.getImageData(0, 0, w, h).data, cells = new Map();
      const wantP = (CFG.loot || []).includes('紫'), wantG = (CFG.loot || []).includes('金');
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2];
        const isP = wantP && B - G >= 35 && R - G >= 15 && B >= R - 15 && B >= 95 && R >= 60;
        const isG = wantG && R >= 140 && R - G >= 30 && R - G <= 75 && G - B >= 30 && B <= 95;
        if (!isP && !isG) continue;
        const key = ((x / 2) | 0) + ',' + ((y / 2) | 0);
        const c = cells.get(key) || { n: 0, x: 0, y: 0, x0: x, x1: x, y0: y, y1: y, g: 0 };
        c.n++; c.x += x; c.y += y; if (isG) c.g++; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y; cells.set(key, c);
      }
      const seen = new Set(), cx = w / 2, cy = h / 2; let best = null, bd = 1e9;
      for (const [key] of cells) {
        if (seen.has(key)) continue; seen.add(key);
        const b = { n: 0, x: 0, y: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1, g: 0 }, st = [key];
        while (st.length) {
          const kk = st.pop(), c = cells.get(kk);
          b.n += c.n; b.x += c.x; b.y += c.y; b.g += c.g; b.x0 = Math.min(b.x0, c.x0); b.x1 = Math.max(b.x1, c.x1); b.y0 = Math.min(b.y0, c.y0); b.y1 = Math.max(b.y1, c.y1);
          const [gx, gy] = kk.split(',').map(Number);
          for (let ax = -1; ax <= 1; ax++) for (let ay = -1; ay <= 1; ay++) { const nk = (gx + ax) + ',' + (gy + ay); if (!seen.has(nk) && cells.has(nk)) { seen.add(nk); st.push(nk); } }
        }
        if (b.n < 25 || b.n > 500) continue;   // 太小是雜點，太大是技能特效
        const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
        if (bh < bw * 1.2) continue;   // 光柱是直的，數字、圖示不算
        const x = b.x / b.n, y = b.y1 - 2, dx = (x - cx) * SC, dy = (y - cy) * SC, dd = Math.hypot(dx, dy);
        if (dd < 70) continue;   // 角色自己
        const sc = dd - (b.g > b.n / 2 ? 300 : 0);   // 金光優先
        if (sc < bd) { bd = sc; best = { dx, dy, dd, gold: b.g > b.n / 2, sx: r.x + x * SC, sy: r.y + y * SC }; }
      }
      lootRes = best; window.__roLoot = best;
    });
  };
  let lastSpeed = 0, lastPick = 0, pickTries = 0, acceptTries = 0; let state = '', circleI = 0, lastCircle = 0, lastAct = 0, walkStart = 0, randUntil = 0;
  const setState = (s) => { if (s !== state) { state = s; log('狀態：' + s); } };
  let paused = false;
  window.roToggle = () => {
    paused = !paused;
    if (paused) { release(); badge.textContent = 'RO自動：已暫停（點我繼續）'; }
    else { state = ''; log('繼續執行'); }
  };
  // ---- 右下角 ESC 按鈕：先暫停腳本，再送出 Esc ----
  (() => {
    let e = document.getElementById('ro-esc');
    if (!e) {
      e = document.createElement('div');
      e.id = 'ro-esc';
      e.textContent = 'ESC';
      e.style.cssText = SMALL ? 'position:fixed;right:6px;bottom:6px;z-index:2147483647;background:rgba(180,30,30,.85);color:#fff;font:bold 13px sans-serif;padding:7px 12px;border-radius:8px;border:1px solid #fff;cursor:pointer;user-select:none' : 'position:fixed;right:10px;bottom:10px;z-index:2147483647;background:rgba(180,30,30,.9);color:#fff;font:bold 26px sans-serif;padding:18px 34px;border-radius:14px;border:3px solid #fff;cursor:pointer;user-select:none';
      document.body.appendChild(e);
    }
    e.onclick = () => {
      paused = true; release();
      badge.textContent = 'RO自動：已暫停（點我繼續）';
      tap('Escape');
    };
  })();
  // ---- 右下角 F5 按鈕：重新整理網頁 ----
  (() => {
    let e = document.getElementById('ro-f5');
    if (!e) {
      e = document.createElement('div');
      e.id = 'ro-f5';
      e.textContent = 'F5';
      e.style.cssText = SMALL ? 'position:fixed;right:6px;bottom:44px;z-index:2147483647;background:rgba(30,90,200,.85);color:#fff;font:bold 13px sans-serif;padding:7px 15px;border-radius:8px;border:1px solid #fff;cursor:pointer;user-select:none' : 'position:fixed;right:10px;bottom:110px;z-index:2147483647;background:rgba(30,90,200,.9);color:#fff;font:bold 26px sans-serif;padding:18px 40px;border-radius:14px;border:3px solid #fff;cursor:pointer;user-select:none';
      document.body.appendChild(e);
    }
    e.onclick = () => { release(); location.reload(); };
  })();
  (() => {
    let g = document.getElementById('ro-cfgbtn');
    if (!g) {
      g = document.createElement('div');
      g.id = 'ro-cfgbtn';
      g.textContent = '⚙ 設定';
      g.style.cssText = SMALL ? 'position:fixed;right:6px;bottom:82px;z-index:2147483647;background:rgba(60,60,60,.85);color:#fff;font:bold 13px sans-serif;padding:7px 10px;border-radius:8px;border:1px solid #fff;cursor:pointer;user-select:none' : 'position:fixed;right:10px;bottom:210px;z-index:2147483647;background:rgba(60,60,60,.9);color:#fff;font:bold 24px sans-serif;padding:16px 22px;border-radius:14px;border:3px solid #fff;cursor:pointer;user-select:none';
      document.body.appendChild(g);
    }
    g.onclick = () => {
      let p = document.getElementById('ro-cfgpanel');
      if (p) { p.remove(); return; }
      const wasPaused = paused; paused = true; release();
      p = document.createElement('div');
      p.id = 'ro-cfgpanel';
      const fs = SMALL ? 15 : 22;
      p.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483647;background:#fff;color:#222;font:' + fs + 'px sans-serif;padding:' + (SMALL ? 12 : 24) + 'px;border-radius:12px;border:3px solid #346;box-shadow:0 6px 30px rgba(0,0,0,.5);width:' + (SMALL ? '92vw' : 'min(760px,90vw)') + ';max-height:88vh;overflow:auto;box-sizing:border-box';
      ['keydown', 'keyup', 'keypress'].forEach(t => p.addEventListener(t, e => e.stopPropagation()));
      const title = document.createElement('div');
      title.textContent = 'RO 自動設定（' + CFG.charName + '）版本 2026-11-22b'; title.style.cssText = 'font-weight:bold;font-size:1.15em;margin-bottom:10px';
      p.appendChild(title);
      const inputs = {};
      for (const [k, label, type] of CFG_FIELDS) {
        const row = document.createElement('label');
        row.style.cssText = 'display:block;margin:8px 0';
        const t = document.createElement('div'); t.textContent = label; t.style.cssText = 'font-weight:bold;margin-bottom:3px';
        const inp = document.createElement('input');
        if (type === 'bool') { inp.type = 'checkbox'; inp.checked = !!CFG[k]; inp.style.cssText = 'width:' + fs + 'px;height:' + fs + 'px;vertical-align:middle;margin-right:8px'; row.appendChild(inp); t.style.display = 'inline'; row.appendChild(t); }
        else { inp.type = type === 'num' ? 'number' : 'text'; inp.value = type === 'list' ? (CFG[k] || []).join('，') : CFG[k]; inp.style.cssText = 'width:100%;box-sizing:border-box;font-size:' + fs + 'px;padding:6px;border:1px solid #888;border-radius:6px'; row.appendChild(t); row.appendChild(inp); }
        inputs[k] = [inp, type];
        p.appendChild(row);
      }
      const hist = document.createElement('div'); hist.style.cssText = 'margin:10px 0;padding:8px;background:#f3f3f3;border-radius:8px;font:' + (SMALL ? 11 : 15) + 'px monospace;max-height:30vh;overflow:auto;white-space:pre-wrap'; hist.textContent = '最近紀錄：\n' + (roHist.slice(-25).reverse().join('\n') || '（還沒有）'); p.appendChild(hist);
      const tip = document.createElement('div'); tip.textContent = '清單用逗號隔開，前面的優先。'; tip.style.cssText = 'color:#666;font-size:.8em;margin:6px 0 10px';
      p.appendChild(tip);
      const close = () => { p.remove(); paused = wasPaused; if (!paused) { state = ''; log('繼續執行'); } else badge.textContent = 'RO自動：已暫停（點我繼續）'; };
      const btn = (txt, bg, fn) => { const b = document.createElement('button'); b.textContent = txt; b.style.cssText = 'font:bold ' + fs + 'px sans-serif;padding:8px 16px;margin:4px 8px 0 0;border:0;border-radius:8px;color:#fff;background:' + bg + ';cursor:pointer'; b.onclick = fn; p.appendChild(b); };
      btn('儲存', '#2a7', () => {
        const out = {};
        for (const k in inputs) {
          const [inp, type] = inputs[k];
          out[k] = type === 'bool' ? inp.checked : type === 'num' ? (Number(inp.value) || 0) : type === 'list' ? inp.value.split(/[,，、\s]+/).filter(Boolean) : inp.value.trim();
        }
        Object.assign(CFG, out);
        try { localStorage.setItem(CFG_KEY, JSON.stringify(out)); } catch (e) {}
        close(); log('設定已儲存');
      });
      btn('取消', '#888', close);
      btn('恢復預設', '#c44', () => { try { localStorage.removeItem(CFG_KEY); } catch (e) {} location.reload(); });
      document.body.appendChild(p);
    };
  })();
  const loop = () => {
    if (paused) return;
    const now = Date.now();
    if (cards().length) { release(); setState('選卡'); doPick(); return; }
    // 斷線重登後的「未完成的一局」→ 點 繼續
    // 打完最後一關跳「未完待續」→ 點接受
    if (findText('未完待續', false) || findText('冒險的終點', false)) {
      release(); setState('未完待續');
      const ok = [...document.querySelectorAll('button, a, div, span')].filter(e => vis(e) && e.textContent.trim() === '接受').sort((a, b) => area(a) - area(b))[0];
      if (ok && now - lastAct > 1500) {
        lastAct = now; acceptTries++;
        const r = ok.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
        const top = document.elementFromPoint(x, y) || ok;
        log('點 接受（未完待續）第 ' + acceptTries + ' 次');
        const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true };
        for (const t of new Set([top, ok, ok.closest('button')].filter(Boolean))) {
          t.dispatchEvent(new PointerEvent('pointerover', o)); t.dispatchEvent(new PointerEvent('pointerdown', o)); t.dispatchEvent(new MouseEvent('mousedown', o));
          t.dispatchEvent(new PointerEvent('pointerup', o)); t.dispatchEvent(new MouseEvent('mouseup', o)); t.click();
        }
        if (acceptTries >= 3) { tap('Enter'); tap(' '); }
        if (acceptTries >= 6) { log('接受沒反應，重新整理'); acceptTries = 0; setTimeout(() => location.reload(), 500); }
      }
      return;
    }
    if (findText('未完成的一局', false) || findText('尚未結束的一局', false) || findText('離開了一局', false)) {
      release(); setState('未完成的一局');
      const cont = allExact('繼續').sort((a, b) => area(b) - area(a))[0];
      if (cont && now - lastAct > 1500) { lastAct = now; log('點 繼續（未完成的一局）'); cont.click(); }
      return;
    }
    // 選擇伺服器 → 點 米德加德
    if (CFG.server && !findText('擺攤') && !findText('遠征隊長') && !findText('和船長說話', false) && findText('伺服器', false) && findText(CFG.server, false)) {
      release(); setState('選擇伺服器');
      if (now - lastAct > 2500) {
        lastAct = now;
        const sv = findText(CFG.server, false);
        log('選伺服器', CFG.server); sv.click();
        setTimeout(() => {
          const ok = ['進入', '確定', '連線', '選擇', '開始'].map(t => allExact(t).sort((a, b) => area(b) - area(a))[0]).find(Boolean);
          if (ok) { log('點', ok.textContent.trim()); ok.click(); }
        }, 700);
      }
      return;
    }
    // 已登入的首頁：「進入遊戲！」按鈕
    const enterGame = [...document.querySelectorAll('button, a, div, span')].filter(e => vis(e) && /^進入遊戲\s*[!！]?$/.test(e.textContent.trim())).sort((a, b) => area(b) - area(a))[0];
    if (enterGame) { release(); setState('首頁'); if (now - lastAct > 3000) { lastAct = now; log('點 進入遊戲'); enterGame.click(); } return; }
    const resume = findText('繼續');
    if (resume && findText('暫停')) { release(); setState('暫停選單'); if (now - lastAct > 1000) { lastAct = now; log('點 繼續'); resume.click(); } return; }
    // 登入畫面：填帳密 → 點大的「進入」按鈕
    const pw = [...document.querySelectorAll('input[type=password]')].find(vis);
    if (pw) {
      release(); setState('登入畫面');
      if (now - lastAct > 4000) {
        lastAct = now;
        const user = [...document.querySelectorAll('input')].find(e => vis(e) && e !== pw && !['hidden', 'checkbox', 'radio', 'password'].includes(e.type));
        if (user) setVal(user, CFG.user);
        setVal(pw, CFG.pass);
        setTimeout(() => {
          const names = ['進入', '登入', '進入遊戲', '登錄', '登入遊戲', '確定', 'Login', 'LOGIN', '開始'];
          let btn = null;
          for (const n of names) { btn = allExact(n).sort((a, b) => area(b) - area(a))[0]; if (btn) break; }
          if (!btn) btn = [...document.querySelectorAll('button, input[type=submit]')].filter(vis).sort((a, b) => area(b) - area(a))[0];
          if (btn) { log('登入：點 ' + (btn.textContent.trim() || btn.value || '按鈕')); btn.click(); }
          else if (pw.form) { log('登入：送出表單'); pw.form.requestSubmit ? pw.form.requestSubmit() : pw.form.submit(); }
          else { log('登入：按 Enter'); pw.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); }
        }, 600);
      }
      return;
    }
    // 登入畫面但停在「訪客」或「建立帳號」分頁 → 切到「進入」分頁
    if (findText('訪客') && findText('建立帳號')) {
      release(); setState('登入畫面（切分頁）');
      if (now - lastAct > 2000) { lastAct = now; const tab = allExact('進入').sort((a, b) => area(a) - area(b))[0]; if (tab) { log('切到 進入 分頁'); tab.click(); } }
      return;
    }
    // 角色選擇 → 選角色 → 開始遊戲
    const start = findText('開始遊戲');
    if (start) {
      release(); setState('角色選擇');
      if (now - lastAct > 3000) {
        lastAct = now;
        const card = [...document.querySelectorAll('div, button, li, a')].filter(e => vis(e) && e.textContent.includes(CFG.charName) && /Base\s*Lv/i.test(e.textContent) && (e.textContent.match(/Base\s*Lv/gi) || []).length === 1).sort((a, b) => area(b) - area(a))[0]; const ch = card || findText(CFG.charName, false); if (ch) { log('選角色', CFG.charName); ['pointerdown', 'mousedown', 'pointerup', 'mouseup'].forEach(t => ch.dispatchEvent(new MouseEvent(t, { bubbles: true }))); ch.click(); setTimeout(() => { log('點 開始遊戲'); start.click(); }, 1200); } else log('找不到角色', CFG.charName);
      }
      return;
    }

    const back = findText('返回角色') || findText('回到角色');
    if (back) { release(); setState('結算'); if (now - lastAct > 1500) { lastAct = now; pickTries = 0; log('點 回到角色'); swapDone = false; banished.clear(); focused.clear(); back.click(); } return; }
    const enter = [...document.querySelectorAll('button, a, div, span')].find(b => vis(b) && /^[✔✓\s]*入場$/.test(b.textContent.trim()));
    if (enter) { release(); setState('高難度提醒'); if (now - lastAct > 1500) { lastAct = now; log('點 入場'); enter.click(); } return; }
    const field = findText('前往野外');
    if (field) { release(); setState('難度視窗'); if (now - lastAct > 1500) { lastAct = now; log('點 前往野外'); field.click(); } return; }
    // 「選擇大廳」視窗 → 點設定裡的大廳
    if (findText('選擇大廳')) {
      release(); setState('選擇大廳');
      if (now - lastAct > 2000) {
        lastAct = now;
        const want = CFG.lobby;
        const el = want && [...document.querySelectorAll('button, li, a, div, span')].filter(e => vis(e) && e.textContent.includes(want) && e.textContent.trim().length <= 30).sort((a, b) => area(a) - area(b))[0];
        if (el) { log('選大廳 ' + want); (el.closest('button, li, a, [role=button]') || el).click(); }
        else log('找不到大廳 ' + want + '，請在 ⚙ 設定填「大廳」');
      }
      return;
    }
    // 遠征視窗開著但沒有「出發」（例如右邊停在劇情）→ 先點地圖
    if (findText('你的裝備評分', false) && !findText('出發') && !findText('選擇大廳')) {
      release(); setState('遠征視窗：選地圖');
      if (now - lastAct > 1500) { lastAct = now; const m = CFG.map && findText(CFG.map); if (m) { log('選地圖', CFG.map); m.click(); } else log('找不到地圖 ' + CFG.map); }
      return;
    }
    const go = findText('出發');
    if (go) {
      release(); setState('遠征視窗');
      if (now - lastAct > 1500) {
        lastAct = now;
        if (CFG.map) { const m = findText(CFG.map); if (m) { m.click(); log('選地圖', CFG.map); } }
        setTimeout(() => { log('點 出發'); go.click(); }, 500);
      }
      return;
    }
    const talk = findText('與隊長交談', false) || findText('和船長說話', false) || findText('船長說話', false);
    if (talk) { release(); setState('與隊長交談'); if (now - lastAct > 1500) { lastAct = now; log('與船長／隊長對話'); tap(' '); talk.click(); } return; }
    const npc = findText('遠征隊長');
    if (npc) {
      setState('走向遠征隊長');
      if (!walkStart) walkStart = now;
      const cv = document.querySelector('canvas.world3d') || document.querySelector('canvas');
      const me = cv ? center(cv) : { x: innerWidth / 2, y: innerHeight / 2 };
      const t = center(npc); t.y += 60;
      const dx = t.x - me.x, dy = t.y - me.y, th = 25;
      const keys = [];
      if (dy < -th) keys.push('ArrowUp'); if (dy > th) keys.push('ArrowDown');
      if (dx < -th) keys.push('ArrowLeft'); if (dx > th) keys.push('ArrowRight');
      if (now < randUntil) return;
      if (now - walkStart > 8000) { walkStart = now; randUntil = now + 1000; const r = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][Math.floor(Math.random() * 4)]; log('好像卡住，亂走一下'); hold([r]); return; }
      hold(keys.length ? keys : ['ArrowUp']);
      return;
    }
    walkStart = 0;
    if (findText('擺攤')) { setState('城鎮：找不到遠征隊長'); release(); return; }
    if (CFG.pickup && now - lastPick > 1200 && pickTries < 10) { const pb = [...document.querySelectorAll('button, div, span')].filter(e => vis(e) && /^撿取\s*[：:]/.test(e.textContent.trim()) && e.textContent.trim().length <= 12).sort((a, b) => area(a) - area(b))[0]; if (pb && !pb.textContent.includes(CFG.pickup)) { lastPick = now; pickTries++; log('撿取切換 → ' + CFG.pickup); (pb.closest('button') || pb).click(); } else if (pb) pickTries = 0; } if (CFG.speed && now - lastSpeed > 2000) {
      const sp = allExact('1x')[0];
      if (sp) { lastSpeed = now; log('切換速度 1x → 2x'); sp.click(); }
    }
    if (!CFG.circle) { release(); setState('地圖中：站著不動'); return; }
    setState('地圖中：繞圈');
    if ((CFG.loot || []).length) {
      if (now - lastLootScan > 300) scanLoot();
      if (now < lootUntil) { setState('撿掉落'); if (now > lootUntil - 400) release(); return; }
      const lt = lootRes;
      if (!lt && lootStart && lootLast && lootLast.dd < 140) { lootUntil = now + 900; lootIgnore = lootUntil + 1500; lootStart = 0; lootLast = null; return; }   // 已經走到旁邊（光柱跟角色重疊），再往前一點撿起來
      if (lt && now > lootIgnore) {
        lootLast = lt; if (!lootStart) { lootStart = now; log('看到' + (lt.gold ? '金光' : '紫光') + '，過去撿'); }
        if (typeof chestMark === 'function') chestMark(lt);
        if (lt.dd < 90) { lootUntil = now + 900; lootIgnore = lootUntil + 1500; lootStart = 0; lootRes = null; return; }
        if (now - lootStart > 7000) { lootIgnore = now + 5000; lootStart = 0; log('撿不到，先放棄'); }
        else { setState('跑去撿掉落'); const k = []; if (lt.dy < -12) k.push('ArrowUp'); if (lt.dy > 12) k.push('ArrowDown'); if (lt.dx < -12) k.push('ArrowLeft'); if (lt.dx > 12) k.push('ArrowRight'); hold(k); return; }
      } else lootStart = 0;
    }
    if (now - lastCircle >= CFG.stepMs) {
      lastCircle = now;
      const U = 'ArrowUp', R = 'ArrowRight', D = 'ArrowDown', L = 'ArrowLeft';
      const dirs = [[U], [U, R], [R], [R, D], [D], [D, L], [L], [L, U]];
      hold(dirs[circleI]); circleI = (circleI + 1) % 8;
      if (CFG.holdMs && CFG.holdMs < CFG.stepMs) setTimeout(() => { if (state === '地圖中：繞圈') release(); }, CFG.holdMs);
    }
  };
  const timer = setInterval(loop, 200);
  window.stopAll = () => { clearInterval(timer); release(); delete window.stopAll; console.log('[RO] 全部停止'); badge.textContent = 'RO自動：已停止'; };
  log('版本 2026-11-22b 已啟動'); console.log('[RO] 全自動已啟動（選卡＋繞圈＋自動再出發＋防暫停）。stopAll() 停止，dim(0.7) 調暗，dim(0) 恢復');
})();

