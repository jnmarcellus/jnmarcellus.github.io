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
| `Alt`+`T` | toggle dark/light (also the button, bottom right) |

## Theming

Three states, not two: no stored choice means **follow the OS**, and the page
keeps tracking it live. Clicking the toggle stores an explicit `theme` in
localStorage that overrides the OS from then on. To go back to following the
OS, clear it from the console:

```js
localStorage.removeItem('theme'); location.reload();
```

Every theme-dependent value is a `--dark-*` / `--light-*` pair in
`css/vars.css`, mapped onto `--primary-*` names by the three blocks below it.
Add themed values there — **never** as a new `prefers-color-scheme` query in
`styles.css`, because a media query ignores the manual override and you get a
half-switched page.

## Bookmark favicons

Self-hosted in `img/icons/` as 32×32 PNGs. Previously hotlinked from
`icons.duckduckgo.com`, which cost 18 third-party requests per load and told
DDG the whole bookmark list every time. To add one:

```bash
curl -so /tmp/i "https://icons.duckduckgo.com/ip3/example.com.ico"
python -c "from PIL import Image; im=Image.open('/tmp/i').convert('RGBA'); im.thumbnail((32,32)); im.save('img/icons/example.com.png',optimize=True)"
```

Then set `"icon": "example.com"` in `js/config.js` and add the path to `SHELL`
in `sw.js`. Note DuckDuckGo returns a generic placeholder with a **404** status
for domains it doesn't know — check the status, not just that you got an image.

## Fonts

Fira Code is self-hosted in `fonts/` (SIL OFL 1.1, `fonts/OFL.txt`) — Google's
own v27 variable subsets, latin and latin-ext, declared in `css/fonts.css`.
Each page preloads the latin file, which needs `crossorigin` even though it is
same-origin: font fetches are CORS-mode, and without it the preload is
discarded and the font is fetched twice.

Cyrillic, Greek and box-drawing subsets are deliberately not carried; text in
those scripts falls back to the next family in `--font-monospace`.

The only remaining third-party requests are the OpenWeather API and the Hacker
News API, both of which are the point.

## Layout

    index.html          start page
    map.html            NEXRAD radar, wraps map-raw.html in an iframe
    map-raw.html        the bare Leaflet map
    blog.html           post index
    blog/1..3.html      posts
    js/config.js        links, engines, weather city  <- edit this
    js/app.js           renders every page, widgets, shortcuts
    sw.js               offline shell
    css/main.css        imports reset / fonts / vars / animations / styles
    css/fonts.css       @font-face for the self-hosted Fira Code
    fonts/              woff2 subsets + OFL licence
    img/icons/          bookmark favicons

## Notes

The OpenWeather key in `js/config.js` is public and unavoidably so — a static
site cannot hide a client-side credential. If it starts getting rate-limited,
rotate it at openweathermap.org rather than trying to hide it.

**Bump `CACHE` in `sw.js` when you change any file in `SHELL`.** The service
worker serves CSS/JS cache-first; without a version bump a returning visitor can
sit on the old build. Pages themselves are network-first, so HTML edits land on
the next load either way.

Forked from Tressley, who did a great job.
