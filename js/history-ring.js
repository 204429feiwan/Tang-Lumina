/* Native scroll follows a descending 3D helix, turning and lowering the viewpoint together. */
(() => {
  'use strict';
  const events = window.HISTORY_EVENTS;
  // Commissioned illustrations are paired with their historical year.
  const chapterArt = Object.freeze({
    618:'imperial-618.png',626:'imperial-626.png',627:'imperial-627.png',
    641:'imperial-641.png',690:'imperial-690.png',705:'imperial-705.png',
    713:'imperial-713.png',755:'imperial-755.png',763:'imperial-763.png',
    817:'imperial-817.png',875:'imperial-875.png',907:'imperial-907.png'
  });
  const artFor = event => '../images/history/' + (chapterArt[event.year] || event.image + '.webp');
  const $ = id => document.getElementById(id);
  const root = $('chronicle'), stage = $('chronicleStage'), ring = $('historyRing');
  if (!root || !ring || !events?.length) return;
  const hostContract=window.HistoryHost;
  if (!hostContract ||
      typeof hostContract.getNavbarElement!=='function' ||
      typeof hostContract.getStableTopInset!=='function' ||
      !hostContract.navigationOwner ||
      !hostContract.backToTopOwner) {
    console.error('HistoryRing: required HistoryHost contract is unavailable; initialization skipped.');
    return;
  }
  const initialNavbar=hostContract.getNavbarElement();
  const initialTopInset=hostContract.getStableTopInset();
  if (!initialNavbar || !Number.isFinite(initialTopInset) || initialTopInset<0) {
    console.error('HistoryRing: navbar or stable top inset is unavailable; initialization skipped.');
    return;
  }
  const count = events.length, step = 50;
  const config = Object.freeze({ smoothing:.09, fastSmoothing:.075, snapDelay:120, scrollPerNodeVh:.65, holdVh:.32, transitionVh:1.20, endHoldVh:.45 });
  const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
  const smooth = t => {t=clamp(t);return t*t*(3-2*t);};
  const wrap = a => ((a+180)%360+360)%360-180;
  const exitLayer=$('historyRingExit'), scene=$('historyRingScene'), host=$('chronicleCanvas');
  const info=$('currentEvent'), masthead=document.querySelector('.chronicle-masthead'), ruler=$('rulerStops');
  const mastheadHome=masthead.nextSibling;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let reducedState=reduce.matches;
  const cards=[], rail=[];
  let metrics={}, radius=680, pitch=330, perspective=1800, current=0, target=0, rawIndex=0, distance=0;
  let handoffProgress=0, exitProgress=0, cityProgress=0, activeIndex=-1, visible=true, disposed=false;
  let frame=0, snapTimer=0, lastFrame=0, lastScroll=performance.now(), lastY=scrollY, velocity=0;
  let snapping=false, atLastSince=0, cityView=null, ghost=null, copyAnimation=null, frames=0;
  let resumeOffset=0, resumeOrigin=0, resumeSpan=1;
  let lastHandoff=-1,lastCity=-1,lastProgress=-1,lastHint='';
  let lastEffectsFrame=0;
  let resizeScrollY=null;
  const samples=[];

  function element(tag,className,text) {
    const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;
  }
  events.forEach((event,index)=>{
    const article=element('article','history-card');article.dataset.index=index;article.dataset.year=event.year;
    if (chapterArt[event.year] && event.year !== 618) article.classList.add('has-captioned-art');
    const face=element('button','history-card-face');face.type='button';face.setAttribute('aria-label',`${event.year}年 ${event.title}，查看详情`);
    const imageWrap=element('div','history-card-image'), image=element('img');
    image.src=artFor(event);image.alt=event.title+' · 历史场景绘画';image.width=1200;image.height=800;image.decoding='async';
    imageWrap.append(image,element('span','history-card-index',`大唐纪事 / ${String(index+1).padStart(2,'0')}`),element('span','history-card-artnote','画境意象'));
    const body=element('div','history-card-body'), dateline=element('div','history-card-dateline'), time=element('time','',event.year);
    time.dateTime=String(event.year).padStart(4,'0');dateline.append(time,element('span','',event.caption));
    body.append(dateline,element('h2','',event.title),element('p','',event.description),element('span','history-card-open','展开历史 ↗'));
    face.append(imageWrap,body);article.append(face);ring.append(article);face.addEventListener('click',()=>readEvent(index));
    cards.push({el:article,face,baseAngle:index*step});
    const button=element('button','',event.year);button.type='button';button.setAttribute('aria-label',`${event.year}年 · ${event.title}`);
    button.addEventListener('click',()=>goTo(index));ruler.append(button);rail.push(button);
    const item=element('li');item.id=`event-${event.year}`;
    const readTime=element('time','',event.year);readTime.dateTime=time.dateTime;
    item.append(readTime,element('h3','',event.title),element('p','',event.detail));$('readingEvents').append(item);
  });
  const detailDialog=$('eventDialog');
  let dialogScrollState=null,dialogTrigger=null;
  function lockDialogScroll(scrollY) {
    if(dialogScrollState)return;
    const elements=[document.documentElement,document.body];
    dialogScrollState={
      scrollY,
      overflowY:elements.map(element=>({
        element,
        value:element.style.getPropertyValue('overflow-y'),
        priority:element.style.getPropertyPriority('overflow-y')
      }))
    };
    elements.forEach(element=>element.style.setProperty('overflow-y','hidden'));
  }
  function releaseDialogScroll() {
    if(!dialogScrollState)return;
    const state=dialogScrollState;dialogScrollState=null;
    state.overflowY.forEach(({element,value,priority})=>{
      if(value)element.style.setProperty('overflow-y',value,priority);
      else element.style.removeProperty('overflow-y');
    });
    if(Math.abs(window.scrollY-state.scrollY)>1)window.scrollTo({top:state.scrollY,behavior:'instant'});
  }
  detailDialog.addEventListener('close',()=>{
    releaseDialogScroll();
    const usable=element=>element?.isConnected&&!element.closest('[inert]')&&element.getClientRects().length>0;
    const focus=usable(dialogTrigger)?dialogTrigger:reducedState?cards[activeIndex]?.face:$('eventRead');
    dialogTrigger=null;
    const target=usable(focus)?focus:$('readingTitle');
    if(usable(target)&&document.activeElement!==target)target.focus({preventScroll:true});
  });
  function readEvent(index=activeIndex) {
    if(reducedState)setActive(clamp(index,0,count-1),false);
    const event=events[clamp(index,0,count-1)];
    $('dialogEra').textContent=event.era;$('dialogYear').textContent=event.year;
    $('dialogTitle').textContent=event.title;$('dialogText').textContent=event.detail;
    $('dialogArtwork').src=event.year===618 ? '../images/history/imperial-618-detail.png' : artFor(event);
    const dialogScrollY=window.scrollY;dialogTrigger=document.activeElement;detailDialog.showModal();lockDialogScroll(dialogScrollY);
  }
  $('eventRead').addEventListener('click',()=>readEvent());
  $('eventDialog').querySelector('.dialog-close').addEventListener('click',()=>$('eventDialog').close());
  $('eventDialog').addEventListener('click',event=>{
    if(event.target!==$('eventDialog'))return;
    const rect=event.target.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();
  });
  function setActive(index,animate=true) {
    if(activeIndex===index)return;
    if(ghost){ghost.remove();ghost=null;}if(copyAnimation)copyAnimation.cancel();
    if(animate&&activeIndex>=0&&exitProgress<.01&&!reducedState){
      ghost=info.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('aria-live');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
      ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));ghost.classList.add('copy-ghost');stage.append(ghost);
      const old=ghost;old.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],{duration:160,easing:'ease-out'}).onfinish=()=>{old.remove();if(ghost===old)ghost=null;};
      copyAnimation=info.animate([{opacity:0,transform:'translateY(10px)'},{opacity:0,transform:'translateY(10px)',offset:.2},{opacity:1,transform:'translateY(0)'}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)'});
    }
    activeIndex=index;const event=events[index];
    stage.style.setProperty('--chapter-art', 'url("' + artFor(event) + '")');
    $('eventEra').textContent=`大唐纪年 · ${String(index+1).padStart(2,'0')}`;
    $('eventEra').title=event.era;$('eventYear').textContent=event.year;$('eventTitle').textContent=event.title;
    $('eventDescription').textContent=event.description;$('sceneLabel').textContent=event.label;
    $('eventCount').textContent=String(index+1).padStart(2,'0');
    cards.forEach((card,i)=>{const chosen=i===index;card.el.classList.toggle('is-active',chosen);card.el.inert=!chosen&&!reducedState;card.face.tabIndex=chosen||reducedState?0:-1;});
    rail.forEach((button,i)=>{button.classList.toggle('is-active',i===index);button.classList.toggle('is-neighbor',Math.abs(i-index)===1);if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  }
  function goTo(index) {
    syncReducedMotion();
    if(reducedState){setActive(index,false);cards[index].el.scrollIntoView({block:'center',behavior:'instant'});return;}
    // Rail is auxiliary navigation. Updating actual scroll keeps the next wheel input continuous.
    resetSnapOffset();
    window.scrollTo({top:metrics.scrollStart+index*metrics.scrollPerNode,behavior:'smooth'});
  }
  function resetSnapOffset(){resumeOffset=0;snapping=false;clearTimeout(snapTimer);}
  $('jumpCity').addEventListener('click',()=>{resetSnapOffset();window.scrollTo({top:metrics.scrollStart+metrics.cityEnd,behavior:'smooth'});});
  const readingSkipLink=document.querySelector('a[href="#chronicleList"]');
  if(readingSkipLink)readingSkipLink.addEventListener('click',()=>{$('readingDetails').open=true;});

  function resize(preservePosition=false) {
    // All timeline segments scale with vh. Preserve the last processed scroll
    // position across viewport changes, including hold and the city transition.
    const progress=preservePosition&&metrics.travel&&!reducedState&&!reduce.matches
      &&lastY>=metrics.scrollStart-1&&lastY<=metrics.scrollStart+metrics.travel+1
      ? distance/metrics.travel : null;
    const navbarHeight=hostContract.getStableTopInset();
    if (!Number.isFinite(navbarHeight) || navbarHeight<0) {
      console.error('HistoryRing: stable top inset is unavailable; resize skipped.');
      return;
    }
    root.style.setProperty('--history-nav-height',`${navbarHeight}px`);
    const vh=innerHeight, scale=clamp(.82+(innerWidth-1366)/554*.18,.82,1.10);
    radius=680*scale;pitch=330*scale;perspective=1800*scale;
    root.style.setProperty('--ring-radius',`${radius}px`);root.style.setProperty('--ring-perspective',`${perspective}px`);
    root.style.setProperty('--card-width',`${540*scale}px`);root.style.setProperty('--card-height',`${304*scale}px`);
    root.style.setProperty('--helix-pitch',`${pitch}px`);
    cards.forEach((card,i)=>{card.el.dataset.worldY=String(i*pitch);});
    const scrollPerNode=vh*config.scrollPerNodeVh, rotationDistance=(count-1)*scrollPerNode;
    const holdEnd=rotationDistance+vh*config.holdVh, cityEnd=holdEnd+vh*config.transitionVh;
    const exitEnd=holdEnd+vh*config.transitionVh*.78,cityRevealStart=holdEnd+vh*config.transitionVh*.16;
    const travel=cityEnd+vh*config.endHoldVh, stageHeight=vh;
    root.style.height=`${travel+stageHeight}px`;
    metrics={scrollStart:root.getBoundingClientRect().top+scrollY,scrollPerNode,rotationDistance,holdEnd,exitEnd,cityRevealStart,cityEnd,travel,stageHeight,sectionHeight:travel+stageHeight,navbarHeight};
    cityView?.resize();lastHandoff=lastCity=-1;
    if(progress!==null){
      window.scrollTo({top:metrics.scrollStart+progress*metrics.travel,behavior:'instant'});
      resizeScrollY=lastY=scrollY;lastScroll=performance.now();
      distance=clamp(lastY-metrics.scrollStart,0,metrics.travel);rawIndex=indexFromDistance(distance);
      // Closing a modal must restore its resized semantic location, not old pixels.
      if(dialogScrollState)dialogScrollState.scrollY=lastY;
    }else readScroll(false);
    queue();
  }
  function indexFromDistance(value) {return clamp(value/metrics.scrollPerNode,0,count-1);}
  function easeIndex(index) {const base=Math.floor(index), fraction=index-base;return base+fraction*.6+smooth(fraction)*.4;}
  function readScroll(trackVelocity=true) {
    syncReducedMotion();
    if(reducedState||disposed)return;
    const now=performance.now(), y=scrollY;
    // The corrective resize scroll is not a new wheel gesture or snap request.
    if(trackVelocity&&y===resizeScrollY){resizeScrollY=null;return;}
    resizeScrollY=null;
    if(trackVelocity&&snapping&&y!==lastY){
      // Resume from the angle the user actually sees. Release its offset over
      // the next node, so a small upward wheel cannot first turn the ring forward.
      resumeOrigin=rawIndex;resumeOffset=current-easeIndex(rawIndex);
      resumeSpan=Math.max(1,Math.abs(resumeOffset)*2);
    }else if(!trackVelocity)resumeOffset=0;
    if(trackVelocity){const instantaneous=(y-lastY)/Math.max(8,now-lastScroll);velocity=velocity*.55+instantaneous*.45;}
    lastY=y;lastScroll=now;distance=clamp(y-metrics.scrollStart,0,metrics.travel);rawIndex=indexFromDistance(distance);
    if(rawIndex===0||rawIndex===count-1)resumeOffset=0;
    snapping=false;target=clamp(easeIndex(rawIndex)+resumeOffset*clamp(1-Math.abs(rawIndex-resumeOrigin)/resumeSpan),0,count-1);
    clearTimeout(snapTimer);
    snapTimer=setTimeout(()=>{snapping=true;target=Math.round(rawIndex);velocity=0;queue();},config.snapDelay);
    queue();
  }
  function drawRing() {
    const rotation=-current*step;
    ring.style.transform=`translateZ(${-radius}px) translateY(${-current*pitch}px) rotateY(${rotation.toFixed(5)}deg)`;
    let nearest=0,minDistance=Infinity;
    for(const card of cards){
      const index=Number(card.el.dataset.index),a=(card.baseAngle+rotation)*Math.PI/180;
      const spatialDistance=(Math.sin(a)*radius)**2+((index-current)*pitch)**2+((Math.cos(a)-1)*radius)**2;
      if(spatialDistance<minDistance){minDistance=spatialDistance;nearest=index;}
    }
    setActive(nearest);
    for(const card of cards){
      const index=Number(card.el.dataset.index),separation=Math.abs(index-current),active=index===nearest;
      card.el.classList.toggle('is-back-facing',Math.abs(wrap(card.baseAngle+rotation))>90);
      const opacity=active?1:separation<=1?.72:separation<=2?.72-(separation-1)*.38:Math.max(.045,.34-(separation-2)*.19);
      const brightness=active?1:clamp(.96-separation*.095,.48,.96),saturation=active?1:clamp(.87-separation*.10,.38,.87);
      const scale=active?1:clamp(1-separation*.085,.65,1);
      card.el.style.transform=`translateY(${index*pitch}px) rotateY(${card.baseAngle}deg) translateZ(${radius}px) scale(${scale.toFixed(4)})`;
      card.el.style.opacity=opacity.toFixed(3);card.el.style.filter=`brightness(${brightness.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
    }
  }
  function blend(value,target,amount){const next=value+(target-value)*amount;return Math.abs(next-target)<.0001?target:next;}
  function updateEnding() {
    if(handoffProgress!==lastHandoff){
      // Continue the downward journey: cards rise away while the city is revealed below.
      exitLayer.style.opacity=(1-exitProgress).toFixed(4);
      exitLayer.style.transform=`translateY(${-innerHeight*.36*handoffProgress}px) scale(${1-.10*handoffProgress})`;
      exitLayer.inert=handoffProgress>.2;
      const oldCopy=1-smooth(handoffProgress/.40),newCopy=smooth((handoffProgress-.36)/.42);
      masthead.style.opacity=String(oldCopy);info.style.opacity=String(oldCopy);info.inert=oldCopy<.2;
      document.querySelector('.scene-label').style.opacity=String(oldCopy);
      const caption=$('cityCaption');caption.style.opacity=String(newCopy);caption.style.transform=`translateY(${(1-newCopy)*18}px)`;
      const shown=handoffProgress>.36;stage.classList.toggle('is-city',shown);caption.inert=newCopy<.6;
      $('jumpCity').setAttribute('aria-current',shown?'true':'false');
      lastHandoff=handoffProgress;
    }
    if(cityProgress!==lastCity){
      host.style.opacity=cityView?.available===false?cityProgress.toFixed(4):'1';host.style.transform='none';
      lastCity=cityProgress;
    }
    const hint=cityProgress>.10?'继续向下 · 走进瑰宝重器':distance>=metrics.rotationDistance?'907 · 继续滚动，回望长安':'向下滚动 · 沿纪年盘旋而下';
    if(hint!==lastHint){$('scrollHint').textContent=hint;lastHint=hint;}
    const p=clamp(distance/metrics.travel);if(p!==lastProgress){$('chronicleProgress').style.transform=`scaleX(${p})`;lastProgress=p;}
  }
  function animate(now) {
    frame=0;syncReducedMotion();if(disposed||reducedState||!visible||document.hidden)return;
    const elapsed=lastFrame?now-lastFrame:16.667, dt=Math.min(64,elapsed);lastFrame=now;frames++;
    if(elapsed<250){samples.push(elapsed);if(samples.length>240)samples.shift();}
    const smoothing=Math.abs(velocity)>2.5?config.fastSmoothing:config.smoothing;
    const mix=1-Math.pow(1-smoothing,dt/16.667);
    const previous=current;current=blend(current,target,mix);
    if(previous!==current||frames===1||lastHandoff<0)drawRing();
    const atLast=Math.abs(current-(count-1))<.0006;
    if(atLast&&!atLastSince)atLastSince=now;else if(!atLast)atLastSince=0;
    const desiredHandoff=clamp((distance-metrics.holdEnd)/(metrics.cityEnd-metrics.holdEnd));
    const settled=atLast&&now-atLastSince>=160;
    const handoffTarget=settled?desiredHandoff:0;
    handoffProgress=blend(handoffProgress,handoffTarget,mix);
    // Overlapping fades share one reversible progress value; there is no empty gap.
    exitProgress=smooth(handoffProgress/.78);
    cityProgress=smooth((handoffProgress-.16)/.84);
    updateEnding();
    const moving=Math.abs(current-target)>.0001||Math.abs(handoffProgress-handoffTarget)>.0001||desiredHandoff>0&&!settled;
    cityView ||= window.createHistoryCityView?.(host);
    // One RAF drives everything. Slow ambient movement renders at 30fps when idle.
    if(moving||now-lastEffectsFrame>=32||!lastEffectsFrame){
      cityView?.renderEnvironment?.(current,exitProgress,cityProgress,now/1000);lastEffectsFrame=now;
      if(!cityView?.available){host.classList.add('city-unavailable');host.style.opacity=String(cityProgress);}
    }
    if(moving||cityView?.available)queue();
  }
  function queue(){syncReducedMotion();if(!frame&&!disposed&&!reducedState&&visible&&!document.hidden)frame=requestAnimationFrame(animate);}
  function syncReducedMotion() {
    if(disposed||reducedState===reduce.matches)return;
    reducedState=reduce.matches;
    setReduced();
  }
  function setReduced() {
    document.body.classList.toggle('is-reduced',reducedState);
    stage.classList.toggle('is-effects-paused',reducedState||!visible||document.hidden);
    if(reducedState){
      if(frame)cancelAnimationFrame(frame);frame=0;clearTimeout(snapTimer);copyAnimation?.cancel();ghost?.remove();ghost=null;
      cards.forEach(card=>{card.el.inert=false;card.face.tabIndex=0;});
      exitLayer.inert=false;$('cityCaption').inert=false;stage.classList.remove('is-city');$('readingDetails').open=true;
      // Reading order is title, all historical cards, then the Chang'an conclusion.
      stage.insertBefore(masthead,exitLayer);masthead.style.removeProperty('opacity');host.style.removeProperty('transform');
      $('cityCaption').style.removeProperty('opacity');$('cityCaption').style.removeProperty('transform');
    }else{
      if(masthead.nextSibling!==mastheadHome)stage.insertBefore(masthead,mastheadHome);
      activeIndex=-1;lastFrame=0;resize();current=target;setActive(Math.round(current),false);drawRing();queue();
    }
    $('renderStatus').hidden=true;
  }
  window.addEventListener('scroll',()=>readScroll(),{passive:true});
  window.addEventListener('resize',()=>resize(true),{passive:true});
  const observer=new IntersectionObserver(entries=>{syncReducedMotion();visible=entries[0].isIntersecting;stage.classList.toggle('is-effects-paused',!visible||reducedState||document.hidden);if(visible){lastFrame=0;readScroll(false);}else{if(frame)cancelAnimationFrame(frame);frame=0;}},{threshold:0});observer.observe(root);
  document.addEventListener('visibilitychange',()=>{syncReducedMotion();stage.classList.toggle('is-effects-paused',document.hidden||!visible||reducedState);if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else{lastFrame=0;queue();}});
  reduce.addEventListener('change',syncReducedMotion);
  window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;reduce.removeEventListener('change',syncReducedMotion);clearTimeout(snapTimer);if(frame)cancelAnimationFrame(frame);observer.disconnect();cityView?.dispose();});
  window.HistoryRingDebug=Object.freeze({snapshot:()=>({
    layout:'helix',count,radius,pitch,angleStep:step,perspective,cameraDescent:current*pitch,totalDescent:(count-1)*pitch,sectionHeight:metrics.sectionHeight,scrollStart:metrics.scrollStart,
    scrollPerNode:metrics.scrollPerNode,rotationDistance:metrics.rotationDistance,rotationEndProgress:metrics.rotationDistance/metrics.travel,
    holdEndProgress:metrics.holdEnd/metrics.travel,exitEndProgress:metrics.exitEnd/metrics.travel,cityEndProgress:metrics.cityEnd/metrics.travel,
    holdEnd:metrics.holdEnd,exitEnd:metrics.exitEnd,cityRevealStart:metrics.cityRevealStart,transitionStart:metrics.holdEnd,transitionEnd:metrics.cityEnd,cityEnd:metrics.cityEnd,travel:metrics.travel,
    smoothing:config.smoothing,fastSmoothing:config.fastSmoothing,snapDelay:config.snapDelay,snapping,velocity,rawIndex,currentIndex:current,targetIndex:target,
    rotation:-current*step,activeIndex,activeYear:events[activeIndex]?.year,handoffProgress,exitProgress,cityProgress,ringOpacity:1-exitProgress,cityOpacity:cityProgress,progress:distance/metrics.travel,
    phase:cityProgress>0?'city':exitProgress>0?'exit':distance>=metrics.rotationDistance?'hold':'ring',frames,
    effects:cityView?.effectsInfo||null,
    recentFrameMs:samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:null
  })});
  resize();current=target;setActive(Math.round(current),false);drawRing();updateEnding();setReduced();
  if(location.hash==='#chronicleList')$('readingDetails').open=true;
})();
