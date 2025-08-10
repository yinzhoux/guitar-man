let scale = 1; // base scale for original width rendering
let tabData;
const imagesContainer = document.getElementById('images');
const titleEl = document.getElementById('title');

function renderImages() {
  imagesContainer.querySelectorAll('img').forEach(img => {
    img.style.transformOrigin = 'top left';
    img.style.transform = `scale(${scale})`;
  });
}

window.api.onViewerLoad((tab) => {
  tabData = tab;
  titleEl.textContent = `${tab.title} - ${tab.artist}`;
  imagesContainer.innerHTML = '';
  if (tab.computedPaths) {
    tab.computedPaths.forEach(p => {
      const img = document.createElement('img');
      img.src = p;
      imagesContainer.appendChild(img);
    });
  } else {
    imagesContainer.innerHTML = '<p style="color:#888;">(图片路径未提供)</p>';
  }
  setTimeout(renderImages, 50);
});

document.getElementById('zoomIn').addEventListener('click', () => { scale *= 1.15; renderImages(); });
document.getElementById('zoomOut').addEventListener('click', () => { scale /= 1.15; renderImages(); });
document.getElementById('fitWidth').addEventListener('click', () => {
  const first = imagesContainer.querySelector('img');
  if (!first) return;
  const natural = first.naturalWidth;
  const containerWidth = imagesContainer.clientWidth;
  if (natural) {
    scale = containerWidth / natural;
    renderImages();
  }
});
document.getElementById('origSize').addEventListener('click', () => { scale = 1; renderImages(); });

let isDragging = false; let startY = 0; let startScrollY = 0; let startX = 0; let startScrollX = 0;
const container = imagesContainer;

container.addEventListener('mousedown', (e) => { isDragging = true; startY = e.clientY; startX = e.clientX; startScrollY = container.scrollTop; startScrollX = container.scrollLeft; });
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', (e) => { if (!isDragging) return; container.scrollTop = startScrollY - (e.clientY - startY); container.scrollLeft = startScrollX - (e.clientX - startX); });

container.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) { return; }
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const rect = container.getBoundingClientRect();
  const cx = e.clientX - rect.left + container.scrollLeft;
  const cy = e.clientY - rect.top + container.scrollTop;
  const prevScale = scale;
  scale = Math.min(10, Math.max(0.2, scale * delta));
  const ratio = scale / prevScale;
  container.scrollLeft = (cx * ratio) - (e.clientX - rect.left);
  container.scrollTop = (cy * ratio) - (e.clientY - rect.top);
  renderImages();
}, { passive:false });

const fullBtn = document.getElementById('fullBtn');
fullBtn.addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    // Try window fullscreen first
    await window.api.enterFullscreen();
  } else {
    await window.api.exitFullscreen();
  }
});
