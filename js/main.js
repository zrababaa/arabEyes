/* Arab Eyes Center – Main JS */
(function () {
  'use strict';

  var STORAGE_KEY = 'aec-lang';
  var DEFAULT_LANG = 'ar';
  var currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

  /* ── Apply language ──────────────────────────────────── */
  function applyLanguage(lang) {
    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    /* Update simple text via data-ar / data-en */
    document.querySelectorAll('[data-ar][data-en]').forEach(function (el) {
      if (!el.querySelector('[data-ar]')) {
        el.textContent = el.dataset[lang];
      }
    });

    /* Update lang-toggle button states */
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    /* Update floating book button label */
    var fb = document.querySelector('.float-book');
    if (fb) fb.textContent = lang === 'ar' ? 'احجز موعداً' : 'Book Appointment';

    /* Update nav book btn */
    var nb = document.querySelector('.nav-book-btn');
    if (nb) nb.textContent = lang === 'ar' ? 'احجز موعد' : 'Book Now';

    /* Update sticky CTA bar */
    var sWa = document.querySelector('.scta-wa');
    if (sWa) sWa.innerHTML = '💬&nbsp;' + (lang === 'ar' ? 'واتساب' : 'WhatsApp');

    /* Update skip link */
    var sk = document.querySelector('.skip-link');
    if (sk) sk.textContent = lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content';

    /* Update scroll-top aria-label */
    var st = document.querySelector('.scroll-top');
    if (st) st.setAttribute('aria-label', lang === 'ar' ? 'للأعلى' : 'Back to top');

    /* Update announce bar text */
    var abt = document.querySelector('.announce-bar-text');
    if (abt) {
      abt.innerHTML = lang === 'ar'
        ? '🏥&nbsp;أحدث جهاز تصحيح نظر في الأردن 2026 — <a href="contact.html">احجز استشارتك الآن</a>'
        : '🏥&nbsp;Jordan\'s latest laser vision device 2026 — <a href="contact.html">Book your free consultation</a>';
    }

    /* Update bilingual form placeholders */
    document.querySelectorAll('[placeholder-ar][placeholder-en]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute('placeholder-' + lang));
    });

    localStorage.setItem(STORAGE_KEY, lang);
    currentLang = lang;
  }

  /* ── Inject persistent UI elements ──────────────────── */
  function injectUI() {

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
    /* Insert after skip link */
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

    var floatingWrap = document.querySelector('.floating-wrap');

    window.addEventListener('scroll', function () {
      /* Scroll to top visibility */
      st.classList.toggle('visible', window.scrollY > 350);
      /* Sticky bar on mobile only */
      var isMob = window.innerWidth <= 768;
      var show  = isMob && window.scrollY > 200;
      bar.classList.toggle('aec-hidden', !show);
      if (floatingWrap) {
        floatingWrap.style.bottom = show ? '5.5rem' : '';
      }
    }, { passive: true });
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
        /* Close all open items */
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

    /* Language toggle buttons */
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLanguage(this.dataset.lang);
      });
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

    /* Navbar scroll shadow */
    var navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', function () {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });
    }

    /* Active nav link */
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });

    /* Scroll-reveal for cards */
    if ('IntersectionObserver' in window) {
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
            revObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll(
        '.service-card,.team-card,.blog-card,.equip-card,.testimonial-card,.cert-card,.ba-card'
      ).forEach(function (el) {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity .5s ease, transform .5s ease';
        revObs.observe(el);
      });
    }

    /* Contact form – WhatsApp redirect */
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
        window.open('https://wa.me/962777950660?text=' + encodeURIComponent(text), '_blank');
      });
    }
  });
})();
