/* 盛唐雅粹 · PC 比赛表现层。不开新 Canvas、不引入依赖。 */
(function () {
  'use strict';
  const ENABLE_INTRO = true; // 调试时改为 false，正式展示默认开启。
  const ENABLE_BACKGROUND_REVEAL = false; // 首页背景揭幕 A/B 开关（已改用灰度→上色方案，见 initColorReveal）。
  const OPENING_DURATION = 4400;
  const desktop = window.matchMedia('(min-width: 992px)');
  const page = document.body.dataset.page;
  const hero = document.getElementById('heroCarousel');
  const opening = document.getElementById('opening');
  let openingActive = false;
  let openingStart = 0;
  let finishOpening = function () {};
  let refreshDust = function () {};

  function carouselState() {
    if (!hero || !window.bootstrap || !window.bootstrap.Carousel) return;
    const carousel = window.bootstrap.Carousel.getOrCreateInstance(hero);
    if (openingActive) carousel.pause();
    else carousel.cycle();
  }

  function initOpening() {
    if (!opening || !ENABLE_INTRO || opening.classList.contains('home-scroll-opening')) return;
    openingActive = true;
    openingStart = performance.now();
    opening.hidden = false;
    document.documentElement.classList.add('intro-running');
    const inertBefore = new Map();
    Array.from(document.body.children).forEach(function (element) {
      if (element !== opening && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) {
        inertBefore.set(element, element.inert);
        element.inert = true;
      }
    });
    let exitingTimer, completeTimer;
    function onEscape(event) { if (event.key === 'Escape') finishOpening(); }
    finishOpening = function () {
      if (!openingActive) return;
      openingActive = false;
      clearTimeout(exitingTimer);
      clearTimeout(completeTimer);
      opening.hidden = true;
      document.documentElement.classList.remove('intro-running');
      inertBefore.forEach(function (wasInert, element) { element.inert = wasInert; });
      document.removeEventListener('keydown', onEscape);
      carouselState();
      refreshDust();
      document.dispatchEvent(new Event('exhibition:opened'));
    };
    document.getElementById('openingSkip').addEventListener('click', finishOpening, { once: true });
    document.addEventListener('keydown', onEscape);
    exitingTimer = setTimeout(function () { opening.classList.add('is-exiting'); }, OPENING_DURATION - 850);
    completeTimer = setTimeout(finishOpening, OPENING_DURATION);
    carouselState();
    window.addEventListener('load', carouselState, { once: true });
    window.addEventListener('pagehide', finishOpening, { once: true });
  }

  function addAtmosphere(target) {
    const light = document.createElement('div');
    light.className = 'hero-atmosphere';
    light.setAttribute('aria-hidden', 'true');
    target.appendChild(light);
  }

  function initChapter() {
    const chapterHero = document.querySelector('.page-hero');
    if (!chapterHero || !desktop.matches || chapterHero.dataset.heroOwner === 'aesthetics') return;
    const chapters = {
      history: ['壹', '历史溯源', '帝王年表 · 王朝兴衰'],
      treasures: ['贰', '瑰宝重器', '唐三彩 · 金银器 · 千年遗珍'],
      art: ['叁', '翰墨丹青', '传世名画 · 敦煌壁画 · 笔墨千秋'],
      aesthetics: ['肆', '唐风美学', '织锦歌舞 · 盛唐风华']
    };
    const chapter = chapters[page];
    if (!chapter) return;
    const backdrop = chapterHero.querySelector('.chapter-backdrop') || document.createElement('div');
    backdrop.className = 'chapter-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    chapterHero.appendChild(backdrop);
    if (!chapterHero.querySelector('.hero-atmosphere')) addAtmosphere(chapterHero);
    const heading = document.createElement('div');
    heading.className = 'chapter-heading';
    const number = document.createElement('span');
    number.className = 'chapter-number';
    number.textContent = '第 ' + chapter[0] + ' 章';
    const title = document.createElement('h1');
    title.textContent = chapter[1];
    const rule = document.createElement('span');
    rule.className = 'chapter-rule';
    rule.setAttribute('aria-hidden', 'true');
    const subtitle = document.createElement('p');
    subtitle.textContent = chapter[2];
    heading.append(number, title, rule, subtitle);
    chapterHero.appendChild(heading);
    chapterHero.classList.add('chapter-entering');
    setTimeout(function () { chapterHero.classList.remove('chapter-entering'); }, 1400);
  }

  // 事件只记录目标值，一帧至多写入一次；没有常驻鼠标视差循环。
  function bindDepth(target, maxX, maxY, tilt) {
    let bounds = null, frame = 0, x = 0, y = 0;
    function write() {
      frame = 0;
      if (tilt) {
        target.style.setProperty('--tilt-x', (-y * maxY).toFixed(2) + 'deg');
        target.style.setProperty('--tilt-y', (x * maxX).toFixed(2) + 'deg');
        target.style.setProperty('--shine-x', ((x + 1) * 50).toFixed(1) + '%');
        target.style.setProperty('--shine-y', ((y + 1) * 50).toFixed(1) + '%');
      } else {
        target.style.setProperty('--depth-x', (-x * maxX).toFixed(2) + 'px');
        target.style.setProperty('--depth-y', (-y * maxY).toFixed(2) + 'px');
      }
    }
    function queue() { if (!frame) frame = requestAnimationFrame(write); }
    target.addEventListener('mouseenter', function () { bounds = target.getBoundingClientRect(); });
    target.addEventListener('mousemove', function (event) {
      if (!desktop.matches) return;
      if (!bounds) bounds = target.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
      queue();
    });
    target.addEventListener('mouseleave', function () { x = 0; y = 0; bounds = null; queue(); });
    window.addEventListener('scroll', function () { bounds = null; }, { passive: true });
    window.addEventListener('resize', function () { bounds = null; x = 0; y = 0; queue(); });
  }

  function initDepth() {
    if (!desktop.matches) return;
    if (hero) { addAtmosphere(hero); bindDepth(hero, 7, 4, false); }
    const chapterHero = document.querySelector('.page-hero');
    if (chapterHero) bindDepth(chapterHero, page === 'history' ? 10 : 5, 5, false);
    const cards = page === 'home'
      ? Array.from(document.querySelectorAll('.highlight-card')).slice(0, 3)
      : page === 'history' ? Array.from(document.querySelectorAll('.card-museum')) : [];
    cards.forEach(function (card) { card.classList.add('exhibit-tilt'); bindDepth(card, 3, 2, true); });
    const focuses = new Set();
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) focuses.add(entry.target);
        else focuses.delete(entry.target);
      });
      document.body.classList.toggle('exhibit-focus', focuses.size > 0);
    }, { threshold: .18 });
    document.querySelectorAll('.hero-carousel, .page-hero, #compassSection, #kilnScene, .painting-section, .mural-section').forEach(function (section) { observer.observe(section); });
  }

  // 首页画卷揭幕：事件只更新目标坐标，实际跟随与淡出由单个 rAF 缓动。
  function initBackgroundReveal() {
    if (!ENABLE_BACKGROUND_REVEAL || page !== 'home' || !hero || !desktop.matches) return;
    const scene = document.createElement('div');
    scene.className = 'hero-reveal-scene';
    scene.setAttribute('aria-hidden', 'true');
    ['base', 'clear', 'veil'].forEach(function (name) {
      const layer = document.createElement('div');
      layer.className = 'hero-reveal-layer hero-reveal-' + name;
      scene.appendChild(layer);
    });
    hero.insertBefore(scene, hero.firstChild);

    const FOLLOW_EASE = .08;
    const STRENGTH_EASE = .11;
    let bounds = null;
    let targetX = hero.clientWidth * .5, targetY = hero.clientHeight * .46;
    let currentX = targetX, currentY = targetY;
    let targetStrength = 0, currentStrength = 0;
    let heroVisible = true, pointerInside = false, frame = 0, lastTime = 0;
    let interactionReady = !openingActive;

    function write() {
      scene.style.setProperty('--reveal-x', currentX.toFixed(1) + 'px');
      scene.style.setProperty('--reveal-y', currentY.toFixed(1) + 'px');
      scene.style.setProperty('--reveal-strength', currentStrength.toFixed(3));
      const normalX = bounds ? (currentX / bounds.width - .5) * 2 : 0;
      const normalY = bounds ? (currentY / bounds.height - .5) * 2 : 0;
      scene.style.setProperty('--reveal-shift-x', (-normalX * 6).toFixed(2) + 'px');
      scene.style.setProperty('--reveal-shift-y', (-normalY * 4).toFixed(2) + 'px');
    }
    function stopOffscreen() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      targetStrength = 0;
      currentStrength = 0;
      write();
    }
    function animate(now) {
      frame = 0;
      if (!heroVisible || document.hidden) return stopOffscreen();
      const steps = Math.min(3, Math.max(.5, (now - (lastTime || now - 16.67)) / 16.67));
      lastTime = now;
      const follow = 1 - Math.pow(1 - FOLLOW_EASE, steps);
      const fade = 1 - Math.pow(1 - STRENGTH_EASE, steps);
      currentX += (targetX - currentX) * follow;
      currentY += (targetY - currentY) * follow;
      currentStrength += (targetStrength - currentStrength) * fade;
      if (Math.abs(targetX - currentX) < .08) currentX = targetX;
      if (Math.abs(targetY - currentY) < .08) currentY = targetY;
      if (Math.abs(targetStrength - currentStrength) < .004) currentStrength = targetStrength;
      write();
      if (currentX !== targetX || currentY !== targetY || currentStrength !== targetStrength) {
        frame = requestAnimationFrame(animate);
      }
    }
    function queue() {
      if (!frame && heroVisible && !document.hidden) frame = requestAnimationFrame(animate);
    }
    function updateTarget(event) {
      if (!interactionReady || !heroVisible) return;
      if (!bounds) bounds = hero.getBoundingClientRect();
      targetX = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
      targetY = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
      targetStrength = .96;
      queue();
    }
    hero.addEventListener('mouseenter', function (event) {
      pointerInside = true;
      bounds = hero.getBoundingClientRect();
      updateTarget(event);
    });
    hero.addEventListener('mousemove', updateTarget, { passive: true });
    hero.addEventListener('mouseleave', function () {
      pointerInside = false;
      targetStrength = 0;
      queue();
    });
    document.addEventListener('exhibition:opened', function () {
      interactionReady = true;
      if (pointerInside) queue();
    }, { once: true });
    const visibilityObserver = new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      bounds = null;
      if (!heroVisible) stopOffscreen();
      else if (pointerInside && interactionReady) queue();
    }, { threshold: .02 });
    visibilityObserver.observe(hero);
    window.addEventListener('resize', function () {
      bounds = null;
      targetX = hero.clientWidth * .5;
      targetY = hero.clientHeight * .46;
      if (!pointerInside) { currentX = targetX; currentY = targetY; }
      queue();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopOffscreen();
      else if (heroVisible && pointerInside && interactionReady) queue();
    });
    write();
  }

  // 复用原 goldParticles：开场、Hero、罗盘共用同一画布、同一调度器。
  function initDust() {
    const canvas = document.getElementById('goldParticles');
    if (!canvas || !hero) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const compass = document.getElementById('compassStage');
    canvas.className = 'exhibition-dust';
    canvas.setAttribute('aria-hidden', 'true');
    (openingActive ? opening : document.body).appendChild(canvas);
    let width = 0, height = 0, mode = '', particles = [];
    let frame = 0, geometryFrame = 0, lastTime = 0;
    function randomParticle() {
      const angle = Math.random() * Math.PI * 2;
      const distance = .5 + Math.random() * .6;
      return {
        x: Math.random() * width, y: Math.random() * height,
        originX: width / 2 + Math.cos(angle) * width * distance,
        originY: height / 2 + Math.sin(angle) * height * distance,
        targetX: width / 2 + Math.cos(angle) * (110 + Math.random() * 260),
        targetY: height / 2 + Math.sin(angle) * (20 + Math.random() * 90),
        size: .45 + Math.pow(Math.random(), 2) * 1.8,
        alpha: .12 + Math.random() * .32,
        speed: 3 + Math.random() * 9,
        drift: (Math.random() - .5) * 5,
        phase: Math.random() * Math.PI * 2,
        twinkle: Math.random() < .16,
        trail: Math.random() < .045
      };
    }
    function geometry() {
      geometryFrame = 0;
      let nextMode = '', left = 0, top = 0, w = innerWidth, h = innerHeight;
      if (document.body.classList.contains('home-opening-active')) {
        canvas.hidden = true; mode = '';
        if (frame) cancelAnimationFrame(frame);
        frame = 0; return;
      }
      if (!openingActive && canvas.parentElement !== document.body) document.body.appendChild(canvas);
      if (openingActive) nextMode = 'opening';
      else {
        const heroRect = hero.getBoundingClientRect();
        if (heroRect.bottom > 80 && heroRect.top < innerHeight) {
          nextMode = 'hero'; top = Math.max(0, heroRect.top); h = Math.min(innerHeight, heroRect.bottom) - top;
        } else if (compass) {
          const rect = compass.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < innerHeight) {
            nextMode = 'compass';
            left = Math.max(0, rect.left - 40); top = Math.max(0, rect.top - 40);
            w = Math.min(innerWidth, rect.right + 40) - left;
            h = Math.min(innerHeight, rect.bottom + 40) - top;
          }
        }
      }
      if (document.hidden || !nextMode || h <= 0) {
        canvas.hidden = true; mode = '';
        if (frame) cancelAnimationFrame(frame);
        frame = 0; return;
      }
      w = Math.ceil(w); h = Math.ceil(h);
      const resized = w !== width || h !== height || mode !== nextMode;
      mode = nextMode;
      canvas.hidden = false;
      canvas.style.transform = 'translate(' + left + 'px,' + top + 'px)';
      if (resized) {
        width = w; height = h;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        particles = Array.from({ length: mode === 'opening' ? 72 : 28 }, randomParticle);
      }
      if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(draw); }
    }
    function draw(now) {
      frame = 0;
      if (!mode || document.hidden) return;
      const dt = Math.min((now - lastTime) / 1000, .05);
      lastTime = now;
      context.clearRect(0, 0, width, height);
      const elapsed = now - openingStart;
      particles.forEach(function (p) {
        let alpha = p.alpha, x = p.x, y = p.y;
        if (mode === 'opening') {
          const progress = Math.max(0, Math.min(1, (elapsed - 250) / 2050));
          const ease = 1 - Math.pow(1 - progress, 3);
          const release = Math.max(0, (elapsed - 2600) / 1500);
          x = p.originX + (p.targetX - p.originX) * ease + Math.cos(p.phase) * release * 85;
          y = p.originY + (p.targetY - p.originY) * ease - release * p.speed * 3;
          alpha *= Math.min(1, elapsed / 650) * Math.max(0, 1 - release * .8);
        } else {
          p.y -= p.speed * dt; p.x += (p.drift + Math.sin(now / 2200 + p.phase) * 2) * dt;
          if (p.y < -8) { p.y = height + 8; p.x = Math.random() * width; }
          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;
          x = p.x; y = p.y;
          alpha *= mode === 'compass' ? .66 : .75;
          alpha *= Math.max(0, Math.min(1, y / 30, (height - y) / 30));
        }
        if (p.twinkle) alpha *= .6 + Math.sin(now / 850 + p.phase) * .4;
        context.fillStyle = 'rgba(238,199,119,' + alpha + ')';
        context.beginPath(); context.arc(x, y, p.size, 0, Math.PI * 2); context.fill();
        if (p.size > 1.7) {
          context.fillStyle = 'rgba(219,166,74,' + alpha * .12 + ')';
          context.beginPath(); context.arc(x, y, p.size * 3, 0, Math.PI * 2); context.fill();
        }
        if (p.trail && mode !== 'opening') {
          context.strokeStyle = 'rgba(220,176,98,' + alpha * .35 + ')'; context.lineWidth = .6;
          context.beginPath(); context.moveTo(x, y); context.lineTo(x - p.drift * .25, y + 7); context.stroke();
        }
      });
      frame = requestAnimationFrame(draw);
    }
    refreshDust = function () { if (!geometryFrame) geometryFrame = requestAnimationFrame(geometry); };
    window.addEventListener('scroll', refreshDust, { passive: true });
    window.addEventListener('resize', refreshDust);
    window.addEventListener('load', refreshDust, { once: true });
    document.addEventListener('visibilitychange', refreshDust);
    document.addEventListener('exhibition:opened', refreshDust);
    geometry();
  }

  // 首页顶部：图片起始偏灰，点击任意处后从该点向外扩散上色；每张图的速度/节奏/形状/成色不同。
  function initColorReveal() {
    if (page !== 'home' || !hero || !desktop.matches) return;
    const layer = document.createElement('div');
    layer.className = 'hero-color-layer';
    layer.setAttribute('aria-hidden', 'true');
    hero.appendChild(layer);

    const items = Array.prototype.slice.call(hero.querySelectorAll('.carousel-item'));
    const hint = hero.querySelector('.hero-color-hint'); // 点击上色提示语
    const coloredSlides = {}; // 每张图是否已上色，按索引记忆，切图后互不影响
    const RIPPLE_BAND = 70; // 双圈涟漪：色环宽度(px)
    const RIPPLE_GAP = 55;  // 双圈涟漪：两环之间的灰缝宽度(px)
    // 双圈涟漪蒙版：实心中心 + 两个色环（硬边），环与环之间留灰缝。
    const RIPPLE_MASK = 'radial-gradient(circle at var(--mcx, 50%) var(--mcy, 50%), #000 0%, #000 var(--r1, 0px), transparent var(--r1, 0px), transparent var(--r2, 0px), #000 var(--r2, 0px), #000 var(--r3, 0px), transparent var(--r3, 0px), transparent var(--r4, 0px), #000 var(--r4, 0px), #000 var(--r5, 0px), transparent var(--r5, 0px))';
    // 每张图一套“上色”方案：shape(disc 圆/椭圆 · ripple 双圈)、比例、时长(ms)、缓动、边缘软硬(%)、成色滤镜。
    const PROFILES = [
      { shape: 'disc',   ratio: 1,   duration: 1400, ease: 'out',    soft: 80, tint: 'saturate(1.05)' },
      { shape: 'disc',   ratio: 1,   duration: 700,  ease: 'linear', soft: 90, tint: 'saturate(1.35)' },
      { shape: 'ripple', duration: 1900, ease: 'out', tint: 'sepia(0.16) saturate(1.08)' },
      { shape: 'disc',   ratio: 1,   duration: 1100, ease: 'in',     soft: 62, tint: 'saturate(0.9) brightness(1.05)' },
      { shape: 'disc',   ratio: 1.8, duration: 1700, ease: 'inout',  soft: 78, tint: 'contrast(1.06) saturate(1.12)' }
    ];
    const EASE = {
      out: function (t) { return 1 - Math.pow(1 - t, 3); },
      in: function (t) { return t * t * t; },
      inout: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
      linear: function (t) { return t; }
    };

    let activeIndex = 0;
    let currentColored = false;
    let animating = false;
    let animToken = 0;

    function setCenter(x, y) {
      layer.style.setProperty('--mcx', x + 'px');
      layer.style.setProperty('--mcy', y + 'px');
    }
    function setRadii(rx, ry) {
      layer.style.setProperty('--mrx', rx + 'px');
      layer.style.setProperty('--mry', ry + 'px');
    }
    function setRipple(outer) {
      const r5 = Math.max(0, outer);
      const r4 = Math.max(0, r5 - RIPPLE_BAND);
      const r3 = Math.max(0, r4 - RIPPLE_GAP);
      const r2 = Math.max(0, r3 - RIPPLE_BAND);
      const r1 = Math.max(0, r2 - RIPPLE_GAP);
      layer.style.setProperty('--r1', r1 + 'px');
      layer.style.setProperty('--r2', r2 + 'px');
      layer.style.setProperty('--r3', r3 + 'px');
      layer.style.setProperty('--r4', r4 + 'px');
      layer.style.setProperty('--r5', r5 + 'px');
    }
    // 从 (cx,cy) 到最远角点的距离（圆形覆盖所需半径）。
    function coverDistance(cx, cy) {
      const w = hero.clientWidth, h = hero.clientHeight;
      let d = 0;
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(function (c) {
        d = Math.max(d, Math.hypot(c[0] - cx, c[1] - cy));
      });
      return d;
    }
    // 椭圆（x 半径 = r*ratio，y 半径 = r）盖满 hero 所需的最小 r，外加一点余量。
    function coverRadius(cx, cy, ratio) {
      const w = hero.clientWidth, h = hero.clientHeight;
      let r = 0;
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(function (c) {
        r = Math.max(r, Math.hypot((c[0] - cx) / ratio, c[1] - cy));
      });
      return r * 1.1;
    }
    // 双圈涟漪：实心中心要盖满 hero，外层半径需再加上两环 + 两缝 + 余量。
    function rippleMaxR(cx, cy) {
      return coverDistance(cx, cy) + 2 * (RIPPLE_BAND + RIPPLE_GAP) + 30;
    }
    function syncImage() {
      const item = hero.querySelector('.carousel-item.active');
      if (item) layer.style.backgroundImage = getComputedStyle(item).backgroundImage;
    }

    // 切到第 index 张：同步图片，并按该张记忆的上色状态与方案刷新彩色层。
    function loadState(index) {
      animToken += 1; // 打断仍在进行的扩散动画
      animating = false;
      activeIndex = index;
      currentColored = !!coloredSlides[index];
      if (hint) hint.classList.toggle('is-hidden', currentColored); // 已上色的图不再提示
      const profile = PROFILES[index] || PROFILES[0];
      syncImage();
      layer.style.filter = profile.tint || 'none';
      const cx = hero.clientWidth / 2, cy = hero.clientHeight / 2;
      setCenter(cx, cy);
      if (profile.shape === 'ripple') {
        layer.style.maskImage = RIPPLE_MASK;
        layer.style.webkitMaskImage = RIPPLE_MASK;
        if (currentColored) {
          layer.style.opacity = '1';
          setRipple(rippleMaxR(cx, cy));
        } else {
          layer.style.opacity = '0';
          setRipple(0);
        }
      } else {
        layer.style.maskImage = '';
        layer.style.webkitMaskImage = '';
        layer.style.setProperty('--msoft', (profile.soft || 80) + '%');
        if (currentColored) {
          layer.style.opacity = '1';
          const r = coverRadius(cx, cy, profile.ratio || 1);
          setRadii(r * (profile.ratio || 1), r);
        } else {
          layer.style.opacity = '0';
          setRadii(0, 0);
        }
      }
    }

    loadState(0);
    hero.addEventListener('slid.bs.carousel', function () {
      loadState(items.indexOf(hero.querySelector('.carousel-item.active')));
    });

    function heroPoint(event) {
      const r = hero.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      // 反向抵消 carousel 的 scale(1.025)，让扩散圆心正好落在点击处
      const cx = r.width / 2, cy = r.height / 2;
      return { x: cx + (x - cx) / 1.025, y: cy + (y - cy) / 1.025 };
    }

    hero.addEventListener('click', function (event) {
      if (event.target.closest('.carousel-control-prev, .carousel-control-next, .carousel-indicators')) return;
      if (currentColored || animating) return;
      const profile = PROFILES[activeIndex] || PROFILES[0];
      coloredSlides[activeIndex] = true;
      currentColored = true;
      animating = true;
      if (hint) hint.classList.add('is-hidden');
      const token = ++animToken;
      const p = heroPoint(event);
      setCenter(p.x, p.y);
      layer.style.opacity = '1';
      const ease = EASE[profile.ease] || EASE.out;
      const maxR = profile.shape === 'ripple' ? rippleMaxR(p.x, p.y) : coverRadius(p.x, p.y, profile.ratio || 1);
      const start = performance.now();
      function frame(now) {
        if (token !== animToken) return; // 已被切图打断
        const t = Math.min(1, (now - start) / profile.duration);
        const k = ease(t);
        if (profile.shape === 'ripple') {
          setRipple(k * maxR);
        } else {
          const r = k * maxR;
          setRadii(r * (profile.ratio || 1), r);
        }
        if (t < 1) requestAnimationFrame(frame);
        else animating = false;
      }
      requestAnimationFrame(frame);
    });
  }

  try {
    initOpening();
    initChapter();
    initDepth();
    initBackgroundReveal();
    initColorReveal();
    initDust();
  } catch (error) {
    // 表现层发生异常时确保页面和原有交互仍然可用。
    finishOpening();
    console.error('展示效果初始化失败：', error);
  }
})();
