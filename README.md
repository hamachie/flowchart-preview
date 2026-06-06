# FIU Operations Map

An interactive **infinite-zoom flowchart** of the Financial Increase operations system — funnels, products, automations, tags, and access rules. Click (or scroll-zoom into) any **⊕** node to fly inside it and reveal the sub-flow; keep zooming to drill deeper. Breadcrumbs, **Out**, or **Esc** fly you back up.

## Review it locally — quickest way

Open **`FIU Operations Map (standalone).html`** directly in any browser (double-click it). It's a single self-contained file with everything inlined — no server, no internet needed.

## Run the source version

The source is split for easy editing. Because browsers block `file://` module/CDN loads inconsistently, serve the folder over a tiny local server:

```bash
# from the repo folder
python3 -m http.server 8000
# then open http://localhost:8000/FIU%20Operations%20Map.html
```

## Files

| File | Purpose |
|------|---------|
| `FIU Operations Map.html` | Entry point — loads the scripts below |
| `scene-data.js` | **All the data.** The nested map: every node, edge, tag, URL, access rule, and email sequence. Edit this to update content. |
| `zoom-engine.jsx` | The infinite-zoom camera engine (pan/zoom, semantic-zoom crossfade, auto-drill) |
| `app.jsx` | App shell — top bar, breadcrumbs, info panel, theme switching |
| `themes.css` | Three visual directions (Ledger / Console / Atlas) + all layout |
| `tweaks-panel.jsx` | The in-page Tweaks panel (theme + canvas options) |
| `FIU Operations Map (standalone).html` | Single-file bundle for sharing / offline review |

## Editing the data

Everything lives in `scene-data.js`. Each **scene** has `nodes` and `edges`; any node with a `child:` key zooms into another scene. To add a page, tweak a tag, or fix a URL, edit the relevant node's fields (`title`, `sub`, `tag`, `url`, `info.front`, `info.back`) and re-open the page. After editing source, regenerate the standalone bundle if you need a fresh single-file copy.

## Still TODO (data gaps)

- FIU LIVE Home Page URL (placeholder)
- A few missing GHL preview links (Velocity thank-you/calendar, Affiliate dashboard, some Trusted Advisor categories)
- Confirm whether **"FIU LIVE (Active)"** (solo) and **"Upsell to FIU LIVE (Active)"** are one shared tag or two
