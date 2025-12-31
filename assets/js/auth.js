// ==============================================
// IMMEDIATE AUTH CHECK - RUNS AS SOON AS SCRIPT LOADS
// ==============================================
(function immediateAuthCheck() {
    console.log('Running immediate auth check...');
    
    // Get current page
    const currentPage = window.location.pathname;
    console.log('Current page:', currentPage);
    
    // Check for Supabase token in localStorage (Supabase stores it like this)
    // Supabase v2 stores tokens in localStorage with key: sb-{project-ref}-auth-token
    const supabaseToken = localStorage.getItem('sb-udashmvrlcpdrjdqczig-auth-token');
    const hasToken = !!supabaseToken;
    
    console.log('Has Supabase token:', hasToken);
    
    // RULE 1: If on protected pages (index.html, history.html) AND no token → redirect to login
    if ((currentPage.includes('index.html') || currentPage.includes('history.html')) && !hasToken) {
        console.log('No token on protected page, redirecting to login...');
        window.location.replace('login.html');
        return; // Stop execution
    }
    
    // RULE 2: If on auth pages (login.html, register.html) AND has token → redirect to index
    if ((currentPage.includes('login.html') || currentPage.includes('register.html')) && hasToken) {
        console.log('Already logged in, redirecting to dashboard...');
        window.location.replace('index.html');
        return; // Stop execution
    }
})();

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for Supabase...');
    
    // Wait for Supabase to be ready
    waitForSupabaseAndInitialize();
});

function waitForSupabaseAndInitialize() {
    // Check if Supabase is already available
    const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
    
    if (supabase && supabase.auth) {
        console.log('Supabase already available, initializing auth...');
        initializeAuth();
    } else {
        console.log('Supabase not ready yet, waiting...');
        
        // Listen for the ready event from supabase-config.js
        window.addEventListener('mindguardSupabaseReady', function(event) {
            console.log('mindguardSupabaseReady event received', event.detail);
            initializeAuth();
        });
        
        // Also check periodically (fallback)
        const checkInterval = setInterval(() => {
            const supabaseCheck = window.mindguardSupabase || window.supabaseClient || window.supabase;
            if (supabaseCheck && supabaseCheck.auth) {
                console.log('Supabase found during periodic check');
                clearInterval(checkInterval);
                initializeAuth();
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('Supabase not loaded after timeout');
            // Still try to initialize forms (they'll show error if needed)
            initializeFormHandlers();
            initializePasswordToggles();
        }, 5000);
    }
}

function initializeAuth() {
    console.log('Initializing auth components...');
    
    // Initialize password toggles
    initializePasswordToggles();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Check auth state
    checkAuthState();
}

/**
 * Check authentication state
 */
async function checkAuthState() {
    try {
        console.log('Checking auth state...');
        
        // Check all possible Supabase client locations
        const supabase = window.mindguardSupabase || window.supabaseClient || window.supabase;
        
        if (!supabase) {
            console.warn('Supabase client not initialized - checking multiple sources:', {
                mindguardSupabase: !!window.mindguardSupabase,
                supabaseClient: !!window.supabaseClient,
                supabase: !!window.supabase
            });
            return;
        }
        
        console.log('Supabase client found, checking session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return;
        }
        
        console.log('Session check result:', { hasSession: !!session, email: session?.user?.email });
        
        const currentPage = window.location.pathname;
        console.log('Current page:', currentPage);
        
        // If user is logged in and on auth pages, redirect to dashboard
        if (session && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
            console.log('User is logged in, redirecting to index.html...');
            window.location.href = 'index.html';
            return;
        }
        
        // If user is not logged in and on protected pages, redirect to login
        if (!session && (currentPage.includes('index.html') || currentPage.includes('history.html'))) {
            console.log('User is not logged in, redirecting to login.html...');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Auth state check complete - no redirect needed');
        
    } catch (error) {
        console.error('Error checking auth state:', error);
    }
}

/**
 * Initialize password toggle functionality
 */
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(toggleButton => {
        // Find the associated password input
        const passwordInput = findAssociatedPasswordInput(toggleButton);
        if (!passwordInput) {
            console.warn('No password input found for toggle button:', toggleButton);
            return;
        }
        
        const eyeIcon = toggleButton.querySelector('i');
        if (!eyeIcon) {
            console.warn('No icon found in toggle button:', toggleButton);
            return;
        }
        
        // Set initial state and attributes
        toggleButton.setAttribute('aria-label', 'Show password');
        toggleButton.setAttribute('tabindex', '0');
        toggleButton.setAttribute('role', 'button');
        
        // Ensure proper initial icon
        if (passwordInput.type === 'password') {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        } else {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        }
        
        // Toggle password visibility on click
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            togglePasswordVisibility(passwordInput, toggleButton, eyeIcon);
        });
        
        // Keyboard accessibility
        toggleButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(passwordInput, toggleButton, eyeIcon);
            }
        });
    });
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        setupLoginForm(loginForm);
    }
    
    if (registerForm) {
        setupRegisterForm(registerForm);
    }
}

