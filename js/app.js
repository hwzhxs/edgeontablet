// ===== Edge iPad Copilot Side Pane =====
// Step 1: Default (baidu.com + short "Chat" nudge)
// Step 2: URL → medium.com (nudge expands to "Summarize webpage")
// Step 3: Click nudge → Copilot side pane slides in with typing animation

const omniInput = document.getElementById('omniInput');
const nudge = document.getElementById('nudge');
const contentArea = document.getElementById('contentArea');
const sidePane = document.getElementById('sidePane');
const spClose = document.getElementById('spClose');
const spAiResponse = document.getElementById('spAiResponse');
const spSuggestions = document.getElementById('spSuggestions');
const pageBaidu = document.getElementById('pageBaidu');
const pageMedium = document.getElementById('pageMedium');
const navBack = document.querySelector('.nav-back');
const navForward = document.querySelector('.nav-forward');

let currentStep = 1;

// ===== Navigation: pages in order =====
const pages = ['baidu.com', 'medium.com'];
let pageIndex = 0; // 0 = baidu, 1 = medium

function updateNavButtons() {
  navBack.classList.toggle('disabled', pageIndex <= 0);
  navForward.classList.toggle('disabled', pageIndex >= pages.length - 1);
}

// Forward → go to medium.com
navForward.addEventListener('click', () => {
  if (pageIndex >= pages.length - 1) return;
  pageIndex++;
  navigateToPage(pages[pageIndex]);
});

// Back → go to baidu.com
navBack.addEventListener('click', () => {
  if (pageIndex <= 0) return;
  pageIndex--;
  navigateToPage(pages[pageIndex]);
});

function navigateToPage(url) {
  if (url.includes('medium')) {
    showMedium();
  } else {
    showBaidu();
  }
  updateNavButtons();
}

function showBaidu() {
  currentStep = 1;
  omniInput.value = 'baidu.com';
  pageBaidu.style.display = 'flex';
  pageMedium.style.display = 'none';

  // Reset nudge to default
  nudge.classList.remove('expanded', 'hidden', 'pressed');

  // Close side pane if open
  if (contentArea.classList.contains('pane-open')) {
    contentArea.classList.remove('pane-open');
  }
}

function showMedium() {
  currentStep = 2;
  omniInput.value = 'medium.com';
  pageBaidu.style.display = 'none';
  pageMedium.style.display = 'block';

  // Close side pane if open
  if (contentArea.classList.contains('pane-open')) {
    contentArea.classList.remove('pane-open');
  }

  // Reset pressed, expand nudge
  nudge.classList.remove('hidden', 'pressed');
  nudge.classList.add('expanded');
}

// ===== Omni box: URL input =====

omniInput.addEventListener('focus', () => {
  omniInput.select();
});

omniInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const url = omniInput.value.trim().toLowerCase();
    omniInput.blur();

    if (url.includes('medium')) {
      pageIndex = 1;
      showMedium();
    } else {
      pageIndex = 0;
      showBaidu();
    }
    updateNavButtons();
  }
});

// ===== Step 3: Click Nudge → Open Side Pane =====

let hasChattedBefore = false;

nudge.addEventListener('click', () => {
  if (currentStep === 3) {
    // Side pane is open, close it
    closeSidePane();
    return;
  }

  if (currentStep === 2) {
    transitionToStep3();
  } else if (currentStep === 1) {
    transitionToStep3Generic();
  }
});

function transitionToStep3() {
  currentStep = 3;

  // Nudge shrinks back to "Chat" state + pressed look
  nudge.classList.remove('expanded');
  nudge.classList.add('pressed');
  nudgeWrap.style.width = shortWidth + 'px';

  // Open side pane
  contentArea.classList.add('pane-open');

  // Restore user message if hidden
  document.querySelector('.sp-msg-user').style.display = '';

  if (!hasChattedBefore) {
    // First time: start typing animation
    spAiResponse.innerHTML = '<span class="sp-cursor"></span>';
    spSuggestions.classList.remove('visible');

    setTimeout(() => {
      typeAIResponse();
    }, 600);

    hasChattedBefore = true;
  }
  // Otherwise: just reopen, chat history is preserved
}

// Open side pane from baidu (generic chat)
function transitionToStep3Generic() {
  currentStep = 3;

  // Nudge stays as "Chat" + pressed look
  nudge.classList.add('pressed');

  // Open side pane
  contentArea.classList.add('pane-open');

  // Show greeting message
  const userMsg = document.querySelector('.sp-msg-user');
  userMsg.style.display = 'none';
  spAiResponse.innerHTML = 'How can I help you today?';
  spSuggestions.classList.remove('visible');
}

// ===== Close Side Pane =====

spClose.addEventListener('click', () => {
  closeSidePane();
});

function closeSidePane() {
  contentArea.classList.remove('pane-open');
  nudge.classList.remove('pressed');

  // Nudge stays as "Chat" after closing
  setTimeout(() => {
    currentStep = 2;
  }, 500);
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
      setTimeout(() => {
        spSuggestions.classList.add('visible');
      }, 300);
    }
  }

  type();
}

// ===== Init =====
document.querySelector('.toolbar-avatar').textContent = 'C';
updateNavButtons();

// Measure nudge text widths and set initial width
const nudgeWrap = document.querySelector('.nudge-text-wrap');
const nudgeShort = document.querySelector('.nudge-text-short');
const nudgeLong = document.querySelector('.nudge-text-long');

// Measure widths (temporarily make long text visible to measure)
nudgeLong.style.opacity = '1';
nudgeLong.style.position = 'static';
const longWidth = nudgeLong.offsetWidth;
nudgeLong.style.opacity = '';
nudgeLong.style.position = '';

nudgeShort.style.position = 'static';
const shortWidth = nudgeShort.offsetWidth;
nudgeShort.style.position = '';

// Set initial width
nudgeWrap.style.width = shortWidth + 'px';

// Override showBaidu/showMedium to also animate wrap width
const _origShowBaidu = showBaidu;
const _origShowMedium = showMedium;

showBaidu = function() {
  _origShowBaidu();
  nudgeWrap.style.width = shortWidth + 'px';
};

showMedium = function() {
  _origShowMedium();
  nudgeWrap.style.width = longWidth + 'px';
};
