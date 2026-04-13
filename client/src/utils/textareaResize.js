/**
 * Auto-resize a textarea to fit content without jumping scroll position.
 * Setting height to "auto" reflows layout; we snapshot scroll positions first.
 */
export function captureScrollSnapshots(fromEl) {
  const snapshots = [];
  let node = fromEl.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const canScrollY = node.scrollHeight > node.clientHeight + 1;
    const canScrollX = node.scrollWidth > node.clientWidth + 1;
    if (canScrollY || canScrollX) {
      snapshots.push({
        node,
        top: node.scrollTop,
        left: node.scrollLeft,
      });
    }
    node = node.parentElement;
  }
  const docEl = document.documentElement;
  snapshots.push({
    node: 'window',
    top: window.scrollY ?? docEl.scrollTop ?? 0,
    left: window.scrollX ?? docEl.scrollLeft ?? 0,
  });
  return snapshots;
}

export function restoreScrollSnapshots(snapshots) {
  for (const { node, top, left } of snapshots) {
    if (node === 'window') {
      window.scrollTo(left, top);
    } else {
      node.scrollTop = top;
      node.scrollLeft = left;
    }
  }
}

export function autoResizeTextareaPreserveScroll(textareaEl) {
  if (!textareaEl) return;
  const snap = captureScrollSnapshots(textareaEl);
  textareaEl.style.height = 'auto';
  textareaEl.style.height = `${textareaEl.scrollHeight}px`;
  restoreScrollSnapshots(snap);
}
