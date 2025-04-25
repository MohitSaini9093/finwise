// Setup profile update functionality
function setupProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const closeModalBtn = modal.querySelector('.close-modal');
    const profileForm = document.getElementById('profileUpdateForm');

    // Toggle dropdown
    profileButton.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    // Edit Profile button click
    editProfileBtn.addEventListener('click', function() {
        profileDropdown.classList.remove('show');
        loadUserData();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Logout button click
    logoutBtnDropdown.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });

    // Load current user data into form
    function loadUserData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        document.getElementById('updateFirstName').value = userData.firstName || '';
        document.getElementById('updateLastName').value = userData.lastName || '';
        document.getElementById('updateEmail').value = userData.email || '';
        document.getElementById('updateDob').value = userData.dob || '';
        document.getElementById('updateMonthlyIncome').value = userData.monthlyIncome || '';
        
        // Show suggestions based on current data
        showProfileSuggestions(userData);
    }

    // Function to show profile suggestions
    function showProfileSuggestions(userData) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'profile-suggestions';
        suggestionDiv.style.marginTop = '20px';
        suggestionDiv.style.padding = '15px';
        suggestionDiv.style.backgroundColor = '#f8f9fa';
        suggestionDiv.style.borderRadius = '5px';
        suggestionDiv.style.border = '1px solid #dee2e6';

        let suggestions = [];

        // Add suggestions based on profile completeness
        const requiredFields = ['firstName', 'lastName', 'email', 'dob', 'monthlyIncome'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
            suggestions.push(`Complete your profile by filling in: ${missingFields.join(', ')}`);
        }

        // Age-based suggestions
        if (userData.dob) {
            const age = calculateAge(userData.dob);
            if (age < 30) {
                suggestions.push('Consider increasing your investment in growth assets like stocks');
            } else if (age >= 30 && age < 50) {
                suggestions.push('Balance your portfolio between growth and stability');
            } else {
                suggestions.push('Consider more conservative investment options for retirement security');
            }
        }

        // Income-based suggestions
        if (userData.monthlyIncome) {
            const monthlyIncome = parseFloat(userData.monthlyIncome);
            const recommendedSavings = (monthlyIncome * 0.20).toFixed(2);
            suggestions.push(`Recommended monthly savings: ₹${recommendedSavings} (20% of income)`);
            
            if (monthlyIncome > 50000) {
                suggestions.push('Consider tax-saving investment options like ELSS funds');
            }
        }

        // Display suggestions
        if (suggestions.length > 0) {
            const header = document.createElement('h4');
            header.textContent = 'Profile Suggestions';
            header.style.marginBottom = '10px';
            header.style.color = '#2c3e50';
            suggestionDiv.appendChild(header);

            const ul = document.createElement('ul');
            ul.style.listStyleType = 'none';
            ul.style.padding = '0';
            ul.style.margin = '0';

            suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-lightbulb" style="color: #ffc107; margin-right: 8px;"></i>${suggestion}`;
                li.style.marginBottom = '8px';
                ul.appendChild(li);
            });

            suggestionDiv.appendChild(ul);
        }

        // Remove existing suggestions if any
        const existingSuggestions = document.querySelector('.profile-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }

        // Add new suggestions to the form
        profileForm.appendChild(suggestionDiv);
    }

    // Helper function to calculate age
    function calculateAge(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    // Add input validation and real-time suggestions
    const monthlyIncomeInput = document.getElementById('updateMonthlyIncome');
    monthlyIncomeInput.addEventListener('input', function() {
        const income = parseFloat(this.value);
        const suggestionSpan = this.parentElement.querySelector('.input-suggestion') || document.createElement('span');
        suggestionSpan.className = 'input-suggestion';
        suggestionSpan.style.display = 'block';
        suggestionSpan.style.fontSize = '0.8em';
        suggestionSpan.style.color = '#6c757d';
        suggestionSpan.style.marginTop = '5px';

        if (income > 0) {
            const recommendedSavings = (income * 0.20).toFixed(2);
            const recommendedEmergencyFund = (income * 6).toFixed(2);
            suggestionSpan.innerHTML = `
                <i class="fas fa-info-circle"></i> Recommendations:<br>
                • Monthly Savings: ₹${recommendedSavings}<br>
                • Emergency Fund Target: ₹${recommendedEmergencyFund}
            `;
        } else {
            suggestionSpan.textContent = '';
        }

        if (!this.parentElement.querySelector('.input-suggestion')) {
            this.parentElement.appendChild(suggestionSpan);
        }
    });

    // Close modal functionality
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        profileForm.reset();
        
        // Remove suggestions when closing
        const suggestionDiv = document.querySelector('.profile-suggestions');
        if (suggestionDiv) {
            suggestionDiv.remove();
        }
    }

    closeModalBtn.addEventListener('click', closeModal);

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const newUserData = {
            firstName: document.getElementById('updateFirstName').value,
            lastName: document.getElementById('updateLastName').value,
            email: document.getElementById('updateEmail').value,
            password: document.getElementById('updatePassword').value || currentUserData.password,
            dob: document.getElementById('updateDob').value,
            monthlyIncome: document.getElementById('updateMonthlyIncome').value
        };

        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(newUserData));

        // Update UI
        document.getElementById('userName').textContent = `${newUserData.firstName} ${newUserData.lastName}`;

        // Show success message with suggestions
        const age = calculateAge(newUserData.dob);
        const monthlyIncome = parseFloat(newUserData.monthlyIncome);
        const recommendedSavings = (monthlyIncome * 0.20).toFixed(2);

        const successMessage = `
            Profile updated successfully!
            
            Key Financial Insights:
            • Age: ${age} years
            • Recommended Monthly Savings: ₹${recommendedSavings}
            • Suggested Emergency Fund: ₹${(monthlyIncome * 6).toFixed(2)}
            
            ${age < 30 ? '👉 Great time to focus on long-term investments!' : 
              age < 50 ? '👉 Consider diversifying your investment portfolio.' :
              '👉 Focus on retirement planning and stable investments.'}
        `;

        // Update dashboard stats if we're on the dashboard page
        if (window.location.pathname.includes('dashboard.html')) {
            const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
            if (typeof updateDashboardStats === 'function') {
                updateDashboardStats(financialData.transactions || []);
            }
            if (typeof initializeExpenseChart === 'function') {
                initializeExpenseChart(financialData.transactions || []);
            }
        }

        alert(successMessage);
        closeModal();
    });
}

// Initialize profile functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Update user name in the header
    document.getElementById('userName').textContent = `${userData.firstName} ${userData.lastName}`;
    
    // Set up profile modal functionality
    setupProfileModal();
}); 