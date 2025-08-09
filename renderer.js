// Core references
const tabListEl = document.getElementById('tabList');
const searchInput = document.getElementById('searchInput');
const styleFilter = document.getElementById('styleFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const addBtn = document.getElementById('addBtn');
const quickOpenInput = document.getElementById('quickOpenInput');
const tabBar = document.getElementById('tabBar');
const editorViews = document.getElementById('editorViews');
const statusInfo = document.getElementById('statusInfo');
const statusCount = document.getElementById('statusCount');
// 设置图标引用
const iconSettings = document.getElementById('iconSettings');
const iconLibrary = document.getElementById('iconLibrary');

// 主题状态
let currentTheme = 'dark'; // dark | light
let themeOverrideEl = null;
function applyTheme(theme){
  currentTheme = theme;
  const root = document.documentElement;
  if(theme==='light'){
    root.style.setProperty('--bg','#fafafa');
    root.style.setProperty('--bg-alt','#f3f3f5');
    root.style.setProperty('--panel','#ffffff');
    root.style.setProperty('--sidebar','#f8f8f9');
    root.style.setProperty('--activity','#ececef');
    root.style.setProperty('--border','#d0d4d9');
    root.style.setProperty('--text','#1e1f21');
    root.style.setProperty('--text-dim','#6a6f76');
    if(!themeOverrideEl){ themeOverrideEl=document.createElement('style'); document.head.appendChild(themeOverrideEl); }
    themeOverrideEl.textContent = `body.theme-light { background: var(--bg); color: var(--text); }
      body.theme-light #quickOpenInput { background:#ffffff; border:1px solid var(--border); color:var(--text); }
      body.theme-light #filters input, body.theme-light #filters select { background:#ffffff; border:1px solid var(--border); color:var(--text); }
      body.theme-light .tab-card { background:#ffffff; border:1px solid var(--border); }
      body.theme-light .tab-card:hover { border-color: var(--accent); }
      body.theme-light #tabBar { background: var(--bg-alt); }
      body.theme-light .etab { background:var(--panel); color:var(--text); }
      body.theme-light .etab.active { background:#e7e7ea; }
      body.theme-light .viewer-toolbar { background:var(--bg-alt); }
      body.theme-light .viewer-toolbar button { background:#ececf0; border:1px solid var(--border); color:var(--text); }
      body.theme-light .modal .panel { background:var(--panel); }
      body.theme-light form input, body.theme-light form select, body.theme-light form textarea { background:#ffffff; border:1px solid var(--border); color:var(--text); }
      body.theme-light .tag-editor { background:#ffffff; border:1px solid var(--border); }
      body.theme-light .token { background:#d1e7ff; color:#13324d; }
      body.theme-light .ctx-menu { background:var(--panel); border:1px solid var(--border); }
      body.theme-light .drop-zone { border-color:#c3c7cc; background:#f9f9fa; }
      body.theme-light .drop-zone.drag-over { background:#ebf5ff; border-color:var(--accent); }
      body.theme-light .pages { background:var(--panel); }
      body.theme-light #statusBar { background:var(--bg-alt); color:var(--text-dim); }
      body.theme-light .diff span { background:#f0f0f3; border:1px solid #d6d9dd; }
      body.theme-light .diff input:checked + span { color:#fff; }
    `;
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
  } else { // dark
    root.style.setProperty('--bg','#1e1e1e');
    root.style.setProperty('--bg-alt','#252526');
    root.style.setProperty('--panel','#2d2d30');
    root.style.setProperty('--sidebar','#252526');
    root.style.setProperty('--activity','#333333');
    root.style.setProperty('--border','#3c3c3c');
    root.style.setProperty('--text','#d4d4d4');
    root.style.setProperty('--text-dim','#888');
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
  }
}
applyTheme('dark');

// 打开设置作为一个标签页
function openSettingsTab(){
  const existing = openEditors.find(e=> e.id==='__settings');
  if(existing){ activateEditor('__settings'); iconLibrary.classList.remove('active'); iconSettings.classList.add('active'); return; }
  const view = document.createElement('div');
  view.className='view'; view.dataset.id='__settings';
  view.innerHTML = `<div style="padding:28px; max-width:780px;">
    <h2 style='margin:0 0 20px;'>设置</h2>
    <section style='margin:0 0 28px;'>
      <h3 style='margin:0 0 10px;font-size:16px;'>主题</h3>
      <div style='display:flex; gap:10px; align-items:center;'>
        <label><input type='radio' name='themeSel' value='dark' checked> Dark</label>
        <label><input type='radio' name='themeSel' value='light'> White</label>
      </div>
    </section>
    <section style='margin:0 0 28px;'>
      <h3 style='margin:0 0 10px;font-size:16px;'>背景图片</h3>
      <div style='display:flex; flex-direction:column; gap:8px;'>
        <div style='display:flex; gap:8px;'>
          <button type='button' data-bg-act='choose'>选择图片</button>
          <button type='button' data-bg-act='apply'>应用</button>
          <button type='button' data-bg-act='clear'>清除</button>
        </div>
        <small id='setBgPath' style='color:var(--text-dim);word-break:break-all;'></small>
        <div id='setBgPreview' style='height:130px;border:1px solid var(--border);border-radius:6px;background:#1e1e1e center/cover no-repeat;'></div>
      </div>
    </section>
  </div>`;
  editorViews.appendChild(view);
  const tabBtn = document.createElement('div');
  tabBtn.className='etab'; tabBtn.dataset.id='__settings'; tabBtn.innerHTML="<span>设置</span><span class='close'>×</span>";
  tabBar.appendChild(tabBtn);
  tabBtn.addEventListener('click', e=> { if(e.target.classList.contains('close')) closeEditor('__settings'); else activateEditor('__settings'); });
  openEditors.push({ id:'__settings', title:'设置', element:view });
  activateEditor('__settings');
  iconLibrary.classList.remove('active'); iconSettings.classList.add('active');
  // 绑定主题
  view.querySelectorAll("input[name='themeSel']").forEach(r=> r.addEventListener('change', ()=> applyTheme(r.value)) );

  // ----- 背景图片逻辑 (已修正)-----
  let pendingImg = null; // 将存储原始路径，例如 C:\path\to\image.jpg
  const pathEl = view.querySelector('#setBgPath');
  const previewEl = view.querySelector('#setBgPreview');

  view.querySelector("[data-bg-act='choose']").addEventListener('click', async ()=> {
    const files = await window.api.chooseImages();
    if(files && files.length){
      pendingImg = files[0];
      pathEl.textContent = pendingImg;
      // 【修复】在用于CSS之前，将路径中的反斜杠替换为正斜杠
      const cssPath = pendingImg.replace(/\\/g, '/');
      previewEl.style.backgroundImage = `url('file://${cssPath}')`;
    }
  });

  view.querySelector("[data-bg-act='apply']").addEventListener('click', ()=> {
    if(!pendingImg) return;
    // 【修复】在用于CSS之前，将路径中的反斜杠替换为正斜杠
    const cssPath = pendingImg.replace(/\\/g, '/');
    document.body.style.backgroundImage = `url('file://${cssPath}')`;
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundRepeat='no-repeat';
    document.body.style.backgroundPosition='center center';
  });

  view.querySelector("[data-bg-act='clear']").addEventListener('click', ()=> {
    pendingImg=null;
    pathEl.textContent='';
    previewEl.style.backgroundImage='none';
    document.body.style.backgroundImage='none';
  });
}
iconSettings?.addEventListener('click', openSettingsTab);
iconLibrary?.addEventListener('click', ()=> { iconSettings.classList.remove('active'); iconLibrary.classList.add('active'); if(activeEditorId && activeEditorId !== '__settings') activateEditor(activeEditorId); else activateEditor(null); });
// 兼容旧监听：将旧函数名指向新实现，避免引用不存在的 settingsView 抛错
window.showSettingsView = openSettingsTab;
window.showLibraryView = ()=>{};

// 补充：新增表单需要的引用
// 补充：标签功能已移除，以下元素可能不存在，提供安全 stub 防止脚本中断
const tagEditor = document.getElementById('tagEditor') || { addEventListener(){}, focus(){}, querySelector(){ return null; } };
const tagInput = document.getElementById('tagInput') || { addEventListener(){}, value:'', focus(){}, }; 
const tagTokens = document.getElementById('tagTokens') || { innerHTML:'', appendChild(){}, querySelector(){ return null; } };
const imageDrop = document.getElementById('imageDrop');
const imageCount = document.getElementById('imageCount');
const saveOpenBtn = document.getElementById('saveOpenBtn');

// Modal & form
const modal = document.getElementById('addModal');
const form = document.getElementById('addForm');
const chooseImagesBtn = document.getElementById('chooseImages');
const imagesPreview = document.getElementById('imagesPreview');

// Separate Edit Modal refs
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editChooseImagesBtn = document.getElementById('editChooseImages');
const editImagesPreview = document.getElementById('editImagesPreview');
const editImageCount = document.getElementById('editImageCount');
const editCancelBtn = document.getElementById('editCancelBtn');
const editTagEditor = document.getElementById('editTagEditor') || { addEventListener(){}, focus(){}, querySelector(){ return null; } };
const editTagInput = document.getElementById('editTagInput') || { addEventListener(){}, value:'', focus(){}, };
const editTagTokens = document.getElementById('editTagTokens') || { innerHTML:'', appendChild(){}, querySelector(){ return null; } };

let currentImages = []; // {path,url,existing,filename}
let editingId = null;
let cacheTabs = [];
let openEditors = []; // {id, title, element}
let activeEditorId = null;
let tagValues = [];

let editImages = []; // existing + new
let editTagValues = [];

let selection = new Set();
let lastFocusedIndex = -1;
// 新增：窗口全屏状态跟踪
let winFullscreen = false;

function buildQuery() { return { text: searchInput.value, style: styleFilter.value, difficulty: difficultyFilter.value }; }

async function loadTabs() {
  const tabs = await window.api.listTabs(buildQuery());
  cacheTabs = tabs;
  renderTabCards(tabs);
  statusCount.textContent = `${tabs.length} 条`;
  // 如果结果为空且存在过滤条件，自动清空过滤再加载一次
  if(!tabs.length && (searchInput.value || styleFilter.value || difficultyFilter.value)){
    const hadFilters = searchInput.value || styleFilter.value || difficultyFilter.value;
    searchInput.value=''; styleFilter.value=''; difficultyFilter.value='';
    const all = await window.api.listTabs(buildQuery());
    if(all.length){ cacheTabs=all; renderTabCards(all); statusCount.textContent = `${all.length} 条`; }
  }
}

function highlight(str, kw) {
  if (!kw) return str;
  const r = new RegExp('('+kw.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+')','ig');
  return str.replace(r,'<mark style="background:#555;color:#fff;">$1</mark>');
}

function formatDate(ts){ try { const d=new Date(ts); if(isNaN(d)) return ''; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; } catch { return ''; } }

const cardContextMenu = document.getElementById('cardContextMenu');
let ctxTargetTab = null;

function hideContextMenu(){ cardContextMenu.classList.remove('show'); }
window.addEventListener('mousedown', e=> { if(!cardContextMenu.contains(e.target)) hideContextMenu(); });
window.addEventListener('scroll', hideContextMenu, true);
window.addEventListener('blur', hideContextMenu);

function showContextMenu(x,y, tab){
  ctxTargetTab = tab;
  cardContextMenu.innerHTML = '';
  const mkBtn = (label, cls, cb) => { const b=document.createElement('button'); if(cls) b.classList.add(cls); b.textContent = label; b.addEventListener('click', ()=>{ cb(); hideContextMenu(); }); return b; };
  cardContextMenu.appendChild(mkBtn('修改','', ()=> beginEdit(ctxTargetTab)));
  cardContextMenu.appendChild(mkBtn('删除','danger', async ()=> { if(!confirm(`确定删除 "${ctxTargetTab.title}" ?`)) return; await window.api.deleteTab(ctxTargetTab.id); loadTabs(); closeEditor(ctxTargetTab.id); }));
  cardContextMenu.style.left = x + 'px'; cardContextMenu.style.top = y + 'px';
  cardContextMenu.classList.add('show');
}

function renderTabCards(tabs) {
  tabListEl.innerHTML = '';
  const kw = searchInput.value.trim();
  tabs.forEach((tab, idx) => {
    const card = document.createElement('div');
    card.className = 'tab-card';
    card.setAttribute('role','listitem');
    card.dataset.id = tab.id;
    card.dataset.index = idx;
    card.tabIndex = -1;
    const titleHtml = highlight(tab.title, kw);
    card.innerHTML = `<h3>${titleHtml}</h3>`;
    card.title = `${tab.title}\n演奏者: ${tab.artist || '-'}\n风格: ${tab.style||'-'} 难度: ${tab.difficulty||'-'}\n页数: ${tab.image_files.length}\n创建: ${formatDate(tab.date_added)}`;

    function toggleSelectionRange(toIdx){
      const start = lastFocusedIndex >=0 ? lastFocusedIndex : toIdx;
      const [a,b] = [start, toIdx].sort((x,y)=>x-y);
      selection.clear();
      for(let i=a;i<=b;i++){ selection.add(cacheTabs[i].id); }
      updateSelectionStyles();
    }

    card.addEventListener('click', (e) => {
      if (e.shiftKey) {
        toggleSelectionRange(idx);
      } else if (e.metaKey || e.ctrlKey) {
        if (selection.has(tab.id)) selection.delete(tab.id); else selection.add(tab.id);
        lastFocusedIndex = idx;
        updateSelectionStyles();
      } else {
        selection.clear(); selection.add(tab.id); lastFocusedIndex = idx; updateSelectionStyles();
      }
    });
    card.addEventListener('dblclick', () => { openViewerTab(tab); });
    card.addEventListener('contextmenu', (e)=> { e.preventDefault(); if(!selection.has(tab.id)){ selection.clear(); selection.add(tab.id); lastFocusedIndex = idx; updateSelectionStyles(); } showContextMenu(e.pageX, e.pageY, tab); });
    tabListEl.appendChild(card);
  });
  updateSelectionStyles();
}

function updateSelectionStyles(){
  const children = tabListEl.children;
  for (const el of children){ el.classList.toggle('selected', selection.has(el.dataset.id)); }
}

tabListEl.addEventListener('keydown', e => {
  if(!cacheTabs.length) return;
  const max = cacheTabs.length -1;
  if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)) { e.preventDefault(); }
  if (e.key === 'ArrowDown') {
    let next = lastFocusedIndex < 0 ? 0 : Math.min(max, lastFocusedIndex +1);
    if(e.shiftKey) { const start = lastFocusedIndex <0 ? 0 : lastFocusedIndex; selection.clear(); const [a,b]=[start,next].sort((x,y)=>x-y); for(let i=a;i<=b;i++) selection.add(cacheTabs[i].id); } else { selection.clear(); selection.add(cacheTabs[next].id); }
    lastFocusedIndex = next; updateSelectionStyles(); scrollIntoViewIndex(next);
  } else if (e.key === 'ArrowUp') {
    let prev = lastFocusedIndex < 0 ? 0 : Math.max(0, lastFocusedIndex -1);
    if(e.shiftKey) { const start = lastFocusedIndex <0 ? 0 : lastFocusedIndex; selection.clear(); const [a,b]=[start,prev].sort((x,y)=>x-y); for(let i=a;i<=b;i++) selection.add(cacheTabs[i].id); } else { selection.clear(); selection.add(cacheTabs[prev].id); }
    lastFocusedIndex = prev; updateSelectionStyles(); scrollIntoViewIndex(prev);
  } else if (e.key === 'Home') {
    selection.clear(); selection.add(cacheTabs[0].id); lastFocusedIndex=0; updateSelectionStyles(); scrollIntoViewIndex(0);
  } else if (e.key === 'End') {
    selection.clear(); selection.add(cacheTabs[max].id); lastFocusedIndex=max; updateSelectionStyles(); scrollIntoViewIndex(max);
  } else if (e.key === 'Enter') {
    if (selection.size===1){ const id=[...selection][0]; const tab=cacheTabs.find(t=>t.id===id); if(tab) openViewerTab(tab); }
  } else if ((e.key==='Delete' || e.key==='Backspace') && selection.size) {
    if(confirm(`删除选中 ${selection.size} 条曲谱?`)) { deleteSelected(); }
  }
});

