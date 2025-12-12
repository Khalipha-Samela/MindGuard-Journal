// Password Toggle Functionality for Mindful Journal

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize password toggles for all password fields
    initializePasswordToggles();
    
    // Initialize form submission handlers
    initializeFormHandlers();
});

/**
 * Initialize password toggle functionality for all password fields on the page
 */
function initializePasswordToggles() {
    // Find all password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(toggleButton => {
        // Get the associated password input
        // We'll look for the password input in the same wrapper or by ID reference
        const passwordInput = findAssociatedPasswordInput(toggleButton);
        
        if (!passwordInput) {
            console.warn('No password input found for toggle button');
            return;
        }
        
        // Get the eye icon inside the toggle button
        const eyeIcon = toggleButton.querySelector('i');
        
        if (!eyeIcon) {
            console.warn('No eye icon found in toggle button');
            return;
        }
        
        // Set initial ARIA label
        toggleButton.setAttribute('aria-label', 'Show password');
        
        // Add click event to toggle password visibility
        toggleButton.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, toggleButton, eyeIcon);
        });
        
        // Add keyboard accessibility (Space or Enter)
        toggleButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(passwordInput, toggleButton, eyeIcon);
            }
        });
        
        // Add accessibility attributes
        toggleButton.setAttribute('tabindex', '0');
        toggleButton.setAttribute('role', 'button');
        
        // Add focus styling
        toggleButton.addEventListener('focus', function() {
            this.style.outline = '2px solid #4a90e2';
            this.style.borderRadius = '4px';
        });
        
        toggleButton.addEventListener('blur', function() {
            this.style.outline = '';
        });
    });
}

/**
 * Find the password input associated with a toggle button
 */
function findAssociatedPasswordInput(toggleButton) {
    // First, check if toggle button has a data-target attribute
    const targetId = toggleButton.getAttribute('data-target');
    if (targetId) {
        return document.getElementById(targetId);
    }
    
    // If not, look for password input in the same wrapper
    const wrapper = toggleButton.closest('.password-wrapper');
    if (wrapper) {
        return wrapper.querySelector('input[type="password"], input[type="text"]');
    }
    
    // Fallback: look for any password input with a specific class or ID pattern
    return document.getElementById('password') || 
           document.getElementById('password-field') || 
           document.getElementById('confirmPassword');
}

/**
 * Toggle password visibility for a specific input
 */
function togglePasswordVisibility(passwordInput, toggleButton, eyeIcon) {
    const isPassword = passwordInput.type === 'password';
    
    // Toggle input type
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Toggle eye icon
    if (isPassword) {
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        toggleButton.setAttribute('aria-label', 'Hide password');
    } else {
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        toggleButton.setAttribute('aria-label', 'Show password');
    }
    
    // Keep focus on the password input for better UX
    passwordInput.focus();
}

/**
 * Initialize form submission handlers based on current page
 */
function initializeFormHandlers() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        initializeLoginForm(loginForm);
    }
    
    if (registerForm) {
        initializeRegisterForm(registerForm);
    }
}

/**
 * Initialize login form validation and submission
 */
function initializeLoginForm(loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value || 
                        document.getElementById('password-field')?.value;
        
        // Basic validation
        if (!validateRequiredFields([email, password])) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Here you would typically make an API call
        console.log('Login attempt:', { email, password: '***' });
        
        // Simulate API call
        simulateApiCall(() => {
            showMessage('Login successful! Redirecting...', 'success');
            // In a real app, you would redirect:
            window.location.href = 'index.html';
        });
    });
}

/**
 * Initialize registration form validation and submission
 */
