// ===== Edge iPad Copilot — Tab Management + Side Pane =====

// ===== DOM =====
const tabBar = document.getElementById('tabBar');
const omniInput = document.getElementById('omniInput');
const nudge = document.getElementById('nudge');
const contentArea = document.getElementById('contentArea');
const spClose = document.getElementById('spClose');
const spAiResponse = document.getElementById('spAiResponse');
const spSuggestions = document.getElementById('spSuggestions');
const pageFrame = document.getElementById('pageFrame');
const ntpPage = document.getElementById('ntpPage');
const ntpSearchInput = document.getElementById('ntpSearchInput');
const navBack = document.querySelector('.nav-back');
const navForward = document.querySelector('.nav-forward');
const tabCountEl = document.getElementById('tabCount');

// ===== Tab State =====
let tabs = [];
let activeTabId = null;
let nextTabId = 1;
let currentStep = 1;

// ===== Tab CRUD =====

function createTab(url = null, title = 'New Tab') {
  const tab = {
    id: nextTabId++,
    url: url,
    title: title,
    favicon: url ? getFaviconClass(url) : 'tab-favicon-edge',
  };
  tabs.push(tab);
  switchToTab(tab.id);
  renderTabs();
  return tab;
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;

  tabs.splice(idx, 1);

  if (tabs.length === 0) {
    // Last tab closed — create a new blank tab
    createTab();
    return;
  }

  if (activeTabId === id) {
    // Switch to neighbor
    const newIdx = Math.min(idx, tabs.length - 1);
    switchToTab(tabs[newIdx].id);
  }

  renderTabs();
}

function switchToTab(id) {
  activeTabId = id;
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;

  if (tab.url) {
    // Show webview
    ntpPage.classList.remove('visible');
    pageFrame.style.display = 'flex';
    if (pageFrame.src !== tab.url && pageFrame.getURL && pageFrame.getURL() !== tab.url) {
      pageFrame.src = tab.url;
    } else if (!pageFrame.getURL) {
      pageFrame.src = tab.url;
    }
    omniInput.value = getDisplayUrl(tab.url);
    currentStep = 2;
    nudge.classList.remove('hidden', 'pressed');
    nudge.classList.add('expanded');
    // Show omni box on web pages
    document.querySelector('.omni-box').classList.remove('omni-hidden');
  } else {
    // Show NTP
    ntpPage.classList.add('visible');
    pageFrame.style.display = 'none';
    omniInput.value = '';
    currentStep = 1;
    nudge.classList.remove('expanded', 'hidden', 'pressed');
    // Visually hide omni box on NTP (still takes up space)
    document.querySelector('.omni-box').classList.add('omni-hidden');
  }

  // Close side pane when switching tabs
  if (contentArea.classList.contains('pane-open')) {
    contentArea.classList.remove('pane-open');
    nudge.classList.remove('pressed');
  }

  renderTabs();
}

function getFaviconClass(url) {
  if (!url) return 'tab-favicon-edge';
  if (url.includes('baidu')) return 'tab-favicon-baidu';
  if (url.includes('medium')) return 'tab-favicon-medium';
  if (url.includes('youtube')) return 'tab-favicon-youtube';
  if (url.includes('github')) return 'tab-favicon-github';
  return 'tab-favicon-edge';
}

function getDisplayUrl(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ===== Tab Bar Rendering =====

function renderTabs() {
  tabBar.innerHTML = '';

  tabs.forEach((tab, i) => {
    // Divider before non-first tabs (skip if previous is active or this is active)
    if (i > 0 && tabs[i-1].id !== activeTabId && tab.id !== activeTabId) {
      const divider = document.createElement('div');
      divider.className = 'tab-divider';
      tabBar.appendChild(divider);
    }

    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
    el.dataset.tabId = tab.id;
    el.draggable = true;

    el.innerHTML = `
      <div class="tab-favicon ${tab.favicon}"></div>
      <span class="tab-title">${tab.title}</span>
      <button class="tab-close">&times;</button>
      ${tab.id === activeTabId ? '<div class="tab-wing-left"></div><div class="tab-wing-right"></div>' : ''}
    `;

    // Click to switch
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) return;
      switchToTab(tab.id);
    });

    // Close button
    el.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    // Drag events
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', tab.id.toString());
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      document.querySelectorAll('.tab.drag-over').forEach(t => t.classList.remove('drag-over'));
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.classList.add('drag-over');
    });
    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-over');
    });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
      reorderTab(draggedId, tab.id);
    });

    tabBar.appendChild(el);
  });

  // + Add button
  const addBtn = document.createElement('button');
  addBtn.className = 'tab-add-btn';
  addBtn.innerHTML = '<svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  addBtn.addEventListener('click', () => createTab());
  tabBar.appendChild(addBtn);

  // Update tab count
  tabCountEl.textContent = tabs.length;
}

