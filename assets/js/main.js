/* =========================================================
   UBAKU Villa 宇莫別荘 の動き
   1. ヘッダー：写真の上を過ぎたら地色つきに
   2. メニュー（右から出る緑の帯）の開け閉め
   3. トップの写真の切り替え（ヒーロー・「暮らしに余白」の写真）
   4. スクロールで下からふわっと現れる（ubaku.jp と同じ）
   5. お問い合わせフォーム（Web3Forms へ送る）
   ========================================================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 言語メニュー：外を押すか Esc で閉じる
  var langMenu = document.querySelector('.lang-menu');
  if (langMenu) {
    document.addEventListener('click', function (e) { if (!langMenu.contains(e.target)) { langMenu.open = false; } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { langMenu.open = false; } });
  }

  /* ---------- 1. ヘッダー ---------- */
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  if (header && hero) {
    var onScroll = function () {
      var limit = hero.offsetHeight - header.offsetHeight;
      header.classList.toggle('is-solid', window.scrollY > limit);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---------- 2. メニュー ---------- */
  var drawer = document.getElementById('drawer');
  var openBtn = document.querySelector('.menu-btn');
  if (drawer && openBtn) {
    var closeBtn = drawer.querySelector('.drawer-close');
    var open = function () {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    };
    var close = function () {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    drawer.addEventListener('click', function (e) { if (e.target === drawer) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });
  }

  /* ---------- 3. 写真の切り替え ---------- */
  // data-interval（ミリ秒）ごとに、中の写真を順番に表示する
  document.querySelectorAll('[data-rotate]').forEach(function (box) {
    var items = box.querySelectorAll(box.dataset.rotate);
    if (items.length < 2) return;
    var i = 0;
    items[0].classList.add('is-active');
    if (reduce) return;   // 動きを減らす設定では1枚目のまま
    var begin = function () {
      setInterval(function () {
        items[i].classList.remove('is-active');
        i = (i + 1) % items.length;
        items[i].classList.add('is-active');
      }, Number(box.dataset.interval) || 6000);
    };
    // intro が出ているあいだは数えない。写真が現れた時から1枚目の時間を数える
    if (document.documentElement.classList.contains('is-intro')) document.addEventListener('ubaku-intro-done', begin);
    else begin();
  });

  /* ---------- 4. スクロールで現れる ---------- */
  var targets = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- メールのアイコン：押したときにメールを開く（アドレスをページに書かない迷惑メール対策・ubaku.jp と同じ） ---------- */
  document.querySelectorAll('.js-mail-btn').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'mailto:' + a.dataset.user + '@' + a.dataset.domain;
    });
  });

  /* ---------- 5. お問い合わせフォーム ---------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // ロボット判定にチェックがないまま送れないようにする（ここで止めないと、判定なしでも Web3Forms が受け付けてしまう：2026-11-07 確認）
      var cap = form.querySelector('[name="h-captcha-response"]');
      if (cap && !cap.value) {
        status.textContent = '「私は人間です」にチェックを入れてください。 / Please complete the check above.';
        return;
      }
      var button = form.querySelector('.submit');
      button.disabled = true;
      status.textContent = '送信しています… / Sending…';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok || !json.success) throw new Error(json.message || 'send failed');
        });
      }).then(function () {
        form.reset();
        if (window.hcaptcha) { try { window.hcaptcha.reset(); } catch (err) {} }
        // 送信後は入力欄を隠して、お礼だけを見せる（言い方は ubaku.jp と同じ形）
        form.querySelectorAll('.field, .agree, .h-captcha, .submit').forEach(function (el) { el.style.display = 'none'; });
        status.classList.add('is-done');
        // 英語のページからの送信は英語だけ。日本語のページは日本語と英語の両方（海外のゲストも多いため）
        status.innerHTML = {
          en: '<strong>Message sent</strong>Thank you for your inquiry. We will reply to the email address you entered.',
          ko: '<strong>전송되었습니다</strong>문의해 주셔서 감사합니다. 내용을 확인한 뒤 입력하신 이메일 주소로 연락드리겠습니다.',
          'zh-Hant': '<strong>已送出</strong>感謝您的詢問。確認內容後，我們將回覆至您填寫的電子郵件。'
        }[document.documentElement.lang] || '<strong>送信しました</strong>お問い合わせありがとうございます。内容を確認のうえ、ご入力のメールアドレスへご連絡します。<br><span lang="en">Thank you for your inquiry. We will reply to the email address you entered.</span>';
        status.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }).catch(function () {
        // メールアドレスはロボットに拾われないよう分けて書き、ここで組み立てる
        var addr = 'info' + '@' + 'ubakuvilla.com';
        status.textContent = {
          en: 'Your message could not be sent. Please email us directly at ' + addr + '.',
          ko: '전송하지 못했습니다. 번거로우시겠지만 ' + addr + ' 로 직접 메일을 보내 주세요.',
          'zh-Hant': '無法送出。請直接寄信至 ' + addr + '。'
        }[document.documentElement.lang] || '送信できませんでした。お手数ですが ' + addr + ' へ直接メールでお送りください。';
      }).then(function () {
        button.disabled = false;
      });
    });
  }
})();