function initializeRegisterForm(registerForm) {
    // Real-time password confirmation check
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    if (passwordField && confirmPasswordField) {
        [passwordField, confirmPasswordField].forEach(field => {
            field.addEventListener('input', function() {
                validatePasswordMatch(passwordField, confirmPasswordField);
            });
        });
    }
    
    // Form submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName')?.value;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        // Basic validation
        if (!validateRequiredFields([fullName, email, password, confirmPassword])) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Check if passwords match
        if (!validatePasswordMatch(passwordField, confirmPasswordField)) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Check password strength
        const passwordStrength = validatePasswordStrength(password);
        if (!passwordStrength.valid) {
            showMessage(passwordStrength.message, 'error');
            return;
        }
        
        // Here you would typically make an API call
        console.log('Registration attempt:', { 
            fullName, 
            email, 
            password: '***' 
        });
        
        // Simulate API call
        simulateApiCall(() => {
            showMessage('Account created successfully! Redirecting to login...', 'success');
            
            // In a real app, you might redirect to login after a delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    });
}

/**
 * Validate that all required fields are filled
 */
function validateRequiredFields(fields) {
    return fields.every(field => field && field.trim() !== '');
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password match
 */
function validatePasswordMatch(passwordField, confirmPasswordField) {
    if (!passwordField || !confirmPasswordField) return true;
    
    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;
    
    if (!password || !confirmPassword) return true;
    
    const match = password === confirmPassword;
    
    // Visual feedback
    if (confirmPassword) {
        confirmPasswordField.style.borderColor = match ? '#2ecc71' : '#e74c3c';
    }
    
    return match;
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    const minLength = 8;
    
    if (password.length < minLength) {
        return {
            valid: false,
            message: `Password should be at least ${minLength} characters long`
        };
    }
    
    // Optional: Add more strength checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return {
            valid: true, // Still valid, but you could make this stricter
            message: 'For better security, consider using uppercase, lowercase, numbers, and special characters'
        };
    }
    
    return { valid: true, message: 'Password is strong' };
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    messageEl.style.padding = '12px';
    messageEl.style.margin = '10px 0';
    messageEl.style.borderRadius = '4px';
    messageEl.style.fontSize = '14px';
    
    // Style based on type
    if (type === 'error') {
        messageEl.style.backgroundColor = '#f8d7da';
        messageEl.style.color = '#721c24';
        messageEl.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
        messageEl.style.backgroundColor = '#d4edda';
        messageEl.style.color = '#155724';
        messageEl.style.border = '1px solid #c3e6cb';
    } else {
        messageEl.style.backgroundColor = '#d1ecf1';
        messageEl.style.color = '#0c5460';
        messageEl.style.border = '1px solid #bee5eb';
    }
    
    // Insert message after the form or at the top of the card
    const card = document.querySelector('.card');
    const form = card.querySelector('form');
    
    if (form) {
        form.insertBefore(messageEl, form.firstChild);
    } else {
        card.insertBefore(messageEl, card.firstChild);
    }
    
    // Auto-remove after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }
}

/**
 * Simulate API call (for demo purposes)
 */
function simulateApiCall(callback, delay = 1500) {
    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    // Simulate network delay
    setTimeout(() => {
        // Restore button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Execute callback
        if (callback) callback();
    }, delay);
}

/**
 * Initialize password strength indicator (optional enhancement)
 */
function initializePasswordStrengthIndicator() {
    const passwordField = document.getElementById('password');
    if (!passwordField) return;
    
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.style.fontSize = '12px';
    strengthIndicator.style.marginTop = '4px';
    strengthIndicator.style.display = 'none';
    
    passwordField.parentNode.appendChild(strengthIndicator);
    
    passwordField.addEventListener('input', function() {
        const password = this.value;
        
        if (password.length === 0) {
            strengthIndicator.style.display = 'none';
            return;
        }
        
        strengthIndicator.style.display = 'block';
        const strength = validatePasswordStrength(password);
        
        if (!strength.valid) {
            strengthIndicator.textContent = strength.message;
            strengthIndicator.style.color = '#e74c3c';
        } else if (strength.message === 'Password is strong') {
            strengthIndicator.textContent = 'Strong password';
            strengthIndicator.style.color = '#2ecc71';
        } else {
            strengthIndicator.textContent = strength.message;
            strengthIndicator.style.color = '#f39c12';
        }
    });
}