/* ART-V5-R5. Add ink to paper; never erase a cover. Local carrier lifecycle only. */
(() => {
  'use strict';
  const root=document.getElementById('acv5Gallery');
  const work=root?.querySelector('[data-rubbing-workbench]');
  if (!work) return;
  const stage=root.querySelector('#acv3-material-stage');
  const panel=root.querySelector('#acv5-panel-carriers');
  const canvas=work.querySelector('[data-rubbing-canvas]');
  const ctx=canvas.getContext('2d');
  const status=work.querySelector('[data-rubbing-status]');
  const instruction=work.querySelector('[data-rubbing-instruction]');
  const error=work.querySelector('[data-rubbing-error]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const image=new Image();
  const mw=192, mh=166, alpha=new Float32Array(mw*mh);
  const fiber=new Float32Array(mw*mh), weight=new Float32Array(mw*mh);
  const mask=document.createElement('canvas'); mask.width=mw;mask.height=mh;
  const maskCtx=mask.getContext('2d'), pixels=maskCtx.createImageData(mw,mh);
  const ink=document.createElement('canvas'), inkCtx=ink.getContext('2d');
  const paper=document.createElement('canvas'), paperCtx=paper.getContext('2d');
  const layer=document.createElement('canvas'), layerCtx=layer.getContext('2d');
  let ready=false, frame=0, pointer=null, last=null, stroke=0, totalWeight=0;
  let finishing=null, keyboard={x:.48,y:.52}, paperWidth=0;
  let seed=875;
  function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<fiber.length;i++)fiber[i]=.65+random()*.6;
  function active(){return !work.hidden&&!panel.hidden&&!document.hidden;}
  function announce(text){root.querySelector('.acv3-live').textContent=text;}
  function state(value){work.dataset.state=value;status.textContent={idle:'覆纸 · 待拓',working:'拓墨 · 渐显',finishing:'收墨 · 成形',complete:'墨成 · 留痕'}[value];}
  function buildPaper(w,h){
    paper.width=w;paper.height=h;
    const data=paperCtx.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,noise=(random()-.5)*9;
      const age=3*Math.sin(x/w*3.2)+2*Math.cos(y/h*4.5);
      data.data[i]=238+noise-age;data.data[i+1]=226+noise-age;data.data[i+2]=201+noise-age;data.data[i+3]=255;
    }
    paperCtx.putImageData(data,0,0);
    paperCtx.strokeStyle='rgba(117,94,63,.045)';paperCtx.lineWidth=.7;
    for(let n=0;n<180;n++){const x=random()*w,y=random()*h;paperCtx.beginPath();paperCtx.moveTo(x,y);paperCtx.lineTo(x+random()*35-10,y+random()*3);paperCtx.stroke();}
  }
  function resize(){
    const box=canvas.getBoundingClientRect();if(box.width<2||box.height<2)return;
    const w=Math.min(1004,Math.round(box.width*Math.min(devicePixelRatio||1,2))),h=Math.round(w*mh/mw);
    if(w!==paperWidth){paperWidth=w;canvas.width=layer.width=w;canvas.height=layer.height=h;buildPaper(w,h);}
    schedule();
  }
  function coverage(){let sum=0;for(let i=0;i<alpha.length;i++)sum+=alpha[i]*weight[i];return totalWeight?sum/totalWeight:0;}
  function paint(){
    if(!ready||!canvas.width)return;
    for(let i=0;i<alpha.length;i++)pixels.data[i*4+3]=Math.round(alpha[i]*255);
    maskCtx.putImageData(pixels,0,0);
    layerCtx.clearRect(0,0,layer.width,layer.height);
    layerCtx.globalCompositeOperation='source-over';layerCtx.drawImage(mask,0,0,layer.width,layer.height);
    layerCtx.globalCompositeOperation='source-in';layerCtx.drawImage(ink,0,0,layer.width,layer.height);
    layerCtx.globalCompositeOperation='source-over';
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(paper,0,0);
    ctx.globalCompositeOperation='multiply';
    // A quiet emboss guide; darkness is deposited by input, not scratched away.
    ctx.globalAlpha=.028;ctx.drawImage(ink,0,0,canvas.width,canvas.height);
    ctx.globalAlpha=1;ctx.drawImage(layer,0,0);ctx.globalCompositeOperation='source-over';
    work.dataset.coverage=coverage().toFixed(4);
  }
  function tick(now){
    frame=0;if(!active())return;
    if(finishing){
      const t=reduced.matches?1:Math.min(1,(now-finishing.start)/850),e=1-Math.pow(1-t,3);
      for(let i=0;i<alpha.length;i++)alpha[i]=finishing.from[i]+(1-finishing.from[i])*e;
      if(t>=1){finishing=null;state('complete');instruction.textContent='一纸墨痕，留住石上的文字。';canvas.setAttribute('aria-label','已完成：九成宫醴泉铭宋拓本局部数字拓印');announce('拓印完成。所据为宋拓本数字图像，可重新拓印。');}
    }
    paint();if(finishing)schedule();
  }
  function schedule(){if(!frame&&active())frame=requestAnimationFrame(tick);}
  function finish(){
    if(finishing||work.dataset.state==='complete')return;
    release();state('finishing');finishing={from:alpha.slice(),start:performance.now()};schedule();
  }
  function dab(x,y){
    const cx=x*mw,cy=y*mh,rx=mw*.105,ry=mh*.102;
    // Five unequally spaced soft contacts, gently drifting in orientation; no X or hard edge.
    const pads=[[-.31,-.18,.33,.1],[.25,-.27,.26,.065],[.41,.2,.32,.09],[-.24,.34,.24,.055],[.02,.04,.54,.16]],angle=Math.sin(stroke*.071)*.55;
    const co=Math.cos(angle),si=Math.sin(angle);
    for(let yy=Math.max(0,Math.floor(cy-ry*1.7));yy<Math.min(mh,Math.ceil(cy+ry*1.7));yy++)for(let xx=Math.max(0,Math.floor(cx-rx*1.7));xx<Math.min(mw,Math.ceil(cx+rx*1.7));xx++){
      const dx=(xx-cx)/rx,dy=(yy-cy)/ry,u=dx*co-dy*si,v=dx*si+dy*co,i=yy*mw+xx;
      let cloud=0;for(const [px,py,spread,gain] of pads)cloud+=Math.exp(-((u-px)**2+(v-py)**2)/spread)*gain;
      const grain=.88+.12*Math.sin(xx*1.7+yy*.61+stroke*.2),deposit=Math.min(.39,cloud*fiber[i]*grain);
      alpha[i]+=(1-alpha[i])*deposit;
    }
    stroke++;
  }
  function point(e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)/b.width,y:(e.clientY-b.top)/b.height};}
  function apply(p){
    if(!ready||!active()||work.dataset.original==='true'||finishing||work.dataset.state==='complete')return;
    if(p.x<0||p.x>1||p.y<0||p.y>1){last=null;return;}
    if(work.dataset.state==='idle'){state('working');instruction.textContent='轻轻往复，让墨色贴着纸纹渐渐显出。';announce('正在拓印，墨色随按压逐层积累。');}
    if(last){const distance=Math.hypot(p.x-last.x,p.y-last.y),steps=Math.min(140,Math.max(1,Math.ceil(distance/.018)));for(let n=1;n<=steps;n++)dab(last.x+(p.x-last.x)*n/steps,last.y+(p.y-last.y)*n/steps);}
    else dab(p.x,p.y);
    last=p;schedule();if(coverage()>=.72)finish();
  }
  function release(){
    const id=pointer;pointer=null;last=null;
    if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary||!ready||!active()||['finishing','complete'].includes(work.dataset.state))return;
    pointer=e.pointerId;last=null;canvas.setPointerCapture(pointer);canvas.focus({preventScroll:true});apply(point(e));e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const samples=e.getCoalescedEvents?.()||[];for(const sample of samples.length?samples:[e])apply(point(sample));});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,release));
  canvas.addEventListener('keydown',e=>{
    const delta={ArrowLeft:[-.055,0],ArrowRight:[.055,0],ArrowUp:[0,-.055],ArrowDown:[0,.055]}[e.key];
    if(!delta||!active()||!ready)return;e.preventDefault();
    last={...keyboard};keyboard.x=Math.max(.02,Math.min(.98,keyboard.x+delta[0]));keyboard.y=Math.max(.02,Math.min(.98,keyboard.y+delta[1]));apply(keyboard);last=null;
  });
  function reset(){
    release();if(frame)cancelAnimationFrame(frame);frame=0;finishing=null;alpha.fill(0);stroke=0;keyboard={x:.48,y:.52};work.dataset.original='false';work.querySelector('[data-rubbing-original]').textContent='完整原图 ↗';state('idle');
    canvas.setAttribute('aria-label','待拓纸面：按住鼠标拖动，或用方向键拓印');instruction.textContent='按住并移动，试着拓出纸上的字迹';
    if(!ready&&image.complete){image.src=image.src;}resize();schedule();announce('已覆新纸，可以重新拓印。');
  }
  work.querySelector('[data-rubbing-reset]').addEventListener('click',reset);
  work.querySelector('[data-rubbing-original]').addEventListener('click',()=>{
    release();work.dataset.original=String(work.dataset.original!=='true');
    work.querySelector('[data-rubbing-original]').textContent=work.dataset.original==='true'?'返回拓纸 ↙':'完整原图 ↗';resize();schedule();
  });
  work.querySelector('[data-rubbing-result]').addEventListener('click',()=>{if(!ready||!active())return;work.dataset.original='false';work.querySelector('[data-rubbing-original]').textContent='完整原图 ↗';resize();finish();});
  function visibility(){
    work.hidden=stage.dataset.carrier!=='rubbing';
    if(!active()){release();if(frame)cancelAnimationFrame(frame);frame=0;if(finishing)finishing.from=alpha.slice();}
    else{if(finishing)finishing.start=performance.now();resize();schedule();}
  }
  root.addEventListener('acv5:carrierchange',visibility);root.addEventListener('acv5:topicchange',visibility);
  document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',release);
  new ResizeObserver(resize).observe(canvas);
  image.onload=()=>{
    try{
      ink.width=1004;ink.height=870;
      // Only the two inscription leaves; museum label, mounts and colour chart are excluded.
      inkCtx.drawImage(image,300/1600*image.naturalWidth,150/1200*image.naturalHeight,1004/1600*image.naturalWidth,870/1200*image.naturalHeight,0,0,1004,870);
      const data=inkCtx.getImageData(0,0,ink.width,ink.height);
      for(let i=0;i<data.data.length;i+=4){const d=data.data,lum=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;
        d[i]=Math.min(89,d[i]*.54+20);d[i+1]=Math.min(82,d[i+1]*.49+18);d[i+2]=Math.min(69,d[i+2]*.43+16);d[i+3]=Math.round(Math.pow(1-lum,1.25)*255);}
      inkCtx.putImageData(data,0,0);maskCtx.drawImage(ink,0,0,mw,mh);
      const low=maskCtx.getImageData(0,0,mw,mh).data;totalWeight=0;for(let i=0;i<weight.length;i++){weight[i]=low[i*4+3]/255;totalWeight+=weight[i];}
      pixels.data.fill(255);ready=true;error.hidden=true;visibility();
    }catch(e){error.hidden=false;status.textContent='图像暂不可用';}
  };
  image.onerror=()=>{ready=false;error.hidden=false;status.textContent='图像暂不可用';};
  if(!ctx){error.hidden=false;return;}
  image.src='../images/art-culture/ouyang-jiucheng.webp';visibility();
})();
