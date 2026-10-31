const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d');

const state = {
  char: 'A',
  charset: document.getElementById('charsetInput').value,
  autoSnapMetrics: true,
  panX: 0,
  panY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  waterfallSizes: [12, 14, 16, 18, 24, 32, 48, 64, 96, 128, 160]
};

const els = {
  tabs: document.querySelectorAll('.tab-btn'),
  panes: document.querySelectorAll('.view-pane'),
  themeBtns: document.querySelectorAll('#themeGroup .seg-btn'),
  scaleSlider: document.getElementById('scaleSlider'),
  scaleVal: document.getElementById('scaleVal'),
  inspectInput: document.getElementById('inspectInput'),
  guidesToggle: document.getElementById('guidesToggle'),
  boundsToggle: document.getElementById('boundsToggle'),
  outlineToggle: document.getElementById('outlineToggle'),
  snapMetricsBtn: document.getElementById('snapMetricsBtn'),
  maxSlider: document.getElementById('maxSlider'),
  maxVal: document.getElementById('maxVal'),
  baseSlider: document.getElementById('baseSlider'),
  baseVal: document.getElementById('baseVal'),
  lineMax: document.getElementById('lineMax'),
  lineBase: document.getElementById('lineBase'),
  inkBounds: document.getElementById('inkBounds'),
  baselineProbe: document.getElementById('baselineProbe'),
  lsSlider: document.getElementById('lsSlider'),
  lsVal: document.getElementById('lsVal'),
  charsetInput: document.getElementById('charsetInput'),
  inspectorStage: document.getElementById('inspectorStage'),
  glyphBox: document.getElementById('glyphBox'),
  glyphTarget: document.getElementById('glyphTarget'),
  charStrip: document.getElementById('charStrip'),
  metaReadout: document.getElementById('metaReadout'),
  gridContainer: document.getElementById('gridContainer'),
  testerArea: document.getElementById('testerArea'),
  waterfallList: document.getElementById('waterfallList')
};

function formatCodepoints(str, widthPx, heightPx) {
  if (!str) return 'Empty';
  const points = Array.from(str).map(c => {
    const code = c.codePointAt(0);
    return 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
  });
  const decs = Array.from(str).map(c => c.codePointAt(0));
  const dims = (widthPx !== undefined && heightPx !== undefined) ? ` | ${Math.round(widthPx)} × ${Math.round(heightPx)} px` : '';
  return points.join(' ') + ' | Dec: ' + decs.join(', ') + dims;
}

function measureAndAlignGlyph() {
  const str = state.char;
  const boxRect = els.glyphBox.getBoundingClientRect();
  const probeRect = els.baselineProbe.getBoundingClientRect();
  const boxHeight = boxRect.height || 1;

  if (!str || boxRect.height === 0) {
    els.inkBounds.style.display = 'none';
    els.metaReadout.textContent = formatCodepoints(str);
    return;
  }

  const fontSize = parseFloat(els.scaleSlider.value);
  measureCtx.font = `${fontSize}px "Lita", system-ui, sans-serif`;
  measureCtx.textBaseline = 'alphabetic';
  const m = measureCtx.measureText(str);

  const baselineY = probeRect.top - boxRect.top;
  const peakY = baselineY - m.actualBoundingBoxAscent;
  const bottomY = baselineY + m.actualBoundingBoxDescent;

  const glyphWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const glyphHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

  const targetRect = els.glyphTarget.getBoundingClientRect();
  const targetLeft = targetRect.left - boxRect.left;
  const inkLeft = targetLeft - m.actualBoundingBoxLeft;

  els.inkBounds.style.display = '';
  els.inkBounds.style.top = `${peakY}px`;
  els.inkBounds.style.height = `${Math.max(0, bottomY - peakY)}px`;
  els.inkBounds.style.left = `${inkLeft}px`;
  els.inkBounds.style.width = `${Math.max(0, glyphWidth)}px`;

  if (state.autoSnapMetrics) {
    const maxPct = Math.max(0, Math.min(100, (peakY / boxHeight) * 100));
    const basePct = Math.max(0, Math.min(100, (bottomY / boxHeight) * 100));

    els.lineMax.style.top = `${peakY - 1}px`;
    els.lineBase.style.top = `${bottomY}px`;

    els.maxSlider.value = maxPct.toFixed(1);
    els.baseSlider.value = basePct.toFixed(1);
    els.maxVal.textContent = `${Math.round(glyphHeight)}px`;
    els.baseVal.textContent = `0px`;
  }

  els.metaReadout.textContent = formatCodepoints(str, glyphWidth, glyphHeight);
}

