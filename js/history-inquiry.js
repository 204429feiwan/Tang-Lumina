/* Local inquiry state. No scroll, resize, scene, media or window state ownership. */
(() => {
  'use strict';
  const root = document.getElementById('historyInquiry');
  if (!root) return;
  function select(volume, key) {
    if (!volume.querySelector(`[data-hv5-view="${key}"]`)) return;
    volume.dataset.hv5Active = key;
    volume.querySelectorAll('[data-hv5-view]').forEach(view => { view.hidden = view.dataset.hv5View !== key; });
    volume.querySelectorAll('[data-hv5-accent]').forEach(view => { view.toggleAttribute('hidden', view.dataset.hv5Accent !== key); });
    volume.querySelectorAll('[data-hv5-point]').forEach(point => { point.setAttribute('aria-expanded', String(point.dataset.hv5Point === key)); });
    volume.querySelectorAll('[role="tab"]').forEach(tab => {
      const active = tab.dataset.hv5Tab === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }
  root.addEventListener('click', event => {
    const control = event.target.closest('[data-hv5-point], [data-hv5-tab]');
    if (!control || !root.contains(control)) return;
    select(control.closest('.hv5-volume'), control.dataset.hv5Tab || control.dataset.hv5Point);
  });
  root.querySelectorAll('[role="tablist"]').forEach(list => {
    list.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      const tabs = [...list.querySelectorAll('[role="tab"]')];
      const current = tabs.indexOf(event.target);
      if (current < 0) return;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      select(list.closest('.hv5-volume'), tabs[next].dataset.hv5Tab);
      tabs[next].focus({preventScroll: true});
    });
  });
})();
