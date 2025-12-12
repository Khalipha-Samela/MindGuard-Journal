// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Load Supabase client
    const { supabase, setupAuthListener, isAuthenticated } = await loadSupabase();
    
    // Initialize auth listener
    setupAuthListener();
    
    // Initialize form components
    initializePasswordToggles();
    initializeFormHandlers();
    
    // Check current auth state
    await checkAuthState();
});

/**
 * Dynamically load Supabase client
 */
async function loadSupabase() {
    try {
        // Dynamically import Supabase
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        // Replace with your Supabase credentials
        const supabaseUrl = 'https://vkhilikrothkpaogwbfw.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraGlsaWtyb3Roa3Bhb2d3YmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTQyNjcsImV4cCI6MjA4MTEzMDI2N30.9k36S3PLkrlvM8f7xb9RS2GRYRHrL_VFuKX22mAhztE';
        
        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Setup auth state listener
        function setupAuthListener() {
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Supabase Auth Event:', event);
                
                if (event === 'SIGNED_IN') {
                    console.log('User signed in:', session.user.email);
                    // Store session in localStorage for persistence
                    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
                } else if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                    localStorage.removeItem('supabase.auth.token');
                }
            });
        }
        
        // Check if user is authenticated
        async function isAuthenticated() {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Auth session error:', error);
                return false;
            }
            return !!session;
        }
        
        // Get current user
        async function getCurrentUser() {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) return null;
            return session.user;
        }
        
        // Sign out user
        async function signOutUser() {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                return false;
            }
            localStorage.removeItem('supabase.auth.token');
            return true;
        }
        
        return { 
            supabase, 
            setupAuthListener, 
            isAuthenticated, 
            getCurrentUser, 
            signOutUser 
        };
        
    } catch (error) {
        console.error('Failed to load Supabase:', error);
        
        // Return fallback functions for development
        return {
            supabase: null,
            setupAuthListener: () => console.log('Supabase not loaded'),
            isAuthenticated: () => Promise.resolve(false),
            getCurrentUser: () => Promise.resolve(null),
            signOutUser: () => Promise.resolve(true)
        };
    }
}

/**
 * Check authentication state and redirect if needed
 */
async function checkAuthState() {
    const { isAuthenticated } = await loadSupabase();
    const isAuth = await isAuthenticated();
    const currentPage = window.location.pathname;
    
    // Pages that don't require authentication
    const publicPages = ['/login.html', '/register.html', '/'];
    
    if (isAuth) {
        // User is logged in
        if (publicPages.some(page => currentPage.includes(page))) {
            // Redirect to dashboard if trying to access auth pages
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        }
    } else {
        // User is not logged in
        if (!publicPages.some(page => currentPage.includes(page))) {
            // Redirect to login if trying to access protected pages
            showMessage('Please log in to continue', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    }
}

/**
 * Initialize password toggle functionality
 */
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(toggleButton => {
        const passwordInput = findAssociatedPasswordInput(toggleButton);
        if (!passwordInput) return;
        
        const eyeIcon = toggleButton.querySelector('i');
        if (!eyeIcon) return;
        
        // Set initial ARIA label
        toggleButton.setAttribute('aria-label', 'Show password');
        toggleButton.setAttribute('tabindex', '0');
        toggleButton.setAttribute('role', 'button');
        
        // Add click event
        toggleButton.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, toggleButton, eyeIcon);
        });
        
        // Add keyboard accessibility
        toggleButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(passwordInput, toggleButton, eyeIcon);
            }
        });
        
        // Add focus styling
        toggleButton.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--primary)';
            this.style.outlineOffset = '2px';
            this.style.borderRadius = '4px';
        });
        
        toggleButton.addEventListener('blur', function() {
            this.style.outline = '';
        });
    });
}

/**
 * Find password input associated with toggle button
 */
function findAssociatedPasswordInput(toggleButton) {
    const wrapper = toggleButton.closest('.password-wrapper');
    if (wrapper) {
        return wrapper.querySelector('input[type="password"], input[type="text"]');
    }
    
    // Fallback to common IDs
    return document.getElementById('password') || 
           document.getElementById('password-field') || 
           document.getElementById('confirmPassword');
}

/**
 * Toggle password visibility
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
    
    // Keep focus on password input
    passwordInput.focus();
}

/**
 * Initialize form handlers based on current page
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
 * Initialize login form with Supabase authentication
 */
