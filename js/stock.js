$(document).ready(function() {
  var symbols = ["AAPL", "MSFT", "AMZN", "GOOGL", "FB", "TSLA"]; // Array of stock symbols
  var index = 0; // Index to keep track of current stock symbol

  // Function to get stock data and update banner
  function updateBanner() {
    var symbol = symbols[index];
    var url = "https://api.twelvedata.com/quote?symbol=" + symbol + "&apikey=e4e528bb32eb4bc59f2c3bd5fe304ebb";

    $.getJSON(url, function(data) {
      var price = data.close;
      var change = data.change;
      var changePercent = data.percent_change;
      var html = "<strong>" + symbol + "</strong>: " + price.toFixed(2) + " (" + change.toFixed(2) + ", " + changePercent.toFixed(2) + "%)";
      $("#stock-quote").html(html);
    });

    // Increment index and cycle through symbols array
    index++;
    if (index == symbols.length) {
      index = 0;
    }
  }

  // Update banner every 5 seconds
  setInterval(updateBanner, 5000);
});
