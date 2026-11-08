import "@testing-library/jest-dom/vitest";

// jsdom не умеет matchMedia — часть компонентов спрашивает медиазапросы.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom не реализует прокрутку — роутер вкладок зовёт её при монтировании.
Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });

// Leaflet и intersection observer в юнит-тестах не нужны — глушим.
if (!("IntersectionObserver" in window)) {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  }
  Object.defineProperty(window, "IntersectionObserver", { value: NoopObserver, writable: true });
}
