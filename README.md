# Thinkers & Methods

A static, dependency-free reference site with two tables:

1. **Thinkers on technology, media and literacy** — 91 authors, with dates, fields, key works,
   what each work argues, the author's view of technology, and a theoretical placement
   (determinist · soft/medium theory · social shaping · other/mixed).
2. **Organizational research methods** — 67 sources, with what each argues and what it
   contributed to field research. It covers the reading list of a doctoral field-methods
   seminar: method texts, editorial statements, and the published papers assigned as exemplars.
3. **Concepts, theories and models** — 20 entries: what each claims, who made it and when,
   how it was coined, what to read, a plain example, what it has to do with technology and
   emerging media, and the standing objections.
4. **Network of thinkers** — a force-directed map of table 1, described below.

The tables live on separate tabs rather than one long scrolling page. A nav bar at the top
switches between them — the active table is the one filled in gold — and each table ends with
two buttons, one back to the top and one across to the other table, so neither end of a long
table is a dead end. Each tab has its own search box and sort controls, and the thinkers table
can also be filtered by theoretical camp.

`#thinkers` and `#methods` are shareable links straight to a table.

Each table is a scroll pane rather than a full-page list: it scrolls inside its own card, in
both directions, with the column headers pinned to the top of that card, so the columns stay
labelled however far down you read.

Contact: **chivu@bu.edu**, linked at the foot of the page.

## The passphrase gate

The page asks for a passphrase before showing anything (`assets/js/gate.js`). Only a salted
SHA-256 digest is stored, so the passphrase is not recoverable from the source; entry is
checked with Web Crypto, falling back to a local SHA-256 so the page still works opened from
`file://`. "Remember me" writes the digest to `localStorage`, otherwise it lasts the session.

**This is a doorway, not a lock.** Every file in this repository is public at a fixed URL, so
anyone who requests `assets/js/data-thinkers.js` directly receives it without seeing the
prompt, and the repository itself is readable on GitHub. It keeps casual visitors out of the
page. It does not make the content private. If the content must actually be private, the
options are a private repository with a host that authenticates (Netlify, Cloudflare Access,
a university web space behind SSO), or encrypting the data files so that the passphrase
decrypts them in the browser — which means the ciphertext, not the tables, is what is served.

To change the passphrase, replace the digest in `gate.js` with the output of:

```sh
printf '%s' 'tm-gate-v1:YOUR NEW PASSPHRASE' | shasum -a 256
```

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

Text never sits on coral in white (that pairing fails contrast at 2.5:1); coral and gold
carry black text, at 8.5:1 and 11.7:1.

## Layout

```
index.html                    page shell, tabs and table headers
assets/css/styles.css         all styling
assets/js/links.js            Wikipedia / Google Books link helpers
assets/js/data-thinkers.js    table 1 data
assets/js/data-methods.js     table 2 data
assets/js/data-concepts.js    table 3 data
assets/js/app.js              tabs, search, filtering, sorting, rendering
assets/js/network.js          the network tab: graph derivation and force layout
```

## The network tab

No edge list is stored anywhere. The graph is derived from table 1 at load time, three ways:

| Link | Drawn when | Shown as |
| --- | --- | --- |
| Named in the prose | one entry's `a`, `v` or `cn` text contains another thinker's surname | coral |
| Shared placement | two entries carry the same `cl` label (groups of 2–6) | black |
| Shared discipline | two entries share a keyword in `f` (groups of 2–6) | grey |

Because the first kind is read out of the text, clicking a node can quote the sentence that
asserts each connection — every link is answerable to the table. Adding a thinker who mentions
others therefore rewires the map without anyone editing a graph. Surnames too common to match
safely (White, Large, Hall, Li and others) are in a stop list in `network.js`; groups larger
than six are skipped so that a broad label like "philosophy" does not produce a hairball.

`buildGraph` is exposed as `window.__netGraph` so the derivation can be checked without a
browser.

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
| `v` | view of technology and media — empty for figures who took no position |
| `c` | camp code: `det`, `soft`, `soc`, `oth` — drives the filter buttons and tag colour; empty alongside an empty `v`, in which case no tag is drawn and the entry appears only under All |

The methods table uses one further code, `m5`, for craft-and-writing sources; it has no filter
button, only a tag style.
| `cl` | camp label shown on the tag |
| `cn` | note on the theoretical placement |

A methods entry (`assets/js/data-methods.js`) uses the same keys, except `ky` for the key-work
year used in sorting and `r` for the contribution to organizational research; it has no `cn`.

## Checking the data

Dates and links are verifiable against Wikipedia rather than taken on trust. Every `W(...)`
link resolves to a real, non-disambiguation article, and every birth and death year that a
Wikipedia-linked entry shows was compared against Wikidata (`P569`/`P570`) — worth re-running
after any edit, and periodically, since death dates change:

```sh
# titles that no longer resolve, or that now land on a disambiguation page
# https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&redirects=1&titles=A|B|C
# birth/death years for the same entries
# https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=Q1|Q2
```

Entries whose dates are not recorded show *dates not established* rather than a guess, and
`sy` (the chronological sort key) is `null` for them, with `ay` giving the year of the
principal work so they still sort somewhere sensible.

## Notes on the content

- Names link to Wikipedia where an article exists and otherwise to a search; titles link to Google Books.
- Pronunciations are approximate for names with contested or regional readings.
- Entries marked "dates not established" are living or lesser-documented authors.
- Theoretical placements are interpretive summaries, not the authors' self-descriptions.
