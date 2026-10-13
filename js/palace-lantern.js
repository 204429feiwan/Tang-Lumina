import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const section = document.getElementById('palaceLantern');
const canvas = document.getElementById('lanternCanvas');
const loading = document.getElementById('lanternLoading');
const fallback = document.getElementById('lanternFallback');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrow = window.matchMedia('(max-width: 600px)');
const STEP = Math.PI / 3;
const START_ANGLE = Math.PI / 6;
const WIDTH_SCALE = 1.4;
const BODY_STRETCH = 1.7;
const WINDOW_CENTER = .431;

const sources = {
  lady: new URL('../images/shadow-puppets/shaanxi-young-lady.jpg', import.meta.url).href,
  official: new URL('../images/shadow-puppets/shaanxi-official.jpg', import.meta.url).href,
  court: new URL('../images/shadow-puppets/minghuang-guifei.jpg', import.meta.url).href,
};
const stories = [
  { title: '旦角 · 一线传神', label: '陕西影人 / 十九世纪', text: '侧面眉眼，一线传神；花饰与长辫刻出人物神采。细密的镂花借灯光透出，让皮革有了衣袖的轻盈。', source: 'lady' },
  { title: '衣冠 · 镂花成章', label: '陕西官员影人 / 十九世纪', text: '冠帽、长髯与衣纹共同塑造角色。看袍上的回纹与团花：一刀一镂之间，戏曲的衣冠化作透光的纹样。', source: 'official' },
  { title: '明皇与贵妃 · 旧事入戏', label: '陕西传统皮影 / 唐代题材', text: '后世影戏借唐明皇与杨贵妃的故事展开想象。仪仗与人物同入一方影窗，长安旧事在光影中有了新的讲述。', source: 'court' },
];
let currentStory = 0;
let turnLantern = null;

function expandedHeight(y) {
  return y + Math.max(0, Math.min(y - .30, .25)) * (BODY_STRETCH - 1);
}

function showStory(index) {
  currentStory = index;
  const story = stories[index];
  document.getElementById('lanternStoryTitle').textContent = story.title;
  document.getElementById('lanternStoryLabel').textContent = story.label;
  document.getElementById('lanternStoryText').textContent = story.text;
  document.getElementById('lanternCount').textContent = `${String(index + 1).padStart(2, '0')} / 03`;
  fallback.querySelector('img').src = sources[story.source];
  fallback.querySelector('img').alt = `${story.label}：${story.title}`;
  fallback.querySelector('figcaption').textContent = `${story.label} · ${story.title}`;
}

function fail(message) {
  loading.hidden = true;
  canvas.hidden = true;
  fallback.hidden = false;
  document.getElementById('lanternHint').textContent = '传统影人原图 · 可用左右按钮切换';
  console.warn('Palace lantern:', message);
}

function createWindowShape() {
  const x = .063 * WIDTH_SCALE, y = .092 * BODY_STRETCH, r = .012;
  const shape = new THREE.Shape();
  shape.moveTo(-x + r, -y);
  shape.lineTo(x - r, -y);
  shape.quadraticCurveTo(x, -y, x, -y + r);
  shape.lineTo(x, y - r);
  shape.quadraticCurveTo(x, y, x - r, y);
  shape.lineTo(-x + r, y);
  shape.quadraticCurveTo(-x, y, -x, y - r);
  shape.lineTo(-x, -y + r);
  shape.quadraticCurveTo(-x, -y, -x + r, -y);
  const geometry = new THREE.ShapeGeometry(shape, 10);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / (2 * x) + .5, positions.getY(i) / (2 * y) + .5);
  return geometry;
}

// The original GLB is one mesh. Open only the six silk windows, leaving the
// carved frame, roof and tassel intact. Coordinates precede the body expansion.
function prepareFrame(root) {
  root.updateMatrixWorld(true);
  const frame = new THREE.Group();
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geometry.setAttribute('lanternCoord', geometry.attributes.position.clone());
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setXYZ(i, positions.getX(i) * WIDTH_SCALE, expandedHeight(y), positions.getZ(i) * WIDTH_SCALE);
      const nx = normals.getX(i) / WIDTH_SCALE;
      const ny = normals.getY(i) / (y > .30 && y < .55 ? BODY_STRETCH : 1);
      const nz = normals.getZ(i) / WIDTH_SCALE;
      const length = Math.hypot(nx, ny, nz) || 1;
      normals.setXYZ(i, nx / length, ny / length, nz / length);
    }
    geometry.computeBoundingSphere();
    const material = mesh.material.clone();
    material.color.set('#fff1d6');
    material.metalness = .72;
    material.roughness = .47;
    material.side = THREE.DoubleSide;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = 'attribute vec3 lanternCoord; varying vec3 vLanternCoord;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLanternCoord = lanternCoord;');
      shader.fragmentShader = 'varying vec3 vLanternCoord;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', `
        #include <clipping_planes_fragment>
        float face = floor((atan(vLanternCoord.z, vLanternCoord.x) + 0.5235987756) / 1.0471975512);
        float angle = face * 1.0471975512;
        float across = dot(vLanternCoord.xz, vec2(-sin(angle), cos(angle)));
        vec2 q = abs(vec2(across, vLanternCoord.y - 0.431)) - vec2(0.061, 0.090) + 0.012;
        float aperture = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.012;
        if (aperture < 0.0) discard;
      `);
    };
    frame.add(new THREE.Mesh(geometry, material));
  });
  return frame;
}

