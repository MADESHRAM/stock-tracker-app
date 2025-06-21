// ✅ Replace with your real API key
const apiKey = "06KFOBNEBF7247VG";

// 🔁 Load saved portfolio or use default
let sharesOwned = parseInt(localStorage.getItem("sharesOwned")) || 0;
let totalCost = parseFloat(localStorage.getItem("totalCost")) || 0;

// 📊 Chart.js instance
let stockChart = null;

// 📈 Render line chart
function renderChart(labels, prices) {
  const ctx = document.getElementById('stockChart').getContext('2d');

  if (stockChart !== null) stockChart.destroy(); // destroy previous chart

  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Price ($)',
        data: prices,
        borderColor: '#4f46e5',
        borderWidth: 2,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.3,
        pointRadius: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time',
            color: '#333'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price ($)',
            color: '#333'
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

// 🔍 Fetch current price & chart
document.getElementById('stock-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const symbol = document.getElementById('symbol-input').value.toUpperCase();

  // 🌐 Get real-time quote
  fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const stock = data["Global Quote"];
      if (!stock || !stock["05. price"]) {
        alert("Invalid symbol or data not available.");
        return;
      }

      const price = parseFloat(stock["05. price"]);
      document.getElementById('stock-symbol').innerText = stock["01. symbol"];
      document.getElementById('stock-price').innerText = price.toFixed(2);
      document.getElementById('stock-time').innerText = new Date().toLocaleString();
      document.getElementById('stock-name').innerText = "Stock Info";
      document.getElementById('stock-card').classList.remove('hidden');

      updatePortfolio(price);
      fetchIntradayData(symbol);
    })
    .catch(err => {
      alert("Error fetching stock data.");
      console.error(err);
    });
});

// ⏱️ Fetch chart data (5-min intervals)
function fetchIntradayData(symbol) {
  fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`)
    .then(response => response.json())
    .then(chartData => {
      const timeSeries = chartData["Time Series (5min)"];
      if (!timeSeries) {
        console.warn("No chart data available.");
        return;
      }

      const labels = Object.keys(timeSeries).reverse().slice(0, 12);
      const prices = labels.map(time => parseFloat(timeSeries[time]["1. open"]));

      renderChart(labels, prices);
    })
    .catch(err => {
      console.error("Chart fetch error", err);
    });
}

// 💼 Update portfolio UI
function updatePortfolio(currentPrice) {
  const avgPrice = sharesOwned > 0 ? totalCost / sharesOwned : 0;
  const totalValue = sharesOwned * currentPrice;
  const profitLoss = totalValue - totalCost;

  document.getElementById('shares-owned').innerText = sharesOwned;
  document.getElementById('avg-price').innerText = avgPrice.toFixed(2);
  document.getElementById('total-value').innerText = totalValue.toFixed(2);
  document.getElementById('profit-loss').innerText = profitLoss.toFixed(2);

  localStorage.setItem("sharesOwned", sharesOwned);
  localStorage.setItem("totalCost", totalCost.toFixed(2));
}

// 🛒 Buy 1 share
document.getElementById('buy-btn').addEventListener('click', () => {
  const price = parseFloat(document.getElementById('stock-price').innerText);
  sharesOwned += 1;
  totalCost += price;
  updatePortfolio(price);
});

// 💸 Sell 1 share
document.getElementById('sell-btn').addEventListener('click', () => {
  if (sharesOwned <= 0) {
    alert("You don't own any shares to sell!");
    return;
  }

  const price = parseFloat(document.getElementById('stock-price').innerText);
  totalCost -= (totalCost / sharesOwned);
  sharesOwned -= 1;
  updatePortfolio(price);
});

// 🔁 Reset portfolio
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm("Are you sure you want to reset your portfolio?")) {
    sharesOwned = 0;
    totalCost = 0;
    localStorage.removeItem("sharesOwned");
    localStorage.removeItem("totalCost");
    const price = parseFloat(document.getElementById('stock-price').innerText) || 0;
    updatePortfolio(price);
  }
});
