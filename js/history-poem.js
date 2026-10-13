(function () {
  'use strict';

  /* 檐下余响 · 照搬 屋檐2.html：屋顶布帘 verlet 物理 + 抓取拖拽 + 拨弦发声 + 诗词切换。 */

  /* ---------------- Constants ---------------- */
  var POEMS = {
    '琵琶行': '浔阳江头夜送客枫叶荻花秋瑟瑟主人下马客在船举酒欲饮无管弦醉不成欢惨将别别时茫茫江浸月忽闻水上琵琶声主人忘归客不发寻声暗问弹者谁琵琶声停欲语迟移船相近邀相见添酒回灯重开宴千呼万唤始出来犹抱琵琶半遮面转轴拨弦三两声未成曲调先有情弦弦掩抑声声思似诉平生不得志低眉信手续续弹说尽心中无限事轻拢慢捻抹复挑初为霓裳后六幺大弦嘈嘈如急雨小弦切切如私语嘈嘈切切错杂弹大珠小珠落玉盘间关莺语花底滑幽咽泉流冰下难冰泉冷涩弦凝绝凝绝不通声暂歇别有幽愁暗恨生此时无声胜有声银瓶乍破水浆迸铁骑突出刀枪鸣曲终收拨当心画四弦一声如裂帛东船西舫悄无言唯见江心秋月白沉吟放拨插弦中整顿衣裳起敛容自言本是京城女家在虾蟆陵下住十三学得琵琶成名属教坊第一部曲罢曾教善才服装成每被秋娘妒五陵年少争缠头一曲红绡不知数钿头银篦击节碎血色罗裙翻酒污今年欢笑复明年秋月春风等闲度弟走从军阿姨死暮去朝来颜色故门前冷落鞍马稀老大嫁作商人妇商人重利轻别离前月浮梁买茶去去来江口守空船绕船月明江水寒夜深忽梦少年事梦啼妆泪红阑干我闻琵琶已叹息又闻此语重唧唧同是天涯沦落人相逢何必曾相识我从去年辞帝京谪居卧病浔阳城浔阳地僻无音乐终岁不闻丝竹声住近湓江地低湿黄芦苦竹绕宅生其间旦暮闻何物杜鹃啼血猿哀鸣春江花朝秋月夜往往取酒还独倾岂无山歌与村笛呕哑嘲哳难为听今夜闻君琵琶语如听仙乐耳暂明莫辞更坐弹一曲为君翻作琵琶行感我此言良久立却坐促弦弦转急凄凄不似向前声满座重闻皆掩泣座中泣下谁最多江州司马青衫湿',
    '秦妇吟': '中和癸卯春三月洛阳城外花如雪东西南北路人绝绿杨悄悄香尘灭路旁忽见如花人独向绿杨阴下立凤侧鸾欹鬓脚高红攒黛敛眉心细徘徊扶上黄金勒借问他乡事如何含颦掩泪低声道妾家本住三川侧长大不闻金鼓声自从洛下屯师旅日夜巡兵入村坞匣中长鎖龙泉剑门外胡尘暗天起入门下马若旋风罄室倾囊如卷土家财既尽骨肉离今日残身何处去白头母吟未终声青衫泪落如铅水去年庚子年冬月初五洛阳城外兵戈起黄巾拔剑向天笑黑云压城城欲摧长安城中狐鼠舞洛阳道上豺狼行千村万落生荆杞万户千门成瓦砾昔时繁盛皆埋没举目凄凉无故物内库烧为锦绣灰天街踏尽公卿食路旁老人忆旧事相与感激皆涕零老人言此长叹息妾身幸得全弓衣洛下经过十余年里中豪右如云集一旦贼来皆避地妾身仓惶无生意路傍时复见经过不说兵戈与行役自从大驾去奔甘肃风却入但逢山谷好经过国从淮甸来经岁常苦饥寒逼四面冰霜生白发一身荆棘卧红尘乡园一别已三秋骨肉凋零万事宜万里相逢无一言青衫泪落如铅水',
  '长恨歌': '汉皇重色思倾国御宇多年求不得杨家有女初长成养在深闺人未识天生丽质难自弃一朝选在君王侧回眸一笑百媚生六宫粉黛无颜色春寒赐浴华清池温泉水滑洗凝脂侍儿扶起娇无力始是新承恩泽时云鬓花颜金步摇芙蓉帐暖度春宵春宵苦短日高起从此君王不早朝承欢侍宴无闲暇春从春游夜专夜后宫佳丽三千人三千宠爱在一身金屋妆成娇侍夜玉楼宴罢醉和春姊妹弟兄皆列土可怜光彩生门户遂令天下父母心不重生男重生女骊宫高处入青云仙乐风飘处处闻缓歌慢舞凝丝竹尽日君王看不足渔阳鼙鼓动地来惊破霓裳羽衣曲九重城阙烟尘生千乘万骑西南行翠华摇摇行复止西出都门百余里六军不发无奈何宛转蛾眉马前死花钿委地无人收翠翘金雀玉搔头君王掩面救不得回看血泪相和流黄埃散漫风萧索云栈萦纡登剑阁峨嵋山下少人行旌旗无光日色薄蜀江水碧蜀山青圣主朝朝暮暮情行宫见月伤心色夜雨闻铃肠断声天旋日转回龙驭到此踌躇不能去马嵬坡下泥土中不见玉颜空死处君臣相顾尽沾衣东望都门信马归归来池苑皆依旧太液芙蓉未央柳芙蓉如面柳如眉对此如何不泪垂春风桃李花开日秋雨梧桐叶落时西宫南内多秋草落叶满阶红不扫梨园弟子白发新椒房阿监青娥老夕殿萤飞思悄然孤灯挑尽未成眠迟迟钟鼓初长夜耿耿星河欲曙天鸳鸯瓦冷霜华重翡翠衾寒谁与共悠悠生死别经年魂魄不曾来入梦临邛道士鸿都客能以精诚致魂魄为感君王辗转思遂教方士殷勤觅排空驭气奔如电升天入地求之遍上穷碧落下黄泉两处茫茫皆不见忽闻海上有仙山山在虚无缥渺间楼阁玲珑五云起其中绰约多仙子中有一人字太真雪肤花貌参差是金阙西厢叩玉扃转教小玉报双成闻道汉家天子使九华帐里梦魂惊揽衣推枕起徘徊珠箔银屏迤逦开云鬓半偏新睡觉花冠不整下堂来风吹仙袂飘飖举犹似霓裳羽衣舞玉容寂寞泪阑干梨花一枝春带雨含情凝睇谢君王一别音容两渺茫昭阳殿里恩爱绝蓬莱宫中日月长回头下望人寰处不见长安见尘雾惟将旧物表深情钿合金钗寄将去钗留一股合一扇钗擘黄金合分钿但教心似金钿坚天上人间会相见临别殷勤重寄词词中有誓两心知七月七日长生殿夜半无人私语时在天愿作比翼鸟在地愿为连理枝天长地久有时尽此恨绵绵无绝期'
  };
  var currentPoem = '琵琶行';
  var CHARS = POEMS[currentPoem];
  var POEM_INFO = {
    '琵琶行': {
      label: '琵琶行 (Pípa Xíng) 白居易'
    },
    '秦妇吟': {
      label: '秦妇吟 (Qín Fù Yín) 韦庄'
    },
    '长恨歌': {
      label: '长恨歌 (Cháng Hèn Gē) 白居易'
    }
  };
  var NOTES = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3];
  var INK = '#5C4640';

  var CFG = {
    gravity: 0.07,
    damping: 0.985,
    iterationsPerFrame: 5,
    verticalCompress: 0.02,
    verticalStretch: 1.3,
    horizCompress: 0.6,
    horizStretch: 4,
    mouseSize: 5200,      /* 推开 + 拨弦触发半径的平方：5200 ≈ 72px（原 20000 ≈ 141px，过大） */
    mouseStrength: 260,   /* 鼠标划过时的推开力度：越大，字串晃动幅度越大 */
    grabRadius: 20
  };

  /* ---------------- DOM ---------------- */
  var section = document.getElementById('historyPoem');
  var container = document.getElementById('clothContainer');
  var roofImg = document.getElementById('roofImg');
  var canvas = document.getElementById('clothCanvas');
  if (!section || !container || !roofImg || !canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* ---------------- State ---------------- */
  var state = { gridW: 1, gridH: 1, cellWidth: 10, cellHeight: 10, dpr: 1 };
  var particles = [];
  var charCanvases = {};
  var rafId = null;
  var lastTime = 0;
  var pointer = { x: -1e9, y: -1e9, active: false };
  var grabbed = null;

  /* ---------------- Audio state ---------------- */
  var audioCtx = null;
  var lastPluckTime = 0;
  var lastPluckColumn = -1;
  var lastColumnTime = 0;

  /* ---------------- Breakpoints ---------------- */
  var currentBp = getBreakpoint();
  var lastWidth = window.innerWidth;
  var lastHeight = window.innerHeight;

  function getBreakpoint() {
    var w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  function getGridConfig(bp) {
    if (bp === 'mobile') return { gridH: 36, height: 540, wFactor: 1.04, roofGap: 42, bottomReserve: 130 };
    if (bp === 'tablet') return { gridH: 22, height: 400, wFactor: 0.9, roofGap: 0, bottomReserve: 90 };
    return { gridH: 18, height: 360, wFactor: 0.86, roofGap: -14, bottomReserve: 90 };
  }

  /* ---------------- Character pre-render ---------------- */
  function preRenderChars(fontSize, dpr) {
    charCanvases = {};
    var box = Math.ceil(fontSize * 1.25);
    var ss = 2; /* supersample small glyphs for crispness */
    var uniq = Array.from(new Set(CHARS.split('')));
    for (var u = 0; u < uniq.length; u++) {
      var ch = uniq[u];
      var c = document.createElement('canvas');
      c.width = Math.ceil(box * dpr * ss);
      c.height = Math.ceil(box * dpr * ss);
      var g = c.getContext('2d');
      g.scale(dpr * ss, dpr * ss);
      g.font = 'bold ' + fontSize + 'px "Noto Serif SC", serif';
      g.fillStyle = INK;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ch, box / 2, box / 2);
      charCanvases[ch] = { canvas: c, box: box };
    }
  }

  /* ---------------- Pointer helpers ---------------- */
  function toLocal(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerMove(e) {
    var p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = true;
    ensureAudio();
    if (grabbed) {
      grabbed.x = grabbed.ox = p.x;
      grabbed.y = grabbed.oy = p.y;
    }
  }

  function onPointerDown(e) {
    var p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = true;
    ensureAudio();
    var best = null;
    var bestD = CFG.grabRadius * CFG.grabRadius;
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      var dx = pt.x - p.x;
      var dy = pt.y - p.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = pt; }
    }
    if (best) {
      grabbed = best;
      grabbed.originalPinned = best.pinned;
      best.pinned = true;
    }
  }

  function onPointerUp() {
    if (grabbed) {
      grabbed.pinned = grabbed.originalPinned;
      grabbed = null;
    }
    pointer.active = false;
  }

  /* ---------------- Audio ---------------- */
  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tryPluck(col) {
    var now = performance.now();
    if (now - lastPluckTime < 100) return;
    if (col === lastPluckColumn && now - lastColumnTime < 200) return;
    lastPluckTime = now;
    lastPluckColumn = col;
    lastColumnTime = now;
    var idx = ((col % 8) + 8) % 8;
    playPluck(NOTES[idx]);
  }

  function playPluck(freq) {
    var ac = ensureAudio();
    if (!ac) return;
    var t0 = ac.currentTime;
    var osc1 = ac.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    var osc2 = ac.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    var merger = ac.createChannelMerger(2);
    osc1.connect(merger, 0, 0);
    osc2.connect(merger, 0, 1);
    var filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(4000, t0);
    filter.frequency.exponentialRampToValueAtTime(200, t0 + 0.8);
    var gain = ac.createGain();
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0);
    merger.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + 1.0);
    osc2.stop(t0 + 1.0);
  }

  /* ---------------- Physics ---------------- */
  function smoothstep(edge0, edge1, x) {
    var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function solve(a, b, restLen, compressF, stretchF) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    var minLen = restLen * (1 - compressF);
    var maxLen = restLen * stretchF;
    if (dist < minLen || dist > maxLen) {
      var target = dist < minLen ? minLen : maxLen;
      var diff = (dist - target) / dist;
      var ox = dx * diff * 0.5;
      var oy = dy * diff * 0.5;
      if (!a.pinned) { a.x += ox; a.y += oy; }
      if (!b.pinned) { b.x -= ox; b.y -= oy; }
    }
  }

  /* 横向仅推开：相邻丝弦只在过近时互相排开，不向内收拢，让各列像独立珠串一样自由摆动。 */
  function solveSpring(a, b, restLen) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    if (dist < restLen) {
      var diff = (dist - restLen) / dist;
      var ox = dx * diff * 0.22;
      var oy = dy * diff * 0.22;
      if (!a.pinned) { a.x += ox; a.y += oy; }
      if (!b.pinned) { b.x -= ox; b.y -= oy; }
    }
  }

  function idx(i, j) { return j * state.gridW + i; }

  function step(delta) {
    var dt2 = delta * delta;

    /* 指针推力 */
    var disturbedColumn = -1;
    if (pointer.active) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.pinned) continue;
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < CFG.mouseSize) {
          if (disturbedColumn < 0) disturbedColumn = Math.round(p.x / state.cellWidth);
          var angle = Math.atan2(pointer.y - p.y, pointer.x - p.x) - Math.PI;
          var strength = smoothstep(CFG.mouseSize, -2000, d2) * CFG.mouseStrength / 300;
          p.ax += Math.cos(angle) * strength;
          p.ay += Math.sin(angle) * strength;
        }
      }
    }
    if (pointer.active && disturbedColumn >= 0) tryPluck(disturbedColumn);

    /* 轻柔穿堂风：整帘如珠帘般缓缓漂荡 */
    var nowSec = performance.now() * 0.001;
    for (var b = 0; b < particles.length; b++) {
      var bp = particles[b];
      if (bp.pinned) continue;
      var colPhase = (b % state.gridW) * 0.35;
      var breeze = Math.sin(nowSec * 0.6 + bp.y * 0.018 + colPhase) * 0.012
                 + Math.sin(nowSec * 0.23 + bp.y * 0.01) * 0.008;
      bp.ax += breeze;
    }

    /* Verlet 积分 */
    for (var k = 0; k < particles.length; k++) {
      var q = particles[k];
      if (q.pinned) { q.ax = 0; q.ay = 0; continue; }
      var vx = (q.x - q.ox) * CFG.damping;
      var vy = (q.y - q.oy) * CFG.damping;
      q.ox = q.x;
      q.oy = q.y;
      q.ay += CFG.gravity / dt2;
      q.x += vx + q.ax * dt2;
      q.y += vy + q.ay * dt2;
      q.ax = 0;
      q.ay = 0;
    }

    /* 约束 */
    for (var iter = 0; iter < CFG.iterationsPerFrame; iter++) {
      for (var a = 0; a < particles.length; a++) {
        var pa = particles[a];
        if (!pa.down) continue;
        solve(pa, pa.down, state.cellHeight, CFG.verticalCompress, CFG.verticalStretch);
      }
      for (var j = 0; j < state.gridH; j++) {
        for (var i2 = 0; i2 < state.gridW - 1; i2++) {
          solveSpring(particles[idx(i2, j)], particles[idx(i2 + 1, j)], state.cellWidth);
        }
      }
    }
  }

  /* Keep the readable narrow curtain inside its physical canvas frame. */
  function containNarrowCurtain() {
    if (currentBp === 'desktop') return;
    var width = canvas.width / state.dpr;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], cc = charCanvases[p.ch];
      if (!cc) continue;
      var edge = cc.box / Math.sqrt(2);
      var left = currentBp === 'mobile' ? 104 : 0;
      var right = currentBp === 'mobile' ? 72 : 0;
      var x = Math.max(left + edge, Math.min(width - right - edge, p.x));
      if (x !== p.x) p.x = p.ox = x;
    }
  }

  /* ---------------- Render ---------------- */
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var dpr = state.dpr;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!p.ch) continue;
      var rot = 0;
      if (p.down) {
        var dx = p.down.x - p.x;
        var dy = p.down.y - p.y;
        rot = Math.atan2(dy, dx) - Math.PI / 2;
      }
      var cc = charCanvases[p.ch];
      var box = cc.box;
      ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
      ctx.rotate(rot);
      ctx.drawImage(cc.canvas, -box / 2, -box / 2, box, box);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ---------------- Main loop ---------------- */
  function loop(now) {
    var delta = Math.min(Math.max((now - lastTime) / (1000 / 60), 0.25), 3);
    lastTime = now;
    step(delta);
    containNarrowCurtain();
    render();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!rafId && sectionVisible) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }
  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ---------------- Init / cleanup ---------------- */
  function cleanup() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    particles = [];
    grabbed = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('resize', onResize);
  }

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var bp = getBreakpoint();
      var w = window.innerWidth;
      var h = window.innerHeight;
      if (bp !== currentBp || Math.abs(w - lastWidth) > 4 || Math.abs(h - lastHeight) > 4) {
        currentBp = bp;
        lastWidth = w;
        lastHeight = h;
        if (window.__roofLoaded) init();
      }
    }, 150);
  }

  function init() {
    cleanup();

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (currentBp === 'desktop') section.style.removeProperty('--poem-layout-height');
    var cRect = container.getBoundingClientRect();
    var w = cRect.width;
    var h = cRect.height;

    /* 屋顶可见盒（object-fit: contain 可能留白） */
    var visibleW, roofBottom;
    var rect = roofImg.getBoundingClientRect();
    var aspect = roofImg.naturalWidth / roofImg.naturalHeight;
    if (roofImg.naturalWidth > 0 && aspect > 0) {
      visibleW = Math.min(rect.width, rect.height * aspect);
      var visibleH = Math.min(rect.height, rect.width / aspect);
      roofBottom = rect.top - cRect.top + visibleH;
    } else {
      /* 屋顶加载失败：退回一个稳妥锚点 */
      visibleW = w * 0.45;
      roofBottom = h * 0.22;
    }

    var cfg = getGridConfig(currentBp);
    var stringAreaWidth = Math.min(w - (currentBp === 'mobile' ? 176 : 24), visibleW * cfg.wFactor);
    var originY = roofBottom + cfg.roofGap;
    var stringAreaHeight = Math.min(cfg.height, Math.max(180, h - originY - cfg.bottomReserve));
    var gridH = cfg.gridH;
    var readableFont = currentBp === 'mobile' ? 15 : currentBp === 'tablet' ? 16 : null;
    if (readableFont) {
      // Keep every character: grow the curtain instead of shrinking its glyphs.
      var columns = Math.max(1, Math.floor(stringAreaWidth / (readableFont / 0.62)));
      gridH = Math.max(gridH, Math.ceil(CHARS.length / columns));
      stringAreaHeight = Math.max(cfg.height, (gridH - 1) * readableFont / 0.64);
      var label = section.querySelector('.left-hero').getBoundingClientRect();
      originY = Math.max(originY, label.bottom - cRect.top + Math.ceil(readableFont * 1.25) / 2 + 16);
      // Reserve room for the existing string stretch, solver slack and bottom controls.
      section.style.setProperty('--poem-layout-height', Math.ceil(originY + stringAreaHeight * (CFG.verticalStretch + 0.12) + cfg.bottomReserve + readableFont) + 'px');
      h = container.getBoundingClientRect().height;
    }
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var gridW = Math.ceil(CHARS.length / gridH) + 1;
    var cellWidth = stringAreaWidth / (gridW - 1);
    var cellHeight = stringAreaHeight / (gridH - 1);
    var originX = w / 2 - stringAreaWidth / 2;
    if (readableFont) originX -= cellWidth / 2; // Center the populated columns; the first column is empty.
    if (currentBp === 'mobile') originX += 16; // Leave 104px/72px for the host music and back-to-top controls.

    state.gridW = gridW;
    state.gridH = gridH;
    state.cellWidth = cellWidth;
    state.cellHeight = cellHeight;
    state.dpr = dpr;

    var fontSize = readableFont || Math.max(7, Math.min(cellHeight * 0.64, cellWidth * 0.62));
    preRenderChars(fontSize, dpr);

    particles = [];
    for (var j = 0; j < gridH; j++) {
      for (var i = 0; i < gridW; i++) {
        var x = originX + i * cellWidth;
        var y = originY + j * cellHeight;
        var pinned = j === 0;
        var charIndex = (gridW - 1 - i) * gridH + j;
        particles.push({
          x: x, y: y, ox: x, oy: y, ax: 0, ay: 0,
          pinned: pinned, originalPinned: pinned,
          ch: charIndex < CHARS.length ? CHARS[charIndex] : '',
          down: null
        });
      }
    }
    for (var jj = 0; jj < gridH - 1; jj++) {
      for (var ii = 0; ii < gridW; ii++) {
        particles[idx(ii, jj)].down = particles[idx(ii, jj + 1)];
      }
    }

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('resize', onResize);

    startLoop();
  }

  /* ---------------- Poem switcher ---------------- */
  var soundHint = document.getElementById('soundHint');
  function unlockAudioOnce() {
    ensureAudio();
    if (soundHint) soundHint.classList.add('hide');
    document.removeEventListener('pointerdown', unlockAudioOnce);
  }
  document.addEventListener('pointerdown', unlockAudioOnce);

  var poemButtons = document.querySelectorAll('.poem-btn');
  function renderLeftHero(name) {
    var info = POEM_INFO[name];
    if (!info) return;
    var label = document.getElementById('leftLabel');
    if (label) label.textContent = info.label;
    var brand = document.getElementById('navBrand');
    if (brand) brand.textContent = name;
    document.getElementById('poemSemanticTitle').textContent = info.label;
    document.getElementById('poemSemanticBody').textContent = POEMS[name];
    poemButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-poem') === name ? 'true' : 'false');
    });
  }
  renderLeftHero(currentPoem);
  poemButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      poemButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentPoem = btn.getAttribute('data-poem');
      CHARS = POEMS[currentPoem];
      renderLeftHero(currentPoem);
      if (window.__roofLoaded) init();
    });
  });

  /* ---------------- Visibility gate（嵌入滚动页时，离屏暂停物理循环） ---------------- */
  var sectionVisible = true;
  var io = new IntersectionObserver(function (entries) {
    sectionVisible = entries[0].isIntersecting;
    if (sectionVisible) startLoop();
    else stopLoop();
  }, { threshold: 0.05 });
  io.observe(section);

  /* ---------------- Bootstrap ---------------- */
  window.__initCloth = function () {
    var run = function () {
      if (window.__roofLoaded) init();
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
  };
  if (roofImg.complete) window.__roofLoaded = true;
  if (window.__roofLoaded) window.__initCloth();
})();
