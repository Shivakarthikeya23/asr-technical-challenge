import "@testing-library/jest-dom";

// Polyfill for PointerEvent methods required by Radix UI Select in jsdom
if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function (pointerId: number): boolean {
    return false;
  };
  Element.prototype.setPointerCapture = function (pointerId: number): void {
    // No-op in test environment
  };
  Element.prototype.releasePointerCapture = function (pointerId: number): void {
    // No-op in test environment
  };
}

// Polyfill for scrollIntoView required by Radix UI Select in jsdom
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function (): void {
    // No-op in test environment
  };
}
