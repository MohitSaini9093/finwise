document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const financialData = JSON.parse(localStorage.getItem("userFinancialData") || "{}");

  document.getElementById("userName").textContent = `${userData.firstName || "User"} ${userData.lastName || ""}`;

  // Ensure valid financial data
  if (!financialData.transactions) {
    financialData.transactions = [];
    localStorage.setItem("userFinancialData", JSON.stringify(financialData));
  }

  initializeBudgetData(userData, financialData);
  initializeBudgetCharts(financialData);
  updateCategoryCards(financialData.transactions || []);
  setupTabs();

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  });

  // Import Transactions Modal Setup
  const importModal = document.getElementById("importTransactionsModal");
  const importBtn = document.getElementById("importTransactionsBtn");
  const closeBtn = importModal.querySelector(".close-modal");
  const fileInput = document.getElementById("bankStatementFile");
  const importButton = document.getElementById("importButton");

  importBtn.addEventListener("click", () => {
    importModal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    importModal.style.display = "none";
    resetImportForm();
  });

  fileInput.addEventListener("change", handleFileSelect);
  importButton.addEventListener("click", importTransactions);

  // Load category cards
  loadCategoryCards();

  // Set up category details modal
  setupCategoryModal();
});

function initializeBudgetData(userData, financialData) {
  const monthlyIncome = Number(userData.monthlyIncome) || 0;
  const transactions = financialData.transactions || [];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter transactions for the current month
  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const monthlySpending = monthlyTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const remaining = monthlyIncome - monthlySpending;

  // Update UI
  document.getElementById("monthlyBudget").textContent = `₹${monthlyIncome.toFixed(2)}`;
  document.getElementById("spentSoFar").textContent = `₹${monthlySpending.toFixed(2)}`;
  document.getElementById("remaining").textContent = `₹${remaining.toFixed(2)}`;

  // Update percentages
  document.querySelector("#spentSoFar + .stat-change").textContent = `${((monthlySpending / monthlyIncome) * 100).toFixed(1)}% of budget`;
  document.querySelector("#remaining + .stat-change").textContent = `${((remaining / monthlyIncome) * 100).toFixed(1)}% of budget`;
}

function updateCategoryCards(transactions) {
  const spendingLimits = JSON.parse(localStorage.getItem('spendingLimits') || '{}');
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate monthly spending by category
  const monthlySpendingByCategory = transactions.reduce((acc, transaction) => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate.getMonth() === currentMonth && 
        transactionDate.getFullYear() === currentYear) {
      acc[transaction.category] = (acc[transaction.category] || 0) + parseFloat(transaction.amount);
    }
    return acc;
  }, {});

  const categoryIcons = {
    'Housing': 'fa-home',
    'Transportation': 'fa-car',
    'Food': 'fa-utensils',
    'Utilities': 'fa-bolt',
    'Insurance': 'fa-shield-alt',
    'Healthcare': 'fa-medkit',
    'Entertainment': 'fa-film',
    'Personal': 'fa-user',
    'Education': 'fa-graduation-cap',
    'Savings': 'fa-piggy-bank',
    'Other': 'fa-ellipsis-h'
  };

  const categoryColors = {
    'Housing': '#4CAF50',
    'Transportation': '#2196F3',
    'Food': '#FF9800',
    'Utilities': '#9C27B0',
    'Insurance': '#607D8B',
    'Healthcare': '#E91E63',
    'Entertainment': '#00BCD4',
    'Personal': '#795548',
    'Education': '#3F51B5',
    'Savings': '#8BC34A',
    'Other': '#9E9E9E'
  };

  const categoryCardsContainer = document.getElementById('categoryCards');
  categoryCardsContainer.innerHTML = '';

  // Create a card for each category that has a spending limit or transactions
  const categories = new Set([
    ...Object.keys(spendingLimits),
    ...Object.keys(monthlySpendingByCategory)
  ]);

  categories.forEach(category => {
    const spending = monthlySpendingByCategory[category] || 0;
    const limit = spendingLimits[category] || 0;
    const percentage = limit ? (spending / limit) * 100 : 0;

    let progressClass = 'progress-normal';
    if (percentage >= 90) {
      progressClass = 'progress-danger';
    } else if (percentage >= 70) {
      progressClass = 'progress-warning';
    }

    const card = document.createElement('div');
    card.className = `category-budget-card${percentage > 100 ? ' exceeded' : ''}`;
    card.innerHTML = `
      <div class="category-header">
        <div class="category-name">
          <span class="category-icon" style="background-color: ${categoryColors[category]}">
            <i class="fas ${categoryIcons[category]}"></i>
          </span>
          ${category}
        </div>
        ${limit ? `<span class="percentage">${percentage.toFixed(0)}%</span>` : ''}
      </div>
      <div class="budget-progress">
        <div class="progress-bar">
          <div class="progress-fill ${progressClass}" 
               style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
      </div>
      <div class="budget-details">
        <span class="amount-spent">₹${spending.toFixed(2)}</span>
        ${limit ? `<span class="budget-limit">of ₹${limit.toFixed(2)}</span>` : ''}
      </div>
    `;

    categoryCardsContainer.appendChild(card);
  });
}

