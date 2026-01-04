// Simple singleton to ensure only one picker is open at a time
let currentCloser: (() => void) | null = null;

export function openPicker(closer: () => void) {
  // If there's an existing open picker, close it
  if (currentCloser && currentCloser !== closer) {
    try {
      currentCloser();
    } catch (e) {
      // swallow
    }
  }
  currentCloser = closer;
}

export function closePicker() {
  if (!currentCloser) return;
  try {
    currentCloser();
  } catch (e) {
    // swallow
  }
  currentCloser = null;
}

export function clearPicker() {
  currentCloser = null;
}