function setInspectChar(str) {
  state.char = str;
  els.inspectInput.value = str;
  els.glyphTarget.textContent = str;
  document.querySelectorAll('.char-pill').forEach(pill => {
    const isMatch = pill.dataset.char === str;
    pill.classList.toggle('active', isMatch);
    if (isMatch) {
      pill.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });
  measureAndAlignGlyph();
}

function renderCharStrip() {
  els.charStrip.innerHTML = '';
  const chars = Array.from(state.charset);
  chars.forEach(c => {
    const pill = document.createElement('button');
    pill.className = 'char-pill' + (c === state.char ? ' active' : '');
    pill.textContent = c;
    pill.dataset.char = c;
    pill.addEventListener('click', () => setInspectChar(c));
    els.charStrip.appendChild(pill);
  });
}

function renderGrid() {
  els.gridContainer.innerHTML = '';

  Array.from(state.charset).forEach(c => {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    const glyph = document.createElement('div');
    glyph.className = 'grid-glyph conlang-render';
    glyph.textContent = c;

    const meta = document.createElement('div');
    meta.className = 'grid-meta';
    const keySpan = document.createElement('span');
    keySpan.textContent = c;
    const hexSpan = document.createElement('span');
    hexSpan.textContent = c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

    meta.appendChild(keySpan);
    meta.appendChild(hexSpan);
    cell.appendChild(glyph);
    cell.appendChild(meta);

    cell.addEventListener('click', () => {
      setInspectChar(c);
      switchView('inspector');
    });

    els.gridContainer.appendChild(cell);
  });
}

function renderWaterfall() {
  els.waterfallList.innerHTML = '';
  const sample = els.testerArea.value.split('\n')[0] || state.charset;
  const ls = els.lsSlider.value + 'em';

  state.waterfallSizes.forEach(sz => {
    const row = document.createElement('div');
    row.className = 'waterfall-row';

    const label = document.createElement('div');
    label.className = 'waterfall-size';
    label.textContent = sz + 'px';

    const text = document.createElement('div');
    text.className = 'waterfall-text conlang-render';
    text.style.fontSize = sz + 'px';
    text.style.letterSpacing = ls;
    text.textContent = sample;

    row.appendChild(label);
    row.appendChild(text);
    els.waterfallList.appendChild(row);
  });
}

function updateTypographyStyles() {
  const ls = els.lsSlider.value + 'em';

  els.glyphBox.style.letterSpacing = ls;
  els.testerArea.style.letterSpacing = ls;

  measureAndAlignGlyph();
  renderGrid();
  renderWaterfall();
}

function switchView(viewName) {
  els.tabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewName));
  els.panes.forEach(p => p.classList.toggle('active', p.id === 'view-' + viewName));
  if (viewName === 'inspector') {
    requestAnimationFrame(measureAndAlignGlyph);
  }
}

function applyStageTransform() {
  els.glyphBox.style.transform = `translate(${state.panX}px, ${state.panY}px)`;
}

els.tabs.forEach(tab => {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
});

els.scaleSlider.addEventListener('input', e => {
  const val = e.target.value + 'px';
  els.scaleVal.textContent = val;
  els.glyphBox.style.fontSize = val;
  measureAndAlignGlyph();
});

els.inspectInput.addEventListener('input', e => {
  setInspectChar(e.target.value);
});

els.guidesToggle.addEventListener('click', () => {
  els.guidesToggle.classList.toggle('active');
  els.inspectorStage.classList.toggle('guides-on', els.guidesToggle.classList.contains('active'));
});

