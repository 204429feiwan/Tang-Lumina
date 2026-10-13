/* R7: exhibition navigation and continuity only. Drawing stays in the R5/R6 engines. */
(() => {
  'use strict';
  const root=document.getElementById('acv5Gallery');
  const panel=root?.querySelector('#acv5-panel-carriers');
  if(!panel)return;
  const stage=panel.querySelector('#acv3-material-stage');
  const works={manuscript:panel.querySelector('[data-writing-workbench]'),rubbing:panel.querySelector('[data-rubbing-workbench]'),print:panel.querySelector('[data-print-workbench]')};
  const tabs=[...panel.querySelectorAll('[data-acv5-carrier]')];
  const completion=panel.querySelector('[data-triad-completion]'),message=panel.querySelector('[data-triad-message]');
  const pending=panel.querySelector('[data-triad-pending]'),next=panel.querySelector('[data-triad-next]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const copy={manuscript:['一笔落纸，墨迹由此留存。','继续探索 · 墨拓留痕 →','rubbing'],rubbing:['墨痕渐显，石上文字得以流传。','继续探索 · 覆纸印经 →','print'],print:['一版成形，文字与图像得以复制。','重访纸墨 · 执笔留墨 →','manuscript']};
  let arrival=null,lastCompletion='';
  function reflect(){
    const key=stage.dataset.carrier,done=works[key].dataset.state==='complete';
    Object.entries(works).forEach(([name,work])=>{work.inert=name!==key||panel.hidden;});
    tabs.forEach(tab=>{
      const state=works[tab.dataset.acv5Carrier].dataset.state;
      tab.dataset.progress=state==='complete'?'complete':state==='idle'?'idle':'working';
      tab.querySelector('em').textContent=state==='complete'?'已留痕 · 可重访 ↗':state==='idle'?({manuscript:'落笔体验 ↗',rubbing:'拓墨体验 ↗',print:'印经体验 ↗'}[tab.dataset.acv5Carrier]):'已暂存 · 继续 ↗';
    });
    const paper=panel.querySelector('[data-print-paper]');
    paper.inert=['revealing','complete'].includes(works.print.dataset.state);
    // Reserve the guide's space; completion never moves the stage or the page.
    completion.hidden=!done;pending.hidden=done;
    if(done){
      const text=copy[key];next.textContent=text[1];next.dataset.next=text[2];
      if(lastCompletion!==key){message.textContent=text[0];lastCompletion=key;}
    }else lastCompletion='';
  }
  function change(){
    reflect();
    arrival?.cancel();arrival=null;
    if(!panel.hidden&&!reduced.matches){
      arrival=works[stage.dataset.carrier].animate([{opacity:.25,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
    }
  }
  next.addEventListener('click',()=>{
    const tab=tabs.find(tab=>tab.dataset.acv5Carrier===next.dataset.next);
    tab.click();tab.focus({preventScroll:true});
  });
  root.addEventListener('acv5:carrierchange',change);
  root.addEventListener('acv5:topicchange',reflect);
  const observer=new MutationObserver(reflect);
  Object.values(works).forEach(work=>observer.observe(work,{attributes:true,attributeFilter:['data-state']}));
  // R5/R6 lifecycle handlers own pointer release and frame cancellation.
  // Navigation adds no scroll controller or extra drawing loop.
  reduced.addEventListener('change',()=>{if(reduced.matches){arrival?.cancel();arrival=null;}});
  reflect();
})();
