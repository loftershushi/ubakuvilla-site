/* 言語の自動切り替え（2026-11-07 mashuさん。共通ルールは D:\\Ubaku\\CLAUDE.md の 3-2）
   IP ではなくブラウザの言語で判定する。日本語のページを開いた人だけを、同じ内容の別の言語のページへ移す。
   ・行き先はページの head にある hreflang の一覧から探す（その言語のページがないときは移さない）
   ・韓国語のブラウザ→韓国語、中国語（繁体字・簡体字とも）→繁体字、それ以外→英語
   ・日本語が言語の設定に入っている人は移さない
   ・言語のボタンで日本語を選んだ人は、その選択を覚えて移さない
   ・検索エンジンのロボットは移さない */
(function () {
  'use strict';
  var KEY = 'ubaku-lang';
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(v) {
    try { if (v) { localStorage.setItem(KEY, v); } else { localStorage.removeItem(KEY); } } catch (e) { /* 保存できなくても切り替えは動く */ }
  }
  // 言語のボタンを押したときの選択を覚える
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[hreflang]') : null;
    if (link) { remember(link.getAttribute('hreflang') === 'ja' ? 'ja' : null); }
  });

  if (document.documentElement.lang !== 'ja' || saved() === 'ja') { return; }
  if (/bot|crawl|spider|slurp|google|bing|yandex|baidu|lighthouse|facebookexternalhit/i.test(navigator.userAgent)) { return; }

  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  if (Array.prototype.some.call(langs, function (l) { return /^ja\b/i.test(l); })) { return; }

  function page(code) {
    var el = document.querySelector('link[rel="alternate"][hreflang="' + code + '"]');
    return el ? el.getAttribute('href') : null;
  }
  var first = String(langs[0] || '').toLowerCase();
  var target;
  if (/^zh\b/.test(first)) { target = page('zh-Hant'); if (!target) { return; } }   // 繁体字のページがなければ日本語のまま
  else if (/^ko\b/.test(first)) { target = page('ko') || page('en'); }
  else { target = page('en'); }
  if (target) { location.replace(target.replace(/^https?:\/\/[^/]+/, '') + location.search + location.hash); }
})();
