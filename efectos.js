/* Altosol Persianas: efectos de la versión premium (v2).
   Sin GSAP (CDN caído) o con «reducir movimiento», todo queda visible y quieto;
   el muestrario, dónde se instala, el comparador, el interruptor de prueba y el día / noche siguen funcionando. */
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
    q += dir * dt / 3.2 / (window.__esc || 1); /* __esc: solo para grabar el video en cámara lenta */
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

  /* ---------- Cambio de foto «como persiana»: muestrario y dónde se instala ---------- */
  function cambiador(fig, alTerminar) {
    var base = $('.base', fig), nueva = $('.nueva', fig), barrido = $('.barrido', fig), ocupado = false;
    return function (src, srcset, alt) {
      function fin() { if (srcset) base.srcset = srcset; base.src = src; base.alt = alt; ocupado = false; if (alTerminar) alTerminar(); }
      if (!animado) { fin(); return; }
      if (ocupado) { fin(); }
      ocupado = true;
      if (srcset) nueva.srcset = srcset; nueva.src = src;
      (nueva.decode ? nueva.decode() : Promise.resolve()).catch(function () {}).then(function () {
        var tl = G.timeline({ onComplete: function () {
          fin();
          G.set(nueva, { clipPath: 'inset(0% 0% 100% 0%)' });
          if (barrido) G.set(barrido, { height: 0, opacity: 1 });
        } });
        tl.set(nueva, { clipPath: 'inset(0% 0% 100% 0%)' })
          .to(nueva, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 0);
        if (barrido) tl.set(barrido, { height: 0, opacity: 1 }, 0).to(barrido, { height: '100%', duration: 1.1, ease: 'power3.inOut' }, 0).to(barrido, { opacity: 0, duration: 0.3 }, 0.95);
      });
    };
  }
  var mFoto = $('#mFoto');
  if (mFoto) {
    var cambiaM = cambiador(mFoto), mNombre = $('#mNombre'), mTono = $('#mTono');
    $$('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        $$('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        mNombre.innerHTML = '<span>' + b.getAttribute('data-color') + '</span>';
        mTono.textContent = b.getAttribute('data-tono');
        if (animado) G.from(mNombre.firstChild, { yPercent: 100, duration: 0.8, ease: 'expo.out' });
        cambiaM(b.getAttribute('data-src'), b.getAttribute('data-srcset'), b.getAttribute('data-alt'));
      });
    });
  }
  var dFoto = $('#dFoto');
  if (dFoto) {
    var cambiaD = cambiador(dFoto);
    $$('.lugar').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        $$('.lugar').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        cambiaD(b.getAttribute('data-src'), b.getAttribute('data-srcset'), b.getAttribute('data-alt'));
      });
    });
  }

  /* ---------- Comparador abierta / cerrada ---------- */
  var comp = $('#comp'), compIn = comp && $('input', comp);
  function setComp(v) { comp.style.setProperty('--x', v + '%'); }
  if (comp && compIn) {
    compIn.addEventListener('input', function () { setComp(compIn.value); });
    setComp(compIn.value);
  }

  /* ---------- Despiece: posiciones separadas ---------- */
  var DES = { pCaj: [0, -150], pEje: [0, -42], pCor: [0, 28], pGi: [-96, 0], pGd: [96, 0], pCon: [0, 104] };
  var partes = $$('.partes li');
  function marcarParte(i) { partes.forEach(function (li, k) { li.classList.toggle('activo', k === i); }); }

  /* ---------- Sin animaciones: dejar todo visible ---------- */
  if (!animado) {
    Object.keys(DES).forEach(function (id) { var g = document.getElementById(id); if (g) g.setAttribute('transform', 'translate(' + DES[id][0] + ' ' + DES[id][1] + ')'); });
    $$('.des-svg .mk').forEach(function (m) { m.style.opacity = 1; });
    partes.forEach(function (li) { li.classList.add('activo'); });
    var pc = $('.persiana-cierre'); if (pc) pc.style.transform = 'translateY(-101%)';
    if (reduce) setLuz(0.5);
    else if (escena) {
      var sec = $('.luz');
      var alScroll = function () { var r = sec.getBoundingClientRect(); setLuz((window.innerHeight * 0.5 - r.top) / r.height); };
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

  var top = $('.top'), barra = $('.progreso'), ultimoY = 0;
  function alMover(y, lim) {
    if (barra) barra.style.transform = 'scaleX(' + (lim > 0 ? y / lim : 0).toFixed(4) + ')';
    if (top) top.classList.toggle('oculto', y > 600 && y > ultimoY + 2);
    if (top && y < ultimoY - 2) top.classList.remove('oculto');
    ultimoY = y;
  }
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, prevent: function (n) { return !!(n && n.closest && n.closest('.asis')); } });
    lenis.on('scroll', function (e) { ST.update(); alMover(e.scroll, e.limit); });
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    window.__lenis = lenis;
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
  } else {
    window.addEventListener('scroll', function () { alMover(window.scrollY, document.documentElement.scrollHeight - innerHeight); }, { passive: true });
  }
  /* menú: sección actual */
  $$('.menu a').forEach(function (a) {
    var t = document.querySelector(a.getAttribute('href'));
    if (t) ST.create({ trigger: t, start: 'top 45%', end: 'bottom 45%', refreshPriority: -1, onToggle: function (st) { a.classList.toggle('actual', st.isActive); } });
  });

  /* Portada: al bajar, la persiana se cierra con el scroll (más rápido que la página, para que se vea) */
  G.to('.persiana-mov', { yPercent: 101, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: 0.6 } });

  /* Luz: sección fija mientras el scroll baja la persiana */
  var luz = { p: 0 };
  setLuz(0);
  G.to(luz, { p: 1, ease: 'none', onUpdate: function () { setLuz(luz.p); },
    scrollTrigger: { trigger: '.luz', start: 'top top', end: '+=170%', pin: true, scrub: 0.8, anticipatePin: 1 } });

  /* Despiece: la persiana se separa en sus partes */
  var tl = G.timeline({ scrollTrigger: { trigger: '.despiece', start: 'top top', end: '+=160%', pin: true, scrub: 0.8, anticipatePin: 1,
    onUpdate: function (st) { var p = st.progress; marcarParte(p < 0.2 ? 0 : p < 0.38 ? 1 : p < 0.56 ? 2 : p < 0.74 ? 3 : 4); } } });
  var orden = [['pCaj', 0], ['pEje', 0.16], ['pCor', 0.32], ['pGi', 0.48], ['pGd', 0.48], ['pCon', 0.64]];
  orden.forEach(function (o) {
    var d = DES[o[0]];
    tl.to('#' + o[0], { x: d[0], y: d[1], duration: 0.3, ease: 'power2.inOut' }, o[1]);
    tl.to('#' + o[0] + ' .mk', { opacity: 1, duration: 0.12 }, o[1] + 0.18);
  });
  tl.to({}, { duration: 0.08 });

  /* Comparador: un vaivén al aparecer, para que se entienda que se arrastra */
  if (comp) {
    var cx = { v: 50 };
    G.timeline({ scrollTrigger: { trigger: comp, start: 'top 70%', once: true } })
      .to(cx, { v: 22, duration: 0.9, ease: 'power2.inOut', onUpdate: function () { setComp(cx.v); compIn.value = cx.v; } })
      .to(cx, { v: 78, duration: 1.2, ease: 'power2.inOut', onUpdate: function () { setComp(cx.v); compIn.value = cx.v; } })
      .to(cx, { v: 50, duration: 0.8, ease: 'power2.inOut', onUpdate: function () { setComp(cx.v); compIn.value = cx.v; } });
  }

  /* Proceso: la línea avanza y cada paso se enciende */
  var p4l = $('#pasos4');
  if (p4l) {
    var lis = $$('li', p4l), r = { v: 0 };
    p4l.style.setProperty('--r', 0);
    G.to(r, { v: 1, ease: 'none', scrollTrigger: { trigger: p4l, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
      onUpdate: function () { p4l.style.setProperty('--r', r.v.toFixed(3)); lis.forEach(function (li, k) { li.classList.toggle('on', r.v >= k / lis.length + 0.02); }); } });
    G.from(lis, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: p4l, start: 'top 85%', once: true } });
  }

  /* Cierre: la persiana sube y entra la luz */
  var pc = $('.persiana-cierre');
  if (pc) G.fromTo(pc, { yPercent: 0 }, { yPercent: -101, ease: 'none', scrollTrigger: { trigger: '.cierre', start: 'top 75%', end: 'top 5%', scrub: 0.6 } });

  /* Cortinas de láminas entre secciones (se abren al entrar) */
  $$('[data-cortina]').forEach(function (sec) {
    var c = document.createElement('div');
    c.className = 'cortina-in'; c.setAttribute('aria-hidden', 'true');
    c.style.setProperty('--cc', sec.getAttribute('data-cortina'));
    c.style.setProperty('--c', 1);
    sec.insertBefore(c, sec.firstChild);
    var o = { c: 1 };
    G.to(o, { c: 0, ease: 'none', onUpdate: function () { c.style.setProperty('--c', o.c.toFixed(3)); },
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 30%', scrub: 0.4 } });
  });

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
    G.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.marco') || img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
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
    var kx = G.quickTo(cur, 'x', { duration: 0.45, ease: 'power3.out' });
    var ky = G.quickTo(cur, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { kx(e.clientX); ky(e.clientY); cur.classList.add('on'); }, { passive: true });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('grande', !!(e.target.closest && e.target.closest('a, button, .pista figure, .chip, summary, .comp')));
    });
  }
})();
