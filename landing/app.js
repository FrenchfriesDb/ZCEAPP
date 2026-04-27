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

  var navToggle = document.querySelector('[data-nav-toggle]');
  var navMenu = document.querySelector('[data-nav-menu]');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var willOpen = !navMenu.classList.contains('is-open');
      navMenu.classList.toggle('is-open', willOpen);
      navToggle.classList.toggle('is-open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

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

  // Mouse-reactive grid pulse and parallax glass stack on the homepage hero.
  var root = document.body;
  function updateMouseVars(ev) {
    root.style.setProperty('--mx', ev.clientX + 'px');
    root.style.setProperty('--my', ev.clientY + 'px');
  }
  window.addEventListener('pointermove', updateMouseVars, { passive: true });

  var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-tilt-scene]'));
  scenes.forEach(function (scene) {
    var card = scene.querySelector('.stack-scene');
    if (!card) return;
    var layers = Array.prototype.slice.call(scene.querySelectorAll('[data-tilt-layer]'));
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    scene.addEventListener('pointermove', function (ev) {
      var rect = scene.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width;
      var y = (ev.clientY - rect.top) / rect.height;
      var tiltY = (x - 0.5) * 18;
      var tiltX = (0.5 - y) * 14;
      card.style.setProperty('--tilt-x', tiltX.toFixed(2) + 'deg');
      card.style.setProperty('--tilt-y', tiltY.toFixed(2) + 'deg');

      layers.forEach(function (el) {
        var depth = el.getAttribute('data-tilt-layer') === 'front' ? 22 : el.getAttribute('data-tilt-layer') === 'mid' ? 14 : 8;
        var dx = (x - 0.5) * depth;
        var dy = (y - 0.5) * depth;
        var z = el.getAttribute('data-tilt-layer') === 'front' ? 72 : el.getAttribute('data-tilt-layer') === 'mid' ? 38 : 0;
        el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,' + z + 'px)';
      });
    });

    scene.addEventListener('pointerleave', function () {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      layers.forEach(function (el) {
        el.style.transform = '';
      });
    });
  });
})();
