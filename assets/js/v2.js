/* =========================================================
   トップページの試作 v2 の動き（pages/_drafts/top-v2.html 専用）
   1. 試作の切り替え（A／B）：?t=a・?t=b、または左下の札
   2. ヒーローの写真の切り替え（間隔は CSS の --slide-time。下の 01〜03 でも切り替え）
   3. 「暮らしに余白」の写真の切り替え
   4. スクロールで現れる（ふわっと・写真の幕・縦書き・見出しの線）
   5. 数字が数え上がる
   6. 固定メニュー：ヒーローを過ぎて、上に戻したときだけ出る（ubaku.jp と同じ）
   7. メールのアイコン：押したときにメールを開く
   ========================================================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- 1. 試作の切り替え ---------- */
  var setTheme = function (t) {
    root.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-switch button').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.t === t);
    });
    try { localStorage.setItem('v2-theme', t); } catch (e) {}   // 見ている人のブラウザにだけ覚えておく
  };
  var q = new URLSearchParams(location.search).get('t');
  var saved = null;
  try { saved = localStorage.getItem('v2-theme'); } catch (e) {}
  setTheme(q === 'a' || q === 'b' ? q : (saved || 'a'));
  document.querySelectorAll('.theme-switch button').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.dataset.t); });
  });

  /* ---------- 2. ヒーローの写真 ---------- */
  var slides = document.querySelectorAll('[data-slides] .slide');
  var tabs = document.querySelectorAll('.slide-tabs button');
  var interval = parseInt(getComputedStyle(root).getPropertyValue('--slide-time'), 10) || 7000;
  var cur = 0, timer = null;
  var show = function (n) {
    slides[cur].classList.remove('is-active'); tabs[cur].classList.remove('is-active');
    cur = n;
    slides[cur].classList.add('is-active');
    void tabs[cur].offsetWidth;                // 残り時間の線を最初から伸ばし直す
    tabs[cur].classList.add('is-active');
  };
  var start = function () {
    if (reduce) return;
    clearInterval(timer);
    timer = setInterval(function () { show((cur + 1) % slides.length); }, interval);
  };
  tabs.forEach(function (b, i) { b.addEventListener('click', function () { if (i !== cur) show(i); start(); }); });
  if (slides.length > 1) start();

  /* ---------- 3. 「暮らしに余白」の写真 ---------- */
  document.querySelectorAll('[data-fader]').forEach(function (box) {
    var imgs = box.querySelectorAll('img'), i = 0;
    if (reduce || imgs.length < 2) return;
    setInterval(function () {
      imgs[i].classList.remove('is-active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('is-active');
    }, 5000);
  });

  /* ---------- 5. 数字が数え上がる（画面に入ったとき1回だけ） ---------- */
  var countUp = function (el) {
    var to = Number(el.dataset.count), from = Number(el.dataset.from || 0);
    var comma = el.hasAttribute('data-comma');
    var t0 = null, dur = 1600;
    var fmt = function (n) { return comma ? n.toLocaleString('en-US') : String(n); };
    var step = function (now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);          // 最後にゆっくり止まる
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- 4. スクロールで現れる ---------- */
  var targets = document.querySelectorAll('.reveal, .unveil, .reveal-tate');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        en.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. 固定メニュー ---------- */
  var bar = document.querySelector('.topbar');
  var hero = document.querySelector('.hero');
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    var past = y > hero.offsetHeight * 0.9;            // ヒーローを過ぎたか
    bar.classList.toggle('is-shown', past && y < lastY); // 上に戻しているときだけ出す
    lastY = y;
  }, { passive: true });
  bar.querySelector('.topbar-logo').addEventListener('click', function (e) {
    e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- 7. メールのアイコン ---------- */
  document.querySelectorAll('.js-mail-btn').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      location.href = 'mailto:' + a.dataset.user + '@' + a.dataset.domain;
    });
  });
})();
