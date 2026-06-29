/* Arab Eyes Center – Main JS */
(function () {
  'use strict';

  var STORAGE_KEY = 'aec-lang';
  var DEFAULT_LANG = 'ar';
  var currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  var toastWrap;   /* D: cached once in injectUI, shared with showToast */

  /* ── Apply language ──────────────────────────────────── */
  function applyLanguage(lang) {
    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-ar][data-en]').forEach(function (el) {
      if (!el.querySelector('[data-ar]')) el.textContent = el.dataset[lang];
    });

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    var fb = document.querySelector('.float-book');
    if (fb) fb.textContent = lang === 'ar' ? 'احجز موعداً' : 'Book Appointment';

    var nb = document.querySelector('.nav-book-btn');
    if (nb) nb.textContent = lang === 'ar' ? 'احجز موعد' : 'Book Now';

    var sWa = document.querySelector('.scta-wa');
    if (sWa) sWa.innerHTML = '💬&nbsp;' + (lang === 'ar' ? 'واتساب' : 'WhatsApp');

    var sk = document.querySelector('.skip-link');
    if (sk) sk.textContent = lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content';

    var st = document.querySelector('.scroll-top');
    if (st) st.setAttribute('aria-label', lang === 'ar' ? 'للأعلى' : 'Back to top');

    var abt = document.querySelector('.announce-bar-text');
    if (abt) {
      abt.innerHTML = lang === 'ar'
        ? '🏥&nbsp;أحدث جهاز تصحيح نظر في الأردن 2026 — <a href="contact.html">احجز استشارتك الآن</a>'
        : '🏥&nbsp;Jordan\'s latest laser vision device 2026 — <a href="contact.html">Book your free consultation</a>';
    }

    document.querySelectorAll('[placeholder-ar][placeholder-en]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute('placeholder-' + lang));
    });

    localStorage.setItem(STORAGE_KEY, lang);
    currentLang = lang;
  }

  /* ── Inject persistent UI elements ──────────────────── */
  function injectUI() {

    /* 4. Scroll progress bar */
    var prog = document.createElement('div');
    prog.className = 'scroll-progress';
    document.body.appendChild(prog);

    /* Skip link */
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main-content';
    skip.textContent = currentLang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);

    /* Announce bar */
    var ab = document.createElement('div');
    ab.className = 'announce-bar';
    ab.setAttribute('role', 'alert');
    ab.innerHTML = '<span class="announce-bar-text"></span>' +
      '<button class="announce-close" aria-label="Close">&times;</button>';
    document.body.insertBefore(ab, skip.nextSibling);
    if (sessionStorage.getItem('aec-ann-dismissed')) ab.classList.add('aec-hidden');
    ab.querySelector('.announce-close').addEventListener('click', function () {
      ab.classList.add('aec-hidden');
      sessionStorage.setItem('aec-ann-dismissed', '1');
    });

    /* Scroll to top button */
    var st = document.createElement('button');
    st.className = 'scroll-top';
    st.setAttribute('aria-label', currentLang === 'ar' ? 'للأعلى' : 'Back to top');
    st.innerHTML = '&#9650;';
    document.body.appendChild(st);
    st.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* Sticky mobile CTA bar */
    var bar = document.createElement('div');
    bar.className = 'sticky-cta-bar aec-hidden';
    bar.innerHTML =
      '<a href="tel:0665050660" class="scta-call">📞&nbsp;06 5050660</a>' +
      '<a href="https://wa.me/962777950660" class="scta-wa" target="_blank" rel="noopener">💬&nbsp;واتساب</a>';
    document.body.appendChild(bar);

    /* 3. Toast container — D: stored at module level for showToast */
    toastWrap = document.createElement('div');
    toastWrap.className = 'toast-wrap';
    document.body.appendChild(toastWrap);

    var navbar      = document.querySelector('.navbar');
    var floatingWrap = document.querySelector('.floating-wrap');

    /* A: cache layout-read values; refresh only on resize, not every scroll */
    var docH  = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var isMob = window.innerWidth <= 768;
    window.addEventListener('resize', function () {
      docH  = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      isMob = window.innerWidth <= 768;
    }, { passive: true });

    /* B: single scroll listener for all scroll-driven behaviours */
    window.addEventListener('scroll', function () {
      var sy = window.scrollY;

      /* 4. Scroll progress */
      if (docH > 0) prog.style.width = (sy / docH * 100) + '%';

      /* 8. Navbar shrink/shadow */
      if (navbar) navbar.classList.toggle('scrolled', sy > 40);

      /* Scroll-to-top button */
      st.classList.toggle('visible', sy > 350);

      /* Sticky CTA bar (mobile only) */
      var show = isMob && sy > 200;
      bar.classList.toggle('aec-hidden', !show);
      if (floatingWrap) floatingWrap.style.bottom = show ? '5.5rem' : '';
    }, { passive: true });
  }

  /* ── 1. Open Now Badge ───────────────────────────────── */
  function initOpenBadge() {
    /* E: use IANA timezone instead of manual UTC arithmetic */
    var jdt  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Amman' }));
    var day  = jdt.getDay();
    var t    = jdt.getHours() * 100 + jdt.getMinutes();
    var open = day !== 5 && t >= 900 && t < 1700;

    /* F: hoist repeated ternaries once */
    var labelAr = open ? 'مفتوح الآن' : 'مغلق';
    var labelEn = open ? 'Open Now'   : 'Closed';

    function makeBadge(id) {
      var b = document.createElement('span');
      b.className = 'open-badge ' + (open ? 'is-open' : 'is-closed');
      b.id = id;
      b.setAttribute('role', 'status');
      b.innerHTML =
        '<span class="open-dot"></span>' +
        '<span class="badge-text lang-ar">' + labelAr + '</span>' +
        '<span class="badge-text lang-en">' + labelEn + '</span>';
      return b;
    }

    var navRight = document.querySelector('.nav-right');
    if (navRight) navRight.prepend(makeBadge('open-badge-nav'));

    var hoursTbl = document.querySelector('.hours-tbl');
    if (hoursTbl) {
      var ciContent = hoursTbl.closest('.ci-content');
      if (ciContent) ciContent.insertBefore(makeBadge('open-badge-hours'), hoursTbl);
    }
  }

  /* ── 2. WhatsApp Greeting Bubble ─────────────────────── */
  function initWAGreeting() {
    if (sessionStorage.getItem('aec-wa-greeted')) return;
    var floatWa      = document.querySelector('.float-wa');
    var floatingWrap = document.querySelector('.floating-wrap');
    if (!floatWa || !floatingWrap) return;

    var bubble = document.createElement('div');
    bubble.className = 'wa-bubble';
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-label', 'رسالة ترحيب / Welcome message');
    bubble.innerHTML =
      '<button class="wa-bubble-close" aria-label="إغلاق">×</button>' +
      '<p class="wa-bubble-from">🟢&nbsp;Arab Eyes Center</p>' +
      '<p class="wa-bubble-msg lang-ar">مرحباً 👋<br>كيف نقدر نساعدك؟<br>تواصل معنا الآن!</p>' +
      '<p class="wa-bubble-msg lang-en">Hello 👋<br>How can we help you?<br>Chat with us now!</p>';

    floatingWrap.insertBefore(bubble, floatWa);

    bubble.querySelector('.wa-bubble-close').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      bubble.classList.remove('visible');
      sessionStorage.setItem('aec-wa-greeted', '1');
    });

    setTimeout(function () { bubble.classList.add('visible'); }, 4000);
  }

  /* ── 3. Toast notification ───────────────────────────── */
  function showToast(icon, arMsg, enMsg) {
    if (!toastWrap) return;   /* D: use cached ref */

    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML =
      '<span class="toast-ico">' + icon + '</span>' +
      '<span class="toast-body">' +
        '<p class="lang-ar">' + arMsg + '</p>' +
        '<p class="lang-en">' + enMsg + '</p>' +
      '</span>' +
      '<div class="toast-progress"></div>';

    toastWrap.appendChild(t);

    /* C: single rAF is sufficient once element is in the DOM */
    requestAnimationFrame(function () { t.classList.add('show'); });

    setTimeout(function () {
      t.classList.remove('show');
      t.classList.add('hide');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 380);
    }, 4000);
  }

  /* ── Counter animation ───────────────────────────────── */
  function initCounters() {
    if (!('IntersectionObserver' in window)) return;
    var counters = document.querySelectorAll('.ctr-num[data-count]');
    if (!counters.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        var el     = entry.target;
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || '';
        var dur    = 1500;
        var start  = performance.now();

        (function step(now) {
          var pct   = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - pct, 3);
          var val   = Math.round(eased * target);
          var disp  = val >= 1000 ? val.toLocaleString('en-US') : val;
          el.innerHTML = disp + '<span class="ctr-suffix">' + suffix + '</span>';
          if (pct < 1) requestAnimationFrame(step);
        }(start));
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { obs.observe(el); });
  }

  /* ── FAQ accordion ───────────────────────────────────── */
  function initFAQ() {
    document.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var item   = this.closest('.faq-item');
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (i) {
          i.classList.remove('open');
          i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── DOMContentLoaded ────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    injectUI();
    applyLanguage(currentLang);
    initCounters();
    initFAQ();
    initOpenBadge();
    initWAGreeting();

    /* Language toggle buttons */
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLanguage(this.dataset.lang); });
    });

    /* Mobile nav toggle */
    var toggle   = document.querySelector('.menu-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
        toggle.classList.toggle('open');
      });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
          toggle.classList.remove('open');
        });
      });
      document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
          toggle.classList.remove('open');
        }
      });
    }

    /* Active nav link */
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
    });

    /* Scroll-reveal for cards & sections — with stagger by grid position */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window && !reduceMotion) {
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll(
        '.service-card,.team-card,.blog-card,.equip-card,.testimonial-card,.cert-card,.ba-card,' +
        '.value-item,.feature-box,.ci-item,.trust-item'
      ).forEach(function (el, i) {
        el.classList.add('reveal');
        /* Stagger within rows — cap so later items aren't too delayed */
        el.style.transitionDelay = (Math.min(i % 4, 3) * 80) + 'ms';
        revObs.observe(el);
      });
    }

    /* Subtle parallax tilt on hero photo (desktop, pointer-fine only) */
    var heroVisual = document.querySelector('.hero-visual');
    var heroPhoto  = document.querySelector('.hero-photo');
    if (heroVisual && heroPhoto && !reduceMotion &&
        window.matchMedia('(pointer:fine)').matches && window.innerWidth > 1100) {
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      heroVisual.addEventListener('mousemove', function (e) {
        var r  = heroVisual.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        var baseY = rtl ? 4 : -4;
        heroPhoto.style.transform =
          'rotateY(' + (baseY + px * 8) + 'deg) rotateX(' + (2 - py * 8) + 'deg)';
      }, { passive: true });
      heroVisual.addEventListener('mouseleave', function () {
        heroPhoto.style.transform = '';
      });
    }

    /* Contact form – WhatsApp redirect + toast confirmation */
    var form = document.querySelector('#contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name    = (form.querySelector('#fname')    || {}).value || '';
        var phone   = (form.querySelector('#fphone')   || {}).value || '';
        var service = (form.querySelector('#fservice') || {}).value || '';
        var msg     = (form.querySelector('#fmsg')     || {}).value || '';
        var isAr    = currentLang === 'ar';
        var text    = isAr
          ? 'مرحباً، أود حجز موعد.\nالاسم: ' + name + '\nالهاتف: ' + phone + '\nالخدمة: ' + service + '\nملاحظات: ' + msg
          : 'Hello, I\'d like to book an appointment.\nName: ' + name + '\nPhone: ' + phone + '\nService: ' + service + '\nNotes: ' + msg;

        showToast(
          '✅',
          'تم إرسال طلبك! سيتواصل معك فريقنا على واتساب قريباً.',
          'Request sent! Our team will reach you on WhatsApp shortly.'
        );

        window.open('https://wa.me/962777950660?text=' + encodeURIComponent(text), '_blank');
      });
    }
  });
})();
