(function() {
  const STORAGE_KEY = 'cc_consent_v1';
  const banner = document.getElementById('cc-banner');
  const overlay = document.getElementById('cc-overlay');
  const modal = document.getElementById('cc-modal');
  const togA = document.getElementById('cc-tog-analytics');
  const togM = document.getElementById('cc-tog-marketing');
  let overlaySafetyTimer = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
  function save(consent) {
    consent.timestamp = new Date().toISOString();
    consent.version = 1;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch (e) {}
  }
  function showBanner() {
    banner.classList.add('is-visible');
    banner.setAttribute('aria-hidden', 'false');

    // Failsafe: only block page interactions when the banner is truly visible.
    // Some live environments/extensions can hide the banner while our script still runs.
    requestAnimationFrame(function() {
      const computed = window.getComputedStyle(banner);
      const bannerVisible = computed.display !== 'none' &&
        computed.visibility !== 'hidden' &&
        banner.getClientRects().length > 0;

      if (bannerVisible) {
        overlay.classList.add('is-visible');
      } else {
        overlay.classList.remove('is-visible');
      }
    });

    if (overlaySafetyTimer) clearTimeout(overlaySafetyTimer);
    overlaySafetyTimer = setTimeout(function() {
      const computed = window.getComputedStyle(banner);
      const bannerVisible = computed.display !== 'none' &&
        computed.visibility !== 'hidden' &&
        banner.getClientRects().length > 0;

      if (!bannerVisible) {
        overlay.classList.remove('is-visible');
      }
    }, 1200);
  }
  function hideBanner() {
    banner.classList.remove('is-visible');
    banner.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-visible');
    if (overlaySafetyTimer) {
      clearTimeout(overlaySafetyTimer);
      overlaySafetyTimer = null;
    }
  }
  function openModal(consent) {
    if (consent) {
      togA.classList.toggle('is-on', !!consent.analytics);
      togA.setAttribute('aria-checked', !!consent.analytics);
      togM.classList.toggle('is-on', !!consent.marketing);
      togM.setAttribute('aria-checked', !!consent.marketing);
    }
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('cc-accept').addEventListener('click', function() {
    save({ essential: true, analytics: true, marketing: true });
    hideBanner();
  });
  document.getElementById('cc-reject').addEventListener('click', function() {
    save({ essential: true, analytics: false, marketing: false });
    hideBanner();
  });
  document.getElementById('cc-customize').addEventListener('click', function() {
    openModal(load());
  });

  [togA, togM].forEach(function(tog) {
    function toggle() {
      tog.classList.toggle('is-on');
      tog.setAttribute('aria-checked', tog.classList.contains('is-on'));
    }
    tog.addEventListener('click', toggle);
    tog.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });
  });
  document.getElementById('cc-modal-save').addEventListener('click', function() {
    save({
      essential: true,
      analytics: togA.classList.contains('is-on'),
      marketing: togM.classList.contains('is-on')
    });
    closeModal();
    hideBanner();
  });
  document.getElementById('cc-modal-reject').addEventListener('click', function() {
    save({ essential: true, analytics: false, marketing: false });
    closeModal();
    hideBanner();
  });
  document.getElementById('cc-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('cc-modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) closeModal();
  });

  // Footer hook
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[data-cc-open]');
    if (link) {
      e.preventDefault();
      openModal(load());
    }
  });

  // On load: show banner if no consent yet
  const current = load();
  if (!current) {
    setTimeout(showBanner, 600);
  }
})();
