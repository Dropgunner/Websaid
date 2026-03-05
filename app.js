/* ═══════════════════════════════════════════════
   Agentic AI Knowledge Base — Application Logic
   ═══════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────
let DATA = [];
let currentIdx = -1;
let readSet = new Set(JSON.parse(localStorage.getItem('kb_read') || '[]'));
let isDark = localStorage.getItem('kb_theme') !== 'light';
let sidebarOpen = true;
let searchTimer = null;

// ── Section descriptions for cards ─────────────
const DESCS = {
  0:'Welcome and executive overview — your starting point for the entire knowledge base.',
  1:'Foundational information, disclaimers, usage guidelines, and target audience.',
  2:'Core definitions, agent types (reactive, deliberative, hybrid, learning), and key concepts.',
  3:'Architecture components, OpenAI design patterns, multi-agent systems, and 12-Factor Agents.',
  4:'LangChain, LangGraph, Google ADK, AWS Strands, AutoGen, CrewAI, PydanticAI, and more.',
  5:'Cloud platforms (Google Vertex, AWS AgentCore, Azure), workflow engines, and popular agents.',
  6:'MCP, Agent2Agent (A2A) protocol, AGENTS.md, OpenSpec, AG-UI, and Linux Foundation standards.',
  7:'Reference architectures for AI assistants, automation, self-learning agents, and RAG pipelines.',
  8:'Context management strategies, prompt engineering, and real-world implementation examples.',
  9:'Three-tier memory model, long-term memory strategies, and memory management solutions.',
  10:'LLM evaluation frameworks, agent benchmarks, evaluation platforms, and reference docs.',
  11:'NIST AI RMF, Google SAIF framework, AWS security perspective, and threat models.',
  12:'Observability goals, monitoring solutions, and best practices for production agentic AI.',
  13:'AgentOps overview, GenOps evolution from MLOps, and operational best practices.',
  14:'Gartner, AWS, Google, and IDC maturity models for agentic AI capability assessment.',
  15:'AWS AI Agents Marketplace, AgentOps Marketplace, and miscellaneous agent marketplaces.',
  16:'Best practices from Anthropic, Google, Microsoft, and OpenAI for reliable AI agents.'
};

const CARD_ICONS = {
  0:'🏠',1:'📖',2:'🧠',3:'🏗️',4:'⚙️',5:'🔧',6:'📐',
  7:'🗺️',8:'🎯',9:'💾',10:'📊',11:'🔒',12:'👁️',
  13:'🚀',14:'📈',15:'🛒',16:'✅'
};

// Sub-card icons based on content hints
function subIcon(title) {
  const t = title.toLowerCase();
  if (t.includes('overview') || t.includes('intro')) return '📋';
  if (t.includes('pattern') || t.includes('design')) return '🎨';
  if (t.includes('security') || t.includes('risk')) return '🔒';
  if (t.includes('memory') || t.includes('storage')) return '💾';
  if (t.includes('framework') || t.includes('sdk')) return '⚙️';
  if (t.includes('reference') || t.includes('resource')) return '📚';
  if (t.includes('best practice') || t.includes('guideline')) return '✅';
  if (t.includes('evaluation') || t.includes('benchmark')) return '📊';
  if (t.includes('architecture') || t.includes('component')) return '🏗️';
  if (t.includes('protocol') || t.includes('standard')) return '📐';
  if (t.includes('agent')) return '🤖';
  if (t.includes('model') || t.includes('llm')) return '🧠';
  if (t.includes('deploy') || t.includes('production')) return '🚀';
  if (t.includes('tool') || t.includes('platform')) return '🔧';
  return '📄';
}

// ── Boot ────────────────────────────────────────
async function boot() {
  applyTheme(false);
  try {
    const r = await fetch('content.json');
    DATA = await r.json();
  } catch(e) {
    document.getElementById('main').innerHTML =
      '<div style="padding:60px;text-align:center;color:#ef4444">Failed to load content. Please refresh.</div>';
    return;
  }
  buildSidebar();
  buildHome();
  setupSearch();
  setupKeyboard();
  setupSidebar();
  showHome();
}

// ── Theme ───────────────────────────────────────
function applyTheme(animate = true) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const icon = document.getElementById('themeIcon');
  if (isDark) {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}

document.getElementById('themeBtn').addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('kb_theme', isDark ? 'dark' : 'light');
  applyTheme();
});

// ── Sidebar ─────────────────────────────────────
function buildSidebar() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = DATA.map((sec, i) => `
    <div class="nav-item${readSet.has(sec.id) ? ' done' : ''}" data-idx="${i}" onclick="navigateTo(${i})">
      <span class="nav-icon">${CARD_ICONS[sec.num] || '📄'}</span>
      <span class="nav-num">${sec.num}</span>
      <span class="nav-label">${sec.title}</span>
      <span class="nav-check">✓</span>
    </div>
  `).join('');
}

function updateSidebarActive(idx) {
  document.querySelectorAll('.nav-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    el.classList.toggle('done', readSet.has(DATA[i]?.id));
    if (i === idx) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function setupSidebar() {
  const btn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');
  const overlay = document.getElementById('sidebarOverlay');

  btn.addEventListener('click', () => {
    const mobile = window.innerWidth <= 900;
    if (mobile) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('hidden', !sidebar.classList.contains('mobile-open'));
    } else {
      sidebarOpen = !sidebarOpen;
      sidebar.classList.toggle('collapsed', !sidebarOpen);
      main.classList.toggle('expanded', !sidebarOpen);
    }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all reading progress?')) return;
    readSet.clear();
    localStorage.removeItem('kb_read');
    updateProgress();
    buildSidebar();
    buildHome();
    if (currentIdx >= 0) updateMarkBtn();
    showToast('Progress reset');
  });
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('hidden');
}

// ── Progress ────────────────────────────────────
function updateProgress() {
  const total = DATA.length;
  const done = readSet.size;
  document.getElementById('progressLabel').textContent = `${done}/${total}`;
  const pct = total ? (done / total) * 100 : 0;
  const circ = 2 * Math.PI * 15.9;
  document.getElementById('ringArc').style.strokeDasharray =
    `${(pct / 100) * circ} ${circ}`;
}

// ── Home ─────────────────────────────────────────
function buildHome() {
  // Stats
  const totalSubs = DATA.reduce((a, s) => a + s.subsections.length, 0);
  const totalLinks = DATA.reduce((a, s) => a + (s.all_links || []).length, 0);
  document.getElementById('heroStats').innerHTML = `
    <div class="hs"><span class="hs-num">${DATA.length}</span><span class="hs-label">Sections</span></div>
    <div class="hs"><span class="hs-num">${totalSubs}+</span><span class="hs-label">Topics</span></div>
    <div class="hs"><span class="hs-num">${totalLinks}+</span><span class="hs-label">Resources</span></div>
    <div class="hs"><span class="hs-num">${readSet.size}</span><span class="hs-label">Completed</span></div>
  `;

  // Cards
  document.getElementById('sectionGrid').innerHTML = DATA.map((sec, i) => {
    const done = readSet.has(sec.id);
    const color = sec.color || '#6366f1';
    return `
      <div class="sg-card${done ? ' done' : ''}" onclick="navigateTo(${i})">
        <div class="sg-stripe"></div>
        <div class="sg-head">
          <div class="sg-icon" style="background:${color}22;border:1px solid ${color}44">${sec.icon || '📄'}</div>
          <div class="sg-meta">
            <div class="sg-num">Section ${sec.num}</div>
            <div class="sg-title">${sec.title}</div>
          </div>
        </div>
        <div class="sg-desc">${DESCS[sec.num] || ''}</div>
        <div class="sg-foot">
          <span class="sg-count">${sec.subsections.length} topics · ${(sec.all_links||[]).length} links</span>
          ${done ? '<span class="sg-done-badge">✓ Done</span>' : '<span class="sg-arrow">→</span>'}
        </div>
      </div>
    `;
  }).join('');
}

function showHome() {
  document.getElementById('homeView').classList.remove('hidden');
  document.getElementById('sectionView').classList.add('hidden');
  currentIdx = -1;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  window.scrollTo(0, 0);
}

// ── Section View ────────────────────────────────
function navigateTo(idx) {
  if (idx < 0 || idx >= DATA.length) return;
  currentIdx = idx;
  const sec = DATA[idx];

  document.getElementById('homeView').classList.add('hidden');
  document.getElementById('sectionView').classList.remove('hidden');

  // Breadcrumb
  document.getElementById('svBreadcrumb').innerHTML = `
    <a href="#" onclick="showHome();return false;">Home</a>
    <span class="sep">›</span>
    <span>Section ${sec.num}: ${sec.title}</span>
  `;

  // Header
  const color = sec.color || '#6366f1';
  document.getElementById('svHeader').innerHTML = `
    <div class="sv-badge" style="background:${color}22;border:1px solid ${color}44">${sec.icon || '📄'}</div>
    <div class="sv-info">
      <div class="sv-num">Section ${sec.num} · ${sec.subsections.length} topics · ${(sec.all_links||[]).length} resources</div>
      <div class="sv-title">${sec.title}</div>
      ${sec.intro ? `<div class="sv-intro">${escHtml(sec.intro.substring(0, 400))}</div>` : ''}
    </div>
  `;

  updateMarkBtn();

  // Nav buttons
  ['prevBtn','prevBtn2'].forEach(id => {
    document.getElementById(id).disabled = idx === 0;
  });
  ['nextBtn','nextBtn2'].forEach(id => {
    document.getElementById(id).disabled = idx === DATA.length - 1;
  });

  // Content
  renderSubsections(sec);
  updateSidebarActive(idx);
  closeSidebar();
  window.scrollTo(0, 0);
}

function renderSubsections(sec) {
  const container = document.getElementById('svContent');

  // Group subsections by their parent ## heading prefix
  // (e.g. "2.1", "2.2" etc.)
  const groups = {};
  const groupOrder = [];
  sec.subsections.forEach(sub => {
    // Detect group from title like "2.1 Overview" → group "2.1"
    const m = sub.title.match(/^(\d+\.\d+)/);
    const gKey = m ? m[1] : '_';
    if (!groups[gKey]) { groups[gKey] = []; groupOrder.push(gKey); }
    groups[gKey].push(sub);
  });

  let html = '';
  groupOrder.forEach(gKey => {
    const items = groups[gKey];
    const groupTitle = gKey !== '_' ? `<div class="sub-group-title">Group ${gKey}</div>` : '';
    html += `<div class="sub-group">${groupTitle}`;
    items.forEach(sub => {
      const lc = (sub.links || []).length;
      const kc = (sub.key_points || []).length;
      const tc = (sub.sub_topics || []).length;
      html += `
        <div class="sub-card" onclick="openModal('${sub.id}')">
          <div class="sub-card-icon">${subIcon(sub.title)}</div>
          <div class="sub-card-body">
            <div class="sub-card-title">${escHtml(sub.title)}</div>
            <div class="sub-card-meta">
              ${lc > 0 ? `<span class="sub-badge links">🔗 ${lc} source${lc>1?'s':''}</span>` : ''}
              ${kc > 0 ? `<span class="sub-badge keys">💡 ${kc} key point${kc>1?'s':''}</span>` : ''}
              ${tc > 0 ? `<span class="sub-badge topics">📋 ${tc} topic${tc>1?'s':''}</span>` : ''}
            </div>
          </div>
          <div class="sub-card-arrow">›</div>
        </div>
      `;
    });
    html += '</div>';
  });

  container.innerHTML = html;
}

function navigateNext() { if (currentIdx < DATA.length - 1) navigateTo(currentIdx + 1); }
function navigatePrev() { if (currentIdx > 0) navigateTo(currentIdx - 1); }

// ── Mark Read ───────────────────────────────────
function toggleRead() {
  if (currentIdx < 0) return;
  const sec = DATA[currentIdx];
  if (readSet.has(sec.id)) {
    readSet.delete(sec.id);
    showToast('Section unmarked');
  } else {
    readSet.add(sec.id);
    showToast('✓ Section marked as read!');
  }
  localStorage.setItem('kb_read', JSON.stringify([...readSet]));
  updateProgress();
  updateMarkBtn();
  updateSidebarActive(currentIdx);
  buildHome();
}

function updateMarkBtn() {
  const sec = DATA[currentIdx];
  if (!sec) return;
  const btn = document.getElementById('markBtn');
  const done = readSet.has(sec.id);
  btn.textContent = done ? '✓ Completed' : '✓ Mark as Read';
  btn.classList.toggle('marked', done);
}

// ── Modal ───────────────────────────────────────
const modalMap = {};

function openModal(subId) {
  // Find subsection
  let sub = null, sec = null;
  for (const s of DATA) {
    const found = s.subsections.find(x => x.id === subId);
    if (found) { sub = found; sec = s; break; }
  }
  if (!sub) return;

  document.getElementById('modalSectionLabel').textContent = `Section ${sec.num}: ${sec.title}`;
  document.getElementById('modalTitle').textContent = sub.title;

  // Body: content
  let bodyHtml = '';
  if (sub.content && sub.content.trim()) {
    bodyHtml += `<div class="mc-section">${mdToHtml(sub.content)}</div>`;
  }

  // Sub-topics tags
  if (sub.sub_topics && sub.sub_topics.length > 0) {
    bodyHtml += `<div class="mc-section">
      <h3>Topics Covered</h3>
      <div class="subtopic-list">
        ${sub.sub_topics.map(t => `<span class="subtopic-tag">${escHtml(t)}</span>`).join('')}
      </div>
    </div>`;
  }

  // Key points
  if (sub.key_points && sub.key_points.length > 0) {
    bodyHtml += `<div class="mc-section">
      <h3>Key Concepts</h3>
      <div class="kp-grid">
        ${sub.key_points.map(kp => `
          <div class="kp-item">
            <div class="kp-term">${escHtml(kp.term)}</div>
            ${kp.desc ? `<div class="kp-desc">${escHtml(kp.desc)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  document.getElementById('modalBody').innerHTML = bodyHtml ||
    '<p style="color:var(--text3);font-size:14px">No additional content for this topic.</p>';

  // Footer: links
  const links = sub.links || [];
  const footEl = document.getElementById('modalFoot');
  if (links.length > 0) {
    footEl.innerHTML = `
      <div class="modal-foot-title">📚 Sources & Resources (${links.length})</div>
      <div class="links-list">
        ${links.map(l => `
          <a class="link-row" href="${escAttr(l.url)}" target="_blank" rel="noopener noreferrer">
            <div class="link-row-icon">↗</div>
            <div class="link-row-text">
              <div class="link-row-title">${escHtml(l.text)}</div>
              <div class="link-row-url">${escHtml(l.url.replace(/^https?:\/\//, '').substring(0, 60))}${l.url.length > 60 ? '…' : ''}</div>
            </div>
            <div class="link-row-arrow">↗</div>
          </a>
        `).join('')}
      </div>
    `;
    footEl.classList.remove('hidden');
  } else {
    footEl.innerHTML = '';
    footEl.classList.add('hidden');
  }

  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Search ──────────────────────────────────────
function setupSearch() {
  // Top bar search box opens overlay
  document.getElementById('searchbox').addEventListener('click', openSearch);
  document.getElementById('searchInput').addEventListener('focus', openSearch);

  // Overlay input
  const overlayInput = document.getElementById('searchInputOverlay');
  overlayInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(overlayInput.value.trim()), 180);
  });
}

function openSearch() {
  document.getElementById('searchOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('searchInputOverlay').focus(), 50);
}

function closeSearch() {
  document.getElementById('searchOverlay').classList.add('hidden');
  document.getElementById('searchInputOverlay').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

function doSearch(q) {
  const el = document.getElementById('searchResults');
  if (!q) {
    el.innerHTML = `<div class="sr-hint">Type to search across ${DATA.reduce((a,s)=>a+s.subsections.length,0)}+ topics and ${DATA.reduce((a,s)=>a+(s.all_links||[]).length,0)}+ resources.</div>`;
    return;
  }

  const ql = q.toLowerCase();
  const hits = [];

  for (const sec of DATA) {
    if (hits.length >= 30) break;
    // Section title match
    if (sec.title.toLowerCase().includes(ql)) {
      hits.push({ type: 'section', sec, sub: null,
        tag: `Section ${sec.num}`, title: sec.title,
        snippet: sec.intro?.substring(0, 120) || '' });
    }
    for (const sub of sec.subsections) {
      if (hits.length >= 30) break;
      const inTitle = sub.title.toLowerCase().includes(ql);
      const inContent = sub.content.toLowerCase().includes(ql);
      const inLinks = (sub.links || []).some(l => l.text.toLowerCase().includes(ql));
      const inKP = (sub.key_points || []).some(k => k.term.toLowerCase().includes(ql) || k.desc.toLowerCase().includes(ql));

      if (inTitle || inContent || inLinks || inKP) {
        let snippet = '';
        if (inContent) {
          const ci = sub.content.toLowerCase().indexOf(ql);
          snippet = sub.content.substring(Math.max(0, ci - 40), ci + 100)
            .replace(/[#*_`]/g, '').trim();
          if (ci > 40) snippet = '…' + snippet;
          snippet += '…';
        }
        hits.push({ type: 'sub', sec, sub,
          tag: `Section ${sec.num}: ${sec.title}`,
          title: sub.title, snippet });
      }
    }
  }

  if (hits.length === 0) {
    el.innerHTML = `<div class="sr-empty">No results for "<strong>${escHtml(q)}</strong>"</div>`;
    return;
  }

  el.innerHTML = hits.map((h, i) => `
    <div class="sr-item" data-i="${i}">
      <div class="sr-tag">${escHtml(h.tag)}</div>
      <div class="sr-title">${escHtml(h.title)}</div>
      ${h.snippet ? `<div class="sr-snippet">${escHtml(h.snippet.substring(0, 130))}</div>` : ''}
    </div>
  `).join('');

  el.querySelectorAll('.sr-item').forEach(item => {
    item.addEventListener('click', () => {
      const h = hits[+item.dataset.i];
      closeSearch();
      // Find section index
      const secIdx = DATA.findIndex(s => s.id === h.sec.id);
      navigateTo(secIdx);
      if (h.sub) setTimeout(() => openModal(h.sub.id), 120);
    });
  });
}

// ── Keyboard ────────────────────────────────────
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault(); openSearch();
    }
    if (e.key === 'Escape') {
      if (!document.getElementById('modal').classList.contains('hidden')) { closeModal(); return; }
      if (!document.getElementById('searchOverlay').classList.contains('hidden')) { closeSearch(); return; }
    }
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' && currentIdx >= 0) navigateNext();
    if (e.key === 'ArrowLeft' && currentIdx >= 0) navigatePrev();
  });
}

// ── Toast ───────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ── Markdown → HTML ─────────────────────────────
function mdToHtml(md) {
  if (!md) return '';

  // 1. Extract and protect links
  const links = [];
  let s = md.replace(/!\[[^\]]*\]\([^\)]*\)\s*_[^\n]*_?\n?/g, '');
  s = s.replace(/!\[[^\]]*\]\([^\)]*\)\n?/g, '');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (_, text, url) => {
    const i = links.push({ text, url }) - 1;
    return `\x00LINK${i}\x00`;
  });

  // 2. Escape HTML
  s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // 3. Restore links
  s = s.replace(/\x00LINK(\d+)\x00/g, (_, i) => {
    const l = links[+i];
    return `<a href="${escAttr(l.url)}" target="_blank" rel="noopener">${escHtml(l.text)}</a>`;
  });

  // 4. Block elements
  s = s.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  s = s.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^#{2}\s+(.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^#{1}\s+(.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^---+$/gm, '<hr>');

  // 5. Tables (basic)
  s = s.replace(/(\|.+\|\n)+/g, m => {
    const rows = m.trim().split('\n').filter(r => r.trim() && !r.match(/^\|[-| :]+\|$/));
    if (rows.length < 1) return m;
    const [head, ...body] = rows;
    const ths = head.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
      .map(c => `<th>${c.trim()}</th>`).join('');
    const trs = body.map(r =>
      '<tr>' + r.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
        .map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
    ).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  // 6. Code blocks
  s = s.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // 7. Inline
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 8. Lists
  s = s.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  s = s.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // 9. Blockquotes
  s = s.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // 10. Paragraphs
  s = s.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|li|pre|table|blockquote|hr)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, ' ')}</p>`;
  }).join('\n');

  return s;
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Start ───────────────────────────────────────
boot();
