/* Altosol Persianas: efectos de la versión premium.
   Sin GSAP (CDN caído) o con «reducir movimiento», todo queda visible y quieto;
   el muestrario, el interruptor de prueba y el día / noche siguen funcionando. */
(function () {
  var raiz = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap;
  var animado = !!(G && window.ScrollTrigger && !reduce);
  function listo() { raiz.classList.add('listo'); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Escena de luz ---------- */
  var escena = $('#escena'), pct = $('#pct'), pasos = $$('.pasos li');
  function setLuz(p) {
    if (!escena) return;
    p = Math.max(0, Math.min(1, p));
    escena.style.setProperty('--p', p.toFixed(3));
    if (pct) pct.textContent = Math.round(p * 100);
    var i = p < 0.34 ? 0 : (p < 0.72 ? 1 : 2);
    pasos.forEach(function (li, k) { li.classList.toggle('activo', k === i); });
  }
  $$('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (escena) escena.setAttribute('data-modo', b.getAttribute('data-modo'));
    });
  });

  /* ---------- Interruptor de prueba (motor) ---------- */
  var p4 = $('#p4'), pct4 = $('#pct4'), bSubir = $('#subir'), bBajar = $('#bajar'), bParar = $('#parar');
  var q = 0.55, dir = 0, ultimo = 0, cuadro = 0;
  function pintar() {
    if (p4) p4.style.setProperty('--q', q.toFixed(4));
    if (pct4) pct4.textContent = Math.round(q * 100);
    if (bSubir) bSubir.classList.toggle('on', dir < 0);
    if (bBajar) bBajar.classList.toggle('on', dir > 0);
  }
  function paso(t) {
    if (!ultimo) ultimo = t;
    var dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
    q += dir * dt / 3.2;
    if (q <= 0) { q = 0; dir = 0; }
    if (q >= 1) { q = 1; dir = 0; }
    pintar();
    if (dir) cuadro = requestAnimationFrame(paso); else ultimo = 0;
  }
  function mover(d) {
    dir = (dir === d) ? 0 : d;
    cancelAnimationFrame(cuadro); ultimo = 0;
    if (dir) cuadro = requestAnimationFrame(paso);
    pintar();
  }
  if (bSubir) bSubir.addEventListener('click', function () { mover(-1); });
  if (bBajar) bBajar.addEventListener('click', function () { mover(1); });
  if (bParar) bParar.addEventListener('click', function () { dir = 0; cancelAnimationFrame(cuadro); ultimo = 0; pintar(); });
  pintar();

  /* ---------- Muestrario de colores: la persiana baja sobre la foto ---------- */
  var mFoto = $('#mFoto');
  if (mFoto) {
    var base = $('.base', mFoto), nueva = $('.nueva', mFoto), barrido = $('.barrido', mFoto);
    var mNombre = $('#mNombre'), mTono = $('#mTono'), ocupado = false;
    $$('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        if (ocupado || b.getAttribute('aria-pressed') === 'true') return;
        $$('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var src = b.getAttribute('data-src'), alt = b.getAttribute('data-alt');
        mNombre.innerHTML = '<span>' + b.getAttribute('data-color') + '</span>';
        mTono.textContent = b.getAttribute('data-tono');
        function fin() { base.src = src; base.alt = alt; }
        if (!animado) { fin(); return; }
        ocupado = true;
        G.from(mNombre.firstChild, { yPercent: 100, duration: 0.8, ease: 'expo.out' });
        var img = new Image(); img.src = src;
        (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
          nueva.src = src;
          G.timeline({ onComplete: function () {
              fin();
              G.set(nueva, { clipPath: 'inset(0% 0% 100% 0%)' });
              G.set(barrido, { height: 0, opacity: 1 });
              ocupado = false;
            } })
            .set(nueva, { clipPath: 'inset(0% 0% 100% 0%)' })
            .set(barrido, { height: 0, opacity: 1 })
            .to(nueva, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 0)
            .to(barrido, { height: '100%', duration: 1.1, ease: 'power3.inOut' }, 0)
            .to(barrido, { opacity: 0, duration: 0.3 }, 0.95);
        });
      });
    });
  }

  /* ---------- Sin animaciones: dejar todo visible ---------- */
  if (!animado) {
    if (reduce) setLuz(0.5);
    else if (escena) {
      var sec = $('.luz');
      var alScroll = function () {
        var r = sec.getBoundingClientRect();
        setLuz((window.innerHeight * 0.5 - r.top) / r.height);
      };
      window.addEventListener('scroll', alScroll, { passive: true }); alScroll();
    }
    listo();
    return;
  }

  /* ---------- GSAP + Lenis ---------- */
  var ST = window.ScrollTrigger;
  G.registerPlugin(ST);
  var hayTexto = !!window.SplitText;
  if (hayTexto) G.registerPlugin(window.SplitText);

  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, prevent: function (n) { return !!(n && n.closest && n.closest('.asis')); } });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      if (a.classList.contains('saltar')) return;
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(id === '#inicio' ? 0 : t, { offset: -70, duration: 1.4 });
      });
    });
  }

  /* Portada: al bajar, la persiana se cierra con el scroll (más rápido que la página, para que se vea) */
  G.to('.persiana-mov', { yPercent: 101, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: 0.6 } });

  /* Luz: sección fija mientras el scroll baja la persiana */
  var luz = { p: 0 };
  setLuz(0);
  G.to(luz, { p: 1, ease: 'none', onUpdate: function () { setLuz(luz.p); },
    scrollTrigger: { trigger: '.luz', start: 'top top', end: '+=170%', pin: true, scrub: 0.8, anticipatePin: 1 } });

  var mm = G.matchMedia();
  /* Obras: galería horizontal con el scroll (escritorio) */
  mm.add('(min-width: 900px)', function () {
    var pista = $('#pista'), sec = $('.obras');
    sec.style.minHeight = '100svh';
    sec.style.display = 'flex'; sec.style.flexDirection = 'column'; sec.style.justifyContent = 'center';
    sec.style.paddingTop = '80px'; sec.style.paddingBottom = '40px';
    $$('figure', pista).forEach(function (f) { f.style.height = 'clamp(300px, 54vh, 580px)'; });
    var dist = function () { return Math.max(0, pista.scrollWidth - window.innerWidth); };
    G.to(pista, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true } });
    return function () { sec.removeAttribute('style'); $$('figure', pista).forEach(function (f) { f.style.height = ''; }); };
  });

  /* Parallax suave en fotos */
  $$('[data-parallax]').forEach(function (img) {
    G.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Números que cuentan */
  var c5 = $('#cuenta'), c13 = $('#cuenta13');
  if (c5 && c13) {
    var n = { a: 0, b: 0 };
    c5.textContent = '0,0'; c13.textContent = '0';
    G.to(n, { a: 5, b: 13, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: '.nota', start: 'top 80%', once: true },
      onUpdate: function () { c5.textContent = n.a.toFixed(1).replace('.', ','); c13.textContent = Math.round(n.b); } });
  }

  /* Textos por líneas (cuando las fuentes ya cargaron) */
  var hechoTexto = false;
  function textos() {
    if (hechoTexto) return; hechoTexto = true;
    G.from('[data-entra]', { y: 26, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.75 });
    $$('[data-split]').forEach(function (el) {
      var enPortada = !!el.closest('.hero');
      if (!hayTexto) {
        G.from(el, enPortada ? { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.35 }
          : { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        return;
      }
      window.SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true, onSplit: function (self) {
        return G.from(self.lines, enPortada
          ? { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.11, delay: 0.35 }
          : { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      } });
    });
    var gig = $('#gigante');
    if (gig && hayTexto) {
      window.SplitText.create(gig, { type: 'chars', mask: 'chars', onSplit: function (self) {
        return G.from(self.chars, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: gig, start: 'top 95%', once: true } });
      } });
    }
    listo();
    ST.refresh();
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(textos);
    setTimeout(textos, 1800);
  } else textos();
  window.addEventListener('load', function () { ST.refresh(); });

  /* ---------- Solo con mouse: vista previa, botones magnéticos, cursor ---------- */
  if (!fino) return;

  var vista = $('.vista'), prod = $('.prod');
  if (vista && prod) {
    var vImg = $('img', vista);
    var vx = G.quickTo(vista, 'x', { duration: 0.6, ease: 'power3.out' });
    var vy = G.quickTo(vista, 'y', { duration: 0.6, ease: 'power3.out' });
    $$('.fila').forEach(function (f) {
      var src = f.getAttribute('data-vista');
      f.addEventListener('mouseenter', function () {
        if (!src) { vista.classList.remove('on'); return; }
        vImg.src = src; vista.classList.add('on');
        G.to(vista, { scale: 1, duration: 0.6, ease: 'expo.out' });
      });
      f.addEventListener('mouseleave', function () { vista.classList.remove('on'); G.to(vista, { scale: 0.85, duration: 0.4 }); });
    });
    prod.addEventListener('mousemove', function (e) {
      var r = prod.getBoundingClientRect();
      vx(e.clientX - r.left + 28); vy(e.clientY - r.top - 190);
    });
  }

  $$('[data-magnet]').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      G.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', function () { G.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' }); });
  });

  var cur = $('.cursor');
  if (cur) {
    var cx = G.quickTo(cur, 'x', { duration: 0.45, ease: 'power3.out' });
    var cy = G.quickTo(cur, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); cur.classList.add('on'); }, { passive: true });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('grande', !!(e.target.closest && e.target.closest('a, button, .pista figure, .chip, summary')));
    });
  }
})();
