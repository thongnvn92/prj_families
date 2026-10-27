import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/*
 * jsdom chưa implement một số Web API mà Radix UI (Tabs/Select/Dialog/Switch) và
 * react-day-picker dùng. Không polyfill thì mọi test render component sẽ ném
 * "ResizeObserver is not defined" / "matchMedia is not defined".
 */
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", { writable: true, value: ResizeObserverPolyfill });
}

if (!("DOMRect" in globalThis)) {
  class DOMRectPolyfill {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0,
    ) {}
    get top() { return this.y; }
    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    static fromRect(other?: { x?: number; y?: number; width?: number; height?: number }) {
      return new DOMRectPolyfill(other?.x, other?.y, other?.width, other?.height);
    }
  }
  Object.defineProperty(globalThis, "DOMRect", { writable: true, value: DOMRectPolyfill });
}

// Radix Select dùng các API pointer capture để đóng dropdown.
for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!Element.prototype[method]) {
    Object.defineProperty(Element.prototype, method, { writable: true, value: () => false });
  }
}

if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, "scrollIntoView", { writable: true, value: () => {} });
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// URL.createObjectURL không có trong jsdom; test upload ảnh cần nó.
if (!URL.createObjectURL) {
  Object.defineProperty(URL, "createObjectURL", { writable: true, value: () => "blob:gia-pha/mock" });
  Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: () => {} });
}

// Mỗi test render vào container sạch, tránh ảnh hưởng lẫn nhau.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
});

