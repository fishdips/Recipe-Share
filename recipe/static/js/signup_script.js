// Form validation and functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Email validation on input
    emailInput.addEventListener('blur', function() {
        validateEmail();
    });

    emailInput.addEventListener('input', function() {
        // Clear error message while typing
        hideError(emailError);
        emailInput.classList.remove('invalid', 'valid');
    });

    // Password validation on input
    passwordInput.addEventListener('blur', function() {
        validatePassword();
        // Also validate password match if confirm password has value
        if (confirmPasswordInput.value.trim() !== '') {
            validatePasswordMatch();
        }
    });

    passwordInput.addEventListener('input', function() {
        hideError(passwordError);
        passwordInput.classList.remove('invalid', 'valid');
        confirmPasswordInput.classList.remove('invalid', 'valid');
        
        // If confirm password has value, recheck match
        if (confirmPasswordInput.value.trim() !== '') {
            setTimeout(validatePasswordMatch, 100);
        }
    });

    // Password confirmation validation
    confirmPasswordInput.addEventListener('blur', function() {
        validatePasswordMatch();
    });

    confirmPasswordInput.addEventListener('input', function() {
        hideError(passwordError);
        confirmPasswordInput.classList.remove('invalid', 'valid');
        
        // Check match in real time
        if (confirmPasswordInput.value.trim() !== '') {
            setTimeout(validatePasswordMatch, 100);
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Validate email
        if (!validateEmail()) {
            isValid = false;
        }
        
        // Validate password
        if (!validatePassword()) {
            isValid = false;
        }
        
        // Validate password match
        if (!validatePasswordMatch()) {
            isValid = false;
        }
        
        // If all validation passes, proceed
        if (isValid) {
            showSuccessMessage();
        } else {
            // Show general error if validation fails
            showError(passwordError, 'Please fix the errors above before submitting.');
        }
    });

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            showError(emailError, 'Email is required');
            emailInput.classList.add('invalid');
            emailInput.classList.remove('valid');
            return false;
        }
        
        if (!emailPattern.test(email)) {
            showError(emailError, 'Please enter a valid email address');
            emailInput.classList.add('invalid');
            emailInput.classList.remove('valid');
            return false;
        }
        
        if (!email.toLowerCase().endsWith('@cit.edu')) {
            showError(emailError, 'Email must end with @cit.edu');
            emailInput.classList.add('invalid');
            emailInput.classList.remove('valid');
            return false;
        }
        
        hideError(emailError);
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');
        return true;
    }

    function validatePassword() {
        const password = passwordInput.value;
        
        if (!password) {
            showError(passwordError, 'Password is required');
            passwordInput.classList.add('invalid');
            passwordInput.classList.remove('valid');
            return false;
        }
        
        if (password.length < 8) {
            showError(passwordError, 'Password must be at least 8 characters long');
            passwordInput.classList.add('invalid');
            passwordInput.classList.remove('valid');
            return false;
        }
        
        hideError(passwordError);
        passwordInput.classList.remove('invalid');
        passwordInput.classList.add('valid');
        return true;
    }

    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Don't validate if confirm password is empty
        if (!confirmPassword) {
            confirmPasswordInput.classList.remove('invalid', 'valid');
            hideError(passwordError);
            return true;
        }
        
        // First check if main password is valid
        if (!password || password.length < 8) {
            showError(passwordError, 'Please enter a valid password first (at least 8 characters)');
            confirmPasswordInput.classList.add('invalid');
            confirmPasswordInput.classList.remove('valid');
            return false;
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
            showError(passwordError, 'Passwords do not match');
            confirmPasswordInput.classList.add('invalid');
            confirmPasswordInput.classList.remove('valid');
            return false;
        }
        
        // Passwords match and are valid
        hideError(passwordError);
        confirmPasswordInput.classList.remove('invalid');
        confirmPasswordInput.classList.add('valid');
        return true;
    }

    function showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    function hideError(errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }

    function showSuccessMessage() {
        const button = document.querySelector('.create-account-btn');
        const originalText = button.textContent;
        button.textContent = 'Account Created! Redirecting...';
        button.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(45deg, #ff8c42, #ff6b1a)';
            button.disabled = false;
        }, 3000);
    }
});

// Toggle password visibility function
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggleIcon = field.parentElement.querySelector('.toggle-password');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggleIcon.innerHTML = '&#128064;'; // Eye with strike-through (hide icon)
    } else {
        field.type = 'password';
        toggleIcon.innerHTML = '&#128065;'; // Eye icon (show icon)
    }
}

// Close modal function
function closeModal() {
    const modal = document.querySelector('.modal');
    const overlay = document.querySelector('.overlay');
    
    modal.style.animation = 'slideOut 0.3s ease-out';
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        window.history.back();
    }, 300);
}

// Add slide out animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-30px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add escape key functionality
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Click outside modal to close
document.addEventListener('click', function(e) {
    const overlay = document.querySelector('.overlay');
    if (overlay && e.target === overlay) {
        closeModal();
    }
});