function reorderTab(draggedId, targetId) {
  const draggedIdx = tabs.findIndex(t => t.id === draggedId);
  const targetIdx = tabs.findIndex(t => t.id === targetId);
  if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

  const [dragged] = tabs.splice(draggedIdx, 1);
  tabs.splice(targetIdx, 0, dragged);
  renderTabs();
}

// ===== Webview Navigation Sync =====
if (pageFrame.addEventListener) {
  pageFrame.addEventListener('did-navigate', (e) => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
      tab.url = e.url;
      tab.favicon = getFaviconClass(e.url);
      omniInput.value = getDisplayUrl(e.url);
    }
  });

  pageFrame.addEventListener('page-title-updated', (e) => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && e.title) {
      tab.title = e.title;
      renderTabs();
    }
  });
}

// ===== URL Navigation =====

function navigateCurrentTab(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.url = url;
    tab.title = getDisplayUrl(url);
    tab.favicon = getFaviconClass(url);
  }
  ntpPage.classList.remove('visible');
  pageFrame.style.display = 'flex';
  pageFrame.src = url;
  omniInput.value = getDisplayUrl(url);
  document.querySelector('.omni-box').classList.remove('omni-hidden');
  currentStep = 2;
  nudge.classList.remove('hidden', 'pressed');
  nudge.classList.add('expanded');
  nudgeWrap.style.width = longWidth + 'px';
  renderTabs();
}

// Omnibox
omniInput.addEventListener('focus', () => omniInput.select());
omniInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const input = omniInput.value.trim();
    omniInput.blur();
    if (input) navigateCurrentTab(input);
  }
});

// NTP search
ntpSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = ntpSearchInput.value.trim();
    if (query) {
      const url = query.includes('.') && !query.includes(' ')
        ? 'https://' + query
        : 'https://www.bing.com/search?q=' + encodeURIComponent(query);
      navigateCurrentTab(url);
      ntpSearchInput.value = '';
    }
  }
});

// NTP top sites
document.querySelectorAll('.ntp-site[data-url]').forEach(site => {
  site.addEventListener('click', () => {
    navigateCurrentTab(site.dataset.url);
  });
});

// Nav buttons — use webview's built-in navigation
navBack.addEventListener('click', () => {
  if (pageFrame.canGoBack && pageFrame.canGoBack()) pageFrame.goBack();
});
navForward.addEventListener('click', () => {
  if (pageFrame.canGoForward && pageFrame.canGoForward()) pageFrame.goForward();
});

// ===== Copilot Side Pane =====

let hasChattedBefore = false;

nudge.addEventListener('click', () => {
  if (currentStep === 3) {
    closeSidePane();
    return;
  }
  if (currentStep === 2) transitionToStep3();
  else if (currentStep === 1) transitionToStep3Generic();
});

function transitionToStep3() {
  currentStep = 3;
  nudge.classList.remove('expanded');
  nudge.classList.add('pressed');
  nudgeWrap.style.width = shortWidth + 'px';

  contentArea.classList.add('pane-open');
  document.querySelector('.sp-msg-user').style.display = '';

  if (!hasChattedBefore) {
    spAiResponse.innerHTML = '<span class="sp-cursor"></span>';
    spSuggestions.classList.remove('visible');
    setTimeout(() => typeAIResponse(), 600);
    hasChattedBefore = true;
  }
}

