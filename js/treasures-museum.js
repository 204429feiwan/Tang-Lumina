/* ============================================================
   大唐遗珍 · 数字博物馆
   数据始终从 treasures.html 原有 .card-museum 读取
   ============================================================ */

const ENABLE_DIGITAL_MUSEUM = true;

(function () {
  'use strict';

  var archivePanelCount = 0;

  if (!ENABLE_DIGITAL_MUSEUM) return;

  function initDigitalMuseum() {
    var body = document.body;
    var sourceSection = document.querySelector('.museum-section');
    if (!body || body.getAttribute('data-page') !== 'treasures' || !sourceSection) return;

    var sourceContainer = sourceSection.querySelector(':scope > .container');
    var sourceCards = Array.from(sourceSection.querySelectorAll('.card-museum'));
    if (!sourceContainer || !sourceCards.length) return;

    var artifacts = sourceCards.map(readArtifact).filter(Boolean);
    appendMasterpieceArtifacts(artifacts);
    if (!artifacts.length) return;

    buildEntrance();
    var museum = buildMuseumJourney(artifacts, sourceContainer, sourceSection);
    buildViewer(artifacts, museum);
    setupReveal(museum.journey);
    setupFloorNavigation(museum.sections);
    setupKilnAmbience(museum.sancaiHall);

    sourceContainer.classList.add('museum-source-content');
    sourceContainer.setAttribute('aria-hidden', 'true');
    body.classList.add('digital-museum-enabled');
  }

  function readArtifact(card, index) {
    var imageWrap = card.querySelector('.museum-img-wrap');
    var image = imageWrap ? imageWrap.querySelector('img') : null;
    var titleNode = card.querySelector('.museum-body h5');
    var eraNode = card.querySelector('.museum-era');
    var descriptionNode = Array.from(card.querySelectorAll('.museum-body p')).find(function (node) {
      return !node.classList.contains('museum-era');
    });

    if (!image || !titleNode) return null;

    var era = eraNode ? eraNode.textContent.trim() : '';
    var eraParts = era.split('·').map(function (part) { return part.trim(); });

    return {
      index: index,
      id: 'TANG · ' + String(index + 1).padStart(3, '0'),
      image: (imageWrap && imageWrap.getAttribute('data-lightbox')) || image.getAttribute('src'),
      alt: image.getAttribute('alt') || titleNode.textContent.trim(),
      title: titleNode.textContent.trim(),
      era: era,
      dynasty: eraParts[0] || '唐',
      material: eraParts.slice(1).join(' · ') || '馆藏文物',
      description: descriptionNode ? descriptionNode.textContent.trim() : '',
      tags: Array.from(card.querySelectorAll('.museum-tag')).map(function (tag) {
        return tag.textContent.trim();
      }).filter(Boolean),
      source: card
    };
  }

  function appendMasterpieceArtifacts(artifacts) {
    var featuredSource = document.getElementById('museumFeaturedSource');
    var cards = featuredSource ? Array.from(featuredSource.content.querySelectorAll('.artifact-card')) : [];
    cards = cards.concat(Array.from(document.querySelectorAll('#masterpieces .artifact-card')));
    cards.forEach(function (card) {
      var title = (card.dataset.title || '').trim();
      if (!title) return;

      var existingIndex = artifacts.findIndex(function (item) { return item.title === title; });
      if (existingIndex >= 0) {
        card.dataset.artifactIndex = String(existingIndex);
        return;
      }

      var hero = card.querySelector('.artifact-hero');
      var eraNode = card.querySelector('.artifact-copy .era');
      var descriptionNode = card.querySelector('.artifact-copy p');
      if (!hero || !hero.getAttribute('src')) return;

      var era = eraNode ? eraNode.textContent.trim() : '';
      var eraParts = era.split('·').map(function (part) { return part.trim(); });
      var index = artifacts.length;
      artifacts.push({
        index: index,
        id: 'TANG · ' + String(index + 1).padStart(3, '0'),
        image: hero.getAttribute('src'),
        alt: hero.getAttribute('alt') || title,
        title: title,
        era: era,
        dynasty: eraParts[0] || '唐',
        material: eraParts.slice(1).join(' · ') || '馆藏文物',
        description: descriptionNode ? descriptionNode.textContent.trim() : '',
        tags: [],
        source: card
      });
      card.dataset.artifactIndex = String(index);
    });
  }

  function buildEntrance() {
    var hero = document.querySelector('.page-hero');
    if (!hero) return;

    hero.id = 'museumEntrance';
    var entry = document.createElement('div');
    entry.className = 'museum-entry';
    entry.innerHTML =
      '<div class="museum-entry-dust" aria-hidden="true"></div>' +
      '<div class="museum-entry-copy">' +
        '<p class="museum-entry-kicker">DIGITAL EXHIBITION · 大唐器物馆</p>' +
        '<h1>大唐遗珍</h1>' +
        '<p class="museum-entry-subtitle">一器一世界 · 一物见盛唐</p>' +
        '<p class="museum-entry-note">每一件文物，都是盛唐文明的见证者</p>' +
        '<button class="museum-entry-scroll" type="button">向下探索馆藏</button>' +
      '</div>' +
      '<div class="museum-entry-seal" aria-hidden="true"><span>盛唐<br>雅粹</span></div>';

    hero.appendChild(entry);
    entry.querySelector('.museum-entry-scroll').addEventListener('click', function () {
      var firstHall = document.getElementById('museumHighlights');
      if (firstHall) firstHall.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function buildMuseumJourney(artifacts, sourceContainer, sourceSection) {
    var journey = document.createElement('div');
    journey.className = 'museum-journey';

    var featuredTitles = [
      '宝相花纹铜镜',
      '唐代青釉人首鸡身俑',
      '唐代折股花卉纹钿头钗',
      '金背瑞兽葡萄镜'
    ];
    var featured = featuredTitles.map(function (title) {
      return artifacts.find(function (item) { return item.title === title; });
    }).filter(Boolean);

    var metals = artifacts.slice(0, 12);
    var sancai = artifacts.filter(function (item) {
      return item.title.indexOf('三彩') !== -1 || item.era.indexOf('三彩') !== -1;
    });

    var metalSelection = pickArtifacts(metals, [
      '白玉飞天',
      '鎏金鹦鹉纹提梁银罐',
      '花鸟缠葡萄纹银杯',
      '三彩龙耳瓶',
      '唐越窑荷叶盏托',
      '飞天宝石八棱镜'
    ]);
    var metalArchive = metals.filter(function (item) { return metalSelection.indexOf(item) === -1; });

    var sancaiSelection = pickArtifacts(sancai, [
      '三彩梳妆女坐俑',
      '唐三彩载货骆驼俑',
      '三彩凤首壶',
      '唐三彩骑马女俑',
      '三彩贴塑璎珞纹盖罐'
    ]);
    var sancaiArchive = sancai.filter(function (item) { return sancaiSelection.indexOf(item) === -1; });

    var featuredHall = createHall(
      'museumHighlights',
      'museum-hall hall-featured',
      '02 · MASTERPIECES',
      '镇馆之宝',
      '从铜镜、青釉与金银首饰中择取四件代表作，让器物离开展柜列表，在安静的聚光下成为真正的观看中心。'
    );
    var featuredShowcase = createFeaturedShowcase(featured);
    featuredHall.inner.appendChild(featuredShowcase.element);
    journey.appendChild(featuredHall.section);

    var collectionHall = createHall(
      'museumCollection',
      'museum-hall hall-collection',
      '03 · TANG TREASURES',
      '盛唐珍器 · 精选展陈',
      '六件盛唐珍器依次展开。轻触展签，让器物随立体翻页转入视野；其余馆藏收纳于下方目录。'
    );
    collectionHall.inner.appendChild(createDisplayTitle('LEVEL A · 本馆精选', metalSelection.length + ' 件'));
    collectionHall.inner.appendChild(createMetalFlipExhibit(metalSelection, collectionHall.section));
    collectionHall.inner.appendChild(createArchivePanel(
      metalArchive,
      '盛唐珍器馆藏目录',
      '本展厅共 ' + metals.length + ' 件 · 展开其余 ' + metalArchive.length + ' 件',
      '查看全部馆藏'
    ));
    journey.appendChild(collectionHall.section);

    var sancaiHall = createHall(
      'museumSancai',
      'museum-hall hall-sancai',
      '04 · SPECIAL EXHIBITION',
      '窑火千年 · 唐三彩',
      '从深褐展厅步入窑火之境。开启炉门，观看釉色流动，再向下滚动展开三件文物。'
    );
    var kilnHall = document.createElement('div');
    kilnHall.className = 'kiln-hall museum-reveal';
    kilnHall.innerHTML = '<span class="kiln-hall-label">KILN GALLERY · 开炉观展</span>';
    var kilnScene = document.getElementById('kilnScene');
    if (kilnScene) kilnHall.appendChild(kilnScene);
    sancaiHall.inner.appendChild(kilnHall);

    sancaiHall.inner.appendChild(createDisplayTitle('LEVEL A · 窑火精选', sancaiSelection.length + ' 件'));
    sancaiHall.inner.appendChild(createSancaiFlipExhibit(sancaiSelection));
    sancaiHall.inner.appendChild(createArchivePanel(
      sancaiArchive,
      '唐三彩 · 考古档案',
      '本展厅共 ' + sancai.length + ' 件 · 展开其余 ' + sancaiArchive.length + ' 件',
      '查看唐三彩馆藏'
    ));
    journey.appendChild(sancaiHall.section);

    sourceSection.insertBefore(journey, sourceContainer);

    return {
      journey: journey,
      featured: featuredShowcase,
      sancaiHall: sancaiHall.section,
      sections: [
        { id: 'museumEntrance', number: '01', label: '入口' },
        { id: 'museumHighlights', number: '02', label: '镇馆之宝' },
        { id: 'museumCollection', number: '03', label: '盛唐珍器' },
        { id: 'museumSancai', number: '04', label: '唐三彩' }
      ]
    };
  }

  function pickArtifacts(items, titles) {
    return titles.map(function (title) {
      return items.find(function (item) { return item.title === title; });
    }).filter(Boolean);
  }

  function createHall(id, className, kicker, title, description) {
    var section = document.createElement('section');
    section.id = id;
    section.className = className;

    var inner = document.createElement('div');
    inner.className = 'museum-hall-inner';

    var heading = document.createElement('header');
    heading.className = 'museum-hall-heading museum-reveal';

    var titleBlock = document.createElement('div');
    var kickerNode = document.createElement('p');
    kickerNode.className = 'hall-kicker';
    kickerNode.textContent = kicker;
    var titleNode = document.createElement('h2');
    titleNode.textContent = title;
    titleBlock.appendChild(kickerNode);
    titleBlock.appendChild(titleNode);

    var descriptionNode = document.createElement('p');
    descriptionNode.textContent = description;
    heading.appendChild(titleBlock);
    heading.appendChild(descriptionNode);
    inner.appendChild(heading);
    section.appendChild(inner);

    return { section: section, inner: inner };
  }

  function createFeaturedShowcase(items) {
    var element = document.createElement('div');
    element.className = 'featured-showcase museum-reveal';
    element.innerHTML =
      '<button class="featured-stage" type="button" aria-label="打开镇馆之宝详情">' +
        '<span class="featured-object"><img alt=""></span>' +
        '<span class="featured-observe-hint">移动鼠标观察 · 点击进入细节模式</span>' +
      '</button>' +
      '<aside class="featured-label">' +
        '<div class="featured-label-copy">' +
          '<p class="museum-label-kicker">MUSEUM MASTERPIECE</p>' +
          '<h3></h3>' +
          '<div class="featured-meta"><span class="featured-dynasty"></span><span class="featured-material"></span></div>' +
          '<p class="featured-description"></p>' +
          '<div class="museum-tags featured-tags"></div>' +
        '</div>' +
        '<div class="featured-nav">' +
          '<div class="featured-progress"><strong>01</strong><span>/ 04</span></div>' +
          '<div class="featured-thumbs"></div>' +
          '<div class="featured-arrows"><button class="museum-line-button featured-prev" type="button">← 上一件</button><button class="museum-line-button featured-next" type="button">下一件 →</button></div>' +
        '</div>' +
      '</aside>';

    var stage = element.querySelector('.featured-stage');
    var object = element.querySelector('.featured-object');
    var image = object.querySelector('img');
    var labelCopy = element.querySelector('.featured-label-copy');
    var title = element.querySelector('.featured-label h3');
    var dynasty = element.querySelector('.featured-dynasty');
    var material = element.querySelector('.featured-material');
    var description = element.querySelector('.featured-description');
    var tags = element.querySelector('.featured-tags');
    var progress = element.querySelector('.featured-progress strong');
    var total = element.querySelector('.featured-progress span');
    var thumbs = element.querySelector('.featured-thumbs');
    var current = 0;
    var transitionTimer = 0;
    var viewerOpener = function () {};

    total.textContent = '/ ' + String(items.length).padStart(2, '0');

    items.forEach(function (item, index) {
      var button = document.createElement('button');
      button.className = 'featured-thumb';
      button.type = 'button';
      button.setAttribute('aria-label', '展示' + item.title);
      var thumbImage = document.createElement('img');
      thumbImage.src = item.image;
      thumbImage.alt = '';
      thumbImage.loading = 'lazy';
      button.appendChild(thumbImage);
      button.addEventListener('click', function () { setFeatured(index, true); });
      thumbs.appendChild(button);
    });

    function render(item, index) {
      image.src = item.image;
      image.alt = item.alt;
      title.textContent = item.title;
      dynasty.textContent = '时代 · ' + item.dynasty;
      material.textContent = '材质 · ' + item.material;
      description.textContent = item.description;
      progress.textContent = String(index + 1).padStart(2, '0');
      stage.setAttribute('aria-label', '查看' + item.title + '详情');
      tags.replaceChildren();
      item.tags.forEach(function (tag) {
        var tagNode = document.createElement('span');
        tagNode.textContent = tag;
        tags.appendChild(tagNode);
      });
      Array.from(thumbs.children).forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle('is-active', thumbIndex === index);
        thumb.setAttribute('aria-pressed', thumbIndex === index ? 'true' : 'false');
      });
    }

    function setFeatured(next, animate) {
      if (!items.length) return;
      next = (next + items.length) % items.length;
      if (!animate || next === current) {
        current = next;
        render(items[current], current);
        return;
      }

      window.clearTimeout(transitionTimer);
      object.classList.remove('is-entering');
      labelCopy.classList.remove('is-entering');
      object.classList.add('is-leaving');
      labelCopy.classList.add('is-leaving');

      transitionTimer = window.setTimeout(function () {
        current = next;
        render(items[current], current);
        object.classList.remove('is-leaving');
        labelCopy.classList.remove('is-leaving');
        object.classList.add('is-entering');
        labelCopy.classList.add('is-entering');
        window.setTimeout(function () {
          object.classList.remove('is-entering');
          labelCopy.classList.remove('is-entering');
        }, 720);
      }, 260);
    }

    element.querySelector('.featured-prev').addEventListener('click', function () { setFeatured(current - 1, true); });
    element.querySelector('.featured-next').addEventListener('click', function () { setFeatured(current + 1, true); });
    stage.addEventListener('click', function () {
      if (items[current]) viewerOpener(items[current].index, stage);
    });

    var pendingPointerFrame = 0;
    stage.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      if (pendingPointerFrame) return;
      pendingPointerFrame = window.requestAnimationFrame(function () {
        pendingPointerFrame = 0;
        var rect = stage.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        var y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        stage.style.setProperty('--tilt-x', ((.5 - y) * 3).toFixed(2) + 'deg');
        stage.style.setProperty('--tilt-y', ((x - .5) * 5).toFixed(2) + 'deg');
        stage.style.setProperty('--light-x', (38 + x * 24).toFixed(1) + '%');
        stage.style.setProperty('--light-y', (34 + y * 18).toFixed(1) + '%');
      });
    });

    stage.addEventListener('pointerleave', function () {
      if (pendingPointerFrame) window.cancelAnimationFrame(pendingPointerFrame);
      pendingPointerFrame = 0;
      stage.style.setProperty('--tilt-x', '0deg');
      stage.style.setProperty('--tilt-y', '0deg');
      stage.style.setProperty('--light-x', '50%');
      stage.style.setProperty('--light-y', '42%');
    });

    if (items.length) render(items[0], 0);

    return {
      element: element,
      setViewerOpener: function (opener) { viewerOpener = opener; }
    };
  }

  function createArtifactGrid(items, gridClass, itemClass, sizePattern) {
    var grid = document.createElement('div');
    grid.className = gridClass;

    items.forEach(function (item, index) {
      var wrapper = document.createElement('article');
      var size = sizePattern ? sizePattern[index % sizePattern.length] : '';
      wrapper.className = itemClass + (size ? ' size-' + size : '') + ' museum-reveal';
      wrapper.style.setProperty('--reveal-delay', (index % 4) * 55 + 'ms');

      var button = document.createElement('button');
      button.className = 'museum-collection-card';
      button.type = 'button';
      button.dataset.artifactIndex = String(item.index);
      button.setAttribute('aria-label', '查看藏品：' + item.title);

      var imageWrap = document.createElement('span');
      imageWrap.className = 'museum-card-image';
      var image = document.createElement('img');
      image.src = item.image;
      image.alt = item.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      imageWrap.appendChild(image);

      var caption = document.createElement('span');
      caption.className = 'museum-card-caption';
      var number = document.createElement('span');
      number.className = 'museum-card-number';
      number.textContent = 'DIGITAL COLLECTION · ' + item.id;
      var heading = document.createElement('span');
      heading.className = 'museum-card-title';
      heading.textContent = item.title;
      var era = document.createElement('span');
      era.className = 'museum-card-era';
      era.textContent = item.era;
      var description = document.createElement('span');
      description.className = 'museum-card-description';
      description.textContent = item.description;

      caption.appendChild(number);
      caption.appendChild(heading);
      caption.appendChild(era);
      caption.appendChild(description);
      button.appendChild(imageWrap);
      button.appendChild(caption);
      wrapper.appendChild(button);
      grid.appendChild(wrapper);
    });

    setupGalleryFocus(grid);
    return grid;
  }

  function createMetalFlipExhibit(items, hall) {
    var exhibit = document.createElement('section');
    exhibit.className = 'metal-flip-exhibit metal-reference-flip museum-reveal';
    exhibit.setAttribute('aria-label', '盛唐珍器三维翻转展陈');
    if (!items.length) return exhibit;

    exhibit.innerHTML =
      '<div class="metal-flip-topline"><span>TANG TREASURES · OBJECT THEATRE</span><span>点击展签，翻转赏器</span></div>' +
      '<div class="metal-flip-stage"></div>';

    var backdrop = document.createElement('div');
    backdrop.className = 'metal-reference-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    var backgrounds = items.map(function (item) {
      var image = document.createElement('img');
      image.src = item.image;
      image.alt = '';
      image.decoding = 'async';
      backdrop.appendChild(image);
      return image;
    });
    hall.insertBefore(backdrop, hall.firstChild);

    var stage = exhibit.querySelector('.metal-flip-stage');
    var current = 0;
    var cards = items.map(function (item, index) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'museum-collection-card metal-reference-card';
      card.dataset.artifactIndex = String(item.index);
      card.style.setProperty('--metal-reference-image', 'url("' + encodeURI(item.image) + '")');
      card.setAttribute('aria-label', '查看藏品：' + item.title);
      card.innerHTML =
        '<span class="metal-reference-rotor">' +
          '<span class="metal-reference-face metal-reference-front" aria-hidden="true">' +
            '<img draggable="false">' +
            '<span class="metal-reference-front-title"></span>' +
          '</span>' +
          '<span class="metal-reference-face metal-reference-back">' +
            '<img class="metal-reference-texture" alt="" draggable="false">' +
            '<span class="metal-flip-copy">' +
              '<span class="metal-flip-ordinal"></span>' +
              '<span class="metal-flip-name"></span>' +
              '<span class="metal-flip-era"></span>' +
              '<span class="metal-flip-description"></span>' +
              '<span class="metal-flip-detail">查看文物细节 <span aria-hidden="true">↗</span></span>' +
            '</span>' +
          '</span>' +
        '</span>';
      var image = card.querySelector('.metal-reference-front img');
      image.src = item.image;
      image.alt = item.alt;
      card.querySelector('.metal-reference-texture').src = item.image;
      card.querySelector('.metal-reference-front-title').textContent = item.title;
      card.querySelector('.metal-flip-ordinal').textContent =
        String(index + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0') + ' · ' + item.id;
      card.querySelector('.metal-flip-name').textContent = item.title;
      card.querySelector('.metal-flip-era').textContent = item.era;
      card.querySelector('.metal-flip-description').textContent = item.description;
      card.addEventListener('pointerenter', function () { showCard(index, true); });
      card.addEventListener('pointerleave', function () {
        if (document.activeElement !== card) card.classList.remove('is-flipped');
      });
      card.addEventListener('focus', function () { showCard(index, true); });
      card.addEventListener('blur', function () {
        if (!card.matches(':hover')) card.classList.remove('is-flipped');
      });
      stage.appendChild(card);
      return card;
    });

    function showCard(index, reveal) {
      current = (index + items.length) % items.length;
      exhibit.dataset.referenceIndex = String(current);
      cards.forEach(function (card, cardIndex) {
        card.classList.toggle('is-active', cardIndex === current);
        card.classList.toggle('is-flipped', cardIndex === current && reveal);
      });
      backgrounds.forEach(function (image, imageIndex) {
        image.classList.toggle('is-active', imageIndex === current);
      });
    }

    showCard(0, false);
    exhibit.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      showCard(current + (event.key === 'ArrowRight' ? 1 : -1), true);
      cards[current].focus({ preventScroll: true });
    });
    return exhibit;
  }


  function createSancaiFlipExhibit(items) {
    var exhibit = document.createElement('section');
    exhibit.className = 'sancai-flip-exhibit museum-reveal';
    exhibit.setAttribute('aria-label', '唐三彩滚动翻转展陈');

    var introduction = document.createElement('div');
    introduction.className = 'sancai-flip-intro';
    introduction.innerHTML =
      '<div><p class="sancai-flip-kicker">ONE OBJECT · THREE STORIES</p>' +
      '<h4>一器展开，三彩入眼</h4></div>' +
      '<p class="sancai-flip-instruction">向下滚动，看一件器物化作三张独立展签；向上滚动，可回看完整画面。</p>';
    exhibit.appendChild(introduction);

    var track = document.createElement('div');
    track.className = 'sancai-flip-track';
    var sticky = document.createElement('div');
    sticky.className = 'sancai-flip-sticky';
    var stage = document.createElement('div');
    stage.className = 'sancai-flip-stage';
    var cards = [];
    var rotors = [];
    var heroImages = [];
    var cardImages = [];
    var cardNumbers = [];
    var cardTitles = [];
    var cardEras = [];

    items.slice(0, 3).forEach(function (_, index) {
      var card = document.createElement('button');
      card.className = 'sancai-flip-card sancai-open-detail';
      card.type = 'button';
      card.disabled = true;
      card.setAttribute('aria-label', '查看文物详情');

      var rotor = document.createElement('span');
      rotor.className = 'sancai-flip-rotor';
      var front = document.createElement('span');
      front.className = 'sancai-flip-face sancai-flip-front';
      var heroImage = document.createElement('img');
      heroImage.className = 'sancai-flip-hero-image';
      heroImage.alt = '';
      heroImage.draggable = false;
      front.appendChild(heroImage);
      heroImages.push(heroImage);

      var back = document.createElement('span');
      back.className = 'sancai-flip-face sancai-flip-back';
      var artifactImage = document.createElement('img');
      artifactImage.className = 'sancai-flip-card-image';
      artifactImage.alt = '';
      artifactImage.draggable = false;
      back.appendChild(artifactImage);
      cardImages.push(artifactImage);
      var caption = document.createElement('span');
      caption.className = 'sancai-flip-card-caption';
      var number = document.createElement('span');
      number.className = 'sancai-flip-card-number';
      var title = document.createElement('span');
      title.className = 'sancai-flip-card-title';
      var era = document.createElement('span');
      era.className = 'sancai-flip-card-era';
      caption.appendChild(number);
      caption.appendChild(title);
      caption.appendChild(era);
      back.appendChild(caption);
      cardNumbers.push(number);
      cardTitles.push(title);
      cardEras.push(era);
      rotor.appendChild(front);
      rotor.appendChild(back);
      card.appendChild(rotor);
      stage.appendChild(card);
      cards.push(card);
      rotors.push(rotor);
    });

    var heroCaption = document.createElement('div');
    heroCaption.className = 'sancai-flip-hero-caption';
    heroCaption.innerHTML = '<span>01 / 05 · TANG SANCAI</span><h5></h5><p>继续向下滚动，展开三件文物</p>';
    sticky.appendChild(stage);
    sticky.appendChild(heroCaption);
    track.appendChild(sticky);
    exhibit.appendChild(track);

    var footer = document.createElement('div');
    footer.className = 'sancai-flip-footer';
    footer.innerHTML =
      '<p>点击卡片查看细节；在下方选择三卡起点，轮换展出全部五件。</p>' +
      '<a href="../images/treasures/唐三彩乐舞俑-横幅.jpg"' +
      ' target="_blank" rel="noopener noreferrer">查看首屏原图</a>';
    exhibit.appendChild(footer);

    var selector = document.createElement('div');
    selector.className = 'sancai-flip-selector';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', '选择三卡起点');
    var selectors = items.map(function (item, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'sancai-flip-choice';
      button.setAttribute('aria-pressed', 'false');
      var number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      var title = document.createElement('span');
      title.textContent = item.title;
      button.appendChild(number);
      button.appendChild(title);
      button.addEventListener('click', function () { select(index); });
      selector.appendChild(button);
      return button;
    });
    exhibit.appendChild(selector);

    items.forEach(function (item) {
      var image = new Image();
      image.src = item.image;
    });
    var wideCamelPhoto = '../images/treasures/唐三彩乐舞俑-横幅.jpg';
    var widePhotoPreload = new Image();
    widePhotoPreload.src = wideCamelPhoto;
    heroImages.forEach(function (image) { image.src = wideCamelPhoto; });
    heroCaption.querySelector('h5').textContent = '唐三彩乐舞俑';

    function select(index) {
      cards.forEach(function (card, panelIndex) {
        var artifact = items[(index + panelIndex) % items.length];
        card.dataset.artifactIndex = String(artifact.index);
        card.setAttribute('aria-label', '查看' + artifact.title + '详情');
        cardImages[panelIndex].src = artifact.image;
        cardNumbers[panelIndex].textContent = String((index + panelIndex) % items.length + 1).padStart(2, '0');
        cardTitles[panelIndex].textContent = artifact.title;
        cardEras[panelIndex].textContent = artifact.era;
      });
      selectors.forEach(function (button, buttonIndex) {
        var active = buttonIndex === index;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    select(0);

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var current = 0;
    var target = 0;
    var frame = 0;
    var interactive = false;

    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function ease(value) {
      value = clamp(value);
      return value * value * (3 - 2 * value);
    }

    function paint(progress) {
      var spread = ease((progress - .03) / .65);
      var turn = ease((progress - .13) / .73);
      var pose = ease((progress - .57) / .43);
      var gap = spread * 20;
      stage.style.gap = gap.toFixed(2) + 'px';
      stage.style.setProperty('--sancai-panel-gap', gap.toFixed(2) + 'px');
      heroCaption.style.opacity = String(clamp(1 - progress * 3.7));
      cards.forEach(function (card, index) {
        var tilt = [-7, 0, 7][index] * pose;
        var lift = [12, -14, 12][index] * pose;
        card.style.transform = 'translateY(' + lift.toFixed(2) + 'px) rotateZ(' + tilt.toFixed(2) + 'deg) scale(' + (1 - spread * .055).toFixed(4) + ')';
        rotors[index].style.transform = 'rotateY(' + (180 * turn).toFixed(2) + 'deg)';
      });
      var canOpen = progress > .81;
      if (canOpen !== interactive) {
        interactive = canOpen;
        cards.forEach(function (card) { card.disabled = !canOpen; });
      }
    }

    function animate() {
      frame = 0;
      current += (target - current) * .22;
      if (Math.abs(target - current) < .0008) current = target;
      paint(current);
      if (current !== target) frame = window.requestAnimationFrame(animate);
    }

    function updateTarget() {
      var distance = Math.max(1, track.offsetHeight - sticky.offsetHeight);
      target = clamp((window.innerHeight * .08 - track.getBoundingClientRect().top) / distance);
      if (reducedMotion.matches) {
        current = target < .5 ? 0 : 1;
        target = current;
        paint(current);
      } else if (!frame) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updateTarget);
    window.requestAnimationFrame(updateTarget);
    return exhibit;
  }

  function createDisplayTitle(title, count) {
    var heading = document.createElement('div');
    heading.className = 'curated-display-title museum-reveal';

    var label = document.createElement('h3');
    label.textContent = title;
    var total = document.createElement('span');
    total.textContent = count;

    heading.appendChild(label);
    heading.appendChild(total);
    return heading;
  }

  function createArchiveGrid(items, extraClass) {
    var grid = document.createElement('div');
    grid.className = 'museum-archive-grid' + (extraClass ? ' ' + extraClass : '');

    items.forEach(function (item) {
      var button = document.createElement('button');
      button.className = 'museum-archive-card';
      button.type = 'button';
      button.dataset.artifactIndex = String(item.index);
      button.setAttribute('aria-label', '查看藏品：' + item.title);

      var imageWrap = document.createElement('span');
      imageWrap.className = 'archive-thumb';
      var image = document.createElement('img');
      image.src = item.image;
      image.alt = item.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      imageWrap.appendChild(image);

      var text = document.createElement('span');
      text.className = 'archive-card-copy';
      var number = document.createElement('span');
      number.className = 'archive-number';
      number.textContent = item.id;
      var title = document.createElement('span');
      title.className = 'archive-title';
      title.textContent = item.title;
      var era = document.createElement('span');
      era.className = 'archive-era';
      era.textContent = item.era;
      text.appendChild(number);
      text.appendChild(title);
      text.appendChild(era);

      var action = document.createElement('span');
      action.className = 'archive-action';
      action.textContent = '查看详情 ＋';

      button.appendChild(imageWrap);
      button.appendChild(text);
      button.appendChild(action);
      grid.appendChild(button);
    });

    return grid;
  }

  function createArchivePanel(items, title, meta, openLabel) {
    archivePanelCount += 1;
    var panel = document.createElement('section');
    panel.className = 'museum-archive-panel museum-reveal';

    var heading = document.createElement('div');
    heading.className = 'archive-panel-heading';
    var copy = document.createElement('div');
    var kicker = document.createElement('p');
    kicker.className = 'archive-kicker';
    kicker.textContent = 'LEVEL B · MUSEUM ARCHIVE';
    var titleNode = document.createElement('h3');
    titleNode.textContent = title;
    var metaNode = document.createElement('p');
    metaNode.className = 'archive-meta';
    metaNode.textContent = meta;
    copy.appendChild(kicker);
    copy.appendChild(titleNode);
    copy.appendChild(metaNode);

    var toggle = document.createElement('button');
    var collapseId = 'museumArchivePanel' + archivePanelCount;
    toggle.className = 'archive-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', collapseId);
    toggle.innerHTML = '<span>' + openLabel + '</span><i aria-hidden="true"></i>';
    heading.appendChild(copy);
    heading.appendChild(toggle);

    var collapse = document.createElement('div');
    collapse.id = collapseId;
    collapse.className = 'archive-collapse';
    collapse.setAttribute('aria-hidden', 'true');
    collapse.setAttribute('inert', '');
    var inner = document.createElement('div');
    inner.className = 'archive-collapse-inner';
    inner.appendChild(createArchiveGrid(items));
    collapse.appendChild(inner);

    toggle.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.querySelector('span').textContent = isOpen ? '收起馆藏' : openLabel;
      collapse.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      if (isOpen) collapse.removeAttribute('inert');
      else collapse.setAttribute('inert', '');
    });

    panel.appendChild(heading);
    panel.appendChild(collapse);
    return panel;
  }

  function setupGalleryFocus(grid) {
    grid.addEventListener('pointerover', function (event) {
      var card = event.target.closest('.museum-collection-card');
      if (!card || !grid.contains(card)) return;
      grid.classList.add('is-inspecting');
      Array.from(grid.children).forEach(function (item) {
        item.classList.toggle('is-hovered', item.contains(card));
      });
    });

    grid.addEventListener('pointerleave', function () {
      grid.classList.remove('is-inspecting');
      Array.from(grid.children).forEach(function (item) { item.classList.remove('is-hovered'); });
    });
  }

  function buildViewer(artifacts, museum) {
    var viewer = document.createElement('div');
    viewer.className = 'museum-viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-hidden', 'true');
    viewer.setAttribute('aria-label', '沉浸式藏品详情');
    viewer.inert = true;
    viewer.innerHTML =
      '<button class="museum-viewer-close" type="button" aria-label="关闭藏品详情">×</button>' +
      '<div class="viewer-stage">' +
        '<img class="viewer-image" alt="" draggable="false">' +
        '<div class="viewer-tools" aria-label="文物观察工具">' +
          '<button type="button" data-viewer-action="zoom-out" aria-label="缩小">−</button>' +
          '<span class="viewer-zoom-value">100%</span>' +
          '<button type="button" data-viewer-action="zoom-in" aria-label="放大">＋</button>' +
          '<button type="button" data-viewer-action="reset">复位</button>' +
        '</div>' +
      '</div>' +
      '<aside class="viewer-label">' +
        '<div class="viewer-label-content">' +
          '<p class="viewer-kicker">DIGITAL COLLECTION · 数字藏品编号</p>' +
          '<div class="viewer-number"></div>' +
          '<h2></h2>' +
          '<div class="viewer-era"></div>' +
          '<p class="viewer-description"></p>' +
          '<div class="museum-tags viewer-tags"></div>' +
          '<p class="viewer-digital-note">页面编号仅用于本次数字展陈排序，并非真实博物馆馆藏编号。</p>' +
        '</div>' +
        '<div class="viewer-pagination">' +
          '<button type="button" data-viewer-action="prev">← 上一件</button>' +
          '<button type="button" data-viewer-action="next">下一件 →</button>' +
        '</div>' +
      '</aside>';

    document.body.appendChild(viewer);

    var closeButton = viewer.querySelector('.museum-viewer-close');
    var stage = viewer.querySelector('.viewer-stage');
    var image = viewer.querySelector('.viewer-image');
    var labelContent = viewer.querySelector('.viewer-label-content');
    var number = viewer.querySelector('.viewer-number');
    var title = viewer.querySelector('.viewer-label h2');
    var era = viewer.querySelector('.viewer-era');
    var description = viewer.querySelector('.viewer-description');
    var tags = viewer.querySelector('.viewer-tags');
    var zoomValue = viewer.querySelector('.viewer-zoom-value');
    var currentIndex = 0;
    var scale = 1;
    var translateX = 0;
    var translateY = 0;
    var dragging = false;
    var dragMoved = false;
    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var originX = 0;
    var originY = 0;
    var lastFocus = null;
    var capturedTrigger = null;
    var backgroundState = [];
    var changeTimer = 0;

    function render(index, animate) {
      currentIndex = (index + artifacts.length) % artifacts.length;
      var item = artifacts[currentIndex];

      function updateContent() {
        image.src = item.image;
        image.alt = item.alt;
        number.textContent = item.id;
        title.textContent = item.title;
        era.textContent = '时代 · ' + item.dynasty + '　　材质 · ' + item.material;
        description.textContent = item.description;
        tags.replaceChildren();
        item.tags.forEach(function (tag) {
          var tagNode = document.createElement('span');
          tagNode.textContent = tag;
          tags.appendChild(tagNode);
        });
        resetView(false);
      }

      window.clearTimeout(changeTimer);
      if (!animate) {
        updateContent();
        return;
      }

      image.classList.add('is-changing');
      labelContent.classList.add('is-changing');
      changeTimer = window.setTimeout(function () {
        updateContent();
        image.classList.remove('is-changing');
        labelContent.classList.remove('is-changing');
      }, 220);
    }

    // Capture the real card before the collection strip dispatches its hidden proxy click.
    function captureTrigger(event) {
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      var trigger = event.target.closest('.featured-stage, [data-artifact-index]');
      if (trigger && !trigger.hidden && !trigger.closest('[inert]')) capturedTrigger = trigger;
    }
    document.addEventListener('click', captureTrigger, true);
    document.addEventListener('keydown', captureTrigger, true);

    function open(index, trigger) {
      if (viewer.classList.contains('is-open')) return;
      lastFocus = trigger || capturedTrigger || document.activeElement;
      capturedTrigger = null;
      render(index, false);
      viewer.inert = false;
      viewer.classList.add('is-open');
      viewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('museum-viewer-open');
      closeButton.focus({ preventScroll: true });
      backgroundState = Array.from(document.body.children).filter(function (element) {
        return element !== viewer;
      }).map(function (element) {
        var state = { element: element, inert: element.inert };
        element.inert = true;
        return state;
      });
    }

    function close() {
      if (!viewer.classList.contains('is-open')) return;
      backgroundState.forEach(function (state) { state.element.inert = state.inert; });
      backgroundState = [];
      viewer.classList.remove('is-open');
      viewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('museum-viewer-open');
      resetView(false);
      var returnTarget = lastFocus;
      if (!returnTarget || !returnTarget.isConnected || returnTarget.closest('[inert]') ||
          returnTarget.disabled || !returnTarget.getClientRects().length) {
        returnTarget = museum.featured.element.querySelector('.featured-stage');
      }
      returnTarget.focus({ preventScroll: true });
      lastFocus = null;
      viewer.inert = true;
    }

    function clampPan() {
      var maxX = Math.max(0, stage.clientWidth * (scale - 1) * .42);
      var maxY = Math.max(0, stage.clientHeight * (scale - 1) * .42);
      translateX = Math.max(-maxX, Math.min(maxX, translateX));
      translateY = Math.max(-maxY, Math.min(maxY, translateY));
    }

    function updateTransform(smooth) {
      clampPan();
      image.classList.toggle('is-resetting', Boolean(smooth));
      image.style.transform = 'translate3d(' + translateX.toFixed(1) + 'px,' + translateY.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
      zoomValue.textContent = Math.round(scale * 100) + '%';
      if (smooth) window.setTimeout(function () { image.classList.remove('is-resetting'); }, 460);
    }

    function setScale(nextScale) {
      scale = Math.max(1, Math.min(2, nextScale));
      if (scale === 1) {
        translateX = 0;
        translateY = 0;
      }
      updateTransform(true);
    }

    function resetView(smooth) {
      scale = 1;
      translateX = 0;
      translateY = 0;
      updateTransform(smooth !== false);
    }

    closeButton.addEventListener('click', close);
    viewer.querySelector('[data-viewer-action="prev"]').addEventListener('click', function () { render(currentIndex - 1, true); });
    viewer.querySelector('[data-viewer-action="next"]').addEventListener('click', function () { render(currentIndex + 1, true); });
    viewer.querySelector('[data-viewer-action="zoom-in"]').addEventListener('click', function () { setScale(scale + .2); });
    viewer.querySelector('[data-viewer-action="zoom-out"]').addEventListener('click', function () { setScale(scale - .2); });
    viewer.querySelector('[data-viewer-action="reset"]').addEventListener('click', function () { resetView(true); });

    stage.addEventListener('wheel', function (event) {
      if (!viewer.classList.contains('is-open')) return;
      event.preventDefault();
      setScale(scale + (event.deltaY < 0 ? .12 : -.12));
    }, { passive: false });

    stage.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || scale <= 1 || event.target.closest('.viewer-tools')) return;
      dragging = true;
      dragMoved = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      originX = translateX;
      originY = translateY;
      stage.setPointerCapture(pointerId);
      stage.classList.add('is-dragging');
      image.classList.remove('is-resetting');
    });

    stage.addEventListener('pointermove', function (event) {
      if (!dragging || event.pointerId !== pointerId) return;
      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true;
      translateX = originX + dx;
      translateY = originY + dy;
      updateTransform(false);
    });

    function finishDrag(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
      pointerId = null;
      if (!dragMoved && scale > 1) resetView(true);
    }

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
    stage.addEventListener('dblclick', function (event) {
      event.preventDefault();
      resetView(true);
    });

    document.addEventListener('keydown', function (event) {
      if (!viewer.classList.contains('is-open')) return;
      if (event.key === 'Tab') {
        var controls = Array.from(viewer.querySelectorAll('button:not(:disabled)'));
        var first = controls[0];
        var last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'ArrowLeft') render(currentIndex - 1, true);
      if (event.key === 'ArrowRight') render(currentIndex + 1, true);
    });

    document.addEventListener('click', function (event) {
      var card = event.target.closest('.museum-collection-card, .museum-archive-card, .sancai-open-detail');
      if (!card) return;
      var index = Number(card.dataset.artifactIndex);
      if (Number.isInteger(index)) open(index, card.hidden ? capturedTrigger : card);
    });

    museum.featured.setViewerOpener(open);
  }

  function setupReveal(root) {
    var items = Array.from(root.querySelectorAll('.museum-reveal'));
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = entry.target.style.getPropertyValue('--reveal-delay') || '0ms';
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  function setupFloorNavigation(sections) {
    var nav = document.createElement('nav');
    nav.className = 'museum-floor-nav';
    nav.setAttribute('aria-label', '展厅楼层导览');

    sections.forEach(function (section, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.target = section.id;
      button.innerHTML = '<span>' + section.number + '</span><span>' + section.label + '</span>';
      button.addEventListener('click', function () {
        var target = document.getElementById(section.id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      if (index === 0) button.classList.add('is-active');
      nav.appendChild(button);
    });

    document.body.appendChild(nav);
    var targets = sections.map(function (section) { return document.getElementById(section.id); }).filter(Boolean);

    function updateActive() {
      var marker = window.innerHeight * .43;
      var active = targets[0];
      targets.forEach(function (target) {
        if (target.getBoundingClientRect().top <= marker) active = target;
      });
      Array.from(nav.children).forEach(function (button) {
        button.classList.toggle('is-active', button.dataset.target === active.id);
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        document.body.classList.toggle('museum-has-scrolled', window.scrollY > window.innerHeight * .48);
        updateActive();
      });
    }, { passive: true });
    updateActive();
  }

  function setupKilnAmbience(sancaiHall) {
    var kilnDoor = document.getElementById('kilnDoor');
    if (!kilnDoor || !sancaiHall || !('MutationObserver' in window)) return;

    function syncKilnLight() {
      sancaiHall.classList.toggle('is-fired', kilnDoor.classList.contains('opening'));
    }

    new MutationObserver(syncKilnLight).observe(kilnDoor, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncKilnLight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDigitalMuseum);
  } else {
    initDigitalMuseum();
  }
})();
