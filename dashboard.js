let currentSortField = 'date';
let currentSortDirection = 'desc';
let expenseChart = null; // Add this line to track the chart instance

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    // Load user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
    
    // Update user name in the header
    document.getElementById('userName').textContent = `${userData.firstName} ${userData.lastName}`;
    
    // Initialize Add Transaction button
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const transactionModal = document.getElementById('transactionModal');
    if (addTransactionBtn && transactionModal) {
        addTransactionBtn.addEventListener('click', function() {
            transactionModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Reset form when opening
            const form = document.getElementById('transactionForm');
            if (form) {
                form.reset();
                document.getElementById('transactionDate').valueAsDate = new Date();
                updateCategoryOptions();
            }
        });
    }

    // Initialize Import Transactions button
    const importBtn = document.getElementById('importTransactionsBtn');
    const importModal = document.getElementById('importTransactionsModal');
    if (importBtn && importModal) {
        importBtn.addEventListener('click', function() {
            importModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Reset form when opening
            const fileInput = document.getElementById('csvFile');
            const previewContainer = document.getElementById('previewData');
            if (fileInput) fileInput.value = '';
            if (previewContainer) previewContainer.style.display = 'none';
        });
    }

    // Initialize close buttons for all modals
    document.querySelectorAll('.modal .close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    });
    
    // Load transactions
    loadTransactions(financialData.transactions || []);
    
    // Initialize charts with empty data if no transactions exist
    initializeExpenseChart(financialData.transactions || []);
    
    // Set up sorting functionality
    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', function() {
            const sortField = this.dataset.sort;
            
            // Toggle sort direction if clicking the same field
            if (sortField === currentSortField) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortField = sortField;
                currentSortDirection = 'asc';
            }
            
            // Update sort button icons
            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.remove('active', 'asc', 'desc');
            });
            this.classList.add('active', currentSortDirection);
            
            // Reload transactions with new sort
            const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
            loadTransactions(financialData.transactions || []);
        });
    });

    // Set up transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const transactionType = document.getElementById('transactionType').value;
            const amount = Math.abs(parseFloat(document.getElementById('transactionAmount').value));
            const category = document.getElementById('transactionCategory').value;
            const description = document.getElementById('transactionDescription').value;
            const date = document.getElementById('transactionDate').value;
            
            // Validate inputs
            if (!amount || isNaN(amount)) {
                alert('Please enter a valid amount');
                return;
            }

            if (!category) {
                alert('Please select a category');
                return;
            }

            if (!description) {
                alert('Please enter a description');
                return;
            }

            if (!date) {
                alert('Please select a date');
                return;
            }
            
            // Create new transaction object
            const newTransaction = {
                date: date,
                description: description,
                category: category,
                amount: amount, // Store positive amount
                type: transactionType // Store transaction type for proper balance calculation
            };
            
            // Get existing financial data
            const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
            if (!financialData.transactions) {
                financialData.transactions = [];
            }
            
            // Add new transaction
            financialData.transactions.push(newTransaction);
            
            // Save back to localStorage
            localStorage.setItem('userFinancialData', JSON.stringify(financialData));
            
            // Update UI
            loadTransactions(financialData.transactions);
            initializeExpenseChart(financialData.transactions);
            updateDashboardStats(financialData.transactions);
            
            // Close modal and reset form
            const modal = document.getElementById('transactionModal');
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.reset();
            document.getElementById('transactionDate').valueAsDate = new Date();
            updateCategoryOptions();
            
            // Show success message with transaction details
            const formattedAmount = formatCurrency(transactionType === 'expense' ? -amount : amount);
            const message = `Transaction added successfully!\n` +
                `Type: ${transactionType}\n` +
                `Amount: ${formattedAmount}\n` +
                `Category: ${category}`;
            alert(message);
        });
    }

    // Set up import functionality
    const importButton = document.getElementById('importButton');
    if (importButton) {
        importButton.addEventListener('click', importTransactions);
    }

    const fileInput = document.getElementById('csvFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Set up logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });

    // Call updateCategoryOptions when the page loads
    const transactionType = document.getElementById('transactionType');
    if (transactionType) {
        transactionType.addEventListener('change', updateCategoryOptions);
        // Initialize category options
        updateCategoryOptions();
        // Set default date as today for new transactions
        document.getElementById('transactionDate').valueAsDate = new Date();
    }
});