function scrollIntoViewIndex(i){ const el = tabListEl.querySelector(`.tab-card[data-index='${i}']`); if(el) el.scrollIntoView({block:'nearest'}); }

async function deleteSelected(){
  for(const id of [...selection]){ await window.api.deleteTab(id); closeEditor(id); }
  selection.clear(); lastFocusedIndex=-1; loadTabs();
}

function openViewerTab(tab) {
  // If already open, activate
  const existing = openEditors.find(e=>e.id===tab.id);
  if (existing) return activateEditor(tab.id);
  // Build view
  const view = document.createElement('div');
  view.className='view'; view.dataset.id=tab.id;
  view.innerHTML = buildViewerHTML(tab);
  editorViews.appendChild(view);
  const tabBtn = document.createElement('div');
  tabBtn.className='etab'; tabBtn.dataset.id=tab.id; tabBtn.innerHTML = `<span>${tab.title}</span><span class='close' title='关闭'>×</span>`;
  tabBar.appendChild(tabBtn);
  tabBtn.addEventListener('click', (e)=> { if ((e.target).classList.contains('close')) { closeEditor(tab.id); } else activateEditor(tab.id); });
  openEditors.push({ id: tab.id, title: tab.title, element: view });
  activateEditor(tab.id);
  initViewerInteractions(view, tab);
}

