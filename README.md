# Rabbit Hole

**Follow a thought. Find another world.**

A local-first visual research workspace for people who enjoy following an interesting question somewhere unexpected. Explore a graph, inspect where its connections come from, collect observations and keep a portable record of your journey.

## What works

- **Live discovery:** search Wikipedia, open introductory extracts, and expand up to eight related articles at a time.
- **Two graph views:** focused neighbourhoods and a deterministic force-layout atlas, with pan and zoom.
- **Connection provenance:** distinguish editorial associations from links found in a source article. Live notes retain retrieval times and revision IDs.
- **Pathfinding:** breadth-first search finds a shortest route across loaded connections, traversed in either direction.
- **Research notebook:** create and edit observations attached to ideas and their source links.
- **Persistent workspaces:** the loaded graph, annotations and current path survive browser reloads.
- **Saved trails:** name a path, revisit it and export it as Markdown.
- **Portable data:** import and export versioned JSON workspaces. Imports validate input and merge without overwriting existing ideas or notes.
- **Shareable routes:** a URL fragment carries topic titles, never private annotations.
- **Resilient starter map:** 29 original introductory notes across six starting questions remain available when live search is unavailable.
- **Accessible controls:** keyboard-operable graph nodes, native dialogs, focus indicators and reduced-motion support. `/` focuses search; `s` opens Save trail.

## Run locally

No installation or build step is needed. Serve `dist/` over HTTP rather than opening `index.html` as a file:

```sh
python3 -m http.server 8080 --directory dist
```

Then visit `http://localhost:8080`.

Node.js 22 or later is needed only for the automated checks:

```sh
npm run check
npm test
```

## Architecture

| Module | Responsibility |
| --- | --- |
| `dist/app.js` | UI composition, graph interactions, navigation and workflow orchestration |
| `dist/engine.js` | Graph layout, pathfinding, lexical relevance ranking and import validation |
| `dist/api.js` | Wikipedia requests, timeouts, cancellation, in-memory caching, redirects and source extraction |
| `dist/storage.js` | Browser persistence with graceful failures |
| `dist/core.js` | Trail encoding, search, URL validation and exports |
| `dist/data.js` | Original starter notes, thematic links and category colours |
| `dist/style.css` | Responsive interface and reduced-motion treatment |
| `tests/` | Node's built-in test runner; no test dependencies |

This is a functional client-side v1. It does not have an AI inference backend, multi-user collaboration, cross-device cloud sync, or a crawler. Its intelligence is transparent graph traversal and lexical ranking over real article links. It does not invent a semantic or causal relationship between two topics.

## How expansion works

1. Fetch the current article's intro, revision ID and up to 500 main-namespace links.
2. Filter navigation and index titles.
3. Rank candidate titles against the article's text using token overlap.
4. Fetch extracts for the leading candidates, resolve redirects and exclude disambiguation pages.
5. Rank again with the available text and attach up to eight article-linked neighbours.

Alphabetical API limits and lexical ranking can miss useful connections. Repeated expansion is idempotent; expand a neighbouring article to continue outward. A connection is a reading route, not an evidence-backed assertion of causation. The source panel distinguishes original editorial notes from retrieved extracts.

## Data and privacy

The app stores the workspace and saved trails in local storage. Clearing browser data removes them. Export JSON to keep a portable copy. Workspace exports may include your personal observations; review before sharing.

Search queries and requested article titles go directly to Wikipedia. No API key is needed. Interface fonts are requested from Google Fonts. The app contains no analytics or account system. Hosting and external services can process normal HTTP request information. Shared links disclose their topic titles.

Imports are limited to 2 MB, 180 ideas, 1,600 edges and 300 observations. The atlas renders up to 80 ideas, prioritising the selected idea and highlighted route; all loaded ideas remain searchable and eligible for pathfinding. Current trails have 40 stops and up to 50 named trails can be saved. Invalid source URLs are rejected, and all user/source text is inserted through text nodes rather than executable HTML.

## Attribution

Live article excerpts are by Wikipedia contributors under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Every live note includes its article link, with a revision permalink in the provenance panel when available. Exported excerpts preserve source attribution. Wikipedia is an encyclopedia entry point, not a substitute for checking underlying references.

Starter notes and UI artwork are original. The Moon starter links to [NASA's Moon overview](https://science.nasa.gov/moon/). No stock images are required.

## Deployment

Any static host can serve `dist/`. A private preview is configured through `.openai/hosting.json`. GitHub Actions runs syntax and unit checks; it does not publish your repository or enable GitHub Pages automatically.

## Further development

Natural extensions include richer multi-source retrieval, a server-side synthesis service with citation validation, account-based sync, a Web Worker layout for larger graphs and full end-to-end regression automation. These are future capabilities, not claims about the current release.