function updateCategoryOptions() {
    const transactionType = document.getElementById('transactionType').value;
    const expenseCategories = document.getElementById('expenseCategories');
    const incomeCategories = document.getElementById('incomeCategories');
    const categorySelect = document.getElementById('transactionCategory');

    // First, clear the current selection
    categorySelect.value = '';

    // Show/hide appropriate category groups
    if (transactionType === 'expense') {
        if (expenseCategories) expenseCategories.style.display = '';
        if (incomeCategories) incomeCategories.style.display = 'none';
        // Enable expense options, disable income options
        Array.from(categorySelect.options).forEach(option => {
            const isIncomeOption = option.parentElement.id === 'incomeCategories';
            option.disabled = isIncomeOption;
            option.style.display = isIncomeOption ? 'none' : '';
        });
    } else {
        if (expenseCategories) expenseCategories.style.display = 'none';
        if (incomeCategories) incomeCategories.style.display = '';
        // Enable income options, disable expense options
        Array.from(categorySelect.options).forEach(option => {
            const isExpenseOption = option.parentElement.id === 'expenseCategories';
            option.disabled = isExpenseOption;
            option.style.display = isExpenseOption ? 'none' : '';
        });
    }
}

function loadTransactions(transactions) {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) {
        console.error('Transaction table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Get spending limits from localStorage
    const spendingLimits = JSON.parse(localStorage.getItem('spendingLimits') || '{}');
    
    // Calculate current month's spending by category
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlySpendingByCategory = transactions.reduce((acc, transaction) => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
            acc[transaction.category] = (acc[transaction.category] || 0) + parseFloat(transaction.amount);
        }
        return acc;
    }, {});
    
    // Sort transactions based on current sort field and direction
    const sortedTransactions = [...transactions].sort((a, b) => {
        let comparison = 0;
        
        switch (currentSortField) {
            case 'date':
                comparison = new Date(b.date) - new Date(a.date);
                break;
            case 'amount':
                comparison = parseFloat(b.amount) - parseFloat(a.amount);
                break;
            default:
                comparison = new Date(b.date) - new Date(a.date);
        }
        
        return currentSortDirection === 'asc' ? -comparison : comparison;
    });
    
    // Take only the most recent 10 transactions
    const recentTransactions = sortedTransactions.slice(0, 10);
    
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date);
        
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = transaction.description;
        
        const categoryCell = document.createElement('td');
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'badge badge-' + getCategoryBadgeClass(transaction.category);
        categoryBadge.textContent = transaction.category;
        categoryCell.appendChild(categoryBadge);
        
        const amountCell = document.createElement('td');
        const amount = parseFloat(transaction.amount);
        const isIncome = amount > 0;
        amountCell.textContent = `${isIncome ? '+' : ''}₹${amount.toFixed(2)}`;
        amountCell.style.color = isIncome ? '#28a745' : '#dc3545';
            amountCell.style.fontWeight = 'bold';
        
        const actionCell = document.createElement('td');
        actionCell.style.whiteSpace = 'nowrap';
        
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary btn-sm';
        editButton.style.marginRight = '8px';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.addEventListener('click', () => editTransaction(transaction));
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.addEventListener('click', () => deleteTransaction(transaction));
        
        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        
        row.appendChild(dateCell);
        row.appendChild(descriptionCell);
        row.appendChild(categoryCell);
        row.appendChild(amountCell);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
    
    // Update dashboard stats
    updateDashboardStats(transactions);
    
    // Add spending limits button if not exists
    let spendingLimitsBtn = document.querySelector('#spendingLimitsBtn');
    if (!spendingLimitsBtn) {
        spendingLimitsBtn = document.createElement('button');
        spendingLimitsBtn.id = 'spendingLimitsBtn';
        spendingLimitsBtn.className = 'btn btn-primary';
        spendingLimitsBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Set Spending Limits';
        spendingLimitsBtn.style.marginBottom = '20px';
        document.querySelector('.transaction-list h3').appendChild(spendingLimitsBtn);
        
        spendingLimitsBtn.addEventListener('click', showSpendingLimitsModal);
    }
}