function buildViewerHTML(tab) {
  return `<div class='viewer-toolbar'>
    <div style='font-weight:600;'>${tab.title}</div>
    <div style='font-size:11px;color:#aaa;display:flex;gap:12px;align-items:center;'>
      <span>${tab.artist||''}</span>
      <span>${tab.style||''}</span>
      <span>${tab.difficulty||''}</span>
      <span>页数:${tab.image_files.length}</span>
      <span>创建:${formatDate(tab.date_added)}</span>
    </div>
    <div style='margin-left:auto;display:flex;gap:4px;'>
      <button data-act='zoom-in'>+</button>
      <button data-act='zoom-out'>-</button>
      <button data-act='fit'>适宽</button>
      <button data-act='orig'>原始</button>
      <button data-act='full'>全屏</button>
    </div>
  </div>
  <div class='pages' data-pages></div>`;
}

function activateEditor(id){
  activeEditorId = id;
  Array.from(editorViews.children).forEach(v=>v.classList.toggle('active', v.dataset.id===id || (v.id==='welcomeView' && !id)));
  Array.from(tabBar.children).forEach(t=>t.classList.toggle('active', t.dataset.id===id));
}

function closeEditor(id){
  const idx = openEditors.findIndex(e=>e.id===id);
  if (idx>-1){
    const ed = openEditors[idx];
    ed.element.remove();
    const btn = tabBar.querySelector(`.etab[data-id='${id}']`); if (btn) btn.remove();
    openEditors.splice(idx,1);
    if (activeEditorId===id) activateEditor(openEditors.length?openEditors[openEditors.length-1].id:null);
  }
  if(id==='__settings') { iconSettings.classList.remove('active'); iconLibrary.classList.add('active'); }
}

