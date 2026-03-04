/**
 * Form Validation Utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { field: 'email', message: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }

  if (email.length > 254) {
    return { field: 'email', message: 'Email is too long' };
  }

  return null;
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }

  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { field: 'password', message: 'Password is too long' };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      field: 'password',
      message: 'Password must contain uppercase, lowercase, number, and special character',
    };
  }

  return null;
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(
  password,
  confirmPassword
) {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: 'Password confirmation is required' };
  }

  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: 'Passwords do not match' };
  }

  return null;
}

/**
/**
 * Validate name
 */
export function validateName(name) {
  if (!name || !name.trim()) {
    return { field: 'name', message: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { field: 'name', message: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 100) {
    return { field: 'name', message: 'Name is too long' };
  }

  return null;
}

/**
 * Validate login form
 */
export function validateLoginForm(email, password) {
  const errors = [];

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate registration form
 */
export function validateRegisterForm(
  name,
  email,
  password,
  confirmPassword
) {
  const errors = [];

  const nameError = validateName(name);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  const confirmError = validatePasswordConfirmation(password, confirmPassword);
  if (confirmError) errors.push(confirmError);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength level (0-4)
 */
export function getPasswordStrength(password) {
  if (!password) return 0;

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;

  return Math.min(strength, 4);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength) {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[strength] || 'Very Weak';
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength) {
  const colors = [
    'text-red-600',      // Very Weak
    'text-orange-600',   // Weak
    'text-yellow-600',   // Fair
    'text-blue-600',     // Good
    'text-green-600',    // Strong
  ];
  return colors[strength] || 'text-red-600';
}
