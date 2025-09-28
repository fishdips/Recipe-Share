
function closeModal() {
    window.location.href = '/';
}
// Toggle password show/hide
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggleIcon = field.parentElement.querySelector('.toggle-password');

    if (field.type === 'password') {
        field.type = 'text';
        toggleIcon.innerHTML = '&#128064;';
    } else {
        field.type = 'password';
        toggleIcon.innerHTML = '👁️'; 
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Clear previous invalid state
    function clearInvalid(input) {
        input.parentElement.classList.remove('invalid');
    }

    // Mark input as invalid and shake
    function markInvalid(input) {
        const container = input.parentElement; // This is the .input-wrapper
        container.classList.add('invalid');
        
        // Add shake animation class
        container.classList.add('shake');
        
        // Remove classes after animation completes
        setTimeout(() => {
            container.classList.remove('invalid', 'shake');
        }, 600);
    }

    // Add input event listeners to clear invalid state when user types
    emailInput.addEventListener('input', () => clearInvalid(emailInput));
    passwordInput.addEventListener('input', () => clearInvalid(passwordInput));

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear any previous invalid states
        clearInvalid(emailInput);
        clearInvalid(passwordInput);

        // Basic client-side validation
        if (!email) {
            markInvalid(emailInput);
            return;
        }

        if (!password) {
            markInvalid(passwordInput);
            return;
        }

        try {
            const response = await fetch(loginForm.action || window.location.href, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")?.value || ""
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Successful login
                const redirectUrl = data.redirect_url || '/main_page/';
                window.location.href = redirectUrl;
            } else {
                // Login failed
                const errorMessage = data.error ? data.error.toLowerCase() : '';
                
                if (errorMessage.includes('password') || errorMessage.includes('incorrect')) {
                    // Wrong password
                    markInvalid(passwordInput);
                } else if (errorMessage.includes('email') || errorMessage.includes('user') || errorMessage.includes('account')) {
                    markInvalid(emailInput);
                } else {
                    markInvalid(emailInput);
                    markInvalid(passwordInput);
                }

                // Optional: Display error message to user
                console.error('Login failed:', data.error);
            }
        } catch (err) {
            console.error("Login error:", err);
            
            // Wrong email / password
            markInvalid(emailInput);
            markInvalid(passwordInput);
            
            alert('Connection error. Please check your internet connection and try again.');
        }
    });
});