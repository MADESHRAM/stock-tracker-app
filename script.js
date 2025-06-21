// ✅ Replace with your real API key
const apiKey = "06KFOBNEBF7247VG";

// 🔁 Load saved portfolio data or use default values
let sharesOwned = parseInt(localStorage.getItem("sharesOwned")) || 0;
let totalCost = parseFloat(localStorage.getItem("totalCost")) || 0;

// Chart.js setup
let stockChart = null;

function renderChart(labels, prices) {
  const ctx = document.getElementById('stockChart').getContext('2d');

  // Destroy previous chart if exists
  if (stockChart !== null) {
    stockChart.destroy();
  }

  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Price ($)',
        data: prices,
        borderColor: '#007bff',
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price ($)'
          },
          beginAtZero: false
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// 📌 Fetch stock data from Alpha Vantage
document.getElementById('stock-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const symbol = document.getElementById('symbol-input').value.toUpperCase();

  // ✅ Get current stock price
  fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const stock = data["Global Quote"];
      if (!stock || !stock["05. price"]) {
        alert("Invalid symbol or data not available.");
        return;
      }

      const price = parseFloat(stock["05. price"]);
      document.getElementById('stock-name').innerText = "Stock Info";
      document.getElementById('stock-symbol').innerText = stock["01. symbol"];
      document.getElementById('stock-price').innerText = price.toFixed(2);
      document.getElementById('stock-time').innerText = new Date().toLocaleString();

      document.getElementById('stock-card').classList.remove('hidden');

      updatePortfolio(price);

      // ✅ Fetch intraday data for chart
      fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`)
        .then(response => response.json())
        .then(chartData => {
          const timeSeries = chartData["Time Series (5min)"];
          if (!timeSeries) {
            console.log("No chart data available.");
            return;
          }

          const labels = Object.keys(timeSeries).reverse().slice(0, 12); // latest 12 time points
          const prices = labels.map(time => parseFloat(timeSeries[time]["1. open"]));
          renderChart(labels, prices);
        })
        .catch(err => console.error("Chart fetch error", err));
    })
    .catch(err => {
      alert("Error fetching stock data.");
      console.error(err);
    });
});

// 🔁 Update Portfolio UI and Save to localStorage
function updatePortfolio(currentPrice) {
  const avgPrice = sharesOwned > 0 ? totalCost / sharesOwned : 0;
  const totalValue = sharesOwned * currentPrice;
  const profitLoss = totalValue - totalCost;

  document.getElementById('shares-owned').innerText = sharesOwned;
  document.getElementById('avg-price').innerText = avgPrice.toFixed(2);
  document.getElementById('total-value').innerText = totalValue.toFixed(2);
  document.getElementById('profit-loss').innerText = profitLoss.toFixed(2);

  // 💾 Save to localStorage
  localStorage.setItem("sharesOwned", sharesOwned);
  localStorage.setItem("totalCost", totalCost.toFixed(2));
}

// ✅ Buy 1 share
document.getElementById('buy-btn').addEventListener('click', () => {
  const price = parseFloat(document.getElementById('stock-price').innerText);
  const shares = 1;

  sharesOwned += shares;
  totalCost += price * shares;

  updatePortfolio(price);
});

// ✅ Sell 1 share
document.getElementById('sell-btn').addEventListener('click', () => {
  if (sharesOwned <= 0) {
    alert("You don't own any shares to sell!");
    return;
  }

  const price = parseFloat(document.getElementById('stock-price').innerText);
  const shares = 1;

  totalCost -= (totalCost / sharesOwned) * shares;
  sharesOwned -= shares;

  updatePortfolio(price);
});

// ✅ Reset portfolio (optional)
const resetButton = document.getElementById('reset-btn');
if (resetButton) {
  resetButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your portfolio?")) {
      sharesOwned = 0;
      totalCost = 0;
      localStorage.removeItem("sharesOwned");
      localStorage.removeItem("totalCost");
      const price = parseFloat(document.getElementById('stock-price').innerText) || 0;
      updatePortfolio(price);
    }
  });
}