// Viewer interactions
function initViewerInteractions(container, tab){
  let scale = 1; let isDrag=false; let sx=0; let sy=0; let ssx=0; let ssy=0;
  const pagesWrap = container.querySelector('[data-pages]');
  // load images
  if (tab.computedPaths) tab.computedPaths.forEach(p=>{ const img=document.createElement('img'); img.src=p; pagesWrap.appendChild(img); });
  const render=()=>{ pagesWrap.querySelectorAll('img').forEach(img=>{ img.style.transformOrigin='top left'; img.style.transform=`scale(${scale})`; }); };
  container.querySelectorAll('.viewer-toolbar button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const act=btn.dataset.act;
      if(act==='zoom-in'){ scale=Math.min(10,scale*1.15); render(); }
      else if(act==='zoom-out'){ scale=Math.max(0.2,scale/1.15); render(); }
      else if(act==='fit'){ const first=pagesWrap.querySelector('img'); if(first){ scale=pagesWrap.clientWidth/first.naturalWidth; render(); } }
      else if(act==='orig'){ scale=1; render(); }
      else if(act==='full'){ if(!winFullscreen){ window.api.enterFullscreen(); winFullscreen=true; } else { window.api.exitFullscreen(); winFullscreen=false; } }
    });
  });
  pagesWrap.addEventListener('mousedown',e=>{ isDrag=true; sx=e.clientX; sy=e.clientY; ssx=pagesWrap.parentElement.scrollLeft; ssy=pagesWrap.parentElement.scrollTop; });
  window.addEventListener('mouseup',()=> isDrag=false);
  window.addEventListener('mousemove',e=>{ if(!isDrag) return; const parent=pagesWrap.parentElement; parent.scrollLeft=ssx-(e.clientX-sx); parent.scrollTop=ssy-(e.clientY-sy); });
  pagesWrap.parentElement.addEventListener('wheel',e=>{ if(!e.ctrlKey) return; e.preventDefault(); const delta=e.deltaY>0?0.9:1.1; const rect=pagesWrap.getBoundingClientRect(); const cx=e.clientX-rect.left+pagesWrap.parentElement.scrollLeft; const cy=e.clientY-rect.top+pagesWrap.parentElement.scrollTop; const prev=scale; scale=Math.min(10,Math.max(0.2,scale*delta)); const ratio=scale/prev; pagesWrap.parentElement.scrollLeft=(cx*ratio)-(e.clientX-rect.left); pagesWrap.parentElement.scrollTop=(cy*ratio)-(e.clientY-rect.top); render(); },{passive:false});
  render();
}

