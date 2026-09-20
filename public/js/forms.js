/**
 * Client-side form validation and enhancements.
 */
document.addEventListener('DOMContentLoaded', () => {
  initFormValidation();
  initImagePreview();
  initPasswordStrength();
});

function initFormValidation() {
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      let valid = true;

      // Clear previous errors
      form.querySelectorAll('.form-control.error').forEach((el) => el.classList.remove('error'));
      form.querySelectorAll('.form-error.client').forEach((el) => el.remove());

      // Required fields
      form.querySelectorAll('[required]').forEach((input) => {
        if (!input.value.trim()) {
          valid = false;
          showFieldError(input, 'This field is required');
        }
      });

      // Email validation
      form.querySelectorAll('input[type="email"]').forEach((input) => {
        if (input.value && !/^\S+@\S+\.\S+$/.test(input.value)) {
          valid = false;
          showFieldError(input, 'Please enter a valid email address');
        }
      });

      // Password match
      const password = form.querySelector('input[name="password"]');
      const confirm = form.querySelector('input[name="confirmPassword"]');
      if (password && confirm && password.value && confirm.value) {
        if (password.value !== confirm.value) {
          valid = false;
          showFieldError(confirm, 'Passwords do not match');
        }
      }

      // Min length
      form.querySelectorAll('input[minlength]').forEach((input) => {
        const min = parseInt(input.getAttribute('minlength'), 10);
        if (input.value && input.value.length < min) {
          valid = false;
          showFieldError(input, `Must be at least ${min} characters`);
        }
      });

      // Numeric min
      form.querySelectorAll('input[type="number"][min]').forEach((input) => {
        const min = parseInt(input.getAttribute('min'), 10);
        if (input.value && parseInt(input.value, 10) < min) {
          valid = false;
          showFieldError(input, `Must be at least ${min}`);
        }
      });

      if (!valid) {
        e.preventDefault();
        // Scroll to first error
        const firstError = form.querySelector('.form-control.error');
        if (firstError) firstError.focus();
      }
    });
  });
}

function showFieldError(input, message) {
  input.classList.add('error');
  const errorEl = document.createElement('p');
  errorEl.className = 'form-error client';
  errorEl.textContent = message;
  input.parentNode.appendChild(errorEl);
}

function initImagePreview() {
  const urlInputs = document.querySelectorAll('input[name="coverImage"]');
  urlInputs.forEach((input) => {
    const preview = document.getElementById('cover-preview');
    if (!preview) return;

    input.addEventListener('input', () => {
      if (input.value) {
        preview.src = input.value;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    });
  });
}

function initPasswordStrength() {
  const pwdInput = document.getElementById('reg-password');
  const bars = [
    document.getElementById('strength-bar-1'),
    document.getElementById('strength-bar-2'),
    document.getElementById('strength-bar-3'),
    document.getElementById('strength-bar-4'),
  ];
  const label = document.getElementById('strength-label');

  if (!pwdInput || !bars[0]) return;

  pwdInput.addEventListener('input', () => {
    const val = pwdInput.value;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
    const texts = ['Very Weak', 'Weak', 'Good', 'Strong'];

    bars.forEach((bar, idx) => {
      if (bar) {
        if (val.length === 0) {
          bar.style.backgroundColor = 'var(--surface-3)';
        } else if (idx < score) {
          bar.style.backgroundColor = colors[score - 1];
        } else {
          bar.style.backgroundColor = 'var(--surface-3)';
        }
      }
    });

    if (label) {
      label.textContent = val.length === 0 ? '' : texts[score - 1] || 'Very Weak';
      label.style.color = val.length === 0 ? 'var(--text-muted)' : (colors[score - 1] || '#EF4444');
    }
  });
}
