// All pointers use the whole card. The dialog's scroll region remains available
// between cards, and a held card scrolls it when approaching either edge.
function panelDrag(dialog, commit, allowed = () => true) {
  const doc = dialog.ownerDocument;
  let pointer = null,
    source = null,
    over = null,
    ghost = null,
    frame = 0,
    blockedClick = null;
  const data = (el) => ({
    kind: el.dataset.drag,
    id: el.dataset.gear || el.dataset.id,
    owner: el.dataset.owner
  });
  function compatible(zone) {
    return (
      source &&
      zone &&
      dialog.contains(zone) &&
      (zone.dataset.drop === 'post' ? source.kind === 'hero' : source.kind === 'equipment') &&
      allowed(source, zone.dataset.dest)
    );
  }
  function hit(x, y, fallback) {
    const top = doc.elementFromPoint?.(x, y) || fallback;
    const zone = top?.closest?.('[data-drop]');
    return compatible(zone) ? zone : null;
  }
  function mark(zone) {
    if (zone === over) return;
    over?.classList.remove('over');
    over = zone;
    over?.classList.add('over');
  }
  function clear() {
    const p = pointer;
    pointer = null;
    source = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    mark(null);
    ghost?.remove();
    ghost = null;
    dialog.classList.remove('fo-dragging');
    for (const zone of dialog.querySelectorAll('.fo-drop-ready,.fo-drag-source'))
      zone.classList.remove('fo-drop-ready', 'fo-drag-source');
    if (p?.el.hasPointerCapture?.(p.id)) p.el.releasePointerCapture(p.id);
  }
  function start(el) {
    source = data(el);
    el.classList.add('fo-drag-source');
    for (const zone of dialog.querySelectorAll('[data-drop]'))
      if (compatible(zone)) zone.classList.add('fo-drop-ready');
    dialog.classList.add('fo-dragging');
  }
  function scrollEdge() {
    frame = 0;
    if (!pointer || !source) return;
    const container = dialog.querySelector('.mj-scroll');
    const box = container?.getBoundingClientRect();
    if (
      box &&
      box.height > 0 &&
      pointer.x >= box.left &&
      pointer.x <= box.right &&
      pointer.y >= box.top - 20 &&
      pointer.y <= box.bottom + 20
    ) {
      const edge = Math.min(56, box.height * 0.18);
      const speed =
        pointer.y < box.top + edge
          ? -Math.ceil((box.top + edge - pointer.y) * 0.3)
          : pointer.y > box.bottom - edge
            ? Math.ceil((pointer.y - box.bottom + edge) * 0.3)
            : 0;
      if (speed) {
        const previous = container.scrollTop;
        container.scrollTop += speed;
        if (previous !== container.scrollTop) mark(hit(pointer.x, pointer.y));
      }
    }
    frame = requestAnimationFrame(scrollEdge);
  }
  dialog.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.isPrimary === false || pointer) return;
    const el = e.target.closest?.('[data-drag]');
    if (!el || el.disabled || !dialog.contains(el)) return;
    blockedClick = null;
    pointer = { id: e.pointerId, el, ix: e.clientX, iy: e.clientY, x: e.clientX, y: e.clientY };
  });
  doc.addEventListener(
    'pointermove',
    (e) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!source) {
        if (Math.hypot(pointer.x - pointer.ix, pointer.y - pointer.iy) < 6) return;
        if (!dialog.contains(pointer.el)) {
          clear();
          return;
        }
        start(pointer.el);
        try {
          pointer.el.setPointerCapture?.(pointer.id);
        } catch {}
        ghost = doc.createElement('div');
        ghost.className = 'fo-drag-ghost';
        ghost.setAttribute('aria-hidden', 'true');
        const img = pointer.el.querySelector('img');
        if (img) ghost.append(img.cloneNode(false));
        ghost.append(
          doc.createTextNode(
            pointer.el.querySelector('strong')?.textContent || pointer.el.textContent.trim()
          )
        );
        dialog.appendChild(ghost);
        frame = requestAnimationFrame(scrollEdge);
      }
      e.preventDefault();
      ghost.style.left = pointer.x + 12 + 'px';
      ghost.style.top = pointer.y - 28 + 'px';
      mark(hit(pointer.x, pointer.y, e.target));
    },
    { capture: true, passive: false }
  );
  doc.addEventListener(
    'pointerup',
    (e) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      if (!source) {
        clear();
        return;
      }
      e.preventDefault();
      const zone = hit(e.clientX, e.clientY, e.target),
        selection = source;
      blockedClick = { until: Date.now() + 450, x: e.clientX, y: e.clientY };
      clear();
      if (zone) commit(selection, zone.dataset.dest);
    },
    true
  );
  doc.addEventListener(
    'pointercancel',
    (e) => {
      if (pointer?.id === e.pointerId) clear();
    },
    true
  );
  doc.addEventListener(
    'lostpointercapture',
    (e) => {
      if (pointer?.id === e.pointerId && e.target === pointer.el) clear();
    },
    true
  );
  dialog.addEventListener(
    'click',
    (e) => {
      if (
        blockedClick &&
        Date.now() <= blockedClick.until &&
        e.detail !== 0 &&
        Math.hypot((e.clientX || 0) - blockedClick.x, (e.clientY || 0) - blockedClick.y) < 22
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        blockedClick = null;
      }
    },
    true
  );
  dialog.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && pointer) {
        e.preventDefault();
        e.stopPropagation();
        clear();
      }
    },
    true
  );
  dialog.addEventListener('cancel', (e) => {
    if (pointer) {
      e.preventDefault();
      clear();
    }
  });
  dialog.addEventListener('close', clear);
  // Keep native drag events usable for assistive clients without starting two
  // concurrent gestures in a browser that synthesizes dragstart from a mouse.
  dialog.addEventListener('dragstart', (e) => {
    if (pointer) {
      e.preventDefault();
      return;
    }
    const el = e.target.closest?.('[data-drag]');
    if (!el || el.disabled) return;
    start(el);
    e.dataTransfer?.setData('text/plain', source.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  });
  dialog.addEventListener('dragover', (e) => {
    if (pointer) return;
    const zone = e.target.closest?.('[data-drop]');
    mark(compatible(zone) ? zone : null);
    if (over) e.preventDefault();
  });
  dialog.addEventListener('drop', (e) => {
    if (pointer) return;
    const zone = e.target.closest?.('[data-drop]'),
      selection = source;
    if (!compatible(zone)) {
      clear();
      return;
    }
    e.preventDefault();
    clear();
    commit(selection, zone.dataset.dest);
  });
  dialog.addEventListener('dragend', () => {
    if (!pointer) clear();
  });
  return clear;
}

export { panelDrag };
