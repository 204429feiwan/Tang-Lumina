(() => {
  'use strict';

  const ENABLE_VIDEO_ECHO = true;
  const ACTIVE_THRESHOLD = 0.35;
  const FUTURE_Z_GAP = 900;
  const THEATRE_PERSPECTIVE = 1600;
  const ECHO_SAMPLE_MS = 140;
  const MAX_ECHO_DPR = 1.5;
  const MAX_ECHO_WIDTH = 960;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;

  const danceItems = [
    {
      id: 'nichang-yuyi',
      index: 1,
      title: '霓裳羽衣舞',
      screenTitle: '霓 裳 羽 衣',
      enTitle: 'NI CHANG YU YI',
      origin: '宫廷大曲',
      video: '../videos/dance/霓裳羽衣舞.mp4',
      poster: '../images/hero/5.jpg',
      objectPosition: '50% 50%',
      x: 18,
      y: -5,
      echo: 'float'
    },
    {
      id: 'huxuan',
      index: 2,
      title: '胡旋舞',
      screenTitle: '胡 旋 舞',
      enTitle: 'HU XUAN DANCE',
      origin: '西域传入',
      video: '../videos/dance/胡旋舞.mp4',
      poster: '../images/hero/5.jpg',
      objectPosition: '50% 50%',
      x: -20,
      y: 6,
      echo: 'orbit'
    },
    {
      id: 'qinwang-pozhen',
      index: 3,
      title: '秦王破阵乐',
      screenTitle: '秦 王 破 阵',
      enTitle: 'QIN WANG PO ZHEN',
      origin: '武舞国乐',
      video: '../videos/dance/秦王破阵乐.mp4',
      poster: '../images/hero/5.jpg',
      objectPosition: '50% 50%',
      x: 13,
      y: -8,
      echo: 'formation'
    },
    {
      id: 'liyuan-yayue',
      index: 4,
      title: '梨园雅乐',
      screenTitle: '梨 园 雅 乐',
      enTitle: 'LI YUAN YA YUE',
      origin: '皇家乐府',
      video: '../videos/dance/梨园雅乐.mp4',
      poster: '../images/hero/5.jpg',
      objectPosition: '50% 50%',
      x: -16,
      y: 8,
      echo: 'flow'
    },
    {
      id: 'jianqi',
      index: 5,
      title: '剑器舞',
      screenTitle: '剑 器 舞',
      enTitle: 'JIAN QI DANCE',
      origin: '道具舞',
      video: '../videos/dance/剑器舞.mp4',
      poster: '../images/hero/5.jpg',
      objectPosition: '50% 50%',
      x: 18,
      y: 2,
      echo: 'slash'
    },
    {
      id: 'qiuci',
      index: 6,
      title: '龟兹乐',
      screenTitle: '龟 兹 乐',
      enTitle: 'KUCHA MUSIC',
      origin: '西域音乐',
      video: '../videos/dance/龟兹.mp4',
      poster: '../images/hero/5.jpg',
      objectPosition: '50% 50%',
      x: -6,
      y: -4,
      echo: 'pulse'
    }
  ];

  let theatre = null;

  function initDanceTheatre() {
    const section = document.getElementById('danceTheatre');
    const scrollSpace = document.getElementById('danceScrollSpace');
    const stage = section?.querySelector('.dance-stage');
    const world = document.getElementById('danceWorld');
    const meta = document.getElementById('danceMeta');
    const progress = document.getElementById('danceProgress');
    const scrollHint = document.getElementById('danceScrollHint');
    if (!section || !scrollSpace || !stage || !world || !meta || !progress || !scrollHint) return;

    stage.style.perspective = `${THEATRE_PERSPECTIVE}px`;

    theatre = {
      section,
      scrollSpace,
      stage,
      world,
      meta,
      progress,
      scrollHint,
      screens: [],
      videos: [],
      canvases: [],
      loadedVideos: new Set([0]),
      targetProgress: 0,
      currentProgress: 0,
      activeIndex: -1,
      metaIndex: 0,
      sectionVisible: false,
      introStarted: false,
      frameId: 0,
      echoTimer: 0,
      echoIndex: -1,
      echoFrames: [],
      echoAvailable: ENABLE_VIDEO_ECHO && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      focus: null,
      metaTimer: 0,
      fpsStartedAt: 0,
      fpsFrames: 0,
      fpsLastAt: 0,
      destroyed: false
    };

    createDanceScreens();
    createDanceProgress();
    bindDanceEvents();
    theatre.targetProgress = calculateTheatreProgress();
    theatre.currentProgress = theatre.targetProgress;
    renderTheatre();
  }

  function createDanceScreens() {
    danceItems.forEach((item, index) => {
      const screen = document.createElement('article');
      screen.className = 'dance-screen';
      screen.dataset.index = String(index);
      screen.dataset.dance = item.id;
      screen.setAttribute('aria-label', `${item.title}，点击进入沉浸播放`);
      screen.innerHTML = `
        <div class="dance-screen__frame">
          <video muted playsinline loop preload="${index === 0 ? 'auto' : 'metadata'}" aria-label="${item.title}视频"></video>
          <canvas class="dance-echo-canvas" aria-hidden="true"></canvas>
          <div class="dance-screen__caption" aria-hidden="true">
            <span class="dance-screen__number">${String(item.index).padStart(2, '0')}</span>
            <i></i>
            <span><strong>${item.screenTitle}</strong><small>${item.origin}</small></span>
          </div>
        </div>`;

      const video = screen.querySelector('video');
      const canvas = screen.querySelector('canvas');
      video.src = item.video;
      video.style.objectPosition = item.objectPosition;
      video.volume = 0.8;
      video.addEventListener('error', () => screen.classList.add('has-video-error'));
      screen.addEventListener('click', () => {
        if (theatre?.activeIndex === index && !theatre.focus) openDanceFocus(index);
      });
      screen.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && theatre?.activeIndex === index && !theatre.focus) {
          event.preventDefault();
          openDanceFocus(index);
        }
      });

      theatre.world.appendChild(screen);
      theatre.screens.push(screen);
      theatre.videos.push(video);
      theatre.canvases.push(canvas);
    });
  }

  function createDanceProgress() {
    const fill = document.createElement('i');
    fill.className = 'dance-progress__fill';
    theatre.progress.appendChild(fill);

    danceItems.forEach((item, index) => {
      const node = document.createElement('span');
      node.className = 'dance-progress__node';
      node.dataset.index = String(index);
      node.innerHTML = `<span>${String(item.index).padStart(2, '0')}</span>`;
      theatre.progress.appendChild(node);
    });
  }

  function bindDanceEvents() {
    theatre.onScroll = () => {
      theatre.targetProgress = calculateTheatreProgress();
      if (theatre.sectionVisible) requestTheatreFrame();
    };
    theatre.onResize = () => {
      theatre.targetProgress = calculateTheatreProgress();
      if (theatre.sectionVisible) requestTheatreFrame();
    };
    theatre.onVisibility = () => {
      if (document.hidden) {
        pauseAllDanceVideos();
        stopVideoEcho();
        stopTheatreFrame();
      } else if (theatre.sectionVisible) {
        syncVideoPlayback(theatre.activeIndex, true);
        requestTheatreFrame();
      }
    };
    theatre.onKeydown = event => {
      if (event.key === 'Escape' && theatre.focus) closeDanceFocus();
    };
    theatre.onPageHide = () => destroyDanceTheatre();

    window.addEventListener('scroll', theatre.onScroll, { passive: true });
    window.addEventListener('resize', theatre.onResize, { passive: true });
    document.addEventListener('visibilitychange', theatre.onVisibility);
    document.addEventListener('keydown', theatre.onKeydown);
    window.addEventListener('pagehide', theatre.onPageHide, { once: true });

    theatre.sectionObserver = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting;
      theatre.sectionVisible = visible;
      if (visible) {
        theatre.targetProgress = calculateTheatreProgress();
        if (!theatre.introStarted) playTheatreIntro();
        requestTheatreFrame();
      } else {
        pauseAllDanceVideos();
        stopVideoEcho();
        stopTheatreFrame();
      }
    }, { threshold: 0.01 });
    theatre.sectionObserver.observe(theatre.section);
  }

  function playTheatreIntro() {
    theatre.introStarted = true;
    theatre.section.classList.add('is-entered');
    theatre.screens.forEach((screen, index) => {
      const delay = index === 0 ? 980 : 260 + index * 120;
      window.setTimeout(() => {
        if (theatre?.destroyed) return;
        screen.classList.add('is-revealed');
        requestTheatreFrame();
      }, delay);
    });
  }

  function calculateTheatreProgress() {
    if (!theatre) return 0;
    const rect = theatre.scrollSpace.getBoundingClientRect();
    const travel = Math.max(1, theatre.scrollSpace.offsetHeight - window.innerHeight);
    return clamp(-rect.top / travel, 0, 1) * (danceItems.length - 1);
  }

  function requestTheatreFrame() {
    if (!theatre || theatre.frameId || theatre.destroyed || document.hidden) return;
    theatre.frameId = requestAnimationFrame(updateTheatreFrame);
  }

  function stopTheatreFrame() {
    if (!theatre?.frameId) return;
    cancelAnimationFrame(theatre.frameId);
    theatre.frameId = 0;
  }

  function updateTheatreFrame(now) {
    if (!theatre || theatre.destroyed) return;
    theatre.frameId = 0;

    const easing = theatre.reducedMotion ? 0.2 : 0.1;
    theatre.currentProgress += (theatre.targetProgress - theatre.currentProgress) * easing;
    if (Math.abs(theatre.targetProgress - theatre.currentProgress) < 0.0008) {
      theatre.currentProgress = theatre.targetProgress;
    }

    renderTheatre();
    monitorTheatreFps(now);

    if (theatre.sectionVisible && Math.abs(theatre.targetProgress - theatre.currentProgress) > 0.0008) {
      requestTheatreFrame();
    }
  }

  function renderTheatre() {
    if (!theatre) return;
    const progressValue = theatre.currentProgress;
    let nearestIndex = clamp(Math.round(progressValue), 0, danceItems.length - 1);
    const nearestDistance = Math.abs(nearestIndex - progressValue);
    const playbackIndex = nearestDistance < ACTIVE_THRESHOLD && theatre.screens[nearestIndex].classList.contains('is-revealed')
      ? nearestIndex
      : -1;

    updateDanceScreens(progressValue);
    setActiveDance(playbackIndex);
    updateDanceMeta(nearestIndex);
    updateDanceProgress(progressValue, nearestIndex);
    preloadNearbyVideo(progressValue);

    const activeVideo = playbackIndex >= 0 ? theatre.videos[playbackIndex] : null;
    if (activeVideo) {
      const focus = 1 - clamp(Math.abs(playbackIndex - progressValue), 0, 1);
      activeVideo.playbackRate = clamp(0.45 + focus * 0.55, 0.45, 1);
    }
  }

  function updateDanceScreens(progressValue) {
    theatre.screens.forEach((screen, index) => {
      const item = danceItems[index];
      const delta = index - progressValue;
      const distance = Math.abs(delta);
      const focus = 1 - clamp(distance, 0, 1);
      let z;
      let opacity;
      let x = item.x;
      let y = item.y;

      if (delta >= 0) {
        z = -delta * (theatre.reducedMotion ? 180 : FUTURE_Z_GAP);
        if (delta <= 1) opacity = lerp(1, 0.38, delta);
        else if (delta <= 2) opacity = lerp(0.38, 0.15, delta - 1);
        else opacity = Math.max(0.025, 0.15 - (delta - 2) * 0.055);
      } else {
        z = Math.min(distance * (theatre.reducedMotion ? 80 : 420), theatre.reducedMotion ? 120 : 520);
        opacity = Math.max(0, 1 - distance / 0.58);
        if (!theatre.reducedMotion) {
          const passDirection = item.x >= 0 ? 1 : -1;
          x += passDirection * Math.min(distance * 24, 16);
          y += Math.min(distance * 7, 5);
        }
      }

      const blur = theatre.reducedMotion ? Math.min(distance * 1.2, 2) : Math.min(distance * 2.8, 7);
      const brightness = 0.28 + focus * 0.72;
      const saturation = 0.28 + focus * 0.72;
      const contrast = 0.9 + focus * 0.1;
      const rotateY = theatre.reducedMotion ? 0 : clamp(-x * 0.08, -1.6, 1.6);

      screen.style.transform = `translate(-50%, -50%) translate3d(${x}vw, ${y}vh, ${z}px) rotateY(${rotateY}deg)`;
      screen.style.opacity = opacity.toFixed(3);
      screen.style.filter = `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(3)}) saturate(${saturation.toFixed(3)}) contrast(${contrast.toFixed(3)})`;
      screen.style.zIndex = String(1000 - Math.round(distance * 100));
      screen.setAttribute('aria-hidden', opacity < 0.08 ? 'true' : 'false');
    });
  }

  function setActiveDance(index) {
    if (theatre.activeIndex === index) return;
    theatre.activeIndex = index;
    theatre.screens.forEach((screen, screenIndex) => {
      const active = screenIndex === index;
      screen.classList.toggle('is-active', active);
      screen.tabIndex = active ? 0 : -1;
    });
    syncVideoPlayback(index);
  }

  function syncVideoPlayback(index, force = false) {
    if (!theatre || document.hidden || !theatre.sectionVisible || theatre.focus) return;
    theatre.videos.forEach((video, videoIndex) => {
      if (videoIndex !== index) {
        if (!video.paused) video.pause();
        return;
      }
      if (!force && !video.paused) return;
      video.muted = true;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {
          if (!theatre || theatre.activeIndex !== videoIndex) return;
          video.muted = true;
        });
      }
    });

    if (index >= 0) startVideoEcho(index);
    else stopVideoEcho();
  }

  function pauseAllDanceVideos() {
    theatre?.videos.forEach(video => {
      if (!video.paused) video.pause();
    });
  }

  function preloadNearbyVideo(progressValue) {
    const nextIndex = Math.ceil(progressValue);
    [nextIndex, nextIndex + 1].forEach(index => {
      if (index < 0 || index >= theatre.videos.length || theatre.loadedVideos.has(index)) return;
      if (Math.abs(index - progressValue) > 1.15) return;
      theatre.loadedVideos.add(index);
      theatre.videos[index].load();
    });
  }

  function updateDanceMeta(index) {
    if (theatre.metaIndex === index) return;
    theatre.metaIndex = index;
    theatre.meta.classList.add('is-changing');
    window.clearTimeout(theatre.metaTimer);
    theatre.metaTimer = window.setTimeout(() => {
      if (!theatre) return;
      const item = danceItems[index];
      theatre.meta.querySelector('.dance-meta__index span').textContent = String(item.index).padStart(2, '0');
      theatre.meta.querySelector('h3').textContent = item.title;
      theatre.meta.querySelector('.dance-meta__en').textContent = item.enTitle;
      theatre.meta.querySelector('.dance-meta__origin').textContent = item.origin;
      theatre.meta.classList.remove('is-changing');
    }, 220);
  }

  function updateDanceProgress(progressValue, nearestIndex) {
    const percent = clamp(progressValue / (danceItems.length - 1), 0, 1) * 100;
    theatre.progress.style.setProperty('--dance-progress', `${percent}%`);
    theatre.progress.querySelectorAll('.dance-progress__node').forEach((node, index) => {
      node.classList.toggle('is-active', index === nearestIndex);
    });
    const lastApproaching = progressValue > danceItems.length - 1.22;
    const label = theatre.scrollHint.querySelector('span');
    if (label) label.textContent = lastApproaching ? '继续向下 · 离开乐舞' : '滚轮 · 穿行六幕';
  }

  function startVideoEcho(index) {
    if (!theatre?.echoAvailable || theatre.reducedMotion || theatre.echoIndex === index || theatre.focus) return;
    stopVideoEcho();
    const video = theatre.videos[index];
    const canvas = theatre.canvases[index];
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      theatre.echoAvailable = false;
      return;
    }

    theatre.echoIndex = index;
    theatre.echoFrames = Array.from({ length: 4 }, () => document.createElement('canvas'));
    canvas.classList.add('is-running');

    const sample = () => {
      if (!theatre || theatre.echoIndex !== index || document.hidden || video.paused || video.readyState < 2) return;
      try {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_ECHO_DPR);
        const echoScale = Math.min(dpr, MAX_ECHO_WIDTH / rect.width);
        const width = Math.max(1, Math.round(rect.width * echoScale));
        const height = Math.max(1, Math.round(rect.height * echoScale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          theatre.echoFrames.forEach(frame => {
            frame.width = width;
            frame.height = height;
          });
        }

        const frame = theatre.echoFrames.pop();
        const frameContext = frame.getContext('2d', { alpha: true });
        frameContext.clearRect(0, 0, width, height);
        drawVideoCover(frameContext, video, width, height);
        theatre.echoFrames.unshift(frame);
        drawEchoFrames(context, theatre.echoFrames, danceItems[index].echo, width, height);
      } catch (_error) {
        theatre.echoAvailable = false;
        stopVideoEcho();
      }
    };

    sample();
    theatre.echoTimer = window.setInterval(sample, ECHO_SAMPLE_MS);
  }

  function stopVideoEcho() {
    if (!theatre) return;
    if (theatre.echoTimer) window.clearInterval(theatre.echoTimer);
    theatre.echoTimer = 0;
    if (theatre.echoIndex >= 0) {
      const canvas = theatre.canvases[theatre.echoIndex];
      canvas?.classList.remove('is-running');
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
    theatre.echoIndex = -1;
    theatre.echoFrames = [];
  }

  function drawVideoCover(context, video, width, height) {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) return;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = width / height;
    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;
    if (sourceRatio > targetRatio) {
      sw = sourceHeight * targetRatio;
      sx = (sourceWidth - sw) / 2;
    } else {
      sh = sourceWidth / targetRatio;
      sy = (sourceHeight - sh) / 2;
    }
    context.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
  }

  function drawEchoFrames(context, frames, motion, width, height) {
    const opacities = [0.12, 0.07, 0.035, 0.018];
    context.clearRect(0, 0, width, height);
    frames.forEach((frame, index) => {
      const layer = index + 1;
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      let scale = 1;
      if (motion === 'float') {
        dy = -5 * layer;
        scale = 1 + 0.006 * layer;
      } else if (motion === 'orbit') {
        rotation = (index % 2 ? 1 : -1) * 0.012 * layer;
        dx = (index % 2 ? 1 : -1) * 4 * layer;
      } else if (motion === 'slash') {
        dx = 8 * layer;
        dy = -6 * layer;
      } else if (motion === 'formation') {
        dx = (index % 2 ? -1 : 1) * 9 * layer;
      } else if (motion === 'flow') {
        dx = 10 * layer;
        scale = 1 + 0.002 * layer;
      } else if (motion === 'pulse') {
        scale = 1 + 0.009 * layer;
      }

      context.save();
      context.globalAlpha = opacities[index];
      context.translate(width / 2 + dx, height / 2 + dy);
      context.rotate(rotation);
      context.scale(scale, scale);
      context.drawImage(frame, -width / 2, -height / 2, width, height);
      context.restore();
    });
    context.globalAlpha = 1;
  }

  function monitorTheatreFps(now) {
    if (!theatre.echoAvailable || theatre.echoIndex < 0 || theatre.focus) {
      theatre.fpsStartedAt = 0;
      theatre.fpsFrames = 0;
      theatre.fpsLastAt = 0;
      return;
    }
    if (!theatre.fpsLastAt || now - theatre.fpsLastAt > 250) {
      theatre.fpsStartedAt = now;
      theatre.fpsFrames = 0;
    }
    theatre.fpsLastAt = now;
    theatre.fpsFrames += 1;
    const elapsed = now - theatre.fpsStartedAt;
    if (elapsed < 5000) return;
    const fps = theatre.fpsFrames / (elapsed / 1000);
    if (fps < 24) {
      theatre.echoAvailable = false;
      stopVideoEcho();
    }
    theatre.fpsStartedAt = now;
    theatre.fpsFrames = 0;
  }

  function openDanceFocus(index) {
    if (!theatre || theatre.focus || theatre.activeIndex !== index) return;
    const item = danceItems[index];
    const screen = theatre.screens[index];
    const frame = screen.querySelector('.dance-screen__frame');
    const video = theatre.videos[index];
    const rect = frame.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'dance-focus-layer';
    layer.innerHTML = `
      <div class="dance-focus-viewport"></div>
      <div class="dance-focus-ui">
        <div class="dance-focus-copy"><h3>${item.title}</h3><p>${item.enTitle}</p><small>${item.origin}</small></div>
        <button class="dance-focus-close" type="button" aria-label="返回六幕"><span>×</span>返回六幕</button>
        <button class="dance-focus-sound" type="button">开启声音</button>
      </div>`;

    const viewport = layer.querySelector('.dance-focus-viewport');
    const closeButton = layer.querySelector('.dance-focus-close');
    const soundButton = layer.querySelector('.dance-focus-sound');
    Object.assign(viewport.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });

    stopVideoEcho();
    const nextSibling = video.nextSibling;
    viewport.appendChild(video);
    video.controls = true;
    video.muted = false;
    video.volume = 0.8;
    document.body.appendChild(layer);

    theatre.focus = {
      index,
      layer,
      viewport,
      video,
      screen,
      parent: frame,
      nextSibling,
      bodyOverflow: document.body.style.overflow
    };
    screen.classList.add('is-focus-source');
    theatre.section.classList.add('is-focus-open');
    document.body.classList.add('dance-focus-active');
    document.body.style.overflow = 'hidden';

    closeButton.addEventListener('click', closeDanceFocus);
    soundButton.addEventListener('click', () => {
      video.muted = false;
      video.volume = 0.8;
      const attempt = video.play();
      if (attempt && typeof attempt.then === 'function') {
        attempt.then(() => soundButton.classList.remove('is-visible')).catch(() => {
          video.muted = true;
          soundButton.classList.add('is-visible');
        });
      }
    });

    requestAnimationFrame(() => layer.classList.add('is-open'));
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        video.muted = true;
        soundButton.classList.add('is-visible');
        video.play().catch(() => {});
      });
    }
  }

  function closeDanceFocus() {
    if (!theatre?.focus) return;
    const focus = theatre.focus;
    theatre.focus = null;
    const originRect = focus.parent.getBoundingClientRect();
    focus.layer.classList.remove('is-open');
    Object.assign(focus.viewport.style, {
      left: `${originRect.left}px`,
      top: `${originRect.top}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`
    });

    window.setTimeout(() => {
      if (focus.nextSibling && focus.nextSibling.parentNode === focus.parent) {
        focus.parent.insertBefore(focus.video, focus.nextSibling);
      } else {
        focus.parent.insertBefore(focus.video, focus.parent.firstChild);
      }
      focus.video.controls = false;
      focus.video.muted = true;
      focus.screen.classList.remove('is-focus-source');
      focus.layer.remove();
      theatre.section.classList.remove('is-focus-open');
      document.body.classList.remove('dance-focus-active');
      document.body.style.overflow = focus.bodyOverflow;
      syncVideoPlayback(theatre.activeIndex, true);
      requestTheatreFrame();
    }, 740);
  }

  function destroyDanceTheatre() {
    if (!theatre || theatre.destroyed) return;
    theatre.destroyed = true;
    stopTheatreFrame();
    stopVideoEcho();
    pauseAllDanceVideos();
    window.clearTimeout(theatre.metaTimer);
    window.removeEventListener('scroll', theatre.onScroll);
    window.removeEventListener('resize', theatre.onResize);
    document.removeEventListener('visibilitychange', theatre.onVisibility);
    document.removeEventListener('keydown', theatre.onKeydown);
    theatre.sectionObserver?.disconnect();
    if (theatre.focus) {
      document.body.style.overflow = theatre.focus.bodyOverflow;
      theatre.focus.layer.remove();
      document.body.classList.remove('dance-focus-active');
    }
  }

  window.DanceTheatre = {
    init: initDanceTheatre,
    destroy: destroyDanceTheatre,
    getState: () => theatre ? {
      progress: theatre.currentProgress,
      targetProgress: theatre.targetProgress,
      activeIndex: theatre.activeIndex,
      metaIndex: theatre.metaIndex,
      echoEnabled: theatre.echoAvailable,
      echoIndex: theatre.echoIndex,
      focusOpen: Boolean(theatre.focus),
      playingVideos: theatre.videos.filter(video => !video.paused).length
    } : null
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDanceTheatre, { once: true });
  } else {
    initDanceTheatre();
  }
})();
