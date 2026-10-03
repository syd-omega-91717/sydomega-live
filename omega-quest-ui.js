/* ============================================================================
 * OMEGA QUEST UI -- Modals, progress bars, celebrations, detail views
 * Renders quest progression interface across all pages
 * ============================================================================ */

const OmegaQuestUI = (() => {
  const config = {
    modalZIndex: 5000,
    animationDuration: 400
  };

  // Create quest detail modal
  const createDetailModal = (quest, progress) => {
    const modal = document.createElement('div');
    modal.className = 'oc-quest-modal';
    modal.setAttribute('role', 'dialog');

    const status = progress?.status || 'not_started';
    const progressPct = progress ? Math.round((progress.progress / progress.target) * 100) : 0;
    const isComplete = status === 'completed';

    modal.innerHTML = `
      <div class="oc-quest-overlay"></div>
      <div class="oc-quest-panel">
        <div class="oc-quest-header">
          <div class="oc-quest-icon">${quest.icon_glyph || '⚔'}</div>
          <div class="oc-quest-title-block">
            <h2 class="oc-quest-title">${quest.title}</h2>
            <p class="oc-quest-domain">${quest.domain}</p>
          </div>
          <button class="oc-quest-close" aria-label="Close quest modal">×</button>
        </div>

        <div class="oc-quest-body">
          <p class="oc-quest-description">${quest.description}</p>

          <div class="oc-quest-progress-block">
            <div class="oc-quest-progress-label">
              <span>Progress</span>
              <span class="oc-quest-progress-pct">${progressPct}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${progressPct}%; background: var(--solar);"></div>
            </div>
            ${progress ? `<p class="oc-quest-progress-text">${Math.round(progress.progress)} / ${Math.round(progress.target)}</p>` : ''}
          </div>

          <div class="oc-quest-rewards">
            <div class="oc-quest-reward-item">
              <span class="oc-quest-reward-label">Points</span>
              <span class="oc-quest-reward-value">${quest.reward_points}</span>
            </div>
            <div class="oc-quest-reward-item">
              <span class="oc-quest-reward-label">Tier Unlock</span>
              <span class="oc-quest-reward-value">Tier ${quest.tier_unlock}</span>
            </div>
            ${isComplete ? `<div class="oc-quest-reward-item oc-quest-completed">
              <span class="oc-quest-reward-label">Status</span>
              <span class="oc-quest-reward-value">✓ Complete</span>
            </div>` : ''}
          </div>
        </div>

        <div class="oc-quest-footer">
          <button class="btn oc-quest-btn-close">Close</button>
          ${!isComplete && status !== 'in_progress' ? `<button class="btn btn-fill oc-quest-btn-start">Start Quest</button>` : ''}
        </div>
      </div>
    `;

    // Wire close handlers
    const closeBtn = modal.querySelector('.oc-quest-close');
    const closeBtnFooter = modal.querySelector('.oc-quest-btn-close');
    const startBtn = modal.querySelector('.oc-quest-btn-start');
    const overlay = modal.querySelector('.oc-quest-overlay');

    const closeHandler = () => modal.remove();
    closeBtn?.addEventListener('click', closeHandler);
    closeBtnFooter?.addEventListener('click', closeHandler);
    overlay?.addEventListener('click', closeHandler);

    startBtn?.addEventListener('click', () => {
      if (window.OmegaQuests) {
        OmegaQuests.startQuest(quest.domain, quest.quest_key);
      }
    });

    return modal;
  };

  // Create progress bar widget
  const createProgressBar = (quest, progress) => {
    const container = document.createElement('div');
    container.className = 'oc-quest-progress-widget';

    const progressPct = progress ? Math.round((progress.progress / progress.target) * 100) : 0;
    const status = progress?.status || 'not_started';

    container.innerHTML = `
      <div class="oc-quest-progress-row">
        <span class="oc-quest-progress-label">${quest.title}</span>
        <span class="oc-quest-progress-pct">${progressPct}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${progressPct}%; background: var(--${status === 'completed' ? 'green' : 'solar'});"></div>
      </div>
    `;

    return container;
  };

  // Celebration animation
  const celebrate = (questTitle) => {
    const celebration = document.createElement('div');
    celebration.className = 'oc-quest-celebration';
    celebration.innerHTML = `
      <div class="oc-celebration-content">
        <div class="oc-celebration-icon">✓</div>
        <h3>Quest Complete!</h3>
        <p>${questTitle}</p>
      </div>
    `;
    document.body.appendChild(celebration);

    // Auto-dismiss
    setTimeout(() => {
      celebration.classList.add('oc-celebration-fade-out');
      setTimeout(() => celebration.remove(), 300);
    }, 3000);
  };

  // Show quest detail modal
  const showQuestDetail = (quest, progress) => {
    const modal = createDetailModal(quest, progress);
    document.body.appendChild(modal);
    // Trigger animation
    setTimeout(() => modal.classList.add('oc-quest-modal-open'), 10);
  };

  // Inject styles
  const injectStyles = () => {
    if (document.getElementById('oc-quest-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'oc-quest-ui-styles';
    style.textContent = `
      /* Quest Modals & UI */
      .oc-quest-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${config.modalZIndex};
        opacity: 0;
        transition: opacity 200ms ease;
      }

      .oc-quest-modal.oc-quest-modal-open {
        opacity: 1;
      }

      .oc-quest-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(3px);
      }

      .oc-quest-panel {
        position: relative;
        z-index: 1;
        background: var(--void);
        border: 1px solid rgba(201, 168, 76, 0.2);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        max-width: 420px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideUp 300ms ease;
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .oc-quest-header {
        display: flex;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid rgba(201, 168, 76, 0.1);
        align-items: flex-start;
      }

      .oc-quest-icon {
        font-size: 28px;
        min-width: 32px;
        text-align: center;
      }

      .oc-quest-title-block {
        flex: 1;
      }

      .oc-quest-title {
        font-family: var(--D);
        font-size: 18px;
        color: var(--gold);
        margin: 0 0 4px;
        line-height: 1.2;
      }

      .oc-quest-domain {
        font-family: var(--M);
        font-size: 12px;
        letter-spacing: 1px;
        color: var(--muted);
        margin: 0;
        text-transform: uppercase;
      }

      .oc-quest-close {
        background: none;
        border: none;
        color: var(--muted);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        min-width: auto;
        transition: color 200ms;
      }

      .oc-quest-close:hover {
        color: var(--gold);
      }

      .oc-quest-body {
        padding: 16px;
      }

      .oc-quest-description {
        font-size: 13px;
        color: var(--muted);
        line-height: 1.6;
        margin: 0 0 16px;
      }

      .oc-quest-progress-block {
        margin-bottom: 16px;
      }

      .oc-quest-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-family: var(--M);
        color: var(--muted);
        margin-bottom: 6px;
        letter-spacing: 1px;
      }

      .oc-quest-progress-pct {
        color: var(--gold);
        font-weight: bold;
      }

      .oc-quest-progress-text {
        font-size: 12px;
        color: var(--muted);
        margin: 4px 0 0;
      }

      .oc-quest-rewards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        padding: 12px;
        background: rgba(201, 168, 76, 0.04);
        border-radius: 4px;
      }

      .oc-quest-reward-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .oc-quest-reward-label {
        font-size: 12px;
        font-family: var(--M);
        color: var(--muted);
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .oc-quest-reward-value {
        font-family: var(--D);
        font-size: 16px;
        color: var(--gold);
      }

      .oc-quest-reward-item.oc-quest-completed .oc-quest-reward-value {
        color: var(--green);
      }

      .oc-quest-footer {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid rgba(201, 168, 76, 0.1);
      }

      .oc-quest-footer .btn {
        flex: 1;
      }

      .oc-quest-progress-widget {
        padding: 12px;
        background: rgba(201, 168, 76, 0.04);
        border-radius: 4px;
        border: 1px solid rgba(201, 168, 76, 0.1);
      }

      .oc-quest-progress-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        font-size: 12px;
      }

      .oc-celebration-icon {
        font-size: 48px;
        text-align: center;
        margin-bottom: 8px;
        animation: celebrateBounce 600ms ease;
      }

      @keyframes celebrateBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      .oc-quest-celebration {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--void);
        border: 2px solid var(--green);
        border-radius: 8px;
        padding: 24px;
        z-index: ${config.modalZIndex - 1};
        text-align: center;
        animation: slideInRight 400ms ease;
      }

      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      .oc-quest-celebration.oc-celebration-fade-out {
        animation: slideOutRight 300ms ease;
      }

      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }

      .oc-celebration-content h3 {
        font-family: var(--D);
        font-size: 18px;
        color: var(--green);
        margin: 0 0 4px;
      }

      .oc-celebration-content p {
        font-size: 13px;
        color: var(--muted);
        margin: 0;
      }

      @media (max-width: 600px) {
        .oc-quest-panel {
          width: 95%;
          max-height: 90vh;
        }

        .oc-quest-celebration {
          bottom: 60px;
          right: 10px;
          left: 10px;
          max-width: calc(100% - 20px);
        }
      }
    `;

    document.head?.appendChild(style) || document.documentElement.appendChild(style);
  };

  // Initialize on load
  const init = () => {
    injectStyles();

    // Subscribe to quest events
    if (window.OmegaQuests) {
      OmegaQuests.subscribe((event, data) => {
        if (event === 'questCompleted') {
          celebrate('Quest Completed!');
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    showQuestDetail,
    createProgressBar,
    celebrate,
    createDetailModal
  };
})();
