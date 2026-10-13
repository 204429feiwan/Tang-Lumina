(() => {
  'use strict';
  const CONFIG = Object.freeze({ desktopTravel: 2.7, mobileTravel: 2.2, followSeconds: .25, settleEpsilon: .00008, dprMax: 1.5, rotationDegrees: 360, rotationEnd: .86, canvasFit: .62 });
  const clamp = (v, lo=0, hi=1) => Math.min(hi,Math.max(lo,v));
  const ease = (p,a,b) => { const t=clamp((p-a)/(b-a)); return t*t*(3-2*t); };
  let instance;
  // Reuse the five intact R4 rings: A and B always share the same continuous radius.
  // Fixed framing reserves room for the original +60% outer-ring release; no whole-flower zoom.
  const LAYERS = Object.freeze([
    {key:'core',name:'花芯',range:[.36,.43],open:[.12,.18],close:[.80,.86],releaseBoost:.08},
    {key:'inner',name:'内层辅助瓣',range:[.39,.47],open:[.12,.20],close:[.76,.86],releaseBoost:.18},
    {key:'main',name:'主瓣',range:[.42,.54],open:[.14,.25],close:[.71,.86],releaseBoost:.30},
    {key:'secondary',name:'外圈花饰',range:[.48,.59],open:[.16,.31],close:[.67,.86],releaseBoost:.45},
    {key:'outer',name:'最外卷草',range:[.54,.62],open:[.18,.36],close:[.62,.86],releaseBoost:.60}
  ]);
  function sampleTransition(p) {
    return {rotationDegrees:CONFIG.rotationDegrees*ease(p,0,CONFIG.rotationEnd),
      layers:LAYERS.map(layer=>{
        const openAmount=(1-Math.pow(1-ease(p,...layer.open),4))*(1-ease(p,...layer.close));
        return {...layer,mix:ease(p,...layer.range),openAmount,radialFactor:1+layer.releaseBoost*openAmount};
      })};
  }
  function init() {
    if (instance) return instance;
    const section=document.getElementById('motifPrelude');
    if (!section) return null;
    const stage=section.querySelector('.motif-prelude__stage'), visual=section.querySelector('.motif-prelude__visual'), canvas=section.querySelector('canvas'), fallback=section.querySelector('img'), status=section.querySelector('[role="status"]'), mode=section.querySelector('[data-motif-mode]');
    const ctx=canvas.getContext?.('2d',{alpha:true});
    if (!ctx) {
      mode.disabled=true;mode.textContent='静态纹样';status.textContent='当前设备显示完整纹样 A。';
      instance={destroy(){instance=null;}};return instance;
    }
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const scroller=document.scrollingElement;
    const state={start:0,end:0,target:0,display:0,size:0,stageHeight:0,top:72,viewportHeight:0,viewportWidth:0,navClearance:0,visible:false,near:false,manualStatic:false,failed:false,disposed:false,epoch:0,current:null,pending:null,raf:0,layoutRaf:0,layoutTimer:0,lastTime:0,dirty:true,draws:0,drawMs:[],maxCacheBytes:0};
    const test=location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).has('motif-test');
    const freeze=test&&new URLSearchParams(location.search).get('motif-ab')==='A';
    const cleanups=[];
    const listen=(target,type,fn,opts)=>{target.addEventListener(type,fn,opts);cleanups.push(()=>target.removeEventListener(type,fn,opts));};
    const staticMode=()=>motion.matches||state.manualStatic||state.failed;
    const position=()=>scroller.scrollTop;
    const readProgress=()=>state.end>state.start?clamp((position()-state.start)/(state.end-state.start)):1;
    const release=cache=>{if(!cache)return;cache.parts.forEach(part=>{part.canvas.width=part.canvas.height=0;});cache.parts.length=0;if(cache.blend)cache.blend.canvas.width=cache.blend.canvas.height=0;};
    const stop=()=>{cancelAnimationFrame(state.raf);state.raf=0;state.lastTime=0;};
    function render() {
      if(!state.current||state.disposed||(!state.visible&&!state.dirty)||document.hidden)return;
      if(freeze&&!state.dirty)return;
      const time=performance.now(),cache=state.current,s=state.size,w=cache.width,h=cache.height;
      const renderKey=`${cache.id}:${freeze?'frozen':staticMode()?1:state.display}:${s}:${canvas.width}`;
      if(renderKey===state.lastRenderKey){state.dirty=false;return;}state.lastRenderKey=renderKey;
      ctx.clearRect(0,0,s,s);
      const p=staticMode()||freeze?1:state.display,pose=sampleTransition(p),unit=s*CONFIG.canvasFit/w;
      ctx.save();ctx.translate(s/2,s/2);ctx.rotate(pose.rotationDegrees*Math.PI/180);ctx.scale(unit,unit);
      // Blend only within each A/B ring. Composite different rings normally so their
      // temporarily overlapping edges cannot add up into bright patches during closure.
      for(let i=LAYERS.length-1;i>=0;i--){
        const {mix,radialFactor}=pose.layers[i],a=cache.a[i],b=cache.b[i];
        ctx.save();ctx.scale(radialFactor,radialFactor);
        if(mix===0||mix===1){
          const layer=mix===0?a:b;
          ctx.drawImage(layer.canvas,layer.bounds[0]-w/2,layer.bounds[1]-h/2);
        }else{
          const blend=cache.blend,c=blend.ctx,[x,y,right,bottom]=blend.bounds;
          c.clearRect(0,0,right-x,bottom-y);c.globalCompositeOperation='source-over';c.globalAlpha=1-mix;
          c.drawImage(a.canvas,a.bounds[0]-x,a.bounds[1]-y);
          c.globalCompositeOperation='lighter';c.globalAlpha=mix;
          c.drawImage(b.canvas,b.bounds[0]-x,b.bounds[1]-y);
          const left=Math.min(a.bounds[0],b.bounds[0]),top=Math.min(a.bounds[1],b.bounds[1]);
          const width=Math.max(a.bounds[2],b.bounds[2])-left,height=Math.max(a.bounds[3],b.bounds[3])-top;
          ctx.drawImage(blend.canvas,left-x,top-y,width,height,left-w/2,top-h/2,width,height);
        }
        ctx.restore();
      }
      ctx.restore();
      state.draws++;state.dirty=false; if(test){state.drawMs.push(performance.now()-time);if(state.drawMs.length>20000)state.drawMs.shift();}
    }
    function tick(time) {
      state.raf=0;if(state.disposed||document.hidden||!state.visible)return;
      const dt=state.lastTime?Math.max(0,(time-state.lastTime)/1000):1/60;state.lastTime=time;
      if(staticMode())state.display=1;
      else {const diff=state.target-state.display;state.display=Math.abs(diff)<CONFIG.settleEpsilon?state.target:state.display+diff*(1-Math.exp(-dt/(CONFIG.followSeconds/5)));}
      if(!staticMode()&&Math.abs(state.target-state.display)<=CONFIG.settleEpsilon)state.display=state.target;
      render();
      if(!staticMode()&&Math.abs(state.target-state.display)>CONFIG.settleEpsilon&&!freeze)state.raf=requestAnimationFrame(tick);else state.lastTime=0;
    }
    function schedule() {if(!state.raf&&!state.disposed&&state.visible&&!document.hidden)state.raf=requestAnimationFrame(tick);}
    function sync(immediate=false) {state.target=readProgress();if(immediate||!state.visible||document.hidden)state.display=state.target;state.dirty=true;schedule();}
    function measure(force=false) {
      if(state.disposed)return;
      const vw=document.documentElement.clientWidth,vh=window.innerHeight;
      if(!force&&vw===state.viewportWidth&&Math.abs(vh-state.viewportHeight)<90)return;
      if(vw!==state.viewportWidth)state.navClearance=0;state.viewportWidth=vw;state.viewportHeight=vh;
      const nav=document.querySelector('.navbar');state.navClearance=Math.max(state.navClearance,nav?.offsetHeight||72);state.top=Math.max(60,Math.min(96,state.navClearance))+8;
      state.stageHeight=Math.max(420,vh-state.top);
      const travel=Math.round(vh*(vw<=600?CONFIG.mobileTravel:CONFIG.desktopTravel));
      section.style.setProperty('--mp-top',`${state.top}px`);section.style.setProperty('--mp-stage',`${state.stageHeight}px`);section.style.setProperty('--mp-travel',`${travel}px`);
      section.classList.toggle('is-dynamic',!staticMode());
      state.start=section.getBoundingClientRect().top+position()-state.top;state.end=state.start+(staticMode()?0:travel);
      const box=visual.getBoundingClientRect();state.size=Math.max(1,Math.floor(Math.min(box.width,box.height,760)));
      section.style.setProperty('--mp-size',`${state.size}px`);
      const dpr=Math.min(devicePixelRatio||1,CONFIG.dprMax),pw=Math.round(state.size*dpr);
      if(canvas.width!==pw||canvas.height!==pw){canvas.width=canvas.height=pw;ctx.setTransform(dpr,0,0,dpr,0,0);}
      sync(true);
    }
    function queueMeasure(force=false){if(state.layoutRaf)return;state.layoutRaf=requestAnimationFrame(()=>{state.layoutRaf=0;measure(force);});}
    function changeMode() {
      stop();const oldHeight=section.getBoundingClientRect().height,oldY=position(),sectionTop=section.getBoundingClientRect().top+oldY,stageTop=stage.getBoundingClientRect().top;
      measure(true);const newHeight=section.getBoundingClientRect().height;
      // One anchor correction on a mode change, never a scroll-driven correction.
      if(oldY>=sectionTop+oldHeight)window.scrollTo({top:oldY+newHeight-oldHeight,behavior:'instant'});
      else if(oldHeight>newHeight&&oldY>state.start)window.scrollTo({top:Math.max(0,sectionTop-stageTop),behavior:'instant'});
      mode.disabled=motion.matches;mode.textContent=motion.matches?'系统已减少动态':state.manualStatic?'恢复滚动效果':'静态查看';sync(true);
    }
    function polyPath(points,w,h){const path=new Path2D();points.forEach(([x,y],i)=>i?path.lineTo(x*w,y*h):path.moveTo(x*w,y*h));path.closePath();return path;}
    const idle=()=>new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(resolve,{timeout:80});else setTimeout(resolve,0);});
    async function preparePair(epoch,signal) {
      const ids=['01','05'];
      const data=await Promise.all(ids.map(async id=>{
        const r=await fetch(`../images/motif-prelude/${id}.json`,{signal});
        if(!r.ok)throw Error('纹样结构未就绪');return r.json();
      }));
      const valid=()=>{if(epoch!==state.epoch||signal.aborted||state.disposed)throw new DOMException('Outdated','AbortError');};
      valid();
      const w=960,h=960,cache={id:'A-B',width:w,height:h,a:[],b:[],parts:[],bytes:0};
      // Interior boundaries are calibrated semantic guides shared by A and B, not petal correspondences.
      const centred=(d,key)=>d.polygons[key].map(([x,y])=>[x-d.center[0]+.5,y-d.center[1]+.5]);
      const shared=LAYERS.slice(0,4).map(({key})=>{
        const a=centred(data[0],key),b=centred(data[1],key);
        if(a.length!==b.length)throw Error('语义轮廓采样不一致');
        return a.map(([x,y],i)=>[(x+b[i][0])/2,(y+b[i][1])/2]);
      });
      const sharedPaths=shared.map(points=>polyPath(points,w,h));
      try {
        for(let source=0;source<2;source++){
          valid();const r=await fetch(`../images/motif-prelude/${ids[source]}.webp`,{signal});
          if(!r.ok)throw Error('纹样图片未就绪');const bitmap=await createImageBitmap(await r.blob());
          try {
            valid();const d=data[source],outer=centred(d,'outer'),outerPath=polyPath(outer,w,h);
            for(let i=0;i<LAYERS.length;i++){
              valid();const points=i===4?outer:shared[i];
              const xs=points.map(p=>p[0]*w),ys=points.map(p=>p[1]*h);
              const bounds=[Math.max(0,Math.floor(Math.min(...xs))-2),Math.max(0,Math.floor(Math.min(...ys))-2),Math.min(w,Math.ceil(Math.max(...xs))+2),Math.min(h,Math.ceil(Math.max(...ys))+2)];
              const [x,y,right,bottom]=bounds,tile=document.createElement('canvas');tile.width=right-x;tile.height=bottom-y;
              const c=tile.getContext('2d');c.translate(-x,-y);c.save();c.clip(outerPath);c.clip(i===4?outerPath:sharedPaths[i]);
              c.drawImage(bitmap,(.5-d.center[0])*w,(.5-d.center[1])*h,w,h);c.restore();
              if(i){c.globalCompositeOperation='destination-out';c.fill(sharedPaths[i-1]);}
              const layer={canvas:tile,bounds};cache.parts.push(layer);cache[source===0?'a':'b'].push(layer);
              cache.bytes+=tile.width*tile.height*4;
              state.maxCacheBytes=Math.max(state.maxCacheBytes,cache.bytes+(state.current?.bytes||0)+w*h*4+canvas.width*canvas.height*4);
              await idle();
            }
          }finally{bitmap.close();}
        }
        // One reusable, tightly bounded pair-compositing surface; never allocate during scroll.
        const bounds=[Math.min(...cache.parts.map(l=>l.bounds[0])),Math.min(...cache.parts.map(l=>l.bounds[1])),Math.max(...cache.parts.map(l=>l.bounds[2])),Math.max(...cache.parts.map(l=>l.bounds[3]))];
        const blendCanvas=document.createElement('canvas');blendCanvas.width=bounds[2]-bounds[0];blendCanvas.height=bounds[3]-bounds[1];
        cache.blend={canvas:blendCanvas,ctx:blendCanvas.getContext('2d'),bounds};
        cache.bytes+=blendCanvas.width*blendCanvas.height*4;
        state.maxCacheBytes=Math.max(state.maxCacheBytes,cache.bytes+(state.current?.bytes||0)+canvas.width*canvas.height*4);
        valid();return cache;
      }catch(error){release(cache);throw error;}
    }
    function loadPair() {
      if(state.disposed||state.current)return Promise.resolve();
      if(state.pending)return state.pending.promise;
      const epoch=++state.epoch,controller=new AbortController();let timedOut=false;
      const timeout=setTimeout(()=>{timedOut=true;controller.abort();},12000);
      section.setAttribute('aria-busy','true');status.textContent='纹样 A / B 读取中';
      const promise=preparePair(epoch,controller.signal).then(cache=>{
        if(epoch!==state.epoch||state.disposed){release(cache);return;}
        const recovered=state.failed;state.current=cache;state.failed=false;
        section.classList.add('is-ready');status.textContent='';if(recovered)changeMode();else sync(true);
      }).catch(error=>{
        if(epoch!==state.epoch||(error.name==='AbortError'&&!timedOut))return;
        state.failed=true;status.textContent='变换暂未准备好，保留完整纹样 A，可继续阅读。';changeMode();
      }).finally(()=>{clearTimeout(timeout);if(epoch===state.epoch){state.pending=null;section.removeAttribute('aria-busy');}});
      state.pending={controller,promise};return promise;
    }
    const nearObserver=new IntersectionObserver(entries=>{state.near=entries[0].isIntersecting;if(state.near&&!state.current&&!state.pending)loadPair();},{rootMargin:'600px 0px'});nearObserver.observe(section);
    const visibleObserver=new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;if(state.visible)sync(true);else {stop();state.display=state.target=readProgress();}},{threshold:0});visibleObserver.observe(stage);
    listen(window,'scroll',()=>{if(!staticMode())sync();},{passive:true});
    listen(window,'resize',()=>{clearTimeout(state.layoutTimer);state.layoutTimer=setTimeout(()=>queueMeasure(),160);},{passive:true});
    listen(window,'pageshow',()=>queueMeasure(true));listen(window,'load',()=>queueMeasure(true));listen(document,'visibilitychange',()=>{stop();if(!document.hidden)sync(true);});
    listen(motion,'change',changeMode);listen(mode,'click',()=>{state.manualStatic=!state.manualStatic;changeMode();});
    const observedSizes=new WeakMap();
    const resizeObserver=new ResizeObserver(entries=>{let changed=false;for(const e of entries){const size=`${e.contentRect.width}:${e.contentRect.height}`;if(observedSizes.get(e.target)!==size){observedSizes.set(e.target,size);if(e.target!==nav||nav.offsetHeight>state.navClearance||document.documentElement.clientWidth!==state.viewportWidth)changed=true;}}if(changed)queueMeasure(true);});
    resizeObserver.observe(visual);const hero=document.getElementById('pageHero'),nav=document.querySelector('.navbar');if(hero)resizeObserver.observe(hero);if(nav)resizeObserver.observe(nav);
    if(document.fonts?.ready)document.fonts.ready.then(()=>{if(!state.disposed)queueMeasure(true);});
    function destroy(){if(state.disposed)return;state.disposed=true;state.epoch++;stop();cancelAnimationFrame(state.layoutRaf);clearTimeout(state.layoutTimer);state.pending?.controller.abort();nearObserver.disconnect();visibleObserver.disconnect();resizeObserver.disconnect();cleanups.forEach(fn=>fn());release(state.current);state.current=null;section.classList.remove('is-dynamic','is-ready');section.removeAttribute('aria-busy');canvas.width=canvas.height=0;status.textContent='';instance=null;}
    instance={destroy,refresh:()=>measure(true)};
    if(test)instance.inspect=()=>({sources:['01','05'],pTarget:state.target,pDisplay:state.display,start:state.start,end:state.end,travel:state.end-state.start,sectionHeight:section.getBoundingClientRect().height,stageHeight:state.stageHeight,size:state.size,top:state.top,static:staticMode(),visible:state.visible,draws:state.draws,drawMs:state.drawMs.slice(),cacheBytes:state.current?.bytes||0,maxCacheBytes:state.maxCacheBytes,pending:!!state.pending,raf:state.raf,config:CONFIG,transition:sampleTransition(staticMode()?1:state.display),layerCount:state.current?.parts.length||0,driver:'native scroll + one on-demand RAF / A-B semantic takeover',scroller:scroller.tagName,freeze});
    mode.disabled=motion.matches;mode.textContent=motion.matches?'系统已减少动态':'静态查看';measure(true);return instance;
  }
  window.MotifPrelude={init,destroy:()=>instance?.destroy(),get instance(){return instance;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
