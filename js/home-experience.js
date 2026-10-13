/* 盛唐雅粹 · 首页数字展序厅。关闭开关即可恢复 index.html 原有首页区块。 */
const ENABLE_HOME_EXPERIENCE = true;

(function () {
  'use strict';

  if (!ENABLE_HOME_EXPERIENCE || document.body.dataset.page !== 'home') {
    document.documentElement.classList.add('home-experience-disabled');
    return;
  }

  const details = {
    changan: {
      eyebrow: '一眼看懂盛唐 · 长安',
      title: '世界帝都',
      body: '<p>长安城面积达84平方公里，是当时世界上最大的都城。朱雀大街宽达150米，比巴黎香榭丽舍大道还宽。城中坊市108个，人口逾百万，汇聚了来自波斯、天竺、日本、新罗的使臣与商人。</p>'
    },
    silk: {
      eyebrow: '一眼看懂盛唐 · 丝路',
      title: '文明纽带',
      body: '<p>唐朝控制西域，丝绸之路进入全盛时期。驼铃声声，商队络绎不绝——中国的丝绸、瓷器、茶叶西去，西域的香料、宝石、玻璃东来。丝路不仅是商贸之路，更是文明交融的桥梁。</p>'
    },
    myriad: {
      eyebrow: '一眼看懂盛唐 · 万象',
      title: '开放包容 · 气象万千',
      body: '<p>唐朝是当时世界上最强盛的国家之一，经济繁荣，文化璀璨，艺术登峰造极。长安城是当时世界上最大的城市，人口超过百万，各国商贾、使节、留学生云集于此。唐诗、唐画、唐三彩、敦煌壁画……无数文化瑰宝流传至今，诉说着那个开放包容、气象万千的黄金时代。</p>'
    },
    note: {
      eyebrow: '更多盛唐注脚',
      title: '王朝与取士',
      body: '<p>唐朝（618年—907年），是中国历史上继隋朝之后的大一统中原王朝，共历二十一帝，享国二百八十九年。唐朝疆域空前辽阔，极盛时期东起日本海、南据安南、西抵咸海、北逾贝加尔湖，是中国自秦以来第一个未修据胡长城的大一统王朝。</p><p>唐朝完善了隋朝创立的科举制度，打破门阀垄断，让寒门子弟有了入仕之途。“朝为田舍郎，暮登天子堂”，太宗言“天下英雄尽入吾彀中矣”，科举制影响了此后一千三百余年的中国历史。</p>'
    },
    women: {
      eyebrow: '盛唐碎片 · 女性风华',
      title: '空前绝后',
      body: '<p>唐代女性社会地位之高在中国古代史上空前绝后。女子可以骑马出游、穿胡服男装、参与政治——武则天更是成为中国历史上唯一的女皇帝。上官婉儿执掌文坛，平阳公主统兵打仗，大唐女子活出了独特的风采。</p>'
    },
    dance: {
      eyebrow: '盛唐碎片 · 乐舞',
      title: '万邦之音汇于长安',
      body: '<p>唐代音乐舞蹈集历代之大成——霓裳羽衣舞翩若惊鸿，秦王破阵乐气势恢宏，胡旋舞旋转如风。唐玄宗创办梨园，亲自教授乐工，被后世尊为戏曲梨园行的祖师。龟兹乐、高昌乐、天竺乐……万邦之音汇于长安。</p>'
    },
    faith: {
      eyebrow: '盛唐碎片 · 信仰',
      title: '兼容天下',
      body: '<p>唐朝以开放胸襟容纳天下宗教——佛教兴盛、道教被奉为国教、景教（基督教）、祆教（拜火教）、摩尼教、伊斯兰教均在长安设有寺院。大秦景教流行中国碑至今矗立，见证着那个信仰自由的伟大时代。</p>'
    },
    craft: {
      eyebrow: '盛唐碎片 · 工艺',
      title: '匠心独运',
      body: '<p>唐三彩流光溢彩，越窑秘色瓷如冰似玉，金银器錾刻精美绝伦，丝绸织锦寸缕寸金——唐代工匠以超凡技艺将日常生活升华为艺术。丝绸之路上的每一件唐代器物，都是令世界惊叹的东方瑰宝。</p>'
    },
    travel: {
      eyebrow: '盛唐碎片 · 商旅',
      title: '万商云集',
      body: '<p>丝绸之路是连接东西方的黄金纽带。驼队载着丝绸、瓷器、茶叶西行，带回香料、宝石、琉璃。长安西市胡商云集，波斯邸、胡姬酒肆鳞次栉比。这条横跨万里的商贸之路，让大唐成为当时全球贸易的中心枢纽。</p>'
    },
    poetry: {
      eyebrow: '盛唐碎片 · 诗歌',
      title: '光照千秋',
      body: '<p>唐代是中国诗歌的黄金时代。《全唐诗》收录近五万首，诗人逾两千家。李白豪放飘逸，杜甫沉郁顿挫，王维诗画合一，白居易平易近人……唐诗以其无与伦比的艺术成就，成为中华文化最璀璨的瑰宝，光照千秋。</p>'
    }
  };

  const legacySections = Array.from(document.querySelectorAll('[data-home-legacy]'));
  const hero = document.getElementById('heroCarousel');
  const compassSection = document.getElementById('compassSection');
  if (!legacySections.length || !hero) return;

  let root;

  try {
    document.documentElement.classList.add('home-experience-enabled');
    document.body.classList.add('home-experience-enabled');

    legacySections.forEach(function (section) {
      section.hidden = true;
      section.inert = true;
      section.querySelectorAll('video').forEach(function (video) {
        video.pause();
        video.preload = 'none';
      });
    });

    root = document.createElement('main');
    root.className = 'home-experience';
    root.id = 'homeExperience';
    root.innerHTML = `
      <section class="protect-section" id="homeDynasty">
        <div class="protect-wheel-stage">
          <div class="protect-bg-current" id="protectBgCurrent"></div>
          <div class="protect-bg-next" id="protectBgNext"></div>
          <div class="protect-veil"></div>
          <div class="protect-text-container" id="protectTextContainer"></div>
          <div class="protect-wheel-container" id="protectWheel">
            <div class="protect-wheel-current" id="protectWheelCurrent"></div>
            <div class="protect-wheel-slices" id="protectWheelSlices"></div>
            <div class="protect-wheel-lines" id="protectWheelLines"></div>
            <div class="protect-wheel-ring"></div>
            <div class="protect-wheel-center">盛唐<br>华章</div>
          </div>
          <div class="protect-scroll-hint">向下滚轮切换 ↓</div>
        </div>
      </section>
      <section class="home-intro-section" id="homeIntro">
        <div class="home-intro-inner">
          <span class="home-intro-index">序 · PROLOGUE</span>
          <h2 class="home-intro-title">流光入长安</h2>
          <p class="home-intro-sub">五幕粒子点云 · 随滚动徐徐展开盛唐万象</p>
          <div class="home-intro-scroll">
            <span>向下滚动</span>
            <i class="home-intro-arrow"></i>
          </div>
        </div>
      </section>
      <section class="home-particle-section" id="particleStory" aria-labelledby="homeParticleTitle">
        <div class="home-section-frame">
          <header class="home-section-heading home-section-heading-light home-reveal-title" data-home-reveal="title">
            <span class="home-section-index">01 / PARTICLE PRELUDE</span>
            <h2 id="homeParticleTitle">流光入长安</h2>
            <p>滚动探索，看盛唐万象粒子点云</p>
          </header>
          <div class="home-particle-stage" id="homeParticleStage" aria-label="粒子点云展示区">
            <div class="home-particle-copy"><span>01 · 唐三彩</span><strong>驼铃西市</strong><em>TANG SANCAI · CAMEL CARAVAN</em><p>釉彩凝光，驼载万里。</p></div>
          </div>
        </div>
      </section>`;

    legacySections[0].parentNode.insertBefore(root, legacySections[0]);
    if (compassSection) {
      var particleStory = root.querySelector('#particleStory');
      if (particleStory && particleStory.nextSibling) {
        root.insertBefore(compassSection, particleStory.nextSibling);
      } else {
        root.appendChild(compassSection);
      }
    }

    const scrollCue = document.createElement('button');
    scrollCue.type = 'button';
    scrollCue.className = 'home-scroll-cue';
    scrollCue.innerHTML = '<span>向下探索</span><i aria-hidden="true"></i>';
    scrollCue.addEventListener('click', function () {
      root.querySelector('#particleStory').scrollIntoView({ behavior: 'smooth' });
    });
    hero.appendChild(scrollCue);

    const drawer = document.createElement('aside');
    drawer.className = 'home-drawer';
    drawer.id = 'homeDrawer';
    drawer.hidden = true;
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-labelledby', 'homeDrawerTitle');
    drawer.innerHTML = '<button class="home-drawer-backdrop" type="button" aria-label="关闭详情"></button><div class="home-drawer-sheet"><button class="home-drawer-close" type="button" aria-label="关闭详情">×</button><span class="home-drawer-eyebrow"></span><h2 id="homeDrawerTitle"></h2><div class="home-drawer-rule"></div><div class="home-drawer-copy"></div></div>';
    document.body.appendChild(drawer);

    let drawerReturnFocus = null;
    function closeDrawer() {
      if (drawer.hidden) return;
      drawer.classList.remove('is-open');
      document.body.classList.remove('home-drawer-open');
      window.setTimeout(function () {
        drawer.hidden = true;
        if (drawerReturnFocus) drawerReturnFocus.focus({ preventScroll: true });
      }, 420);
    }
    function openDrawer(key, trigger) {
      const content = details[key];
      if (!content) return;
      drawerReturnFocus = trigger || document.activeElement;
      drawer.querySelector('.home-drawer-eyebrow').textContent = content.eyebrow;
      drawer.querySelector('#homeDrawerTitle').textContent = content.title;
      drawer.querySelector('.home-drawer-copy').innerHTML = content.body;
      drawer.hidden = false;
      document.body.classList.add('home-drawer-open');
      void drawer.offsetWidth;
      drawer.classList.add('is-open');
      window.setTimeout(function () {
        drawer.querySelector('.home-drawer-close').focus({ preventScroll: true });
      }, 20);
    }
    root.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-drawer-key]');
      if (trigger) {
        if (trigger.dataset.keyword) activateKeyword(trigger.dataset.keyword);
        openDrawer(trigger.dataset.drawerKey, trigger);
      }
    });
    drawer.querySelector('.home-drawer-close').addEventListener('click', closeDrawer);
    drawer.querySelector('.home-drawer-backdrop').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !drawer.hidden) closeDrawer();
    });

    const keywordStage = root.querySelector('.home-keyword-stage');
    const keywordButtons = Array.from(root.querySelectorAll('.home-keyword'));
    const keywordResponses = Array.from(root.querySelectorAll('[data-keyword-response]'));
    function activateKeyword(key) {
      keywordStage.dataset.activeKeyword = key;
      keywordButtons.forEach(function (button) { button.classList.toggle('is-active', button.dataset.keyword === key); });
      keywordResponses.forEach(function (response) { response.classList.toggle('is-active', response.dataset.keywordResponse === key); });
    }
    keywordButtons.forEach(function (button) {
      button.addEventListener('mouseenter', function () { activateKeyword(button.dataset.keyword); });
      button.addEventListener('focus', function () { activateKeyword(button.dataset.keyword); });
    });
    let pointerFrame = 0;
    if (keywordStage) keywordStage.addEventListener('mousemove', function (event) {
      if (keywordStage.dataset.activeKeyword !== 'myriad') return;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(function () {
        pointerFrame = 0;
        const bounds = keywordStage.getBoundingClientRect();
        const shiftX = Math.max(-12, Math.min(12, (event.clientX - bounds.left - bounds.width / 2) * .025));
        const shiftY = Math.max(-9, Math.min(9, (event.clientY - bounds.top - bounds.height / 2) * .025));
        keywordStage.style.setProperty('--myriad-x', shiftX.toFixed(1) + 'px');
        keywordStage.style.setProperty('--myriad-y', shiftY.toFixed(1) + 'px');
        keywordStage.style.setProperty('--myriad-x-negative', (-shiftX).toFixed(1) + 'px');
        keywordStage.style.setProperty('--myriad-y-negative', (-shiftY).toFixed(1) + 'px');
      });
    }, { passive: true });

    const reveals = Array.from(root.querySelectorAll('[data-home-reveal]'));
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (element) { revealObserver.observe(element); });
    root._homeRevealObserver = revealObserver;
    let revealFrame = 0;
    function revealVisible() {
      revealFrame = 0;
      reveals.forEach(function (element) {
        if (element.classList.contains('is-revealed')) return;
        const bounds = element.getBoundingClientRect();
        if (bounds.top < innerHeight * .9 && bounds.bottom > innerHeight * .08) {
          element.classList.add('is-revealed');
          revealObserver.unobserve(element);
        }
      });
    }
    function queueReveal() {
      if (!revealFrame) revealFrame = requestAnimationFrame(revealVisible);
    }
    window.addEventListener('scroll', queueReveal, { passive: true });
    window.addEventListener('resize', queueReveal);
    document.addEventListener('exhibition:opened', queueReveal);
    queueReveal();

    /* 序章"流光入长安"标题随滚动模糊淡出；粒子舞台进入视口时淡入浮现 */
    const introSection = root.querySelector('#homeIntro');
    const introInner = root.querySelector('.home-intro-inner');
    const particleStage = root.querySelector('#homeParticleStage');
    let introLeaving = false;
    let particleLoaded = false;
    function updateIntroTransition() {
      const vh = window.innerHeight;
      if (introSection && introInner) {
        const r = introSection.getBoundingClientRect();
        if (r.bottom > 0) {
          const leaving = r.top < -vh * 0.18;
          if (leaving !== introLeaving) {
            introLeaving = leaving;
            introInner.classList.toggle('is-leaving', leaving);
            if (leaving) {
              if (!particleLoaded) {
                particleLoaded = true;
                particleStage.classList.add('is-loaded');
              }
            } else {
              particleLoaded = false;
              particleStage.classList.remove('is-loaded');
            }
          }
        }
      }
    }
    window.addEventListener('scroll', updateIntroTransition, { passive: true });
    window.addEventListener('resize', updateIntroTransition);
    updateIntroTransition();
    const birdZones = [hero];
    const visibleBirdZones = new Set();
    const birdObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visibleBirdZones.add(entry.target);
        else visibleBirdZones.delete(entry.target);
      });
      document.body.classList.toggle('home-birds-visible', visibleBirdZones.size > 0);
    }, { threshold: .08 });
    birdZones.forEach(function (zone) { birdObserver.observe(zone); });
  } catch (error) {
    if (root) root.remove();
    legacySections.forEach(function (section) { section.hidden = false; section.inert = false; });
    document.querySelector('.home-scroll-cue')?.remove();
    document.documentElement.classList.remove('home-experience-enabled');
    document.body.classList.remove('home-experience-enabled');
    console.error('首页数字展序厅初始化失败：', error);
  }
  /* ========== 盛唐华章轮盘：圆形遮罩·扇形切片旋转转场（数据驱动） ========== */
  (function initProtectWheel() {
    var stage = document.querySelector('.protect-wheel-stage');
    if (!stage) return;
    var IMG = 'images/backgrounds/';
    var PAGES = [
      { img: '长安.png', tag: '长安气象', title: '长安一片月，万户捣衣声',
        text: '十二道城门洞开，百万人口的国际都会灯火连绵。朱雀大街纵贯南北，东西两市胡商云集。烟花月下的长安，是当时世界上最璀璨的城。' },
      { img: '春.png', tag: '春日万象', title: '春到秦川，人间烟火',
        text: '城阙之外，春到秦川。农人挑担、耕者归田，仕女捧牡丹游春。盛世不只在宫阙，也在炊烟与阡陌之间，岁岁生发，生生不息。' },
      { img: '上官婉儿.jpg', tag: '才女文心', title: '千年万岁，椒花颂声',
        text: '她掌制诰、评诗文，称量天下文士。《唐昭容上官氏墓志》铭曰：“潇湘水断，宛委山倾。珠沉圆折，玉碎连城。甫瞻松槚，静听坟茔。千年万岁，椒花颂声。”短短三十二字，是太平公主对这位红颜知己最真挚的祝愿与无尽思念。' },
      { img: '李白.png', tag: '诗仙揽月', title: '举杯邀明月，对影成三人',
        text: '白衣仗剑，立于星河云海之上。他绣口一吐，便是半个盛唐；明月、美酒与远方，成了中国人刻在骨血里的浪漫。' },
      { img: '马嵬坡.png', tag: '马嵬惊变', title: '渔阳鼙鼓动地来',
        text: '安史狼烟，铁骑惊破霓裳。马嵬坡前六军不发，绝代风华殁于乱世。盛唐由极盛转入飘摇，徒留一轮冷月，照尽兴亡。' },
      { img: '绿.jpg', tag: '丹青传承', title: '飞天入梦，青绿千年',
        text: '敦煌石壁上的飞天身披青绿、衣袂当风。千年矿物颜料未曾褪色，如同文明的密码，在壁画与一代代临摹者的笔下重获新生。' },
      { img: '妈祖.png', tag: '民间薪火', title: '香火不绝，文脉长明',
        text: '从宫廷到民间，从诗文到信仰。海上的护佑、市井的传说、匠人的手艺，汇成文化最深厚的根系，让盛唐之美在烟火中生生不息。' }
    ];
    var SLICE_N = 8;
    var LOCK = 1300;
    var current = 0;
    var animating = false;
    var wheelLock = false;

    var bgCurrent = stage.querySelector('#protectBgCurrent');
    var bgNext = stage.querySelector('#protectBgNext');
    var wheel = stage.querySelector('#protectWheel');
    var wheelCurrent = stage.querySelector('#protectWheelCurrent');
    var wheelSlices = stage.querySelector('#protectWheelSlices');
    var wheelLines = stage.querySelector('#protectWheelLines');
    var textBox = stage.querySelector('#protectTextContainer');
    var scrollHint = stage.querySelector('.protect-scroll-hint');
    var dots = [];
    function url(i) { return 'url("' + IMG + PAGES[i].img + '")'; }

    /* 文字（数据驱动） */
    PAGES.forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'protect-text-item' + (i === 0 ? ' active' : '');
      d.innerHTML =
        '<span class="protect-text-tag">' + p.tag + '</span>' +
        '<h3>' + p.title + '</h3>' +
        '<p>' + p.text + '</p>';
      textBox.appendChild(d);
    });
    var textItems = textBox.querySelectorAll('.protect-text-item');

    /* 8 个扇形切片 */
    var slices = [];
    for (var i = 0; i < SLICE_N; i++) {
      var s = document.createElement('div');
      s.className = 'protect-slice';
      s.style.setProperty('--a', (i * 45) + 'deg');
      s.style.setProperty('--d', (i * 46) + 'ms');
      var img = document.createElement('div');
      img.className = 'protect-slice-img';
      s.appendChild(img);
      wheelSlices.appendChild(s);
      slices.push({ el: s, img: img });
    }
    for (var k = 0; k < SLICE_N; k++) {
      var ln = document.createElement('span');
      ln.style.transform = 'rotate(' + (k * 45) + 'deg)';
      wheelLines.appendChild(ln);
    }

    function placeFull(el) {
      var sr = stage.getBoundingClientRect();
      var r = wheel.getBoundingClientRect();
      el.style.width = sr.width + 'px';
      el.style.height = sr.height + 'px';
      el.style.left = (-(r.left - sr.left)) + 'px';
      el.style.top = (-(r.top - sr.top)) + 'px';
    }
    function layout() {
      var sr = stage.getBoundingClientRect();
      var r = wheel.getBoundingClientRect();
      stage.style.setProperty('--cx', (r.left - sr.left + r.width / 2) + 'px');
      stage.style.setProperty('--cy', (r.top - sr.top + r.height / 2) + 'px');
      stage.style.setProperty('--r0', (r.width / 2) + 'px');
      placeFull(wheelCurrent);
      slices.forEach(function (s) { placeFull(s.img); });
    }
    function setActive(idx) {
      textItems.forEach(function (t, i) { t.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }

    function goTo(target) {
      if (target < 0 || target >= PAGES.length || target === current || animating) return;
      var dir = target > current ? 'down' : 'up';
      animating = true;
      var targetUrl = url(target);
      var currentUrl = url(current);

      textItems[current].classList.remove('active');

      slices.forEach(function (s) {
        s.img.style.backgroundImage = targetUrl;
        placeFull(s.img);
        s.el.classList.remove('protect-sweep-cw', 'protect-sweep-ccw');
        void s.el.offsetWidth;
      });

      if (dir === 'down') {
        slices.forEach(function (s, idx) {
          s.el.style.setProperty('--d', (idx * 46) + 'ms');
          s.el.classList.add('protect-sweep-cw');
        });
        bgNext.style.backgroundImage = targetUrl;
        bgNext.style.visibility = 'visible';
        bgNext.classList.remove('protect-shrink');
        void bgNext.offsetWidth;
        setTimeout(function () { bgNext.classList.add('protect-expand'); }, 420);
        setTimeout(function () { setActive(target); }, 640);
        setTimeout(finish, LOCK);
      } else {
        bgCurrent.style.backgroundImage = targetUrl;
        bgNext.style.backgroundImage = currentUrl;
        bgNext.style.visibility = 'visible';
        bgNext.classList.remove('protect-expand');
        bgNext.classList.add('protect-shrink');
        void bgNext.offsetWidth;
        setTimeout(function () {
          slices.forEach(function (s, idx) {
            s.el.style.setProperty('--d', ((SLICE_N - 1 - idx) * 46) + 'ms');
            s.el.classList.add('protect-sweep-ccw');
          });
        }, 150);
        setTimeout(function () { setActive(target); }, 620);
        setTimeout(finish, LOCK);
      }

      function finish() {
        bgCurrent.style.backgroundImage = targetUrl;
        wheelCurrent.style.backgroundImage = targetUrl;
        placeFull(wheelCurrent);
        bgNext.style.visibility = 'hidden';
        bgNext.classList.remove('protect-expand', 'protect-shrink');
        slices.forEach(function (s, idx) {
          s.el.classList.remove('protect-sweep-cw', 'protect-sweep-ccw');
          s.el.style.setProperty('--d', (idx * 46) + 'ms');
        });
        current = target;
        setActive(target);
        animating = false;
      }
    }

    stage.addEventListener('wheel', function (e) {
      var down = e.deltaY > 0;
      if (!animating) {
        if (down && current === PAGES.length - 1) return;
        if (!down && current === 0) return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (animating || wheelLock) return;
      wheelLock = true;
      setTimeout(function () { wheelLock = false; }, LOCK);
      goTo(down ? current + 1 : current - 1);
      if (scrollHint) scrollHint.style.opacity = '0';
    }, { passive: false });

    var touchY = 0;
    stage.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) <= 50 || animating) return;
      var t = dy > 0 ? current + 1 : current - 1;
      if (t < 0 || t >= PAGES.length) return;
      goTo(t);
      if (scrollHint) scrollHint.style.opacity = '0';
    }, { passive: true });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });

    bgCurrent.style.backgroundImage = url(0);
    wheelCurrent.style.backgroundImage = url(0);
    window.addEventListener('load', layout);
    setTimeout(layout, 60);
    setTimeout(layout, 400);
    setTimeout(layout, 1200);
  })();
})();
