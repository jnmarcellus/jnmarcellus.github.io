// Define a function that updates the stock quote
const updateStockQuote = () => {
	const API_KEY = "e4e528bb32eb4bc59f2c3bd5fe304ebb";
	const SYMBOLS = ["AAPL", "MSFT", "AMZN", "GOOGL", "FB", "TSLA"];
	const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
	const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`;

	fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}
			return response.json();
		})
		.then(data => {
			const price = parseFloat(data.close).toFixed(2);
			const change = parseFloat(data.change).toFixed(2);
			const changePercent = parseFloat(data.percent_change).toFixed(2);
			const html = `<strong>${symbol}</strong>: ${price} (${change}, ${changePercent}%)`;
			document.getElementById("stock-quote").innerHTML = html;
		})
		.catch(error => {
			console.error(error);
		});
};

// Call the updateStockQuote function when the page loads
window.onload = updateStockQuote;

// Call the updateStockQuote function every 5 seconds
setInterval(updateStockQuote, 5000);
