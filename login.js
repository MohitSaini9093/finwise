document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // In a real application, this would validate against the server
        // For demo purposes, we'll check against localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (userData.email === email && userData.password === password) {
            // Set login status
            localStorage.setItem('isLoggedIn', 'true');
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid email or password. Please try again.');
        }
    });
    
    // Check if user is already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }
});
