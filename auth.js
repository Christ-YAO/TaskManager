// Authentication logic
document.addEventListener('DOMContentLoaded', function() {
    // Create admin account if it doesn't exist
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(u => u.role === 'admin');
    
    if (!adminExists) {
        const adminUser = {
            id: 'admin-' + Date.now().toString(),
            name: 'Administrateur',
            email: 'admin@taskmanager.com',
            password: 'admin123',
            role: 'admin'
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    // Check if user is already logged in
    if (localStorage.getItem('currentUser')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Toggle between login and register forms
    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // Save current user
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Check if user has access to another user's dashboard
                // If accessing someone else's dashboard, check authorization
                const urlParams = new URLSearchParams(window.location.search);
                const ownerId = urlParams.get('ownerId');
                
                if (ownerId && ownerId !== user.id) {
                    // Check if user is authorized
                    const authorizedEmails = JSON.parse(localStorage.getItem('authorizedEmails') || '{}');
                    const authorizedList = authorizedEmails[ownerId] || [];
                    
                    if (!authorizedList.includes(user.email.toLowerCase())) {
                        // User not authorized, redirect to own dashboard
                        window.location.href = 'dashboard.html';
                        return;
                    }
                }
                
                window.location.href = 'dashboard.html';
            } else {
                alert('Email ou mot de passe incorrect');
            }
        });
    }

    // Handle registration
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');

            // Check if user already exists
            if (users.find(u => u.email === email)) {
                alert('Cet email est déjà utilisé');
                return;
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                name: name,
                email: email,
                password: password,
                role: 'user' // Default role
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));

            window.location.href = 'dashboard.html';
        });
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

