/*
 * Shared renderer for every page. Each page ships an empty shell and sets
 * window.BASE; everything visible below is built from js/config.js so the
 * dock and bookmarks cannot drift between index / map / blog again.
 *
 * Every widget renders only if its container exists, which is what lets
 * blog pages reuse this file without carrying a dock they don't want.
 */
(function () {
  'use strict';

  var C = window.QUEST;
  var BASE = window.BASE || '';

  /* HN titles and OpenWeather descriptions are third-party strings that end
   * up in innerHTML. They arrive with quotes and angle brackets often enough
   * that this is not theoretical. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function resolve(href) {
    return href.indexOf('~/') === 0 ? BASE + href.slice(2) : href;
  }

  function $(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------ theme */

  var SUN = '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>' +
    '<line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>' +
    '<line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  var MOON = '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  var toggleTheme = function () {};

  function theme() {
    var root = document.documentElement;
    var meta = document.querySelector('meta[name="theme-color"]');
    var media = window.matchMedia('(prefers-color-scheme: dark)');

    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.type = 'button';
    btn.innerHTML = SUN + MOON;
    document.body.appendChild(btn);

    /* No stored choice means "follow the OS", which is a real third state —
     * collapsing it to a stored value on first load would freeze the page
     * to whatever the OS happened to be that morning. */
    var resolved = function () {
      return root.dataset.theme || (media.matches ? 'dark' : 'light');
    };

    var sync = function () {
      var t = resolved();
      if (meta) meta.setAttribute('content', t === 'dark' ? '#1C1C1C' : '#EEEEEE');
      btn.setAttribute('aria-pressed', String(t === 'dark'));
      var label = 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme (Alt+T)';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    };

    toggleTheme = function () {
      var next = resolved() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      /* Safari in private mode throws on setItem rather than no-opping. */
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    };

    btn.addEventListener('click', toggleTheme);
    media.addEventListener('change', function () {
      if (!root.dataset.theme) sync();
    });

    sync();
  }

  /* ------------------------------------------------------------------ clock */

  function clock() {
    var el = $('date-time');
    if (!el) return;
    var tick = function () {
      var d = new Date();
      el.innerHTML = '<p id="date">' + esc(d.toDateString()) + '</p>' +
                     '<p id="time">' + esc(d.toLocaleTimeString()) + '</p>';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------- weather */

  function weather() {
    var el = $('weather');
    if (!el) return;

    var url = 'https://api.openweathermap.org/data/2.5/weather?units=imperial&id=' +
              encodeURIComponent(C.weather.cityId) +
              '&appid=' + encodeURIComponent(C.weather.apiKey);

    var draw = function () {
      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('weather ' + r.status);
          return r.json();
        })
        .then(function (d) {
          var w = d.weather[0];
          el.innerHTML =
            '<p id="location">' + esc(d.name) + '</p>' +
            '<p id="details" title="Feels like ' + Math.round(d.main.feels_like) + '&deg;F">' +
              '<img alt="" src="https://openweathermap.org/img/wn/' + esc(w.icon) + '.png">' +
              esc(w.description) +
              '<span class="separator">|</span>' + Math.round(d.main.temp) + '&deg;F' +
              '<span class="separator">|</span>' +
              '<span class="hilo">' + Math.round(d.main.temp_max) + '&deg; / ' +
                Math.round(d.main.temp_min) + '&deg;</span>' +
            '</p>';
        })
        .catch(function (e) {
          /* Silence here used to mean an empty header with no explanation. */
          el.innerHTML = '<p id="location">Weather</p><p id="details">unavailable</p>';
          console.warn(e);
        });
    };

    draw();
    setInterval(draw, 10 * 60 * 1000);   // replaces the old <meta refresh>
  }

  /* ----------------------------------------------------------- hacker news */

  function banner() {
    var el = $('banner-container');
    if (!el) return;
    var api = 'https://hacker-news.firebaseio.com/v0/';

    fetch(api + 'topstories.json')
      .then(function (r) { return r.json(); })
      .then(function (ids) {
        return Promise.all(ids.slice(0, C.hn.count).map(function (id) {
          return fetch(api + 'item/' + id + '.json').then(function (r) { return r.json(); });
        }));
      })
      .then(function (stories) {
        /* Deleted items come back null, and Ask/Show HN text posts have no
         * .url at all — that combination used to render href="undefined". */
        stories = stories.filter(function (s) { return s && s.title; });
        if (!stories.length) throw new Error('no stories');

        var i = 0, timer = null;
        var show = function () {
          var s = stories[i];
          var item = 'https://news.ycombinator.com/item?id=' + s.id;
          el.innerHTML =
            '<h6><a href="' + esc(s.url || item) + '" target="_blank" rel="noopener">' +
              esc(s.title) + '</a>' +
              '<a class="hn-comments" href="' + item + '" target="_blank" rel="noopener">' +
                (s.descendants || 0) + '&nbsp;comments</a>' +
            '</h6>';
          i = (i + 1) % stories.length;
        };
        var start = function () { timer = setInterval(show, C.hn.rotateMs); };
        var stop  = function () { clearInterval(timer); };

        show();
        start();
        /* Rotating out from under the cursor mid-read is the whole reason
         * headlines were unclickable before. */
        el.addEventListener('mouseenter', stop);
        el.addEventListener('mouseleave', start);
      })
      .catch(function (e) {
        el.innerHTML = '<h6>Hacker News unavailable</h6>';
        console.warn(e);
      });
  }

  /* -------------------------------------------------------------- rendering */

  function logo() {
    var el = $('logo');
    if (!el) return;
    var img = '<img src="' + BASE + 'img/logo.png" width="150" height="150" alt="Quest">';
    el.innerHTML = el.dataset.home === 'false' ? img
                 : '<a href="' + BASE + 'index.html">' + img + '</a>';
  }

  function dock() {
    var el = $('dock');
    if (!el) return;
    el.innerHTML = '<ul>' + C.dock.map(function (d, n) {
      /* Alt+N is advertised in the tooltip because an undiscoverable
       * shortcut is the same as no shortcut. */
      var hint = n < 9 ? ' (Alt+' + (n + 1) + ')' : '';
      return '<li><a href="' + esc(resolve(d.href)) + '" title="' + esc(d.name) + hint + '">' +
        '<svg role="img" viewBox="0 0 24 24" class="' + (d.stroke ? 'icon-stroke' : '') + '" ' +
        'xmlns="http://www.w3.org/2000/svg"><title>' + esc(d.name) + '</title>' +
        '<path d="' + esc(d.path) + '"/></svg></a></li>';
    }).join('') + '</ul>';
  }

  function bookmarks() {
    var el = $('bookmarks');
    if (!el) return;
    el.innerHTML = '<h2 class="sr-only">Bookmarks</h2>' + C.bookmarks.map(function (group) {
      return '<ul>' + group.map(function (b) {
        /* Deliberately not loading="lazy": these are 16px icons, all of them
         * above the fold, and deferring them only delays the one thing you
         * look at first. */
        return '<li><a href="' + esc(b.href) + '">' +
          '<img class="favicon" alt="" width="16" height="16" ' +
          'src="' + BASE + 'img/icons/' + esc(b.icon) + '.png">' +
          esc(b.name) + '</a></li>';
      }).join('') + '</ul>';
    }).join('');
  }

  /* ----------------------------------------------------------------- search */

  function parseQuery(raw) {
    var q = raw.trim();
    var sp = q.indexOf(' ');
    /* A prefix only counts when something follows it, so "gh" on its own
     * still searches for the word rather than opening an empty GitHub page. */
    if (sp > 0) {
      var engine = C.search.bangs[q.slice(0, sp).toLowerCase()];
      if (engine) return { engine: engine, term: q.slice(sp + 1).trim() };
    }
    return { engine: C.search.default, term: q };
  }

  function search() {
    var form = $('search-form');
    if (!form) return;
    var input = $('search-query');
    var hint = $('search-engine');

    var update = function () {
      if (hint) hint.textContent = parseQuery(input.value).engine.name;
    };

    input.addEventListener('input', update);
    update();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = parseQuery(input.value);
      if (!p.term) return;
      window.open(p.engine.url + encodeURIComponent(p.term), '_blank', 'noopener');
      input.value = '';
      update();
    });

    return input;
  }

  /* -------------------------------------------------------------- shortcuts */

  function shortcuts(input) {
    document.addEventListener('keydown', function (e) {
      var active = document.activeElement || document.body;
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable;

      /* Alt+T, not plain "t" — every bare letter is taken by search focus. */
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key >= '1' && e.key <= '9') {
        var link = document.querySelectorAll('#dock a')[Number(e.key) - 1];
        if (link) { e.preventDefault(); window.location.href = link.href; }
        return;
      }

      if (e.key === 'Escape' && typing && input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.blur();
        return;
      }

      if (typing || !input) return;

      /* "/" is the convention; a bare printable key is the thing you
       * actually do by reflex on a start page. */
      if (e.key === '/' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        e.preventDefault();
        input.focus();
        if (e.key !== '/') input.value += e.key;
        input.dispatchEvent(new Event('input'));
      }
    });
  }

  /* ------------------------------------------------------------------- boot */

  function serviceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    navigator.serviceWorker.register(BASE + 'sw.js').catch(function (e) {
      console.warn('sw registration failed', e);
    });
  }

  theme();
  logo();
  dock();
  bookmarks();
  clock();
  weather();
  banner();
  shortcuts(search());
  serviceWorker();
})();
