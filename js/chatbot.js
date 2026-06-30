/* Arab Eyes Center – AI Chatbot Widget */
(function () {
  'use strict';

  var ENDPOINT = 'https://ohklhox7jkpmzxqa5wiymg5k.agents.do-ai.run/api/v1/chat/completions';
  var API_KEY  = 'O2rftCnU5R5fk8C_DLbYpJqKxPT7QSOD';

  var history   = [];
  var streaming = false;
  var welcomed  = false;

  function getLang() { return document.documentElement.getAttribute('lang') || 'ar'; }
  function t(ar, en) { return getLang() === 'ar' ? ar : en; }
  function isRtl()   { return document.documentElement.getAttribute('dir') !== 'ltr'; }

  var panel, msgArea, inputEl, sendBtn, fabBtn;

  var EYE_AVATAR =
    '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="10" cy="10" rx="8" ry="5.2" stroke="white" stroke-width="1.6"/>' +
    '<circle cx="10" cy="10" r="2.6" fill="white"/>' +
    '<circle cx="10" cy="10" r="1.15" fill="#125352"/>' +
    '</svg>';

  /* ── Build panel ─────────────────────────────────────── */
  function buildPanel() {
    panel = document.createElement('div');
    panel.id        = 'ai-panel';
    panel.className = 'ai-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    /* Header */
    var header = document.createElement('div');
    header.className = 'ai-panel-header';
    header.innerHTML =
      '<div class="ai-panel-brand">' +
        '<div class="ai-panel-avatar">' +
          '<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<ellipse cx="14" cy="14" rx="11" ry="7.5" stroke="white" stroke-width="2"/>' +
          '<circle cx="14" cy="14" r="3.8" fill="white"/>' +
          '<circle cx="14" cy="14" r="1.7" fill="#125352"/>' +
          '</svg>' +
        '</div>' +
        '<div class="ai-panel-info">' +
          '<div class="ai-panel-name">' +
            '<span class="acl-ar">مساعد عيون العرب</span>' +
            '<span class="acl-en">Arab Eyes Assistant</span>' +
          '</div>' +
          '<div class="ai-panel-status">' +
            '<span class="ai-status-dot"></span>' +
            '<span class="acl-ar">ذكاء اصطناعي • متاح الآن</span>' +
            '<span class="acl-en">AI Powered • Online</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<button class="ai-panel-close" id="ai-close-btn" aria-label="Close">' +
        '<svg viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="white" stroke-width="2.2" stroke-linecap="round"/></svg>' +
      '</button>';

    /* Messages */
    msgArea = document.createElement('div');
    msgArea.id        = 'ai-messages';
    msgArea.className = 'ai-messages';

    /* Input bar */
    var bar = document.createElement('div');
    bar.className = 'ai-input-bar';

    inputEl = document.createElement('input');
    inputEl.type          = 'text';
    inputEl.className     = 'ai-input';
    inputEl.autocomplete  = 'off';
    inputEl.placeholder   = t('اكتب سؤالك هنا...', 'Type your question...');

    sendBtn = document.createElement('button');
    sendBtn.className  = 'ai-send';
    sendBtn.setAttribute('aria-label', 'Send');
    sendBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none">' +
      '<path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';

    bar.appendChild(inputEl);
    bar.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(msgArea);
    panel.appendChild(bar);
    document.body.appendChild(panel);

    /* Listeners */
    document.getElementById('ai-close-btn').addEventListener('click', closePanel);
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    /* Language watcher */
    new MutationObserver(syncLang).observe(
      document.documentElement,
      { attributes: true, attributeFilter: ['lang', 'dir'] }
    );

    syncLang();
    positionPanel();
  }

  /* ── Language sync ───────────────────────────────────── */
  function syncLang() {
    var l = getLang();
    panel.querySelectorAll('.acl-ar').forEach(function (el) { el.style.display = l === 'ar' ? '' : 'none'; });
    panel.querySelectorAll('.acl-en').forEach(function (el) { el.style.display = l === 'en' ? '' : 'none'; });
    inputEl.placeholder = l === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...';
    positionPanel();
  }

  /* ── Position (RTL / LTR) ────────────────────────────── */
  function positionPanel() {
    if (isRtl()) { panel.style.left = '1.5rem'; panel.style.right = 'auto'; }
    else          { panel.style.right = '1.5rem'; panel.style.left = 'auto'; }
  }

  /* ── Open / close ────────────────────────────────────── */
  function openPanel() {
    positionPanel();
    panel.classList.add('ai-panel--open');
    fabBtn.classList.add('ai-fab--active');
    if (!welcomed) { addWelcome(); welcomed = true; }
    scrollBottom();
    setTimeout(function () { inputEl.focus(); }, 50);
  }

  function closePanel() {
    panel.classList.remove('ai-panel--open');
    fabBtn.classList.remove('ai-fab--active');
  }

  function togglePanel() {
    if (panel.classList.contains('ai-panel--open')) closePanel();
    else openPanel();
  }

  /* ── Welcome ─────────────────────────────────────────── */
  function addWelcome() {
    var ar = 'مرحباً! 👋\nأنا المساعد الذكي لمركز عيون العرب.\nكيف أقدر أساعدك اليوم؟\n\n• خدماتنا الطبية (ليزر، قرنية، ساد، شبكية)\n• مواعيد الدوام والحجوزات\n• الأطباء المتخصصين';
    var en = 'Hello! 👋\nI\'m the AI assistant for Arab Eyes Center.\nHow can I help you today?\n\n• Medical services (laser, cornea, cataract, retina)\n• Working hours & appointments\n• Our specialist doctors';
    addBotBubble(t(ar, en));
  }

  /* ── Message builders ────────────────────────────────── */
  function addBotBubble(text) {
    var row    = document.createElement('div');
    row.className = 'ai-msg ai-msg--bot';

    var avatar = document.createElement('div');
    avatar.className  = 'ai-bot-avatar';
    avatar.innerHTML  = EYE_AVATAR;

    var bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    renderText(bubble, text);

    row.appendChild(avatar);
    row.appendChild(bubble);
    msgArea.appendChild(row);
    scrollBottom();
    return bubble;
  }

  function addUserBubble(text) {
    var row    = document.createElement('div');
    row.className = 'ai-msg ai-msg--user';

    var bubble = document.createElement('div');
    bubble.className  = 'ai-bubble';
    bubble.textContent = text;

    row.appendChild(bubble);
    msgArea.appendChild(row);
    scrollBottom();
  }

  function addTypingIndicator() {
    var row    = document.createElement('div');
    row.id        = 'ai-typing';
    row.className = 'ai-msg ai-msg--bot';

    var avatar = document.createElement('div');
    avatar.className = 'ai-bot-avatar';
    avatar.innerHTML = EYE_AVATAR;

    var bubble = document.createElement('div');
    bubble.className = 'ai-bubble ai-typing-dots';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    row.appendChild(avatar);
    row.appendChild(bubble);
    msgArea.appendChild(row);
    scrollBottom();
  }

  function removeTypingIndicator() {
    var el = document.getElementById('ai-typing');
    if (el) el.parentNode.removeChild(el);
  }

  function renderText(el, text) {
    el.innerHTML = '';
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i > 0) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(lines[i]));
    }
  }

  function scrollBottom() {
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  /* ── Send ────────────────────────────────────────────── */
  function sendMessage() {
    if (streaming) return;
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addUserBubble(text);
    history.push({ role: 'user', content: text });
    callAgent();
  }

  /* ── API streaming ───────────────────────────────────── */
  function callAgent() {
    streaming        = true;
    sendBtn.disabled = true;
    inputEl.disabled = true;
    addTypingIndicator();

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
      body: JSON.stringify({ messages: history, stream: true })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      removeTypingIndicator();

      var botBubble = addBotBubble('');
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
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line.startsWith('data:')) continue;
            var raw = line.slice(5).trim();
            if (raw === '[DONE]') continue;
            try {
              var json  = JSON.parse(raw);
              var delta = ((json.choices || [])[0] || {});
              var piece = (delta.delta || delta.message || {}).content || '';
              if (piece) { fullText += piece; renderText(botBubble, fullText); scrollBottom(); }
            } catch (_) {}
          }
          return pump();
        });
      }
      return pump();
    })
    .catch(function (err) {
      removeTypingIndicator();
      addBotBubble(t(
        'عذرًا، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى أو الاتصال بنا على 06 505 0660.',
        'Sorry, a connection error occurred. Please try again or call us at 06 505 0660.'
      ));
      console.error('[AEC Chatbot]', err);
      finish();
    });
  }

  function finish() {
    streaming        = false;
    sendBtn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
    scrollBottom();
  }

  /* ── Boot ────────────────────────────────────────────── */
  function init() {
    buildPanel();
    fabBtn = document.getElementById('ai-fab');
    if (fabBtn) {
      fabBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        togglePanel();
      });
    }
    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (
        panel.classList.contains('ai-panel--open') &&
        !panel.contains(e.target) &&
        fabBtn && !fabBtn.contains(e.target)
      ) {
        closePanel();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
