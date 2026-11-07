/* =========================================================
   新しい見た目 v3 の動き（日本語の全ページ。main.js のあとに読む）
   動きの考え方：①画面に入ったときに1回 ②見ている間ゆっくり続く ③マウスを乗せたときの反応 の3つ。
   ②はトップの Concept・Room・Seasons・Explore だけ。画面の外では止める。

   1. 丘の曲線を入れる（冒頭の文章のあとと、フッターの上の2か所だけ。自動）
   2. 下層ページの写真にも幕の動きを付ける（自動）
   3. 画面に入ったら1回だけの動き（写真の幕・数字・特長）
   4. はじめの紹介：日本語と英語の高さをそろえる
   5. 写真が溶けるように替わる（Concept）
   6. Room の写真：止まらずゆっくり流れる（矢印・ドラッグでも動かせる）
   7. Seasons：今の季節から順に開く
   8. Explore：行に合わせて写真が替わる
   9. Story の写真：スクロールに合わせてゆっくり動く
   10. ニュース一覧：最初は5件、Load More で5件ずつ
   11. 右下の印（予約＋UBAKU Letter）
   12. 一番上へ戻るボタン
   ========================================================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 画面に見えている間だけ cb(true)、外れたら cb(false) を呼ぶ */
  var whileVisible = function (el, cb) {
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: 0.15 }).observe(el);
  };

  /* ---------- 1. 丘の曲線 ---------- */
  // ゆるやかな1つの山だけの形。曲線は「冒頭」と「フッターの上」の2か所だけ。真ん中はまっすぐに切り替える（2026-11-07 mashuさん）
  var CURVES = ['M0 84 C 380 30, 980 22, 1440 66', 'M0 60 C 460 104, 1020 96, 1440 40'];
  var hillNo = 0;
  var hillSvg = function (color, side) {   // side：above＝曲線より上を塗る／below＝曲線より下を塗る
    var c = CURVES[hillNo++ % CURVES.length];
    var close = side === 'above' ? ' L1440 0 L0 0 Z' : ' L1440 120 L0 120 Z';
    return '<svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">' +
      '<path fill="' + color + '" d="' + c + close + '"/>' +
      '<g class="ln-wrap"><path class="ln" d="' + c + '"/></g></svg>';
  };
  var bgOf = function (el) {
    var c = getComputedStyle(el).backgroundColor;
    if (c !== 'transparent' && c !== 'rgba(0, 0, 0, 0)') return c;
    return getComputedStyle(document.body).backgroundColor;   // 色のない部分は、ページの地の色
  };
  var main = document.getElementById('main');
  var hills = [];
  if (main) {
    var list = Array.prototype.slice.call(main.children).filter(function (e) { return e.matches('section, article'); });
    var foot = document.querySelector('.site-footer');
    var addHill = function (a, b) {                           // a と b のあいだに丘を入れる
      var h = document.createElement('div');
      if (a.matches('.cta')) {                                // 写真の下の端：次の色で丘を描く
        h.className = 'hill hill-over at-bottom';
        h.innerHTML = hillSvg(bgOf(b), 'below');
        a.appendChild(h);
      } else {
        h.className = 'hill';
        h.style.background = bgOf(b);
        h.innerHTML = hillSvg(bgOf(a), 'above');
        if (b === foot) main.appendChild(h); else b.parentNode.insertBefore(h, b);
      }
      hills.push(h);
    };
    if (list.length > 1 && !list[0].matches('.hero')) addHill(list[0], list[1]);   // 下層ページの冒頭。トップの写真の下には入れない
    if (list.length && foot) addHill(list[list.length - 1], foot);   // フッターの上
  }

  /* ---------- 2. 下層ページの写真 ---------- */
  document.querySelectorAll('main .photos, main .courses, main .seasons').forEach(function (box) {
    box.querySelectorAll('.photo').forEach(function (p, i) {
      p.classList.remove('reveal');
      p.classList.add('v3-unveil');
      p.style.setProperty('--d', (i % 4) * 0.12 + 's');
    });
  });
  document.querySelectorAll('main .split > .photo, main .split > .fader').forEach(function (p) {
    p.classList.remove('reveal');
    p.classList.add('v3-unveil');
  });

  /* ---------- 3. 画面に入ったら1回だけ ---------- */
  var countUp = function (el) {
    var to = Number(el.dataset.count), comma = el.hasAttribute('data-comma');
    if (to <= 1) return;                                // 「1日1組」の1は数えない
    var from = to > 1000 ? to - 26 : 0;                 // 2026 は 2000 から。大きな数は最後の少しだけ動かす
    var t0 = null, dur = 660;                           // 全部の数字を 0.66 秒にそろえ、同時に止める（2026-11-07 mashuさん）
    el.style.minWidth = el.offsetWidth + 'px';          // 桁が増えても横に揺れないように
    var step = function (now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 2)));
      el.textContent = comma ? v.toLocaleString('en-US') : String(v);
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = String(from);
    requestAnimationFrame(step);
  };
  var targets = Array.prototype.slice.call(document.querySelectorAll('.v3-unveil, .v3-num-row li, .v3-points li')).concat(hills);
  if (reduce || !hasIO) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        var row = en.target.closest('.v3-num-row');
        if (row && !row.dataset.run) {                  // 1つ見えたら、全部の数字を同時に動かす
          row.dataset.run = '1';
          row.querySelectorAll('li').forEach(function (li) { li.classList.add('is-visible'); });
          row.querySelectorAll('[data-count]').forEach(countUp);
        }
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. はじめの紹介の高さをそろえる ---------- */
  var ja = document.querySelector('.intro-ja'), en = document.querySelector('.intro-en');
  if (ja && en) {
    var fit = function () {
      if (window.innerWidth <= 760) { ja.style.height = ''; return; }
      ja.style.height = Math.max(320, en.offsetHeight) + 'px';   // 英語の高さに、縦書きの高さを合わせる
    };
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  /* ---------- 5. 写真が溶けるように替わる ---------- */
  var wiper = function (box) {
    var imgs = box.querySelectorAll('img'), cur = 0;
    imgs[0].classList.add('is-active');
    return function (i) {
      if (i === cur) return;
      imgs.forEach(function (m) { m.classList.remove('was-active'); });
      imgs[cur].classList.remove('is-active');
      imgs[cur].classList.add('was-active');
      imgs[i].classList.add('is-active');
      cur = i;
    };
  };
  document.querySelectorAll('[data-wipe]').forEach(function (box) {
    var go = wiper(box), count = box.querySelectorAll('img').length, i = 0, timer = null;
    if (reduce) return;
    whileVisible(box, function (on) {
      clearInterval(timer);
      if (on) timer = setInterval(function () { i = (i + 1) % count; go(i); }, 5500);
    });
  });

  /* ---------- 6. Room の写真 ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (box) {
    var track = box.querySelector('.v3-track');
    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (li) {                  // 切れ目なく流すため、同じ写真を後ろにもう1周分つなげる
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
    var SPEED = 26;                                // 1秒に動く距離（px）
    var x = 0, goal = null, last = 0, seen = false, hover = false, drag = false, sx = 0, s0 = 0, wait = 0;
    var loopW = function () { return items[0].offsetWidth * 0 + track.children[items.length].offsetLeft - items[0].offsetLeft; };
    var stepW = function () { return items[0].offsetWidth + 6; };
    if (box.dataset.speed) SPEED = Number(box.dataset.speed);
    var tick = function (now) {
      var dt = Math.min(60, now - (last || now)); last = now;
      if (goal !== null) {                         // 矢印を押したときは、目的の位置まですっと動く
        x += (goal - x) * 0.12;
        if (Math.abs(goal - x) < 0.5) { x = goal; goal = null; }
      } else if (seen && !hover && !drag && !reduce && now > wait) {
        x += SPEED * dt / 1000;
      }
      var W = loopW();
      if (W > 0) {
        if (x >= W) { x -= W; if (goal !== null) goal -= W; }
        if (x < 0) { x += W; if (goal !== null) goal += W; }
      }
      track.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)';
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    whileVisible(box, function (on) { seen = on; });
    box.addEventListener('mouseenter', function () { hover = true; });
    box.addEventListener('mouseleave', function () { hover = false; });
    var prev = box.querySelector('.prev'), next = box.querySelector('.next');
    if (prev) prev.addEventListener('click', function () { goal = (goal === null ? x : goal) - stepW(); });
    if (next) next.addEventListener('click', function () { goal = (goal === null ? x : goal) + stepW(); });
    // つかんで動かす（マウス・指どちらも）
    track.addEventListener('pointerdown', function (e) {
      drag = true; goal = null; sx = e.clientX; s0 = x;
      track.classList.add('is-drag');
      if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) { if (drag) x = s0 - (e.clientX - sx); });
    var end = function () {
      if (!drag) return;
      drag = false; wait = performance.now() + 1500;   // 手を離したら少し待ってから、また流れる
      track.classList.remove('is-drag');
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
  });

  /* 順番に切り替わる部品の共通の仕組み（Seasons・Explore）。マウスが乗っている間はその項目で止まる */
  var cycle = function (root, items, ms, show, start) {
    var i = start, timer = null, seen = false, held = false;
    root.style.setProperty('--t', ms + 'ms');
    var pick = function (n, byHand) {
      items[i].classList.remove('is-on');
      i = n;
      void items[i].offsetWidth;                   // 残り時間の線を最初から伸ばし直す
      items[i].classList.add('is-on');
      show(i);
      if (byHand) run();                           // 指で選んだら、そこから時間を数え直す
    };
    var run = function () {
      clearInterval(timer);
      if (seen && !held && !reduce) timer = setInterval(function () { pick((i + 1) % items.length); }, ms);
    };
    items[i].classList.add('is-on');
    show(i);
    items.forEach(function (el, n) {
      el.addEventListener('mouseenter', function () {
        held = true; clearInterval(timer);
        if (n !== i) pick(n);
        el.classList.add('is-held');
      });
      el.addEventListener('mouseleave', function () {
        held = false; el.classList.remove('is-held');
        if (n === i) { el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on'); }
        run();
      });
    });
    whileVisible(root, function (on) { seen = on; run(); });
    return pick;
  };

  /* ---------- 7. Seasons ---------- */
  var seasons = document.querySelector('[data-seasons]');
  if (seasons) {
    var ss = Array.prototype.slice.call(seasons.children);
    var m = new Date().getMonth() + 1;
    var start = 0;                                 // 今の月の季節から始める（宿に来る人が「今」を見られるように）
    ss.forEach(function (el, n) { if (el.dataset.m.split(',').indexOf(String(m)) >= 0) start = n; });
    var pickS = cycle(seasons, ss, 4200, function () {}, start);
    ss.forEach(function (el, n) { el.addEventListener('click', function () { pickS(n); }); });   // スマホは指で選ぶ
  }

  /* ---------- 8. Explore ---------- */
  var ex = document.querySelector('[data-explore]');
  if (ex) {
    var goEx = wiper(ex.querySelector('.v3-wipe'));
    var exItems = Array.prototype.slice.call(ex.querySelectorAll('.v3-ex-list li'));
    var pickEx = cycle(ex, exItems, 4600, goEx, 0);
    // 指で操作する画面では、押すとその場所の写真を見せる（マウスは乗せるだけで替わる）
    if (window.matchMedia('(hover: none)').matches) {
      var exPhoto = ex.querySelector('.v3-wipe');
      exItems.forEach(function (li, n) {
        li.addEventListener('click', function () {
          pickEx(n, true);
          var top = exPhoto.getBoundingClientRect().top;
          if (top < 72) window.scrollBy({ top: top - 84, behavior: reduce ? 'auto' : 'smooth' });   // 写真が画面の上に隠れていたら見せる
        });
      });
    }
  }

  /* ---------- 9. Story の写真 ---------- */
  var story = document.querySelector('.v3-story');
  if (story && !reduce) {
    var photo = story.querySelector('.v3-story-photo img');
    var onScroll = function () {
      var r = story.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);   // 0〜1
      photo.style.setProperty('--py', ((p - 1) * 16).toFixed(2) + '%');   // 上にずらした所から戻す＝ページより遅く動いて奥行きが出る
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 写真が少しだけ違う速さで動く（Room のページ。data-par の値が大きいほど動く） ---------- */
  var pars = document.querySelectorAll('[data-par]');
  if (pars.length && !reduce) {
    var moveAll = function () {
      pars.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
        var c = (r.top + r.height / 2 - window.innerHeight / 2);   // 画面の真ん中からの距離
        el.style.transform = 'translate3d(0,' + (c * -Number(el.dataset.par)).toFixed(1) + 'px,0)';
      });
    };
    window.addEventListener('scroll', moveAll, { passive: true });
    moveAll();
  }

  /* ---------- 敷地図と間取り図の切り替え ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var btns = box.querySelectorAll('button'), panes = box.querySelectorAll('.rm-plan');
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x, n) { x.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
        panes.forEach(function (p, n) { p.classList.toggle('is-on', n === i); });
      });
    });
  });

  /* ---------- 10. ニュース一覧 ---------- */
  var cards = document.querySelector('.news-cards');
  if (cards) {
    var rows = Array.prototype.slice.call(cards.children), shown = 5, PER = 5;
    if (rows.length > shown) {
      var wrap = document.createElement('p');
      wrap.className = 'v3-load';
      wrap.innerHTML = '<button type="button">Load More</button>';
      cards.parentNode.insertBefore(wrap, cards.nextSibling);
      var apply = function () {
        rows.forEach(function (li, n) { li.hidden = n >= shown; });
        if (shown >= rows.length) wrap.remove();
      };
      wrap.firstChild.addEventListener('click', function () { shown += PER; apply(); });
      apply();
    }
  }

  /* ---------- 11. 右下の札 ---------- */
  var path = location.pathname.replace(/\/$/, '');
  if (!/^(\/(en|kr|zh-tw))?\/(reserve|contact)$/.test(path)) {
    var fab = document.createElement('aside');
    fab.className = 'v3-fab';
    // 右下の印の言葉は言語で分ける
    var FAB = {
      ja: { pre: '', en: '', label: 'ご予約と UBAKU Letter', letter: 'UBAKU Letter を受け取る', tip: '月に一度、大雪山のふもとからの便り', go: '空室・料金を見る', word: '空室<br>料金' },
      en: { pre: '/en', en: 'en/', label: 'Reservations and UBAKU Letter', letter: 'Get the UBAKU Letter', tip: 'A monthly letter from the foot of the Daisetsuzan', go: 'Check availability and rates', word: 'Book<br>Now' },
      ko: { pre: '/kr', en: 'en/', label: '예약과 UBAKU Letter', letter: 'UBAKU Letter 받기', tip: '한 달에 한 번, 다이세쓰잔 기슭에서 보내는 편지', go: '빈 객실·요금 보기', word: '빈 객실<br>요금' },
      'zh-Hant': { pre: '/zh-tw', en: 'en/', label: '預訂與 UBAKU Letter', letter: '訂閱 UBAKU Letter', tip: '每月一次，來自大雪山山麓的書信', go: '查詢空房・價格', word: '空房<br>價格' }
    };
    var F = FAB[document.documentElement.lang] || FAB.ja;
    fab.setAttribute('aria-label', F.label);
    fab.innerHTML =
      '<a class="v3-seal v3-seal-letter" href="https://ubaku.jp/' + F.en + '" target="_blank" rel="noopener" aria-label="' + F.letter + '"><span class="wordmark" aria-hidden="true"></span><em>Letter</em><span class="v3-seal-tip">' + F.tip + '</span></a>' +
      '<a class="v3-seal v3-seal-go" href="' + F.pre + '/reserve" aria-label="' + F.go + '">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="v3-ring" d="M50 50m-39 0a39 39 0 1 1 78 0a39 39 0 1 1-78 0"/></defs><text><textPath href="#v3-ring" textLength="240">RESERVE  ·  UBAKU VILLA  ·  RESERVE  ·  UBAKU VILLA  ·</textPath></text></svg>' +
      '<b>' + F.word + '</b></a>';
    document.body.appendChild(fab);
    // 指で操作する画面：Letter は1回目で説明を見せ、もう一度押すと ubaku.jp へ
    if (window.matchMedia('(hover: none)').matches) {
      var letter = fab.querySelector('.v3-seal-letter'), letterTimer = null;
      var closeLetter = function () { letter.classList.remove('is-open'); clearTimeout(letterTimer); };
      letter.addEventListener('click', function (e) {
        if (letter.classList.contains('is-open')) { closeLetter(); return; }
        e.preventDefault();
        letter.classList.add('is-open');
        letterTimer = setTimeout(closeLetter, 6000);
      });
      document.addEventListener('click', function (e) { if (!letter.contains(e.target)) closeLetter(); });
    }
    var heroEl = document.querySelector('.hero');
    var hideAt = document.querySelectorAll('.cta, .site-footer');   // 予約の帯・フッターが見えている間は隠す（同じ案内が2つ並ばないように）
    var place = function () {
      var past = window.scrollY > (heroEl ? heroEl.offsetHeight * 0.7 : 240), covered = false;
      hideAt.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) covered = true;
      });
      fab.classList.toggle('is-shown', past && !covered);
    };
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    place();
  }

  /* ---------- 12. 一番上へ戻るボタン（右下の印の上。印が隠れているときは下に降りる） ---------- */
  var toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'v3-top';
  toTop.setAttribute('aria-label', { en: 'Back to top', ko: '맨 위로', 'zh-Hant': '回到頁首' }[document.documentElement.lang] || 'ページの一番上へ戻る');
  toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  document.body.appendChild(toTop);
  var placeTop = function () {
    toTop.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.8);
    toTop.classList.toggle('is-low', !document.querySelector('.v3-fab.is-shown'));
  };
  window.addEventListener('scroll', placeTop, { passive: true });
  window.addEventListener('resize', placeTop);
  placeTop();
})();
