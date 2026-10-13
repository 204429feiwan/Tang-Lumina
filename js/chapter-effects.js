/* Presentation-only accents; original kiln and painting controls own their state. */
(function () {
  'use strict';

  function initChapterEffects() {
    if (!document.body.classList.contains('exhibition-page')) return;

    const desktop = window.matchMedia('(min-width: 992px)');
    const regions = Array.from(document.querySelectorAll('.kiln-scene, .unfurl-scroll'));
    if (!regions.length) return;

    const visibleRegions = new Set();

    function updateActivity() {
      const enabled = desktop.matches && !document.hidden;
      regions.forEach(function (region) {
        region.classList.toggle('is-chapter-visible', enabled && visibleRegions.has(region));
      });
    }

    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visibleRegions.add(entry.target);
          else visibleRegions.delete(entry.target);
        });
        updateActivity();
      }, { rootMargin: '-9% 0px -9% 0px', threshold: 0 });

      regions.forEach(function (region) { visibilityObserver.observe(region); });
    } else {
      regions.forEach(function (region) { visibleRegions.add(region); });
      updateActivity();
    }

    document.addEventListener('visibilitychange', updateActivity);
    if (desktop.addEventListener) desktop.addEventListener('change', updateActivity);
    else desktop.addListener(updateActivity);

    document.querySelectorAll('.kiln-scene').forEach(function (scene) {
      const door = scene.querySelector('.kiln-door');
      const arch = scene.querySelector('.kiln-arch');
      if (!door || !arch) return;

      function syncKilnLight() {
        scene.classList.toggle('is-kiln-open', door.classList.contains('kiln-door-open') || arch.classList.contains('fired'));
      }

      syncKilnLight();
      if ('MutationObserver' in window) {
        const kilnStateObserver = new MutationObserver(syncKilnLight);
        kilnStateObserver.observe(door, { attributes: true, attributeFilter: ['class'] });
        kilnStateObserver.observe(arch, { attributes: true, attributeFilter: ['class'] });
      }
    });

    document.querySelectorAll('.unfurl-scroll').forEach(function (scroll) {
      const img = scroll.querySelector('.unfurl-img');
      if (!img) return;

      function syncPaperLight() {
        // Read only the style written by the existing click handler; no layout measurement.
        const transform = img.style.transform.replace(/\s+/g, '');
        scroll.classList.toggle('is-unfurled', /^translateX\(0(?:px|%)?\)$/.test(transform));
      }

      syncPaperLight();
      if ('MutationObserver' in window) {
        const paintingStateObserver = new MutationObserver(syncPaperLight);
        paintingStateObserver.observe(img, { attributes: true, attributeFilter: ['style'] });
      } else {
        scroll.addEventListener('click', function () { window.setTimeout(syncPaperLight, 0); });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChapterEffects, { once: true });
  else initChapterEffects();
}());
