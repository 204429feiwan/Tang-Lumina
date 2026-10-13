/*
 * 粒子点云五幕：云想衣裳 / 胡旋舞 / 九色鹿 / 大唐工艺 / 丝绸之路
 * 替换原来的 morph 四阶段（骆驼→牡丹→长安→地图）
 */
(function () {
  'use strict';
  const CONFIG = {
    pixelRatio: 2.5,
    lerp: .095,
    pointSize: .032
  };
  const section = document.getElementById('particleStory');
  const stage = document.getElementById('homeParticleStage');
  const copy = stage && stage.querySelector('.home-particle-copy');
  if (!section || !stage || !window.THREE || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const THEMES = [
    { bin: 'images/particles/fengguan-points.bin', x: 3.0, scale: 1.3,
      text: { chapter: '壹 · 仪典', title: '凤冠', en: 'PHOENIX CORONET', desc: '「凤冠霞帔，金翠辉煌。」唐代后妃礼冠，缀凤凰、嵌珠翠，极尽工巧，彰显皇家威仪。' } },
    { bin: 'images/particles/pipa-points.bin', x: 3.0, scale: 1.3,
      text: { chapter: '贰 · 乐舞', title: '琵琶', en: 'PIPA', desc: '「千呼万唤始出来，犹抱琵琶半遮面。」琵琶声动长安，春江花月夜，一曲诉尽千古情。' } },
    { bin: 'images/particles/jiuselu-points.bin',  x: 3.0, scale: 0.9,
      text: { chapter: '叁 · 信仰', title: '九色鹿', en: 'NINE-COLOR DEER', desc: '九色神鹿，出自敦煌。莫高窟壁画《鹿王本生》，以九色鹿讲述慈悲与诚信的故事。' } },
    { bin: 'images/particles/gongyi-points.bin',   x: 3.0, scale: 1.0,
      text: { chapter: '肆 · 工艺', title: '大唐工艺', en: 'TANG CRAFTS', desc: '大唐工艺，巧夺天工。唐三彩流光溢彩，金银器精雕细琢，秘色瓷温润如玉。' } },
    { bin: 'images/particles/tang-sancai-camel.bin', x: 3.0, scale: 1.3,
      text: { chapter: '伍 · 商旅', title: '丝绸之路', en: 'SILK ROAD', desc: '驼铃声声，黄沙漫漫。丝路商队穿越荒漠，将丝绸、瓷器与文明送往四方。' } }
  ];
  const N = THEMES.length;

  THEMES.forEach(t => { t.wind = { value: 1 }; t.opacity = { value: 0 }; t.targetWind = 1; t.points = null; t.loaded = false; });

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.domElement.className = 'home-particle-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CONFIG.pixelRatio));
  stage.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  const uSize = { value: 0.02 * renderer.getPixelRatio() };
  const uTime = { value: 0 };
  const clock = new THREE.Clock();
  let visible = false, frameId = 0;

  // —— 文字随点云流畅切换（GSAP）——
  const copyEls = copy ? copy.querySelectorAll('span,strong,em,p') : null;
  let textIndex = -1;
  let copyTl = null;

  function setCopyText(t){
    copyEls[0].textContent = t.text.chapter;
    copyEls[1].textContent = t.text.title;
    copyEls[2].textContent = t.text.en;
    copyEls[3].textContent = t.text.desc;
  }

  function swapText(s){
    if (!copyEls || s === textIndex) return;
    const t = THEMES[s];
    if (textIndex === -1 || !window.gsap) {
      if (copyTl) { copyTl.kill(); copyTl = null; }
      setCopyText(t);            // 首次直接落字，避免开场闪动
      textIndex = s;
      return;
    }
    textIndex = s;
    if (copyTl) copyTl.kill();
    copyTl = gsap.timeline();
    copyTl.to(copyEls, { y: -22, autoAlpha: 0, duration: 0.28, ease: 'power2.in', stagger: 0.05 })
          .add(function () { setCopyText(t); })
          .fromTo(copyEls,
            { y: 24, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.07, immediateRender: false });
  }

  addDust();

  const VERT = `
    uniform float uTime; uniform float uSize; uniform float uWind;
    attribute vec3 aColor;
    varying vec3 vColor; varying float vFade;
    float hash13(vec3 p3){p3=fract(p3*0.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}
    vec3 hash33(vec3 p3){p3=fract(p3*vec3(0.1031,0.1030,0.0973));p3+=dot(p3,p3.yxz+33.33);return fract((p3.xxy+p3.yxx)*p3.zyx);}
    void main(){
      vColor=aColor; vec3 home=position;
      vec3 rnd=hash33(home)*2.0-1.0; vec3 dir=normalize(rnd+vec3(0.0001));
      float r=hash13(home+7.7); float radius=r*r*1.8;
      vec3 scattered=dir*radius;
      scattered+=vec3(sin(uTime*0.25+hash13(home+7.1)*6.2831),cos(uTime*0.2+hash13(home+8.3)*6.2831),sin(uTime*0.3+hash13(home+3.3)*6.2831))*0.35;
      float delay=hash13(home+5.7);
      float w=clamp((uWind-delay*0.3)/0.7,0.0,1.0); float we=w*w*(3.0-2.0*w);
      vec3 p=mix(home,scattered,we);
      vFade=mix(1.0,0.15,we);
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_PointSize=uSize*(340.0/-mv.z);
      gl_Position=projectionMatrix*mv;
    }`;

  const FRAG = `
    uniform float uOpacity; uniform float uTime;
    varying vec3 vColor; varying float vFade;
    void main(){
      vec2 uv=gl_PointCoord-vec2(0.5); float d=length(uv);
      float a=smoothstep(0.5,0.06,d)*vFade*uOpacity;
      float boost=1.0+0.4*smoothstep(0.28,0.0,d)*(0.85+0.15*sin(uTime*1.2));
      float l=dot(vColor,vec3(0.299,0.587,0.114));
      vec3 col=mix(vec3(l),vColor,1.3)*boost;
      if(a<0.02)discard;
      gl_FragColor=vec4(col,a);
    }`;

  function makeSpriteTexture(){
    const c=document.createElement('canvas'); c.width=c.height=64;
    const ctx=c.getContext('2d');
    const g=ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,220,170,1)'); g.addColorStop(0.4,'rgba(255,200,150,.55)'); g.addColorStop(1,'rgba(255,200,150,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  function addDust(){
    const count=420; const pos=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), rr=3.5+Math.random()*7.5;
      pos[i*3]=rr*Math.sin(ph)*Math.cos(th); pos[i*3+1]=rr*Math.sin(ph)*Math.sin(th); pos[i*3+2]=rr*Math.cos(ph)-3;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({size:0.09,map:makeSpriteTexture(),color:0xffd9a0,transparent:true,opacity:0.45,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
    const dust=new THREE.Points(geo,mat); dust.renderOrder=-1; scene.add(dust);
  }

  function makePoints(data, t){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(data.positions,3));
    geo.setAttribute('aColor',new THREE.BufferAttribute(data.colors,3));
    const mat=new THREE.ShaderMaterial({uniforms:{uTime:uTime,uSize:uSize,uWind:t.wind,uOpacity:t.opacity},vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:true});
    const points=new THREE.Points(geo,mat);
    points.position.x=t.x; points.scale.setScalar(t.scale||1); points.visible=false;
    return points;
  }

  function loadTheme(s){
    const t=THEMES[s]; if(t.loaded) return; t.loaded=true;
    fetch(t.bin).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(buf=>{
      const cnt=buf.byteLength/24; const all=new Float32Array(buf);
      t.points=makePoints({positions:all.subarray(0,cnt*3),colors:all.subarray(cnt*3,cnt*6)},t);
      scene.add(t.points);
      if(s===0) stage.classList.add('is-ready');
    }).catch(()=>{ t.loaded=false; });
  }

  function smoothstep(a,b,x){const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);}

  function onScroll(){
    if(!visible) return;
    const rect=section.getBoundingClientRect(), range=Math.max(1,section.offsetHeight-innerHeight);
    const p=Math.max(0,Math.min(1,-rect.top/range));
    let activeS=0;
    for(let s=0;s<N;s++){
      const t=THEMES[s];
      const start=s/N, end=(s+1)/N;
      t.targetWind=1-smoothstep(start+0.02,end-0.03,p);
      t.opacity.value=smoothstep(start+0.005,start+0.06,p)*(1-smoothstep(end+0.005,end+0.07,p));
      if(t.points) t.points.visible=t.opacity.value>0.02;
      if(p>=start&&(s===N-1?p<=end:p<end)) activeS=s;
      if(!t.loaded&&p>start-0.03) loadTheme(s);
    }
    swapText(activeS);
  }

  function resize(){
    const w=section.clientWidth, h=stage.clientHeight; if(!w||!h) return;
    camera.aspect=w/h; camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);
    // Extend the drawing surface beyond the text column's frame without moving its copy.
    renderer.domElement.style.setProperty('width', w + 'px', 'important');
    renderer.domElement.style.left = (stage.clientWidth - w) / 2 + 'px';
  }

  function animate(){
    frameId=requestAnimationFrame(animate);
    uTime.value=clock.getElapsedTime();
    for(let s=0;s<N;s++){ THEMES[s].wind.value+=(THEMES[s].targetWind-THEMES[s].wind.value)*0.12; }
    renderer.render(scene,camera);
  }

  new IntersectionObserver(e=>{
    visible=e[0].isIntersecting;
    if(visible){ loadTheme(0); resize(); if(!frameId) animate(); }
    else if(frameId){ cancelAnimationFrame(frameId); frameId=0; }
  },{threshold:0.01}).observe(section);

  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{resize();onScroll();},{passive:true});
  resize(); onScroll();
})();
