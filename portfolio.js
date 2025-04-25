document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
    return;
  }

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  let financialData = JSON.parse(localStorage.getItem("userFinancialData") || "null");

  // If no data exists, create dummy investment data
  if (!financialData) {
    financialData = {
      investments: [
        { name: "Apple", type: "Stocks", value: 10000, return: 8.5 },
        { name: "Bonds Fund", type: "Bonds", value: 5000, return: 4.2 },
        { name: "Bitcoin", type: "Cryptocurrency", value: 7000, return: 12.3 },
        { name: "Gold", type: "Commodities", value: 3000, return: 6.0 }
      ]
    };
    localStorage.setItem("userFinancialData", JSON.stringify(financialData));
  }

  document.getElementById("userName").textContent = `${userData.firstName || "John"} ${userData.lastName || "Doe"}`;
  
  updateInvestmentDisplay(financialData);
  setupInvestmentModal();
  
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  });
});

// Function to update all portfolio information
function updateInvestmentDisplay(financialData) {
  const investments = financialData.investments || [];

  if (investments.length === 0) {
    document.getElementById("investmentTableBody").innerHTML = "<tr><td colspan='5'>No investments available</td></tr>";
    document.getElementById("portfolioValue").textContent = "₹0.00";
    document.getElementById("annualReturn").textContent = "0.0%";
    document.getElementById("riskLevel").textContent = "N/A";
    return;
  }

  const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
  const avgReturn = investments.reduce((sum, inv) => sum + inv.return, 0) / investments.length;

  document.getElementById("portfolioValue").textContent = `₹${totalValue.toLocaleString()}`;
  document.getElementById("annualReturn").textContent = `${avgReturn.toFixed(1)}%`;
  document.getElementById("riskLevel").textContent = totalValue > 20000 ? "Moderate" : "Low";

  loadInvestmentHoldings(investments);
  updateAssetChart(investments);
}

// Function to load investment holdings into the table
function loadInvestmentHoldings(investments) {
  const tableBody = document.getElementById("investmentTableBody");
  tableBody.innerHTML = "";
  
  const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);

  investments.forEach((investment, index) => {
    const allocation = ((investment.value / totalValue) * 100).toFixed(1);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${investment.name}</td>
      <td>${investment.type}</td>
      <td>₹${investment.value.toLocaleString()}</td>
      <td>${allocation}%</td>
      <td>${investment.return}%</td>
      <td style="white-space: nowrap;">
        <button class="btn btn-primary btn-sm edit-investment" style="margin-right: 8px;">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm delete-investment">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(row);

    // Add edit event listener
    const editButton = row.querySelector('.edit-investment');
    editButton.addEventListener('click', () => editInvestment(investment, index));

    // Add delete event listener
    const deleteButton = row.querySelector('.delete-investment');
    deleteButton.addEventListener('click', () => deleteInvestment(index));
  });
}

// Function to edit an investment
function editInvestment(investment, index) {
  const modal = document.getElementById("investmentModal");
  const form = document.getElementById("investmentForm");
  const modalTitle = modal.querySelector(".modal-header h3");
  const submitButton = form.querySelector("button[type='submit']");

  // Set modal title and button text for edit mode
  modalTitle.textContent = "Edit Investment";
  submitButton.textContent = "Update Investment";

  // Fill form with investment data
  document.getElementById("investmentName").value = investment.name;
  document.getElementById("investmentType").value = investment.type;
  document.getElementById("investmentValue").value = investment.value;
  document.getElementById("investmentReturn").value = investment.return;

  // Show modal
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Remove any existing submit handler
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  // Add new submit handler for edit mode
  newForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const updatedInvestment = {
      name: document.getElementById("investmentName").value,
      type: document.getElementById("investmentType").value,
      value: parseFloat(document.getElementById("investmentValue").value),
      return: parseFloat(document.getElementById("investmentReturn").value)
    };

    let financialData = JSON.parse(localStorage.getItem("userFinancialData")) || { investments: [] };
    
    // Update the investment at the specified index
    financialData.investments[index] = updatedInvestment;
    localStorage.setItem("userFinancialData", JSON.stringify(financialData));

    // Update displays
    updateInvestmentDisplay(financialData);

    // Reset form and close modal
    newForm.reset();
    modal.style.display = "none";
    document.body.style.overflow = "";

    // Reset modal title and button
    modalTitle.textContent = "Add New Investment";
    submitButton.textContent = "Add Investment";
  });

  // Update the form reference in setupInvestmentModal
  setupInvestmentModal();
}

// Function to delete an investment
function deleteInvestment(index) {
  if (confirm('Are you sure you want to delete this investment?')) {
    let financialData = JSON.parse(localStorage.getItem("userFinancialData")) || { investments: [] };
    
    // Remove the investment at the specified index
    financialData.investments.splice(index, 1);
    
    // Save updated data back to localStorage
    localStorage.setItem("userFinancialData", JSON.stringify(financialData));
    
    // Update all displays
    updateInvestmentDisplay(financialData);
    
    // Force chart update
    if (assetChart) {
      const investments = financialData.investments;
      const assetLabels = investments.map(inv => inv.name);
      const assetValues = investments.map(inv => inv.value);
      
      assetChart.data.labels = assetLabels;
      assetChart.data.datasets[0].data = assetValues;
      assetChart.update();
    }
  }
}

// Function to initialize and update the asset allocation chart
let assetChart;
function updateAssetChart(investments) {
  const ctx = document.getElementById("assetAllocationChart").getContext("2d");

  const assetLabels = investments.map(inv => inv.name);
  const assetValues = investments.map(inv => inv.value);

  if (assetChart) {
    assetChart.destroy();
  }

  assetChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: assetLabels,
      datasets: [{
        data: assetValues,
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#FFC107", "#E91E63"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `₹${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Setup investment modal functionality
function setupInvestmentModal() {
  const modal = document.getElementById("investmentModal");
  const addInvestmentBtn = document.getElementById("addInvestmentBtn");
  const closeModalBtn = document.querySelector(".close-modal");
  const investmentForm = document.getElementById("investmentForm");

  addInvestmentBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });

  closeModalBtn.addEventListener("click", () => {
    closeModal();
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
    investmentForm.reset();
  }

  investmentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("investmentName").value;
    const type = document.getElementById("investmentType").value;
    const value = parseFloat(document.getElementById("investmentValue").value);
    const annualReturn = parseFloat(document.getElementById("investmentReturn").value);

    if (!name || !type || isNaN(value) || isNaN(annualReturn)) {
      alert("Please enter valid investment details.");
      return;
    }

    let financialData = JSON.parse(localStorage.getItem("userFinancialData")) || { investments: [] };
    financialData.investments.push({ name, type, value, return: annualReturn });

    localStorage.setItem("userFinancialData", JSON.stringify(financialData));

    updateInvestmentDisplay(financialData);

    closeModal();
  });
}
