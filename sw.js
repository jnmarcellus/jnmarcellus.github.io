/*
 * Offline shell for the start page.
 *
 * Bump CACHE on every deploy — the whole point of a versioned name is that
 * a stale worker can never pin an old build forever, which is the classic
 * way a cached static site becomes unfixable from the server side.
 */
var CACHE = 'quest-v7';

var SHELL = [
  'index.html',
  'map.html',
  'map-raw.html',

  /* Vendored Leaflet. The marker and layer PNGs under vendor/leaflet/
     images/ are deliberately NOT here: nothing on the map places a
     marker or a layers control today, so precaching them would add
     weight for glyphs that are never requested. If that changes they
     are same-origin and the cache-first branch picks them up. */
  'vendor/leaflet/leaflet.css',
  'vendor/leaflet/leaflet.js',
  'blog.html',
  'css/main.css',
  'css/reset.css',
  'css/vars.css',
  'css/animations.css',
  'css/styles.css',
  'css/fonts.css',
  'fonts/fira-code-latin.woff2',
  'fonts/fira-code-latin-ext.woff2',
  'js/config.js',
  'js/app.js',
  'img/logo.png',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'site.webmanifest',

  /* The 18 documented OpenWeather condition codes. */
  'img/weather/01d.png',
  'img/weather/01n.png',
  'img/weather/02d.png',
  'img/weather/02n.png',
  'img/weather/03d.png',
  'img/weather/03n.png',
  'img/weather/04d.png',
  'img/weather/04n.png',
  'img/weather/09d.png',
  'img/weather/09n.png',
  'img/weather/10d.png',
  'img/weather/10n.png',
  'img/weather/11d.png',
  'img/weather/11n.png',
  'img/weather/13d.png',
  'img/weather/13n.png',
  'img/weather/50d.png',
  'img/weather/50n.png',

  /* Bookmark favicons — self-hosted, so the bookmark list no longer costs
     18 third-party requests. Google Fonts and OpenWeather are still remote. */
  'img/icons/amazon.com.png',
  'img/icons/arstechnica.com.png',
  'img/icons/dailymail.co.uk.png',
  'img/icons/google.com.png',
  'img/icons/hulu.com.png',
  'img/icons/johnmarcellus.com.png',
  'img/icons/linkedin.com.png',
  'img/icons/mwmbl.org.png',
  'img/icons/netflix.com.png',
  'img/icons/news.ycombinator.com.png',
  'img/icons/reddit.com.png',
  'img/icons/slashdot.org.png',
  'img/icons/spotify.com.png',
  'img/icons/theguardian.com.png',
  'img/icons/tldr.tech.png',
  'img/icons/x.com.png',
  'img/icons/youtube.com.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    /* addAll is all-or-nothing: one 404 would leave the site with no cache
     * at all and no clue why, so each entry is allowed to fail alone. */
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* Nothing cross-origin is cached any more: the only remote requests
   * left are the OpenWeather and Hacker News JSON APIs, and a stale
   * forecast is worse than none. Favicons, weather glyphs and fonts are
   * all same-origin and fall through to the cache-first branch below. */
  if (url.origin !== location.origin) return;

  /* Network-first for pages so an edit lands on the next load rather than
   * whenever the cache happens to turn over. */
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('index.html');
        });
      })
    );
    return;
  }

  /* Cache-first for CSS/JS/images, refreshed in the background. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
