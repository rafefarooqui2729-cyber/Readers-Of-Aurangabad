import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Shared focus and Escape management for the composed dialogs.
 *
 * The stack records the opener and the last focused element of every open
 * dialog. Only the topmost entry handles Escape/Tab, and closing a nested
 * dialog returns focus to the still-open parent rather than to a control
 * behind the overlay.
 */

interface ModalEntry {
  surfaceRef: RefObject<HTMLElement | null>;
  opener: HTMLElement | null;
  returnFocus: HTMLElement | null;
  lastFocused: HTMLElement | null;
}

interface ModalFocusOptions {
  /** Trap Tab/Shift+Tab inside the dialog. Default: true. */
  trapFocus?: boolean;
  /** Move focus into the dialog when it opens. Default: true. */
  initialFocus?: boolean;
}

const modalStack: ModalEntry[] = [];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function canReceiveFocus(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (!element.isConnected) return false;
  if (element.closest('[inert], [hidden], [aria-hidden="true"], fieldset[disabled]')) return false;
  if (element.hasAttribute('disabled')) return false;

  // A plain div has tabIndex -1 but still cannot receive programmatic focus;
  // an explicit tabindex="-1" (used on the dialog surfaces) can.
  if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  // getClientRects() is empty for elements hidden by an ancestor's display:none.
  return element.getClientRects().length > 0;
}

function isTabbable(element: Element | null): element is HTMLElement {
  return canReceiveFocus(element) && element.tabIndex >= 0;
}

function getTabbableElements(surface: HTMLElement): HTMLElement[] {
  return Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isTabbable);
}

function resolveParentRestore(parent: ModalEntry | undefined): HTMLElement | null {
  if (!parent) return null;

  const parentSurface = parent.surfaceRef.current;
  const candidates = [parent.returnFocus, parent.lastFocused, parentSurface];
  const target = candidates.find(candidate =>
    Boolean(candidate)
    && canReceiveFocus(candidate)
    && (!parentSurface || candidate === parentSurface || parentSurface.contains(candidate))
  ) ?? null;

  parent.returnFocus = null;
  return target;
}

