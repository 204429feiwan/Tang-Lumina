/**
 * 盛唐雅粹 - 背景音乐模块
 * 功能：自动播放、跨页面续播、手动暂停/播放、视频联动
 * 所有页面共享此文件，避免重复代码
 */
(function () {
  // iframe 的音乐由外层页面管理，独立打开则创建自己的全局播放器。
  if (window.self !== window.top || document.documentElement.dataset.tangMusicReady === 'true') return;
  var scriptURL = document.currentScript.src;
  document.documentElement.dataset.tangMusicReady = 'true';
  var STATE_KEY = 'tang_music_state';
  var TIME_KEY  = 'tang_music_time';
  // 存储不可用时仍允许本页控制音乐，不让存储异常中断其他交互。
  function readStorage(storageName, key) {
    try { return window[storageName].getItem(key); } catch (error) { return null; }
  }
  function writeStorage(storageName, key, value) {
    try { window[storageName].setItem(key, value); } catch (error) {}
  }
  var state = readStorage('localStorage', STATE_KEY);
  if (state !== 'playing' && state !== 'paused') {
    state = 'playing';
    writeStorage('localStorage', STATE_KEY, state);
  }
  function setPreference(nextState) {
    state = nextState;
    writeStorage('localStorage', STATE_KEY, state);
  }

  var audio = document.getElementById('bgMusic');
  var toggle = document.getElementById('musicToggle');
  var closeBtn = document.getElementById('musicClose');
  var widget = document.getElementById('musicWidget');

  if (!document.getElementById('tangMusicStyles')) {
    var styles = document.createElement('link');
    styles.id = 'tangMusicStyles';
    styles.rel = 'stylesheet';
    styles.href = new URL('../css/music.css', scriptURL).href;
    document.head.appendChild(styles);
  }
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'bgMusic';
    audio.loop = true;
    audio.preload = 'auto';
    document.body.appendChild(audio);
  }
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'musicWidget';
    widget.className = 'music-widget tang-ui-dark';
    document.body.appendChild(widget);
  }
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = 'musicToggle';
    toggle.className = 'music-toggle paused';
    widget.appendChild(toggle);
  }
  widget.classList.remove('hidden');
  if (closeBtn) closeBtn.remove();
  toggle.type = 'button';
  toggle.innerHTML = '<span class="music-symbol" aria-hidden="true"><i></i><i></i><i></i></span><span class="music-copy" aria-hidden="true"><span class="music-label">背景音乐</span><span class="music-status"></span></span>';
  var statusLabel = toggle.querySelector('.music-status');

  audio.src = new URL('../images/音频.mp3', scriptURL).href;
  audio.volume = 0.5;

  var activeVideos = new Set();
  var interruptedByVideo = false;
  var playPending = false;
  var resumeWhenSettled = false;

  function hasPlayingVideo() {
    activeVideos.forEach(function (video) {
      if (!video.isConnected || video.paused || video.ended) activeVideos.delete(video);
    });
    document.querySelectorAll('video').forEach(function (video) {
      if (!video.paused && !video.ended) activeVideos.add(video);
    });
    return activeVideos.size > 0;
  }

  // ========== UI 状态同步 ==========
  function setUI(s) {
    if (s === 'playing') {
      toggle.classList.add('playing');
      toggle.classList.remove('paused');
      toggle.title = '暂停背景音乐';
    } else {
      toggle.classList.add('paused');
      toggle.classList.remove('playing');
      toggle.title = '播放背景音乐';
    }
    statusLabel.textContent = s === 'playing' ? '播放中' : (state === 'paused' ? '已暂停' : '点击播放');
    if (hasPlayingVideo()) {
      statusLabel.textContent = state === 'playing' ? '视频播放中' : '已暂停';
      toggle.title = state === 'playing' ? '视频结束后恢复音乐，点击取消' : '视频播放中，点击启用结束后续播';
    }
    toggle.setAttribute('aria-label', toggle.title);
    toggle.setAttribute('aria-pressed', s === 'playing' ? 'true' : 'false');
  }

  // 音频真正开始播放前保持暂停外观，避免自动播放被拦截时状态显示错误
  setUI(state === 'playing' && !audio.paused ? 'playing' : 'paused');

  // ========== 跨页面续播：恢复播放进度 ==========
  var savedTime = parseFloat(readStorage('sessionStorage', TIME_KEY)) || 0;
  function restoreTime() {
    if (savedTime > 0.5) {
      try { audio.currentTime = savedTime; } catch (error) {}
    }
  }
  restoreTime();
  audio.addEventListener('loadedmetadata', restoreTime, { once: true });

  function saveTime() {
    if (audio.currentTime > 0 || savedTime === 0) {
      writeStorage('sessionStorage', TIME_KEY, audio.currentTime);
    }
  }

  // 每 0.5 秒保存进度（更频繁 = 更精确的续播）
  var saveTimer = setInterval(function () {
    if (!audio.paused) {
      saveTime();
    }
  }, 500);

  // ========== 播放/暂停事件同步 ==========
  audio.addEventListener('play', function () {
    // 临时的视频暂停或旧页面脚本的 play() 不能覆盖用户的暂停偏好。
    if (state !== 'playing' || hasPlayingVideo()) {
      audio.pause();
      setUI('paused');
      return;
    }
    setUI('playing');
  });
  audio.addEventListener('playing', function () {
    if (state === 'playing' && !hasPlayingVideo()) removeUnlockListeners();
  });
  audio.addEventListener('pause', function () {
    setUI('paused');
  });

  // ========== 核心：自动播放 + 首次全局交互补播 ==========
  var unlockEvents = ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown', 'wheel'];
  var unlockListenersAttached = false;

  function removeUnlockListeners() {
    if (!unlockListenersAttached) return;
    unlockEvents.forEach(function (eventName) {
      document.removeEventListener(eventName, onFirstInteraction);
    });
    unlockListenersAttached = false;
  }

  function settlePlayAttempt() {
    playPending = false;
    if (!resumeWhenSettled) return;
    resumeWhenSettled = false;
    if (state === 'playing' && audio.paused && !hasPlayingVideo()) attemptPlay();
  }

  function attemptPlay(fromVideo) {
    if (state !== 'playing') return;
    if (playPending) {
      if (fromVideo) resumeWhenSettled = true;
      return;
    }
    if (hasPlayingVideo()) {
      interruptedByVideo = true;
      return;
    }
    var playPromise;
    try {
      playPending = true;
      playPromise = audio.play();
    } catch (error) {
      settlePlayAttempt();
      return;
    }

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(function () {
        if (state !== 'playing' || hasPlayingVideo()) {
          audio.pause();
        } else {
          setUI('playing');
          removeUnlockListeners();
        }
        settlePlayAttempt();
      }).catch(function () {
        settlePlayAttempt();
        // Autoplay policy 拦截时静默等待下一次有效用户交互。
      });
    } else {
      settlePlayAttempt();
      if (!audio.paused) removeUnlockListeners();
    }
  }

  function onFirstInteraction(event) {
    // 控件自身由 click 处理，避免 pointerdown 先播放、紧接着 click 又暂停。
    if (widget && widget.contains(event.target)) return;
    attemptPlay();
  }

  function attachUnlockListeners() {
    if (unlockListenersAttached) return;
    unlockListenersAttached = true;
    unlockEvents.forEach(function (eventName) {
      document.addEventListener(eventName, onFirstInteraction, {
        passive: eventName === 'wheel' || eventName === 'touchstart'
      });
    });
  }

  // ========== 视频联动：视频播放时暂停音乐，结束后恢复 ==========
  document.addEventListener('play', function (e) {
    if (e.target.tagName === 'VIDEO') {
      activeVideos.add(e.target);
      // 窑炉旧脚本可能已先暂停音乐，因此以用户偏好而非 audio.paused 判断。
      if (state === 'playing') interruptedByVideo = true;
      if (e.target.id === 'kilnVideo') window._kilnPausedMusic = false;
      audio.pause();
      setUI('paused');
    }
  }, true);

  function resumeAfterVideo() {
    if (hasPlayingVideo()) return;
    if (interruptedByVideo && state === 'playing') {
      interruptedByVideo = false;
      attachUnlockListeners();
      attemptPlay(true);
    }
    setUI(!audio.paused ? 'playing' : 'paused');
  }

  function onVideoStopped(e) {
    if (e.target.tagName !== 'VIDEO') return;
    if (e.target.id === 'kilnVideo') window._kilnPausedMusic = false;
    activeVideos.delete(e.target);
    resumeAfterVideo();
  }
  document.addEventListener('pause', onVideoStopped, true);
  document.addEventListener('ended', onVideoStopped, true);

  // 视频元素被移除时也恢复
  new MutationObserver(function () {
    if (interruptedByVideo) resumeAfterVideo();
  }).observe(document.body, { childList: true, subtree: true });

  // ========== 手动切换：改变持久状态 ==========
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var videoPlaying = hasPlayingVideo();
    if (audio.paused && (!videoPlaying || state !== 'playing')) {
      setPreference('playing');
      attachUnlockListeners();
      attemptPlay();
    } else {
      setPreference('paused');
      interruptedByVideo = false;
      audio.pause();
      removeUnlockListeners();
    }
    setUI(!audio.paused ? 'playing' : 'paused');
  });

  // ========== 离开页面前保存最终进度 ==========
  window.addEventListener('beforeunload', saveTime);
  window.addEventListener('pagehide', saveTime);

  if (state === 'playing') {
    // 先布置兜底监听，随后立即尝试自动播放；成功后监听会立刻清理。
    attachUnlockListeners();
    attemptPlay();
  }
})();