function initializeBudgetCharts(financialData) {
  const transactions = financialData.transactions || [];

  if (!transactions.length) {
    console.warn("No transactions found.");
    return;
  }

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const monthlyIncome = Number(userData.monthlyIncome) || 1;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const monthlySpending = monthlyTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Update category cards
  updateCategoryCards(transactions);

  // Budget Progress Chart
  const budgetCtx = document.getElementById("budgetProgressChart").getContext("2d");
  new Chart(budgetCtx, {
    type: "bar",
    data: {
      labels: ["Budget", "Spent", "Remaining"],
      datasets: [
        {
          label: "Amount ($)",
          data: [monthlyIncome, monthlySpending, monthlyIncome - monthlySpending],
          backgroundColor: ["rgba(67, 97, 238, 0.7)", "rgba(255, 99, 132, 0.7)", "rgba(76, 201, 240, 0.7)"],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  // Category Chart
  const categories = {};
  monthlyTransactions.forEach((t) => {
    categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
  });

  const categoryLabels = Object.keys(categories);
  const categoryData = Object.values(categories);
  const colors = categoryLabels.map((_, i) => `hsl(${(i * 360) / categoryLabels.length}, 70%, 60%)`);

  const categoryCtx = document.getElementById("categoryChart").getContext("2d");
  new Chart(categoryCtx, {
    type: "pie",
    data: { labels: categoryLabels, datasets: [{ data: categoryData, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false },
  });

  // Generate category breakdown
  const categoryBreakdown = document.getElementById("categoryBreakdown");
  categoryBreakdown.innerHTML = "";
  categoryLabels.forEach((cat, i) => {
    const amount = categoryData[i];
    const percent = ((amount / monthlySpending) * 100).toFixed(1);
    categoryBreakdown.innerHTML += `
      <div class="category-item" style="display:flex;justify-content:space-between;margin-bottom:10px;padding:10px;background:rgba(0,0,0,0.05);border-radius:5px;">
        <div>
          <span style="display:inline-block;width:12px;height:12px;background:${colors[i]};margin-right:8px;border-radius:50%;"></span>
          ${cat}
        </div>
        <div><strong>₹${amount.toFixed(2)}</strong> <small>(${percent}%)</small></div>
      </div>`;
  });

  // Trend Chart (Mock Data)
  // Trend Chart (Using Real Data)
const months = [];
const spendingTrend = [];

const transactionMap = new Map();

// Get spending for the last 6 months
for (let i = 5; i >= 0; i--) {
  const date = new Date(currentYear, currentMonth - i, 1);
  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

  months.push(date.toLocaleDateString("en-US", { month: "short" }));
  transactionMap.set(monthKey, 0); // Initialize with zero
}

// Populate the spending data
transactions.forEach((t) => {
  const tDate = new Date(t.date);
  const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;

  if (transactionMap.has(monthKey)) {
    transactionMap.set(monthKey, transactionMap.get(monthKey) + Number(t.amount || 0));
  }
});

// Fill the spending trend array
transactionMap.forEach((value) => spendingTrend.push(value));

// Create the chart
const trendCtx = document.getElementById("trendChart").getContext("2d");
new Chart(trendCtx, {
  type: "line",
  data: {
    labels: months,
    datasets: [
      {
        label: "Monthly Spending",
        data: spendingTrend,
        borderColor: "rgba(67, 97, 238, 1)",
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function editMonthlyBudget() {
  const currentBudget = document.getElementById('monthlyBudget').textContent.replace('₹', '');
  const newBudget = prompt('Enter new monthly budget:', currentBudget);
  
  if (newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
    document.getElementById('monthlyBudget').textContent = '₹' + parseFloat(newBudget).toFixed(2);
    // Here you would typically update the budget in your storage and recalculate related values
    updateBudgetStats(parseFloat(newBudget));
  }
}

function updateBudgetStats(budget) {
  const spent = parseFloat(document.getElementById('spentSoFar').textContent.replace('₹', ''));
  const remaining = budget - spent;
  const spentPercentage = ((spent / budget) * 100).toFixed(1);
  const remainingPercentage = ((remaining / budget) * 100).toFixed(1);
  
  document.getElementById('remaining').textContent = '₹' + remaining.toFixed(2);
  document.getElementById('spentSoFar').nextElementSibling.textContent = spentPercentage + '% of budget';
  document.getElementById('remaining').nextElementSibling.textContent = remainingPercentage + '% of budget';
  
  // Re-initialize the budget progress chart with new values
  initializeBudgetProgressChart();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Clear previous preview
  document.getElementById('previewTableBody').innerHTML = '';
  document.getElementById('previewData').style.display = 'none';

  // Show loading state
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingMessage';
  loadingDiv.className = 'alert alert-info';
  loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing your file...';
  document.querySelector('.modal-body').insertBefore(loadingDiv, document.getElementById('previewData'));

  if (file.type === 'text/csv') {
    handleCSVFile(file);
  } else if (file.type === 'application/pdf') {
    handlePDFFile(file);
  } else {
    alert('Please select a CSV or PDF file');
    document.getElementById('bankStatementFile').value = '';
  }
}

function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const transactions = parseCSV(e.target.result);
      showPreview(transactions);
    } catch (error) {
      showError('Error processing CSV file: ' + error.message);
    }
  };
  reader.onerror = function() {
    showError('Error reading file');
  };
  reader.readAsText(file);
}

function handlePDFFile(file) {
  // Clear any existing error messages and previews
  clearErrorsAndPreviews();

  // Validate file type
  if (!file.type.includes('pdf')) {
    showError('Invalid file type. Please select a PDF file.');
    return;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    showError('File is too large. Maximum size is 10MB.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  // Show initial loading state
  showLoadingMessage('Processing PDF file...');

  fetch('http://localhost:5000/api/process-pdf', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        return response.json().then(data => {
          if (data.error === 'PASSWORD_REQUIRED') {
            removeLoadingMessage();
            showPasswordInput(file);
            return null;
          }
          throw new Error(data.message || 'Authentication error');
        });
      }
      throw new Error(`Server error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (!data) return; // Password input is being shown
    removeLoadingMessage();

    if (data.error) {
      throw new Error(data.message || 'Error processing PDF');
    }

    if (!data.transactions || !Array.isArray(data.transactions)) {
      throw new Error('Invalid transaction data received from server');
    }

    if (data.transactions.length === 0) {
      showError('No transactions found in the PDF. Please check if the file contains valid bank statement data.');
      return;
    }

    // Remove password input if it exists
    const passwordContainer = document.getElementById('pdfPasswordContainer');
    if (passwordContainer) {
      passwordContainer.remove();
    }

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
      <i class="fas fa-check-circle"></i> Successfully processed PDF! 
      Found ${data.transactions.length} transactions.
    `;
    document.querySelector('.modal-body').insertBefore(successDiv, document.getElementById('previewData'));

    // Show preview of transactions
    showPreview(data.transactions);

    // If Excel file is ready for download
    if (data.downloadReady && data.excelFileName) {
      showDownloadOption(data.excelFileName);
    }
  })
  .catch(error => {
    console.error('PDF Processing Error:', error);
    let errorMessage = 'Error processing PDF: ';
    
    if (error.message.includes('ECONNREFUSED')) {
      errorMessage += 'Could not connect to server. Please check if the server is running.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage += 'Network connection error. Please check your internet connection.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Could not reach the server. Please try again later.';
    } else {
      errorMessage += error.message;
    }
    
    showError(errorMessage);
  })
  .finally(() => {
    removeLoadingMessage();
  });
}

function clearErrorsAndPreviews() {
  // Clear previous preview
  document.getElementById('previewTableBody').innerHTML = '';
  document.getElementById('previewData').style.display = 'none';

  // Remove any existing error messages
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  // Remove existing password input if any
  const passwordContainer = document.getElementById('pdfPasswordContainer');
  if (passwordContainer) {
    passwordContainer.remove();
  }
}

function showLoadingMessage(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingMessage';
  loadingDiv.className = 'alert alert-info';
  loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
  document.querySelector('.modal-body').insertBefore(loadingDiv, document.getElementById('previewData'));
}

function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) loadingMessage.remove();
}

function showDownloadOption(fileName) {
  const downloadDiv = document.createElement('div');
  downloadDiv.id = 'downloadOption';
  downloadDiv.className = 'alert alert-success mt-3';
  downloadDiv.innerHTML = `
    <i class="fas fa-file-excel"></i> Excel file is ready! 
    <button onclick="downloadExcelFile('${fileName}')" class="btn btn-success btn-sm ml-2">
      <i class="fas fa-download"></i> Download Excel
    </button>
  `;
  document.querySelector('.modal-body').appendChild(downloadDiv);
}

function downloadExcelFile(fileName) {
  fetch(`http://localhost:5000/api/download-excel/${fileName}`)
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
      a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    })
    .catch(error => {
      showError('Error downloading file: ' + error.message);
    });
}

function showPreview(transactions) {
  // Remove any existing download option
  const existingDownload = document.getElementById('downloadOption');
  if (existingDownload) {
    existingDownload.remove();
  }

  const previewTable = document.getElementById('previewTableBody');
  previewTable.innerHTML = '';

  // Add pagination state
  const transactionsPerPage = 2;
  let currentPage = 1;
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  function showTransactionsPage(page) {
    previewTable.innerHTML = '';
    const start = (page - 1) * transactionsPerPage;
    const end = Math.min(start + transactionsPerPage, transactions.length);

    for (let i = start; i < end; i++) {
      const transaction = transactions[i];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${transaction.date}</td>
        <td>${transaction.description}</td>
        <td class="text-danger">
          ₹${Math.abs(transaction.debit || transaction.amount).toFixed(2)} DR
        </td>
        <td>
          <select class="form-control category-select" data-index="${i}">
            ${getCategoryOptions(transaction.category)}
          </select>
        </td>
      `;
      previewTable.appendChild(row);
    }

    // Update pagination controls
    document.getElementById('paginationControls').innerHTML = `
      <div class="d-flex justify-content-between align-items-center mt-3">
        <button class="btn btn-sm btn-outline-primary" 
                ${page === 1 ? 'disabled' : ''} 
                onclick="changePage(${page - 1})">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <span class="mx-3">
          Page ${page} of ${totalPages} (${transactions.length} transactions)
        </span>
        <button class="btn btn-sm btn-outline-primary" 
                ${page === totalPages ? 'disabled' : ''} 
                onclick="changePage(${page + 1})">
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    // Add event listeners for category changes
    document.querySelectorAll('.category-select').forEach(select => {
      select.addEventListener('change', function() {
        const index = this.getAttribute('data-index');
        transactions[index].category = this.value;
      });
    });
  }

  // Create pagination controls container if it doesn't exist
  if (!document.getElementById('paginationControls')) {
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'paginationControls';
    document.getElementById('previewData').appendChild(paginationDiv);
  }

  // Add changePage function to window scope
  window.changePage = function(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      showTransactionsPage(currentPage);
    }
  };

  // Show first page
  showTransactionsPage(currentPage);

  // Show the preview section
  document.getElementById('previewData').style.display = 'block';
}

function showError(message) {
  // Remove loading message if exists
  removeLoadingMessage();

    // Show error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger';
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-circle"></i> 
    <span class="error-message">${message}</span>
    ${message.includes('server') ? `
      <div class="mt-2">
        <small class="text-muted">
          Please ensure that:
          <ul class="mb-0">
            <li>The server application is running</li>
            <li>Your internet connection is stable</li>
            <li>You're using a supported PDF format</li>
          </ul>
        </small>
      </div>
    ` : ''}
  `;
  document.querySelector('.modal-body').insertBefore(errorDiv, document.getElementById('previewData'));

  // Clear file input
  document.getElementById('bankStatementFile').value = '';
}

function getCategoryOptions(selectedCategory = '') {
  const categories = [
    'Salary Debit', 'Food Expense', 'Transportation', 'Housing Payment',
    'Utility Bills', 'Healthcare Expense', 'Entertainment', 'Shopping',
    'Education Fees', 'Insurance Premium', 'Debit'
  ];
  
  return categories.map(category => 
    `<option value="${category}" ${category === selectedCategory ? 'selected' : ''}>${category}</option>`
  ).join('');
}

function showPasswordInput(file) {
  // Remove any existing error messages
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  // Remove existing password input if any
  const existingInput = document.getElementById('pdfPasswordContainer');
  if (existingInput) {
    existingInput.remove();
  }

  // Create password input container
  const passwordContainer = document.createElement('div');
  passwordContainer.id = 'pdfPasswordContainer';
  passwordContainer.className = 'form-group';
  passwordContainer.innerHTML = `
    <div class="alert alert-warning">
      <i class="fas fa-lock"></i> This PDF file is password protected
    </div>
    <label for="pdfPassword">Enter PDF Password</label>
    <div class="password-input-container">
      <div class="input-group">
        <input type="password" id="pdfPassword" class="form-control" placeholder="Enter PDF password">
        <div class="input-group-append">
          <button type="button" class="btn btn-outline-secondary" onclick="togglePasswordVisibility()">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      <button type="button" class="btn btn-primary mt-2" id="submitPasswordBtn">
        <i class="fas fa-unlock"></i> Unlock and Process PDF
      </button>
    </div>
  `;

  // Insert after file input
  const fileInput = document.getElementById('bankStatementFile');
  fileInput.parentNode.insertBefore(passwordContainer, fileInput.nextSibling);

  // Focus on password input
  const passwordInput = document.getElementById('pdfPassword');
  passwordInput.focus();

  // Add event listeners for password submission
  const submitBtn = document.getElementById('submitPasswordBtn');
  submitBtn.addEventListener('click', () => handlePasswordSubmit(file));
  
  // Allow Enter key to submit
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePasswordSubmit(file);
    }
  });
}

function handlePasswordSubmit(file) {
  const password = document.getElementById('pdfPassword').value;
  if (!password) {
    showError('Please enter the PDF password');
    return;
  }

  // Remove any existing error messages
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  // Show loading state
  showLoadingMessage('Processing password-protected file...');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  fetch('http://localhost:5000/api/process-pdf', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    removeLoadingMessage();

    if (data.error === 'PASSWORD_REQUIRED') {
      showError('Incorrect password. Please try again.');
      return;
    }

    if (data.error) {
      throw new Error(data.message || 'Error processing PDF');
    }

    if (!data.transactions || !Array.isArray(data.transactions)) {
      throw new Error('Invalid transaction data received from server');
    }

    if (data.transactions.length === 0) {
      showError('No transactions found in the PDF. Please check if the file contains valid bank statement data.');
      return;
    }

    // Remove password input container
    const passwordContainer = document.getElementById('pdfPasswordContainer');
    if (passwordContainer) {
      passwordContainer.remove();
    }

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
      <i class="fas fa-check-circle"></i> File successfully unlocked and processed! 
      Found ${data.transactions.length} transactions.
    `;
    document.querySelector('.modal-body').insertBefore(successDiv, document.getElementById('previewData'));

    // Show preview of transactions
    showPreview(data.transactions);

    // If Excel file is ready for download
    if (data.downloadReady && data.excelFileName) {
      showDownloadOption(data.excelFileName);
    }
  })
  .catch(error => {
    console.error('Password Processing Error:', error);
    let errorMessage = 'Error processing file: ';
    
    if (error.message.includes('ECONNREFUSED')) {
      errorMessage += 'Could not connect to server. Please check if the server is running.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage += 'Network connection error. Please check your internet connection.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Could not reach the server. Please try again later.';
    } else {
      errorMessage += error.message;
    }
    
    showError(errorMessage);
  })
  .finally(() => {
    removeLoadingMessage();
  });
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('pdfPassword');
  const eyeIcon = document.querySelector('.fa-eye, .fa-eye-slash');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');
  }
}

function resetImportForm() {
  document.getElementById('bankStatementFile').value = '';
  document.getElementById('previewData').style.display = 'none';
  document.getElementById('previewTableBody').innerHTML = '';
  
  // Remove password input if exists
  const passwordContainer = document.getElementById('pdfPasswordContainer');
  if (passwordContainer) {
    passwordContainer.remove();
  }
  
  // Remove any alert messages
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => alert.remove());
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const result = [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Validate required columns for bank statement format
  const requiredColumns = ['Account No', 'DATE', 'TRANSACTION DETAILS', 'WITHDRAWAL AMT', 'DEPOSIT AMT'];
  const missingColumns = requiredColumns.filter(col => 
    !headers.some(h => h.toLowerCase() === col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Find column indices
  const accountIndex = headers.findIndex(h => h.toLowerCase() === 'account no');
  const dateIndex = headers.findIndex(h => h.toLowerCase() === 'date');
  const detailsIndex = headers.findIndex(h => h.toLowerCase() === 'transaction details');
  const withdrawalIndex = headers.findIndex(h => h.toLowerCase() === 'withdrawal amt');
  const depositIndex = headers.findIndex(h => h.toLowerCase() === 'deposit amt');

  // Parse each line
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const withdrawal = parseFloat(values[withdrawalIndex] || '0');
    const deposit = parseFloat(values[depositIndex] || '0');
    
    // Skip if both withdrawal and deposit are 0 or invalid
    if (isNaN(withdrawal) && isNaN(deposit)) continue;
    
    // Calculate final amount (negative for withdrawal, positive for deposit)
    const amount = deposit > 0 ? deposit : -withdrawal;

    result.push({
      accountNo: values[accountIndex],
      date: values[dateIndex],
      description: values[detailsIndex],
      amount: amount,
      category: guessCategory(values[detailsIndex])
    });
  }

  return result;
}

function guessCategory(description) {
  const categoryPatterns = {
    'Salary': /(salary|payroll|income|stipend)/i,
    'Food': /(restaurant|cafe|food|grocery|dining|swiggy|zomato|hotel)/i,
    'Transportation': /(uber|ola|taxi|transport|fuel|gas|parking|metro|bus|train|railway)/i,
    'Housing': /(rent|mortgage|housing|maintenance|property)/i,
    'Utilities': /(electricity|water|gas|internet|phone|utility|broadband|mobile|recharge)/i,
    'Healthcare': /(doctor|hospital|medical|pharmacy|healthcare|clinic|medicine)/i,
    'Entertainment': /(movie|theatre|concert|entertainment|streaming|netflix|amazon prime|hotstar)/i,
    'Shopping': /(amazon|flipkart|myntra|shopping|store|retail|mall|market)/i,
    'Education': /(school|college|university|course|education|training|tuition|fees)/i,
    'Insurance': /(insurance|coverage|policy|premium)/i,
    'Investment': /(investment|mutual fund|stock|shares|dividend|interest|fd|fixed deposit)/i,
    'EMI': /(emi|loan|payment|installment)/i,
    'Transfer': /(transfer|neft|rtgs|imps|upi)/i,
    'ATM': /(atm|cash withdrawal)/i
  };

  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(description)) {
      return category;
    }
  }

  return 'Other';
}

function formatDate(dateStr, format) {
  try {
    const parts = dateStr.split(/[-/]/);
    let year, month, day;

    switch (format) {
      case 'DD-MM-YYYY':
        [day, month, year] = parts;
        break;
      case 'MM-DD-YYYY':
        [month, day, year] = parts;
        break;
      case 'YYYY-MM-DD':
        [year, month, day] = parts;
        break;
      default:
        return dateStr;
    }

    return new Date(year, month - 1, day).toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
}

function importTransactions() {
  const fileInput = document.getElementById('bankStatementFile');
  const dateFormat = document.getElementById('dateFormat').value;
  
  if (!fileInput.files[0]) {
    alert('Please select a file to import.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const transactions = parseCSV(e.target.result);
      saveImportedTransactions(transactions, dateFormat);
    } catch (error) {
      alert('Error importing transactions: ' + error.message);
      console.error('Error importing transactions:', error);
    }
  };

  reader.readAsText(fileInput.files[0]);
}

function saveImportedTransactions(transactions, dateFormat) {
  // Get existing financial data
  const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
  if (!financialData.transactions) {
    financialData.transactions = [];
  }

  // Process and add new transactions
  const newTransactions = transactions.map(t => ({
    date: formatDate(t.date, dateFormat),
    description: t.description,
    amount: Math.abs(t.amount),
    category: t.category,
    type: t.amount < 0 ? 'expense' : 'income',
    accountNo: t.accountNo,
    id: generateTransactionId()
  }));

  // Add new transactions to existing ones
  financialData.transactions = [...financialData.transactions, ...newTransactions];

  // Save back to localStorage
  localStorage.setItem('userFinancialData', JSON.stringify(financialData));

  // Update UI
  initializeBudgetData(JSON.parse(localStorage.getItem('userData') || '{}'), financialData);
  initializeBudgetCharts(financialData);
  updateCategoryCards(financialData.transactions);

  // Close modal and reset form
  document.getElementById('importTransactionsModal').style.display = 'none';
  resetImportForm();

  alert(`Successfully imported ${newTransactions.length} transactions.`);
}

function generateTransactionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Update the file input accept attribute in the modal
document.getElementById("bankStatementFile").accept = ".csv,.pdf";

function loadCategoryCards() {
  const categoryGrid = document.getElementById('categoryCards');
  const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
  const spendingLimits = JSON.parse(localStorage.getItem('spendingLimits') || '{}');
  const transactions = financialData.transactions || [];

  // Get current month's transactions
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const categories = [
    'Housing', 'Transportation', 'Food', 'Utilities', 'Insurance',
    'Healthcare', 'Entertainment', 'Personal', 'Education', 'Savings', 'Other'
  ];

  // Clear existing cards
  categoryGrid.innerHTML = '';

  categories.forEach(category => {
    // Get transactions for this category in current month
    const categoryTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.category === category && 
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    const totalSpent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const budget = spendingLimits[category] || 0;
    const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

    // Create category card
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <h4>
        <span class="category-icon">
          <i class="${getCategoryIcon(category)}"></i>
        </span>
        ${category}
      </h4>
      <div class="category-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; 
               background: ${getProgressColor(percentage)}"></div>
        </div>
        <div class="progress-stats">
          <span class="amount">₹${totalSpent.toFixed(2)}</span>
          ${budget > 0 ? `<span class="budget">of ₹${budget.toFixed(2)}</span>` : ''}
        </div>
      </div>
      <div class="transaction-count">
        ${categoryTransactions.length} transactions this month
      </div>
    `;

    // Add click event to show category details
    card.addEventListener('click', () => showCategoryDetails(category));

    categoryGrid.appendChild(card);
  });
}

function getCategoryIcon(category) {
  const icons = {
    'Housing': 'fas fa-home',
    'Transportation': 'fas fa-car',
    'Food': 'fas fa-utensils',
    'Utilities': 'fas fa-bolt',
    'Insurance': 'fas fa-shield-alt',
    'Healthcare': 'fas fa-medkit',
    'Entertainment': 'fas fa-film',
    'Personal': 'fas fa-user',
    'Education': 'fas fa-graduation-cap',
    'Savings': 'fas fa-piggy-bank',
    'Other': 'fas fa-ellipsis-h'
  };
  return icons[category] || 'fas fa-tag';
}

function getProgressColor(percentage) {
  if (percentage >= 100) return '#dc3545'; // Red for exceeded
  if (percentage >= 80) return '#ffc107';  // Yellow for warning
  return '#28a745'; // Green for safe
}

function showCategoryDetails(category) {
  const modal = document.getElementById('categoryDetailsModal');
  const modalTitle = document.getElementById('categoryModalTitle');
  const totalSpentElement = document.getElementById('categoryTotalSpent');
  const budgetElement = document.getElementById('categoryBudget');
  const transactionCountElement = document.getElementById('categoryTransactionCount');
  const transactionsList = document.getElementById('categoryTransactionsList');

  // Get financial data
  const financialData = JSON.parse(localStorage.getItem('userFinancialData') || '{}');
  const spendingLimits = JSON.parse(localStorage.getItem('spendingLimits') || '{}');
  const transactions = financialData.transactions || [];

  // Get current month's transactions for this category
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const categoryTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.category === category && 
           transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  });

  // Calculate statistics
  const totalSpent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const budget = spendingLimits[category] || 0;

  // Update modal content
  modalTitle.textContent = `${category} Details`;
  totalSpentElement.textContent = `₹${totalSpent.toFixed(2)}`;
  budgetElement.textContent = budget > 0 ? `₹${budget.toFixed(2)}` : 'Not Set';
  transactionCountElement.textContent = categoryTransactions.length;

  // Sort transactions by date (newest first)
  categoryTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Clear and populate transactions list
  transactionsList.innerHTML = '';
  categoryTransactions.forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>${transaction.description}</td>
      <td>₹${parseFloat(transaction.amount).toFixed(2)}</td>
    `;
    transactionsList.appendChild(row);
  });

  // Show modal
  modal.style.display = 'flex';
}

function setupCategoryModal() {
  const modal = document.getElementById('categoryDetailsModal');
  const closeBtn = modal.querySelector('.close-modal');

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