const paneVertex = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const puppetFragment = `
  uniform sampler2D image;
  uniform vec4 crop;
  uniform vec3 paper;
  uniform vec2 fit;
  uniform float time;
  uniform float phase;
  uniform float courtScene;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) / fit + 0.5;
    float sway = sin(time * .8 + phase) * .024;
    p = mat2(cos(sway), -sin(sway), sin(sway), cos(sway)) * (p - vec2(.5, .1)) + vec2(.5, .1);
    p.x += sin(time * 0.7 + phase) * 0.009 * sin(p.y * 3.14159);
    p.y += sin(time * 0.55 + phase) * 0.003;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
    if (courtScene > .5 && p.x < .10 && p.y > .45) discard;
    vec3 ink = texture2D(image, crop.xy + p * crop.zw).rgb;
    // Normalize the photographed backing to the lit silk. Lighter carved
    // openings pass more light; the original coloured leather stays visible.
    vec3 transmittance = clamp(ink / paper, 0.0, 1.0);
    float density = 1.0 - dot(transmittance, vec3(0.299, 0.587, 0.114));
    float alpha = smoothstep(0.08, 0.24, density) * 0.99;
    vec3 colour = pow(transmittance, vec3(2.2)) * vec3(0.8, 0.40, 0.13);
    colour = max(colour, vec3(0.014, 0.006, 0.002));
    gl_FragColor = vec4(colour, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const silkFragment = `
  uniform float time;
  varying vec2 vUv;
  void main() {
    float light = 1.0 - length((vUv - vec2(.5,.53)) * vec2(.74,.42));
    float grain = sin(vUv.x * 1100.0) * sin(vUv.y * 1700.0) * .009;
    float pulse = sin(time * 1.2) * .006;
    vec3 colour = mix(vec3(.24,.085,.014), vec3(.86,.48,.14), light) + grain + pulse;
    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

async function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) { fail(error.message); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .01, 20);
  const lantern = new THREE.Group();
  lantern.rotation.y = START_ANGLE;
  scene.add(lantern);
  scene.add(new THREE.HemisphereLight(0xffe4b0, 0x264348, 2.4));
  const key = new THREE.DirectionalLight(0xffe2aa, 3.8);
  key.position.set(-1, 1.8, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf0b15c, 2.4);
  rim.position.set(1, .8, -1);
  scene.add(rim);
  const faceLight = new THREE.DirectionalLight(0xb9d5d1, 1.2);
  faceLight.position.set(1, .3, 2);
  scene.add(faceLight);
  const animatedUniforms = [];
  let active = false;
  let ready = false;
  let raf = 0;
  let previousTime = 0;
  let elapsed = 0;
  let scrollProgress = 0;
  let offset = 0;
  let angle = START_ANGLE;
  let storyIndex = 0;

  function resize() {
    const width = section.clientWidth, height = section.querySelector('.lantern-stage').clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const visibleHeight = narrow.matches ? 1.42 : 1.03;
    const distance = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0, narrow.matches ? .76 : .56, distance);
    camera.lookAt(0, narrow.matches ? .76 : .56, 0);
    lantern.position.x = narrow.matches ? 0 : visibleHeight * camera.aspect * .16;
    camera.updateProjectionMatrix();
    updateScroll();
    requestRender();
  }

  function updateScroll() {
    const rect = section.getBoundingClientRect();
    scrollProgress = Math.max(0, Math.min(1, -rect.top / Math.max(1, section.offsetHeight - window.innerHeight)));
    requestRender();
  }

  function requestRender() {
    if (!raf && ready && active && !document.hidden) raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    const dt = previousTime ? Math.min((now - previousTime) / 1000, .05) : .016;
    previousTime = now;
    if (!reducedMotion.matches) elapsed += dt;
    const target = START_ANGLE + scrollProgress * STEP * 4 + offset;
    angle = reducedMotion.matches ? target : THREE.MathUtils.lerp(angle, target, 1 - Math.exp(-dt * 9));
    lantern.rotation.y = angle;
    animatedUniforms.forEach((u) => { u.time.value = elapsed; });
    // Face 2 is front at START_ANGLE. Subsequent sixty-degree turns reveal
    // faces 3, 4...; labels follow the visible centre window in both directions.
    const face = ((2 + Math.round((angle - START_ANGLE) / STEP)) % 6 + 6) % 6;
    const nextStory = FACE_STORIES[face];
    if (nextStory !== storyIndex) { storyIndex = nextStory; showStory(storyIndex); }
    renderer.render(scene, camera);
    if (!reducedMotion.matches) requestRender();
  }

  const FACE_STORIES = [1, 2, 0, 1, 2, 0];
  function turn(direction) {
    if (!ready) return;
    const nextFace = Math.round(scrollProgress * 4 + offset / STEP) + direction;
    offset = (nextFace - scrollProgress * 4) * STEP;
    requestRender();
  }
  turnLantern = turn;
  canvas.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    turn(event.key === 'ArrowRight' ? 1 : -1);
  });
  let pointer = null;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !ready) return;
    pointer = { id: event.pointerId, x: event.clientX, offset };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    offset = pointer.offset + (event.clientX - pointer.x) * .006;
    requestRender();
  });
  const release = () => { pointer = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  const observer = new IntersectionObserver((entries) => {
    active = entries[0].isIntersecting;
    if (!active) { cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    else { updateScroll(); requestRender(); }
  });
  observer.observe(section);
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    else requestRender();
  });
  reducedMotion.addEventListener('change', resize);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    active = false;
    cancelAnimationFrame(raf);
    fail('WebGL context lost; showing the original traditional puppets.');
  });
  resize();
  const textureLoader = new THREE.TextureLoader();
  try {
    const [gltf, lady, official, court] = await Promise.all([
      new GLTFLoader().loadAsync(new URL('../palace-lantern.glb', import.meta.url).href),
      textureLoader.loadAsync(sources.lady), textureLoader.loadAsync(sources.official), textureLoader.loadAsync(sources.court),
    ]);
    lantern.add(prepareFrame(gltf.scene));
    const geometry = createWindowShape();
    const artwork = [
      { texture: lady, crop: [0, 0, 1, 1], paper: [.77, .67, .41], aspect: 1715 / 2760 },
      { texture: official, crop: [0, 0, 1, 1], paper: [.69, .58, .32], aspect: 1675 / 3215 },
      // A close view of two adjacent figures from the original court scene.
      // Full uncropped source remains available in the source disclosure.
      { texture: court, crop: [.096, .035, .18, .49], paper: [.96, .96, .93], aspect: (5194 * .18) / (2246 * .49) },
    ];
    for (let i = 0; i < 6; i++) {
      const art = artwork[FACE_STORIES[i]];
      const panel = new THREE.Group();
      const a = i * STEP;
      panel.position.set(Math.cos(a) * .134 * WIDTH_SCALE, expandedHeight(WINDOW_CENTER), Math.sin(a) * .134 * WIDTH_SCALE);
      panel.rotation.y = Math.PI / 2 - a;
      const backUniforms = { time: { value: 0 } };
      animatedUniforms.push(backUniforms);
      const backing = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms: backUniforms, vertexShader: paneVertex, fragmentShader: silkFragment, side: THREE.FrontSide }));
      backing.position.z = -.010;
      panel.add(backing);
      const panelAspect = (.126 * WIDTH_SCALE) / (.184 * BODY_STRETCH);
      const fitY = Math.min(.94, .94 * panelAspect / art.aspect);
      const fitX = fitY * art.aspect / panelAspect;
      const uniforms = {
        image: { value: art.texture }, crop: { value: new THREE.Vector4(...art.crop) }, paper: { value: new THREE.Vector3(...art.paper) },
        fit: { value: new THREE.Vector2(fitX, fitY) }, time: { value: 0 }, phase: { value: i * 1.7 }, courtScene: { value: FACE_STORIES[i] === 2 ? 1 : 0 },
      };
      animatedUniforms.push(uniforms);
      const puppet = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: paneVertex, fragmentShader: puppetFragment, transparent: true, depthWrite: false, side: THREE.FrontSide }));
      puppet.position.z = -.004;
      puppet.renderOrder = 1;
      panel.add(puppet);
      const silk = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffda88, transparent: true, opacity: .025, depthWrite: false, side: THREE.FrontSide }));
      silk.renderOrder = 2;
      panel.add(silk);
      lantern.add(panel);
    }
    ready = true;
    loading.hidden = true;
    section.dataset.lanternReady = 'true';
    renderer.compile(scene, camera);
    requestRender();
  } catch (error) { fail(error.message); }
}

if (section && canvas) {
  showStory(0);
  document.getElementById('lanternPrev').addEventListener('click', () => {
    if (canvas.hidden) showStory((currentStory + 2) % 3);
    else turnLantern?.(-1);
  });
  document.getElementById('lanternNext').addEventListener('click', () => {
    if (canvas.hidden) showStory((currentStory + 1) % 3);
    else turnLantern?.(1);
  });
  init();
}
