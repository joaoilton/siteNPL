(function () {
  'use strict';

  /* ---------- Anos de atividade do posto ---------- */
  // Posto em operação desde 21/10/1991. O ano só vira na data do aniversário,
  // então antes de 21 de outubro ainda conta o ano anterior.
  var OPENING = { year: 1991, month: 9, day: 21 }; // getMonth() 9 = outubro

  function yearsSinceOpening(now) {
    var years = now.getFullYear() - OPENING.year;
    var beforeAnniversary = now.getMonth() < OPENING.month ||
      (now.getMonth() === OPENING.month && now.getDate() < OPENING.day);
    return beforeAnniversary ? years - 1 : years;
  }

  // Roda já no carregamento do script (fim do body), antes do DOMContentLoaded
  // em que o effects.js lê o data-to para animar o contador.
  (function setYearsActive() {
    var el = document.querySelector('[data-years-active]');
    if (!el) return;
    el.setAttribute('data-to', yearsSinceOpening(new Date()));
  })();

  /* ---------- Header: recolhe ao descer, reaparece ao subir ---------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    var bar = document.querySelector('.header-progress-bar');
    if (!header) return;

    function syncOffset() {
      var h = header.getBoundingClientRect().height;
      if (h) document.body.style.paddingTop = h + 'px';
    }
    syncOffset();
    if (window.ResizeObserver) new ResizeObserver(syncOffset).observe(header);
    window.addEventListener('resize', syncOffset);

    var lastY = 0;
    var hidden = false;
    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? Math.min(100, Math.round((doc.scrollTop / max) * 100)) : 0;
      var y = doc.scrollTop;
      var scrolled = y > 12;
      var shellH = header.offsetHeight || 140;
      var d = y - lastY;
      if (y <= shellH) hidden = false;
      else if (d > 6) hidden = true;
      else if (d < -6) hidden = false;
      if (Math.abs(d) > 6 || y <= shellH) lastY = y;

      header.classList.toggle('is-scrolled', scrolled);
      header.classList.toggle('is-hidden', hidden);
      if (bar) bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menu do celular ---------- */
  // O painel é sobreposto (position:absolute), então abrir não muda a altura
  // do cabeçalho nem empurra o conteúdo da página.
  function initMobileMenu() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.header-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    // Navegar para outra página fecha o menu.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Clique fora e Esc fecham.
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (e.target.closest('.header-nav') || e.target.closest('.nav-toggle')) return;
      setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    // Ao voltar para a largura de desktop, o menu não pode ficar preso aberto.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1200) setOpen(false);
    });
  }

  /* ---------- Footer: ano atual + mensagem do WhatsApp conforme a página ---------- */
  function initFooter() {
    var yearEl = document.querySelector('[data-year]');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var fab = document.querySelector('.whatsapp-fab');
    if (!fab) return;
    var page = (location.pathname.split('/').pop() || '').toLowerCase();
    var msg = 'Olá! Gostaria de falar com o Posto Neópolis.';
    var label = 'WhatsApp';
    if (page.indexOf('produtos') === 0) {
      msg = 'Olá! Gostaria de consultar a disponibilidade de...';
      label = 'Consultar produto';
    } else if (page.indexOf('parcerias') === 0) {
      msg = 'Olá! Tenho interesse em parceria comercial.';
      label = 'Falar sobre parceria';
    }
    fab.href = 'https://wa.me/5584991801090?text=' + encodeURIComponent(msg);
    var labelEl = fab.querySelector('[data-wa-label]');
    if (labelEl) labelEl.textContent = label;
  }

  /* ---------- Leque de fotos da seção "Nossa história" ---------- */
  function initFotoFan() {
    var fan = document.querySelector('.foto-fan');
    if (!fan) return;
    var imgs = Array.prototype.slice.call(fan.querySelectorAll('img'));
    var labelEl = document.querySelector('.foto-label');
    var current = 0;
    var timer = null;

    var STATES = [
      { t: 'rotate(0deg) translate(0,0) scale(1)', z: 4, o: 1 },
      { t: 'rotate(3.5deg) translate(15px,11px) scale(0.965)', z: 3, o: 0.9 },
      { t: 'rotate(7deg) translate(28px,20px) scale(0.935)', z: 2, o: 0.7 },
      { t: 'rotate(10deg) translate(40px,29px) scale(0.905)', z: 1, o: 0.45 }
    ];

    function apply() {
      imgs.forEach(function (img, i) {
        var k = (i - current + imgs.length) % imgs.length;
        var s = STATES[k];
        img.style.transform = s.t;
        img.style.zIndex = s.z;
        img.style.opacity = s.o;
      });
      if (labelEl) labelEl.textContent = '0' + (current + 1) + ' / 0' + imgs.length;
    }

    function startAuto() {
      clearInterval(timer);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(function () {
        current = (current + 1) % imgs.length;
        apply();
      }, 4200);
    }

    imgs.forEach(function (img, i) {
      img.addEventListener('click', function () {
        current = i !== current ? i : (current + 1) % imgs.length;
        apply();
        startAuto();
      });
    });

    var prevBtn = document.querySelector('.foto-btn-prev');
    var nextBtn = document.querySelector('.foto-btn-next');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      current = (current + imgs.length - 1) % imgs.length;
      apply();
      startAuto();
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      current = (current + 1) % imgs.length;
      apply();
      startAuto();
    });

    apply();
    startAuto();
  }

  /* ---------- Home: status aberto/fechado + contador de anos ---------- */
  function initHomeHero() {
    var statusText = document.querySelector('[data-status-text]');
    var statusDot = document.querySelector('[data-status-dot]');
    if (!statusText || !statusDot) return;
    function update() {
      var hour = new Date().getHours();
      var isOpen = hour >= 6 && hour < 22;
      statusText.textContent = isOpen ? 'Aberto agora · até 22h' : 'Fechado · abre às 6h';
      statusDot.style.background = isOpen ? '#00E39A' : '#ffb3a7';
    }
    update();
    setInterval(update, 60000);
  }

  /* ---------- Estrutura: leque de fotos com ampliar (lightbox) ---------- */
  function initEstruturaGallery() {
    var fan = document.querySelector('.estrutura-photo-fan');
    if (!fan) return;
    var imgs = Array.prototype.slice.call(fan.querySelectorAll('img'));
    var labelEl = document.querySelector('[data-estrutura-label]');
    var lightbox = document.querySelector('[data-lightbox]');
    var lightboxImg = lightbox ? lightbox.querySelector('img') : null;
    var current = 0;
    var timer = null;

    var STATES = [
      { t: 'rotate(0deg) translate(0,0) scale(1)', z: 4, o: 1 },
      { t: 'rotate(3.5deg) translate(16px,12px) scale(0.965)', z: 3, o: 0.9 },
      { t: 'rotate(7deg) translate(30px,22px) scale(0.935)', z: 2, o: 0.7 },
      { t: 'rotate(10deg) translate(42px,31px) scale(0.905)', z: 1, o: 0.45 }
    ];

    function apply() {
      imgs.forEach(function (img, i) {
        var k = (i - current + imgs.length) % imgs.length;
        var s = STATES[k];
        img.style.transform = s.t;
        img.style.zIndex = s.z;
        img.style.opacity = s.o;
      });
      if (labelEl) labelEl.textContent = '0' + (current + 1) + ' / 0' + imgs.length;
    }
    function startAuto() {
      clearInterval(timer);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(function () {
        if (!lightbox || lightbox.hidden) { current = (current + 1) % imgs.length; apply(); }
      }, 4200);
    }
    var focoAnterior = null;
    if (lightbox) {
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Foto ampliada');
      lightbox.setAttribute('tabindex', '-1');
    }
    function openLightbox(src) {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.src = src;
      lightbox.hidden = false;
      focoAnterior = document.activeElement;
      lightbox.focus();
    }
    function closeLightbox() {
      if (!lightbox || lightbox.hidden) return;
      lightbox.hidden = true;
      // devolve o foco para a foto que abriu o visor
      if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });

    imgs.forEach(function (img, i) {
      img.addEventListener('click', function () {
        if (i !== current) { current = i; apply(); return; }
        openLightbox(img.currentSrc || img.src);
      });
    });
    if (lightbox) lightbox.addEventListener('click', closeLightbox);

    var prevBtn = document.querySelector('.estrutura-btn-prev');
    var nextBtn = document.querySelector('.estrutura-btn-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { current = (current + imgs.length - 1) % imgs.length; apply(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { current = (current + 1) % imgs.length; apply(); startAuto(); });

    apply();
    startAuto();
  }

  /* ---------- Produtos: catálogo com busca e filtro por categoria ---------- */
  var CAT_SLOT = {
    lubrificantes: 'cat-lubrificantes', 'filtro-ar': 'cat-filtro-ar', 'filtro-oleo': 'cat-filtro-oleo',
    'filtro-cabine': 'cat-filtro-cabine', 'filtro-combustivel': 'cat-filtro-combustivel', aditivos: 'cat-aditivos',
    palhetas: 'cat-palhetas', 'pecas-acessorios': 'cat-pecas', graxas: 'cat-graxas',
    aromatizantes: 'cat-aromatizantes', ceras: 'cat-ceras'
  };

  function initProductCatalog() {
    var root = document.querySelector('[data-catalog]');
    if (!root || !window.NPL_CATEGORIES) return;
    var cats = window.NPL_CATEGORIES;

    var searchInput = root.querySelector('[data-search]');
    var chips = Array.prototype.slice.call(root.querySelectorAll('.chip'));
    var categoryCards = Array.prototype.slice.call(root.querySelectorAll('.category-card'));
    var catSection = root.querySelector('[data-categories-section]');
    var listSection = root.querySelector('[data-list-section]');
    var listTitleEl = listSection.querySelector('[data-list-title]');
    var listCountEl = listSection.querySelector('[data-list-count]');
    var listEl = listSection.querySelector('[data-list]');
    var noResultsEl = listSection.querySelector('[data-no-results]');
    var clearBtn = listSection.querySelector('[data-clear-filters]');

    var state = { query: '', cat: '' };

    function render() {
      var q = state.query.trim().toLowerCase();
      var cat = state.cat;
      var filtering = !!(q || cat);

      catSection.hidden = filtering;
      listSection.hidden = !filtering;
      chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.cat === cat); });
      if (!filtering) return;

      var results = [];
      var pool = cat ? cats.filter(function (c) { return c.slug === cat; }) : cats;
      pool.forEach(function (c) {
        c.items.forEach(function (i) {
          if (!q || i.n.toLowerCase().indexOf(q) !== -1) results.push({ name: i.n, cat: c.label, available: i.a });
        });
      });

      var catObj = cat ? cats.filter(function (c) { return c.slug === cat; })[0] : null;
      listTitleEl.textContent = catObj ? catObj.label : (q ? 'Resultados para "' + state.query.trim() + '"' : 'Produtos');
      listCountEl.textContent = results.length + (results.length === 1 ? ' produto encontrado' : ' produtos encontrados');

      listEl.innerHTML = '';
      results.forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'product-row';
        row.innerHTML =
          '<div><div class="product-row-name"></div><div class="product-row-cat"></div></div>' +
          '<span class="status-pill"></span>';
        row.querySelector('.product-row-name').textContent = r.name;
        row.querySelector('.product-row-cat').textContent = r.cat;
        var pill = row.querySelector('.status-pill');
        pill.textContent = r.available ? 'Disponível' : 'Sob consulta';
        pill.classList.add(r.available ? 'available' : 'on-request');
        listEl.appendChild(row);
      });
      noResultsEl.hidden = results.length !== 0;
    }

    if (searchInput) searchInput.addEventListener('input', function (e) { state.query = e.target.value; render(); });
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { state.cat = chip.dataset.cat || ''; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
    categoryCards.forEach(function (card) {
      var btn = card.querySelector('[data-cat]');
      if (!btn) return;
      card.addEventListener('click', function () { state.cat = btn.dataset.cat || ''; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      state.query = ''; state.cat = '';
      if (searchInput) searchInput.value = '';
      render();
    });

    // Monta os cartões de categoria com a foto correspondente (quando existe).
    categoryCards.forEach(function (card) {
      var slug = card.querySelector('[data-cat]').dataset.cat;
      var photoEl = card.querySelector('[data-category-photo]');
      var slot = CAT_SLOT[slug];
      if (photoEl && slot) {
        var img = document.createElement('img');
        img.src = 'assets/img/slots/' + slot + '.webp';
        img.alt = '';
        photoEl.appendChild(img);
      }
    });

    render();
  }

  /* ---------- Club Vip NPL: simulador de pontos e prêmios ---------- */
  var REWARDS_WITHOUT_PHOTO = { 'rw-voucher-20': 1, 'rw-voucher-30': 1, 'rw-troca-oleo-100': 1 };

  function initClubSimulator() {
    var root = document.querySelector('[data-club-sim]');
    if (!root || !window.NPL_REWARDS) return;
    var rewards = window.NPL_REWARDS;

    var comumBtn = root.querySelector('[data-fuel="comum"]');
    var aditivadaBtn = root.querySelector('[data-fuel="aditivada"]');
    var slider = root.querySelector('[data-liters]');
    var litersOut = root.querySelector('[data-liters-out]');
    var pointsFillOut = root.querySelector('[data-points-fill]');
    var pointsMonthOut = root.querySelectorAll('[data-points-month]');
    var nextBox = root.querySelector('[data-next-target]');
    var nextName = root.querySelector('[data-next-name]');
    var nextMissing = root.querySelector('[data-next-missing]');
    var nextBar = root.querySelector('[data-next-bar]');

    var premiosRoot = document.querySelector('[data-premios]');
    var unlockedCountEl = premiosRoot.querySelector('[data-unlocked-count]');
    var rewardsGrid = premiosRoot.querySelector('[data-rewards-grid]');
    var noRewardsEl = premiosRoot.querySelector('[data-no-rewards]');
    var nextUpBox = premiosRoot.querySelector('[data-next-up]');
    var nextUpGrid = premiosRoot.querySelector('[data-next-up-grid]');

    var state = { liters: 30, fuel: 'comum' };

    function render() {
      var perLiter = state.fuel === 'aditivada' ? 2 : 1;
      var pointsPerFill = state.liters * perLiter;
      var balance = pointsPerFill * 4;

      comumBtn.classList.toggle('is-active', state.fuel === 'comum');
      aditivadaBtn.classList.toggle('is-active', state.fuel === 'aditivada');
      litersOut.textContent = state.liters;
      pointsFillOut.textContent = pointsPerFill;
      Array.prototype.forEach.call(pointsMonthOut, function (el) { el.textContent = balance; });

      var unlocked = rewards.filter(function (r) { return r.p <= balance; }).sort(function (a, b) { return b.p - a.p; });
      var nextTarget = rewards.filter(function (r) { return r.p > balance; }).sort(function (a, b) { return a.p - b.p; })[0] || null;
      var nextUp = rewards.filter(function (r) { return r.p > balance; }).sort(function (a, b) { return a.p - b.p; }).slice(0, 3);

      nextBox.hidden = !nextTarget;
      if (nextTarget) {
        nextName.textContent = nextTarget.n;
        nextMissing.textContent = 'faltam ' + (nextTarget.p - balance) + ' pts';
        nextBar.style.width = Math.max(4, Math.min(100, Math.round((balance / nextTarget.p) * 100))) + '%';
      }

      unlockedCountEl.textContent = unlocked.length === 1 ? '1 prêmio disponível' : unlocked.length + ' prêmios disponíveis';
      rewardsGrid.hidden = unlocked.length === 0;
      noRewardsEl.hidden = unlocked.length !== 0;

      rewardsGrid.innerHTML = '';
      unlocked.forEach(function (r, i) {
        var card = document.createElement('div');
        card.className = 'reward-card' + (i === 0 ? ' is-top' : '');
        var photoHtml = REWARDS_WITHOUT_PHOTO[r.slot]
          ? '<div class="reward-photo is-empty">' + r.n + '</div>'
          : '<div class="reward-photo"><img src="assets/img/slots/' + r.slot + '.webp" alt=""></div>';
        card.innerHTML = photoHtml +
          '<div class="reward-body">' +
          '<span class="reward-name"></span>' +
          '<span class="reward-cat"></span>' +
          '<span class="reward-pts"></span>' +
          '</div>';
        card.querySelector('.reward-name').textContent = r.n;
        card.querySelector('.reward-cat').textContent = r.c;
        card.querySelector('.reward-pts').textContent = r.p + ' pontos';
        rewardsGrid.appendChild(card);
      });

      nextUpBox.hidden = nextUp.length === 0;
      nextUpGrid.innerHTML = '';
      nextUp.forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'next-reward-row';
        row.innerHTML = '<span></span><span></span>';
        row.children[0].textContent = r.n;
        row.children[1].textContent = 'faltam ' + (r.p - balance) + ' pts';
        nextUpGrid.appendChild(row);
      });
    }

    comumBtn.addEventListener('click', function () { state.fuel = 'comum'; render(); });
    aditivadaBtn.addEventListener('click', function () { state.fuel = 'aditivada'; render(); });
    slider.addEventListener('input', function (e) { state.liters = Number(e.target.value); render(); });

    render();
  }

  /* ---------- Dúvidas: acordeão de perguntas ---------- */
  function initFaqAccordion() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
    if (!items.length) return;

    // Liga pergunta e resposta para o leitor de tela saber o que abriu/fechou.
    items.forEach(function (item, i) {
      var btn = item.querySelector('.faq-q');
      var resp = item.querySelector('.faq-a');
      var idResp = 'faq-resposta-' + (i + 1);
      resp.id = idResp;
      resp.setAttribute('role', 'region');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', idResp);
      btn.id = 'faq-pergunta-' + (i + 1);
      resp.setAttribute('aria-labelledby', btn.id);
      item.querySelector('.faq-symbol').setAttribute('aria-hidden', 'true');
    });

    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var symbol = item.querySelector('.faq-symbol');
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.faq-symbol').textContent = '+';
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          symbol.textContent = '−';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Acessibilidade dos leques de fotos ---------- */
  // As fotos são clicáveis; para quem usa teclado, viram botões de verdade.
  function initFotosTeclado() {
    var grupos = [
      { sel: '.foto-fan img', rotulo: 'Ver foto' },
      { sel: '.estrutura-photo-fan img', rotulo: 'Ampliar foto' }
    ];
    grupos.forEach(function (g) {
      var imgs = Array.prototype.slice.call(document.querySelectorAll(g.sel));
      imgs.forEach(function (img, i) {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', g.rotulo + ' ' + (i + 1) + ' de ' + imgs.length +
          (img.alt ? ': ' + img.alt : ''));
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); img.click(); }
        });
      });
    });
  }

  /* ---------- Parcerias: formulário de contato ---------- */
  function initPartnershipForm() {
    var form = document.querySelector('[data-partnership-form]');
    if (!form) return;
    var confirmBox = document.querySelector('[data-form-confirm]');
    var errorEl = form.querySelector('[data-form-error]');
    var submitBtn = form.querySelector('[data-form-submit]');
    var mailFallback = confirmBox.querySelector('[data-mail-fallback]');
    var mailLink = confirmBox.querySelector('[data-mail-link]');
    var confirmTitle = confirmBox.querySelector('[data-confirm-title]');
    var confirmText = confirmBox.querySelector('[data-confirm-text]');
    var resetBtn = confirmBox.querySelector('[data-form-reset]');

    function showConfirm(sentByServer, mailtoHref) {
      form.hidden = true;
      confirmBox.hidden = false;
      confirmTitle.textContent = sentByServer ? 'Proposta enviada' : 'Quase pronto';
      confirmText.textContent = sentByServer
        ? 'Sua proposta chegou na caixa de entrada do posto. Nossa equipe vai analisar e entrar em contato pelo canal informado.'
        : 'Não conseguimos enviar automaticamente, então abrimos seu programa de e-mail com a proposta já preenchida — basta confirmar o envio. Se preferir, chame no WhatsApp.';
      mailFallback.hidden = sentByServer;
      if (mailtoHref) mailLink.href = mailtoHref;
    }

    resetBtn.addEventListener('click', function () {
      form.reset();
      form.hidden = false;
      confirmBox.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value, company: form.company.value, email: form.email.value,
        phone: form.phone.value, type: form.type.value, message: form.message.value
      };
      if (!data.name || !data.email || !data.phone || !data.type || !data.message) {
        errorEl.hidden = false;
        errorEl.textContent = 'Preencha todos os campos obrigatórios.';
        return;
      }
      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';

      fetch('https://formsubmit.co/ajax/joaopneo@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Proposta de parceria — ' + (data.company || data.name),
          _template: 'table',
          _captcha: 'false',
          Nome: data.name,
          Empresa: data.company || '—',
          'E-mail': data.email,
          'Telefone/WhatsApp': data.phone,
          'Tipo de parceria': data.type,
          Mensagem: data.message,
          Origem: 'Site Posto Neópolis — página Parcerias'
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || 'HTTP ' + res.status);
          showConfirm(true, null);
        });
      }).catch(function (err) {
        console.warn('Envio automático falhou, usando e-mail do visitante:', err);
        var body = [
          'Nome: ' + data.name, 'Empresa: ' + (data.company || '—'), 'E-mail: ' + data.email,
          'Telefone/WhatsApp: ' + data.phone, 'Tipo de parceria: ' + data.type, '', 'Mensagem:', data.message,
          '', '— Enviado pelo site do Posto Neópolis'
        ].join('\n');
        var href = 'mailto:joaopneo@gmail.com'
          + '?subject=' + encodeURIComponent('Proposta de parceria — ' + (data.company || data.name))
          + '&body=' + encodeURIComponent(body);
        window.location.href = href;
        showConfirm(false, href);
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar proposta de parceria';
      });
    });
  }

  /* ---------- Agendamento de troca de óleo ---------- */
  // O posto abre todos os dias das 6h às 22h. Os horários oferecidos ficam
  // dentro dessa janela; a confirmação final é feita pela equipe no WhatsApp.
  var AG_ABRE = 7;          // primeiro horário oferecido
  var AG_FECHA = 20;        // último horário oferecido
  var AG_DIAS_A_FRENTE = 14;
  var AG_ANTECEDENCIA_H = 2; // não oferece horário daqui a menos de 2h

  var DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'quinta-feira', 'sexta-feira', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function rotuloDoDia(d, hoje) {
    var base = DIAS_SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
    var diff = Math.round((d - hoje) / 86400000);
    if (diff === 0) return 'Hoje · ' + base;
    if (diff === 1) return 'Amanhã · ' + base;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  function initAgendamento() {
    var form = document.querySelector('[data-agendar-form]');
    if (!form) return;

    var selDia = form.querySelector('[data-agendar-dia]');
    var selHora = form.querySelector('[data-agendar-hora]');
    var hint = form.querySelector('[data-agendar-hint]');
    var erro = form.querySelector('[data-agendar-error]');
    var rVeiculo = document.querySelector('[data-r-veiculo]');
    var rDia = document.querySelector('[data-r-dia]');
    var rHora = document.querySelector('[data-r-hora]');
    var rExtras = document.querySelector('[data-r-extras]');

    var agora = new Date();
    var hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    // Preenche os próximos dias.
    for (var i = 0; i < AG_DIAS_A_FRENTE; i++) {
      var d = new Date(hoje.getTime() + i * 86400000);
      var opt = document.createElement('option');
      opt.value = d.toISOString().slice(0, 10);
      opt.textContent = rotuloDoDia(d, hoje);
      selDia.appendChild(opt);
    }

    // Horários disponíveis mudam conforme o dia escolhido: hoje já não dá
    // para agendar um horário que passou.
    function preencherHoras() {
      var escolhido = selDia.value;
      var ehHoje = escolhido === hoje.toISOString().slice(0, 10);
      var minima = ehHoje ? agora.getHours() + AG_ANTECEDENCIA_H : AG_ABRE;

      selHora.innerHTML = '';
      var disponiveis = 0;
      for (var h = AG_ABRE; h <= AG_FECHA; h++) {
        if (h < minima) continue;
        var o = document.createElement('option');
        o.value = ('0' + h).slice(-2) + ':00';
        o.textContent = ('0' + h).slice(-2) + ':00';
        selHora.appendChild(o);
        disponiveis++;
      }

      if (disponiveis === 0) {
        var vazio = document.createElement('option');
        vazio.value = '';
        vazio.textContent = 'Sem horário disponível neste dia';
        selHora.appendChild(vazio);
        hint.textContent = 'Já passou do último horário de hoje. Escolha outro dia.';
        hint.hidden = false;
      } else if (ehHoje) {
        hint.textContent = 'Para hoje, mostramos horários com pelo menos ' + AG_ANTECEDENCIA_H + 'h de antecedência.';
        hint.hidden = false;
      } else {
        hint.hidden = true;
      }
      atualizarResumo();
    }

    function extrasSelecionados() {
      return [].slice.call(form.querySelectorAll('input[name="extra"]:checked'))
        .map(function (c) { return c.value; });
    }

    function atualizarResumo() {
      var veiculo = form.nome && form.veiculo ? form.veiculo.value.trim() : '';
      rVeiculo.textContent = veiculo || '—';
      rDia.textContent = selDia.options[selDia.selectedIndex] ? selDia.options[selDia.selectedIndex].textContent : '—';
      rHora.textContent = selHora.value || '—';
      var ex = extrasSelecionados();
      rExtras.textContent = ex.length ? 'Troca de óleo + ' + ex.join(', ') : 'Troca de óleo';
    }

    selDia.addEventListener('change', preencherHoras);
    selHora.addEventListener('change', atualizarResumo);
    form.addEventListener('input', atualizarResumo);
    form.addEventListener('change', atualizarResumo);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.nome.value.trim();
      var veiculo = form.veiculo.value.trim();

      if (!nome || !veiculo || !selHora.value) {
        erro.hidden = false;
        erro.textContent = !selHora.value
          ? 'Escolha um dia com horário disponível.'
          : 'Preencha seu nome e o veículo para continuar.';
        (!nome ? form.nome : !veiculo ? form.veiculo : selDia).focus();
        return;
      }
      erro.hidden = true;

      var ex = extrasSelecionados();
      var obs = form.obs.value.trim();
      var linhas = [
        'Olá! Gostaria de agendar uma troca de óleo.',
        '',
        'Nome: ' + nome,
        'Veículo: ' + veiculo,
        'Dia: ' + selDia.options[selDia.selectedIndex].textContent,
        'Horário: ' + selHora.value,
        'Serviços: ' + (ex.length ? 'Troca de óleo, ' + ex.join(', ') : 'Troca de óleo')
      ];
      if (obs) linhas.push('Observação: ' + obs);
      linhas.push('', '— Enviado pelo site do Posto Neópolis');

      window.open('https://wa.me/5584991801090?text=' + encodeURIComponent(linhas.join('\n')),
        '_blank', 'noopener');
    });

    preencherHoras();
  }

  /* ---------- Depoimentos e redes sociais ---------- */
  // A lista fica em assets/js/data-avaliacoes.js. Sem avaliações cadastradas,
  // a seção mostra só os atalhos para o Google e o Instagram.
  function initDepoimentos() {
    var wrap = document.querySelector('[data-depoimentos]');
    if (!wrap) return;
    var lista = wrap.querySelector('[data-depoimentos-lista]');
    var vazio = wrap.querySelector('[data-depoimentos-vazio]');
    var dados = window.NPL_AVALIACOES || [];

    if (!dados.length) {
      lista.hidden = true;
      if (vazio) vazio.hidden = false;
      return;
    }
    if (vazio) vazio.hidden = true;
    lista.hidden = false;

    dados.forEach(function (av) {
      var notaInt = Math.max(0, Math.min(5, Math.round(av.nota || 5)));
      var card = document.createElement('figure');
      card.className = 'depoimento-card';
      card.innerHTML =
        '<div class="depoimento-estrelas" role="img"></div>' +
        '<blockquote class="depoimento-texto"></blockquote>' +
        '<figcaption class="depoimento-autor"></figcaption>';
      var estrelas = card.querySelector('.depoimento-estrelas');
      estrelas.textContent = '★★★★★'.slice(0, notaInt) + '☆☆☆☆☆'.slice(0, 5 - notaInt);
      estrelas.setAttribute('aria-label', notaInt + ' de 5 estrelas');
      card.querySelector('.depoimento-texto').textContent = '“' + (av.texto || '') + '”';
      card.querySelector('.depoimento-autor').textContent = av.autor || 'Cliente';
      lista.appendChild(card);
    });
  }

  function start() {
    initHeader();
    initMobileMenu();
    initFooter();
    initFotoFan();
    initHomeHero();
    initEstruturaGallery();
    initProductCatalog();
    initClubSimulator();
    initFaqAccordion();
    initPartnershipForm();
    initFotosTeclado();
    initAgendamento();
    initDepoimentos();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
