// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg error:', err));
  });
}

// App State
const state = {
  imgBefore: null,
  imgAfter: null,
  scaleBefore: 100,
  offXBefore: 0,
  offYBefore: 0,
  scaleAfter: 100,
  offXAfter: 0,
  offYAfter: 0,
  ratio: '9:16',
  layout: 'vertical',
  bgMode: 'black',
  radius: 40,
  gap: 20,
  margin: 40,
  showHeader: true,
  headerText: 'MY WORKFLOW',
  badgeBefore: 'БЫЛО',
  badgeAfter: 'СТАЛО',
  badgeStyle: 'dark',
  watermarkText: '@voloshin.life',
  watermarkPos: 'center',
  watermarkSize: 38
};

// Elements
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// Helper to load image
function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Render Function
function renderCanvas() {
  // Determine Canvas Resolution
  let cw = 1080, ch = 1920;
  if (state.ratio === '4:5') {
    cw = 1080; ch = 1350;
  } else if (state.ratio === '1:1') {
    cw = 1080; ch = 1080;
  }

  canvas.width = cw;
  canvas.height = ch;

  // Background
  if (state.bgMode === 'black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);
  } else if (state.bgMode === 'darkgray') {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, cw, ch);
  } else if (state.bgMode === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
  } else {
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, cw, ch);
  }

  // Header Title
  let topOffset = 40;
  if (state.showHeader && state.headerText.trim()) {
    ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(state.headerText.trim(), cw / 2 + 2, 70 + 2);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.headerText.trim(), cw / 2, 70);
    topOffset = 130;
  }

  // Calculate Slot Layout
  const margin = state.margin;
  const gap = state.gap;
  const radius = state.radius;
  const isVertical = (state.layout === 'vertical');

  const availW = cw - (margin * 2);
  const availH = ch - topOffset - margin;

  let slotW, slotH, pos1, pos2;
  if (isVertical) {
    slotW = availW;
    slotH = Math.floor((availH - gap) / 2);
    pos1 = { x: margin, y: topOffset };
    pos2 = { x: margin, y: topOffset + slotH + gap };
  } else {
    slotW = Math.floor((availW - gap) / 2);
    slotH = availH;
    pos1 = { x: margin, y: topOffset };
    pos2 = { x: margin + slotW + gap, y: topOffset };
  }

  // Helper to draw rounded slot image
  function drawSlot(img, pos, sW, sH, scaleVal, offX, offY, badgeText) {
    ctx.save();
    ctx.beginPath();
    
    // Path for rounded rectangle
    if (radius > 0 && ctx.roundRect) {
      ctx.roundRect(pos.x, pos.y, sW, sH, radius);
    } else {
      ctx.rect(pos.x, pos.y, sW, sH);
    }
    ctx.clip();

    if (!img) {
      // Placeholder
      ctx.fillStyle = '#222936';
      ctx.fillRect(pos.x, pos.y, sW, sH);
      ctx.font = '30px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#6b7a90';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Нажмите для выбора фото', pos.x + sW / 2, pos.y + sH / 2);
    } else {
      const iw = img.width;
      const ih = img.height;
      const aspectCover = Math.max(sW / iw, sH / ih);
      const userScale = scaleVal / 100.0;
      const finalScale = aspectCover * userScale;

      const nw = iw * finalScale;
      const nh = ih * finalScale;

      let cropX = (nw - sW) / 2 - offX;
      let cropY = (nh - sH) / 2 - offY;

      ctx.drawImage(img, pos.x - cropX, pos.y - cropY, nw, nh);
    }
    ctx.restore();

    // Draw Badge
    if (state.badgeStyle !== 'none' && badgeText.trim()) {
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      const textMetrics = ctx.measureText(badgeText.trim());
      const tw = textMetrics.width;
      const th = 36;

      const bx = pos.x + 30;
      const by = pos.y + 30;
      const padX = 26, padY = 14;
      const bw = tw + (padX * 2);
      const bh = th + (padY * 2);

      if (state.badgeStyle === 'dark') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, bh / 2);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(badgeText.trim(), bx + padX, by + padY - 2);
      } else if (state.badgeStyle === 'light') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, bh / 2);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(badgeText.trim(), bx + padX, by + padY - 2);
      } else if (state.badgeStyle === 'text') {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(badgeText.trim(), bx + 2, by + 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(badgeText.trim(), bx, by);
      }
    }
  }

  // Draw Slots
  drawSlot(state.imgBefore, pos1, slotW, slotH, state.scaleBefore, state.offXBefore, state.offYBefore, state.badgeBefore);
  drawSlot(state.imgAfter, pos2, slotW, slotH, state.scaleAfter, state.offXAfter, state.offYAfter, state.badgeAfter);

  // Draw Watermark
  if (state.watermarkPos !== 'none' && state.watermarkText.trim()) {
    const wmText = state.watermarkText.trim();
    ctx.font = `bold ${state.watermarkSize}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let wx = cw / 2;
    let wy;

    if (state.watermarkPos === 'center') {
      if (isVertical) {
        const midY = pos1.y + slotH + (gap / 2);
        wy = midY;
      } else {
        wy = ch / 2;
      }
    } else {
      wy = ch - margin + 10;
    }

    // Shadow & Text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText(wmText, wx + 2, wy + 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(wmText, wx, wy);
  }
}

// Setup Event Listeners
function setupEvents() {
  document.getElementById('inputBefore').addEventListener('change', async (e) => {
    state.imgBefore = await loadImage(e.target.files[0]);
    if (state.imgBefore) {
      document.getElementById('titleBefore').textContent = '✅ Фото «БЫЛО»';
    }
    renderCanvas();
  });

  document.getElementById('inputAfter').addEventListener('change', async (e) => {
    state.imgAfter = await loadImage(e.target.files[0]);
    if (state.imgAfter) {
      document.getElementById('titleAfter').textContent = '✅ Фото «СТАЛО»';
    }
    renderCanvas();
  });

  document.getElementById('btnSwap').addEventListener('click', () => {
    const tempImg = state.imgBefore;
    state.imgBefore = state.imgAfter;
    state.imgAfter = tempImg;
    renderCanvas();
  });

  // Inputs & Sliders
  const bindInput = (id, key, isInt = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      let val = e.target.value;
      if (e.target.type === 'checkbox') val = e.target.checked;
      else if (isInt) val = parseInt(val, 10);
      state[key] = val;
      
      const valDisp = document.getElementById(id + 'Val');
      if (valDisp) valDisp.textContent = val;
      
      renderCanvas();
    });
  };

  bindInput('selectRatio', 'ratio');
  bindInput('selectLayout', 'layout');
  bindInput('selectBg', 'bgMode');
  bindInput('sliderRadius', 'radius', true);
  bindInput('sliderGap', 'gap', true);
  bindInput('sliderMargin', 'margin', true);

  bindInput('sliderScaleB', 'scaleBefore', true);
  bindInput('sliderOffXB', 'offXBefore', true);
  bindInput('sliderOffYB', 'offYBefore', true);

  bindInput('sliderScaleA', 'scaleAfter', true);
  bindInput('sliderOffXA', 'offXAfter', true);
  bindInput('sliderOffYA', 'offYAfter', true);

  bindInput('checkHeader', 'showHeader');
  bindInput('inputHeader', 'headerText');
  bindInput('inputBadgeB', 'badgeBefore');
  bindInput('inputBadgeA', 'badgeAfter');
  bindInput('selectBadgeStyle', 'badgeStyle');

  bindInput('inputWM', 'watermarkText');
  bindInput('selectWMPos', 'watermarkPos');
  bindInput('sliderWMSize', 'watermarkSize', true);

  // Actions
  document.getElementById('btnDownload').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `bylo_stalo_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  document.getElementById('btnShare').addEventListener('click', async () => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'bylo_stalo.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Было-Стало',
            text: 'Коллаж До и После',
            files: [file]
          });
        } catch (err) {
          console.log('Share canceled/failed');
        }
      } else {
        alert('Функция Поделиться открывает фото для сохранения на вашем смартфоне.');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    }, 'image/png');
  });

  document.getElementById('btnCopy').addEventListener('click', async () => {
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        alert('Коллаж скопирован в буфер обмена!');
      } catch (err) {
        alert('Не удалось скопировать. Используйте кнопку Скачать.');
      }
    });
  });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  renderCanvas();
});
