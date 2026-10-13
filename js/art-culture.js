/* ART-V5-R8. Three independent chapters; R5/R6/R7 paper engines remain unchanged.
 * Original Pointer Events / CSS transforms and short mask transitions.
 * No library/demo code or images from technical reference repositories are included. */
(() => {
  'use strict';
  const root=document.getElementById('acv5Gallery');
  if(!root)return;
  const asset='../images/art-culture/',npm='https://digitalarchive.npm.gov.tw/Collection/Detail/',cc='https://creativecommons.org/licenses/by/4.0/';
  const q=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
  const write=(selector,text)=>{const el=q(selector);if(el)el.textContent=text;};
  const announce=text=>write('.acv3-live',text);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function tabs(selector,activate){
    const buttons=all(selector);
    const select=button=>{buttons.forEach(item=>{item.setAttribute('aria-selected',String(item===button));item.tabIndex=item===button?0:-1;});activate(button);};
    buttons.forEach((button,index)=>{
      button.addEventListener('click',()=>select(button));
      button.addEventListener('keydown',event=>{
        const next={ArrowRight:(index+1)%buttons.length,ArrowLeft:(index+buttons.length-1)%buttons.length,Home:0,End:buttons.length-1}[event.key];
        if(next===undefined)return;event.preventDefault();select(buttons[next]);buttons[next].focus({preventScroll:true});
      });
    });
  }
  const artists = {
    sun: {file:'sun-shupu-1.webp',detail:'sun-shupu-2.webp',work:'孙过庭《书谱》· 卷首局部',caption:'唐 · 687年墨迹｜国立故宫博物院，台北 · CC BY 4.0',title:'孙过庭 · 书与书论相生',copy:'《书谱》写于垂拱三年（687），既是草书墨迹，也是书学论述。它将学习、临摹与用笔的经验，落实在一卷流动的笔迹之中。',version:'所示为唐代墨迹的馆藏数字图像；笔迹叠片为同卷局部，不是后世临摹。',url:npm+'14900?dep=P',cuts:['点画 · 提按','使转 · 连绵','行气 · 疏密'],short:'《书谱》墨迹局部'},
    ou: {file:'ouyang-jiucheng.webp',detail:'ouyang-jiucheng.webp',work:'欧阳询《九成宫醴泉铭》· 宋拓本',caption:'唐人楷书 · 宋代拓本局部｜国立故宫博物院，台北 · CC BY 4.0',title:'欧阳询 · 从碑拓看楷法',copy:'《九成宫醴泉铭》由魏征撰文、欧阳询书写。细看点画的转折、字内的空间与行列安排，可以观察唐代楷书的法度。',version:'馆藏定名为“宋拓本”。这里看到的是唐人碑铭的后世传本，不能标作唐代纸本墨迹。',url:npm+'20595?dep=P',cuts:['点画 · 转折','结体 · 空间','章法 · 行列'],short:'《九成宫醴泉铭》宋拓局部'},
    yan: {file:'yan-jizhi.webp',detail:'yan-jizhi.webp',work:'颜真卿《祭侄文稿》· 本幅局部',caption:'唐 · 758年墨迹｜国立故宫博物院，台北 · CC BY 4.0',title:'颜真卿 · 行书中的书写痕迹',copy:'《祭侄文稿》作于乾元元年（758）。墨色的浓淡干湿、笔势的变化与增删涂改，使这份祭文留下了书写过程的痕迹，也展现颜真卿宽博沉稳的笔法。',version:'所示为唐代文稿墨迹的馆藏数字图像；本幅选片不包括后世题跋。',url:npm+'3?dep=P',cuts:['墨色 · 浓淡','笔势 · 使转','文稿 · 涂改'],short:'《祭侄文稿》本幅局部'},
    liu: {file:'liu-xuanmi.webp',detail:'liu-xuanmi.webp',work:'柳公权《玄秘塔碑铭》· 小楷墨拓本',caption:'唐人书迹 · 后世拓本局部｜国立故宫博物院，台北 · CC BY 4.0',title:'柳公权 · 楷书点画与结体',copy:'《玄秘塔碑》是柳公权书法的代表作品之一。由碑拓观察楷书的点画、字形与行列，感受书写法度如何通过镌刻与传拓保存下来。',version:'此图据馆藏“小楷书玄秘塔碑铭墨拓本”；具体拓制年未注明。原碑立于841年，不等于该册拓本的制作年代。',url:npm+'29090?dep=P',cuts:['笔画 · 起收','字形 · 结构','碑文 · 行列'],short:'《玄秘塔碑铭》小楷拓本局部'}
  };
  const carriers={
    print:['雕版 / 复数传播','868 · 刊印的纪年','这卷《金刚经》有咸通九年（868）的刊印题记，是现存有明确纪年的早期印本。卷首图像与经文以雕版印制，说明文字与图像已经能够共同复制传播。','此处展示卷首版画；868年纪年见卷末题记。它不是“印刷术发明于868年”的证据。','https://commons.wikimedia.org/wiki/File:Diamond_sutra.jpg','咸通九年','868'],
    manuscript:['抄写 / 留存的笔迹','写本 · 一笔一画的文献','唐代书写以手抄方式保存大量文字，687年的《书谱》就是可确知年代的墨迹。敦煌文献还保存了经卷等不同种类的写本，可由笔迹、纸张与行格观察抄写形式。','主图为敦煌《法华经》残卷 Or.8210/S.970，具体抄写年未定；不可仅凭发现地就认定为某一唐代年份。','https://commons.wikimedia.org/wiki/File:Lotus_Sutra_Or.8210_S.970.jpg','手写原件','写本'],
    rubbing:['镌刻 / 传拓的文字','碑拓 · 从石上文字到纸上墨痕','书迹刻入碑石后，可用传拓方式转到纸上。碑上的文字、拓本制作的年代与今天的数字图像，是三个不同层次，须分别辨认。','主图为《九成宫醴泉铭》宋拓本。它保存唐人书迹，却不是唐代墨迹原件；所示亦非当代临写复制品。',npm+'20595?dep=P','唐人书迹','宋拓']
  };

  const briefs = {
    sun:'草书墨迹与书学论述，汇在同一卷笔势之中。',
    ou:'由宋拓传本，观察唐人楷书点画与字内空间。',
    yan:'浓淡、使转与涂改，留下行书正在发生的痕迹。',
    liu:'从后世墨拓本，细看唐人书迹的起收与结体。'
  };
  const material = {
    print:{file:'diamond-868.webp',work:'868年《金刚经》卷首版画',brief:'雕版线条将图像与经文带入可复制的卷面。',credit:'唐代雕版印本 · 原件数字图像｜British Library / IDP · Public Domain',word:'印',imprint:'咸通九年 · 868\n图像与文字，共入卷面',looks:['雕版线条','纸面与墨色'],points:[[.47,.34],[.28,.68]],notes:['卷首版画局部 · 观察刻线与图像的组织。','同一卷首局部 · 观察纸面与印刷墨色。'],note:'纪年见卷末题记；此处所示为卷首图像。'},
    manuscript:{file:'dunhuang-manuscript.webp',work:'敦煌《法华经》残卷 · Or.8210/S.970',brief:'行格、笔迹与纸面，留存一笔一画的抄写。',credit:'写本文献原件 · 具体抄写年未定｜British Library / IDP · CC BY 4.0',word:'写',imprint:'敦煌写本文献\n具体抄写年未定',looks:['手写笔迹','纸面与行格'],points:[[.52,.51],[.26,.37]],notes:['写本原图局部 · 观察手写笔迹。','同一残卷局部 · 观察纸面、行格与文字的关系。'],note:'发现地与数字化年份，均不能代替写本制作年代。'},
    rubbing:{file:'ouyang-jiucheng.webp',work:'《九成宫醴泉铭》· 宋拓本局部',brief:'石上书迹，经传拓留在纸上的明暗之间。',credit:'唐人碑铭 · 宋代拓本｜国立故宫博物院，台北 · CC BY 4.0',word:'拓',imprint:'唐人书迹 · 宋拓\n镌刻与传拓之间',looks:['拓印字形','墨底与纸纹'],points:[[.42,.42],[.71,.62]],notes:['宋拓原图局部 · 观察字形与拓印轮廓。','同一拓本局部 · 观察墨底与纸面的明暗。'],note:'碑铭年代、拓本年代与数字图像，应分别辨认。'}
  };

  const proseSource='https://zh.wikisource.org/wiki/師說',liuSource='https://zh.wikisource.org/wiki/答韋中立論師道書';
  const prose = {nodes:['立意','从师','明道','为文'],links:[['《师说》原文',proseSource],['《答韦中立论师道书》原文',liuSource]],steps:[
      ['由“为文”走向“立意”','韩愈、柳宗元提倡古文，重视文章的思想内容与表达。这里从两篇论说入手，观察其主张，不把“古文”理解为单纯模仿古人的辞句。','韩愈《师说》 · 原文节选','师者，所以传道受业解惑也。'],
      ['韩愈 · 从师与问学','《师说》讨论从师的意义，强调学习与解惑。文章以论说展开主张，让教育问题进入有力的思想表达。','韩愈《师说》 · 原文节选','道之所存，师之所存也。'],
      ['柳宗元 · 文者以明道','《答韦中立论师道书》谈及从师与为文。柳宗元回顾自己由重辞采转向重道理的认识，说明文章不只在辞句华美。','柳宗元《答韦中立论师道书》 · 原文节选','及长乃知文者以明道。'],
      ['古文 · 论说之外的表达','唐代古文也包括书信、记、传等多样写作。由论说转向传奇，人物、情节与叙事视角又为文章带来新的创造。','释读提示 · 非古籍引文','从思想的表达，走向故事的创造。']
    ]};

  const longgongSource='https://www.dpm.org.cn/collection/paint/228984.html';
  const longgongImage='https://commons.wikimedia.org/wiki/File:朱玉龙宫水府图页.jpg';
  const palaceSource='https://www.metmuseum.org/art/collection/search/49227';
  const palaceImage='https://commons.wikimedia.org/wiki/File:Yuan_Jiang-the_palace_of_nine_perfections.jpg';
  const pd='https://creativecommons.org/publicdomain/mark/1.0/';
  const stories={
    letter:{name:'柳毅传',author:'李朝威 · 唐传奇',deck:'一封书信，越过人世与水府。',nodes:['画幅全景','相揖人物','水府波纹'],
      sourceTitle:'元代朱玉《龙宫水府图》页',sourceCredit:'元代 · 绢本设色｜故宫博物院藏 · 新00147429-12/12｜Commons PD-Art / Public Domain',
      sourceCopy:'李朝威的唐传奇写柳毅为受虐龙女传书，赴洞庭告知龙君。元代朱玉选择柳毅下马揖见、龙王率众出迎的一瞬，将唐人的文字化成后世的绘画。',
      sourceVersion:'所用数字图像取右幅绘画，缩放并压缩为 WebP；镜头仅放大同一画幅，不补绘人物、不改变原作内容。相揖与水府是画中细节，不能当作三段不同情节。',
      links:[['故宫作品记录',longgongSource],['图像与许可',longgongImage],['李朝威《柳毅传》原文','https://zh.wikisource.org/zh-hant/柳毅傳']],
      steps:[
        {file:'zhu-yu-longgong.webp',fit:'contain',zoom:1,x:.5,y:.5,type:'元代后世绘画 · 画幅全景',credit:'朱玉《龙宫水府图》页 · 故宫博物院藏',note:'三个镜头均来自同一画幅，不是三段独立情节。',title:'唐传奇，在元人笔下',copy:'柳毅应龙女之请，千里传书至洞庭。元代画家将叙事凝为相见的一瞬：来客下马揖见，龙王率众出迎。画与文字，隔着朝代遥相呼应。',label:'画意释读 · 非古籍引文',excerpt:'以一瞬相揖，写千里传书。'},
        {file:'zhu-yu-longgong.webp',fit:'contain',zoom:2.05,x:.55,y:.76,type:'元代后世绘画 · 同幅人物局部',credit:'朱玉《龙宫水府图》页 · 相揖人物',note:'这是同一画幅的局部；画家表现柳毅与龙王相见。',title:'在人物之间，读一个“义”字',copy:'揖礼、身姿与侍从的排布，让相见有了仪式感。原著中的传书之义，被画家落在人与龙王的对望之间；它并非柳毅途中遇女或后来的婚姻场景。',label:'画意释读 · 非古籍引文',excerpt:'传奇的奇异，亦关乎人的情义。'},
        {file:'zhu-yu-longgong.webp',fit:'contain',zoom:1.85,x:.54,y:.29,type:'元代后世绘画 · 同幅水府局部',credit:'朱玉《龙宫水府图》页 · 波纹与宫阙',note:'同幅局部聚焦；波涛与建筑属于元代画家的水府想象。',title:'波涛之中，水府有了形貌',copy:'回旋的波纹围合宫阙，将日常礼仪放进神异世界。读者由文字想象龙宫，画家再给想象以形貌。这是后世的艺术创造，不能作唐代建筑或真实地理的复原。',label:'画意释读 · 非古籍引文',excerpt:'水府的形貌，是画家的想象。'}]},
    dream:{name:'枕中记',author:'沈既济 · 唐传奇',deck:'黍未熟，一生荣辱已过。',nodes:['旅舍 · 现实','宫阙 · 入梦','归来 · 梦醒'],
      sourceTitle:'《枕中记》· 现实与梦境的两重时间',sourceCredit:'唐代文学原典｜旅舍：现代 AI 艺术演绎｜宫苑：清袁江《九成宫图屏》，1691',
      sourceCopy:'旅舍静物为本项目新作：纸墨、黄粱意象与青瓷枕构成安静的现实空间。梦境借用袁江《九成宫图屏》的宫苑层次；这幅清代作品并非《枕中记》插图，也不是唐宫考据复原。',
      sourceVersion:'现实与梦醒共用同一现代 AI 原创静物，并以光影叠层区分气氛。古画保留十二屏拼接痕迹，仅作 WebP 压缩与视窗裁切。原文写“黍”；“黄粱一梦”为后世典故通称。现代场景不是历史原件。',
      links:[['沈既济《枕中记》原文','https://zh.wikisource.org/zh-hans/枕中记'],['袁江作品 · Met',palaceSource],['宫苑图像与许可',palaceImage],['Met 开放获取政策','https://www.metmuseum.org/hubs/open-access']],
      steps:[
        {file:'dream-inn-modern.webp',fit:'cover',zoom:1,x:.5,y:.5,type:'现代 AI 艺术演绎 · 现实意象',credit:'本项目原创旅舍静物 · 2026 · imagegen',note:'旅舍、谷物、瓷枕与纸墨为现代构图，非唐代作品或史事复原。',title:'旅舍之中，功名尚在远处',copy:'卢生在邯郸旅舍遇到吕翁，叹息自己的境遇。主人正蒸黍，一只青瓷枕将他带入梦境。纸墨、谷物与斜光，只为呈现故事起点的安静。',label:'《枕中记》 · 原文节选',excerpt:'时主人方蒸黍。'},
        {file:'yuan-jiang-palace.webp',fit:'cover',zoom:1.05,x:.53,y:.5,type:'清代后世绘画 · 梦境联想',credit:'袁江《九成宫图屏》 · 1691 · 大都会艺术博物馆藏',note:'古画视窗局部；用作荣华宫阙的文学联想，非本篇故事插图。',title:'一枕入梦，宫阙层层展开',copy:'梦里，卢生经历婚姻、仕途、荣耀与挫折。袁江笔下层叠的宫苑，借来作为荣华的视觉意象；画中建筑并不对应原著某次升迁，也不证明唐宫真实形制。',label:'情节摘要 · 非古籍引文',excerpt:'一梦之中，历尽荣辱。'},
        {file:'dream-inn-modern.webp',fit:'cover',zoom:1,x:.5,y:.5,type:'现代 AI 艺术演绎 · 梦醒回归',credit:'同一原创旅舍静物 · 现实空间再次呈现',note:'梦醒回到同一现代画面；古画与现代艺术不混称。',title:'梦已远，黍仍未熟',copy:'梦醒时，旅舍仍在，主人所蒸的黍尚未熟。现实中的片刻，容下梦中漫长的一生。相同的纸墨与静物，让两重时间在回归中相照。',label:'《枕中记》 · 原文节选',excerpt:'主人蒸黍未熟。'}]}
  };
  let artist='sun',carrier='manuscript',currentStory='letter',step=0,materialLook=-1;
  let inkZoom=1,inkCenter={x:.5,y:.5},inspect=false,inkDrag=null;
  const inkFrame=q('[data-acv3-ink-window]'),inkPlane=q('[data-acv3-ink-plane]'),inkImage=q('[data-acv3-ink-image]');
  const materialFrame=q('[data-acv3-material-window]'),materialPlane=q('[data-acv3-material-plane]'),materialImage=q('[data-acv3-material-image]');
  const lens=q('[data-acv3-lens]'),lensImage=q('[data-acv3-lens-image]');
  const scene=q('[data-acv3-scene]'),scenePlane=q('[data-acv8-scene-plane]'),sceneStage=q('#acv3-story-stage'),echo=q('[data-acv8-scene-echo]');
  let sceneToken=0,sceneAnimations=[];
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function originalPlane(frame, plane, image, dominance) {
    if (!frame.clientWidth || !image.naturalWidth) return null;
    const w=frame.clientWidth, h=frame.clientHeight;
    const fit=Math.min(w/image.naturalWidth, h/image.naturalHeight)*dominance;
    const pw=image.naturalWidth*fit, ph=image.naturalHeight*fit;
    plane.style.width=pw+'px'; plane.style.height=ph+'px';
    return {w,h,pw,ph};
  }
  function renderMaterial() {
    const size=originalPlane(materialFrame,materialPlane,materialImage,.97);
    if (!size) return;
    const {w,h,pw,ph}=size;
    materialPlane.style.transformOrigin='50% 50%';
    materialPlane.style.transform=`translate(${(w-pw)/2}px,${(h-ph)/2}px)`;
    if (materialLook<0) { lens.hidden=true; return; }
    lens.hidden=false;
    const [x,y]=material[carrier].points[materialLook], zoom=2.8;
    const lw=lens.clientWidth, lh=lens.clientHeight;
    lensImage.style.width=(pw*zoom)+'px'; lensImage.style.height=(ph*zoom)+'px';
    lensImage.style.left=(lw/2-pw*zoom*x)+'px'; lensImage.style.top=(lh/2-ph*zoom*y)+'px';
  }

  function place(plane,w,h,pw,ph,zoom,center){
    const sw=pw*zoom,sh=ph*zoom;
    const x=sw<=w?(w-sw)/2:clamp(w/2-sw*center.x,w-sw,0);
    const y=sh<=h?(h-sh)/2:clamp(h/2-sh*center.y,h-sh,0);
    plane.style.transformOrigin='0 0';plane.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;
  }
  function inkControls(){
    inkFrame.dataset.zoom=inkZoom.toFixed(1);inkFrame.dataset.inspect=String(inspect);
    q('[data-acv8-inspect]').setAttribute('aria-pressed',String(inspect));
    write('[data-acv8-zoom-label]',inkZoom.toFixed(1)+'×');
    q('[data-acv8-zoom=in]').disabled=inkZoom>=4;q('[data-acv8-zoom=out]').disabled=inkZoom<=1;
    inkFrame.style.touchAction=inkZoom>1?'none':'pan-y';
  }
  function renderInk(){const size=originalPlane(inkFrame,inkPlane,inkImage,.98);if(size)place(inkPlane,size.w,size.h,size.pw,size.ph,inkZoom,inkCenter);inkControls();}
  function releaseInk(){const id=inkDrag?.id;inkDrag=null;if(id!==undefined&&inkFrame.hasPointerCapture(id))inkFrame.releasePointerCapture(id);}
  function resetInk(){releaseInk();inkZoom=1;inkCenter={x:.5,y:.5};inspect=false;renderInk();}
  function changeZoom(amount){inkZoom=clamp(inkZoom+amount,1,4);if(inkZoom===1){inspect=false;inkCenter={x:.5,y:.5};}renderInk();announce('墨迹放大 '+inkZoom.toFixed(1)+' 倍');}
  function showArtist(key){
    artist=key;const info=artists[key];resetInk();inkZoom=key==='sun'?1.55:1.25;inkCenter=key==='sun'?{x:.65,y:.42}:{x:.5,y:.5};q('#acv3-ink-stage').dataset.artist=key;
    q('#acv3-ink-stage').setAttribute('aria-labelledby','acv3-artist-'+key);inkImage.src=asset+info.file;inkImage.alt=info.work;
    write('[data-acv3-ink-title]',info.work);write('[data-acv3-ink-brief]',briefs[key]);write('[data-acv3-ink-credit]',info.caption);
    renderInk();write('[data-acv3-look-note]','默认局部放大 · 可还原数字图像全貌；墨迹不作重绘。');updateSource('ink');announce('已选择'+info.work);
  }
  q('[data-acv8-inspect]').addEventListener('click',()=>{inspect=!inspect;inkZoom=inspect?2.4:1;inkCenter={x:.5,y:.5};renderInk();announce(inspect?'局部细读已开启，移动鼠标细看墨迹。':'已还原墨迹全貌。');});
  all('[data-acv8-zoom]').forEach(b=>b.addEventListener('click',()=>changeZoom(b.dataset.acv8Zoom==='in'?.5:-.5)));
  q('[data-acv3-reset=ink]').addEventListener('click',()=>{resetInk();announce('已还原墨迹全貌。');});
  inkFrame.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||inkZoom<=1)return;inspect=false;inkDrag={id:e.pointerId,x:e.clientX,y:e.clientY,center:{...inkCenter}};inkFrame.setPointerCapture(e.pointerId);inkFrame.focus({preventScroll:true});inkControls();e.preventDefault();});
  inkFrame.addEventListener('pointermove',e=>{
    if(inkDrag&&e.pointerId===inkDrag.id){inkCenter.x=clamp(inkDrag.center.x-(e.clientX-inkDrag.x)/(inkPlane.clientWidth*inkZoom),0,1);inkCenter.y=clamp(inkDrag.center.y-(e.clientY-inkDrag.y)/(inkPlane.clientHeight*inkZoom),0,1);}
    else if(inspect&&e.pointerType==='mouse'){const b=inkFrame.getBoundingClientRect();inkCenter={x:clamp((e.clientX-b.left)/b.width,0,1),y:clamp((e.clientY-b.top)/b.height,0,1)};}
    else return;renderInk();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>inkFrame.addEventListener(type,releaseInk));
  inkFrame.addEventListener('keydown',e=>{
    if(['+','=','-','_'].includes(e.key)){e.preventDefault();changeZoom(['+','='].includes(e.key)?.5:-.5);return;}
    if(['Home','Escape'].includes(e.key)){e.preventDefault();resetInk();return;}
    const delta={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,-.05],ArrowDown:[0,.05]}[e.key];
    if(!delta)return;e.preventDefault();inspect=false;inkZoom=Math.max(2,inkZoom);inkCenter.x=clamp(inkCenter.x+delta[0],0,1);inkCenter.y=clamp(inkCenter.y+delta[1],0,1);renderInk();
  });
  window.addEventListener('blur',releaseInk);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInk();});
  function updateSource(kind){
    const section=q('#acv5-panel-'+kind),find=s=>section.querySelector(s),put=(s,t)=>{find(s).textContent=t;};
    let title,credit,copy,version,entries;
    if(kind==='ink'){const a=artists[artist];title=a.title;credit=a.caption;copy=a.copy;version=a.version.replace('笔迹叠片','观察局部');entries=[['作品馆藏记录',a.url],['图像许可 · CC BY 4.0',cc]];}
    else if(kind==='carriers'){const a=carriers[carrier];title=a[1];credit=material[carrier].credit;copy=a[2];version=a[3];entries=[['原件 / 版本资料',a[4]],['图像许可',carrier==='print'?pd:cc]];}
    else{const a=stories[currentStory];title=a.sourceTitle;credit=a.sourceCredit;copy=a.sourceCopy;version=a.sourceVersion;entries=a.links;}
    put('[data-acv3-source-title]',title);put('[data-acv3-source-credit]',credit);put('[data-acv3-source-copy]',copy);put('[data-acv3-source-version]',version);
    const links=find('[data-acv3-source-links]');links.replaceChildren();entries.forEach(([label,url])=>{const a=document.createElement('a');a.textContent=label+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);});
  }
  function cancelScene(){sceneAnimations.forEach(a=>a.cancel());sceneAnimations=[];echo.replaceChildren();}
  function renderScene(){
    if(!scene.naturalWidth||!sceneStage.clientWidth)return;
    const view=stories[currentStory].steps[step],w=sceneStage.clientWidth,h=sceneStage.clientHeight;
    const fit=(view.fit==='contain'?Math.min:Math.max)(w/scene.naturalWidth,h/scene.naturalHeight)*(view.fit==='contain'?.96:1);
    const pw=scene.naturalWidth*fit,ph=scene.naturalHeight*fit;scenePlane.style.width=pw+'px';scenePlane.style.height=ph+'px';place(scenePlane,w,h,pw,ph,view.zoom,view);
  }
  async function showStep(n,animate=true){
    const token=++sceneToken;cancelScene();const previous=scenePlane.cloneNode(true);step=n;
    const info=stories[currentStory],view=info.steps[n];
    all('[data-acv5-step]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===n));b.querySelector('strong').textContent=info.nodes[i];});
    sceneStage.dataset.story=currentStory;sceneStage.dataset.step=n;
    write('[data-acv3-story-count]','镜头 '+String(n+1).padStart(2,'0')+' / 03');
    write('[data-acv3-story-title]',view.title);write('[data-acv3-story-copy]',view.copy);write('[data-acv3-excerpt-label]',view.label);write('[data-acv3-excerpt]',view.excerpt);
    write('[data-acv8-image-type]',view.type);write('[data-acv8-image-credit]',view.credit);write('[data-acv8-image-note]',view.note);
    const preloaded=new Image();preloaded.src=asset+view.file;
    try{await preloaded.decode();}catch{if(token===sceneToken)q('[data-acv8-image-error]').hidden=false;return;}
    if(token!==sceneToken)return;
    q('[data-acv8-image-error]').hidden=true;scene.src=preloaded.src;
    scene.alt=currentStory==='letter'?view.credit+'，同一元代画幅的'+info.nodes[n]:view.credit+'，'+view.type;
    await scene.decode().catch(()=>{});if(token!==sceneToken)return;renderScene();
    if(animate&&!reduced.matches){
      for(let i=0;i<3;i++){
        const band=document.createElement('div');band.className='acv8-echo-band';band.append(previous.cloneNode(true));echo.append(band);
        const top=i*100/3,bottom=(2-i)*100/3;
        const a=band.animate([{clipPath:`inset(${top}% 0 ${bottom}% 0)`},{clipPath:`inset(${top}% 0 ${bottom}% 100%)`}],{duration:540,delay:i*55,easing:'cubic-bezier(.65,0,.25,1)',fill:'both'});
        sceneAnimations.push(a);
      }
      Promise.all(sceneAnimations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(token===sceneToken)cancelScene();});
    }
    announce(info.name+'，'+info.nodes[n]+'。'+view.type);
  }
  function showStory(key,animate=true){
    currentStory=key;sceneStage.setAttribute('aria-labelledby','acv3-story-'+key);
    write('[data-acv3-story-author]',stories[key].author);write('[data-acv3-story-name]',stories[key].name);write('[data-acv8-story-deck]',stories[key].deck);updateSource('literature');showStep(0,animate);
  }
  function showProse(n){const text=prose.steps[n];all('[data-acv3-prose-step]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===n)));write('[data-acv3-prose-title]',text[0]);write('[data-acv3-prose-copy]',text[1]);write('[data-acv3-prose-label]',text[2]);write('[data-acv3-prose-excerpt]',text[3]);}
  function showCarrier(key) {
    const stage=q('#acv3-material-stage');
    if(stage.contains(document.activeElement))q('#acv3-carrier-'+key).focus({preventScroll:true});
    carrier=key; materialLook=-1; const info=material[key];
    q('#acv3-material-stage').dataset.carrier=key;
    q('#acv3-material-stage').setAttribute('aria-labelledby','acv3-carrier-'+key);
    materialImage.src=asset+info.file; materialImage.alt=info.work;
    lensImage.src=asset+info.file; lensImage.alt=info.work+'同一原图局部'; lens.hidden=true;
    write('[data-acv3-material-word]',info.word); write('[data-acv3-material-imprint]',info.imprint);
    write('[data-acv3-material-title]',info.work); write('[data-acv3-material-brief]',info.brief);
    write('[data-acv3-material-credit]',info.credit); write('[data-acv3-material-note]',info.note);
    all('[data-acv3-material-look]').forEach((b,i) => { b.textContent=info.looks[i]; b.setAttribute('aria-pressed','false'); });
    requestAnimationFrame(renderMaterial); updateSource('carriers'); announce('已展示'+info.work);
    root.dispatchEvent(new CustomEvent('acv5:carrierchange', {detail:{carrier:key}}));
  }
  function selectMaterialLook(n) {
    materialLook=n; all('[data-acv3-material-look]').forEach((b,i) => b.setAttribute('aria-pressed',String(i===n)));
    write('[data-acv3-material-note]',material[carrier].notes[n]); renderMaterial();
    announce(material[carrier].looks[n]+'，已显示同一原件局部');
  }

  tabs('[data-acv5-artist]',b=>showArtist(b.dataset.acv5Artist));tabs('[data-acv5-story]',b=>showStory(b.dataset.acv5Story));tabs('[data-acv5-carrier]',b=>showCarrier(b.dataset.acv5Carrier));
  all('[data-acv5-step]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.acv5Step))));
  all('[data-acv3-prose-step]').forEach(b=>b.addEventListener('click',()=>showProse(Number(b.dataset.acv3ProseStep))));
  all('[data-acv3-material-look]').forEach(b=>b.addEventListener('click',()=>selectMaterialLook(Number(b.dataset.acv3MaterialLook))));
  q('[data-acv3-reset=material]').addEventListener('click',()=>showCarrier(carrier));
  inkImage.addEventListener('load',renderInk);materialImage.addEventListener('load',renderMaterial);scene.addEventListener('load',renderScene);
  const ro=new ResizeObserver(()=>{renderInk();renderMaterial();renderScene();});ro.observe(inkFrame);ro.observe(materialFrame);ro.observe(sceneStage);
  reduced.addEventListener('change',()=>{if(reduced.matches)cancelScene();});
  showArtist(artist);showCarrier(carrier);showStory(currentStory,false);showProse(0);
})();
