document.addEventListener("DOMContentLoaded", () => {
  console.log("🔄 Page Loaded. Initializing predictions...");

  // Load user data from localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const financialData = JSON.parse(localStorage.getItem("userFinancialData") || "{}");

  console.log("📊 Loaded User Data:", userData);
  console.log("💰 Loaded Financial Data:", financialData);

  // Update user name in the UI
  if (userData.firstName) {
      document.getElementById("userName").textContent = `${userData.firstName} ${userData.lastName || ""}`;
  }

  // Initialize charts & recommendations only if data is available
  if (userData.monthlyIncome) {
      initializePredictions(userData, financialData);
      initializeProjections(userData, financialData);
  } else {
      console.warn("⚠ No financial data found. Displaying empty charts.");
      document.getElementById("budgetRuleAnalysis").innerHTML = "<p>No financial data available.</p>";
      document.getElementById("recommendationsContainer").innerHTML = "<p>No recommendations yet.</p>";
      document.getElementById("projectionDetails").innerHTML = "<p>No data available for future projections.</p>";
  }

  // Initialize chat functionality
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendMessage");
  const chatMessages = document.getElementById("chatMessages");

  // Handle send button click
  sendButton.addEventListener("click", () => sendMessage());

  // Handle enter key press
  chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
          sendMessage();
      }
  });

  async function sendMessage() {
      const message = chatInput.value.trim();
      if (!message) return;

      // Clear input
      chatInput.value = "";

      // Add user message to chat
      addMessageToChat(message, true);

      try {
          // Get user's financial context
          const userData = JSON.parse(localStorage.getItem("userData") || "{}");
          const financialData = JSON.parse(localStorage.getItem("userFinancialData") || "{}");

          // Call API with user's message and context
          const response = await fetch('http://127.0.0.1:5000/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: JSON.stringify({
                  message: message,
                  context: {
                      monthlyIncome: userData.monthlyIncome,
                      transactions: financialData.transactions || [],
                      userProfile: {
                          name: userData.firstName,
                          age: userData.age,
                          occupation: userData.occupation
                      }
                  }
              })
          });

          if (!response.ok) {
              throw new Error('Network response was not ok');
          }

          const data = await response.json();
          
          // Add bot response to chat
          addMessageToChat(data.response, false);

      } catch (error) {
          console.error('Error:', error);
          addMessageToChat("I apologize, but I'm having trouble connecting to the server. Please try again later.", false);
      }
  }

  function addMessageToChat(message, isUser) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
      
      const icon = document.createElement('i');
      icon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
      
      const content = document.createElement('div');
      content.className = 'message-content';
      content.textContent = message;
      
      messageDiv.appendChild(icon);
      messageDiv.appendChild(content);
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

// Initialize all financial calculations
function initializePredictions(userData, financialData) {
  const income = Number(userData.monthlyIncome) || 0;
  const transactions = financialData.transactions || [];

  console.log("📈 Monthly Income:", income);
  console.log("🛒 Transactions:", transactions);

  if (income === 0) {
      console.warn("⚠ No income data available. Skipping calculations.");
      return;
  }

  // Calculate & display financial health score
  const healthScore = calculateFinancialHealthScore(income, transactions);
  updateHealthScoreChart(healthScore);

  // Analyze budget with 50/30/20 rule
  analyzeBudget(income, transactions);

  // Generate AI recommendations
  generateRecommendations(income, transactions);
}

// Financial health score calculation
function calculateFinancialHealthScore(income, transactions) {
  let score = 50; // Base score
  const totalSpending = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const spendingRatio = totalSpending / income;

  score += spendingRatio < 0.5 ? 30 : spendingRatio < 0.7 ? 10 : -10;
  return Math.min(100, Math.max(0, score));
}

// Update health score chart
function updateHealthScoreChart(score) {
  const ctx = document.getElementById("healthScoreChart")?.getContext("2d");
  if (!ctx) {
      console.error("❌ Health Score Chart not found.");
      return;
  }

  new Chart(ctx, {
      type: "doughnut",
      data: {
          datasets: [
              {
                  data: [score, 100 - score],
                  backgroundColor: ["rgba(67, 97, 238, 0.7)", "rgba(200, 200, 200, 0.5)"],
                  borderWidth: 0,
              },
          ],
      },
      options: {
          cutout: "80%",
          responsive: true,
          maintainAspectRatio: false,
      },
  });

  document.getElementById("healthScore").textContent = score;
}

// Budget Analysis (50/30/20 Rule)
function analyzeBudget(income, transactions) {
  const totalSpending = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const needs = totalSpending * 0.5;
  const wants = totalSpending * 0.3;
  const savings = income - totalSpending;

  const ctx = document.getElementById("budgetRuleChart")?.getContext("2d");
  if (!ctx) {
      console.error("❌ Budget Chart not found.");
      return;
  }

  new Chart(ctx, {
      type: "bar",
      data: {
          labels: ["Needs", "Wants", "Savings"],
          datasets: [
              {
                  label: "Current",
                  data: [needs, wants, savings],
                  backgroundColor: "rgba(67, 97, 238, 0.7)",
              },
              {
                  label: "Ideal",
                  data: [income * 0.5, income * 0.3, income * 0.2],
                  backgroundColor: "rgba(76, 201, 240, 0.7)",
              },
          ],
      },
  });

  document.getElementById("budgetRuleAnalysis").innerHTML = `
      <p>📊 Budget Breakdown:</p>
      <ul>
          <li>Needs: ₹${needs.toFixed(2)}</li>
          <li>Wants: ₹${wants.toFixed(2)}</li>
          <li>Savings: ₹${savings.toFixed(2)}</li>
      </ul>
  `;
}