function updateDashboardStats(transactions) {
    // Get user data for monthly income
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Calculate total balance from all transactions
    const totalBalance = transactions.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
            return sum + Math.abs(amount); // Add income
        } else {
            return sum - Math.abs(amount); // Subtract expenses
        }
    }, 0);
    
    // Get current month's transactions
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // Calculate monthly income and expenses
    const monthlyStats = monthlyTransactions.reduce((stats, transaction) => {
        const amount = Math.abs(parseFloat(transaction.amount));
        if (transaction.type === 'income') {
            stats.income += amount;
        } else {
            stats.expenses += amount;
        }
        return stats;
    }, { income: 0, expenses: 0 });
    
    // Calculate savings rate
    const savingsRate = monthlyStats.income > 0 ? 
        ((monthlyStats.income - monthlyStats.expenses) / monthlyStats.income * 100) : 0;
    
    // Update UI elements with formatted numbers
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthlySpending').textContent = formatCurrency(monthlyStats.expenses);
    document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(1)}%`;
    
    // Add color coding for balance
    const totalBalanceElement = document.getElementById('totalBalance');
    if (totalBalanceElement) {
        if (totalBalance > 0) {
            totalBalanceElement.style.color = '#28a745'; // Green for positive balance
        } else if (totalBalance < 0) {
            totalBalanceElement.style.color = '#dc3545'; // Red for negative balance
        } else {
            totalBalanceElement.style.color = '#6c757d'; // Grey for zero balance
        }
    }
}

// Add a helper function to format currency consistently
function formatCurrency(amount) {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    return `${sign}₹${absAmount.toFixed(2)}`;
}

function initializeExpenseChart(transactions) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // Separate expenses and income
    const expenses = currentMonthTransactions.filter(t => parseFloat(t.amount) < 0);
    const income = currentMonthTransactions.filter(t => parseFloat(t.amount) > 0);
    
    // Process expenses by category
    const expenseCategories = {};
    expenses.forEach(transaction => {
        const amount = Math.abs(parseFloat(transaction.amount)); // Convert negative to positive for display
        if (!expenseCategories[transaction.category]) {
            expenseCategories[transaction.category] = 0;
        }
        expenseCategories[transaction.category] += amount;
    });
    
    // Process income by category
    const incomeCategories = {};
    income.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        if (!incomeCategories[transaction.category]) {
            incomeCategories[transaction.category] = 0;
        }
        incomeCategories[transaction.category] += amount;
    });
    
    // Calculate totals
    const totalExpenses = Object.values(expenseCategories).reduce((a, b) => a + b, 0);
    const totalIncome = Object.values(incomeCategories).reduce((a, b) => a + b, 0);
    
    // Prepare data for expense chart
    const expenseLabels = Object.keys(expenseCategories);
    const expenseData = Object.values(expenseCategories);
    const expenseColors = expenseLabels.map(category => getCategoryColor(category));
    
    // Get month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[currentMonth];
    
    // Destroy existing chart if it exists
    if (window.expenseChart instanceof Chart) {
        window.expenseChart.destroy();
    }
    
    // Create new chart
    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseLabels,
            datasets: [{
                data: expenseData,
                backgroundColor: expenseColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Expense Breakdown - ${currentMonthName} ${currentYear}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                subtitle: {
                    display: true,
                    text: `Total Expenses: ₹${totalExpenses.toFixed(2)} | Total Income: ₹${totalIncome.toFixed(2)}`,
                    color: '#666',
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / totalExpenses) * 100).toFixed(1);
                            return `₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
    
    // Update income summary
    updateIncomeSummary(incomeCategories, totalIncome);
}

function updateIncomeSummary(incomeCategories, totalIncome) {
    const incomeSummaryDiv = document.getElementById('incomeSummary') || createIncomeSummaryElement();
    
    // Create income breakdown HTML
    let breakdownHTML = '<h4>Income Breakdown</h4><ul class="income-list">';
    Object.entries(incomeCategories).forEach(([category, amount]) => {
        const percentage = ((amount / totalIncome) * 100).toFixed(1);
        breakdownHTML += `
            <li class="income-item">
                <span class="income-category">${category}</span>
                <span class="income-amount">₹${amount.toFixed(2)}</span>
                <span class="income-percentage">(${percentage}%)</span>
            </li>
        `;
    });
    breakdownHTML += '</ul>';
    
    incomeSummaryDiv.innerHTML = breakdownHTML;
}

