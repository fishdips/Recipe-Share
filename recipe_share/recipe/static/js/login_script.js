document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const loginModal = document.querySelector('.login-modal');
    const loginOverlay = document.querySelector('.login-overlay');
    const closeBtn = document.getElementById('closeBtn');
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const signInBtn = document.querySelector('.sign-in-btn');
    
    // Close modal functionality
    function closeModal() {
        loginOverlay.style.opacity = '0';
        loginModal.style.transform = 'translateY(-50px) scale(0.95)';
        setTimeout(() => {
            loginOverlay.style.display = 'none';
        }, 300);
    }
    
    // Close button event listener
    closeBtn.addEventListener('click', closeModal);
    
    // Click outside modal to close
    loginOverlay.addEventListener('click', function(e) {
        if (e.target === loginOverlay) {
            closeModal();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? '🙈' : '👁';
    });
    
    // Form validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function validatePassword(password) {
        return password.length >= 6;
    }
    
    function showError(input, message) {
        // Remove existing error
        const existingError = input.parentNode.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff4444';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        
        input.parentNode.parentNode.appendChild(errorDiv);
        input.style.borderColor = '#ff4444';
    }
    
    function clearError(input) {
        const existingError = input.parentNode.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        input.style.borderColor = '#e1e5e9';
    }
    
    // Real-time validation
    emailInput.addEventListener('blur', function() {
        if (emailInput.value && !validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
        } else {
            clearError(emailInput);
        }
    });
    
    emailInput.addEventListener('input', function() {
        if (emailInput.style.borderColor === 'rgb(255, 68, 68)') {
            clearError(emailInput);
        }
    });
    
    passwordInput.addEventListener('blur', function() {
        if (passwordInput.value && !validatePassword(passwordInput.value)) {
            showError(passwordInput, 'Password must be at least 6 characters long');
        } else {
            clearError(passwordInput);
        }
    });
    
    passwordInput.addEventListener('input', function() {
        if (passwordInput.style.borderColor === 'rgb(255, 68, 68)') {
            clearError(passwordInput);
        }
    });
    
    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Clear previous errors
        clearError(emailInput);
        clearError(passwordInput);
        
        let isValid = true;
        
        // Validate email
        if (!email) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate password
        if (!password) {
            showError(passwordInput, 'Password is required');
            isValid = false;
        } else if (!validatePassword(password)) {
            showError(passwordInput, 'Password must be at least 6 characters long');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Show loading state
        signInBtn.textContent = 'Signing In...';
        signInBtn.classList.add('loading');
        signInBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Reset button state
            signInBtn.textContent = 'Sign In';
            signInBtn.classList.remove('loading');
            signInBtn.disabled = false;
            
            // For demo purposes - replace with actual authentication logic
            alert(`Login attempt with:\nEmail: ${email}\nPassword: ${'*'.repeat(password.length)}`);
            
            // On successful login, you might want to:
            // window.location.href = '/dashboard';
            // or closeModal();
        }, 2000);
    });
    
    // Handle "Sign up" link
    document.querySelector('.signup').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Sign up functionality would be implemented here');
    });
    
    // Handle "Forgot Password" link
    document.querySelector('.forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Forgot password functionality would be implemented here');
    });
    
    // Auto-focus email input when modal opens
    setTimeout(() => {
        emailInput.focus();
    }, 100);
});