// 监听 ESC 退出全屏
window.addEventListener('keydown', e=> { if(e.key==='Escape' && winFullscreen){ window.api.exitFullscreen(); winFullscreen=false; } });

// Modal logic
function openModal(){ modal.classList.add('show'); setTimeout(()=>{ const first=form.querySelector('[name=title]'); if(first) first.focus(); },0); }
function closeModal(){ modal.classList.remove('show'); }

addBtn.addEventListener('click',()=>{ editingId=null; document.getElementById('addTitle').textContent='添加新谱'; form.reset(); tagValues=[]; renderTags(); currentImages=[]; renderImageList(); openModal(); });
const cancelBtn = document.getElementById('cancelBtn'); if(cancelBtn) cancelBtn.addEventListener('click',()=> closeModal());
modal.addEventListener('mousedown',e=>{ if(e.target===modal) closeModal(); });

function renderTags(){}
function commitTagInput(){}

['keydown'].forEach(ev=> { if(tagInput) tagInput.addEventListener(ev, e=>{ if(e.key==='Enter' || e.key===',' ){ e.preventDefault(); commitTagInput(); } }); });
if(tagInput) tagInput.addEventListener('blur', commitTagInput);
if(tagEditor) tagEditor.addEventListener('keydown', e => { /*标签功能移除*/ });

