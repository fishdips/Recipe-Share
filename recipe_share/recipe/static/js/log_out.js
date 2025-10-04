document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.cancel-btn').forEach(function(cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/main/';
        });
    });

    document.querySelectorAll('.proceed-btn').forEach(function(proceedBtn) {
        proceedBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Create a hidden form and submit it as POST
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout/';

            // Add CSRF token if available
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrfToken;
                form.appendChild(csrfInput);
            }

            document.body.appendChild(form);
            form.submit();
        });
    });

    // Helper function: get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});