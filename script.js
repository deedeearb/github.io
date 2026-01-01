// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

async function getMortgageRate() {
  // Check localStorage cache first (rates only update weekly)
  const cached = localStorage.getItem('mortgageRateCache');
  if (cached) {
    const { rateText, timestamp } = JSON.parse(cached);
    // Cache valid for 7 days
    if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
      document.getElementById('mortgage-rate').innerHTML = rateText;
      return;
    }
  }

  const fredUrl = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=fa88d8ff8e0cfdf965148ab5ebe1f98a&file_type=json&limit=100&sort_order=desc`);
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fredUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      const latestRate = data.observations[0].value;
      const latestDate = data.observations[0].date;

      const formattedDate = new Date(latestDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const rateText = `${latestRate}% <small>(as of ${formattedDate})</small>`;

      const rateElement = document.getElementById('mortgage-rate');
      if (rateElement) {
        rateElement.innerHTML = rateText;
      }

      // Cache the result
      localStorage.setItem('mortgageRateCache', JSON.stringify({
        rateText,
        timestamp: Date.now()
      }));
    } else {
      throw new Error('No data returned');
    }
  } catch (error) {
    console.error('Rate fetch error:', error);
    const rateElement = document.getElementById('mortgage-rate');
    if (rateElement) {
      rateElement.innerText = 'Unavailable';
    }
  }
}

// Run automatically when script loads (since it's at bottom of HTML)
getMortgageRate();