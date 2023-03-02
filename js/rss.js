// Created from chat.openai.com - all rights reserved to OpenAI

// RSS feed URL
var rssUrl = 'https://feeds.skynews.com/feeds/rss/home.xml';

// Get the news ticker element
var ticker = document.getElementById('news-ticker');

// Create a new XMLHTTPRequest object
var xhr = new XMLHttpRequest();

// Set the callback function
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        // Parse the RSS feed XML
        var rss = xhr.responseXML;
        var items = rss.getElementsByTagName('item');
        
        // Loop through the items and add them to the ticker
        for (var i = 0; i < items.length; i++) {
            var title = items[i].getElementsByTagName('title')[0].textContent;
            var link = items[i].getElementsByTagName('link')[0].textContent;
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = link;
            a.textContent = title;
            li.appendChild(a);
            ticker.querySelector('ul').appendChild(li);
        }
        
        // Initialize the news ticker
        $(ticker).newsTicker();
    }
};

// Open the XMLHTTPRequest with the RSS feed URL
xhr.open('GET', rssUrl, true);

// Send the XMLHTTPRequest
xhr.send();