function initializeLoginForm(loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value.trim();
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
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Signing in...';
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        
        try {
            // Load Supabase
            const { supabase } = await loadSupabase();
            
            if (!supabase) {
                throw new Error('Authentication service is not available');
            }
            
            // Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                // Handle specific errors
                let errorMessage = 'Login failed. Please try again.';
                
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Invalid email or password.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Please verify your email before logging in.';
                } else if (error.message.includes('User not found')) {
                    errorMessage = 'No account found with this email.';
                } else if (error.message.includes('rate limit')) {
                    errorMessage = 'Too many attempts. Please try again later.';
                }
                
                throw new Error(errorMessage);
            }
            
            // Success - store user info
            localStorage.setItem('userEmail', email);
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Show error message
            showMessage(error.message || 'Login failed. Please try again.', 'error');
            
            // Restore button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
    });
}

/**
 * Initialize registration form with Supabase authentication
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
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
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
        
        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating account...';
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        
        try {
            // Load Supabase
            const { supabase } = await loadSupabase();
            
            if (!supabase) {
                throw new Error('Registration service is not available');
            }
            
            // Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        created_at: new Date().toISOString()
                    },
                    emailRedirectTo: `${window.location.origin}/login.html`
                }
            });
            
            if (error) {
                // Handle specific errors
                let errorMessage = 'Registration failed. Please try again.';
                
                if (error.message.includes('User already registered')) {
                    errorMessage = 'An account with this email already exists.';
                } else if (error.message.includes('password')) {
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                } else if (error.message.includes('rate limit')) {
                    errorMessage = 'Too many attempts. Please try again later.';
                }
                
                throw new Error(errorMessage);
            }
            
            // Check registration result
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                throw new Error('An account with this email already exists.');
            }
            
            // Success - show appropriate message
            if (data.user?.confirmed_at) {
                // Email confirmed automatically
                showMessage('Account created successfully! Logging you in...', 'success');
                
                // Auto-login
                setTimeout(async () => {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (!signInError) {
                        window.location.href = 'index.html';
                    } else {
                        window.location.href = 'login.html';
                    }
                }, 2000);
                
            } else {
                // Email confirmation required
                showMessage(
                    'Account created! Please check your email to confirm your account.',
                    'success'
                );
                
                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Show error message
            showMessage(error.message || 'Registration failed. Please try again.', 'error');
            
            // Restore button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
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
        confirmPasswordField.style.borderWidth = '2px';
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
    
    // Optional strength checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
        .filter(Boolean).length;
    
    if (strengthScore < 3) {
        return {
            valid: true, // Still valid but you could make this stricter
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
    messageEl.style.animation = 'fadeIn 0.3s ease';
    
    // Style based on type
    const styles = {
        error: {
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca'
        },
        success: {
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        info: {
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            border: '1px solid #bee5eb'
        },
        warning: {
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7'
        }
    };
    
    const style = styles[type] || styles.info;
    Object.assign(messageEl.style, style);
    
    // Insert message
    const card = document.querySelector('.card');
    const form = card.querySelector('form');
    
    if (form) {
        form.insertBefore(messageEl, form.firstChild);
    } else {
        card.insertBefore(messageEl, card.firstChild);
    }
    
    // Auto-remove after appropriate time
    const removeTime = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }
    }, removeTime);
}

/**
 * Simulate API call (for fallback purposes)
 */
function simulateApiCall(callback, delay = 1500) {
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
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
            strengthIndicator.className = 'password-strength weak';
        } else if (strength.message === 'Password is strong') {
            strengthIndicator.textContent = 'Strong password';
            strengthIndicator.style.color = '#2ecc71';
            strengthIndicator.className = 'password-strength strong';
        } else {
            strengthIndicator.textContent = strength.message;
            strengthIndicator.style.color = '#f39c12';
            strengthIndicator.className = 'password-strength medium';
        }
    });
}

/**
 * Reset form validation styles
 */
function resetFormValidation(form) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
    });
    
    const messages = form.querySelectorAll('.form-message');
    messages.forEach(msg => msg.remove());
}

// Add CSS animations for messages
if (!document.querySelector('#auth-animations')) {
    const style = document.createElement('style');
    style.id = 'auth-animations';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        
        .loading {
            position: relative;
            pointer-events: none;
        }
        
        .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 16px;
            height: 16px;
            margin: -8px 0 0 -8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .password-strength.weak { background-color: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; }
        .password-strength.medium { background-color: #fffbeb; color: #d97706; padding: 4px 8px; border-radius: 4px; }
        .password-strength.strong { background-color: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 4px; }
    `;
    document.head.appendChild(style);
}

// Export functions for use in other files
window.showMessage = showMessage;
window.validateEmail = validateEmail;
window.validatePasswordStrength = validatePasswordStrength;

// Initialize password strength indicator if on registration page
if (document.getElementById('register-form')) {
    document.addEventListener('DOMContentLoaded', initializePasswordStrengthIndicator);
}