function updateImageCount(){ imageCount.textContent = currentImages.length + ' 张图片'; }

// Drag & drop for images
;['dragenter','dragover'].forEach(ev=> imageDrop.addEventListener(ev,e=>{ e.preventDefault(); imageDrop.classList.add('drag-over'); }));
;['dragleave','drop'].forEach(ev=> imageDrop.addEventListener(ev,e=>{ if(e.target===imageDrop){ imageDrop.classList.remove('drag-over'); } }));
imageDrop.addEventListener('drop', async e=>{ e.preventDefault(); imageDrop.classList.remove('drag-over'); const files=[...e.dataTransfer.files].filter(f=> /\.(png|jpe?g|gif)$/i.test(f.name)); if(!files.length) return; files.forEach(f=>{ const p=f.path; if(!currentImages.find(ci=>ci.path===p)) currentImages.push({ path:p, url:'file://'+p, existing:false }); }); renderImageList(); });

// Override renderImageList to update count
const _origRenderImageList = renderImageList; // from earlier definition
function renderImageList(){
  imagesPreview.innerHTML='';
  currentImages.forEach((img, idx) => {
    const wrap=document.createElement('div'); wrap.className='thumb'; wrap.draggable=true; wrap.dataset.index=idx;
    wrap.innerHTML=`<img src="${img.url}"><button>x</button>`;
    wrap.querySelector('button').addEventListener('click',()=>{ currentImages.splice(idx,1); renderImageList(); });
    wrap.addEventListener('dragstart',e=>{ wrap.classList.add('dragging'); e.dataTransfer.setData('text/plain',idx.toString()); });
    wrap.addEventListener('dragend',()=> wrap.classList.remove('dragging'));
    wrap.addEventListener('dragover',e=>e.preventDefault());
    wrap.addEventListener('drop',e=>{ e.preventDefault(); const from=parseInt(e.dataTransfer.getData('text/plain')); const to=idx; if(from===to) return; const [m]=currentImages.splice(from,1); currentImages.splice(to,0,m); renderImageList(); });
    imagesPreview.appendChild(wrap);
  });
  updateImageCount();
}

chooseImagesBtn.addEventListener('click', async () => { const files=await window.api.chooseImages(); if(!files||!files.length) return; files.forEach(f=>{ if(!currentImages.find(ci=>ci.path===f)) currentImages.push({ path:f, url:`file://${f}`, existing:false }); }); renderImageList(); });

function openEditModal(){ editModal.classList.add('show'); setTimeout(()=>{ const first=editForm.querySelector('[name=title]'); if(first) first.focus(); },0); }
function closeEditModal(){ editModal.classList.remove('show'); }
editCancelBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('mousedown', e=> { if(e.target===editModal) closeEditModal(); });

function renderEditTags(){ editTagTokens.innerHTML=''; editTagValues.forEach((t,i)=> { const span=document.createElement('span'); span.className='token'; span.innerHTML=`${t}<button data-x>×</button>`; span.querySelector('button').addEventListener('click',()=>{ editTagValues.splice(i,1); renderEditTags(); }); editTagTokens.appendChild(span); }); }
function commitEditTagInput(){ const raw=editTagInput.value.trim(); if(!raw) return; raw.split(/[,，]/).map(s=>s.trim()).filter(Boolean).forEach(v=> { if(!editTagValues.includes(v)) editTagValues.push(v); }); editTagInput.value=''; renderEditTags(); }
editTagInput.addEventListener('keydown', e=> { if(e.key==='Enter'||e.key===','){ e.preventDefault(); commitEditTagInput(); } });
editTagInput.addEventListener('blur', commitEditTagInput);
editTagEditor.addEventListener('keydown', e=> { if(e.target!==editTagEditor) return; if(e.key==='Backspace'){ if(editTagValues.length){ editTagValues.pop(); renderEditTags(); } e.preventDefault(); } else if(e.key==='Enter'||e.key===','){ e.preventDefault(); commitEditTagInput(); } else if(e.key.length===1 && !e.metaKey && !e.ctrlKey && !e.altKey){ editTagInput.focus(); editTagInput.value+=e.key; e.preventDefault(); } });
editTagEditor.addEventListener('click', ()=> editTagInput.focus());

