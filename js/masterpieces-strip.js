(function () {
  'use strict';

  var track = document.getElementById('tangTreasureScroll');
  if (!track || track.dataset.masterpiecesReady === 'true') return;
  track.dataset.masterpiecesReady = 'true';

  var strip = track.closest('.tang-treasure-strip');

  var cards = Array.from(track.querySelectorAll('.artifact-card'));
  var sourceCards = Array.from(document.querySelectorAll('.museum-section .card-museum'));

  function getSourceIndex(title) {
    return sourceCards.findIndex(function (card) {
      var node = card.querySelector('.museum-body h5');
      return node && node.textContent.trim() === title;
    });
  }

  cards.forEach(function (card) {
    var title = card.dataset.title || '';
    var sourceIndex = getSourceIndex(title);
    if (sourceIndex >= 0) card.dataset.artifactIndex = String(sourceIndex);

    var hero = card.querySelector('.artifact-hero');
    if (hero && hero.getAttribute('src')) {
      var preloader = new Image();
      preloader.decoding = 'async';
      preloader.src = hero.currentSrc || hero.src;
    }
  });

  var pointerDown = false;
  var pointerId = null;
  var activeCard = null;
  var startX = 0;
  var startLeft = 0;
  var lastX = 0;
  var lastTime = 0;
  var velocity = 0;
  var moved = false;
  var suppressClickUntil = 0;
  var inertiaFrame = 0;
  var wheelFrame = 0;
  var wheelTarget = track.scrollLeft;

  function stopInertia() {
    if (inertiaFrame) cancelAnimationFrame(inertiaFrame);
    inertiaFrame = 0;
  }

  function stopWheelAnimation() {
    if (wheelFrame) cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    wheelTarget = track.scrollLeft;
  }

  function getWheelPixels(event) {
    var pixels = event.deltaY;
    if (event.deltaMode === 1) pixels *= 16;
    else if (event.deltaMode === 2) pixels *= track.clientWidth;
    return Math.max(-180, Math.min(180, pixels));
  }

  function startInertia() {
    stopInertia();
    if (Math.abs(velocity) < .12) return;

    function glide() {
      velocity *= .92;
      track.scrollLeft -= velocity * 16;
      wheelTarget = track.scrollLeft;
      if (Math.abs(velocity) > .1) inertiaFrame = requestAnimationFrame(glide);
      else inertiaFrame = 0;
    }
    inertiaFrame = requestAnimationFrame(glide);
  }

  track.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopInertia();
    stopWheelAnimation();
    pointerDown = true;
    moved = false;
    pointerId = event.pointerId;
    activeCard = event.target.closest('.artifact-card');
    startX = lastX = event.clientX;
    startLeft = track.scrollLeft;
    lastTime = performance.now();
    velocity = 0;
    track.classList.add('is-dragging');
    track.setPointerCapture(pointerId);
  });

  track.addEventListener('pointermove', function (event) {
    if (!pointerDown || event.pointerId !== pointerId) return;
    var now = performance.now();
    var dx = event.clientX - lastX;
    var dt = Math.max(8, now - lastTime);
    if (Math.abs(event.clientX - startX) > 5) moved = true;
    track.scrollLeft = startLeft - (event.clientX - startX);
    wheelTarget = track.scrollLeft;
    velocity = dx / dt;
    lastX = event.clientX;
    lastTime = now;
  });

  function finishPointer(event) {
    if (!pointerDown || event.pointerId !== pointerId) return;
    var clickCard = activeCard;
    pointerDown = false;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
    pointerId = null;
    activeCard = null;
    if (moved) suppressClickUntil = performance.now() + 80;
    else if (clickCard) {
      openArtifact(clickCard);
      suppressClickUntil = performance.now() + 80;
    }
    startInertia();
  }

  track.addEventListener('pointerup', finishPointer);
  track.addEventListener('pointercancel', finishPointer);
  track.addEventListener('lostpointercapture', function () {
    if (!pointerDown) return;
    pointerDown = false;
    pointerId = null;
    activeCard = null;
    track.classList.remove('is-dragging');
  });

  function isStripFullyPresented() {
    if (!strip) return true;
    var rect = strip.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visibleTop = Math.max(0, rect.top);
    var visibleBottom = Math.min(vh, rect.bottom);
    return (visibleBottom - visibleTop) >= vh * 0.7;
  }

  track.addEventListener('wheel', function (event) {
    // 只有镇馆之宝完整呈现（占满视口 ≥90%）时才接管滚轮，避免页面滚动时误触发。
    if (!isStripFullyPresented()) return;
    var verticalIntent = Math.abs(event.deltaY) > Math.abs(event.deltaX);
    if (!verticalIntent) return;
    var maxScroll = track.scrollWidth - track.clientWidth;
    // 向上滚动先把展柜倒回最左端，倒到头后放行，让页面继续回到上方。
    var atStart = track.scrollLeft <= 1 && event.deltaY < 0;
    var atEnd = track.scrollLeft >= maxScroll - 1 && event.deltaY > 0;
    if (atStart || atEnd) return;

    event.preventDefault();
    stopInertia();
    if (!wheelFrame) wheelTarget = track.scrollLeft;
    wheelTarget = Math.max(0, Math.min(maxScroll, wheelTarget + getWheelPixels(event) * 1.05));
    if (wheelFrame) return;

    function easeWheel() {
      var distance = wheelTarget - track.scrollLeft;
      track.scrollLeft += distance * .22;
      if (Math.abs(distance) > .5) wheelFrame = requestAnimationFrame(easeWheel);
      else {
        track.scrollLeft = wheelTarget;
        wheelFrame = 0;
      }
    }
    wheelFrame = requestAnimationFrame(easeWheel);
  }, { passive: false });

  function openArtifact(card) {
    var index = Number(card.dataset.artifactIndex);
    if (!Number.isInteger(index) || performance.now() < suppressClickUntil) return;

    var proxy = document.createElement('button');
    proxy.type = 'button';
    proxy.className = 'museum-archive-card';
    proxy.dataset.artifactIndex = String(index);
    proxy.hidden = true;
    document.body.appendChild(proxy);
    proxy.click();
    proxy.remove();
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { openArtifact(card); });
    card.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      moved = false;
      openArtifact(card);
    });
    card.addEventListener('pointerenter', function () { card.classList.add('is-focused'); });
    card.addEventListener('pointerleave', function () { card.classList.remove('is-focused'); });
  });
})();
