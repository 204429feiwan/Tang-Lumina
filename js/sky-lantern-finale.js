(() => {
  const section = document.getElementById('skyLanternFinale');
  const canvas = document.getElementById('skyLanternCanvas');
  const launchButton = document.getElementById('skyLanternLaunch');
  if (!section || !canvas || !launchButton) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INTRO_DURATION = 10800;
  const TITLE_REVEAL = 8200;
  const MAX_CLICK_LANTERNS = 28;
  const TAU = Math.PI * 2;
  let width = 0;
  let height = 0;
  let started = false;
  let introDone = false;
  let introStart = 0;
  let raf = 0;
  let flights = [];
  let introFlights = [];

  // Fixed seeds keep the star field and distant lamps still in the final frame.
  function seeded(seed) {
    let state = seed >>> 0;
    return () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  const random = seeded(20260928);
  const stars = Array.from({ length: 76 }, () => ({
    x: random(), y: random() * .52, size: .3 + random() * 1.1,
    alpha: .12 + random() * .38
  }));
  const stillLights = [
    [.08, .19, .27], [.23, .13, .18], [.41, .09, .16],
    [.57, .17, .25], [.72, .1, .17], [.84, .24, .29],
    [.96, .17, .16], [.52, .3, .14], [.92, .36, .18],
    [.68, .38, .14], [.33, .23, .14]
  ];
  const embers = Array.from({ length: 46 }, () => ({
    x: random(), y: .67 + random() * .35,
    speed: .16 + random() * .29,
    size: .5 + random() * 1.25,
    phase: random()
  }));

  function resize() {
    const bounds = section.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    render(performance.now());
  }

  function drawNight() {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.size, 0, TAU);
      ctx.fillStyle = `rgba(255, 231, 197, ${star.alpha})`;
      ctx.fill();
    }

  }

  function drawEmbers(now) {
    if (!started || introDone) return;
    const elapsed = (now - introStart) / 1000;
    for (const ember of embers) {
      const travel = (ember.phase + elapsed * ember.speed) % 1;
      const x = ember.x * width + Math.sin(travel * 6 + ember.phase * TAU) * 22;
      const y = (ember.y - travel * .36) * height;
      const alpha = Math.sin(Math.PI * travel) * .5;
      ctx.beginPath();
      ctx.arc(x, y, ember.size, 0, TAU);
      ctx.fillStyle = `rgba(255, 187, 100, ${alpha})`;
      ctx.fill();
    }
  }

  function drawLantern(x, y, scale, opacity, tilt = 0) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, opacity);

    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 79);
    glow.addColorStop(0, 'rgba(255, 181, 75, .43)');
    glow.addColorStop(.55, 'rgba(240, 125, 56, .14)');
    glow.addColorStop(1, 'rgba(240, 125, 56, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 79, 0, TAU);
    ctx.fill();

    // Rounded paper crown and tapered open base of a traditional sky lantern.
    const paper = ctx.createLinearGradient(-34, -42, 34, 42);
    paper.addColorStop(0, '#9b3b24');
    paper.addColorStop(.25, '#de7137');
    paper.addColorStop(.51, '#ffd587');
    paper.addColorStop(.74, '#df7635');
    paper.addColorStop(1, '#8d3926');
    ctx.beginPath();
    ctx.moveTo(-19, 39);
    ctx.bezierCurveTo(-27, 20, -34, -14, -32, -34);
    ctx.quadraticCurveTo(-29, -48, -18, -51);
    ctx.quadraticCurveTo(0, -56, 18, -51);
    ctx.quadraticCurveTo(29, -48, 32, -34);
    ctx.bezierCurveTo(34, -14, 27, 20, 19, 39);
    ctx.quadraticCurveTo(0, 44, -19, 39);
    ctx.closePath();
    ctx.fillStyle = paper;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 206, 134, .8)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-28, -33);
    ctx.quadraticCurveTo(0, -40, 28, -33);
    ctx.moveTo(-23, 16);
    ctx.quadraticCurveTo(0, 22, 23, 16);
    ctx.moveTo(0, -52);
    ctx.quadraticCurveTo(-8, -5, -5, 38);
    ctx.moveTo(0, -52);
    ctx.quadraticCurveTo(8, -5, 5, 38);
    ctx.strokeStyle = 'rgba(120, 49, 30, .33)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 40, 18, 3.8, 0, 0, TAU);
    ctx.fillStyle = '#713323';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 40, 11, 2.1, 0, 0, TAU);
    ctx.fillStyle = '#f3a85b';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 43);
    ctx.quadraticCurveTo(-5, 35, 0, 28);
    ctx.quadraticCurveTo(5, 35, 0, 43);
    ctx.fillStyle = '#fff1bd';
    ctx.fill();
    ctx.restore();
  }

  function makeFlight(x, y, options = {}) {
    const { index = 0, isIntro = false, delay = 0, minScale = .72,
      scaleRange = .33, baseDuration = 3900, durationRange = 1900,
      driftRange = 260, waveRange = 33 } = options;
    const seed = seeded(Math.round(x * 23 + y * 71 + index * 997 + (isIntro ? 618 : performance.now())));
    return {
      x, y,
      start: (isIntro ? introStart : performance.now()) + delay,
      duration: baseDuration + seed() * durationRange,
      rise: y + height * (.12 + seed() * .21),
      drift: (seed() - .5) * driftRange,
      wave: 20 + seed() * waveRange,
      phase: seed() * TAU,
      scale: minScale + seed() * scaleRange,
      isIntro
    };
  }

  function drawFlight(flight, now) {
    const progress = (now - flight.start) / flight.duration;
    if (progress < 0 || progress >= 1) return progress < 1;
    const rise = progress * (1.13 - .13 * progress);
    const sway = Math.sin(progress * TAU * 1.28 + flight.phase) - Math.sin(flight.phase);
    const x = flight.x + flight.drift * progress + sway * flight.wave * Math.sin(Math.PI * Math.min(progress, .95));
    const y = flight.y - flight.rise * rise;
    const fadeIn = flight.isIntro ? Math.min(1, progress * 8) : Math.min(1, .75 + progress * 8);
    const fadeOut = Math.min(1, (1 - progress) * 5);
    const shrink = 1 - progress * .43;
    drawLantern(x, y, flight.scale * shrink, fadeIn * fadeOut, sway * .065);
    return true;
  }

  function render(now) {
    drawNight();
    drawEmbers(now);
    if (started && !introDone) {
      const elapsed = now - introStart;
      for (const flight of introFlights) drawFlight(flight, now);
      if (elapsed >= TITLE_REVEAL) section.classList.add('is-titled');
      if (elapsed >= INTRO_DURATION) {
        introDone = true;
        section.classList.add('is-titled', 'is-settled');
      }
    }
    if (introDone) {
      for (const [x, y, scale] of stillLights) {
        drawLantern(x * width, y * height, scale, .68);
      }
    }
    flights = flights.filter((flight) => drawFlight(flight, now));
  }

  function tick() {
    raf = 0;
    render(performance.now());
    if ((started && !introDone) || flights.length) schedule();
  }

  function schedule() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
  }

  function begin() {
    if (started) return;
    started = true;
    introStart = performance.now();
    section.classList.add('is-entered');
    if (reduceMotion.matches) {
      introDone = true;
      section.classList.add('is-titled', 'is-settled');
      render(introStart);
      return;
    }
    const spread = seeded(618);
    const distant = Array.from({ length: 25 }, (_, index) => makeFlight(
      width * (.02 + spread() * .96),
      height * (.78 + spread() * .3),
      { index, isIntro: true, delay: index * 85, minScale: .18, scaleRange: .29,
        baseDuration: 5200, durationRange: 2300, driftRange: 100, waveRange: 20 }
    ));
    const middle = Array.from({ length: 18 }, (_, index) => makeFlight(
      width * (.03 + spread() * .94),
      height * (.93 + spread() * .36),
      { index: index + 25, isIntro: true, delay: 800 + index * 165,
        minScale: .48, scaleRange: .47, baseDuration: 5100,
        durationRange: 2000, driftRange: 180, waveRange: 34 }
    ));
    const foreground = Array.from({ length: 7 }, (_, index) => makeFlight(
      width * (index % 2 ? .72 + spread() * .3 : -.08 + spread() * .36),
      height * (1.13 + spread() * .35),
      { index: index + 43, isIntro: true, delay: 2200 + index * 360,
        minScale: 1.25, scaleRange: .9, baseDuration: 5000,
        durationRange: 1700, driftRange: 260, waveRange: 52 }
    ));
    introFlights = [...distant, ...middle, ...foreground];
    schedule();
  }

  function launch(x, y) {
    if (!section.classList.contains('is-settled')) return;
    if (reduceMotion.matches) {
      drawLantern(x, y, .8, 1);
      return;
    }
    flights.push(makeFlight(x, y, flights.length));
    if (flights.length > MAX_CLICK_LANTERNS) flights.shift();
    render(performance.now() + 16);
    schedule();
  }

  section.addEventListener('click', (event) => {
    if (event.target.closest('button, a')) return;
    const bounds = section.getBoundingClientRect();
    launch(event.clientX - bounds.left, event.clientY - bounds.top);
  });
  launchButton.addEventListener('click', (event) => {
    event.stopPropagation();
    launch(width * (.4 + Math.random() * .2), height * .72);
  });

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      begin();
      observer.disconnect();
    }
  }, { threshold: .3 });
  observer.observe(section);

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!document.hidden) {
      if (started && !introDone && performance.now() - introStart >= INTRO_DURATION) {
        introDone = true;
        section.classList.add('is-titled', 'is-settled');
      }
      render(performance.now());
      if ((started && !introDone) || flights.length) schedule();
    }
  });
  resize();
})();
