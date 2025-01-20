let currentCoin = "dogecoin"; // Default coin on load

// Function to toggle the dropdown menu
function toggleDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.classList.toggle("hidden");
}

// Close dropdown when clicking outside
window.onclick = function (event) {
  if (!event.target.matches("button")) {
    const dropdowns = document.getElementsByClassName("absolute");
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (!openDropdown.classList.contains("hidden")) {
        openDropdown.classList.add("hidden");
      }
    }
  }
};

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
}

// Function to fetch data from the server
async function fetchCryptoData() {
  showLoader();
  try {
    const response = await fetch(
      `http://localhost:3000/fetch-data?coin=${currentCoin}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();

    // Update the DOM with the fetched data
    if (data && data.name && data.market_data) {
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
    } else {
      console.error("Invalid data structure:", data);
    }
  } catch (error) {
    console.error("Error fetching crypto data:", error);
  } finally {
    hideLoader();
  }
}

window.onload = fetchCryptoData; // Initial call on page load