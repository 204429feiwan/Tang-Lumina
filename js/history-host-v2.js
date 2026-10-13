/* V2 host measurements and ownership for the history experience. */
(() => {
  'use strict';

  if (Object.prototype.hasOwnProperty.call(window, 'HistoryHost')) {
    console.error('HistoryHost: a host contract is already registered.');
    return;
  }

  const selectors = Object.freeze({
    navbar: '.navbar',
    navbarToggle: '.navbar-toggler',
    navbarCollapse: '#mainNav',
    backToTop: '#backToTop'
  });
  let measuredWidth = -1;
  let stableTopInset = NaN;

  function getNavbarElement() {
    return document.querySelector(selectors.navbar);
  }

  function getStableTopInset() {
    const width = window.innerWidth;
    if (width !== measuredWidth || !Number.isFinite(stableTopInset)) {
      const navbar = getNavbarElement();
      if (!navbar || !navbar.offsetHeight) return NaN;
      stableTopInset = Math.ceil(navbar.offsetHeight);
      measuredWidth = width;
    }
    return stableTopInset;
  }

  const contract = Object.freeze({
    navigationOwner: 'V2',
    backToTopOwner: 'V2',
    selectors,
    getNavbarElement,
    getStableTopInset,
    measureResize: () => Object.freeze({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      stableTopInset: getStableTopInset()
    })
  });
  Object.defineProperty(window, 'HistoryHost', {
    value: contract,
    writable: false,
    configurable: false
  });
})();
