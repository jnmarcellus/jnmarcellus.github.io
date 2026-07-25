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

Type a prefix and a space to pick an engine; **anything else goes to
DuckDuckGo**.

| prefix | engine | prefix | engine |
|---|---|---|---|
| `g` | Google | `hn` | Hacker News |
| `d` | DuckDuckGo | `r` | Reddit |
| `p` | Perplexity | `w` | Wikipedia |
| `y` | YouTube | `m` | Google Maps |
| `gh` | GitHub | `c` | Claude |
| `a` | Amazon | | |

`d` duplicates the default on purpose: without it, `d cats` would search for
the literal string "d cats" instead of stripping the prefix.

The active engine is shown at the right edge of the search box on desktop, and
just under it on mobile, where taking 112px out of a 288px field to name the
engine was not a good trade. The placeholder's prefix list is generated from
the table above, so adding a bang advertises itself.

## Keyboard

| key | action |
|---|---|
| any letter, or `/` | focus search |
| `Esc` | clear and unfocus search |
| `Alt`+`1`–`9` | open the nth dock item |
| `Alt`+`T` | toggle dark/light (also the button, bottom right) |

## Layout and breakpoints

One breakpoint, 48em. Everything outside a media query is the small-screen
layout; `min-width: 48em` widens it and `max-width: 47.99em` carries the
mobile-only overrides.

**The mobile block must stay last in `styles.css`.** It shares specificity
with the base rules it overrides, so source order is the only thing making it
win — it was originally placed mid-file and `.iframe-container`'s desktop
height silently beat it.

On mobile all twelve bookmarks share **one** grid — `#bookmarks` becomes the
grid and the three `<ul>` get `display: contents` so their `<li>` become items
of it directly. Three separate grids cannot align to each other: sized to
their own content the groups came out 275 / 218 / 314px wide, and forced to a
common width they pinned column two to a hard 50%, so the gutter swung from
21px to 136px row by row. One grid gives every icon and label the same two
tracks.

Tap targets
are floored at 44px, the search field reclaims the engine-name gutter, the
header drops to 0.8125rem, and the hi/lo is hidden. A second query at 23em
drops the weather description for 320px phones, where it ran the line to a
third row; the icon already says the same thing.

**The theme toggle is fixed, and `#traichu` carries `padding-bottom: 4.5rem`
to keep content out from under it.** Both halves matter. Fixed with no padding
put the button on top of the last bookmark row — The Guardian and Mwmbl Search
could not be tapped. Making it static fixed that and created a worse bug: on a
3400px article the control ended up at the very bottom. It also needs an opaque
`--surface-color` background, because it floats over article text and
`--primary-background-color` is translucent in light mode.

`autofocus` is not in the markup. `app.js` takes focus only under
`(pointer: fine)`, so a phone does not open with the keyboard covering half
the page.

## Hacker News banner

`.banner` is a **fixed** 3.5rem, not a min-height, and `app.js` shrinks the
headline from 16px down to a 10px floor until it fits. Headlines run from four
words to well over a hundred characters; letting the box follow the text made
everything below it jump every six seconds as the banner rotated.

Verified stable from 1 to 156 characters at both 375px and 1280px: banner
height, dock position and page height do not move, and nothing is clipped.
Rotation pauses on hover, and a resize re-fits the headline currently shown.

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

## Weather icons

`img/weather/` holds the 18 condition codes OpenWeather documents (`01`–`04`,
`09`, `10`, `11`, `13`, `50`, each `d` and `n`), at their native 50×50 — which
is 2× the 24px slot they render into. They remain OpenWeather's artwork, used
alongside their API.

`app.js` only emits the `<img>` for a code matching that set. While the icons
were hotlinked, an undocumented code still rendered something; now it would
404, so an unrecognised code drops the icon and keeps the text.

Six day/night pairs are byte-identical (`03`, `04`, `09`, `11`, `13`, `50` have
no sun or moon in them). All 18 are kept anyway so the code stays a direct
`code → file` mapping with no lookup table, which costs about 6 KB.

## Third-party requests

Two, both JSON APIs, both the point: `api.openweathermap.org` and
`hacker-news.firebaseio.com`. Everything else — fonts, favicons, weather
glyphs, the logo — is served from this origin. The service worker caches
nothing cross-origin: a stale forecast is worse than no forecast.

The exception is `map-raw.html`, which fetches map tiles from OpenStreetMap and
radar imagery from Iowa State. Those are the data; there is nothing to vendor.
It is an iframe on `map.html` only, so the start page itself is unaffected.

## Vendored Leaflet

`vendor/leaflet/` holds Leaflet 1.9.4 (BSD-2-Clause, `LICENSE` alongside it),
byte-identical to the unpkg build it replaced — checked against the SRI hashes
that used to be pinned in `map-raw.html`. Those attributes are gone now: SRI is
for resources you don't control, and `crossorigin` on a same-origin fetch
breaks it.

`leaflet.css` and `leaflet.js` are precached. The PNGs in
`vendor/leaflet/images/` are not — nothing on the map places a marker or a
layers control, so they'd be weight for glyphs that are never requested. They
are same-origin, so the cache-first branch picks them up if that changes.

To upgrade, replace all eight files from the same release together; the CSS
resolves `images/` relative to itself.

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
    img/weather/        OpenWeather condition icons
    vendor/leaflet/     Leaflet 1.9.4 + BSD licence

## Notes

The OpenWeather key in `js/config.js` is public and unavoidably so — a static
site cannot hide a client-side credential. If it starts getting rate-limited,
rotate it at openweathermap.org rather than trying to hide it.

**Bump `CACHE` in `sw.js` when you change any file in `SHELL`.** The service
worker serves CSS/JS cache-first; without a version bump a returning visitor can
sit on the old build. Pages themselves are network-first, so HTML edits land on
the next load either way.

Forked from Tressley, who did a great job.
