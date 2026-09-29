/* =========================================================
   Crowd.Connect · "Derselbe Abend. Zweimal."
   Scroll story engine: HUD, clover lens, receipt → rewind →
   portal, world blooms, live demos, dashboard pour.
   Works without GSAP (static fallback) and with reduced motion.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  var ease3 = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut3 = function (t) { return 1 - Math.pow(1 - t, 3); };
  var linear = function (t) { return t; };
  var vh = function () { return window.innerHeight; };
  var docTop = function (el) { return el.getBoundingClientRect().top + window.scrollY; };
  var eur = function (v, dec) { dec = dec || 0; return v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €'; };
  var hhmm = function (m) { m = ((Math.round(m) % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; };

  var root = document.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGE_Q = '(min-width: 960px) and (min-height: 600px)';
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var ANIM = hasGSAP && !REDUCED;
  var MODE = window.matchMedia(STAGE_Q).matches ? 'stage' : 'flow';
  var ST = { worlds: {} };

  root.classList.remove('no-js');
  root.classList.add('js', ANIM ? 'anim' : 'no-anim');
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  function tween(duration, update, done, easeFn) {
    easeFn = easeFn || ease3;
    var t0 = performance.now();
    function step(now) {
      var raw = clamp((now - t0) / duration);
      update(easeFn(raw), raw);
      if (raw < 1) requestAnimationFrame(step); else if (done) done();
    }
    requestAnimationFrame(step);
  }
  function onVisible(el, cb, opts) {
    opts = opts || {};
    if (!el) return null;
    if (!('IntersectionObserver' in window)) { cb(true); return null; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        cb(e.isIntersecting, e);
        if (e.isIntersecting && opts.once) io.disconnect();
      });
    }, { threshold: opts.threshold === undefined ? 0.15 : opts.threshold, rootMargin: opts.rootMargin || '0px' });
    io.observe(el);
    return io;
  }
  function onRefreshInit(fn) { if (hasGSAP) ScrollTrigger.addEventListener('refreshInit', fn); window.addEventListener('resize', fn); }

  /* ---------- clover geometry ---------- */
  // Union of four disks shaped like the Crowd.Connect clover. R = half the clover width in px.
  function cloverMask(x, y, R, f) {
    if (R < 0.5) return 'radial-gradient(circle at -9999px -9999px, #000 0, transparent 0)';
    f = f === undefined ? 1.5 : f;
    var d = 0.465 * R, r = 0.515 * R, ff = Math.min(f, r * 0.5);
    var g = function (cx, cy) {
      return 'radial-gradient(circle at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px, #000 ' + (r - ff).toFixed(1) + 'px, transparent ' + r.toFixed(1) + 'px)';
    };
    return g(x, y - d) + ',' + g(x - d, y) + ',' + g(x + d, y) + ',' + g(x, y + d);
  }
  function setMask(el, v) { el.style.webkitMaskImage = v; el.style.maskImage = v; }
  function placeRim(rim, x, y, R, px) {
    var s = Math.max(2 * R, 1) / 100;
    rim.style.transform = 'translate3d(' + (x - R).toFixed(1) + 'px,' + (y - R).toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
    rim.style.strokeWidth = ((px || 2.2) / s).toFixed(3);
  }
  // Map a normalized image coordinate to element px for object-fit: cover images.
  function imgPoint(img, u, v) {
    var W = img.clientWidth || img.parentNode.clientWidth, H = img.clientHeight || img.parentNode.clientHeight;
    var iw = img.naturalWidth || 1920, ih = img.naturalHeight || 1072;
    var s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
    var pos = (getComputedStyle(img).objectPosition || '50% 50%').split(' ');
    var px = isNaN(parseFloat(pos[0])) ? 0.5 : parseFloat(pos[0]) / 100;
    var py = isNaN(parseFloat(pos[1])) ? 0.5 : parseFloat(pos[1]) / 100;
    var ox = (W - dw) * px, oy = (H - dh) * py;
    return { x: ox + u * dw, y: oy + v * dh, W: W, H: H };
  }
  function farCorner(x, y, W, H) { return Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)); }

  /* ---------- load-in ---------- */
  var loaded = false;
  function markLoaded() { if (loaded) return; loaded = true; root.classList.add('is-loaded'); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(markLoaded); });
  setTimeout(markLoaded, 900);

  /* =========================================================
     HUD · the night ticker
     ========================================================= */
  var C = { dim: '#6F788A', mint: '#2BC896', amber: '#FFB547', pitch: '#3DDC84', pink: '#FF3B7A', violet: '#C45BFF' };
  var A1 = { head: 2, item: function (i) { return [7 + i * 7.5, 12 + i * 7.5]; }, foot: 52, tear: 57, rw: 64 };
  var RW_TOTAL = 48;
  var A1_TOTAL = A1.rw + RW_TOTAL;

  var HUD = (function () {
    var el = $('[data-hud]');
    var noop = { build: function () {}, update: function () {}, bonus: function () {}, setTitle: function () {}, getBonus: function () { return 0; } };
    if (!el) return noop;
    var tEl = $('.hud__time', el), dEl = $('.hud__day', el), rEl = $('.hud__rev', el), tbEl = $('.hud__tables', el), ttlEl = $('.hud__title', el);
    var bars = $$('.hud__mood i', el), popBox = $('.hud__pops', el);
    var frames = [], bonus = 0, customTitle = '', mood = 0.1, hidden = true, last = {}, bonusFrom = Infinity, bonusTo = Infinity;

    function base(o) { var b = { day: 'FR', title: 'Wie heute', live: false, accent: C.dim, hidden: false }; for (var k in o) b[k] = o[k]; return b; }
    function live(o) { var b = { day: 'FR', title: 'Mit Crowd.Connect', live: true, accent: C.mint, hidden: false }; for (var k in o) b[k] = o[k]; return b; }

    function buildFrames() {
      var F = [], H = vh();
      var add = function (y, s) { s.y = y; F.push(s); };
      var hero = $('#stille'), act = $('#bon'), tv = $('#tv'), events = $('#events'), regs = $('#stammgaeste');
      var dash = $('#zahlen'), day = $('#morgen'), fin = $('#pilot'), foot = $('.footer');
      var times = [1274, 1367, 1389, 1471, 1574, 1574], revs = [640, 1080, 1220, 1690, 2240, 2240], tabs = [6, 7, 5, 4, 3, 3], moods = [0.12, 0.1, 0.08, 0.07, 0.05, 0.05];

      add(0, base({ t: 1274, rev: 640, tables: 6, mood: 0.12, hidden: true }));
      add(hero.offsetHeight * 0.42, base({ t: 1274, rev: 640, tables: 6, mood: 0.12 }));

      if (MODE === 'stage' && ST.act1) {
        var s0 = ST.act1.start, len = ST.act1.end - ST.act1.start;
        var at = function (u) { return s0 + len * u / A1_TOTAL; };
        add(s0, base({ t: 1274, rev: 640, tables: 6, mood: 0.12 }));
        for (var i = 0; i < 6; i++) add(at(A1.item(i)[1]), base({ t: times[i], rev: revs[i], tables: tabs[i], mood: moods[i] }));
        add(at(A1.rw), base({ t: 1574, rev: 2240, tables: 3, mood: 0.05, title: 'Zurückspulen', accent: C.pink }));
        add(at(A1.rw + 14), base({ t: 1140, rev: 0, tables: 2, mood: 0.08, title: 'Zurückspulen', accent: C.pink }));
        add(at(A1.rw + 20), live({ t: 1140, rev: 0, tables: 2, mood: 0.2 }));
        add(at(A1.rw + 33), live({ t: 1140, rev: 0, tables: 4, mood: 0.35 }));
        add(ST.act1.end, live({ t: 1146, rev: 30, tables: 6, mood: 0.45 }));
        bonusFrom = at(A1.rw + 30);
      } else {
        $$('.ri', act).forEach(function (it, i) { add(docTop(it) - H * 0.6, base({ t: times[i], rev: revs[i], tables: tabs[i], mood: moods[i] })); });
        if (ST.rewind) {
          var r0 = ST.rewind.start, rl = ST.rewind.end - r0;
          var rat = function (u) { return r0 + rl * u / RW_TOTAL; };
          add(r0, base({ t: 1574, rev: 2240, tables: 3, mood: 0.05, title: 'Zurückspulen', accent: C.pink }));
          add(rat(14), base({ t: 1140, rev: 0, tables: 2, mood: 0.08, title: 'Zurückspulen', accent: C.pink }));
          add(rat(20), live({ t: 1140, rev: 0, tables: 2, mood: 0.2 }));
          add(rat(33), live({ t: 1140, rev: 0, tables: 4, mood: 0.35 }));
          add(ST.rewind.end, live({ t: 1146, rev: 30, tables: 6, mood: 0.45 }));
          bonusFrom = rat(30);
        } else {
          var rw = $('.rewind', act);
          add(docTop(rw) - H * 0.3, base({ t: 1574, rev: 2240, tables: 3, mood: 0.05 }));
          add(docTop(rw) + H * 0.4, live({ t: 1146, rev: 30, tables: 6, mood: 0.45 }));
          bonusFrom = docTop(rw);
        }
      }


      var worlds = [
        ['restaurant', { t: 1170, rev: 120, tables: 8, mood: 0.5 }, { t: 1230, rev: 520, tables: 11, mood: 0.55 }, C.amber],
        ['sportsbar', { t: 1308, rev: 980, tables: 14, mood: 0.7 }, { t: 1322, rev: 1190, tables: 15, mood: 0.75 }, C.pitch],
        ['bar', { t: 1367, rev: 1480, tables: 14, mood: 0.8 }, { t: 1395, rev: 1700, tables: 16, mood: 0.85 }, C.pink],
        ['club', { t: 1470, rev: 2190, tables: 17, mood: 0.95 }, { t: 1530, rev: 2560, tables: 18, mood: 1 }, C.violet]
      ];
      worlds.forEach(function (w) {
        var sec = document.getElementById(w[0]); if (!sec) return;
        var st = ST.worlds[w[0]];
        var y0 = st ? st.start : docTop(sec) - H * 0.35;
        var y1 = st ? st.end : docTop(sec) + sec.offsetHeight - H * 0.6;
        w[1].accent = w[3]; w[2].accent = w[3];
        add(y0, live(w[1]));
        add(Math.max(y1, y0 + 1), live(w[2]));
        if (w[0] === 'sportsbar' && tv) add(docTop(tv) - H * 0.4, live({ t: 1335, rev: 1300, tables: 15, mood: 0.75, accent: C.mint }));
      });
      if (events) add(docTop(events) - H * 0.5, live({ t: 1560, rev: 2700, tables: 16, mood: 0.85 }));
      var dy = ST.dash ? ST.dash.start : docTop(dash) - H * 0.35;
      add(dy, live({ t: 1620, rev: 2847, tables: 0, mood: 0.25, title: 'Kasse zu' }));
      if (regs) add(docTop(regs) - H * 0.4, live({ t: 1650, rev: 2847, tables: 0, mood: 0.2, title: 'Kasse zu', hidden: true }));
      var dayY = docTop(day) - H * 0.25;
      add(dayY, { t: 1980, rev: 2847, tables: 0, mood: 0.1, day: 'SA', title: 'Der Morgen danach', live: false, accent: C.mint, hidden: true });
      bonusTo = dayY;
      add(docTop(fin) - H * 0.5, { jump: true, t: 1274, rev: 0, tables: 0, mood: 0.2, day: 'FR', title: '@custom', live: true, accent: C.pink, hidden: false });
      add(docTop(foot) - H * 0.75, { jump: true, t: 1274, rev: 0, tables: 0, mood: 0.2, day: 'FR', title: '@custom', live: true, accent: C.pink, hidden: true });

      F.sort(function (a, b) { return a.y - b.y; });
      return F;
    }

    function stateAt(y) {
      var i = 0;
      while (i < frames.length - 1 && frames[i + 1].y <= y) i++;
      var a = frames[i], b = frames[i + 1];
      if (!b || b.jump || y <= a.y) return a;
      var t = clamp((y - a.y) / Math.max(1, b.y - a.y));
      return { t: lerp(a.t, b.t, t), rev: lerp(a.rev, b.rev, t), tables: lerp(a.tables, b.tables, t), mood: lerp(a.mood, b.mood, t), day: a.day, title: a.title, live: a.live, accent: a.accent, hidden: a.hidden };
    }

    function update() {
      if (!frames.length) return;
      var y = window.scrollY, s = stateAt(y);
      if (s.hidden !== last.hidden) { el.classList.toggle('is-hidden', !!s.hidden); last.hidden = s.hidden; }
      hidden = !!s.hidden;
      if (s.live !== last.live) { el.classList.toggle('is-live', !!s.live); last.live = s.live; }
      if (s.accent !== last.accent) { root.style.setProperty('--hud-accent', s.accent); last.accent = s.accent; }
      var time = hhmm(s.t); if (time !== last.time) { tEl.textContent = time; last.time = time; }
      if (s.day !== last.day) { dEl.textContent = s.day; last.day = s.day; }
      var title = s.title === '@custom' ? (customTitle || 'Deine Location') : s.title;
      if (title !== last.title) { ttlEl.textContent = title; last.title = title; }
      var b = (y >= bonusFrom && y < bonusTo) ? bonus : 0;
      var rev = eur(Math.round(s.rev + b)); if (rev !== last.rev) { rEl.textContent = rev; last.rev = rev; }
      var tb = Math.round(s.tables) + '/18'; if (tb !== last.tb) { tbEl.textContent = tb; last.tb = tb; }
      mood = s.mood;
    }

    // mood equalizer
    var t0 = performance.now();
    function moodLoop(now) {
      if (!hidden) {
        var k = (now - t0) / 1000;
        for (var i = 0; i < bars.length; i++) {
          var n = REDUCED ? 0.7 : 0.5 + 0.5 * Math.sin(k * (3.1 + i * 0.9) + i * 1.3) * Math.sin(k * (1.7 + i * 0.4));
          bars[i].style.transform = 'scaleY(' + clamp(0.12 + mood * (0.25 + 0.75 * n), 0.08, 1).toFixed(3) + ')';
        }
      }
      requestAnimationFrame(moodLoop);
    }
    requestAnimationFrame(moodLoop);

    return {
      build: function () { frames = buildFrames(); last = {}; update(); },
      update: update,
      getBonus: function () { return bonus; },
      bonus: function (amount, label) {
        bonus += amount;
        var p = document.createElement('span');
        p.className = 'hud-pop';
        p.textContent = '+' + eur(amount, 2) + (label ? ' · ' + label : '');
        p.addEventListener('animationend', function () { p.remove(); });
        popBox.appendChild(p);
        last.rev = null; update();
      },
      setTitle: function (t) { customTitle = (t || '').toUpperCase().slice(0, 26); last.title = null; update(); }
    };
  })();

  /* =========================================================
     NAV
     ========================================================= */
  var NAV = (function () {
    var nav = $('[data-nav]'); if (!nav) return { update: function () {} };
    var bar = $('.nav__progress i', nav), links = $$('[data-navlink]', nav), scenes = $$('[data-scene]');
    var map = { bon: 'bon', crowd: 'welten', restaurant: 'welten', sportsbar: 'welten', tv: 'welten', bar: 'welten', club: 'welten', events: 'welten', zahlen: 'zahlen', stammgaeste: 'zahlen', pakete: 'pakete', morgen: 'fragen' };
    var current = '';
    function update() {
      var y = window.scrollY, max = root.scrollHeight - vh();
      nav.classList.toggle('is-solid', y > 30);
      bar.style.setProperty('--p', clamp(y / Math.max(1, max)).toFixed(4));
      var probe = vh() * 0.45, key = '';
      for (var i = 0; i < scenes.length; i++) {
        var r = scenes[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe && getComputedStyle(scenes[i]).visibility !== 'hidden') key = map[scenes[i].dataset.scene] || '';
      }
      if (key !== current) { current = key; links.forEach(function (a) { a.classList.toggle('is-active', a.dataset.navlink === key); }); }
    }
    return { update: update };
  })();

  // smooth in-page anchors that respect pinned scenes
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || id === 'inhalt') return;
    var t = document.getElementById(id); if (!t) return;
    e.preventDefault();
    var y = null;
    if (hasGSAP) {
      ScrollTrigger.getAll().forEach(function (s) {
        if (!s.pin) return;
        if (t.hasAttribute('data-pin-end') && s.pin.contains(t)) y = s.end;
        else if (s.trigger === t || s.pin === t) y = s.start;
      });
    }
    if (y === null) y = docTop(t);
    window.scrollTo({ top: Math.max(0, y), behavior: REDUCED ? 'auto' : 'smooth' });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; NAV.update(); HUD.update(); });
  }, { passive: true });

  /* =========================================================
     HERO · clover lens
     ========================================================= */
  (function initLens() {
    var hero = $('#stille'), media = $('[data-lens]'); if (!hero || !media) return;
    var after = $('.hero__img--after', media), rim = $('.lens-rim', media), tag = $('.lens-tag', media);
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (REDUCED && !fine) { hero.classList.add('no-lens'); after.style.display = 'none'; return; }
    var W = 0, H = 0, x = 0, y = 0, tx = 0, ty = 0, R = 0, lastMove = -1e9, visible = true, running = false, intro = 0;
    var t0 = performance.now();
    function size() { W = media.clientWidth; H = media.clientHeight; }
    size(); x = tx = W * 0.66; y = ty = H * 0.42;
    window.addEventListener('resize', size);
    function toLocal(e) { var r = media.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; lastMove = performance.now(); }
    hero.addEventListener('pointermove', function (e) { toLocal(e); start(); }, { passive: true });
    hero.addEventListener('pointerdown', function (e) { toLocal(e); start(); }, { passive: true });
    hero.addEventListener('pointerleave', function () { lastMove = performance.now() - 1300; });
    setTimeout(function () { tween(1400, function (e) { intro = e; }, null, easeOut3); }, REDUCED ? 0 : 700);
    function baseR() { return clamp(Math.min(W, H) * 0.19, 70, 180); }
    var tagW = 0;
    function frame(now) {
      if (!visible) { running = false; return; }
      var idle = now - lastMove > 1500;
      if (idle && !REDUCED) {
        var k = (now - t0) / 1000;
        var st = MODE === 'stage', cx = st ? 0.68 : 0.56, cy = st ? 0.5 : 0.25;
        tx = W * (cx + (st ? 0.15 : 0.13) * Math.sin(k * 0.38)); ty = H * (cy + (st ? 0.09 : 0.045) * Math.sin(k * 0.61 + 1.2));
      }
      var follow = REDUCED ? 1 : (idle ? 0.035 : 0.16);
      x += (tx - x) * follow; y += (ty - y) * follow;
      var fade = 1 - smooth(H * 0.2, H * 0.7, window.scrollY);
      var targetR = (REDUCED && idle) ? 0 : baseR() * intro * (0.35 + 0.65 * fade);
      R += (targetR - R) * (REDUCED ? 1 : 0.09);
      setMask(after, cloverMask(x, y, R, 2));
      placeRim(rim, x, y, R, 2.2);
      rim.style.opacity = (clamp(R / 50) * fade).toFixed(3);
      if (!tagW) tagW = tag.offsetWidth || 150;
      tag.style.transform = 'translate3d(' + Math.min(x + R * 0.42, W - tagW - 10).toFixed(1) + 'px,' + Math.max(64, y - R * 1.08 - 12).toFixed(1) + 'px,0)';
      tag.style.opacity = (clamp((R - 40) / 40) * fade).toFixed(3);
      requestAnimationFrame(frame);
    }
    function start() { if (!running && visible) { running = true; requestAnimationFrame(frame); } }
    onVisible(hero, function (v) { visible = v; if (v) start(); }, { threshold: 0 });
    start();
  })();

  /* =========================================================
     ACT I · receipt → rewind → portal
     ========================================================= */
  function rewindEls(sec) {
    var rw = $('.rewind', sec);
    var e = {
      rw: rw, lines: $('.rewind__lines', rw), clockWrap: $('.rewind__clock', rw), clock: $('[data-rclock]', rw), badge: $('.rewind__badge', rw),
      l1: $('.rewind__line--1', rw), l2: $('.rewind__line--2', rw), l3: $('.rewind__line--3', rw), clover: $('.rewind__clover', rw), paths: $$('.cl-p', rw),
      portal: $('.portal', rw), pImg: $('.portal__img', rw), pRim: $('.portal__rim', rw), pShade: $('.portal__shade', rw),
      content: $('.portal__content', rw)
    };
    e.contentKids = Array.prototype.slice.call(e.content.children);
    var cache = null;
    onRefreshInit(function () { cache = null; });
    e.geo = function () {
      if (cache) return cache;
      var a = rw.getBoundingClientRect(), b = e.clover.getBoundingClientRect();
      var x = b.left - a.left + b.width / 2, y = b.top - a.top + b.height / 2;
      cache = { x: x, y: y, r0: b.width / 2, rMax: farCorner(x, y, a.width, a.height) * 1.42 };
      return cache;
    };
    return e;
  }
  function rewindSequence(tl, o, E) {
    var proxy = { m: 1574 }, P = { R: 0 };
    E.paths.forEach(function (p) { var L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L + ' ' + L, strokeDashoffset: L }); });
    function renderPortal() {
      var g = E.geo();
      if (P.R >= g.rMax * 0.995) setMask(E.pImg, 'none'); else setMask(E.pImg, cloverMask(g.x, g.y, P.R, 2));
      placeRim(E.pRim, g.x, g.y, P.R, 2.6);
    }
    tl.set(E.rw, { autoAlpha: 1 }, o);
    tl.fromTo(E.rw, { '--rw-bg': 0 }, { '--rw-bg': 1, duration: 3 }, o);
    tl.fromTo(E.lines, { opacity: 0 }, { opacity: 0.6, duration: 2 }, o);
    tl.fromTo([E.badge, E.clockWrap], { opacity: 0 }, { opacity: 1, duration: 2 }, o);
    tl.fromTo(proxy, { m: 1574 }, { m: 1140, duration: 14, ease: 'power1.inOut', onUpdate: function () { E.clock.textContent = hhmm(proxy.m); } }, o);
    tl.fromTo(E.clockWrap, { filter: 'blur(0px)' }, { filter: 'blur(3px)', duration: 7, ease: 'power1.in' }, o);
    tl.to(E.clockWrap, { filter: 'blur(0px)', duration: 7, ease: 'power1.out' }, o + 7);
    tl.fromTo(E.l1, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 3, ease: 'power2.out' }, o + 1);
    tl.to(E.l1, { opacity: 0, y: -30, duration: 2, ease: 'power2.in' }, o + 9);
    tl.fromTo(E.l2, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 3, ease: 'power2.out' }, o + 10);
    tl.to(E.l2, { opacity: 0, y: -20, duration: 2, ease: 'power2.in' }, o + 17);
    tl.to([E.badge, E.clockWrap, E.lines], { opacity: 0, duration: 2 }, o + 15);
    tl.fromTo(E.clover, { opacity: 0 }, { opacity: 1, duration: 1 }, o + 16);
    tl.to(E.paths, { strokeDashoffset: 0, duration: 5, stagger: 0.6, ease: 'power2.inOut' }, o + 16);
    tl.fromTo(E.l3, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 3, ease: 'power2.out' }, o + 19);
    tl.to(E.l3, { opacity: 0, duration: 2 }, o + 23);
    tl.set(E.portal, { autoAlpha: 1 }, o + 23);
    tl.fromTo(P, { R: function () { return E.geo().r0; } }, { R: function () { return E.geo().rMax; }, duration: 10, ease: 'power2.in', onUpdate: renderPortal, onStart: renderPortal }, o + 23);
    tl.to(E.clover, { opacity: 0, duration: 1 }, o + 23.2);
    tl.fromTo(E.pShade, { opacity: 0 }, { opacity: 1, duration: 5 }, o + 29);
    tl.fromTo(E.pRim, { opacity: 1 }, { opacity: 0, duration: 4 }, o + 30);
    tl.set(E.content, { autoAlpha: 1 }, o + 34.5);
    tl.fromTo(E.contentKids, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 4, stagger: 1.1, ease: 'power2.out' }, o + 35);
    tl.to({}, { duration: 1 }, o + RW_TOTAL - 1);
  }

  function act1Stage() {
    var sec = $('#bon'); if (!sec) return;
    var receipt = $('.receipt', sec), printer = $('.printer', sec), copy = $('.act1__copy', sec), bg = $('.act1__bg img', sec);
    var parts = [$('.receipt__head', receipt)].concat($$('.ri', receipt), [$('.receipt__foot', receipt)]);
    var H = 0, stops = [];
    function measure() { H = receipt.offsetHeight; stops = parts.map(function (p) { return H - (p.offsetTop + p.offsetHeight); }); }
    measure();
    onRefreshInit(measure);
    var E = rewindEls(sec);
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(vh() * 6.3); }, pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) { printer.classList.toggle('is-printing', self.progress > 0.02 && self.progress < 0.56 && Math.abs(self.getVelocity()) > 30); }
      }
    });
    ST.act1 = tl.scrollTrigger;
    tl.fromTo(receipt, { y: function () { return H + 14; } }, { y: function () { return stops[0]; }, duration: 3 }, A1.head);
    for (var i = 0; i < 6; i++) {
      (function (i) { tl.to(receipt, { y: function () { return stops[i + 1]; }, duration: 5 }, A1.item(i)[0]); })(i);
    }
    tl.to(receipt, { y: function () { return stops[7]; }, duration: 4 }, A1.foot);
    tl.to(receipt, { y: function () { return stops[7] - 18; }, rotation: 1.2, duration: 1.2, ease: 'power2.out' }, A1.tear);
    tl.to(copy, { opacity: 0, y: -24, duration: 4 }, 60);
    tl.to(receipt, { y: function () { return H + 14; }, rotation: 0, duration: 5, ease: 'power2.in' }, 61);
    tl.to(printer, { opacity: 0, y: 30, duration: 4 }, 64);
    tl.to(bg, { opacity: 0.3, duration: 6 }, 62);
    rewindSequence(tl, A1.rw, E);
  }

  function act1Flow() {
    var sec = $('#bon'); if (!sec) return;
    $$('.ri', sec).forEach(function (it) {
      gsap.from(it, { opacity: 0, y: 24, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: it, start: 'top 90%', toggleActions: 'play none none reverse' } });
    });
    var E = rewindEls(sec);
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: E.rw, start: 'top top', end: function () { return '+=' + Math.round(vh() * 3.6); }, pin: true, scrub: 0.6, invalidateOnRefresh: true }
    });
    ST.rewind = tl.scrollTrigger;
    rewindSequence(tl, 0, E);
  }

  /* =========================================================
     WORLDS · before → after bloom
     ========================================================= */
  function renderBloom(world, after, rim, p, g) {
    if (p <= 0.002) { after.style.visibility = 'hidden'; rim.style.opacity = '0'; }
    else if (p >= 0.998) { after.style.visibility = ''; setMask(after, 'none'); rim.style.opacity = '0'; }
    else {
      after.style.visibility = '';
      var R = Math.max(1, g.max * p);
      setMask(after, cloverMask(g.x, g.y, R, 2));
      placeRim(rim, g.x, g.y, R, 2.4);
      rim.style.opacity = String((1 - smooth(0.72, 1, p)).toFixed(3));
    }
    world.classList.toggle('is-after', p > 0.45);
  }
  function worldGeo(media, after, origin) {
    var pt = imgPoint(after, origin[0], origin[1]);
    var W = media.clientWidth, H = media.clientHeight;
    return { x: pt.x, y: pt.y, max: farCorner(pt.x, pt.y, W, H) * 1.42 };
  }

  var EXTRAS = {
    sportsbar: function (tl, world) {
      var tv = $('.tv--quiz', world), media = $('.world__media', world), img = $('.wm--after', media);
      var scr = (media.dataset.screen || '0.38,0.24,0.55,0.35').split(',').map(Number);
      var g = null;
      onRefreshInit(function () { g = null; });
      function geom() {
        if (g) return g;
        var prev = tv.style.transform; tv.style.transform = 'none';
        var tr = tv.getBoundingClientRect(); tv.style.transform = prev;
        var mr = media.getBoundingClientRect();
        var p1 = imgPoint(img, scr[0], scr[1]), p2 = imgPoint(img, scr[0] + scr[2], scr[1] + scr[3]);
        g = { x: (mr.left + p1.x) - tr.left, y: (mr.top + p1.y) - tr.top, s: Math.max(0.2, (p2.x - p1.x) / Math.max(1, tr.width)) };
        return g;
      }
      tl.fromTo(tv, { x: function () { return geom().x; }, y: function () { return geom().y; }, scale: function () { return geom().s; }, opacity: 0, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 16, ease: 'power2.inOut' }, 40);
      tl.fromTo($('.phone--quiz', world), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 10, ease: 'power2.out' }, 52);
    },
    bar: function (tl, world) {
      var svg = $('.bm', world);
      var draw = $$('.bm-room, .bm-counter, .bm-door', svg);
      draw.forEach(function (l) { var L = l.getTotalLength ? l.getTotalLength() : 1600; gsap.set(l, { strokeDasharray: L + ' ' + L, strokeDashoffset: L }); });
      tl.to(draw, { strokeDashoffset: 0, duration: 10, ease: 'power1.inOut' }, 46);
      tl.fromTo($$('.bm-zone, .bm-label', svg), { opacity: 0 }, { opacity: 1, duration: 6 }, 52);
      tl.fromTo($$('.bm-t', svg), { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 5, stagger: 0.32, ease: 'back.out(2)' }, 50);
      tl.fromTo($$('.drinkpanel, .stepper', world), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 6 }, 60);
    },
    club: function (tl, world) {
      tl.fromTo($('.eq', world), { opacity: 0 }, { opacity: 0.85, duration: 10 }, 38);
    },
    restaurant: function (tl, world) {
      tl.fromTo($('.crew', world), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 8, ease: 'power2.out' }, 54);
    }
  };

  function worldStage(world) {
    var id = world.id, stage = $('.world__stage', world), media = $('.world__media', world);
    var after = $('.wm--after', media), rim = $('.bloom-rim', media), shade = $('.world__shade', media);
    var intro = $('.world__intro', world), copy = $('.world__copy', world), device = $('.world__device', world);
    var kids = [$('.world__label', intro), $('.world__title', intro), $('.world__caption', intro)];
    var origin = (media.dataset.origin || '0.5,0.5').split(',').map(Number);
    var B = { p: 0 }, geo = null;
    onRefreshInit(function () { geo = null; });
    function G() { return geo || (geo = worldGeo(media, after, origin)); }
    function render() { renderBloom(world, after, rim, B.p, G()); }
    function introShift() { var H = stage.clientHeight; return Math.max(0, H - intro.offsetTop - intro.offsetHeight - Math.max(96, H * 0.13)); }
    var pins = { restaurant: 2.6, sportsbar: 2.8, bar: 3.1, club: 2.6 };
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: world, start: 'top top', end: function () { return '+=' + Math.round(vh() * (pins[id] || 2.6)); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1, onRefresh: render }
    });
    ST.worlds[id] = tl.scrollTrigger;
    gsap.fromTo(kids, { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: world, start: 'top 72%', end: 'top 18%', scrub: 0.5 } });
    tl.fromTo(media, { scale: 1.06 }, { scale: 1, duration: 60 }, 0);
    tl.fromTo(B, { p: 0 }, { p: 1, duration: 28, ease: 'power1.inOut', onUpdate: render }, 10);
    tl.fromTo(intro, { y: introShift }, { y: 0, duration: 14, ease: 'power2.inOut' }, 40);
    tl.fromTo(shade, { opacity: 0.45 }, { opacity: 1, duration: 14 }, 40);
    tl.fromTo(copy, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 12, ease: 'power2.out' }, 46);
    if (id === 'sportsbar') tl.fromTo(device, { opacity: 0 }, { opacity: 1, duration: 4 }, 40);
    else tl.fromTo(device, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 14, ease: 'power2.out' }, 44);
    if (EXTRAS[id]) EXTRAS[id](tl, world);
    tl.to({}, { duration: 1 }, 99);
    render();
  }

  function worldFlow(world) {
    var media = $('.world__media', world), after = $('.wm--after', media), rim = $('.bloom-rim', media);
    var origin = (media.dataset.origin || '0.5,0.5').split(',').map(Number);
    var B = { p: 0 };
    var render = function () { renderBloom(world, after, rim, B.p, worldGeo(media, after, origin)); };
    render();
    ScrollTrigger.create({
      trigger: media, start: 'top 55%', once: true,
      onEnter: function () { gsap.to(B, { p: 1, duration: 1.9, delay: 0.55, ease: 'power2.inOut', onUpdate: render }); }
    });
    gsap.from([$('.world__copy', world), $('.world__device', world)], { opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: $('.world__body', world), start: 'top 85%' } });
    if (world.id === 'club') gsap.to($('.eq', world), { opacity: 0.8, duration: 1, scrollTrigger: { trigger: media, start: 'top 60%' } });
  }

  /* =========================================================
     DASHBOARD · 95 orders pour into the chart
     ========================================================= */
  var POUR = (function () {
    var sec = $('#zahlen'); if (!sec) return { layout: function () {}, draw: function () {} };
    var cv = $('.pour', sec), chart = $('[data-chart]', sec), axis = $('.chart__x', sec), ctx = cv.getContext('2d');
    var counts = [4, 7, 10, 13, 16, 18, 15, 12];
    var colors = [C.amber, C.amber, C.amber, C.pitch, C.pitch, C.pink, C.violet, C.violet];
    var dots = [], plan = [], W = 0, H = 0, dpr = 1, lastP = -1;
    var TABLES = [[76, 108, 18], [256, 108, 18], [346, 108, 18], [470, 108, 18], [90, 240, 23], [172, 240, 23], [254, 240, 23], [90, 340, 23], [254, 340, 23], [390, 240, 23], [472, 240, 23], [554, 240, 23], [390, 340, 23], [472, 340, 23]];
    function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
    function layout() {
      var host = cv.parentNode, hr = host.getBoundingClientRect();
      W = hr.width; H = hr.height; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var cr = chart.getBoundingClientRect(), ar = axis.getBoundingClientRect();
      var left = cr.left - hr.left, right = cr.right - hr.left, bottom = ar.top - hr.top, top = cr.top - hr.top + 4;
      var colW = (right - left) / 8, sp = Math.min(colW * 0.3, (bottom - top) / 9.8), r = sp * 0.36;
      var rand = rng(11); dots = [];
      // start: a faint floor plan of the 14 occupied tables above the chart (every order starts at a table)
      var card = cv.parentNode.querySelector('.dashboard').getBoundingClientRect();
      var fx0 = card.left - hr.left + 34, fw = card.width - 68, fy0 = card.top - hr.top + 30, fh = Math.max(140, card.height * 0.6);
      var sc = Math.min(fw / 640, fh / 440), ox = fx0 + (fw - 640 * sc) / 2, oy = fy0 + (fh - 440 * sc) / 2;
      plan = TABLES.map(function (t) { return { x: ox + t[0] * sc, y: oy + t[1] * sc, r: t[2] * sc }; });
      var n = 0;
      counts.forEach(function (cnt, c) {
        for (var k = 0; k < cnt; k++) {
          var row = Math.floor(k / 2), side = k % 2 ? 1 : -1, tb = plan[n % plan.length], ang = (n * 2.39996) % 6.2832, rr = tb.r + r * 2.2 + (Math.floor(n / plan.length) * r * 2.2);
          dots.push({ r: r, color: colors[c], tx: left + colW * (c + 0.5) + side * sp * 0.52, ty: bottom - (row + 0.5) * sp - 3, sx: tb.x + Math.cos(ang) * rr, sy: tb.y + Math.sin(ang) * rr, d: (c / 8) * 0.35 + rand() * 0.18 });
          n++;
        }
      });
      lastP = -1;
    }
    function draw(p) {
      if (!dots.length) layout();
      if (Math.abs(p - lastP) < 0.0004) return; lastP = p;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var pa = clamp(1 - p * 3.2);
      if (pa > 0) {
        ctx.globalAlpha = pa * 0.5; ctx.strokeStyle = C.mint; ctx.lineWidth = 1.2;
        for (var j = 0; j < plan.length; j++) { ctx.beginPath(); ctx.arc(plan[j].x, plan[j].y, plan[j].r, 0, 6.2832); ctx.stroke(); }
      }
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i], t = clamp((p - d.d) / 0.45), e = ease3(t);
        var x = lerp(d.sx, d.tx, e), y = lerp(d.sy, d.ty, e) - Math.sin(e * Math.PI) * 34;
        var a = 0.3 + 0.7 * e;
        ctx.fillStyle = d.color;
        ctx.globalAlpha = a * 0.28; ctx.beginPath(); ctx.arc(x, y, d.r * 2.2, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, d.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    return { layout: layout, draw: draw };
  })();

  var KPI = (function () {
    var sec = $('#zahlen'); if (!sec) return { render: function () {} };
    var rev = $('[data-kpi="rev"]', sec), order = $('[data-kpi="order"]', sec), dwell = $('[data-kpi="dwell"]', sec), delta = $('[data-kpi-delta]', sec);
    return {
      render: function (v) {
        var total = 2847 + HUD.getBonus();
        rev.textContent = eur(Math.round(total * v));
        order.textContent = (5.3 * v).toFixed(1).replace('.', ',');
        var m = Math.round(134 * v);
        dwell.textContent = Math.floor(m / 60) + ':' + (m % 60 < 10 ? '0' : '') + (m % 60);
        delta.textContent = '+' + Math.round((total / 2240 - 1) * 100) + ' % ggü. Freitag-Schnitt';
      }
    };
  })();

  function dashStage() {
    var sec = $('#zahlen'); if (!sec) return;
    var P = { p: 0 }, K = { v: 0 };
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(vh() * 1.9); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onRefresh: function () { POUR.layout(); POUR.draw(P.p); },
        onUpdate: function (self) { sec.classList.toggle('is-counted', self.progress > 0.42); }
      }
    });
    ST.dash = tl.scrollTrigger;
    tl.fromTo($('.dashboard', sec), { opacity: 0.35, y: 30 }, { opacity: 1, y: 0, duration: 16, ease: 'power2.out' }, 0);
    tl.fromTo(P, { p: 0 }, { p: 1, duration: 56, onUpdate: function () { POUR.draw(P.p); } }, 4);
    tl.fromTo(K, { v: 0 }, { v: 1, duration: 30, ease: 'power2.out', onUpdate: function () { KPI.render(K.v); } }, 24);
    tl.to({}, { duration: 1 }, 99);
  }
  function dashFlow() {
    var sec = $('#zahlen'); if (!sec) return;
    var P = { p: 0 }, K = { v: 0 };
    POUR.layout(); POUR.draw(0); KPI.render(0);
    ScrollTrigger.create({
      trigger: $('.dashboard', sec), start: 'top 70%', once: true,
      onEnter: function () {
        POUR.layout();
        gsap.to(P, { p: 1, duration: 2.6, ease: 'none', onUpdate: function () { POUR.draw(P.p); } });
        gsap.to(K, { v: 1, duration: 1.8, delay: 0.6, ease: 'power2.out', onUpdate: function () { KPI.render(K.v); } });
        setTimeout(function () { sec.classList.add('is-counted'); }, 900);
      }
    });
  }

  /* =========================================================
     DEMOS
     ========================================================= */
  (function initMenu() {
    var ph = $('[data-menu]'); if (!ph) return;
    var dict = {
      de: { title: 'Speisekarte', tab1: 'Vorspeisen', tab2: 'Hauptgänge', tab3: 'Wein', i1: 'Burrata, Tomate, Basilikum', i2: 'Risotto al limone', i3: 'Tagliata vom Rind, Rucola', i4: 'Grauburgunder, 0,2 l', lac: 'Laktose', sul: 'Sulfite', call: 'Service rufen', pay: 'Bitte zahlen', more: 'Nachbestellen', help: 'Hilfe', t_pay: 'Die Crew ist unterwegs zu dir.', t_more: 'Grauburgunder kommt gleich.', t_help: 'Gleich ist jemand bei dir.' },
      en: { title: 'Menu', tab1: 'Starters', tab2: 'Mains', tab3: 'Wine', i1: 'Burrata, tomato, basil', i2: 'Lemon risotto', i3: 'Beef tagliata, rocket', i4: 'Pinot Grigio, 0.2 l', lac: 'Lactose', sul: 'Sulphites', call: 'Call service', pay: 'Bill, please', more: 'Order more', help: 'Help', t_pay: 'Your server is on the way.', t_more: 'Your wine is coming.', t_help: 'Someone will be right with you.' },
      it: { title: 'Menù', tab1: 'Antipasti', tab2: 'Secondi', tab3: 'Vino', i1: 'Burrata, pomodoro, basilico', i2: 'Risotto al limone', i3: 'Tagliata di manzo, rucola', i4: 'Pinot grigio, 0,2 l', lac: 'Lattosio', sul: 'Solfiti', call: 'Chiama il servizio', pay: 'Il conto, per favore', more: 'Ordina ancora', help: 'Aiuto', t_pay: 'Il personale sta arrivando.', t_more: 'Il vino arriva subito.', t_help: 'Arriva subito qualcuno.' }
    };
    var lang = 'de', langBtns = $$('.pm__lang button', ph);
    function apply() { $$('[data-i18n]', ph).forEach(function (el) { var v = dict[lang][el.dataset.i18n]; if (v) el.textContent = v; }); }
    langBtns.forEach(function (b) {
      b.addEventListener('click', function () { lang = b.dataset.lang; langBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); apply(); });
    });
    var callBtn = $('.pm__callbtn', ph), sheet = $('.pm__sheet', ph), toast = $('.pm__toast', ph), crew = $('.crew__list');
    callBtn.addEventListener('click', function () {
      var open = sheet.hidden; sheet.hidden = !open; callBtn.setAttribute('aria-expanded', String(open)); toast.classList.remove('is-on');
      if (open) { var f = $('button', sheet); if (f) f.focus({ preventScroll: true }); }
    });
    $$('[data-call]', sheet).forEach(function (b) {
      b.addEventListener('click', function () {
        sheet.hidden = true; callBtn.setAttribute('aria-expanded', 'false');
        var kind = b.dataset.call;
        var text = { pay: 'Bitte zahlen', more: 'Nachbestellen · Grauburgunder 0,2 l', help: 'Hilfe · Wo ist die Toilette?' }[kind];
        var li = document.createElement('li');
        li.className = 'crew__item is-new';
        li.innerHTML = '<b>Tisch 9</b><span></span><em>jetzt</em>';
        li.querySelector('span').textContent = text;
        crew.insertBefore(li, crew.firstChild);
        while (crew.children.length > 3) crew.removeChild(crew.lastElementChild);
        toast.textContent = dict[lang]['t_' + kind]; toast.classList.add('is-on');
        setTimeout(function () { li.querySelector('em').textContent = 'unterwegs'; }, 1500);
        setTimeout(function () { li.classList.remove('is-new'); li.querySelector('em').textContent = 'erledigt · 0:42'; toast.classList.remove('is-on'); }, 4200);
        if (kind === 'more') HUD.bonus(7.4, 'Nachbestellung');
      });
    });
  })();

  (function initQuiz() {
    var tv = $('[data-quiz-tv]'), ph = $('[data-quiz-phone]'); if (!tv || !ph) return;
    var board = $('.tvq__board', tv), items = $$('li', board), tvAns = $$('.tvq__answers li', tv), btns = $$('.pq__answers button', ph);
    var result = $('.pq__result', ph), again = $('.pq__again', ph), foot = $('[data-qfoot]', tv), timerEl = $('[data-qtimer]', tv), ring = $('.tvq__timer i', tv);
    var init = items.map(function (li) { return +li.dataset.score; }), footInit = foot.textContent;
    var answered = false, t0 = performance.now(), running = false;
    function layout() {
      items.slice().sort(function (a, b) { return +b.dataset.score - +a.dataset.score; }).forEach(function (li, i) { li.style.setProperty('--i', i); li.classList.toggle('is-lead', i === 0); });
    }
    layout();
    function tick(now) {
      if (!running) return;
      if (!answered) {
        var left = 14 - ((now - t0) / 1000) % 14;
        timerEl.textContent = '0:' + (Math.ceil(left) < 10 ? '0' : '') + Math.ceil(left);
        ring.style.setProperty('--t', (left / 14).toFixed(3));
      }
      requestAnimationFrame(tick);
    }
    onVisible(tv, function (v) { running = v; if (v) requestAnimationFrame(tick); });
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (answered) return; answered = true;
        var ok = b.dataset.a === '113';
        btns.forEach(function (x) { x.disabled = true; if (x.dataset.a === '113') x.classList.add('is-correct'); });
        if (!ok) b.classList.add('is-wrong');
        tvAns.forEach(function (li) { li.classList.toggle('is-correct', li.dataset.a === '113'); li.classList.toggle('is-dim', li.dataset.a !== '113'); });
        var you = items.filter(function (li) { return li.classList.contains('is-you'); })[0];
        var sc = +you.dataset.score + (ok ? 100 : 10);
        you.dataset.score = sc; $('b', you).textContent = sc;
        setTimeout(layout, 350);
        result.textContent = ok ? 'Richtig! Götze, 113. Minute. +100 Punkte für Tisch 5.' : 'Knapp daneben: Es war die 113. Minute (Götze). +10 Punkte fürs Mitmachen.';
        if (ok && sc > 240) foot.textContent = 'Tisch 5 übernimmt die Führung · Schnaps aufs Haus!';
        timerEl.textContent = ok ? '✓' : '0:00';
        HUD.bonus(18, 'Halbzeit-Runde');
        again.hidden = false;
      });
    });
    again.addEventListener('click', function () {
      answered = false; t0 = performance.now();
      btns.forEach(function (x) { x.disabled = false; x.classList.remove('is-correct', 'is-wrong'); });
      tvAns.forEach(function (li) { li.classList.remove('is-correct', 'is-dim'); });
      items.forEach(function (li, i) { li.dataset.score = init[i]; $('b', li).textContent = init[i]; });
      layout(); result.textContent = ''; foot.textContent = footInit; again.hidden = true;
    });
  })();

  (function initBarMap() {
    var wrap = $('[data-barmap]'); if (!wrap) return;
    var svg = $('.bm', wrap), arcs = $('.bm-arcs', svg), fx = $('.bm-fx', svg), NS = 'http://www.w3.org/2000/svg';
    var tables = {};
    $$('.bm-t', svg).forEach(function (g) {
      var m = /translate\(\s*([-\d.]+)[\s,]+([-\d.]+)\s*\)/.exec(g.getAttribute('transform')), n = +g.dataset.t;
      var t = { g: g, n: n, x: +m[1], y: +m[2], r: +$('circle', g).getAttribute('r'), area: g.dataset.area, free: g.classList.contains('is-free'), blocked: g.classList.contains('is-blocked'), you: g.classList.contains('is-you') };
      tables[n] = t;
      mk('circle', { r: t.r + 15, 'class': 'bm-hit' }, g);
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.setAttribute('aria-label', 'Tisch ' + n + (t.you ? ', das bist du' : t.free ? ', frei' : t.blocked ? ', Drinks pausiert' : ', ' + t.area));
    });
    var list = Object.keys(tables).map(function (k) { return tables[k]; });
    var toEl = $('[data-dp-to]', wrap), areaEl = $('[data-dp-area]', wrap), status = $('[data-dp-status]', wrap), send = $('[data-dp-send]', wrap), msg = $('[data-dp-msg]', wrap);
    var opts = $$('.dp__options button', wrap), steps = $$('.stepper li', wrap);
    var target = 12, drink = opts[0], sent = 0, busy = false;
    function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    function say(text, cls) { status.textContent = text; status.className = 'dp__status' + (cls ? ' ' + cls : ''); }
    function shake(t) { t.g.classList.remove('is-shake'); t.g.getBoundingClientRect(); t.g.classList.add('is-shake'); setTimeout(function () { t.g.classList.remove('is-shake'); }, 500); }
    function select(n) {
      var t = tables[n]; if (!t) return;
      if (t.you) { shake(t); return say('Das bist du. Wähl einen anderen Tisch.', 'is-warn'); }
      if (t.free) { shake(t); return say('Tisch ' + n + ' ist gerade frei. Such dir einen besetzten Tisch.', 'is-warn'); }
      if (t.blocked) { shake(t); return say('Tisch ' + n + ' hat Drinks pausiert. Kein Druck, kein Spam.', 'is-warn'); }
      list.forEach(function (o) { o.g.classList.toggle('is-target', o.n === n); });
      target = n; toEl.textContent = 'Tisch ' + n; areaEl.textContent = '· ' + t.area;
      say('Bereit: ' + drink.dataset.drink + ' an Tisch ' + n + '.');
    }
    list.forEach(function (t) {
      t.g.addEventListener('click', function () { select(t.n); });
      t.g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(t.n); } });
    });
    opts.forEach(function (b) { b.addEventListener('click', function () { opts.forEach(function (o) { o.setAttribute('aria-checked', o === b ? 'true' : 'false'); }); drink = b; }); });
    function arcPath(a, b, lift) {
      var mx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - (lift || 70) - Math.abs(a.x - b.x) * 0.12;
      return 'M' + a.x + ' ' + a.y + ' Q' + mx + ' ' + cy + ' ' + b.x + ' ' + b.y;
    }
    function arrive(b) {
      var ring = mk('circle', { cx: b.x, cy: b.y, r: b.r, 'class': 'bm-ring', stroke: '#FF3B7A' }, fx);
      tween(900, function (e) { ring.setAttribute('r', (b.r + e * 26).toFixed(1)); ring.style.opacity = String(1 - e); }, function () { ring.remove(); }, easeOut3);
      var txt = msg.checked ? '🥂 Danke, Tisch 7!' : '🥂', w = msg.checked ? 132 : 38;
      var bub = mk('g', { 'class': 'bm-bubble' }, fx);
      mk('rect', { x: -w / 2, y: -15, width: w, height: 26, rx: 13 }, bub);
      var tx = mk('text', { y: 3 }, bub); tx.textContent = txt;
      tween(2300, function (e, raw) {
        bub.setAttribute('transform', 'translate(' + b.x + ' ' + (b.y - b.r - 18 - raw * 16).toFixed(1) + ')');
        bub.style.opacity = String(raw < 0.75 ? 1 : 1 - (raw - 0.75) / 0.25);
      }, function () { bub.remove(); }, linear);
    }
    send.addEventListener('click', function () {
      if (busy) return;
      if (sent >= 3) return say('Limit erreicht: maximal 3 Drinks pro Stunde. Schutz im System.', 'is-warn');
      var a = tables[7], b = tables[target];
      busy = true; send.disabled = true;
      var path = mk('path', { d: arcPath(a, b), 'class': 'bm-arc bm-arc--mine' }, arcs);
      var L = path.getTotalLength(); path.style.strokeDasharray = L + ' ' + L; path.style.strokeDashoffset = L;
      var g = mk('g', { 'class': 'bm-drink' }, fx);
      mk('circle', { r: 11 }, g); mk('path', { d: 'M-5 -5h10l-5 5z M0 0v5 M-3 5h6' }, g);
      steps.forEach(function (s, i) { s.classList.toggle('is-on', i < 3); });
      say('Unterwegs: ' + drink.dataset.drink + ' an Tisch ' + target + ' …');
      tween(REDUCED ? 10 : 1150, function (e) {
        path.style.strokeDashoffset = String(L * (1 - e));
        var p = path.getPointAtLength(L * e);
        g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      }, function () {
        g.remove(); arrive(b); steps[3] && steps[3].classList.add('is-on'); sent++;
        HUD.bonus(parseFloat(drink.dataset.price), 'Drink-to-Table');
        say(drink.dataset.drink + ' ist an Tisch ' + target + ' angekommen. Die Crew bringt den Drink.' + (sent >= 3 ? ' Limit für diese Stunde erreicht.' : ''), 'is-ok');
        tween(1000, function (e) { path.style.opacity = String(1 - e); }, function () { path.remove(); }, linear);
        busy = false; send.disabled = sent >= 3;
        if (sent >= 3) setTimeout(function () { sent = 0; send.disabled = false; say('Neue Stunde, neues Limit. (Demo)'); }, 9000);
      });
    });
    // ambient table-to-table traffic
    var occupied = list.filter(function (t) { return !t.free && !t.blocked && !t.you; });
    var EM = ['🙌', '🔥', '😄', '🥂', '💃', '👋'], timer = null;
    function ambient() {
      var a = occupied[Math.floor(Math.random() * occupied.length)], b = a;
      while (b === a) b = occupied[Math.floor(Math.random() * occupied.length)];
      var color = Math.random() < 0.5 ? 'rgba(43,200,150,.7)' : 'rgba(255,59,122,.6)';
      var path = mk('path', { d: arcPath(a, b, 40), 'class': 'bm-arc bm-arc--ambient', stroke: color }, arcs);
      var L = path.getTotalLength(), dot = mk('circle', { r: 3.5, fill: color }, fx);
      tween(1300, function (e) { var p = path.getPointAtLength(L * e); dot.setAttribute('cx', p.x.toFixed(1)); dot.setAttribute('cy', p.y.toFixed(1)); path.style.opacity = String(Math.sin(e * Math.PI)); }, function () {
        dot.remove(); path.remove();
        var t = mk('text', { x: b.x + b.r * 0.7, y: b.y - b.r * 0.7, 'font-size': 15 }, fx);
        t.textContent = EM[Math.floor(Math.random() * EM.length)];
        tween(1400, function (e, raw) { t.setAttribute('y', (b.y - b.r * 0.7 - raw * 14).toFixed(1)); t.style.opacity = String(1 - raw); }, function () { t.remove(); }, linear);
      }, linear);
    }
    onVisible(wrap, function (v) { clearInterval(timer); if (v && !REDUCED) timer = setInterval(ambient, 2300); }, { threshold: 0.3 });
  })();

  (function initVote() {
    var ph = $('[data-vote]'); if (!ph) return;
    var btns = $$('.track', ph), status = $('[data-vote-status]', ph), now = $('[data-nowplaying]', ph);
    var songs = [{ t: 'Midnight Fizz', g: 'House' }, { t: 'Glockenbach Groove', g: 'Disco' }, { t: 'Neon Tide', g: 'Hip-Hop' }];
    var playing = { t: 'Aperol Spritz Anthem', g: 'House' };
    var p = btns.map(function (b) { return +b.dataset.p; }), voted = false;
    function render() {
      btns.forEach(function (b, i) {
        $('.track__t', b).textContent = songs[i].t; $('.track__g', b).textContent = songs[i].g;
        $('.track__pct', b).textContent = p[i] + ' %'; b.style.setProperty('--p', (p[i] / 100).toFixed(3));
      });
    }
    render();
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (voted) return; voted = true;
        p[i] += 7;
        var sum = p.reduce(function (a, c) { return a + c; }, 0);
        p = p.map(function (v) { return Math.round(v / sum * 100); });
        p[i] += 100 - p.reduce(function (a, c) { return a + c; }, 0);
        b.classList.add('is-mine'); btns.forEach(function (x) { x.disabled = true; }); render();
        status.textContent = 'Deine Stimme zählt: „' + songs[i].t + '“ liegt jetzt bei ' + p[i] + ' %.';
        var lead = p.indexOf(Math.max.apply(null, p));
        setTimeout(function () { status.textContent = 'Als Nächstes läuft: „' + songs[lead].t + '“.'; }, 3000);
        setTimeout(function () {
          var next = songs[lead]; songs[lead] = playing; playing = next;
          now.textContent = playing.t;
          p = [34, 33, 33].sort(function () { return Math.random() - 0.5; });
          btns.forEach(function (x) { x.disabled = false; x.classList.remove('is-mine'); });
          voted = false; render();
          status.textContent = 'Neue Runde. Stimm wieder ab.';
        }, 6800);
      });
    });
  })();

  (function initClubFx() {
    var club = $('#club'); if (!club) return;
    var eq = $('.eq', club), em = $('.emojis', club);
    var N = window.innerWidth < 700 ? 22 : 44;
    for (var i = 0; i < N; i++) eq.appendChild(document.createElement('i'));
    var bars = $$('i', eq), on = false, t0 = performance.now(), emTimer = null, period = 60000 / 124;
    function frame(now) {
      if (!on) return;
      var t = now - t0, kick = Math.exp(-((t % period) / period) * 5), k = t / 1000;
      for (var i = 0; i < N; i++) {
        var x = i / N, prof = 1 - x * 0.45;
        var n = 0.5 + 0.5 * Math.sin(k * (2.1 + (i % 7) * 0.37) + i * 1.7) * Math.sin(k * 1.3 + i * 0.6);
        var h = 0.08 + 0.6 * kick * prof * (0.55 + 0.45 * Math.sin(i * 2.3 + k)) + 0.28 * n;
        bars[i].style.transform = 'scaleY(' + clamp(h, 0.04, 1).toFixed(3) + ')';
      }
      requestAnimationFrame(frame);
    }
    var EMO = ['🔥', '🙌', '💃', '🥂', '😄', '🎶'], TABLES = [3, 5, 8, 11, 12, 14, 15, 17];
    function spawn() {
      if (em.childElementCount > 6) return;
      var s = document.createElement('span'); s.className = 'emoji-rise';
      var e = document.createElement('span'); e.textContent = EMO[Math.floor(Math.random() * EMO.length)];
      s.appendChild(e); s.appendChild(document.createTextNode('T' + TABLES[Math.floor(Math.random() * TABLES.length)]));
      s.style.left = (MODE === 'stage' ? 58 + Math.random() * 34 : 8 + Math.random() * 70).toFixed(1) + '%';
      s.style.animationDuration = (5 + Math.random() * 2).toFixed(2) + 's';
      s.addEventListener('animationend', function () { s.remove(); });
      em.appendChild(s);
    }
    onVisible(club, function (v) {
      on = v && !REDUCED; clearInterval(emTimer);
      if (on) { t0 = performance.now(); requestAnimationFrame(frame); emTimer = setInterval(function () { if (club.classList.contains('is-after')) spawn(); }, 1250); }
    }, { threshold: 0.05 });
    if (REDUCED) bars.forEach(function (b, i) { b.style.transform = 'scaleY(' + (0.2 + 0.5 * Math.abs(Math.sin(i))).toFixed(2) + ')'; });
  })();

  (function initScreens() {
    var box = $('.screens'); if (!box) return;
    var w = function () { return (40 + Math.random() * 55).toFixed(0) + '%'; };
    for (var i = 0; i < 12; i++) {
      var t = document.createElement('div'); t.className = 'screen-tile';
      for (var k = 0; k < 3; k++) { var b = document.createElement('i'); b.style.setProperty('--w', w()); t.appendChild(b); }
      box.appendChild(t);
    }
    var tiles = $$('.screen-tile', box), timer = null;
    onVisible(box, function (v) {
      clearInterval(timer);
      if (!v) return;
      tiles.forEach(function (t, i) { setTimeout(function () { t.classList.add('is-on'); }, REDUCED ? 0 : i * 110); });
      if (!REDUCED) timer = setInterval(function () { tiles.forEach(function (t) { $$('i', t).forEach(function (b) { b.style.setProperty('--w', w()); }); }); }, 2400);
    }, { threshold: 0.3 });
  })();

  (function initRegulars() {
    var grid = $('.visits__grid'); if (!grid) return;
    var visits = [0, 5, 8, 13, 16, 19, 22];
    for (var i = 0; i < 24; i++) grid.appendChild(document.createElement('i'));
    var dots = $$('i', grid);
    onVisible(grid, function (v) {
      if (!v) return;
      visits.forEach(function (idx, n) { setTimeout(function () { dots[idx].classList.add('is-visit'); }, REDUCED ? 0 : 150 + n * 140); });
      $$('[data-count]', $('.profile')).forEach(function (el) {
        var to = +el.dataset.count;
        if (REDUCED) { el.textContent = to; return; }
        tween(1300, function (e) { el.textContent = Math.round(to * e); }, null, easeOut3);
      });
    }, { threshold: 0.35, once: true });
    var sw = $('[data-reactivate]'), box = $('.reactivate');
    if (sw) sw.addEventListener('click', function () {
      var on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on)); box.classList.toggle('is-on', on);
      $('.switch__label', sw).textContent = on ? 'Aktiv: Angebot greift beim nächsten Scan' : 'Willkommens-Angebot beim nächsten Scan';
    });
  })();

  (function initPacks() {
    var btns = $$('[data-pack]'), mods = $$('.module'), tag = $('[data-pack-tagline]'); if (!btns.length) return;
    var TAG = {
      basic: 'Karte und Service-Ruf. Der Einstieg für jede Location.',
      social: 'Für Bars und Clubs, in denen Tische miteinander reden sollen.',
      screen: 'Für Locations, deren Fernseher mehr können sollen als Werbung.',
      music: 'Für Lounges und Clubs mit DJ und Playlist.',
      compliance: 'GEMA/GVL-Setup: sauber erfasst, dokumentiert, exportierbar.'
    };
    function set(k) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pack === k ? 'true' : 'false'); });
      mods.forEach(function (m, i) { var on = m.dataset.in.split(' ').indexOf(k) > -1; setTimeout(function () { m.classList.toggle('is-on', on); }, REDUCED ? 0 : i * 45); });
      tag.textContent = TAG[k];
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.pack); }); });
    set('basic');
  })();

  (function initFinale() {
    var form = $('[data-form]'); if (!form) return;
    var neon = $('[data-neon]'), city = $('[data-neon-city]'), done = $('[data-form-done]');
    var barIn = $('#f-bar'), cityIn = $('#f-city'), mailIn = $('#f-mail'), msgIn = $('#f-msg'), flickT = null;
    function flicker() { neon.classList.remove('is-flicker', 'is-off'); void neon.offsetWidth; neon.classList.add('is-flicker'); }
    function fit() {
      neon.style.fontSize = '';
      var cw = neon.clientWidth, sw = neon.scrollWidth;
      if (sw > cw + 1) {
        var fs = parseFloat(getComputedStyle(neon).fontSize);
        neon.style.fontSize = Math.max(26, Math.floor(fs * cw / sw * 0.98)) + 'px';
      }
    }
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    barIn.addEventListener('input', function () {
      var v = barIn.value.trim(); neon.textContent = v || 'Deine Bar'; HUD.setTitle(v); fit();
      clearTimeout(flickT); if (!REDUCED) flickT = setTimeout(flicker, 260);
    });
    cityIn.addEventListener('input', function () { city.textContent = cityIn.value.trim() || 'Deine Stadt'; });
    if (!REDUCED && 'IntersectionObserver' in window) {
      neon.classList.add('is-off');
      onVisible($('#pilot'), function (v) { if (v) setTimeout(flicker, 380); }, { threshold: 0.3, once: true });
    }
    var fields = [[barIn, function (v) { return v.trim().length > 1; }], [cityIn, function (v) { return v.trim().length > 1; }], [mailIn, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }]];
    var err = $('[data-form-error]'), sendBtn = $('button[type="submit"]', form);
    fields.forEach(function (f) { f[0].addEventListener('input', function () { f[0].closest('.field').classList.remove('is-invalid'); f[0].removeAttribute('aria-invalid'); if (err) err.textContent = ''; }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      fields.forEach(function (f) {
        var bad = !f[1](f[0].value);
        f[0].closest('.field').classList.toggle('is-invalid', bad);
        if (bad) f[0].setAttribute('aria-invalid', 'true'); else f[0].removeAttribute('aria-invalid');
        if (bad && !first) first = f[0];
      });
      if (first) { first.focus(); return; }
      var subject = 'Pilotanfrage: ' + barIn.value.trim() + ' (' + cityIn.value.trim() + ')';
      var lines = ['Bar / Location: ' + barIn.value.trim(), 'Stadt: ' + cityIn.value.trim(), 'E-Mail: ' + mailIn.value.trim(), '', msgIn.value.trim(), '', 'Gesendet über crowd-connect.de'];
      if (sendBtn) sendBtn.disabled = true;
      if (err) err.textContent = '';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: barIn.value.trim(),
          email: mailIn.value.trim(),
          topic: subject,
          company: cityIn.value.trim(),
          note: msgIn.value.trim(),
          message: lines.join('\n')
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            throw new Error(data.error || 'Die Anfrage konnte nicht gesendet werden.');
          });
        }
        done.hidden = false; done.focus();
      }).catch(function (ex) {
        if (err) err.textContent = (ex && ex.message) ? ex.message : 'Die Anfrage konnte nicht gesendet werden. Schreib uns gern direkt an hello@crowd-connect.de.';
        if (sendBtn) sendBtn.disabled = false;
      });
    });
  })();

  /* =========================================================
     BOOT
     ========================================================= */
  function resetBlooms() {
    $$('.wm--after').forEach(function (a) { a.style.visibility = ''; setMask(a, 'none'); });
    $$('.bloom-rim').forEach(function (r) { r.style.opacity = '0'; });
    $$('.world').forEach(function (w) { w.classList.remove('is-after'); });
  }

  if (ANIM) {
    var mm = gsap.matchMedia();
    mm.add({ stage: STAGE_Q, flow: 'not all and ' + STAGE_Q }, function (ctx) {
      MODE = ctx.conditions.stage ? 'stage' : 'flow';
      ST.worlds = {}; ST.act1 = null; ST.rewind = null; ST.dash = null;
      if (MODE === 'stage') { act1Stage(); $$('.world').forEach(worldStage); dashStage(); }
      else { act1Flow(); $$('.world').forEach(worldFlow); dashFlow(); }
      return function () { resetBlooms(); };
    });
    ScrollTrigger.addEventListener('refresh', function () { HUD.build(); NAV.update(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
  } else {
    var staticInit = function () {
      MODE = window.matchMedia(STAGE_Q).matches ? 'stage' : 'flow';
      POUR.layout(); POUR.draw(1); KPI.render(1);
      var dash = $('#zahlen'); if (dash) dash.classList.add('is-counted');
      HUD.build(); NAV.update();
    };
    var rt = null;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(staticInit, 200); });
    window.addEventListener('load', staticInit);
    staticInit();
  }
  NAV.update();
})();
