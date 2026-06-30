/* Arab Eyes Center – AI Chatbot Widget
   Agent: DigitalOcean GenAI (eyes-agent)
   ================================================ */
(function () {
  'use strict';

  /* ─── Config ──────────────────────────────────────────── */
  var ENDPOINT = 'https://ohklhox7jkpmzxqa5wiymg5k.agents.do-ai.run/api/v1/chat/completions';
  var API_KEY  = 'O2rftCnU5R5fk8C_DLbYpJqKxPT7QSOD';

  /* ─── State ───────────────────────────────────────────── */
  var history   = [];
  var streaming = false;
  var opened    = false;

  /* ─── Helpers ─────────────────────────────────────────── */
  function lang()       { return document.documentElement.getAttribute('lang') || 'ar'; }
  function t(ar, en)    { return lang() === 'ar' ? ar : en; }
  function isRtl()      { return document.documentElement.getAttribute('dir') !== 'ltr'; }

  /* ─── DOM refs ────────────────────────────────────────── */
  var panel, msgArea, input, sendBtn, fab;

  /* ─── Eye SVG (small, for bot avatar) ────────────────── */
  var EYE_SVG =
    '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<ellipse cx="10" cy="10" rx="8" ry="5.2" stroke="white" stroke-width="1.6"/>' +
    '<circle cx="10" cy="10" r="2.6" fill="white"/>' +
    '<circle cx="10" cy="10" r="1.15" fill="#125352"/>' +
    '</svg>';

  /* ─── Inject panel HTML ───────────────────────────────── */
  function injectPanel() {
    var el = document.createElement('div');
    el.id = 'ai-panel';
    el.className = 'ai-panel';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', t('مساعد عيون العرب', 'Arab Eyes Assistant'));
    el.setAttribute('hidden', '');

    el.innerHTML =
      '<div class="ai-panel-header">' +
        '<div class="ai-panel-brand">' +
          '<div class="ai-panel-avatar">' +
            '<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<ellipse cx="14" cy="14" rx="11" ry="7.5" stroke="white" stroke-width="2"/>' +
            '<circle cx="14" cy="14" r="3.8" fill="white"/>' +
            '<circle cx="14" cy="14" r="1.7" fill="#125352"/>' +
            '<path d="M20 7l1.5-1.5M8 7L6.5 5.5M20 21l1.5 1.5M8 21l-1.5 1.5" stroke="rgba(255,255,255,0.55)" stroke-width="1.4" stroke-linecap="round"/>' +
            '</svg>' +
          '</div>' +
          '<div class="ai-panel-info">' +
            '<div class="ai-panel-name">' +
              '<span class="acp-ar">مساعد عيون العرب</span>' +
              '<span class="acp-en">Arab Eyes Assistant</span>' +
            '</div>' +
            '<div class="ai-panel-status">' +
              '<span class="ai-status-dot"></span>' +
              '<span class="acp-ar">ذكاء اصطناعي • متاح الآن</span>' +
              '<span class="acp-en">AI Powered • Online</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="ai-panel-close" id="ai-panel-close" aria-label="' + t('إغلاق', 'Close') + '">' +
          '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15 5L5 15M5 5l10 10" stroke="white" stroke-width="2.2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>' +

      '<div class="ai-messages" id="ai-messages"></div>' +

      '<div class="ai-input-bar">' +
        '<input class="ai-input" id="ai-input" type="text" autocomplete="off" ' +
          'placeholder="' + t('اكتب سؤالك هنا...', 'Type your question...') + '" ' +
          'placeholder-ar="اكتب سؤالك هنا..." placeholder-en="Type your question..." />' +
        '<button class="ai-send" id="ai-send" aria-label="' + t('إرسال', 'Send') + '">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
          '<path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>';

    document.body.appendChild(el);
    panel   = el;
    msgArea = document.getElementById('ai-messages');
    input   = document.getElementById('ai-input');
    sendBtn = document.getElementById('ai-send');

    document.getElementById('ai-panel-close').addEventListener('click', closePanel);
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    /* close on backdrop click */
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
        closePanel();
      }
    });

    /* re-apply lang on HTML attr change */
    var mo = new MutationObserver(applyLang);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  }

  /* ─── Wire FAB button ─────────────────────────────────── */
  function wireFab() {
    fab = document.getElementById('ai-fab');
    if (fab) fab.addEventListener('click', togglePanel);
  }

  /* ─── Language ────────────────────────────────────────── */
  function applyLang() {
    var l = lang();
    panel.querySelectorAll('.acp-ar').forEach(function (el) { el.style.display = l === 'ar' ? '' : 'none'; });
    panel.querySelectorAll('.acp-en').forEach(function (el) { el.style.display = l === 'en' ? '' : 'none'; });
    input.placeholder = l === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...';
    panel.setAttribute('aria-label', t('مساعد عيون العرب', 'Arab Eyes Assistant'));
    positionPanel();
  }

  /* ─── Panel position (RTL/LTR) ───────────────────────── */
  function positionPanel() {
    var rtl = isRtl();
    panel.style.left  = rtl ? '1.5rem' : 'auto';
    panel.style.right = rtl ? 'auto'   : '1.5rem';
  }

  /* ─── Open / close ────────────────────────────────────── */
  function openPanel() {
    applyLang();
    panel.removeAttribute('hidden');
    requestAnimationFrame(function () { panel.classList.add('ai-panel--open'); });
    if (!opened) { addWelcome(); opened = true; }
    scrollBottom();
    setTimeout(function () { input.focus(); }, 320);
    if (fab) fab.classList.add('ai-fab--active');
  }

  function closePanel() {
    panel.classList.remove('ai-panel--open');
    if (fab) fab.classList.remove('ai-fab--active');
    setTimeout(function () { panel.setAttribute('hidden', ''); }, 310);
  }

  function togglePanel() {
    if (panel.hasAttribute('hidden') || !panel.classList.contains('ai-panel--open')) openPanel();
    else closePanel();
  }

  /* ─── Welcome message ─────────────────────────────────── */
  function addWelcome() {
    var ar = 'مرحباً! 👋\nأنا المساعد الذكي لمركز عيون العرب. كيف أقدر أساعدك اليوم؟\n\nيمكنك سؤالي عن:\n• خدماتنا الطبية (ليزر، قرنية، ساد، شبكية…)\n• مواعيد الدوام\n• الأطباء المتخصصين\n• طريقة حجز موعد';
    var en = 'Hello! 👋\nI\'m the AI assistant for Arab Eyes Center. How can I help you today?\n\nYou can ask me about:\n• Our medical services (laser, cornea, cataract, retina…)\n• Working hours\n• Our specialist doctors\n• How to book an appointment';
    appendBotBubble(t(ar, en));
  }

  /* ─── Bubble builders ─────────────────────────────────── */
  function appendBotBubble(text) {
    var wrap = document.createElement('div');
    wrap.className = 'ai-msg ai-msg--bot';

    var avatar = document.createElement('div');
    avatar.className = 'ai-bot-avatar';
    avatar.innerHTML = EYE_SVG;

    var bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    setFormattedText(bubble, text);

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    msgArea.appendChild(wrap);
    scrollBottom();
    return bubble;
  }

  function appendUserBubble(text) {
    var wrap = document.createElement('div');
    wrap.className = 'ai-msg ai-msg--user';

    var bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.textContent = text;

    wrap.appendChild(bubble);
    msgArea.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    var wrap = document.createElement('div');
    wrap.className = 'ai-msg ai-msg--bot';
    wrap.id = 'ai-typing';

    var avatar = document.createElement('div');
    avatar.className = 'ai-bot-avatar';
    avatar.innerHTML = EYE_SVG;

    var bubble = document.createElement('div');
    bubble.className = 'ai-bubble ai-typing-dots';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    msgArea.appendChild(wrap);
    scrollBottom();
  }

  function hideTyping() {
    var el = document.getElementById('ai-typing');
    if (el) el.remove();
  }

  function setFormattedText(el, text) {
    el.innerHTML = '';
    text.split('\n').forEach(function (line, i) {
      if (i > 0) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(line));
    });
  }

  function scrollBottom() {
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  /* ─── Send ────────────────────────────────────────────── */
  function send() {
    if (streaming) return;
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendUserBubble(text);
    history.push({ role: 'user', content: text });
    callAgent();
  }

  /* ─── Stream from DO AI agent ─────────────────────────── */
  function callAgent() {
    streaming = true;
    sendBtn.disabled = true;
    input.disabled   = true;
    showTyping();

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({ messages: history, stream: true })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);

      hideTyping();
      var botBubble = appendBotBubble('');
      var fullText  = '';
      var buf       = '';
      var decoder   = new TextDecoder();
      var reader    = res.body.getReader();

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            history.push({ role: 'assistant', content: fullText });
            finish();
            return;
          }

          buf += decoder.decode(chunk.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();

          lines.forEach(function (raw) {
            var line = raw.trim();
            if (!line.startsWith('data:')) return;
            var payload = line.slice(5).trim();
            if (payload === '[DONE]') return;
            try {
              var j     = JSON.parse(payload);
              var delta = ((j.choices || [])[0] || {});
              var piece = (delta.delta || delta.message || {}).content || '';
              if (piece) {
                fullText += piece;
                setFormattedText(botBubble, fullText);
                scrollBottom();
              }
            } catch (_) { /* partial chunk — wait for next */ }
          });

          return pump();
        });
      }

      return pump();
    })
    .catch(function (err) {
      hideTyping();
      appendBotBubble(t(
        'عذرًا، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى أو التواصل معنا على 06 505 0660.',
        'Sorry, a connection error occurred. Please try again or call us at 06 505 0660.'
      ));
      console.error('[AEC Chatbot]', err);
      finish();
    });
  }

  function finish() {
    streaming        = false;
    sendBtn.disabled = false;
    input.disabled   = false;
    input.focus();
    scrollBottom();
  }

  /* ─── Boot ────────────────────────────────────────────── */
  function init() {
    injectPanel();
    wireFab();
    applyLang();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
