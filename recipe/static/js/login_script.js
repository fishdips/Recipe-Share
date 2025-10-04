
function closeModal() {
    window.location.href = '/';
}
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

    function clearInvalid(input) {
        input.parentElement.classList.remove('invalid');
    }

    function markInvalid(input) {
        const container = input.parentElement;
        container.classList.add('invalid');
        
        // Add shake animation class
        container.classList.add('shake');
        
        setTimeout(() => {
            container.classList.remove('invalid', 'shake');
        }, 600);
    }

    emailInput.addEventListener('input', () => clearInvalid(emailInput));
    passwordInput.addEventListener('input', () => clearInvalid(passwordInput));

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        clearInvalid(emailInput);
        clearInvalid(passwordInput);

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

                console.error('Login failed:', data.error);
            }
        } catch (err) {
            console.error("Login error:", err);
            
            markInvalid(emailInput);
            markInvalid(passwordInput);
            
            alert('Connection error. Please check your internet connection and try again.');
        }
    });
});