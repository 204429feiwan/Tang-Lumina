/* 敦煌壁画 3D 展厅。原 DOM 画卷是数据源、灯箱触发器与移动端降级。 */
(function () {
  'use strict';

  const DESKTOP_QUERY = window.matchMedia('(min-width: 769px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = document.querySelector('.mural-section');
  const track = document.getElementById('muralScrollTrack');
  const sourceCards = Array.from(document.querySelectorAll('.mural-scroll-card'));
  if (!section || !track || !sourceCards.length) return;

  function initMobileWake() {
    sourceCards.forEach(function (card) {
      card.addEventListener('click', function (event) {
        if (DESKTOP_QUERY.matches) return;
        if (!card.classList.contains('is-awake')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          sourceCards.forEach(function (item) { item.classList.remove('is-awake'); });
          card.classList.add('is-awake');
        }
      }, true);
    });
  }

  function openMural(source, trigger) {
    // Use the existing card/lightbox source; only add local focus restoration.
    if (!DESKTOP_QUERY.matches) source.classList.add('is-awake');
    source.click();
    const modals = document.querySelectorAll('.modal-tang');
    const modal = modals[modals.length - 1];
    if (!modal) return;
    modal.setAttribute('aria-label', source.dataset.title);
    modal.addEventListener('shown.bs.modal', function () {
      modal.querySelector('.btn-close').focus();
    }, { once: true });
    modal.addEventListener('hidden.bs.modal', function () {
      if (trigger.isConnected && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true });
    }, { once: true });
  }

  sourceCards.forEach(function (card) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', '查看' + card.dataset.title);
    card.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openMural(card, card);
    });
  });

  initMobileWake();
  if (!DESKTOP_QUERY.matches) return;

  const muralData = sourceCards.map(function (card, index) {
    const image = card.querySelector('img');
    const poem = card.querySelector('.poem-text');
    return {
      id: 'mural-' + (index + 1),
      title: card.querySelector('.card-label')?.textContent.trim() || image.alt,
      detail: poem?.textContent.trim() || '敦煌莫高窟壁画',
      image: image.src,
      source: card
    };
  });

  const MURAL_LAYOUT = [
    { p: [-5.0, -.55,  .15], r: [-.015,  .055, -.012], s: 1.02 },
    { p: [-2.55, 1.00, -.18], r: [ .014, -.045,  .018], s: .94 },
    { p: [  .05, -.82,  .05], r: [-.012,  .026, -.008], s: 1.08 },
    { p: [ 2.78,  .92, -.34], r: [ .018, -.052,  .012], s: .92 },
    { p: [ 5.18, -.42, -.08], r: [-.01,   .04,  -.018], s: 1.0 },
    { p: [-4.55, 1.05, -3.75], r: [ .018,  .06,   .012], s: .9 },
    { p: [-1.85,-.86, -3.98], r: [-.014, -.04,  -.015], s: 1.04 },
    { p: [  .78,  .86, -3.62], r: [ .01,   .035,  .012], s: .96 },
    { p: [ 3.42,-.68, -4.12], r: [-.02,  -.055,  .014], s: 1.02 },
    { p: [ 5.35, 1.18, -3.88], r: [ .012,  .048, -.01],  s: .86 },
    { p: [-5.12,-.62, -7.62], r: [-.012,  .052, -.014], s: 1.0 },
    { p: [-2.7, 1.15, -7.9],  r: [ .016, -.046,  .012], s: .9 },
    { p: [ -.1,-.95, -7.48],  r: [-.018,  .03,  -.01],  s: 1.08 },
    { p: [ 2.65, .78, -7.82], r: [ .014, -.05,   .016], s: .94 },
    { p: [ 5.08,-.5, -7.58],  r: [-.01,   .043, -.012], s: 1.0 },
    { p: [-4.62, .92,-11.35], r: [ .015,  .055,  .01],  s: .92 },
    { p: [-2.15,-.9,-11.72],  r: [-.015, -.042, -.012], s: 1.02 },
    { p: [  .5,  .95,-11.42], r: [ .012,  .03,   .015], s: .96 },
    { p: [ 3.05,-.7,-11.78],  r: [-.018, -.052,  .01],  s: 1.04 },
    { p: [ 5.18, .88,-11.5],  r: [ .014,  .045, -.014], s: .9 }
  ];

  async function initThreeGallery() {
    const THREE = window.THREE;
    if (!THREE) {
      console.warn('敦煌 3D 展厅未加载，已保留原画卷。未找到本地 Three.js。');
      return;
    }

    const stage = document.createElement('div');
    stage.className = 'mural-3d-stage';
    stage.setAttribute('aria-label', '敦煌壁画三维数字展厅');
    stage.innerHTML = '<div class="mural-3d-vignette" aria-hidden="true"></div>' +
      '<div class="mural-3d-loading">千年壁画正在苏醒 <span>0%</span></div>' +
      '<div class="mural-3d-caption" aria-live="polite"><strong></strong><span></span></div>' +
      '<p class="mural-3d-guide">滚轮深入展厅 · 悬停唤醒色彩 · 点击观赏细节</p>' +
      '<div class="mural-3d-depth" aria-hidden="true"><span></span></div>';
    track.parentNode.insertBefore(stage, track);
    section.classList.add('mural-3d-active');

    const loading = stage.querySelector('.mural-3d-loading span');
    const caption = stage.querySelector('.mural-3d-caption');
    const captionTitle = caption.querySelector('strong');
    const captionDetail = caption.querySelector('span');
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      section.classList.remove('mural-3d-active');
      stage.remove();
      console.warn('当前浏览器不支持敦煌 3D 展厅，已保留原画卷。', error);
      return;
    }
    renderer.domElement.className = 'mural-3d-canvas';
    renderer.domElement.setAttribute('tabindex', '-1');
    renderer.domElement.setAttribute('aria-label', '敦煌壁画三维展厅；按 Tab 选择壁画');
    stage.insertBefore(renderer.domElement, stage.firstChild);
    const keyboardNav = document.createElement('nav');
    keyboardNav.className = 'mural-keyboard-nav';
    keyboardNav.setAttribute('aria-label', '敦煌壁画 · 键盘选画');
    const keyboardButtons = muralData.map(function (item, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(index + 1).padStart(2, '0') + ' · ' + item.title;
      button.dataset.muralIndex = String(index);
      button.setAttribute('aria-label', '查看第 ' + (index + 1) + ' 幅 · ' + item.source.dataset.title);
      button.addEventListener('click', function () { openMural(item.source, button); });
      keyboardNav.appendChild(button);
      return button;
    });
    stage.appendChild(keyboardNav);
    renderer.setClearColor(0x100905, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x120a06, 9, 25);
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 50);
    camera.position.set(0, 0, 8);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(2, 2);
    const targetPointer = new THREE.Vector2(0, 0);
    const sceneStart = performance.now();
    const textureLoader = new THREE.TextureLoader();
    const meshes = [];
    const particleGroups = [];
    let hovered = null;
    let pointerDirty = false;
    let visible = false;
    let frame = 0;
    let disposed = false;
    let loaded = 0;
    let targetDepth = 0;
    let currentDepth = 0;
    let boundaryReachedAt = 0;
    let lastFrame = performance.now();

    function muralMaterial(texture) {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTexture: { value: texture },
          uGray: { value: 1 },
          uOpacity: { value: 0 }
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform sampler2D uTexture; uniform float uGray; uniform float uOpacity; varying vec2 vUv; void main(){ vec4 tex=texture2D(uTexture,vUv); float gray=dot(tex.rgb,vec3(.299,.587,.114)); vec3 asleep=clamp((vec3(gray*.78)-.5)*1.05+.5,0.0,1.0); vec3 color=mix(tex.rgb,asleep,uGray); gl_FragColor=vec4(color,tex.a*uOpacity); }'
      });
    }

    function createMural(item, layout, texture, index) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      const aspect = texture.image.width / texture.image.height;
      const height = 2.55 * layout.s;
      const width = Math.min(3.15, height * aspect);
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = muralMaterial(texture);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(layout.p[0], layout.p[1], layout.p[2] - 1.2);
      mesh.rotation.set(layout.r[0], layout.r[1], layout.r[2]);
      mesh.scale.setScalar(.84);
      mesh.userData = {
        item, index,
        basePosition: new THREE.Vector3(layout.p[0], layout.p[1], layout.p[2]),
        baseRotation: new THREE.Euler(layout.r[0], layout.r[1], layout.r[2]),
        baseScale: 1,
        group: Math.floor(index / 5),
        phase: index * 1.73,
        appearAt: performance.now() + index * 65,
        wake: 0,
        opacity: 0,
        texture
      };
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xb88945, transparent: true, opacity: .24 })
      );
      edge.position.z = .012;
      mesh.add(edge);
      scene.add(mesh);
      meshes.push(mesh);
    }

    function createParticles(count, depthStart, depthEnd, size, opacity, color, phase) {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - .5) * 15;
        positions[i * 3 + 1] = (Math.random() - .5) * 8;
        positions[i * 3 + 2] = depthStart + Math.random() * (depthEnd - depthStart);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true });
      const points = new THREE.Points(geometry, material);
      points.userData.phase = phase;
      scene.add(points);
      particleGroups.push(points);
    }

    createParticles(180, -2,   2, .018, .16, 0xe8c98b, .3);
    createParticles(220, -9,  -2, .026, .2,  0xbd8745, 1.7);
    createParticles(180, -16, -8, .04,  .13, 0x9b5b36, 3.2);

    const loadTasks = muralData.map(function (item, index) {
      return new Promise(function (resolve) {
        textureLoader.load(item.image, function (texture) {
          createMural(item, MURAL_LAYOUT[index], texture, index);
          loaded += 1;
          loading.textContent = Math.round(loaded / muralData.length * 100) + '%';
          resolve(true);
        }, undefined, function () {
          loaded += 1;
          loading.textContent = Math.round(loaded / muralData.length * 100) + '%';
          resolve(false);
        });
      });
    });

    function setHovered(next) {
      if (hovered === next) return;
      hovered = next;
      if (hovered) {
        stage.dataset.focus = hovered.userData.item.id;
        captionTitle.textContent = hovered.userData.item.title;
        captionDetail.textContent = hovered.userData.item.detail;
        caption.classList.add('is-visible');
        renderer.domElement.style.cursor = 'pointer';
      } else {
        delete stage.dataset.focus;
        caption.classList.remove('is-visible');
        renderer.domElement.style.cursor = 'default';
      }
    }

    function pick() {
      pointerDirty = false;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes.filter(function (mesh) { return mesh.userData.opacity > .28; }), false)[0];
      setHovered(hit ? hit.object : null);
    }

    function render(now) {
      frame = 0;
      if (!visible || disposed || document.hidden) return;
      const delta = Math.min((now - lastFrame) / 16.67, 3);
      lastFrame = now;
      const elapsed = (now - sceneStart) / 1000;
      const damping = 1 - Math.pow(.9, delta);
      const slowDamping = 1 - Math.pow(.94, delta);
      currentDepth += (targetDepth - currentDepth) * damping;
      targetPointer.lerp(pointer, damping);
      camera.position.x += (targetPointer.x * .28 - camera.position.x) * slowDamping;
      const steadyPointerY = Math.abs(targetPointer.y) < .2 ? 0 : targetPointer.y;
      camera.position.y += (steadyPointerY * .055 - camera.position.y) * slowDamping;
      camera.position.z = 8 - currentDepth * 11;
      camera.lookAt(camera.position.x * .18, camera.position.y * .12, camera.position.z - 8);
      stage.style.setProperty('--mural-depth', currentDepth.toFixed(3));

      meshes.forEach(function (mesh) {
        const data = mesh.userData;
        const active = mesh === hovered;
        data.wake += ((active ? 1 : 0) - data.wake) * (1 - Math.pow(active ? .86 : .92, delta));
        const appeared = reducedMotion ? 1 : Math.max(0, Math.min(1, (now - data.appearAt) / 1150));
        const ease = 1 - Math.pow(1 - appeared, 3);
        const floatY = reducedMotion ? 0 : Math.sin(elapsed * (.34 + data.index % 4 * .035) + data.phase) * .045;
        const floatR = reducedMotion ? 0 : Math.sin(elapsed * .25 + data.phase) * .007;
        mesh.position.x += (data.basePosition.x - mesh.position.x) * damping;
        mesh.position.y += (data.basePosition.y + floatY - mesh.position.y) * damping;
        mesh.position.z += (data.basePosition.z + data.wake * .48 - mesh.position.z) * damping;
        mesh.rotation.x += ((data.baseRotation.x * (1 - data.wake) + floatR) - mesh.rotation.x) * damping;
        mesh.rotation.y += ((data.baseRotation.y * (1 - data.wake) - floatR * .7) - mesh.rotation.y) * damping;
        mesh.rotation.z += (data.baseRotation.z * (1 - data.wake) - mesh.rotation.z) * damping;
        const scale = (.84 + ease * .16) * (1 + data.wake * .05);
        mesh.scale.setScalar(scale);
        const focusOpacity = hovered && !active ? .78 : 1;
        const groupDistance = Math.abs(currentDepth - data.group / 3);
        const layerOpacity = groupDistance <= .16 ? 1 : groupDistance < .34
          ? 1 - (groupDistance - .16) / .18 * .84
          : 0;
        data.opacity += (ease * focusOpacity * layerOpacity - data.opacity) * damping;
        mesh.material.uniforms.uOpacity.value = data.opacity;
        mesh.material.uniforms.uGray.value = 1 - data.wake;
        mesh.children[0].material.opacity = data.opacity * .24;
      });
      particleGroups.forEach(function (group, index) {
        if (!reducedMotion) {
          group.rotation.y = Math.sin(elapsed * .035 + group.userData.phase) * .025;
          group.position.y = Math.sin(elapsed * (.07 + index * .012) + group.userData.phase) * .08;
          group.position.x = targetPointer.x * (index + 1) * -.025;
        }
      });
      if (pointerDirty) pick();
      renderer.render(scene, camera);
      stage.dataset.cameraZ = camera.position.z.toFixed(3);
      frame = requestAnimationFrame(render);
    }

    function start() {
      if (!frame && visible && !disposed && !document.hidden) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(render);
      }
    }
    function onPointerMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerDirty = true;
    }
    function onPointerLeave() {
      pointer.set(2, 2);
      pointerDirty = true;
      targetPointer.set(0, 0);
      boundaryReachedAt = 0;
      setHovered(null);
    }
    function onClick() {
      if (hovered) openMural(hovered.userData.item.source, renderer.domElement);
    }
    function onWheel(event) {
      const direction = Math.sign(event.deltaY);
      const deltaModeScale = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? stage.clientHeight : 1;
      const depthDelta = Math.max(-.055, Math.min(.055, event.deltaY * deltaModeScale * .00055));
      const next = Math.max(0, Math.min(1, targetDepth + depthDelta));
      if (Math.abs(next - targetDepth) > .0001) {
        event.preventDefault();
        targetDepth = next;
        boundaryReachedAt = 0;
        start();
        return;
      }
      const leavingAtStart = targetDepth <= .001 && direction < 0;
      const leavingAtEnd = targetDepth >= .999 && direction > 0;
      if (leavingAtStart || leavingAtEnd) {
        const cameraSettled = Math.abs(currentDepth - targetDepth) < .012;
        if (!cameraSettled) {
          event.preventDefault();
          boundaryReachedAt = 0;
          return;
        }
        if (!boundaryReachedAt) boundaryReachedAt = performance.now();
        if (performance.now() - boundaryReachedAt < 420) event.preventDefault();
      }
    }
    function resize() {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 1000 ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      start();
    }
    function dispose() {
      if (disposed) return;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', start);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('click', onClick);
      stage.removeEventListener('wheel', onWheel);
      meshes.forEach(function (mesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
        mesh.userData.texture.dispose();
        mesh.children.forEach(function (child) { child.geometry.dispose(); child.material.dispose(); });
      });
      particleGroups.forEach(function (group) { group.geometry.dispose(); group.material.dispose(); });
      renderer.dispose();
      renderer.forceContextLoss();
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
    renderer.domElement.addEventListener('pointerleave', onPointerLeave, { passive: true });
    renderer.domElement.addEventListener('click', onClick);
    stage.addEventListener('wheel', onWheel, { passive: false });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    const visibilityObserver = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }, { threshold: .02 });
    visibilityObserver.observe(stage);
    document.addEventListener('visibilitychange', start);
    window.addEventListener('pagehide', dispose, { once: true });
    resize();

    const results = await Promise.all(loadTasks);
    if (results.filter(Boolean).length < 5) {
      dispose();
      section.classList.remove('mural-3d-active');
      stage.remove();
      console.warn('壁画纹理加载不足，已恢复原横向画卷。');
      return;
    }
    stage.classList.add('is-loaded');
    stage.dataset.murals = String(meshes.length);
    start();
  }

  initThreeGallery().catch(function (error) {
    section.classList.remove('mural-3d-active');
    console.error('敦煌 3D 展厅初始化失败：', error);
  });
})();
