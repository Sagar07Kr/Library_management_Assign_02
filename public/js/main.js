/**
 * LibraryMS — Core Client-Side Interactions
 * Handles: Theme Toggle, Dropdowns, Mobile Drawer, Modals, Toasts, Password Visibility
 */

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
     1. Theme Toggle (Light / Dark Mode with System Preference & Storage)
     -------------------------------------------------------------------------- */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  const getPreferredTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }

  // Listen to OS system preference changes if user hasn't explicitly set a choice
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /* --------------------------------------------------------------------------
     2. User Avatar Dropdown
     -------------------------------------------------------------------------- */
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = userDropdown.classList.contains('show');
      userDropdown.classList.toggle('show');
      userMenuBtn.setAttribute('aria-expanded', !isExpanded);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
        userDropdown.classList.remove('show');
        userMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && userDropdown.classList.contains('show')) {
        userDropdown.classList.remove('show');
        userMenuBtn.setAttribute('aria-expanded', 'false');
        userMenuBtn.focus();
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. Mobile Navigation Drawer
     -------------------------------------------------------------------------- */
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileDrawerBackdrop = document.getElementById('mobile-drawer-backdrop');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');

  const openDrawer = () => {
    mobileDrawer?.classList.add('show');
    mobileDrawerBackdrop?.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    mobileDrawer?.classList.remove('show');
    mobileDrawerBackdrop?.classList.remove('show');
    document.body.style.overflow = '';
  };

  if (menuToggleBtn) menuToggleBtn.addEventListener('click', openDrawer);
  if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', closeDrawer);
  if (mobileDrawerBackdrop) mobileDrawerBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer?.classList.contains('show')) {
      closeDrawer();
    }
  });

  /* --------------------------------------------------------------------------
     4. Password Visibility Toggle
     -------------------------------------------------------------------------- */
  const passwordToggles = document.querySelectorAll('[data-password-toggle]');
  passwordToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-password-toggle');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');

      const eyeIcon = btn.querySelector('.icon-eye');
      const eyeOffIcon = btn.querySelector('.icon-eye-off');
      if (eyeIcon && eyeOffIcon) {
        eyeIcon.style.display = isPassword ? 'none' : 'block';
        eyeOffIcon.style.display = isPassword ? 'block' : 'none';
      }
    });
  });

  /* --------------------------------------------------------------------------
     5. Toast Auto-Dismissal
     -------------------------------------------------------------------------- */
  const toasts = document.querySelectorAll('.toast');
  toasts.forEach((toast) => {
    const closeBtn = toast.querySelector('.toast-close-btn');

    const dismissToast = () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 200);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismissToast);

    // Auto dismiss after 5 seconds
    setTimeout(dismissToast, 5000);
  });

  /* --------------------------------------------------------------------------
     6. Delete Confirmation Modal
     -------------------------------------------------------------------------- */
  const deleteModal = document.getElementById('delete-modal');
  const deleteForm = document.getElementById('delete-form');
  const itemNameElem = deleteModal?.querySelector('.modal-item-name');

  window.openDeleteModal = (actionUrl, itemName) => {
    if (!deleteModal || !deleteForm) return;
    deleteForm.action = actionUrl;
    if (itemNameElem && itemName) itemNameElem.textContent = `"${itemName}"`;
    deleteModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  window.confirmDelete = window.openDeleteModal;

  const closeDeleteModal = () => {
    deleteModal?.classList.remove('show');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-dismiss="modal"]').forEach((btn) => {
    btn.addEventListener('click', closeDeleteModal);
  });

  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  /* --------------------------------------------------------------------------
     7. Form Submit Loading Spinners
     -------------------------------------------------------------------------- */
  const forms = document.querySelectorAll('form[data-loading]');
  forms.forEach((form) => {
    form.addEventListener('submit', () => {
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.add('loading');
        setTimeout(() => {
          submitBtn.classList.remove('loading');
        }, 8000);
      }
    });
  });

  // Reset loading spinner on page restore / bfcache
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('button.loading').forEach((btn) => {
      btn.classList.remove('loading');
    });
  });

  /* --------------------------------------------------------------------------
     8. Catalogue Grid / List View Switcher
     -------------------------------------------------------------------------- */
  const gridBtn = document.getElementById('view-grid-btn');
  const listBtn = document.getElementById('view-list-btn');
  const booksContainer = document.getElementById('books-container');

  if (gridBtn && listBtn && booksContainer) {
    const setView = (mode) => {
      if (mode === 'list') {
        booksContainer.classList.add('view-list');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
      } else {
        booksContainer.classList.remove('view-list');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
      }
      localStorage.setItem('books-view', mode);
    };

    gridBtn.addEventListener('click', () => setView('grid'));
    listBtn.addEventListener('click', () => setView('list'));

    // Restore saved view
    const savedView = localStorage.getItem('books-view');
    if (savedView === 'list') setView('list');
  }
});
