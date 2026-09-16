# Thinkers & Methods

A static, dependency-free reference site with two tables:

1. **Thinkers on technology, media and literacy** — 81 authors, with dates, fields, key works,
   what each work argues, the author's view of technology, and a theoretical placement
   (determinist · soft/medium theory · social shaping · other/mixed).
2. **Organizational research methods** — 29 sources, with what each argues and what it
   contributed to field research.

The two tables live on separate tabs rather than one long scrolling page. A nav bar at the top
switches between them — the active table is the one filled in gold — and each table ends with
two buttons, one back to the top and one across to the other table, so neither end of a long
table is a dead end. Each tab has its own search box and sort controls, and the thinkers table
can also be filtered by theoretical camp.

`#thinkers` and `#methods` are shareable links straight to a table.

## Viewing it locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publishing on GitHub Pages

```sh
git push -u origin main
```

Then in the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch `main`, folder `/ (root)`. The site appears at `https://<you>.github.io/thinkers/`.

If the repository was renamed, GitHub redirects the old URL, so pushing keeps working —
but the remote can be pointed at the new name:

```sh
git remote set-url origin https://github.com/<you>/thinkers.git
```

`.nojekyll` is included so GitHub Pages serves the files as-is instead of running Jekyll over them.

## Design

Four colours and one typeface:

| token | value | used for |
| --- | --- | --- |
| `--coral` | `#ff805e` | accents: link underlines, rules, hover washes, the *social shaping* tag |
| `--gold` | `#f2b90f` | the *soft / medium theory* tag, search highlights, uncertain dates |
| `--black` | `#000000` | text, borders, selected controls, the *determinist* tag |
| `--white` | `#ffffff` | the nav bar, the table card, and the *other / mixed* tag |

The page itself is gold at 14% over white (`--bg`, a warm cream); the table sits on it as a
white card with a black rule and a coral drop shadow, and the footer inverts to black with
gold headings. Every block — nav bar, controls, table, bottom buttons — shares one column
edge set by `--page-w`.

Type is Times New Roman throughout, set at 11pt on the root element — every other size in the
stylesheet is a multiple of that, so changing `html { font-size }` in
`assets/css/styles.css` rescales the whole page. Interface labels are separated from the
prose by capitals and letter-spacing rather than by a second typeface.

The nav bar's sticky height is measured at runtime, so the table's column headers park directly
beneath it however the tabs wrap.

Text never sits on coral in white (that pairing fails contrast at 2.5:1); coral and gold
carry black text, at 8.5:1 and 11.7:1.

## Layout

```
index.html                    page shell, tabs and table headers
assets/css/styles.css         all styling
assets/js/links.js            Wikipedia / Google Books link helpers
assets/js/data-thinkers.js    table 1 data
assets/js/data-methods.js     table 2 data
assets/js/app.js              tabs, search, filtering, sorting, rendering
```

## Editing the content

Both datasets are plain JavaScript arrays of objects — no build step, no dependencies.
Edit the data file, reload the page.

A thinkers entry (`assets/js/data-thinkers.js`):

| key | meaning |
| --- | --- |
| `n` | name |
| `sy` | birth year used for chronological sorting (`null` if unknown) |
| `ay` | year of principal work, used to order entries whose birth year is unknown |
| `p` | IPA pronunciation |
| `u` | link for the name — `W("Wikipedia_Title")` or `G("search terms")` |
| `y` | displayed dates |
| `f` | fields |
| `w` | key works, each `["Title", "Year", link]` |
| `a` | what the work argues |
| `v` | view of technology and media |
| `c` | camp code: `det`, `soft`, `soc`, `oth` — drives the filter buttons and tag colour |
| `cl` | camp label shown on the tag |
| `cn` | note on the theoretical placement |

A methods entry (`assets/js/data-methods.js`) uses the same keys, except `ky` for the key-work
year used in sorting and `r` for the contribution to organizational research; it has no `cn`.

## Notes on the content

- Names link to Wikipedia where an article exists and otherwise to a search; titles link to Google Books.
- Pronunciations are approximate for names with contested or regional readings.
- Entries marked "dates not established" are living or lesser-documented authors.
- Theoretical placements are interpretive summaries, not the authors' self-descriptions.