function updateEditImageCount(){ editImageCount.textContent = editImages.length + ' 张图片'; }
function renderEditImages(){ editImagesPreview.innerHTML=''; editImages.forEach((img, idx)=> { const wrap=document.createElement('div'); wrap.className='thumb'; wrap.draggable=true; wrap.dataset.index=idx; wrap.innerHTML=`<img src="${img.url}"><button>x</button>`; wrap.querySelector('button').addEventListener('click',()=>{ editImages.splice(idx,1); renderEditImages(); }); wrap.addEventListener('dragstart',e=>{ wrap.classList.add('dragging'); e.dataTransfer.setData('text/plain',idx.toString()); }); wrap.addEventListener('dragend',()=> wrap.classList.remove('dragging')); wrap.addEventListener('dragover',e=>e.preventDefault()); wrap.addEventListener('drop',e=>{ e.preventDefault(); const from=parseInt(e.dataTransfer.getData('text/plain')); const to=idx; if(from===to)return; const [m]=editImages.splice(from,1); editImages.splice(to,0,m); renderEditImages(); }); editImagesPreview.appendChild(wrap); }); updateEditImageCount(); }

;['dragenter','dragover'].forEach(ev=> editImageDrop.addEventListener(ev,e=>{ e.preventDefault(); editImageDrop.classList.add('drag-over'); }));
;['dragleave','drop'].forEach(ev=> editImageDrop.addEventListener(ev,e=>{ if(e.target===editImageDrop) editImageDrop.classList.remove('drag-over'); }));
editImageDrop.addEventListener('drop', e=> { e.preventDefault(); editImageDrop.classList.remove('drag-over'); const files=[...e.dataTransfer.files].filter(f=>/\.(png|jpe?g|gif)$/i.test(f.name)); files.forEach(f=>{ const p=f.path; if(!editImages.find(ci=>ci.path===p)) editImages.push({ path:p, url:'file://'+p, existing:false }); }); renderEditImages(); });

editChooseImagesBtn.addEventListener('click', async () => { const files=await window.api.chooseImages(); if(!files||!files.length) return; files.forEach(f=>{ if(!editImages.find(ci=>ci.path===f)) editImages.push({ path:f, url:`file://${f}`, existing:false }); }); renderEditImages(); });

function beginEdit(tab){
  editingId = tab.id;
  editForm.querySelector('[name=id]').value = tab.id;
  editForm.querySelector('[name=title]').value = tab.title;
  editForm.querySelector('[name=artist]').value = tab.artist;
  editForm.querySelector('[name=style]').value = tab.style || '';
  const diffInputs = editForm.querySelectorAll('input[name=difficulty]'); diffInputs.forEach(r=> r.checked = r.value === (tab.difficulty||''));
  // 标签相关已移除，不再处理 editTagValues
  editForm.querySelector('[name=notes]').value = tab.notes || '';
  editImages = tab.image_files.map((f,i)=> ({ path:null, url:tab.computedPaths?tab.computedPaths[i]:'', existing:true, filename:f }));
  renderEditImages();
  openEditModal();
}

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title=editForm.querySelector('[name=title]').value.trim();
  const artist=editForm.querySelector('[name=artist]').value.trim();
  const style=editForm.querySelector('[name=style]').value.trim();
  const diff=(() => { const r=editForm.querySelector('input[name=difficulty]:checked'); return r? r.value : ''; })();
  const notes=editForm.querySelector('[name=notes]').value;
  if(!title || !artist){ return; }
  if(!editImages.length){ alert('至少一张图片'); return; }
  await window.api.updateTab({ id:editingId, title, artist, images: editImages.map(i=>({ path:i.path, existing:i.existing, filename:i.filename })), style, difficulty:diff, tags: [], notes });
  await loadTabs();
  closeEditModal();
});

function showFieldError(name,msg){ const span=form.querySelector(`.fv[data-for='${name}']`); if(span) span.textContent=msg; }

form.addEventListener('submit', e=>{ e.preventDefault(); saveForm({ reopen:false, openViewer:false }); });

// Keyboard shortcuts inside modal
modal.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.ctrlKey){ e.preventDefault(); saveForm({ reopen:false, openViewer:false }); } });

[searchInput, styleFilter, difficultyFilter].forEach(el=> el.addEventListener('input', loadTabs));

// Quick Open & Command Palette (simplified)
function openQuickOpen(){ quickOpenInput.focus(); }
quickOpenInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=quickOpenInput.value.trim().toLowerCase(); const hit=cacheTabs.find(t=> t.title.toLowerCase().includes(v) || t.artist.toLowerCase().includes(v)); if(hit){ openViewerTab(hit); quickOpenInput.select(); } } });

