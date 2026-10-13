/* R6: manuscript writing and simplified woodblock printing. No shared scene controls. */
(() => {
  'use strict';
  const root=document.getElementById('acv5Gallery');
  const stage=root?.querySelector('#acv3-material-stage'),panel=root?.querySelector('#acv5-panel-carriers');
  if(!stage||!panel)return;
  const writing=root.querySelector('[data-writing-workbench]'),printing=root.querySelector('[data-print-workbench]');
  const wc=writing.querySelector('[data-writing-canvas]'),wctx=wc.getContext('2d');
  const ink=document.createElement('canvas');ink.width=1200;ink.height=800;const pen=ink.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let pointer=null,last=null,strokeCount=0,wframe=0,keyboardMark=0;
  const live=text=>{root.querySelector('.acv3-live').textContent=text;};
  const active=work=>!work.hidden&&!panel.hidden&&!document.hidden;
  const wstate=value=>{writing.dataset.state=value;writing.querySelector('[data-writing-status]').textContent={idle:'展纸 · 待书',working:'执笔 · 留墨',complete:'收笔 · 留看'}[value];};
  function paintWriting(){wframe=0;if(!active(writing)||!wctx)return;wctx.clearRect(0,0,wc.width,wc.height);wctx.drawImage(ink,0,0,wc.width,wc.height);}
  function scheduleWriting(){if(!wframe&&active(writing))wframe=requestAnimationFrame(paintWriting);}
  function resizeWriting(){const b=wc.getBoundingClientRect();if(b.width<2||!wctx)return;const scale=Math.min(devicePixelRatio||1,2),w=Math.min(1200,Math.round(b.width*scale)),h=Math.round(w*2/3);if(wc.width!==w||wc.height!==h){wc.width=w;wc.height=h;}scheduleWriting();}
  function mark(x,y,r,angle,darkness){
    pen.save();pen.translate(x*1200,y*800);pen.rotate(angle);pen.scale(1,.68);
    const radius=r*1200,g=pen.createRadialGradient(0,0,radius*.1,0,0,radius*1.45);
    g.addColorStop(0,'rgba(38,31,23,'+darkness+')');g.addColorStop(.55,'rgba(44,34,25,'+(darkness*.8)+')');g.addColorStop(1,'rgba(58,43,29,0)');
    pen.fillStyle=g;pen.fillRect(-radius*1.45,-radius*1.45,radius*2.9,radius*2.9);
    pen.restore();
  }
  function line(p){
    if(!last){mark(p.x,p.y,.004,0,.24);last=p;return;}
    const dx=p.x-last.x,dy=p.y-last.y,dist=Math.hypot(dx,dy),dt=Math.max(5,p.time-last.time);
    // Speed changes a broad, tapered brush footprint; it does not prescribe a glyph or stroke order.
    const speed=dist*700/dt,r=Math.max(.0025,Math.min(.0105,.0105/(1+speed*2.4))),angle=Math.atan2(dy,dx);
    const count=Math.min(220,Math.max(1,Math.ceil(dist/.0017)));
    for(let n=1;n<=count;n++){const t=n/count;mark(last.x+dx*t,last.y+dy*t,r,angle,.24+.12/(1+speed));}
    last=p;scheduleWriting();
  }
  function point(e){const b=wc.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(e.clientY-b.top)/b.height)),time:e.timeStamp||performance.now()};}
  function releaseWriting(){const id=pointer;pointer=null;last=null;if(id!==null&&wc.hasPointerCapture(id))wc.releasePointerCapture(id);writing.dataset.pointer='released';}
  wc.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||!active(writing)||!wctx||!pen)return;pointer=e.pointerId;writing.dataset.pointer='held';last=null;wc.setPointerCapture(pointer);wc.focus({preventScroll:true});strokeCount++;writing.dataset.strokes=strokeCount;wstate('working');line(point(e));scheduleWriting();e.preventDefault();});
  wc.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const events=e.getCoalescedEvents?.()||[];for(const sample of events.length?events:[e])line(point(sample));});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>wc.addEventListener(type,releaseWriting));
  function clearWriting(){releaseWriting();pen?.clearRect(0,0,1200,800);strokeCount=0;keyboardMark=0;writing.dataset.strokes=0;wstate('idle');writing.querySelector('[data-writing-instruction]').textContent='按住纸面移动，快慢之间，墨色与线条也随之变化。';scheduleWriting();live('已换新纸，可以重新书写。');}
  writing.querySelector('[data-writing-clear]').addEventListener('click',clearWriting);
  writing.querySelector('[data-writing-finish]').addEventListener('click',()=>{releaseWriting();if(!strokeCount){live('纸面尚未留墨，可自由书写或使用键盘试笔。');return;}wstate('complete');writing.querySelector('[data-writing-instruction]').textContent='纸上留下的是你的笔迹。可与原卷观察对照，也可继续落笔。';live('已收笔留看。此为当代自由书写，并非古代书迹。');});
  writing.querySelector('[data-writing-keyboard]').addEventListener('click',()=>{
    if(!active(writing)||!pen)return;strokeCount++;writing.dataset.strokes=strokeCount;wstate('working');last=null;
    const y=.22+(keyboardMark%4)*.14;for(let n=0;n<70;n++)line({x:.18+n*.006,y:y+Math.sin(n/69*Math.PI)*.08,time:n*15});last=null;keyboardMark++;scheduleWriting();live('已试下一道抽象墨线。可收笔留看，非古代字形或笔顺。');
  });
  wc.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();writing.querySelector('[data-writing-keyboard]').click();}});
  new ResizeObserver(resizeWriting).observe(wc);

  const block=printing.querySelector('[data-print-block]'),bctx=block.getContext('2d'),original=new Image();
  const coverButton=printing.querySelector('[data-print-cover]'),revealButton=printing.querySelector('[data-print-reveal]');
  const pressure=printing.querySelector('[data-print-pressure]'),handle=printing.querySelector('[data-print-handle]'),paper=printing.querySelector('[data-print-paper]');
  let pstate='idle',totalPress=0,pressStart=0,pressFrame=0,pressPointer=null,pressKey=null,timer=0,drag=null,dragMoved=false,blockReady=false,pendingTransition=null;
  function printState(value){
    pstate=value;printing.dataset.state=value;
    const messages={idle:'点击“覆纸”，也可拖动纸角，将纸张移向木版。',covering:'纸张落于版面，准备压印。',covered:'按住纸面中央，轻轻压合；键盘可按住空格或回车。',pressing:'纸与版正在贴合，稳稳按住。',pressed:'墨已着纸。点击“揭纸见印”，或拖动纸角揭开。',revealing:'轻轻揭纸，图文留于纸面。',complete:'眼前为868年《金刚经》存世印本的数字图像；木版与操作均为现代示意。'};
    printing.querySelector('[data-print-instruction]').textContent=messages[value];
    coverButton.disabled=value!=='idle';revealButton.disabled=value!=='pressed';pressure.setAttribute('aria-disabled',String(!['covered','pressing'].includes(value)));
    pressure.textContent=value==='pressed'?'压印已合 · 可揭纸':'按住此处，轻轻压合';handle.textContent=value==='pressed'?'揭纸 ↗':'执纸 ↙';
    printing.querySelectorAll('[data-print-step]').forEach(el=>{if(el.dataset.printStep===(['idle','covering'].includes(value)?'cover':['covered','pressing'].includes(value)?'press':'reveal'))el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    live(messages[value]);
  }
  function resumeTransition(){if(!pendingTransition||timer||!active(printing))return;pendingTransition.due=performance.now()+pendingTransition.remaining;timer=setTimeout(()=>{timer=0;const fn=pendingTransition.fn;pendingTransition=null;fn();},pendingTransition.remaining);}
  function later(fn,ms){clearTimeout(timer);timer=0;pendingTransition={fn,remaining:reduced.matches?0:ms,due:0};resumeTransition();}
  function cover(){if(pstate!=='idle'||!blockReady)return;printState('covering');later(()=>printState('covered'),650);}
  function reveal(){if(pstate!=='pressed')return;stopPress();printState('revealing');later(()=>printState('complete'),700);}
  function stopPress(){
    if(pressStart){totalPress+=Math.max(0,performance.now()-pressStart);pressStart=0;}
    if(pressFrame)cancelAnimationFrame(pressFrame);pressFrame=0;const id=pressPointer;pressPointer=null;pressKey=null;
    if(id!==null&&pressure.hasPointerCapture(id))pressure.releasePointerCapture(id);
    if(pstate==='pressing')printState('covered');
  }
  function pressureTick(now){pressFrame=0;if(!pressStart||!active(printing))return;const amount=Math.min(1,(totalPress+now-pressStart)/1600);printing.dataset.pressure=amount.toFixed(3);if(amount>=1){stopPress();printState('pressed');}else pressFrame=requestAnimationFrame(pressureTick);}
  function beginPress(){if(pstate!=='covered'||!active(printing))return;pressStart=performance.now();printState('pressing');pressFrame=requestAnimationFrame(pressureTick);}
  pressure.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||pstate!=='covered')return;pressPointer=e.pointerId;pressure.setPointerCapture(e.pointerId);pressure.focus({preventScroll:true});beginPress();e.preventDefault();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>pressure.addEventListener(type,stopPress));
  pressure.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat&&pstate==='covered'){pressKey=e.key;beginPress();}}});
  pressure.addEventListener('keyup',e=>{if(e.key===pressKey){e.preventDefault();stopPress();}});pressure.addEventListener('blur',stopPress);
  handle.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||!['idle','pressed'].includes(pstate))return;drag={id:e.pointerId,x:e.clientX,state:pstate};dragMoved=false;handle.setPointerCapture(e.pointerId);e.preventDefault();});
  handle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,w=printing.querySelector('[data-print-plate]').getBoundingClientRect().width;dragMoved=Math.abs(dx)>6;if(drag.state==='idle')paper.style.transform='translateX('+Math.max(0,76+dx/w*100)+'%) rotate('+Math.max(0,8+dx/w*10)+'deg) scale(.95)';else paper.style.transform='rotateY('+Math.min(0,dx/w*120)+'deg)';});
  function releaseDrag(e){if(!drag||e.pointerId!==drag.id)return;const d=drag,dx=e.clientX-d.x;drag=null;paper.style.transform='';if(handle.hasPointerCapture(d.id))handle.releasePointerCapture(d.id);if(e.type==='pointerup'&&dx<-45){if(d.state==='idle')cover();else reveal();}}
  ['pointerup','pointercancel'].forEach(type=>handle.addEventListener(type,releaseDrag));handle.addEventListener('lostpointercapture',()=>{drag=null;paper.style.transform='';});
  handle.addEventListener('click',()=>{if(dragMoved){dragMoved=false;return;}if(pstate==='idle')cover();else if(pstate==='pressed')reveal();});
  coverButton.addEventListener('click',cover);revealButton.addEventListener('click',reveal);
  function cancelDrag(){const id=drag?.id;drag=null;paper.style.transform="";if(id!==undefined&&handle.hasPointerCapture(id))handle.releasePointerCapture(id);}
  function resetPrint(){clearTimeout(timer);timer=0;pendingTransition=null;stopPress();cancelDrag();paper.style.transform='';totalPress=0;printing.dataset.pressure='0';printState('idle');}
  printing.querySelector('[data-print-reset]').addEventListener('click',resetPrint);
  original.onload=()=>{
    if(!bctx)return;block.width=800;block.height=708;
    bctx.fillStyle='#67462e';bctx.fillRect(0,0,800,708);
    // Procedural wood and mirror image explicitly labelled as a modern demonstration.
    for(let i=0;i<140;i++){const y=i*5.1;bctx.beginPath();bctx.strokeStyle=i%3?'#392b1b35':'#c09a6b35';bctx.lineWidth=i%5+1;bctx.moveTo(0,y);for(let x=0;x<=800;x+=20)bctx.lineTo(x,y+Math.sin(x*.018+i)*3);bctx.stroke();}
    bctx.save();bctx.translate(800,0);bctx.scale(-1,1);bctx.globalAlpha=.48;bctx.globalCompositeOperation='multiply';bctx.drawImage(original,125/1600*original.naturalWidth,200/1460*original.naturalHeight,1330/1600*original.naturalWidth,1110/1460*original.naturalHeight,26,26,748,656);bctx.restore();
    blockReady=true;printing.dataset.ready='true';
  };
  original.onerror=()=>{printing.dataset.ready='error';printing.querySelector('[data-print-instruction]').textContent='图像暂不可用，请稍后重试或查看图像来源。';coverButton.disabled=true;};
  original.src='../images/art-culture/diamond-868.webp';

  const dialog=root.querySelector('[data-carrier-dialog]');let dialogInvoker=null;
  function openOriginal(kind,invoker){const manuscript=kind==='manuscript';dialogInvoker=invoker;dialog.querySelector('[data-carrier-dialog-title]').textContent=manuscript?'敦煌《法华经》残卷 · 原卷对照':'868年《金刚经》· 存世印本';const img=dialog.querySelector('[data-carrier-dialog-image]');img.src='../images/art-culture/'+(manuscript?'dunhuang-manuscript.webp':'diamond-868.webp');img.alt=manuscript?'敦煌法华经残卷 Or.8210/S.970 完整数字原图':'868年金刚经卷首完整数字原图';dialog.querySelector('[data-carrier-dialog-caption]').textContent=manuscript?'British Library / IDP · CC BY 4.0。具体抄写年未定；不是你的书写结果。':'British Library / IDP · Public Domain。存世印本数字图像，不是模拟木版。';dialog.showModal();}
  writing.querySelector('[data-writing-original]').addEventListener('click',e=>openOriginal('manuscript',e.currentTarget));printing.querySelector('[data-print-original]').addEventListener('click',e=>openOriginal('print',e.currentTarget));
  dialog.querySelector('[data-carrier-dialog-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>dialogInvoker?.focus({preventScroll:true}));
  function lifecycle(){
    writing.hidden=stage.dataset.carrier!=='manuscript';printing.hidden=stage.dataset.carrier!=='print';
    if(!active(writing)){releaseWriting();if(wframe)cancelAnimationFrame(wframe);wframe=0;}else resizeWriting();
    if(!active(printing)){stopPress();cancelDrag();if(timer){pendingTransition.remaining=Math.max(0,pendingTransition.due-performance.now());clearTimeout(timer);timer=0;}}else resumeTransition();
    if(dialog.open&&panel.hidden)dialog.close();
  }
  root.addEventListener('acv5:carrierchange',lifecycle);root.addEventListener('acv5:topicchange',lifecycle);document.addEventListener('visibilitychange',lifecycle);window.addEventListener('blur',()=>{releaseWriting();stopPress();cancelDrag();});
  writing.dataset.strokes='0';printing.dataset.pressure='0';lifecycle();
})();
