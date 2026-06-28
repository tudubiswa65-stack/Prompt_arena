/* ==========================================================================
   mxo.me — AI Prompts Page
   Handles: prompt expand/collapse toggle, overflow detection,
   clipboard copy (with fallback), bookmark toggle, logo animation,
   pagination.
   ========================================================================== */

function initPromptsPage() {
  initLogoAnimation();
  initPromptToggles();
  initCopyButtons();
  initBookmarks();
  initPagination();
}

window.PageInitializers = window.PageInitializers || {};
window.PageInitializers.prompts = initPromptsPage;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPromptsPage, { once: true });
} else {
  initPromptsPage();
}

/* -------------------------------------------------------------------------
   Logo animation — play video after a short delay
   ---------------------------------------------------------------------- */
function initLogoAnimation() {
  var logo = document.querySelector('.navbar .logo-animated');
  if (!logo) return;
  var video = logo.querySelector('video');
  setTimeout(function () {
    logo.classList.add('is-playing');
    if (video) video.play().catch(function () {});
  }, 3000);
}

/* -------------------------------------------------------------------------
   Prompt expand/collapse toggle with overflow detection
   ---------------------------------------------------------------------- */
function initPromptToggles() {
  var toggles = document.querySelectorAll('.prompt-toggle');
  if (!toggles.length) return;

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cardBody = btn.closest('.card-body');
      var promptText = cardBody ? cardBody.querySelector('.prompt-text') : null;
      if (!promptText) return;

      // Collapse any other expanded prompts first
      document.querySelectorAll('.prompt-text').forEach(function (pt) {
        if (pt !== promptText && !pt.classList.contains('is-clamped')) {
          pt.classList.add('is-clamped');
          var otherBtn = pt.closest('.card-body').querySelector('.prompt-toggle');
          if (otherBtn) {
            otherBtn.textContent = 'View full prompt';
            otherBtn.setAttribute('aria-expanded', 'false');
          }
        }
      });

      var isExpanded = !promptText.classList.contains('is-clamped');

      if (isExpanded) {
        promptText.classList.add('is-clamped');
        btn.textContent = 'View full prompt';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        promptText.classList.remove('is-clamped');
        btn.textContent = 'Show less';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* overflow check — show toggle only when text is actually truncated */
  requestAnimationFrame(function () {
    setTimeout(updateToggleVisibility, 100);
  });
}

function updateToggleVisibility() {
  document.querySelectorAll('.prompt-text').forEach(function (el) {
    // Skip cards that are hidden by pagination (display: none)
    if (el.offsetParent === null) return;
    var isClamped = el.classList.contains('is-clamped');
    var isOverflow = el.scrollHeight > el.clientHeight + 2;
    var toggle = el.closest('.card-body').querySelector('.prompt-toggle');
    if (toggle) {
      toggle.classList.toggle('is-visible', isClamped && isOverflow);
    }
  });
}

/* -------------------------------------------------------------------------
   Pagination
   ---------------------------------------------------------------------- */
function initPagination() {
  var cards = document.querySelectorAll('.prompt-grid > .card');
  var paginationNav = document.querySelector('.pagination');
  if (!cards.length || !paginationNav) return;

  var ITEMS_PER_PAGE = 6;
  var totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE);
  var currentPage = 1;

  function showPage(page) {
    currentPage = page;
    var start = (page - 1) * ITEMS_PER_PAGE;
    var end = start + ITEMS_PER_PAGE;

    cards.forEach(function (card, index) {
      card.style.display = (index >= start && index < end) ? '' : 'none';
    });

    renderPaginationButtons();

    // Re-run overflow check since newly shown cards need toggle visibility updated
    requestAnimationFrame(function () {
      setTimeout(updateToggleVisibility, 50);
    });
  }

  function renderPaginationButtons() {
    paginationNav.innerHTML = '';

    // Previous button
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentPage === 1;
    if (prevBtn.disabled) {
      prevBtn.style.opacity = '0.4';
      prevBtn.style.cursor = 'not-allowed';
    }
    prevBtn.addEventListener('click', function () {
      if (currentPage > 1) showPage(currentPage - 1);
    });
    paginationNav.appendChild(prevBtn);

    // Numbered page buttons
    for (var i = 1; i <= totalPages; i++) {
      var pageBtn = document.createElement('button');
      pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      pageBtn.setAttribute('aria-label', 'Page ' + i);
      pageBtn.textContent = String(i);
      pageBtn.addEventListener('click', (function (pageNum) {
        return function () {
          showPage(pageNum);
        };
      })(i));
      paginationNav.appendChild(pageBtn);
    }

    // Next button
    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.setAttribute('aria-label', 'Next page');
    nextBtn.textContent = '›';
    nextBtn.disabled = currentPage === totalPages;
    if (nextBtn.disabled) {
      nextBtn.style.opacity = '0.4';
      nextBtn.style.cursor = 'not-allowed';
    }
    nextBtn.addEventListener('click', function () {
      if (currentPage < totalPages) showPage(currentPage + 1);
    });
    paginationNav.appendChild(nextBtn);
  }

  showPage(1);
}

/* -------------------------------------------------------------------------
   Copy prompt to clipboard with fallback
   ---------------------------------------------------------------------- */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var prompt = btn.dataset.prompt || '';
      if (!prompt) return;

      var originalText = btn.textContent;

      function onDone() {
        btn.textContent = 'Copied!';
        btn.classList.add('is-copied');
        setTimeout(function () {
          btn.textContent = originalText;
          btn.classList.remove('is-copied');
        }, 1500);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt).then(onDone).catch(function () {
          fallbackCopy(prompt, onDone);
        });
      } else {
        fallbackCopy(prompt, onDone);
      }
    });
  });
}

function fallbackCopy(text, callback) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    if (callback) callback();
  } catch (err) {
    // silently fail
  }
  document.body.removeChild(ta);
}

/* -------------------------------------------------------------------------
   Bookmark toggle
   ---------------------------------------------------------------------- */
function initBookmarks() {
  document.querySelectorAll('.bookmark').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      btn.classList.toggle('saved');
    });
  });
}
