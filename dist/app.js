let currentCoin = "dogecoin"; // Default coin
let chartInstance = null; // To manage chart instance
let cachedCoinList = null; // Cache for coin list

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
  document.getElementById("searchInput").value = "";
  document.getElementById("searchDropdown").style.display = "none";
  document.getElementById("moreDropdownMenu").style.display = "none";
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
        hover: {
          colors: {
            upward: "#00ff88",
            downward: "#ff5555",
          },
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
    
        // Calculate percentage change
        const change = ((close - open) / open) * 100;
        const isPositive = change >= 0;
        const changeColor = isPositive ? "#00b746" : "#ef403c";
        const changeText = `${change.toFixed(2)}%`;
    
        return `
          <div class="apexcharts-tooltip-candlestick">
            <div class="tooltip-header">${date}</div>
            <div class="tooltip-body">
              <div>Open: <span class="value">$${open.toFixed(6)}</span></div>
              <div>High: <span class="value">$${high.toFixed(6)}</span></div>
              <div>Low: <span class="value">$${low.toFixed(6)}</span></div>
              <div>Close: <span class="value">$${close.toFixed(6)}</span></div>
              <div>Change: <span style="color: ${changeColor}">${changeText}</span></div>
            </div>
          </div>
        `;
      },
    },
    
  };



  chartInstance = new ApexCharts(document.querySelector("#candlestickChart"), options);
  chartInstance.render();
}

function changeTimeFrame(timeFrame) {
  fetchCandlestickData(timeFrame);
}

// Search functionality
async function handleSearch() {
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();
  const searchDropdown = document.getElementById("searchDropdown");

  if (searchQuery.length > 2) {
    try {
      if (!cachedCoinList) {
        showLoader();
        const response = await fetch("https://api.coingecko.com/api/v3/coins/list");
        if (!response.ok) {
          throw new Error("Failed to fetch coins");
        }
        cachedCoinList = await response.json();
      }

      const filteredCoins = cachedCoinList
        .filter(
          (coin) =>
            coin.name.toLowerCase().includes(searchQuery) ||
            coin.symbol.toLowerCase().includes(searchQuery)
        )
        .slice(0, 10);

      displayDropdown(filteredCoins);
    } catch (error) {
      console.error("Error in search:", error);
      cachedCoinList = null;
    } finally {
      hideLoader();
    }
  } else {
    searchDropdown.style.display = "none";
  }
}

function displayDropdown(filteredCoins) {
  const searchDropdown = document.getElementById("searchDropdown");
  searchDropdown.innerHTML = "";

  if (filteredCoins.length === 0) {
    searchDropdown.style.display = "none";
    return;
  }

  filteredCoins.forEach((coin) => {
    const coinElement = document.createElement("a");
    coinElement.href = "#";
    coinElement.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    coinElement.onclick = (e) => {
      e.preventDefault();
      setCoin(coin.id);
      searchDropdown.style.display = "none";
      document.getElementById("searchInput").value = "";
    };
    searchDropdown.appendChild(coinElement);
  });

  searchDropdown.style.display = "block";
}

document.getElementById("searchInput").addEventListener("focus", async () => {
  if (!cachedCoinList) {
    try {
      showLoader();
      const response = await fetch("https://api.coingecko.com/api/v3/coins/list");
      if (response.ok) {
        cachedCoinList = await response.json();
      }
    } catch (error) {
      console.error("Error pre-fetching coin list:", error);
    } finally {
      hideLoader();
    }
  }
});

document.addEventListener("click", function (event) {
  const searchContainer = document.querySelector(".search-container");
  const searchDropdown = document.getElementById("searchDropdown");

  if (!searchContainer.contains(event.target)) {
    searchDropdown.style.display = "none";
  }
});

window.onload = () => {
  fetchCryptoData();
  fetchCandlestickData("360");
};