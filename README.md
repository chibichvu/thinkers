# Thinkers & Methods

A static, dependency-free reference site with two tables:

1. **Thinkers on technology, media and literacy** — 81 authors, with dates, fields, key works,
   what each work argues, the author's view of technology, and a theoretical placement
   (determinist · soft/medium theory · social shaping · other/mixed).
2. **Organizational research methods** — 29 sources, with what each argues and what it
   contributed to field research.

The two tables live on separate tabs rather than one long scrolling page. Each tab has its own
search box and sort controls, and the thinkers table can also be filtered by theoretical camp.

## Viewing it locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publishing on GitHub Pages

```sh
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

Then in the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch `main`, folder `/ (root)`. The site appears at `https://<you>.github.io/<repo>/`.

`.nojekyll` is included so GitHub Pages serves the files as-is instead of running Jekyll over them.

## Layout

```
index.html                    page shell, tabs and table headers
assets/css/styles.css         all styling
assets/js/links.js            Wikipedia / Google Books link helpers
assets/js/data-thinkers.js    table 1 data
assets/js/data-methods.js     table 2 data
assets/js/app.js              tabs, search, filtering, sorting, rendering
legacy/                       the original single-file version, kept for reference
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
