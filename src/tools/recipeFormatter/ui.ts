import { escapeHtml } from './helpers';
import type { ToastTone } from './types';

export function flashActionButtonLabel(button: HTMLButtonElement, nextLabel: string, resetLabel: string) {
  const label = button.querySelector<HTMLElement>('.rf-action-btn-label');
  if (!label) {
    return;
  }

  label.textContent = nextLabel;
  window.setTimeout(() => {
    label.textContent = resetLabel;
  }, 1800);
}

export function showFormatterToast(message: string, tone: ToastTone = 'success') {
  const toastStack = document.querySelector<HTMLDivElement>('#rf-toast-stack');
  if (!toastStack) {
    return;
  }

  const toneIcon: Record<ToastTone, string> = {
    success: 'check_circle',
    info: 'auto_awesome',
    warning: 'warning'
  };

  const toast = document.createElement('div');
  toast.className = `rf-toast rf-toast-${tone}`;
  toast.innerHTML = `
    <span class="material-icons rf-toast-icon" aria-hidden="true">${toneIcon[tone]}</span>
    <span class="rf-toast-copy">${escapeHtml(message)}</span>
  `;

  toastStack.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  window.setTimeout(() => {
    toast.classList.add('is-exiting');
    window.setTimeout(() => {
      toast.remove();
    }, 280);
  }, 2200);
}

export function applySectionRevealStagger(container: HTMLElement) {
  const sections = Array.from(container.querySelectorAll<HTMLElement>('.rf-live-section'));
  sections.forEach((section, index) => {
    section.style.setProperty('--rf-stagger-index', index.toString());
  });
}