/**
 * Setup login form with Supabase
 */
function setupLoginForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value.trim();
        const passwordInput = document.getElementById('password') || document.getElementById('password-field');
        const password = passwordInput?.value;
        
        // Validate inputs
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Get Supabase client
        const supabase = window.supabaseClient;
        if (!supabase) {
            showMessage('Authentication service not available. Please try again later.', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        
        try {
            // Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            if (data?.user) {
                showMessage('Login successful! Redirecting...', 'success');
                
                // Store user info in localStorage if needed
                localStorage.setItem('user', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email
                }));
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // User-friendly error messages
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please confirm your email before logging in.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'Too many attempts. Please try again later.';
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Setup registration form with Supabase
 */
function setupRegisterForm(form) {
    // Real-time password validation
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    if (passwordField && confirmPasswordField) {
        [passwordField, confirmPasswordField].forEach(field => {
            field.addEventListener('input', function() {
                validatePasswordMatch(passwordField, confirmPasswordField);
            });
        });
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = passwordField?.value;
        const confirmPassword = confirmPasswordField?.value;
        
        // Validate inputs
        if (!fullName || !email || !password || !confirmPassword) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        const passwordStrength = validatePasswordStrength(password);
        if (!passwordStrength.valid) {
            showMessage(passwordStrength.message, 'error');
            return;
        }
        
        // Get Supabase client
        const supabase = window.supabaseClient;
        if (!supabase) {
            showMessage('Registration service not available. Please try again later.', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;
        
        try {
            // Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        created_at: new Date().toISOString()
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            if (data?.user) {
                showMessage('Account created successfully! Please check your email to confirm your account.', 'success');
                
                // Clear form
                form.reset();
                
                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('already registered')) {
                errorMessage = 'This email is already registered. Please try logging in.';
            } else if (error.message.includes('weak password')) {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'Too many attempts. Please try again later.';
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Sign out function
 */
async function signOut() {
    try {
        const supabase = window.supabaseClient;
        
        if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        }
        
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('journalEntries'); // Optional: clear journal data on logout
        
        // Show message
        showToast({
            title: "Signed Out",
            description: "You have been successfully signed out.",
            type: "success"
        });
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Sign out error:', error);
        showToast({
            title: "Error",
            description: "Failed to sign out. Please try again.",
            type: "destructive"
        });
    }
}

/**
 * Find associated password input for toggle button
 */
function findAssociatedPasswordInput(toggleButton) {
    // Try data-target attribute first
    const targetId = toggleButton.getAttribute('data-target');
    if (targetId) {
        return document.getElementById(targetId);
    }
    
    // Look for input in the same wrapper
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
    if (!passwordInput) return;
    
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    if (isPassword) {
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        toggleButton.setAttribute('aria-label', 'Hide password');
    } else {
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        toggleButton.setAttribute('aria-label', 'Show password');
    }
    
    // Keep focus on input for better UX
    passwordInput.focus();
}

/**
 * Validate required fields
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
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return {
            valid: true,
            message: 'For better security, use uppercase, lowercase, numbers, and special characters'
        };
    }
    
    return { valid: true, message: 'Password is strong' };
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    
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
    
    // Add styling
    messageEl.style.padding = '12px 16px';
    messageEl.style.margin = '16px 0';
    messageEl.style.borderRadius = '4px';
    messageEl.style.fontSize = '14px';
    
    // Insert message
    const card = document.querySelector('.card');
    if (card) {
        const form = card.querySelector('form');
        if (form) {
            form.insertBefore(messageEl, form.firstChild);
        } else {
            card.insertBefore(messageEl, card.firstChild);
        }
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
 * Show toast notification (for dashboard pages)
 */
function showToast({ title, description, type = 'success' }) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'destructive' ? 'times-circle' : 'info-circle'} toast-icon"></i>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-description">${description}</div>
            </div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideInFromRight 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Make functions available globally
window.signOut = signOut;
window.showToast = showToast;