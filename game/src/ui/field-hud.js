import { icon } from './icons.js';

const triggers = {
  menu: 'menu-toggle',
  view: 'view-toggle',
  arts: 'arts-toggle'
};

// The document is the fullscreen element so native dialogs and the title screen share it.
class FieldHud {
  constructor(doc, resize, notice) {
    this.doc = doc;
    this.field = doc.getElementById('field');
    this.resize = resize;
    this.notice = notice;
    this.panel = null;
    this.fallback = false;
    this.switching = false;
    this.awaitingNative = false;
    this.doc.addEventListener('fullscreenchange', () => this.fullscreenChanged());
    this.doc.addEventListener('webkitfullscreenchange', () => this.fullscreenChanged());
    const didFail = () => {
      if (!this.awaitingNative) return;
      this.awaitingNative = false;
      if (!this.nativeElement()) this.setFallback(true);
    };
    this.doc.addEventListener('fullscreenerror', didFail);
    this.doc.addEventListener('webkitfullscreenerror', didFail);
    this.doc.addEventListener('pointerdown', (event) => {
      if (!this.panel || event.target.closest('.hud-flyout, [data-do="hud-panel"], #arts-toggle'))
        return;
      this.closePanel();
    });
    this.syncFullscreen();
  }
  button(panel) {
    return this.doc.getElementById(triggers[panel]);
  }
  syncPanelButtons() {
    for (const key of Object.keys(triggers))
      this.button(key)?.setAttribute('aria-expanded', String(key === this.panel));
  }
  togglePanel(key, keyboard = false) {
    if (!Object.hasOwn(triggers, key)) return;
    const close = this.panel === key;
    this.closePanel();
    if (close) return;
    this.panel = key;
    const box = this.doc.getElementById(key + '-panel');
    box.hidden = false;
    this.syncPanelButtons();
    if (keyboard) {
      const first =
        box.querySelector('button:not(.flyout-close):not(:disabled)') ||
        box.querySelector('button');
      first?.focus({ preventScroll: true });
    }
  }
  closePanel(restore = false) {
    if (!this.panel) return;
    const key = this.panel;
    this.panel = null;
    this.doc.getElementById(key + '-panel').hidden = true;
    this.syncPanelButtons();
    if (restore) this.button(key)?.focus({ preventScroll: true });
  }
  nativeElement() {
    return this.doc.fullscreenElement || this.doc.webkitFullscreenElement;
  }
  syncFullscreen() {
    const native = !!this.nativeElement();
    const on = native || this.fallback;
    const title = native ? '退出全螢幕' : this.fallback ? '退出專注檢視' : '全螢幕';
    for (const button of this.doc.querySelectorAll('[data-do="fullscreen"]')) {
      button.setAttribute('aria-pressed', String(on));
      button.setAttribute('aria-label', title);
      button.title = title;
      button.innerHTML =
        icon(on ? 'contract' : 'expand', 18) +
        (button.id === 'expand' ? `<span>${on ? '退出' : title}</span>` : '');
    }
  }
  fullscreenChanged() {
    this.awaitingNative = false;
    if (this.nativeElement() && this.fallback) this.setFallback(false);
    this.syncFullscreen();
    this.resize();
  }
  setFallback(on) {
    if (on === this.fallback) return;
    this.fallback = on;
    this.doc.body.classList.toggle('viewport-focus', on);
    this.resize();
    if (on) this.notice('已進入專注檢視');
    this.syncFullscreen();
  }
  async fullscreen() {
    if (this.switching) return;
    this.closePanel();
    if (this.fallback) return this.setFallback(false);
    const root = this.doc.documentElement;
    const native = this.nativeElement();
    this.switching = true;
    try {
      if (native) {
        const exit = this.doc.exitFullscreen || this.doc.webkitExitFullscreen;
        if (exit) await exit.call(this.doc);
      } else if (root.requestFullscreen && this.doc.fullscreenEnabled !== false) {
        this.awaitingNative = true;
        await root.requestFullscreen({ navigationUI: 'hide' });
      } else if (root.webkitRequestFullscreen && this.doc.webkitFullscreenEnabled !== false) {
        this.awaitingNative = true;
        await root.webkitRequestFullscreen();
      } else this.setFallback(true);
    } catch {
      this.awaitingNative = false;
      if (!native && !this.nativeElement()) this.setFallback(true);
    } finally {
      this.switching = false;
      this.syncFullscreen();
      this.resize();
    }
  }
}

export { FieldHud };