function createIncomeSummaryElement() {
    const incomeSummaryDiv = document.createElement('div');
    incomeSummaryDiv.id = 'incomeSummary';
    incomeSummaryDiv.className = 'income-summary';
    
    // Insert after the expense chart
    const expenseChart = document.getElementById('expenseChart');
    expenseChart.parentNode.insertBefore(incomeSummaryDiv, expenseChart.nextSibling);
    
    return incomeSummaryDiv;
}

function getCategoryColor(category) {
    const colorMap = {
        'Housing': '#4e73df',
        'Transportation': '#f6c23e',
        'Food': '#36b9cc',
        'Utilities': '#858796',
        'Insurance': '#4e73df',
        'Healthcare': '#e74a3b',
        'Entertainment': '#1cc88a',
        'Personal': '#36b9cc',
        'Education': '#4e73df',
        'Savings': '#1cc88a',
        'Other': '#858796'
    };
    return colorMap[category] || '#858796';
}

function deleteTransaction(transactionToDelete) {
    // Retrieve the financial data from local storage
    const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
    if (!financialData.transactions) {
        return;
    }
    
    // Find the index of the transaction to delete. We assume each transaction is unique.
    const index = financialData.transactions.findIndex(transaction =>
        transaction.date === transactionToDelete.date &&
        transaction.description === transactionToDelete.description &&
        transaction.category === transactionToDelete.category &&
        transaction.amount === transactionToDelete.amount
    );
    
    // If found, remove it from the array
    if (index !== -1) {
        financialData.transactions.splice(index, 1);
        localStorage.setItem('userFinancialData', JSON.stringify(financialData));
    }
    
    // Reload transactions and charts after deletion
    loadTransactions(financialData.transactions);
    initializeExpenseChart(financialData.transactions);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getCategoryBadgeClass(category) {
    if (isIncomeCategory(category)) {
        return 'success'; // Green for income
    }
    
    const categoryMap = {
        'Housing': 'primary',
        'Transportation': 'warning',
        'Food': 'info',
        'Utilities': 'secondary',
        'Insurance': 'primary',
        'Healthcare': 'danger',
        'Entertainment': 'success',
        'Personal': 'info',
        'Education': 'primary',
        'Savings': 'success',
        'Other': 'secondary'
    };
    return categoryMap[category] || 'secondary';
}

function isIncomeCategory(category) {
    const incomeCategories = [
        'Salary', 'Bonus', 'Investment', 'Freelance', 
        'Rental', 'Refunds', 'Other Income'
    ];
    return incomeCategories.includes(category);
}

// Add editTransaction function
function editTransaction(transactionToEdit) {
    // Get the modal elements
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const modalTitle = modal.querySelector('.modal-header h3');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Set modal title for edit mode
    modalTitle.textContent = 'Edit Transaction';
    submitButton.textContent = 'Update Transaction';
    
    // Fill form with transaction data
    document.getElementById('transactionDate').value = transactionToEdit.date;
    document.getElementById('transactionDescription').value = transactionToEdit.description;
    document.getElementById('transactionCategory').value = transactionToEdit.category;
    document.getElementById('transactionAmount').value = transactionToEdit.amount;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Store original transaction data for reference
    form._editingTransaction = transactionToEdit;
    
    // Remove any existing submit handler
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add new submit handler
    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const updatedTransaction = {
            date: document.getElementById('transactionDate').value,
            description: document.getElementById('transactionDescription').value,
            category: document.getElementById('transactionCategory').value,
            amount: parseFloat(document.getElementById('transactionAmount').value)
        };
        
        // Get financial data
        const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const monthlyIncome = parseFloat(userData.monthlyIncome) || 0;
        
        if (!financialData.transactions) {
            financialData.transactions = [];
        }
        
        // Find the transaction
        const index = financialData.transactions.findIndex(t => 
            t.date === transactionToEdit.date &&
            t.description === transactionToEdit.description &&
            t.category === transactionToEdit.category &&
            t.amount === transactionToEdit.amount
        );
        
        if (index !== -1) {
            // Calculate current balance excluding the transaction being edited
            const currentBalance = monthlyIncome - financialData.transactions.reduce((sum, t, i) => {
                if (i === index) return sum; // Skip the transaction being edited
                return sum + parseFloat(t.amount);
            }, 0);
            
            // Check if the updated amount would exceed the balance
            if (updatedTransaction.amount > currentBalance) {
                alert('Updated transaction amount exceeds available balance! You have ₹' + currentBalance.toFixed(2) + ' available.');
                return;
            }
            
            financialData.transactions[index] = updatedTransaction;
            localStorage.setItem('userFinancialData', JSON.stringify(financialData));
            
            // Reload transactions and charts
            loadTransactions(financialData.transactions);
            initializeExpenseChart(financialData.transactions);
            
            // Reset form and close modal
            newForm.reset();
            document.getElementById('transactionDate').valueAsDate = new Date();
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Reset modal title
            modalTitle.textContent = 'Add New Transaction';
            submitButton.textContent = 'Add Transaction';
        }
    });
    
    // Update the form reference in setupTransactionModal
    setupTransactionModal();
}

