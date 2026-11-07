/* =========================================================
   トップのイントロ「雪」（2026-11-07 mashuさんが雪に決定）
   流れ：静かに雪が降り、下から白い丘が積もる
     → 上の6割にロゴがにじむように現れ、白い丘に英文が一文字ずつ降りてくる
     → 文字が消え、雪が画面いっぱいに積もって真っ白になり、その白がほどけて写真が現れる
   ・見るのは1回の訪問につき1回だけ（2回目からは飛ばす）。?intro=1 を付けると毎回見られる
   ・画面を押すと飛ばせる。「動きを減らす」設定の人には出さない
   ========================================================= */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var force = new URLSearchParams(location.search).has('intro');
  var seen = false;
  try { seen = sessionStorage.getItem('ubaku-intro') === '1'; sessionStorage.setItem('ubaku-intro', '1'); } catch (e) {}
  if (seen && !force) return;
  document.documentElement.classList.add('is-intro');   // main.js がこれを見て、hero の切り替えを待つ

  var css = document.createElement('style');
  css.textContent =
    '.op{position:fixed;inset:0;z-index:100;overflow:hidden;cursor:pointer;background:#DFE5E4}' +
    '.op.fade{opacity:0;pointer-events:none;transition:opacity 1.6s ease}' +
    '.op canvas{position:absolute;inset:0;width:100%;height:100%}' +
    // 白い丘：画面の下の約4割に積もる
    '.op svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:41%;transform:translateY(100%);transform-origin:50% 100%;transition:transform 3s cubic-bezier(.2,.7,.2,1) .2s}' +
    '.op.go svg{transform:none}' +
    '.op.out svg{transform:scaleY(2.9);transition:transform 1.3s cubic-bezier(.6,0,.3,1)}' +   // 雪が画面いっぱいに積もる
    '.op svg path{fill:#FFFFFF}' +
    // ロゴ：少しぼけた状態から、にじむように現れる
    '.op-logo{position:absolute;left:50%;top:31%;width:min(clamp(130px,26vh,230px),34vw);height:auto;transform:translate(-50%,calc(-50% + 10px));opacity:0;filter:blur(8px);transition:opacity 1.8s ease,filter 1.8s ease,transform 2.2s cubic-bezier(.2,.7,.2,1)}' +
    '.op.show .op-logo{opacity:1;filter:none;transform:translate(-50%,-50%)}' +
    // 英文：雪のように一文字ずつ降りてくる
    '.op-word{position:absolute;left:0;right:0;top:84%;margin:0;padding-left:.2em;text-align:center;transform:translateY(-50%);font-family:"Jost",sans-serif;font-weight:300;font-size:clamp(17px,2.4vh,22px);letter-spacing:.2em;color:#29463D;white-space:pre}' +
    '.op-word span{display:inline-block;opacity:0;filter:blur(3px);transform:translateY(-9px);transition:opacity .9s ease var(--d),filter .9s ease var(--d),transform 1.1s cubic-bezier(.2,.7,.2,1) var(--d)}' +
    '.op.show .op-word span{opacity:1;filter:none;transform:none}' +
    '.op.out .op-logo,.op.out .op-word{opacity:0;transition:opacity .7s ease}' +
    // 写真のゆっくりした動きも、intro が終わるまで始めない
    'html.is-intro .hero-top .slide.is-active img{transform:scale(1.08);transition:none}';
  document.head.appendChild(css);

  var op = document.createElement('div');
  op.className = 'op';
  var chars = 'Life, with Margin.'.split('').map(function (c, i) {
    return '<span style="--d:' + (0.7 + i * 0.05).toFixed(2) + 's">' + (c === ' ' ? '&nbsp;' : c) + '</span>';
  }).join('');
  op.innerHTML =
    '<canvas></canvas>' +
    '<svg viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true"><path d="M0 56 C 380 8, 980 0, 1440 40 L1440 400 L0 400 Z"/></svg>' +
    '<img class="op-logo" src="/assets/img/logo-dark.svg" alt=""><p class="op-word" lang="en" aria-label="Life, with Margin.">' + chars + '</p>';

  // 雪：白い丘の後ろに落ちていくので、積もって見える
  var cv = op.querySelector('canvas'), cx = cv.getContext('2d'), W, H, flakes = [], live = true;
  W = cv.width = window.innerWidth; H = cv.height = window.innerHeight;
  for (var k = 0; k < 150; k++) flakes.push({ x: Math.random() * W, y: Math.random() * H - H, r: 0.8 + Math.random() * 2.4, v: 0.3 + Math.random() * 0.9, s: Math.random() * 6.28 });
  var fall = function () {
    if (!live) return;
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = 'rgba(255,255,255,.95)';
    flakes.forEach(function (f) {
      f.y += f.v; f.s += 0.012; f.x += Math.sin(f.s) * 0.35;
      if (f.y > H) { f.y = -6; f.x = Math.random() * W; }
      cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.3); cx.fill();
    });
    requestAnimationFrame(fall);
  };
  fall();

  document.body.appendChild(op);
  document.documentElement.style.overflow = 'hidden';
  var done = false;
  var finish = function () {
    if (done) return; done = true;
    op.classList.add('out');                         // 文字が消え、雪が積もる
    setTimeout(function () {
      op.classList.add('fade');                      // 白がほどけて、写真が現れる
      document.documentElement.style.overflow = '';
      document.documentElement.classList.remove('is-intro');
      document.dispatchEvent(new Event('ubaku-intro-done'));   // ここから hero の時間を数える
    }, 1150);
    setTimeout(function () { live = false; op.remove(); }, 2900);
  };
  requestAnimationFrame(function () { requestAnimationFrame(function () { op.classList.add('go'); }); });
  setTimeout(function () { op.classList.add('show'); }, 1100);
  setTimeout(finish, 4700);
  op.addEventListener('click', finish);
})();
