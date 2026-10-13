(() => {
  'use strict';

  const FIGURES = [
    {
      name: '执扇贵女', role: '簪花华仪', verse: '罗衣何飘飘，轻裾随风还。',
      copy: '高髻金钗与团扇相映，层叠披帛收住盛唐贵女的雍容气度。低饱和石青、烟粉与鎏金织边，使繁复纹样在柔光中仍有清晰层次。',
      silhouette: '齐胸襦裙 · 广袖披帛', palette: '烟粉 · 石青 · 鎏金', culture: '宫廷雅集与簪花风尚',
      image: '../images/weave-fashion/figures/01-fan-noblewoman.png', pattern: '../images/brocade/11.png', patternName: '宝相花纹锦',
      width: '82%', height: '93%', scale: '.98'
    },
    {
      name: '胡风华服', role: '丝路新声', verse: '胡姬貌如花，当垆笑春风。',
      copy: '翻领短襦、束腰长袍与高靴构成利落轮廓，珠币额饰和异域披巾记录着长安对西域服饰的吸收与再创造。',
      silhouette: '翻领长袍 · 束腰高靴', palette: '米金 · 赭红 · 黛青', culture: '丝路交流与胡汉交融',
      image: '../images/weave-fashion/figures/02-hu-style-figure.png?v=20260915b', pattern: '../images/brocade/22.png', patternName: '联珠对兽纹锦',
      width: '76%', height: '94%', scale: '1'
    },
    {
      name: '宫宴贵女', role: '宫宴华仪', verse: '云想衣裳花想容，春风拂槛露华浓。',
      copy: '朱红内裙奠定礼序，石青大袖以繁密花鸟锦收束视觉。宽博轮廓与垂坠长佩共同塑造宫宴中端庄而丰丽的盛唐仪态。',
      silhouette: '大袖礼衣 · 高腰长裙', palette: '朱砂 · 石青 · 古绢', culture: '宫宴礼仪与贵族审美',
      image: '../images/weave-fashion/figures/03-blue-red-noblewoman.png', pattern: '../images/brocade/36.png', patternName: '卷草纹锦',
      width: '82%', height: '94%', scale: '1'
    },
    {
      name: '春日仕女', role: '春游芳华', verse: '花时同醉破春愁，醉折花枝作酒筹。',
      copy: '月白轻纱叠覆浅碧襦裙，柔软披帛牵引出春风般的流线。淡彩织纹弱化礼服的厚重，呈现日常游春中的清润与灵动。',
      silhouette: '浅碧襦裙 · 轻纱披帛', palette: '月白 · 浅碧 · 桃粉', culture: '曲江春游与女性风尚',
      image: '../images/weave-fashion/figures/04-spring-maiden.png?v=20260915b', pattern: '../images/brocade/565.png', patternName: '花鸟纹锦',
      width: '80%', height: '94%', scale: '1'
    },
    {
      name: '乐舞仕女', role: '霓裳乐舞', verse: '飘然转旋回雪轻，嫣然纵送游龙惊。',
      copy: '短襦与高腰舞裙释放身体动势，长披帛在旋转中形成连续弧线。朱砂与石青的强对比，让锦纹随舞姿成为可见的节奏。',
      silhouette: '舞襦 · 高腰裙 · 长披帛', palette: '朱砂 · 石青 · 金彩', culture: '宴乐舞蹈与开放气象',
      image: '../images/weave-fashion/figures/05-dancer.png', pattern: '../images/brocade/69.png', patternName: '狩猎纹锦',
      width: '102%', height: '96%', scale: '.94'
    },
    {
      name: '盛唐文士', role: '墨韵衣冠', verse: '笔落惊风雨，诗成泣鬼神。',
      copy: '圆领宽袍以玄青为底，袖缘和下摆集中铺陈团花锦。克制的色面衬托出文士的沉静气质，也让织锦成为身份与修养的含蓄标识。',
      silhouette: '圆领袍 · 幞头 · 革带', palette: '玄青 · 赭红 · 米金', culture: '文人风骨与礼制衣冠',
      image: '../images/weave-fashion/figures/06-scholar.png', pattern: '../images/brocade/88.png', patternName: '绫罗锦绣',
      width: '76%', height: '94%', scale: '1'
    }
  ];

  function initWeaveFashionSection() {
    const section = document.getElementById('brocadeSection');
    const stage = document.getElementById('weaveFashionStage');
    const mirror = document.getElementById('weaveFashionMirror');
    const figure = document.getElementById('weaveFashionFigure');
    const info = document.getElementById('weaveFashionInfo');
    const nav = document.getElementById('weaveFashionNav');
    const ripple = document.getElementById('weaveFashionRipple');
    if (!section || !stage || !mirror || !figure || !info || !nav) return;

    const refs = {
      index: document.getElementById('weaveFashionIndex'), role: document.getElementById('weaveFashionRole'),
      name: document.getElementById('weaveFashionName'), verse: document.getElementById('weaveFashionVerse'),
      copy: document.getElementById('weaveFashionCopy'), silhouette: document.getElementById('weaveFashionSilhouette'),
      palette: document.getElementById('weaveFashionPalette'), culture: document.getElementById('weaveFashionCulture'),
      pattern: document.getElementById('weaveFashionPattern'), patternName: document.getElementById('weaveFashionPatternName')
    };
    let active = 2;
    let switchTimer = 0;

    FIGURES.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === active ? 'true' : 'false');
      button.innerHTML = `<b>${String(index + 1).padStart(2, '0')}</b><span>${item.name}<small>${item.role}</small></span>`;
      button.addEventListener('click', () => select(index));
      nav.appendChild(button);
    });

    const applyContent = (index, source) => {
      const item = FIGURES[index];
      refs.index.textContent = String(index + 1).padStart(2, '0');
      refs.role.textContent = item.role;
      refs.name.textContent = item.name;
      refs.verse.textContent = item.verse;
      refs.copy.textContent = item.copy;
      refs.silhouette.textContent = item.silhouette;
      refs.palette.textContent = item.palette;
      refs.culture.textContent = item.culture;
      refs.pattern.src = item.pattern;
      refs.pattern.alt = `${item.name}对应的${item.patternName}`;
      refs.patternName.textContent = item.patternName;
      figure.style.setProperty('--figure-width', item.width);
      figure.style.setProperty('--figure-height', item.height);
      figure.style.setProperty('--figure-scale', item.scale);
      figure.alt = `${item.name}全身服饰展示`;
      figure.src = source;
      [...nav.children].forEach((button, i) => button.setAttribute('aria-selected', i === index ? 'true' : 'false'));
    };

    async function select(index, immediate = false) {
      if (index === active && !immediate) return;
      window.clearTimeout(switchTimer);
      active = index;
      const item = FIGURES[index];
      if (!immediate) {
        figure.classList.add('is-leaving');
        info.classList.add('is-switching');
        ripple.classList.remove('is-active');
        void ripple.offsetWidth;
        ripple.classList.add('is-active');
      }
      switchTimer = window.setTimeout(() => {
        figure.classList.add('is-entering');
        applyContent(index, item.image);
        const reveal = () => requestAnimationFrame(() => {
          figure.classList.remove('is-leaving', 'is-entering');
          info.classList.remove('is-switching');
        });
        figure.decode ? figure.decode().catch(() => {}).finally(reveal) : reveal();
      }, immediate ? 0 : 260);
    }

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        section.classList.add('is-visible');
        observer.disconnect();
      }
    }, { threshold: .18 });
    observer.observe(section);

    stage.addEventListener('pointermove', event => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 12;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 8;
      mirror.style.setProperty('--mx', `${x.toFixed(2)}px`);
      mirror.style.setProperty('--my', `${y.toFixed(2)}px`);
    });
    stage.addEventListener('pointerleave', () => {
      mirror.style.setProperty('--mx', '0px');
      mirror.style.setProperty('--my', '0px');
    });

    select(active, true);
  }

  window.initWeaveFashionSection = initWeaveFashionSection;
  document.addEventListener('DOMContentLoaded', initWeaveFashionSection);
})();
