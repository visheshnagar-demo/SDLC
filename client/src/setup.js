import "@testing-library/jest-dom";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill window.matchMedia for tests if not available in jsdom
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
    };
  };
}