els.boundsToggle.addEventListener('click', () => {
  els.boundsToggle.classList.toggle('active');
  els.glyphBox.classList.toggle('bounds-on', els.boundsToggle.classList.contains('active'));
});

els.outlineToggle.addEventListener('click', () => {
  els.outlineToggle.classList.toggle('active');
  els.glyphBox.classList.toggle('outline-mode', els.outlineToggle.classList.contains('active'));
});

els.snapMetricsBtn.addEventListener('click', () => {
  state.autoSnapMetrics = true;
  state.panX = 0;
  state.panY = 0;
  applyStageTransform();
  measureAndAlignGlyph();
});

els.maxSlider.addEventListener('input', e => {
  state.autoSnapMetrics = false;
  const pct = parseFloat(e.target.value);
  const boxHeight = els.glyphBox.getBoundingClientRect().height || 1;
  const pxY = (pct / 100) * boxHeight;
  const basePxY = (parseFloat(els.baseSlider.value) / 100) * boxHeight;
  els.lineMax.style.top = `${pxY}px`;
  els.maxVal.textContent = `${Math.round(basePxY - pxY)}px`;
});

els.baseSlider.addEventListener('input', e => {
  state.autoSnapMetrics = false;
  const pct = parseFloat(e.target.value);
  const boxHeight = els.glyphBox.getBoundingClientRect().height || 1;
  const pxY = (pct / 100) * boxHeight;
  const maxPxY = (parseFloat(els.maxSlider.value) / 100) * boxHeight;
  els.lineBase.style.top = `${pxY}px`;
  els.maxVal.textContent = `${Math.round(pxY - maxPxY)}px`;
  els.baseVal.textContent = `${Math.round(boxHeight - pxY)}px`;
});

els.lsSlider.addEventListener('input', e => {
  els.lsVal.textContent = e.target.value + 'em';
  updateTypographyStyles();
});

els.charsetInput.addEventListener('input', e => {
  state.charset = e.target.value;
  renderCharStrip();
  renderGrid();
  renderWaterfall();
});

els.testerArea.addEventListener('input', renderWaterfall);

els.themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.themeVal;
    els.themeBtns.forEach(b => b.classList.toggle('active', b === btn));
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  });
});

els.inspectorStage.addEventListener('wheel', e => {
  e.preventDefault();
  const current = parseInt(els.scaleSlider.value, 10);
  const delta = Math.sign(e.deltaY) * -16;
  const next = Math.max(48, Math.min(720, current + delta));
  els.scaleSlider.value = next;
  els.scaleVal.textContent = next + 'px';
  els.glyphBox.style.fontSize = next + 'px';
  measureAndAlignGlyph();
}, { passive: false });

els.inspectorStage.addEventListener('mousedown', e => {
  state.isDragging = true;
  state.dragStartX = e.clientX - state.panX;
  state.dragStartY = e.clientY - state.panY;
});

window.addEventListener('mousemove', e => {
  if (!state.isDragging) return;
  state.panX = e.clientX - state.dragStartX;
  state.panY = e.clientY - state.dragStartY;
  applyStageTransform();
});

window.addEventListener('mouseup', () => {
  state.isDragging = false;
});

els.inspectorStage.addEventListener('dblclick', () => {
  state.panX = 0;
  state.panY = 0;
  applyStageTransform();
});

window.addEventListener('keydown', e => {
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
  const chars = Array.from(state.charset);
  const idx = chars.indexOf(state.char);
  if (e.key === 'ArrowRight' && idx !== -1) {
    e.preventDefault();
    setInspectChar(chars[(idx + 1) % chars.length]);
  } else if (e.key === 'ArrowLeft' && idx !== -1) {
    e.preventDefault();
    setInspectChar(chars[(idx - 1 + chars.length) % chars.length]);
  }
});

window.addEventListener('resize', measureAndAlignGlyph);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(measureAndAlignGlyph);
}

renderCharStrip();
updateTypographyStyles();