// AI-Based Financial Recommendations
async function generateRecommendations(income, transactions) {
    try {
        // Ensure valid data
        if (!income || !transactions || transactions.length === 0) {
            console.warn("No financial data available.");
            document.getElementById("recommendationsContainer").innerHTML = `
                <p>⚠ No transaction data found. Please add your income and expenses.</p>
            `;
            return;
        }

        // Filter and calculate expenses
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .map(t => Number(t.amount || 0));

        const totalExpenses = expenses.reduce((sum, amount) => sum + amount, 0);
        const savings = income - totalExpenses;

        // Ensure we are not sending invalid or empty data
        if (income <= 0 || totalExpenses < 0) {
            console.error("Invalid financial data.");
            document.getElementById("recommendationsContainer").innerHTML = `
                <p>⚠ Invalid income or expenses data. Please check your entries.</p>
            `;
            return;
        }

        // Show loading state
        document.getElementById("recommendationsContainer").innerHTML = `
            <p>🔄 Generating personalized financial recommendations...</p>
        `;

        // Call AI API for financial advice
        const response = await fetch('http://127.0.0.1:5000/api/financial-advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                income: Number(income),
                expenses: expenses,
                savings: Number(savings)
            }),
            mode: 'cors' // Explicitly set CORS mode
        });

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Format AI-generated advice into paragraphs
            const recommendations = data.advice.split('\n').filter(line => line.trim());
            document.getElementById("recommendationsContainer").innerHTML = recommendations
                .map(r => `<p>💡 ${r}</p>`)
                .join("");
        } else {
            throw new Error(data.error || 'Failed to get AI recommendations');
        }

    } catch (error) {
        console.error('Error getting AI recommendations:', error);

        // Fallback recommendations when AI API fails
        document.getElementById("recommendationsContainer").innerHTML = `
            <p>⚠ Unable to get AI recommendations at the moment.</p>
            <p>Basic Financial Tips:</p>
            <ul>
                <li>📈 Aim to save at least <strong>20%</strong> of your income</li>
                <li>📊 Track your expenses regularly using a budgeting tool</li>
                <li>🏦 Build an emergency fund with at least <strong>3-6 months</strong> of expenses</li>
                <li>📉 Reduce unnecessary spending and prioritize needs over wants</li>
            </ul>
        `;
    }
}

function initializeProjections(userData, financialData) {
    const monthlyIncome = Number(userData.monthlyIncome) || 0;
    const transactions = financialData.transactions || [];
    
    // Calculate monthly expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = monthlyTransactions.reduce((sum, transaction) => 
        sum + parseFloat(transaction.amount), 0);
    
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = (monthlySavings / monthlyIncome) * 100;

    // Calculate projections for next 10 years
    const years = Array.from({length: 11}, (_, i) => i); // 0 to 10 years
    const projectedWealth = years.map(year => {
        // Assuming 8% annual return on investments
        return calculateCompoundGrowth(monthlySavings * 12, 0.08, year);
    });

    // Update the projections chart
    const ctx = document.getElementById("projectionsChart").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: years.map(year => `Year ${year}`),
            datasets: [{
                label: "Projected Wealth",
                data: projectedWealth,
                borderColor: "rgba(67, 97, 238, 1)",
                backgroundColor: "rgba(67, 97, 238, 0.1)",
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₹${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `₹${value.toFixed(0)}`;
                        }
                    }
                }
            }
        }
    });

    // Update projection details
    const threeYearProjection = projectedWealth[3];
    const fiveYearProjection = projectedWealth[5];
    const tenYearProjection = projectedWealth[10];

    document.getElementById("projectionDetails").innerHTML = `
        <div class="projection-stats">
            <div class="stat">
                <label>Current Monthly Savings</label>
                <span>₹${monthlySavings.toFixed(2)}</span>
            </div>
            <div class="stat">
                <label>Savings Rate</label>
                <span>${savingsRate.toFixed(1)}%</span>
            </div>
            <div class="stat highlight">
                <label>3 Year Projection</label>
                <span>₹${threeYearProjection.toFixed(2)}</span>
            </div>
            <div class="stat highlight">
                <label>5 Year Projection</label>
                <span>₹${fiveYearProjection.toFixed(2)}</span>
            </div>
            <div class="stat highlight">
                <label>10 Year Projection</label>
                <span>₹${tenYearProjection.toFixed(2)}</span>
            </div>
        </div>
        <div class="recommendations">
            <h4>Investment Recommendations</h4>
            <ul>
                <li>Consider investing in a diversified portfolio of stocks and bonds</li>
                <li>Maximize tax-advantaged retirement accounts</li>
                <li>Keep an emergency fund of 3-6 months of expenses</li>
                <li>Review and rebalance your investment portfolio annually</li>
            </ul>
        </div>
    `;
}

// Helper function to calculate compound growth
function calculateCompoundGrowth(principal, rate, years) {
    // Monthly compound interest formula
    const monthlyRate = rate / 12;
    const months = years * 12;
    const monthlyContribution = principal / 12;

    let total = 0;
    for (let i = 0; i < months; i++) {
        total = (total + monthlyContribution) * (1 + monthlyRate);
    }
    
    return total;
}