// Add spending limits modal and functionality
function showSpendingLimitsModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('spendingLimitsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'spendingLimitsModal';
        modal.className = 'modal';
        
        const categories = [
            'Housing', 'Transportation', 'Food', 'Utilities', 'Insurance',
            'Healthcare', 'Entertainment', 'Personal', 'Education', 'Savings', 'Other'
        ];
        
        const currentLimits = JSON.parse(localStorage.getItem('spendingLimits') || '{}');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Set Monthly Spending Limits</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="spendingLimitsForm">
                    ${categories.map(category => `
                        <div class="form-group">
                            <label>${category}</label>
                            <input type="number" 
                                   name="${category}" 
                                   value="${currentLimits[category] || ''}" 
                                   placeholder="Enter limit (optional)"
                                   step="0.01"
                                   min="0"
                                   class="form-control">
                        </div>
                    `).join('')}
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Save Limits</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        const form = modal.querySelector('#spendingLimitsForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const limits = {};
            categories.forEach(category => {
                const input = form.querySelector(`input[name="${category}"]`);
                const value = parseFloat(input.value);
                if (!isNaN(value) && value > 0) {
                    limits[category] = value;
                }
            });
            
            localStorage.setItem('spendingLimits', JSON.stringify(limits));
            
            // Refresh transactions display
            const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
            loadTransactions(financialData.transactions || []);
            
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Add CSS styles for exceeded limits
const style = document.createElement('style');
style.textContent = `
    .exceeded-limit {
        background-color: rgba(220, 53, 69, 0.1);
    }
    
    #spendingLimitsBtn {
        margin-left: 15px;
        padding: 5px 10px;
        font-size: 0.9rem;
    }
    
    .badge small {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Add CSS for custom category input
const categoryStyle = document.createElement('style');
categoryStyle.textContent = `
    .custom-category-container {
        margin-top: 10px;
    }
    
    .custom-category-input {
        display: flex;
        gap: 10px;
    }
    
    .custom-category-input input {
        flex: 1;
    }
    
    .custom-category-input button {
        white-space: nowrap;
    }
`;
document.head.appendChild(categoryStyle);

function setupImportModal() {
    const importModal = document.getElementById('importTransactionsModal');
    const importBtn = document.getElementById('importTransactionsBtn');
    const closeBtn = importModal.querySelector('.close-modal');
    const fileInput = document.getElementById('csvFile');
    const importButton = document.getElementById('importButton');
    const previewContainer = document.getElementById('previewData');

    importBtn.addEventListener('click', () => {
        importModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Reset the form when opening
        fileInput.value = '';
        previewContainer.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        importModal.style.display = 'none';
        document.body.style.overflow = '';
        resetImportForm();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === importModal) {
            importModal.style.display = 'none';
            document.body.style.overflow = '';
            resetImportForm();
        }
    });

    fileInput.addEventListener('change', handleFileSelect);
    importButton.addEventListener('click', importTransactions);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Clear previous preview
    document.getElementById('previewTableBody').innerHTML = '';
    document.getElementById('previewData').style.display = 'none';

    // Check file type and size
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file');
        document.getElementById('csvFile').value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size too large. Please select a file smaller than 5MB');
        document.getElementById('csvFile').value = '';
        return;
    }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const transactions = parseCSV(e.target.result);
                showPreview(transactions);
            } catch (error) {
                alert('Error processing CSV file: ' + error.message);
            console.error('CSV processing error:', error);
            document.getElementById('csvFile').value = '';
        }
    };

    reader.onerror = function() {
        alert('Error reading file');
        document.getElementById('csvFile').value = '';
    };

    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const transactions = [];
    
    try {
        // Skip empty lines and get header
        const headerLine = lines.find(line => line.trim().length > 0);
        if (!headerLine) {
            throw new Error('CSV file is empty');
        }

        // Determine if file has headers
        const hasHeader = headerLine.toLowerCase().includes('date') || 
                         headerLine.toLowerCase().includes('description') ||
                         headerLine.toLowerCase().includes('amount') ||
                         headerLine.toLowerCase().includes('category');

        const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            // Split by comma, handling quoted values
            const values = line.split(',').map(val => val.trim().replace(/^["']|["']$/g, ''));
            
            if (values.length < 3) {
                console.warn(`Skipping invalid line ${i + 1}: Insufficient columns`);
                continue;
            }
            
            const [date, description, amount, category] = values;
            
            // Validate date format
            if (!isValidDate(date)) {
                console.warn(`Skipping line ${i + 1}: Invalid date format`);
                continue;
            }
            
            // Validate amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount)) {
                console.warn(`Skipping line ${i + 1}: Invalid amount`);
                continue;
            }
            
            transactions.push({
                date: date,
                description: description || 'Unnamed Transaction',
                amount: Math.abs(parsedAmount),
                category: category || 'Other',
                type: parsedAmount < 0 ? 'expense' : 'income'
            });
        }
        
        if (transactions.length === 0) {
            throw new Error('No valid transactions found in the CSV file');
    }
    
    return transactions;
    } catch (error) {
        throw new Error(`Error parsing CSV: ${error.message}`);
    }
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function showPreview(transactions) {
    const previewTableBody = document.getElementById('previewTableBody');
    const previewContainer = document.getElementById('previewData');
    
    if (!transactions || transactions.length === 0) {
        alert('No valid transactions found in the file');
        return;
    }
    
    previewTableBody.innerHTML = '';
    transactions.slice(0, 5).forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                ${transaction.type === 'income' ? '+' : '-'}₹${Math.abs(transaction.amount).toFixed(2)}
            </td>
            <td>${transaction.category}</td>
        `;
        previewTableBody.appendChild(row);
    });
    
    if (transactions.length > 5) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center; font-style: italic;">
                ... and ${transactions.length - 5} more transactions
            </td>
        `;
        previewTableBody.appendChild(row);
    }
    
    previewContainer.style.display = 'block';
    
    // Enable import button
    document.getElementById('importButton').disabled = false;
}

function saveImportedTransactions(transactions, dateFormat) {
    try {
    // Get existing financial data
    const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
    if (!financialData.transactions) {
        financialData.transactions = [];
    }

    // Format dates according to selected format
    const formattedTransactions = transactions.map(t => {
        let formattedDate = t.date;
            try {
                const date = new Date(t.date);
                if (!isNaN(date.getTime())) {
            switch (dateFormat) {
                case 'DD-MM-YYYY':
                            formattedDate = date.toLocaleDateString('en-GB');
                    break;
                case 'MM-DD-YYYY':
                            formattedDate = date.toLocaleDateString('en-US');
                    break;
                case 'YYYY-MM-DD':
                            formattedDate = date.toISOString().split('T')[0];
                    break;
            }
                }
            } catch (error) {
                console.warn('Date formatting error:', error);
        }
        
        return {
            ...t,
            date: formattedDate,
            id: generateTransactionId()
        };
    });

    // Add new transactions to existing ones
    financialData.transactions = [...financialData.transactions, ...formattedTransactions];

    // Save back to localStorage
    localStorage.setItem('userFinancialData', JSON.stringify(financialData));

    // Update UI
    loadTransactions(financialData.transactions);
    initializeExpenseChart(financialData.transactions);

    // Close modal and reset form
        const importModal = document.getElementById('importTransactionsModal');
        importModal.style.display = 'none';
        document.body.style.overflow = '';
    resetImportForm();

    alert(`Successfully imported ${formattedTransactions.length} transactions.`);
    } catch (error) {
        alert('Error saving transactions: ' + error.message);
        console.error('Error saving transactions:', error);
    }
}

function resetImportForm() {
    document.getElementById('csvFile').value = '';
    document.getElementById('previewData').style.display = 'none';
    document.getElementById('previewTableBody').innerHTML = '';
}

function generateTransactionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