function transitionToStep3Generic() {
  currentStep = 3;
  nudge.classList.add('pressed');
  contentArea.classList.add('pane-open');
  document.querySelector('.sp-msg-user').style.display = 'none';
  spAiResponse.innerHTML = 'How can I help you today?';
  spSuggestions.classList.remove('visible');
}

spClose.addEventListener('click', () => closeSidePane());

function closeSidePane() {
  contentArea.classList.remove('pane-open');
  nudge.classList.remove('pressed');
  setTimeout(() => { currentStep = 2; }, 500);
}

// ===== AI Typing Animation =====

const aiResponseText = `The article on Medium by MyScale explores the differences between <strong>Agentic AI</strong> and <strong>Generative AI</strong>. Here are the key points:

<strong>Agentic AI</strong> — AI systems that can make decisions and take actions autonomously to achieve specific goals. It is proactive, can adapt to changing situations, and handles complex tasks requiring ongoing problem-solving.

<strong>Generative AI</strong> — AI that focuses on creating new content (text, images, music, video). It is reactive, responding to input based on learned patterns, but cannot make its own decisions.

<strong>Key Differences:</strong>
• <strong>Autonomy:</strong> Agentic AI operates independently; Generative AI responds to prompts
• <strong>Behavior:</strong> Goal-directed vs. task-oriented
• <strong>Adaptation:</strong> Real-time learning vs. no real-time adaptation
• <strong>Decision Making:</strong> Complex, multi-step vs. basic, pattern-based

The article concludes that understanding these differences is crucial as AI becomes more integrated into our lives and workplaces.`;

function typeAIResponse() {
  let charIndex = 0;
  let currentHTML = '';
  const speed = 8;

  function type() {
    if (charIndex < aiResponseText.length) {
      if (aiResponseText[charIndex] === '<') {
        const closeIndex = aiResponseText.indexOf('>', charIndex);
        if (closeIndex !== -1) {
          currentHTML += aiResponseText.substring(charIndex, closeIndex + 1);
          charIndex = closeIndex + 1;
        }
      } else if (aiResponseText[charIndex] === '\n' && aiResponseText[charIndex + 1] === '\n') {
        currentHTML += '<br><br>';
        charIndex += 2;
      } else if (aiResponseText[charIndex] === '\n') {
        currentHTML += '<br>';
        charIndex++;
      } else {
        currentHTML += aiResponseText[charIndex];
        charIndex++;
      }
      spAiResponse.innerHTML = currentHTML + '<span class="sp-cursor"></span>';
      document.getElementById('spChat').scrollTop = document.getElementById('spChat').scrollHeight;
      setTimeout(type, speed);
    } else {
      spAiResponse.innerHTML = currentHTML;
      setTimeout(() => { spSuggestions.classList.add('visible'); }, 300);
    }
  }
  type();
}

// ===== Init =====

// Measure nudge text widths BEFORE creating tabs
const nudgeWrap = document.querySelector('.nudge-text-wrap');
const nudgeShort = document.querySelector('.nudge-text-short');
const nudgeLong = document.querySelector('.nudge-text-long');

// Temporarily remove overflow and make texts static to measure true widths
nudgeWrap.style.overflow = 'visible';
nudgeWrap.style.width = 'auto';

nudgeLong.style.opacity = '1';
nudgeLong.style.position = 'static';
const longWidth = nudgeLong.offsetWidth;
nudgeLong.style.opacity = '';
nudgeLong.style.position = '';

nudgeShort.style.position = 'static';
const shortWidth = nudgeShort.offsetWidth;
nudgeShort.style.position = '';

// Restore overflow
nudgeWrap.style.overflow = '';
nudgeWrap.style.width = shortWidth + 'px';

// Override switchToTab to also animate nudge wrap width
const _origSwitchToTab = switchToTab;
switchToTab = function(id) {
  _origSwitchToTab(id);
  const tab = tabs.find(t => t.id === id);
  nudgeWrap.style.width = (tab && tab.url) ? longWidth + 'px' : shortWidth + 'px';
};

// Create initial tabs
createTab('https://www.baidu.com', 'Baidu');
createTab('https://medium.com/@myscale/agentic-ai-vs-generative-ai-understanding-the-key-differences-e3607e750a20', 'Agentic AI vs Generative AI');
createTab(null, 'New Tab');
