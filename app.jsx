/* =============================================================================
   FIU OPERATIONS MAP — APP SHELL
   Top bar (brand + breadcrumbs + zoom controls), focused-node info panel,
   legend/hint, and the Tweaks panel (visual-direction switcher).
   ============================================================================= */

(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const { ZoomCanvas, walkPath } = window.FIUEngine;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
    "theme": "ledger",
    "grid": true,
    "calmMotion": false,
  } /*EDITMODE-END*/;

  function Icon({ d, ...p }) {
    return (
      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}>
        {d}
      </svg>
    );
  }
  const IconHome = <Icon d={<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>} />;
  const IconPlus = <Icon d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
  const IconMinus = <Icon d={<line x1="5" y1="12" x2="19" y2="12" />} />;
  const IconUp = <Icon d={<><polyline points="15 18 9 12 15 6" /></>} />;
  const IconX = <Icon d={<><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>} />;
  const IconZoom = <Icon d={<><circle cx="11" cy="11" r="7" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></>} />;

  function App() {
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
    const [focusPath, setFocusPath] = useState([]);
    const [selected, setSelected] = useState(null);     // {node, path}
    const apiRef = useRef(null);

    // apply theme + options
    useEffect(() => { document.documentElement.setAttribute("data-theme", t.theme); }, [t.theme]);
    useEffect(() => { document.body.setAttribute("data-grid", t.grid ? "on" : "off"); }, [t.grid]);
    useEffect(() => { document.documentElement.style.setProperty("--dur", t.calmMotion ? "1150ms" : "760ms"); }, [t.calmMotion]);

    const handleNode = useCallback((path, node) => {
      if (node.child) { setFocusPath(path); setSelected(null); }   // container → fly in
      else setSelected({ node, path });                            // leaf → inspect in place
    }, []);

    const goUp = useCallback(() => {
      setSelected(null);
      setFocusPath((p) => (p.length === 0 ? p : p.slice(0, -1)));
    }, []);

    const goTo = useCallback((i) => {
      // i = -1 means Home
      setSelected(null);
      setFocusPath(i < 0 ? [] : focusPath.slice(0, i + 1));
    }, [focusPath]);

    // keyboard
    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "Escape") { if (selected && !selected.node.child) setSelected(null); else goUp(); }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [goUp, selected]);

    const steps = walkPath(focusPath);
    const focusedNodeId = selected ? selected.node.id : null;
    const meta = window.FIU.meta;

    return (
      <div className="app">
        {/* ----------------------------- TOP BAR ----------------------------- */}
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">FI</div>
            <div className="brand-text">
              <div className="brand-title">{meta.title}</div>
              <div className="brand-sub">{meta.subtitle}</div>
            </div>
          </div>

          <nav className="crumbs">
            <button className={`crumb ${focusPath.length === 0 ? "is-current" : ""}`} onClick={() => goTo(-1)}>
              {IconHome}<span style={{ marginLeft: 6 }}>Map</span>
            </button>
            {steps.map((s, i) => (
              <React.Fragment key={s.node.id}>
                <span className="crumb-sep">›</span>
                <button className={`crumb ${i === steps.length - 1 ? "is-current" : ""}`} onClick={() => goTo(i)}>
                  {s.node.title}
                </button>
              </React.Fragment>
            ))}
          </nav>

          <div className="topbar-actions">
            <button className="tbtn" onClick={goUp} disabled={focusPath.length === 0} title="Zoom out (Esc)">
              {IconUp}<span>Out</span>
            </button>
            <button className="tbtn" onClick={() => apiRef.current && apiRef.current.zoomBy(0.74)} title="Zoom out">{IconMinus}</button>
            <button className="tbtn" onClick={() => apiRef.current && apiRef.current.zoomBy(1.35)} title="Zoom in">{IconPlus}</button>
            <button className="tbtn" onClick={() => goTo(-1)} title="Reset to full map">{IconHome}<span>Reset</span></button>
          </div>
        </header>

        {/* ----------------------------- CANVAS ------------------------------ */}
        <ZoomCanvas
          focusPath={focusPath}
          focusedNodeId={focusedNodeId}
          onNode={handleNode}
          onBackground={goUp}
          onZoomCommit={(path) => { setSelected(null); setFocusPath(path); }}
          registerApi={(api) => (apiRef.current = api)}
        />

        {/* ----------------------------- LEGEND ------------------------------ */}
        <div className="legend">
          <span className="li"><span className="sw spine" />Process</span>
          <span className="li"><span className="sw entry" />Funnel / page</span>
          <span className="li"><span className="sw system" />System</span>
          <span className="li"><span className="sw decision" />Decision</span>
          <span className="li"><span className="ln" />Main path</span>
          <span className="li"><span className="ln dash" />Branch</span>
        </div>

        {focusPath.length === 0 ? (
          <div className="hint">Click a <strong>⊕</strong> node to fly in · scroll to zoom · drag to pan · <kbd>Esc</kbd> to back out</div>
        ) : null}

        {/* --------------------------- INFO PANEL ---------------------------- */}
        <InfoPanel
          selected={selected}
          onClose={() => setSelected(null)}
          onZoomInto={(path) => setFocusPath(path)}
          isFocusedHere={selected && focusPath[focusPath.length - 1] === (selected && selected.node.id)}
        />

        {/* ----------------------------- TWEAKS ------------------------------ */}
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Visual direction" />
          <window.TweakSelect
            label="Theme"
            value={t.theme}
            options={[
              { value: "ledger", label: "Ledger — editorial premium" },
              { value: "console", label: "Console — SaaS product" },
              { value: "atlas", label: "Atlas — dark command center" },
            ]}
            onChange={(v) => setTweak("theme", v)}
          />
          <window.TweakSection label="Canvas" />
          <window.TweakToggle label="Dot grid" value={t.grid} onChange={(v) => setTweak("grid", v)} />
          <window.TweakToggle label="Calm motion" value={t.calmMotion} onChange={(v) => setTweak("calmMotion", v)} />
        </window.TweaksPanel>
      </div>
    );
  }

  function InfoPanel({ selected, onClose, onZoomInto, isFocusedHere }) {
    const node = selected && selected.node;
    const info = node && node.info;
    const open = !!(node && (info || node.url || node.ghl || node.tag || node.note || node.product || node.access || node.email || node.trigger));
    const pretty = (u) => u.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
    return (
      <aside className={`info ${open ? "is-open" : ""}`}>
        <button className="info-close" onClick={onClose} title="Close">{IconX}</button>
        {node ? (
          <div className="info-scroll">
            <div className="info-kind">{node.kind || "Node"}</div>
            <h3 className="info-title">{node.title}</h3>
            {info && info.meaning ? <p className="info-meaning">{info.meaning}</p> : null}

            {(node.url || node.ghl || node.tag || node.note) ? (
              <div className="link-block">
                {node.url ? (
                  <a className="link-row" href={node.url} target="_blank" rel="noreferrer">
                    <span className="lr-k">Public URL</span>
                    <span className="lr-v">{pretty(node.url)}</span>
                  </a>
                ) : null}
                {node.ghl ? (
                  <a className="link-row ghl" href={node.ghl} target="_blank" rel="noreferrer">
                    <span className="lr-k">GHL preview</span>
                    <span className="lr-v">Open in GoHighLevel ↗</span>
                  </a>
                ) : null}
                {node.tag ? (
                  <div className="tag-chip"><span className="tag-dot" />{node.tag}</div>
                ) : null}
                {node.note ? <div className="note-row">{node.note}</div> : null}
              </div>
            ) : null}

            {(node.product || node.trigger || node.access || node.email) ? (
              <div className="spec-block">
                {node.product ? (<div className="spec-row"><span className="sr-k">Product</span><span className="sr-v">{node.product}</span></div>) : null}
                {node.trigger ? (<div className="spec-row"><span className="sr-k">Trigger</span><span className="sr-v mono">{node.trigger}</span></div>) : null}
                {node.access ? (<div className="spec-row"><span className="sr-k">Access</span><span className="sr-v">{node.access}</span></div>) : null}
                {node.email ? (<div className="spec-row"><span className="sr-k">Email</span><span className="sr-v">{node.email}</span></div>) : null}
              </div>
            ) : null}

            {info && info.front && info.front.length ? (
              <React.Fragment>
                <h4>Front end</h4>
                <ul>{info.front.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </React.Fragment>
            ) : null}

            {info && info.back && info.back.length ? (
              <React.Fragment>
                <h4>Back end</h4>
                <ul>{info.back.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </React.Fragment>
            ) : null}

            {node.child && !isFocusedHere ? (
              <button className="info-zoom" onClick={() => onZoomInto(selected.path)}>
                {IconZoom}<span>Zoom into {node.title}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </aside>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