export function useModalEscapeDismiss(
  open: boolean,
  onClose: () => void,
  surfaceRef: RefObject<HTMLElement | null>,
  options: ModalFocusOptions = {}
): (restoreFocus?: unknown) => void {
  const trapFocus = options.trapFocus ?? true;
  const initialFocus = options.initialFocus ?? true;

  const closeRef = useRef(onClose);
  const entryRef = useRef<ModalEntry | null>(null);
  const closeHandledRef = useRef(false);
  const pendingRestoreRef = useRef<HTMLElement | null>(null);
  const expectedParentRef = useRef<ModalEntry | null>(null);
  const lifecycleRef = useRef({ generation: 0 });

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  /**
   * Releases stack ownership as soon as dismissal is requested. Several
   * dialogs remain mounted for their AnimatePresence exit animation, so
   * waiting for effect cleanup would otherwise let a closing dialog keep
   * handling Escape/Tab and delay focus restoration.
   */
  const dismiss = useCallback((restoreFocus: unknown = true) => {
    if (closeHandledRef.current) return;
    const shouldRestoreFocus = restoreFocus !== false;
    closeHandledRef.current = true;

    const entry = entryRef.current;
    if (!entry) {
      closeRef.current();
      return;
    }

    const index = modalStack.indexOf(entry);
    const wasTopmost = index >= 0 && index === modalStack.length - 1;
    if (index >= 0) modalStack.splice(index, 1);

    const parent = modalStack[modalStack.length - 1];
    expectedParentRef.current = parent;

    if (wasTopmost && shouldRestoreFocus) {
      pendingRestoreRef.current = parent
        ? resolveParentRestore(parent)
        : (canReceiveFocus(entry.opener) ? entry.opener : null);
    }

    closeRef.current();
  }, []);

  useEffect(() => {
    if (!open) return;

    const lifecycle = lifecycleRef.current;
    const generation = ++lifecycle.generation;
    closeHandledRef.current = false;
    pendingRestoreRef.current = null;
    expectedParentRef.current = null;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const parent = modalStack[modalStack.length - 1];
    if (parent && opener && parent.surfaceRef.current?.contains(opener)) {
      parent.returnFocus = opener;
    } else if (parent) {
      parent.returnFocus = parent.lastFocused
        && parent.surfaceRef.current?.contains(parent.lastFocused)
        ? parent.lastFocused
        : parent.surfaceRef.current;
    }

    const entry: ModalEntry = {
      surfaceRef,
      opener,
      returnFocus: null,
      lastFocused: null,
    };
    entryRef.current = entry;
    modalStack.push(entry);

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      const surface = surfaceRef.current;
      if (!surface || !(target instanceof HTMLElement)) return;
      if (target === surface || surface.contains(target)) {
        entry.lastFocused = target;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeHandledRef.current) return;
      if (modalStack[modalStack.length - 1] !== entry || event.defaultPrevented) return;

      if (event.key === 'Escape') {
        const target = event.target instanceof HTMLElement ? event.target : null;

        // Let an explicit nested control keep Escape for itself (for example a
        // combobox or a component that marks itself as the Escape owner).
        if (target?.closest('[data-escape-owner], [role="combobox"], [aria-autocomplete="list"]')) return;

        const surface = surfaceRef.current;
        const nestedDialog = target?.closest('[role="dialog"][aria-modal="true"]');
        if (nestedDialog && surface && nestedDialog !== surface && surface.contains(nestedDialog)) return;

        event.preventDefault();
        dismiss();
        return;
      }

      if (event.key !== 'Tab' || !trapFocus) return;

      const surface = surfaceRef.current;
      if (!surface) return;

      const focusable = getTabbableElements(surface);
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (focusable.length === 0) {
        event.preventDefault();
        if (active !== surface && canReceiveFocus(surface)) surface.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const isInside = Boolean(active && (active === surface || surface.contains(active)));

      if (event.shiftKey) {
        if (!active || !isInside || active === surface || active === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
        return;
      }

      if (!active || !isInside || active === surface || active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    window.addEventListener('keydown', handleKeyDown);

    if (initialFocus) {
      requestAnimationFrame(() => {
        if (closeHandledRef.current) return;
        if (modalStack[modalStack.length - 1] !== entry) return;
        const surface = surfaceRef.current;
        if (!surface || !canReceiveFocus(surface)) return;

        const active = document.activeElement;
        if (active instanceof HTMLElement && (active === surface || surface.contains(active))) return;

        // If another control took focus before this frame, it has ownership;
        // do not pull focus back into the newly opened dialog.
        const isNeutralActiveElement = active === document.body || active === document.documentElement;
        if (active instanceof HTMLElement && !isNeutralActiveElement && active !== opener) return;

        surface.focus({ preventScroll: true });
      });
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('keydown', handleKeyDown);

      let restoreTarget = pendingRestoreRef.current;
      let expectedParent = expectedParentRef.current;

      // Dismissal already removed the entry and computed the restore target.
      // Effect cleanup only needs to apply it after the surface has unmounted.
      if (entryRef.current === entry && !closeHandledRef.current) {
        const index = modalStack.indexOf(entry);
        const wasTopmost = index >= 0 && index === modalStack.length - 1;
        if (index >= 0) modalStack.splice(index, 1);

        const parent = modalStack[modalStack.length - 1];
        expectedParent = parent;
        if (wasTopmost) {
          restoreTarget = parent
            ? resolveParentRestore(parent)
            : (canReceiveFocus(entry.opener) ? entry.opener : null);
        }
      }

      entryRef.current = null;

      if (restoreTarget) {
        const target = restoreTarget;
        requestAnimationFrame(() => {
          if (lifecycle.generation !== generation) return;
          if (expectedParent && modalStack[modalStack.length - 1] !== expectedParent) return;
          if (!expectedParent && modalStack.length !== 0) return;
          if (canReceiveFocus(target)) target.focus({ preventScroll: true });
        });
      }

      pendingRestoreRef.current = null;
      expectedParentRef.current = null;
    };
  }, [open, surfaceRef, trapFocus, initialFocus, dismiss]);

  return dismiss;
}
