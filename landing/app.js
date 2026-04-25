(function () {
  var appStoreUrl = 'https://apps.apple.com/app/id6759347826';

  function openApp() {
    window.location.href = appStoreUrl;
  }

  document.querySelectorAll('[data-open-app]').forEach(function (el) {
    el.addEventListener('click', openApp);
  });

  var page = document.body.getAttribute('data-page');
  document.querySelectorAll('[data-nav]').forEach(function (link) {
    if (link.getAttribute('data-nav') === page) {
      link.classList.add('is-active');
    }
  });

  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  reveals.forEach(function (el) {
    var delay = Number(el.getAttribute('data-delay') || 0);
    if (delay) el.style.setProperty('--delay', String(delay));
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -10% 0px' });

  reveals.forEach(function (el) {
    io.observe(el);
  });

  function animateCounter(el) {
    var target = Number(el.getAttribute('data-count') || 0);
    if (!target) return;

    var duration = 1100;
    var start = performance.now();

    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = Math.round(target * eased);
      el.textContent = String(value);
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  var nums = Array.prototype.slice.call(document.querySelectorAll('.num[data-count]'));
  var numObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      numObserver.unobserve(entry.target);
    });
  }, { threshold: 0.7 });

  nums.forEach(function (n) {
    numObserver.observe(n);
  });
})();
