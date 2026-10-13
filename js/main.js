/* ============================================================
   盛唐雅粹 - Main JavaScript
   Interactions: Navigation, Carousel, Scroll Reveal,
   Back to Top, Form Validation, Modals, Image Zoom
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // NAVIGATION - Scroll Shrink & Active State
  // ============================================================
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('backToTop');
  const navLinks = document.querySelectorAll('.nav-link');
  // Keep our focus state inside the navbar: a modal may independently inert its outer shell.
  const navFocusRegion = navbar.firstElementChild;
  const navCollapse = navbar.querySelector('.navbar-collapse');
  const initialNavInert = navFocusRegion.inert;

  function syncNavFocusability(focused = navbar.contains(document.activeElement)) {
    const menuOpen = navCollapse && navCollapse.matches('.show, .collapsing');
    const hidden = navbar.classList.contains('scrolled') &&
      !navbar.classList.contains('nav-revealed') && !navbar.matches(':hover') &&
      !focused && !menuOpen;
    navFocusRegion.inert = hidden || initialNavInert;
  }

  navbar.addEventListener('focusin', function () { syncNavFocusability(true); });
  navbar.addEventListener('focusout', function (event) {
    syncNavFocusability(navbar.contains(event.relatedTarget));
  });
  navbar.addEventListener('mouseenter', function () { syncNavFocusability(); });
  navbar.addEventListener('mouseleave', function () { syncNavFocusability(); });
  if (navCollapse) {
    ['show.bs.collapse', 'shown.bs.collapse', 'hide.bs.collapse', 'hidden.bs.collapse'].forEach(function (name) {
      navCollapse.addEventListener(name, function () { syncNavFocusability(); });
    });
  }

  // Navbar shrink on scroll & transparency at top
  function handleNavScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('at-top');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.add('at-top');
    }
    syncNavFocusability();
  }

  // 自动隐藏导航：滚动后收起，鼠标移到页面顶部区域（约90px）时滑出
  document.addEventListener('mousemove', function (e) {
    navbar.classList.toggle('nav-revealed', e.clientY < 90);
    syncNavFocusability();
  });
  document.addEventListener('mouseleave', function () {
    navbar.classList.remove('nav-revealed');
    syncNavFocusability();
  });

  // 独立滚动监听：不依赖 initAll，确保导航 scrolled/at-top 状态可靠切换
  function syncNavScrollState() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('at-top');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.add('at-top');
    }
    syncNavFocusability();
  }
  syncNavScrollState();
  window.addEventListener('scroll', syncNavScrollState, { passive: true });

  // Active nav link based on current page
  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
      link.classList.remove('active');
      const linkPath = link.getAttribute('href');
      if (linkPath && currentPath.endsWith(linkPath)) {
        link.classList.add('active');
      } else if (!currentPath.includes('html/') && (linkPath === 'index.html' || linkPath === './')) {
        // Home page
        if (currentPath.endsWith('index.html') || currentPath.endsWith('777/') || currentPath.endsWith('777')) {
          if (linkPath === 'index.html' || linkPath === './') {
            link.classList.add('active');
          }
        }
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        // Close mobile menu if open
        const navCollapse = document.querySelector('.navbar-collapse');
        if (navCollapse && navCollapse.classList.contains('show')) {
          document.querySelector('.navbar-toggler').click();
        }
      }
    });
  });

  // ============================================================
  // BACK TO TOP
  // ============================================================
  function handleBackToTop() {
    if (window.scrollY > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ============================================================
  // SCROLL REVEAL (Intersection Observer)
  // ============================================================
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.fade-up, .fade-left, .fade-right'
    );

    if (revealElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ============================================================
  // CAROUSEL - Auto-play 3s, touch swipe, click indicators
  // ============================================================
  function initCarousel() {
    const heroCarousel = document.getElementById('heroCarousel');
    if (!heroCarousel || !window.bootstrap || !window.bootstrap.Carousel) return;

    const bsCarousel = bootstrap.Carousel.getOrCreateInstance(heroCarousel);
    if (document.documentElement.classList.contains('intro-running')) bsCarousel.pause();

    // Parallax-like zoom effect on slide transition
    heroCarousel.addEventListener('slide.bs.carousel', function (e) {
      const nextSlide = e.relatedTarget;
      nextSlide.style.transform = 'scale(1.08)';
      setTimeout(() => {
        nextSlide.style.transform = 'scale(1)';
      }, 1200);
    });

    // 首页不再自动轮播：首图直接展示，仅保留手动箭头/圆点切换。

    // Touch: prevent vertical scroll interference during horizontal swipe
    let touchStartX = 0;
    let touchStartY = 0;
    heroCarousel.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    heroCarousel.addEventListener('touchmove', function (e) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      // If horizontal swipe is dominant, prevent page scroll
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // ============================================================
  // FORM VALIDATION
  // ============================================================
  function initFormValidation() {
    const tangForms = document.querySelectorAll('.tang-form');
    if (tangForms.length === 0) return;

    tangForms.forEach(form => {
      const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

      // Real-time validation on blur
      inputs.forEach(input => {
        input.addEventListener('blur', function () {
          validateField(this);
        });

        input.addEventListener('input', function () {
          if (this.classList.contains('is-invalid')) {
            validateField(this);
          }
        });
      });

      // Submit validation
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        let isValid = true;

        inputs.forEach(input => {
          if (!validateField(input)) {
            isValid = false;
          }
        });

        if (isValid) {
          showFormSuccess(form);
        }
      });
    });
  }

  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMsg = '';

    // Remove previous validation state
    field.classList.remove('is-invalid', 'is-valid');

    // Required check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMsg = '此字段为必填项';
    }

    // Email validation
    if (isValid && field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMsg = '请输入有效的邮箱地址';
      }
    }

    // Phone validation
    if (isValid && field.type === 'tel' && value) {
      const phoneRegex = /^[\d\-+\s()]{7,15}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMsg = '请输入有效的电话号码';
      }
    }

    // Min length
    if (isValid && field.hasAttribute('minlength') && value) {
      const minLen = parseInt(field.getAttribute('minlength'));
      if (value.length < minLen) {
        isValid = false;
        errorMsg = `至少需要 ${minLen} 个字符`;
      }
    }

    // Show feedback
    const feedbackEl = field.nextElementSibling;
    if (!isValid) {
      field.classList.add('is-invalid');
      if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
        feedbackEl.textContent = errorMsg;
      }
    } else if (value) {
      field.classList.add('is-valid');
    }

    return isValid;
  }

  function showFormSuccess(form) {
    // Create success message
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = 'alert alert-success mt-3 fade-up';
    alert.style.cssText = `
      background: linear-gradient(135deg, var(--color-malachite-light), var(--color-malachite));
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px 24px;
      text-align: center;
      font-family: var(--font-display);
      letter-spacing: 0.06em;
    `;
    alert.textContent = '提交成功！感谢您的留言，我们将尽快回复。';
    form.appendChild(alert);

    // Trigger animation
    requestAnimationFrame(() => alert.classList.add('visible'));

    // Reset form after delay
    setTimeout(() => {
      form.reset();
      form.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
      setTimeout(() => alert.remove(), 5000);
    }, 2000);
  }

  // ============================================================
  // IMAGE LIGHTBOX / MODAL
  // ============================================================
  // Shared lightbox opener (used by both normal triggers and unfurl images)
  function openLightbox(el) {
    const imgSrc = el.getAttribute('data-lightbox');
    const imgTitle = el.getAttribute('data-title') || '';
    const imgDesc = el.getAttribute('data-desc') || '';

    const modal = document.createElement('div');
    modal.className = 'modal fade modal-tang';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${imgTitle}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <div class="zoom-container" id="zoomTarget">
              <img src="${imgSrc}" alt="${imgTitle}" class="img-fluid rounded" style="max-height: 75vh;">
            </div>
            ${imgDesc ? `<p class="mt-3 text-light opacity-75">${imgDesc}</p>` : ''}
          </div>
          <div class="modal-footer justify-content-center">
            <small class="text-muted">点击图片可放大查看细节</small>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    const zoomContainer = modal.querySelector('#zoomTarget');
    if (zoomContainer) {
      zoomContainer.addEventListener('click', function () {
        this.classList.toggle('zoomed');
      });
    }

    modal.addEventListener('hidden.bs.modal', function () {
      modal.remove();
    });
  }

  function initImageLightbox() {
    // Exclude .unfurl-img — those are handled by initScrollUnfurlPaintings
    const lightboxTriggers = document.querySelectorAll('[data-lightbox]:not(.unfurl-img)');

    lightboxTriggers.forEach(trigger => {
      trigger.addEventListener('click', function () {
        openLightbox(this);
      });
    });
  }

  // ============================================================
  // PATTERN HOVER ZOOM (Desktop only)
  // ============================================================
  function initPatternZoom() {
    const patternItems = document.querySelectorAll('.pattern-item');

    patternItems.forEach(item => {
      item.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        const img = this.querySelector('img');
        if (img) {
          img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        }
      });

      item.addEventListener('mouseleave', function () {
        const img = this.querySelector('img');
        if (img) {
          img.style.transformOrigin = 'center center';
        }
      });
    });
  }

  // ============================================================
  // HERO SCROLL INDICATOR
  // ============================================================
  function initHeroScroll() {
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    if (!scrollIndicator) return;

    scrollIndicator.addEventListener('click', function () {
      const nextSection = document.querySelector('.section');
      if (nextSection) {
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = nextSection.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  }

  // ============================================================
  // SCROLL-UNVEIL FOR PAINTING SCROLLS
  // ============================================================
  function initScrollUnveil() {
    const scrollCards = document.querySelectorAll('.scroll-card');

    const unveilObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'scrollUnfurl 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
          unveilObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    scrollCards.forEach(card => unveilObserver.observe(card));
  }

  // ============================================================
  // TIMELINE ANIMATION
  // ============================================================
  function initTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline-item');

    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    timelineItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(30px)';
      item.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
      timelineObserver.observe(item);
    });
  }

  // ============================================================
  // COUNTER ANIMATION (for stats section)
  // ============================================================
  function initCounters() {
    const counters = document.querySelectorAll('.counter-value');

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-target'));
          const duration = 2000;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out curve
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(eased * target);
            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = target;
            }
          }

          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  // ============================================================
  // ADVANCED: Cave Mural Lightbox with enhanced experience
  // ============================================================
  function initCaveLightbox() {
    const caveArches = document.querySelectorAll('.cave-arch[data-lightbox]');

    caveArches.forEach(arch => {
      arch.addEventListener('click', function (e) {
        const imgSrc = this.getAttribute('data-lightbox');
        const imgTitle = this.getAttribute('data-title') || '敦煌壁画';
        const imgDesc = this.getAttribute('data-desc') || '';

        const modal = document.createElement('div');
        modal.className = 'modal fade modal-tang';
        modal.setAttribute('tabindex', '-1');
        modal.innerHTML = `
          <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content" style="background:#2A1810; border:2px solid rgba(200,150,62,0.3);">
              <div class="modal-header" style="border-bottom:1px solid rgba(200,150,62,0.2);">
                <h5 class="modal-title" style="color:var(--color-gold-light); font-family:var(--font-display);">${imgTitle}</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center" style="background:radial-gradient(ellipse at center, #3C2415 0%, #2A1810 100%);">
                <div class="zoom-container" id="zoomTarget" style="border:4px solid #5C3A28; border-radius:8px; display:inline-block;">
                  <img src="${imgSrc}" alt="${imgTitle}" class="img-fluid" style="max-height:70vh; display:block;">
                </div>
                ${imgDesc ? `<p class="mt-3" style="color:rgba(255,240,210,0.7); font-size:0.9rem;">${imgDesc}</p>` : ''}
              </div>
              <div class="modal-footer justify-content-center" style="border-top:1px solid rgba(200,150,62,0.2);">
                <small style="color:rgba(255,240,210,0.5);">点击壁画可放大查看细节 | 敦煌莫高窟 · 大唐宝藏</small>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        const zoomContainer = modal.querySelector('#zoomTarget');
        if (zoomContainer) {
          zoomContainer.addEventListener('click', function () {
            this.classList.toggle('zoomed');
          });
        }

        modal.addEventListener('hidden.bs.modal', function () {
          modal.remove();
        });
      });
    });
  }

  // ============================================================
  // ADVANCED: Steam animation trigger on viewport entry
  // ============================================================
  function initSteamAnimations() {
    const steamEffects = document.querySelectorAll('.steam-effect');

    const steamObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
        } else {
          entry.target.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0.3 });

    steamEffects.forEach(steam => {
      steam.style.animationPlayState = 'paused';
      steamObserver.observe(steam);
    });
  }

  // ============================================================
  // ADVANCED: Pattern window tilt effect on mouse move
  // ============================================================
  function initPatternWindowTilt() {
    const windows = document.querySelectorAll('.pattern-window');

    windows.forEach(win => {
      win.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        this.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      win.addEventListener('mouseleave', function () {
        this.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
      });
    });
  }

  // ============================================================
  // ADVANCED: Banquet dish interactive glow
  // ============================================================
  function initBanquetInteractions() {
    const dishes = document.querySelectorAll('.banquet-dish');

    dishes.forEach(dish => {
      dish.addEventListener('mouseenter', function () {
        const siblings = Array.from(this.parentNode.children).filter(
          s => s !== this && s.classList.contains('banquet-dish')
        );
        siblings.forEach(s => {
          s.style.opacity = '0.6';
          s.style.transform = 'scale(0.95)';
        });
      });

      dish.addEventListener('mouseleave', function () {
        const siblings = Array.from(this.parentNode.children).filter(
          s => s !== this && s.classList.contains('banquet-dish')
        );
        siblings.forEach(s => {
          s.style.opacity = '1';
          s.style.transform = '';
        });
      });
    });
  }

  // ============================================================
  // ADVANCED: Cave atmosphere - random light flicker
  // ============================================================
  function initCaveAtmosphere() {
    const lightBeams = document.querySelectorAll('.light-beam');

    lightBeams.forEach((beam, index) => {
      setInterval(() => {
        const randomOpacity = 0.3 + Math.random() * 0.5;
        beam.style.opacity = randomOpacity;
        beam.style.transition = 'opacity 3s ease-in-out';
      }, 3000 + index * 1000);
    });
  }

  // ============================================================
  // ADVANCED: Highlight card counter animation on hover
  // ============================================================
  function initHighlightCards() {
    const cards = document.querySelectorAll('.highlight-card');

    cards.forEach(card => {
      card.addEventListener('mouseenter', function () {
        const mark = this.querySelector('.highlight-mark');
        if (mark) {
          mark.style.animation = 'none';
          mark.offsetHeight; // reflow
          mark.style.animation = '';
        }
      });
    });
  }

  // ============================================================
  // PARALLAX EFFECT ON SCROLL
  // ============================================================
  function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');

    function updateParallax() {
      parallaxElements.forEach(el => {
        const speed = el.getAttribute('data-parallax-speed') || 0.3;
        const scrollY = window.scrollY;
        const offset = scrollY * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // ============================================================
  // COMPASS WHEEL (罗盘) - Tilt + Drag + Breathing + Particles + Hover Popup + Spin-Navigate
  // ============================================================
  function initCompass() {
    const compassStage = document.getElementById('compassStage');
    const compassRotor = document.getElementById('compassRotor');
    const waterNeedle = document.getElementById('waterNeedle');
    const compassPopup = document.getElementById('compassPopup');
    const quads = document.querySelectorAll('.compass-quad');

    if (!compassRotor || !compassStage) return;

    let currentAngle = 0;
    let velocity = 0;
    let isDragging = false;
    let dragStartX = 0, dragStartAngle = 0, lastAngle = 0, lastTime = 0;
    let animationId = null;
    let needleAngle = 0;
    let idleTime = 0;
    let mouseX = 0, mouseY = 0;
    let tiltX = 0, tiltY = 0;
    let targetTiltX = 0, targetTiltY = 0;
    let isHovering = false;
    let isSpinning = false; // prevents interaction during spin animation
    let hoveredQuad = null;
    let compassVisible = false;
    const outerRing = compassStage.querySelector('.compass-outer-ring');

    // Build quad data map from DOM
    const quadDataMap = {};
    quads.forEach(q => {
      const dir = q.classList.contains('compass-q-north') ? 'north' :
                  q.classList.contains('compass-q-east') ? 'east' :
                  q.classList.contains('compass-q-south') ? 'south' : 'west';
      quadDataMap[dir] = {
        target: q.getAttribute('data-target'),
        theme: q.getAttribute('data-theme') || '',
        desc: q.getAttribute('data-desc') || ''
      };
    });

    // === WATER NEEDLE ===
    function rotateNeedle() {
      needleAngle += 0.12;
      if (waterNeedle) waterNeedle.style.transform = `rotate(${needleAngle}deg)`;
    }

    // === BREATHING ANIMATION ===
    let breathingActive = true;
    function startBreathing() {
      breathingActive = true;
      const ns = ['north','south','east','west'];
      ns.forEach((dir, i) => {
        const q = document.querySelector(`.compass-q-${dir}`);
        if (q) { q.style.animation = `breatheQuad${i} 4s ease-in-out infinite`; q.style.animationDelay = `${i * 0.5}s`; }
      });
    }
    function stopBreathing() {
      breathingActive = false;
      quads.forEach(q => { q.style.animation = ''; q.style.animationDelay = ''; });
    }

    // goldParticles 由 exhibition.js 统一绘制，开场 / Hero / 罗盘复用同一画布。

    // === ROTOR UPDATE ===
    function updateRotor() {
      if (compassRotor) compassRotor.style.transform = `rotate(${currentAngle}deg)`;
    }

    // === QUADRANT DETECTION (relative to mouse position on rotor) ===
    function isInsideRotor(mx, my) {
      if (!compassRotor) return false;
      const rect = compassRotor.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = rect.width / 2;
      const ry = rect.height / 2;
      const dx = (mx - cx) / rx;
      const dy = (my - cy) / ry;
      return (dx * dx + dy * dy) <= 1; // inside ellipse/circle
    }

    function getQuadrantAtMouse(mx, my) {
      if (!compassRotor || !isInsideRotor(mx, my)) return null;
      const rect = compassRotor.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Angle from center to mouse, adjusted for rotor rotation
      const rawAngle = Math.atan2(my - cy, mx - cx) * 180 / Math.PI;
      const adjusted = ((rawAngle - currentAngle) % 360 + 360) % 360;
      // Map to quadrants (rotor's own coordinate system)
      if (adjusted >= 315 || adjusted < 45) return 'east';
      if (adjusted >= 45 && adjusted < 135) return 'south';
      if (adjusted >= 135 && adjusted < 225) return 'west';
      return 'north';
    }

    function getTopQuadrant() {
      let a = ((currentAngle % 360) + 360) % 360;
      if (a < 45 || a >= 315) return 'north';
      if (a >= 45 && a < 135) return 'east';
      if (a >= 135 && a < 225) return 'south';
      return 'west';
    }

    function highlightTopQuadrant() {
      const topQ = getTopQuadrant();
      quads.forEach(q => q.classList.remove('highlight'));
      const topEl = document.querySelector(`.compass-q-${topQ}`);
      if (topEl) topEl.classList.add('highlight');
    }

    // === HOVER POPUP ===
    function showPopup(dir) {
      if (!compassPopup || isSpinning) return;
      const data = quadDataMap[dir];
      if (!data) return;
      const themeEl = compassPopup.querySelector('.popup-theme');
      const descEl = compassPopup.querySelector('.popup-desc');
      if (themeEl) themeEl.textContent = data.theme;
      if (descEl) descEl.textContent = data.desc;
      compassPopup.classList.add('show');
      // Highlight the quadrant
      quads.forEach(q => q.classList.remove('highlight'));
      const qEl = document.querySelector(`.compass-q-${dir}`);
      if (qEl) qEl.classList.add('highlight');
    }
    function hidePopup() {
      if (!compassPopup) return;
      compassPopup.classList.remove('show');
      quads.forEach(q => q.classList.remove('highlight'));
      highlightTopQuadrant();
    }

    // === STAGE TILT (subtle, follows mouse) ===
    function updateTilt() {
      if (!compassStage) return;
      const rect = compassStage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (mouseX - cx) / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, (mouseY - cy) / (rect.height / 2)));
      targetTiltX = ny * -8; targetTiltY = nx * 8;
    }
    function smoothTilt() {
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
      if (outerRing && !isSpinning) {
        outerRing.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
    }

    // === SPIN AND NAVIGATE ===
    function spinAndNavigate(targetUrl) {
      if (isSpinning) return;
      isSpinning = true;
      hidePopup();
      stopBreathing();

      // Calculate spin: rotate one full turn from current position
      const startAngle = currentAngle;
      const spinDuration = 800; // ms
      const startTime = performance.now();
      const totalSpin = 360; // one full rotation
      let spinId;

      function spinStep(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        // Ease-in-out
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        currentAngle = startAngle + totalSpin * eased;
        updateRotor();
        if (progress < 1) {
          spinId = requestAnimationFrame(spinStep);
        } else {
          currentAngle = startAngle + totalSpin;
          updateRotor();
          // Navigate after a tiny delay
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 150);
        }
      }
      spinId = requestAnimationFrame(spinStep);
    }

    // === DRAG HANDLERS ===
    function getAngleFromPoint(cx, cy) {
      if (!compassRotor) return 0;
      const rect = compassRotor.getBoundingClientRect();
      return Math.atan2(cy - rect.top - rect.height/2, cx - rect.left - rect.width/2) * 180 / Math.PI;
    }

    function onDragStart(e) {
      if (isSpinning) return;
      isDragging = true; velocity = 0; idleTime = 0;
      compassStage.classList.add('dragging');
      dragStartAngle = currentAngle;
      lastAngle = getAngleFromPoint(e.clientX, e.clientY);
      lastTime = performance.now();
      if (breathingActive) stopBreathing();
      hidePopup();
      e.preventDefault();
    }
    function onDragMove(e) {
      if (!isDragging || isSpinning) return;
      const now = performance.now();
      const newAngle = getAngleFromPoint(e.clientX, e.clientY);
      let d = newAngle - lastAngle;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      currentAngle += d;
      const dt = now - lastTime;
      if (dt > 0) velocity = d / dt * 16;
      lastAngle = newAngle; lastTime = now;
      updateRotor(); highlightTopQuadrant();
    }
    function onDragEnd(e) {
      if (!isDragging) return;
      isDragging = false; compassStage.classList.remove('dragging');
      const totalDrag = Math.abs(currentAngle - dragStartAngle);
      // Small movement = click
      if (totalDrag < 5) {
        const dir = getQuadrantAtMouse(e.clientX, e.clientY);
        if (dir && quadDataMap[dir] && quadDataMap[dir].target) {
          spinAndNavigate(quadDataMap[dir].target);
          return;
        }
      }
    }

    // === MOUSE EVENTS ===
    compassStage.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', function(e) {
      if (!compassVisible && !isDragging) return;
      mouseX = e.clientX; mouseY = e.clientY;
      updateTilt();
      if (isDragging) {
        onDragMove(e);
      } else if (!isSpinning) {
        // Hover detection for popup
        const dir = getQuadrantAtMouse(e.clientX, e.clientY);
        if (dir && dir !== hoveredQuad) {
          hoveredQuad = dir;
          showPopup(dir);
        } else if (!dir && hoveredQuad) {
          hoveredQuad = null;
          hidePopup();
        }
      }
    });
    document.addEventListener('mouseup', function(e) {
      if (isDragging) onDragEnd(e);
    });

    compassStage.addEventListener('mouseenter', function() { isHovering = true; idleTime = 0; });
    compassStage.addEventListener('mouseleave', function() {
      isHovering = false; targetTiltX = 0; targetTiltY = 0;
      hoveredQuad = null;
      hidePopup();
    });

    // === TOUCH EVENTS ===
    compassStage.addEventListener('touchstart', function(e) {
      if (isSpinning) return;
      const t = e.touches[0];
      mouseX = t.clientX; mouseY = t.clientY; updateTilt();
      // Check for hover popup on touch
      const dir = getQuadrantAtMouse(t.clientX, t.clientY);
      if (dir) { hoveredQuad = dir; showPopup(dir); }
      onDragStart({ clientX: t.clientX, clientY: t.clientY, preventDefault: ()=>{} });
    }, { passive: false });
    document.addEventListener('touchmove', function(e) {
      if (isDragging && !isSpinning) {
        const t = e.touches[0]; mouseX = t.clientX; mouseY = t.clientY;
        updateTilt(); onDragMove({ clientX: t.clientX, clientY: t.clientY });
        e.preventDefault();
      }
    }, { passive: false });
    document.addEventListener('touchend', function(e) {
      if (isDragging) {
        const t = e.changedTouches[0];
        onDragEnd({ clientX: t.clientX, clientY: t.clientY });
      }
      hidePopup();
      hoveredQuad = null;
    });

    // === ANIMATION LOOP ===
    function animate() {
      animationId = null;
      if (!compassVisible || document.hidden) return;
      if (!isDragging && !isSpinning) {
        if (Math.abs(velocity) > 0.01) {
          currentAngle += velocity; velocity *= 0.96;
          if (Math.abs(velocity) < 0.01) velocity = 0;
          updateRotor(); highlightTopQuadrant();
        } else {
          idleTime++;
          // Slow auto-rotate when idle (>2s, not hovering)
          if (idleTime > 120 && !isHovering && breathingActive === false) {
            currentAngle += 0.15; updateRotor(); highlightTopQuadrant();
          }
        }
      }
      rotateNeedle();
      smoothTilt();
      animationId = requestAnimationFrame(animate);
    }

    // Restart breathing after drag idle
    setInterval(() => {
      if (!isDragging && !isSpinning && Math.abs(velocity) < 0.02 && !breathingActive) {
        startBreathing();
      }
    }, 2000);

    // === INIT ===
    updateRotor();
    highlightTopQuadrant();
    startBreathing();
    function updateActivity() {
      compassStage.classList.toggle('compass-in-view', compassVisible && !document.hidden);
      if (compassVisible && !document.hidden && !animationId) animationId = requestAnimationFrame(animate);
      else if ((!compassVisible || document.hidden) && animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
    const compassObserver = new IntersectionObserver(entries => {
      compassVisible = entries[0].isIntersecting;
      updateActivity();
    });
    compassObserver.observe(compassStage);
    document.addEventListener('visibilitychange', updateActivity);
    compassStage._cleanup = function() { if (animationId) cancelAnimationFrame(animationId); };
  }

  // ============================================================
  // SCROLL UNFURL FOR PAINTINGS (卷轴从右向左展开，点击触发)
  // ============================================================
  function initScrollUnfurlPaintings() {
    document.querySelectorAll('.unfurl-scroll').forEach(scroll => {
      const img = scroll.querySelector('.unfurl-img');
      const wrap = scroll.querySelector('.unfurl-img-wrap');
      if (!img || !wrap) return;

      let open = false;
      let collapseTimer = null;
      scroll.addEventListener('click', function() {
        clearTimeout(collapseTimer);
        open = !open;
        if (open && img.naturalWidth) {
          // Instant height expand, then painting slides in
          const h = (img.naturalHeight / img.naturalWidth) * scroll.clientWidth;
          wrap.style.height = h + 'px';
          img.style.transform = 'translateX(0)';
        } else {
          img.style.transform = 'translateX(100%)';
          // Collapse height after slide-out finishes
          collapseTimer = setTimeout(() => { if (!open) wrap.style.height = '0'; }, 1800);
        }
      });
    });
  }

  // ============================================================
  // INIT ALL
  // ============================================================
  function initAll() {
    handleNavScroll();
    handleBackToTop();
    setActiveNavLink();
    initScrollReveal();
    initCarousel();
    initFormValidation();
    initImageLightbox();
    initPatternZoom();
    initHeroScroll();
    initScrollUnveil();
    initTimelineAnimation();
    initCounters();
    initParallax();
    // New advanced features
    initCaveLightbox();
    initSteamAnimations();
    initPatternWindowTilt();
    initBanquetInteractions();
    initCaveAtmosphere();
    initHighlightCards();
    initCompass();
    initScrollUnfurlPaintings();
  }

  // Scroll event handler (throttled)
  let scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        handleNavScroll();
        handleBackToTop();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Initialize everything
  // Set initial navbar state (at top)
  if (navbar && window.scrollY <= 60) {
    navbar.classList.add('at-top');
  }
  initAll();
});
