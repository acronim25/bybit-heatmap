/**
 * Toast notification component
 */

let toastTimer;

export function showToast(message) {
  const toast = document.getElementById('modal-toast');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg) return;

  clearTimeout(toastTimer);
  msg.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}
