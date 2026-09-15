/* Efeitos visuais compartilhados do site do Posto Neópolis.
   Aplicados por atributo data-fx; respeitam prefers-reduced-motion.
   Nada aqui pode esconder conteúdo: toda animação tem rede de segurança
   que revela o elemento mesmo se o navegador não entregar quadros. */
(function () {
  // O runtime pode reinjetar este script; uma segunda execução duplicaria
  // a faixa de pista e os laços de animação.
  if (window.__nplFxLoaded) return;
  window.__nplFxLoaded = true;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobile = function () { return window.innerWidth < 768; };
  var done = new WeakSet();
  var revealTargets = [];
  var countTargets = [];
  var parallaxEls = [];

  function inView(el, margin) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh - (margin || 0) && r.bottom > 0;
  }

  /* ---------- entrada escalonada ---------- */
  function setupReveal(el, fadeOnly) {
    if (REDUCED) return;
    Array.prototype.slice.call(el.children).forEach(function (kid) {
      // Idempotente: a captura da transformação autoral acontece UMA vez por elemento,
      // mesmo que o container seja recriado pelo React e reescaneado.
      if (!kid.hasAttribute('data-fx-t')) kid.setAttribute('data-fx-t', kid.style.transform || 'none');
      var authored = kid.getAttribute('data-fx-t');
      kid.style.opacity = '0';
      if (!fadeOnly) {
        kid.style.transform = (authored && authored !== 'none' ? authored + ' ' : '') + 'translateY(20px)';
        kid.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.2,.7,.3,1)';
      } else {
        kid.style.transition = 'opacity .5s ease';
      }
    });
    revealTargets.push({ el: el, fade: fadeOnly, shown: false });
  }

  function showReveal(t) {
    if (t.shown) return;
    t.shown = true;
    Array.prototype.slice.call(t.el.children).forEach(function (kid, i) {
      kid.style.transitionDelay = Math.min(i * 70, 400) + 'ms';
      kid.style.opacity = '1';
      if (!t.fade) kid.style.transform = kid.getAttribute('data-fx-t') || 'none';
    });
  }

  /* ---------- contadores ---------- */
  function runCount(t) {
    if (t.shown) return;
    t.shown = true;
    var el = t.el, to = t.to;
    if (REDUCED) { el.textContent = String(to); return; }
    var t0 = Date.now();
    var timer = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / 900);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(timer);
    }, 40);
  }

  /* ---------- paralaxe (texto-fantasma e foto do hero) ---------- */
  function applyParallax() {
    var vh = window.innerHeight;
    var small = mobile();
    for (var i = 0; i < parallaxEls.length; i++) {
      var item = parallaxEls[i];
      var r = item.el.getBoundingClientRect();
      var factor = small ? item.factor * 0.25 : item.factor;
      var y = (r.top + r.height / 2 - vh / 2) * factor;
      if (item.max) y = Math.max(-item.max, Math.min(item.max, y));
      item.el.style.transform = item.base + ' translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
  }

  /* ---------- laço único: paralaxe + revelações ---------- */
  var last = 0;
  function pump(force) {
    var now = Date.now();
    if (!force && now - last < 16) return;
    last = now;
    applyParallax();
    for (var i = 0; i < revealTargets.length; i++) {
      if (!revealTargets[i].shown && inView(revealTargets[i].el, 40)) showReveal(revealTargets[i]);
    }
    for (var j = 0; j < countTargets.length; j++) {
      if (!countTargets[j].shown && inView(countTargets[j].el, 60)) runCount(countTargets[j]);
    }
  }

  /* ---------- brilho que acompanha o cursor ---------- */
  function setupGlow(section) {
    if (REDUCED || !FINE) return;
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .45s ease;z-index:1;mix-blend-mode:screen';
    section.appendChild(host);
    section.addEventListener('pointermove', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      var r = section.getBoundingClientRect();
      host.style.opacity = '1';
      host.style.background = 'radial-gradient(320px circle at ' + (ev.clientX - r.left) + 'px ' + (ev.clientY - r.top) +
        'px, rgba(0,169,114,0.20), rgba(0,120,190,0.10) 45%, transparent 70%)';
    });
    section.addEventListener('pointerleave', function () { host.style.opacity = '0'; });
  }

  /* ---------- carrossel: pausa ao passar o mouse ---------- */
  function setupMarquee(el) {
    var track = el.querySelector('[data-fx-track]') || el.firstElementChild;
    if (!track) return;
    if (REDUCED) { track.style.animationPlayState = 'paused'; return; }
    el.addEventListener('pointerenter', function () { track.style.animationPlayState = 'paused'; });
    el.addEventListener('pointerleave', function () { track.style.animationPlayState = 'running'; });
  }

  function scan() {
    document.querySelectorAll('[data-fx]').forEach(function (el) {
      if (done.has(el)) return;
      done.add(el);
      var kind = el.getAttribute('data-fx');
      if (kind === 'reveal') setupReveal(el, false);
      else if (kind === 'reveal-fade') setupReveal(el, true);
      else if (kind === 'count') countTargets.push({ el: el, to: parseFloat(el.getAttribute('data-to')) || 0, shown: false });
      else if (kind === 'ghost' || kind === 'parallax') {
        if (REDUCED) return;
        parallaxEls.push({
          el: el,
          base: el.getAttribute('data-fx-base') || '',
          factor: parseFloat(el.getAttribute('data-fx-factor')) || 0.08,
          max: parseFloat(el.getAttribute('data-fx-max')) || 0
        });
      }
      else if (kind === 'glow') setupGlow(el);
      else if (kind === 'marquee') setupMarquee(el);
    });
    pump(true);
  }

  window.addEventListener('scroll', function () { pump(false); }, { passive: true });
  window.addEventListener('resize', function () { pump(true); });
  setInterval(function () { pump(true); }, 300);

  // Rastro do cursor: faixa de asfalto verde com a linha central tracejada,
  // desenhada num canvas fixo e apagada em ~0,55s.
  function roadTrail() {
    if (REDUCED || !FINE) return;
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      cv.width = Math.round(innerWidth * dpr);
      cv.height = Math.round(innerHeight * dpr);
      cv.style.width = innerWidth + 'px';
      cv.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    var pts = [], LIFE = 550, WIDTH = 15;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var last = pts[pts.length - 1];
      if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 5) return;
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pts.length > 90) pts.shift();
    }, { passive: true });

    (function draw(now) {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      if (pts.length < 2) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        var life = 1 - (now - b.t) / LIFE;
        if (life <= 0) continue;
        var ease = life * life;
        ctx.strokeStyle = 'rgba(0,169,114,' + (0.5 * ease).toFixed(3) + ')';
        ctx.lineWidth = WIDTH * (0.45 + 0.55 * ease);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        // faixa central tracejada: um risco a cada tres segmentos
        if (i % 3 === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.75 * ease).toFixed(3) + ')';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    })(performance.now());
  }

  var mo = new MutationObserver(function () { scan(); });
  function start() {
    scan();
    roadTrail();
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
