document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            dob: document.getElementById('dob').value,
            monthlyIncome: document.getElementById('monthlyIncome').value
        };
        
        // In a real application, this would be sent to the server
        // For now, we'll store it in localStorage for demo purposes
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Create user folder structure (this would normally be done on the server)
        const userFolderStructure = {
            transactions: [],
            investments: [],
            budgets: {
                needs: userData.monthlyIncome * 0.5,
                wants: userData.monthlyIncome * 0.3,
                savings: userData.monthlyIncome * 0.2
            }
        };
        
        localStorage.setItem('userFinancialData', JSON.stringify(userFolderStructure));
        
        alert('Account created successfully! You can now log in.');
        window.location.href = 'login.html';
    });
});
