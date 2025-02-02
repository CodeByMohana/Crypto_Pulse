let currentCoin = "dogecoin"; // Default coin
let chartInstance = null; // To manage chart instance

// Function to toggle the dropdown menu
function toggleDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.classList.toggle("hidden");
}

// Function to show and hide loader
function showLoader() {
  document.getElementById("loader").style.display = "block";
  document.getElementById("loadingOverlay").style.display = "block";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
  document.getElementById("loadingOverlay").style.display = "none";
}

// Function to set the selected coin and update the data
function setCoin(coin) {
  currentCoin = coin;
  fetchCryptoData();
  fetchCandlestickData();
}

// Function to fetch real-time crypto data
async function fetchCryptoData() {
  showLoader();
  try {
    const response = await fetch(
      `http://localhost:3000/fetch-data?coin=${currentCoin}`
    );
    if (!response.ok) throw new Error("Failed to fetch data");

    const data = await response.json();

    // Update the DOM with the fetched data
    if (data?.name && data?.market_data) {
      document.getElementById("coinName").textContent = data.name;
      document.getElementById(
        "coinPrice"
      ).textContent = `$${data.market_data.current_price.usd.toFixed(6)}`;
      document
        .getElementById("allDayHigh")
        .querySelector(
          "p"
        ).textContent = `$${data.market_data.high_24h.usd.toFixed(3)}`;
      document
        .getElementById("high24hrs")
        .querySelector(
          "p"
        ).textContent = `$${data.market_data.high_24h.usd.toFixed(3)}`;
      document
        .getElementById("positiveSentiment")
        .querySelector("p").textContent = `${data.sentiments.positive.toFixed(
        3
      )}%`;
      document
        .getElementById("low24hrs")
        .querySelector(
          "p"
        ).textContent = `$${data.market_data.low_24h.usd.toFixed(3)}`;
    }
  } catch (error) {
    console.error("Error fetching crypto data:", error);
  } finally {
    hideLoader();
  }
}

// Function to fetch and process candlestick data
async function fetchCandlestickData(timeFrame = "30") {
  showLoader();
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${timeFrame}`
    );
    if (!response.ok) throw new Error("Failed to fetch candlestick data");

    const data = await response.json();

    // Aggregate data into daily candlesticks
    const dailyCandles = {};
    data.prices.forEach(([timestamp, price]) => {
      const date = new Date(timestamp);
      const dayKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime();

      if (!dailyCandles[dayKey]) {
        dailyCandles[dayKey] = {
          open: price,
          high: price,
          low: price,
          close: price,
          timestamp: dayKey,
        };
      } else {
        dailyCandles[dayKey].high = Math.max(dailyCandles[dayKey].high, price);
        dailyCandles[dayKey].low = Math.min(dailyCandles[dayKey].low, price);
        dailyCandles[dayKey].close = price;
      }
    });

    const formattedData = Object.values(dailyCandles).map((candle) => ({
      x: new Date(candle.timestamp),
      y: [candle.open, candle.high, candle.low, candle.close],
    }));

    renderCandlestickChart(formattedData);
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
  } finally {
    hideLoader();
  }
}
// Function to render candlestick data
function renderCandlestickChart(data) {
  if (chartInstance) {
    chartInstance.destroy();
  }

  const options = {
    chart: {
      type: "candlestick",
      height: 500,
      background: "#1a1a1a",
      foreColor: "#ffffff",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    series: [
      {
        name: "Price",
        data: data,
      },
    ],
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "#ffffff",
        },
      },
      axisBorder: {
        show: true,
        color: "#444444",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#ffffff",
        },
        formatter: (value) => `$${value.toFixed(2)}`,
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#00b746",
          downward: "#ef403c",
        },
        wick: {
          useFillColor: true,
        },
      },
    },
    grid: {
      borderColor: "#444444",
      strokeDashArray: 4,
    },
    tooltip: {
      enabled: true,
      theme: "dark",
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const open = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
        const high = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
        const low = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
        const close = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
        const date = new Date(
          w.globals.seriesX[seriesIndex][dataPointIndex]
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `
          <div class="apexcharts-tooltip-candlestick">
            <div class="tooltip-header">${date}</div>
            <div class="tooltip-body">
              <div>Open: <span>$${open.toFixed(6)}</span></div>
              <div>High: <span>$${high.toFixed(6)}</span></div>
              <div>Low: <span>$${low.toFixed(6)}</span></div>
              <div>Close: <span>$${close.toFixed(6)}</span></div>
            </div>
          </div>
        `;
      },
    },
  };

  chartInstance = new ApexCharts(
    document.querySelector("#candlestickChart"),
    options
  );
  chartInstance.render();
}

// Add custom tooltip styles
const style = document.createElement("style");
style.textContent = `
  .apexcharts-tooltip-candlestick {
    background: #2d2d2d !important;
    border: 1px solid #444444 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
    padding: 12px !important;
    color: #ffffff !important;
    font-family: 'Arial', sans-serif !important;
  }
  .tooltip-header {
    font-weight: bold;
    margin-bottom: 8px;
    color: #00b746;
    font-size: 14px;
  }
  .tooltip-body div {
    margin: 4px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }
  .tooltip-body span {
    color: #ffffff;
    margin-left: 12px;
    font-weight: 600;
  }
`;
document.head.appendChild(style);

function changeTimeFrame(timeFrame) {
  fetchCandlestickData(timeFrame);
}

// Initialize on load
window.onload = () => {
  fetchCryptoData();
  fetchCandlestickData("360");
};


function applyFilters() {
  const minMarketCap = document.getElementById("minMarketCap").value || 0;
  const maxMarketCap = document.getElementById("maxMarketCap").value || Infinity;
  const minPrice = document.getElementById("minPrice").value || 0;
  const maxPrice = document.getElementById("maxPrice").value || Infinity;

  fetchCryptoData(minMarketCap, maxMarketCap, minPrice, maxPrice);
}

// Modify fetchCryptoData to accept filter parameters
async function fetchCryptoData(minMarketCap = 0, maxMarketCap = Infinity, minPrice = 0, maxPrice = Infinity) {
  showLoader();
  try {
      const response = await fetch(
          `http://localhost:3000/fetch-data?coin=${currentCoin}&minMarketCap=${minMarketCap}&maxMarketCap=${maxMarketCap}&minPrice=${minPrice}&maxPrice=${maxPrice}`
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();

      if (data?.name && data?.market_data) {
          const marketCap = data.market_data.market_cap.usd / 1e6; // Convert to million dollars
          const price = data.market_data.current_price.usd;

          if (marketCap >= minMarketCap && marketCap <= maxMarketCap && price >= minPrice && price <= maxPrice) {
              document.getElementById("coinName").textContent = data.name;
              document.getElementById("coinPrice").textContent = `$${price.toFixed(6)}`;
              document.getElementById("allDayHigh").querySelector("p").textContent = `$${data.market_data.high_24h.usd.toFixed(3)}`;
              document.getElementById("high24hrs").querySelector("p").textContent = `$${data.market_data.high_24h.usd.toFixed(3)}`;
              document.getElementById("positiveSentiment").querySelector("p").textContent = `${data.sentiments.positive.toFixed(3)}%`;
              document.getElementById("low24hrs").querySelector("p").textContent = `$${data.market_data.low_24h.usd.toFixed(3)}`;
          } else {
              alert("No results found for the selected filters.");
          }
      }
  } catch (error) {
      console.error("Error fetching crypto data:", error);
  } finally {
      hideLoader();
  }
}
