# Quest — start page

My daily start page. Static, no build step, served by GitHub Pages at
<https://jnmarcellus.github.io>.

## Editing

Almost everything you'd want to change lives in **`js/config.js`** — the dock
icons, the bookmark columns, the search engines, and the OpenWeather city id.
Every page renders from that one object, so a link added there shows up on
`index.html`, `map.html` and the blog at once.

A dock or bookmark `href` of `~/foo.html` means "relative to the site root" and
is resolved against `window.BASE`, which each page sets in its `<head>`. That's
what lets `/blog/2.html` and `/` share the same link list.

## Search shortcuts

Type a prefix and a space to pick an engine; anything else goes to Perplexity.

| prefix | engine | prefix | engine |
|---|---|---|---|
| `g` | Google | `hn` | Hacker News |
| `d` | DuckDuckGo | `r` | Reddit |
| `y` | YouTube | `w` | Wikipedia |
| `gh` | GitHub | `m` | Google Maps |
| `a` | Amazon | `c` | Claude |

The active engine is shown at the right edge of the search box as you type.

## Keyboard

| key | action |
|---|---|
| any letter, or `/` | focus search |
| `Esc` | clear and unfocus search |
| `Alt`+`1`–`9` | open the nth dock item |

## Layout

    index.html          start page
    map.html            NEXRAD radar, wraps map-raw.html in an iframe
    map-raw.html        the bare Leaflet map
    blog.html           post index
    blog/1..3.html      posts
    js/config.js        links, engines, weather city  <- edit this
    js/app.js           renders every page, widgets, shortcuts
    sw.js               offline shell
    css/main.css        imports reset / vars / animations / styles

## Notes

The OpenWeather key in `js/config.js` is public and unavoidably so — a static
site cannot hide a client-side credential. If it starts getting rate-limited,
rotate it at openweathermap.org rather than trying to hide it.

**Bump `CACHE` in `sw.js` when you change any file in `SHELL`.** The service
worker serves CSS/JS cache-first; without a version bump a returning visitor can
sit on the old build. Pages themselves are network-first, so HTML edits land on
the next load either way.

Forked from Tressley, who did a great job.