window.addEventListener('keydown', e=>{
  if(e.ctrlKey && e.key.toLowerCase()==='p' && !e.shiftKey){ e.preventDefault(); openQuickOpen(); }
  else if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='p'){ e.preventDefault(); toggleCommandPalette(); }
  else if(e.key==='Escape'){ if(commandPalette.classList.contains('show')) { hideCommandPalette(); } }
});

const commands = [
  { id:'tab.new', title:'新建曲谱', run:()=> addBtn.click() },
  { id:'focus.search', title:'焦点到过滤框', run:()=> searchInput.focus() },
  { id:'reload.list', title:'刷新列表', run:()=> loadTabs() },
];

function toggleCommandPalette(){ if(commandPalette.classList.contains('show')) hideCommandPalette(); else showCommandPalette(); }
function showCommandPalette(){ commandPalette.classList.add('show'); cpInput.value=''; renderCommandList(''); setTimeout(()=>cpInput.focus(),0); }
function hideCommandPalette(){ commandPalette.classList.remove('show'); }
cpInput.addEventListener('input', ()=> renderCommandList(cpInput.value.trim()));
cpInput.addEventListener('keydown', e=>{ const items=[...cpList.querySelectorAll('li')]; let idx=items.findIndex(i=>i.classList.contains('active')); if(e.key==='ArrowDown'){ e.preventDefault(); idx=(idx+1)%items.length; setActive(items,idx);} else if(e.key==='ArrowUp'){ e.preventDefault(); idx=(idx-1+items.length)%items.length; setActive(items,idx);} else if(e.key==='Enter'){ e.preventDefault(); const cur=items[idx>=0?idx:0]; if(cur){ const id=cur.dataset.id; const cmd=commands.find(c=>c.id===id); if(cmd) { hideCommandPalette(); cmd.run(); } } } });
function setActive(items, idx){ items.forEach((el,i)=> el.classList.toggle('active', i===idx)); items[idx]?.scrollIntoView({block:'nearest'}); }
function renderCommandList(filter){ cpList.innerHTML=''; const f=filter.toLowerCase(); commands.filter(c=> !f || c.title.toLowerCase().includes(f) || c.id.includes(f)).forEach((c,i)=> { const li=document.createElement('li'); li.dataset.id=c.id; li.innerHTML=`<span>${c.title}</span><small>${c.id}</small>`; if(i===0) li.classList.add('active'); li.addEventListener('click',()=>{ hideCommandPalette(); c.run(); }); cpList.appendChild(li); }); }

loadTabs();

// ====== 追加：保存逻辑（之前缺失导致点击无反应） ======
async function saveForm({ reopen }) {
  // 参数 reopen 不再使用
  const title = form.querySelector('[name=title]').value.trim();
  const artist = form.querySelector('[name=artist]').value.trim();
  const style = form.querySelector('[name=style]').value.trim();
  const diff = (()=>{ const r=form.querySelector('input[name=difficulty]:checked'); return r? r.value:''; })();
  const notes = form.querySelector('[name=notes]').value;
  let ok = true;
  function setErr(name,msg){ const span=form.querySelector(`.fv[data-for='${name}']`); if(span) span.textContent=msg||''; }
  setErr('title',''); setErr('artist','');
  if(!title){ setErr('title','必填'); ok=false; }
  if(!artist){ setErr('artist','必填'); ok=false; }
  if(!currentImages.length){ alert('请至少选择一张图片'); ok=false; }
  if(!ok) return;
  try {
    console.log('[saveForm] creating tab', { title, artist, imgCount: currentImages.length });
    const created = await window.api.createTab({ title, artist, images: currentImages.map(i=> i.path), style, difficulty: diff, tags: [], notes });
    console.log('[saveForm] created id', created?.id);
    // 清空过滤，确保可见
    searchInput.value=''; styleFilter.value=''; difficultyFilter.value='';
    await loadTabs();
    // 高亮选中新建项
    if(created && created.id){ selection.clear(); selection.add(created.id); lastFocusedIndex = cacheTabs.findIndex(t=>t.id===created.id); updateSelectionStyles(); }
    if(reopen){
      form.querySelector('[name=title]').value='';
      form.querySelector('[name=artist]').value='';
      currentImages=[]; renderImageList();
      form.querySelector('[name=title]').focus();
    } else {
      closeModal();
    }
  } catch (e){
    console.error('[saveForm] error', e);
    alert('保存失败: '+ e.message);
  }
}
