/* 柠檬邪教全站脚本 */

(function () {
  'use strict';

  // 访问计数器
  var counter = document.getElementById('fakeCounter');
  var online = document.getElementById('onlineCount');
  var today = document.getElementById('todayCount');

  if (counter) {
    setInterval(function () {
      counter.textContent = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    }, 900);
  }

  if (online && today) {
    setInterval(function () {
      online.textContent = Math.floor(Math.random() * 3) + 1;
      if (Math.random() > 0.7) {
        today.textContent = Number(today.textContent) + 1;
      }
    }, 4000);
  }

  // 首页标题偶尔变一下
  var h1 = document.querySelector('h1.wordart[data-flicker]');
  if (h1) {
    var base = h1.textContent.trim();
    var titles = [base, base, base + '★', '★' + base + '★'];
    setInterval(function () {
      h1.textContent = titles[Math.floor(Math.random() * titles.length)];
    }, 5000);
  }

  // 关于本站
  var dlg = document.getElementById('aboutDlg');
  var aboutBtn = document.getElementById('aboutBtn');

  function closeDlg() {
    if (dlg) dlg.style.display = 'none';
  }

  if (dlg && aboutBtn) {
    aboutBtn.addEventListener('click', function () {
      dlg.style.display = 'block';
      aboutBtn.blur();
    });

    dlg.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains('x')) closeDlg();
      if (t.hasAttribute && t.hasAttribute('data-close')) closeDlg();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDlg();
    });
  }

  // 点击页面出现的文字
  document.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, select, textarea')) return;

    var span = document.createElement('span');
    span.textContent = ['震撼！', '离谱！', '绷不住了', '？', '6', '草'][Math.floor(Math.random() * 6)];
    span.style.cssText = 'position:fixed;left:' + (e.clientX + 10) + 'px;top:' + (e.clientY - 10) + 'px;' +
                         'font-size:15px;font-weight:bold;color:#c02020;pointer-events:none;z-index:99999;' +
                         'text-shadow:2px 2px 0 #fff;transition:transform .8s ease-out,opacity .8s ease-out;';
    document.body.appendChild(span);

    requestAnimationFrame(function () {
      span.style.transform = 'translateY(-50px) scale(1.3) rotate(' + (Math.random() * 30 - 15) + 'deg)';
      span.style.opacity = '0';
    });

    setTimeout(function () { span.remove(); }, 900);
  });
})();
