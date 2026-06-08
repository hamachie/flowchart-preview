/* =============================================================================
   FIU OPERATIONS MAP — INFINITE-ZOOM ENGINE
   -----------------------------------------------------------------------------
   A zoomable-user-interface (ZUI). The whole map lives in one "world" that is
   translated + scaled by a single camera transform. Sub-flows are nested inside
   their parent nodes in world space, so flying the camera into a node naturally
   reveals the diagram living inside it (true semantic / "infinite" zoom).

   Layer visibility is a pure function of on-screen scale: a scene fades in only
   when the camera has zoomed enough for it to be readable, and fades out once
   its children take over. That single rule makes both click-to-zoom and free
   wheel-zoom feel coherent.
   ============================================================================= */

(function () {
  const { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } = React;

  const SC = (id) => window.FIU.scenes[id];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  // ---- semantic visibility -------------------------------------------------
  // A layer is most visible when the camera scale is near the scale that FITS
  // that scene in the viewport (r = cameraScale / sceneFitScale ≈ 1). It fades
  // out below (too far) and above (children take over). Being viewport- and
  // size-aware, this works for tall, wide, big, and small scenes alike.
  function visR(r) {
    const L = Math.log2(Math.max(r, 1e-4));
    const lo = smoothstep(-1.7, -0.55, L);
    const hi = 1 - smoothstep(0.6, 1.9, L);
    return clamp(Math.min(lo, hi), 0, 1);
  }

  // ---- how a child scene is placed inside a parent node --------------------
  // A FIXED nesting factor keeps cumulative transforms modest at depth (so the
  // camera never needs an extreme scale that browsers mis-render). The child
  // scene is centered on the node and is free to overflow it — at the overview
  // zoom it is fully transparent, so the overflow is never seen.
  const NEST = 0.3;
  function placement(node, childScene) {
    const f = NEST;
    const ox = (node.w - f * childScene.w) / 2;
    const oy = (node.h - f * childScene.h) / 2;
    return { f, ox, oy };
  }

  // ---- walk a focus path -> [{sceneId, scene, node}] ------------------------
  function walkPath(path) {
    const steps = [];
    let sceneId = window.FIU.meta.rootScene;
    for (let i = 0; i < path.length; i++) {
      const scene = SC(sceneId);
      const node = scene.nodes.find((n) => n.id === path[i]);
      if (!node) break;
      steps.push({ sceneId, scene, node });
      if (node.child) sceneId = node.child;
      else break;
    }
    return steps;
  }

  // ---- world transform of the ACTIVE scene (the one focusPath points into) --
  // focusPath only ever holds container nodes, so it is fully consumed here.
  function activeTransform(path) {
    let T = { ox: 0, oy: 0, s: 1 };
    let sceneId = window.FIU.meta.rootScene;
    for (const id of path) {
      const scene = SC(sceneId);
      const node = scene.nodes.find((n) => n.id === id);
      if (!node || !node.child) break;
      const cs = SC(node.child);
      const pl = placement(node, cs);
      T = { ox: T.ox + T.s * (node.x + pl.ox), oy: T.oy + T.s * (node.y + pl.oy), s: T.s * pl.f };
      sceneId = node.child;
    }
    return { T, sceneId };
  }

  // ---- the world rect a focus path should fit the camera to -----------------
  // ---- the tight content box of a scene (node bbox + margin) so the camera
  //      frames the actual diagram, not the empty scene padding ---------------
  function contentRect(scene) {
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const n of scene.nodes) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h);
    }
    const w = maxX - minX, h = maxY - minY;
    const mx = w * 0.06, my = h * 0.16;   // extra top/bottom room for the caption
    return { x: minX - mx, y: minY - my, w: w + mx * 2, h: h + my * 2 };
  }

  function targetRect(path) {
    let T = { ox: 0, oy: 0, s: 1 };
    let sceneId = window.FIU.meta.rootScene;
    if (path.length === 0) {
      const cr = contentRect(SC(sceneId));
      return { x: cr.x, y: cr.y, w: cr.w, h: cr.h };
    }
    for (let i = 0; i < path.length; i++) {
      const scene = SC(sceneId);
      const node = scene.nodes.find((n) => n.id === path[i]);
      const isLast = i === path.length - 1;
      const rect = { x: T.ox + T.s * node.x, y: T.oy + T.s * node.y, w: T.s * node.w, h: T.s * node.h };
      if (isLast) {
        if (node.child) {
          const cs = SC(node.child);
          const pl = placement(node, cs);
          const cT = { ox: T.ox + T.s * (node.x + pl.ox), oy: T.oy + T.s * (node.y + pl.oy), s: T.s * pl.f };
          const cr = contentRect(cs);
          return { x: cT.ox + cT.s * cr.x, y: cT.oy + cT.s * cr.y, w: cT.s * cr.w, h: cT.s * cr.h };
        }
        return rect;
      }
      const cs = SC(node.child);
      const pl = placement(node, cs);
      T = { ox: T.ox + T.s * (node.x + pl.ox), oy: T.oy + T.s * (node.y + pl.oy), s: T.s * pl.f };
      sceneId = node.child;
    }
  }

  function fitCamera(rect, vw, vh, padFrac) {
    const s = Math.min(vw / rect.w, vh / rect.h) * padFrac;
    return {
      scale: s,
      tx: vw / 2 - s * (rect.x + rect.w / 2),
      ty: vh / 2 - s * (rect.y + rect.h / 2),
    };
  }

  // ---- geometry for connectors ----------------------------------------------
  // An anchor sits on one side of a node. `t` is a 0..1 position ALONG that side
  // (0 = top/left edge, 1 = bottom/right edge). Default 0.5 = side midpoint.
  // When multiple edges share a node side, we spread their t-values so each
  // arrow gets its own exit/entry point instead of stacking on the midpoint.
  function anchor(node, side, t = 0.5) {
    const tt = Math.max(0.12, Math.min(0.88, t)); // keep anchors inside rounded corners
    if (side === "left")  return { x: node.x,            y: node.y + node.h * tt };
    if (side === "right") return { x: node.x + node.w,   y: node.y + node.h * tt };
    if (side === "top")   return { x: node.x + node.w * tt, y: node.y };
    return                       { x: node.x + node.w * tt, y: node.y + node.h };
  }

  // Pick the best pair of sides (fromSide, toSide) given the relative position
  // of two boxes. If they are roughly the same column, use top/bottom. If they
  // are roughly the same row, use left/right. Otherwise pick whichever axis
  // separation is larger so the arrow flows the natural direction.
  function pickSides(a, b) {
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const dx = bx - ax, dy = by - ay;
    if (Math.abs(dx) < 60) {
      return dy >= 0 ? { from: "bottom", to: "top" } : { from: "top", to: "bottom" };
    }
    if (Math.abs(dy) < 40) {
      return dx >= 0 ? { from: "right", to: "left" } : { from: "left", to: "right" };
    }
    // mixed: pick by dominant axis
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? { from: "right", to: "left" } : { from: "left", to: "right" };
    }
    return dy >= 0 ? { from: "bottom", to: "top" } : { from: "top", to: "bottom" };
  }

  // Build a lookup of "how do I spread N edges on this node-side?". For each
  // (nodeId, side, direction) we return the list of partner node ids in order,
  // so each edge knows its index within the fan and can compute its t-value.
  function buildFanIndex(scene) {
    const map = new Map(); // key: `${nodeId}|${side}|${io}` -> array of partner ids
    const sides = []; // parallel to scene.edges: { fromSide, toSide }
    for (const ed of scene.edges) {
      const a = scene.nodes.find((n) => n.id === ed.from);
      const b = scene.nodes.find((n) => n.id === ed.to);
      if (!a || !b) { sides.push(null); continue; }
      const s = pickSides(a, b);
      sides.push(s);
      const kOut = `${a.id}|${s.from}|out`;
      const kIn  = `${b.id}|${s.to}|in`;
      if (!map.has(kOut)) map.set(kOut, []);
      if (!map.has(kIn))  map.set(kIn,  []);
      map.get(kOut).push(b.id);
      map.get(kIn).push(a.id);
    }
    // sort partners by their geometric position so the fan reads in order
    const nodeById = Object.fromEntries(scene.nodes.map((n) => [n.id, n]));
    for (const [key, partners] of map) {
      const [, side] = key.split("|");
      const isHoriz = side === "left" || side === "right";
      partners.sort((p, q) => {
        const np = nodeById[p], nq = nodeById[q];
        return isHoriz ? (np.y + np.h / 2) - (nq.y + nq.h / 2)
                       : (np.x + np.w / 2) - (nq.x + nq.w / 2);
      });
    }
    return { map, sides };
  }

  // t-value for the i-th item in a fan of n items, padded inside the side
  function fanT(i, n) {
    if (n <= 1) return 0.5;
    // spread evenly between 0.2 and 0.8 so arrows never crowd corners
    return 0.2 + (0.6 * i) / (n - 1);
  }

  // Evaluate a cubic bezier at parameter t ∈ [0, 1]
  function bezAt(s, c1, c2, e, t) {
    const u = 1 - t;
    return {
      x: u * u * u * s.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * e.x,
      y: u * u * u * s.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * e.y,
    };
  }

  // Find EVERY non-endpoint node the bezier passes through. Used to compute
  // the full obstacle band so we can route around the whole wall, not just
  // dodge the first box (which causes oscillation between adjacent obstacles).
  function curveObstacles(scene, a, b, s, c1, c2, e, pad) {
    const hits = [];
    for (const n of scene.nodes) {
      if (n.id === a.id || n.id === b.id) continue;
      const x1 = n.x - pad, x2 = n.x + n.w + pad;
      const y1 = n.y - pad, y2 = n.y + n.h + pad;
      for (let i = 1; i < 20; i++) {
        const p = bezAt(s, c1, c2, e, i / 20);
        if (p.x > x1 && p.x < x2 && p.y > y1 && p.y < y2) { hits.push(n); break; }
      }
    }
    return hits;
  }

  // Smooth, fluid cubic-bezier router with obstacle-aware deflection.
  // Each edge starts at a fan-distributed anchor on the source side and ends
  // at a fan-distributed anchor on the target side. If the natural curve
  // would pass through another node's box, the control points are pushed
  // (up or down for horizontal edges, left or right for vertical edges) so
  // the curve bows AROUND the obstacle. Repeats up to 4 times for tough cases.
  function edgePath(scene, a, b, sides, fanFrom, fanTo, fanIdxOut, fanSizeOut) {
    const s = anchor(a, sides.from, fanFrom);
    const e = anchor(b, sides.to,   fanTo);
    const isHFrom = sides.from === "left" || sides.from === "right";
    const isHTo   = sides.to   === "left" || sides.to   === "right";
    const PAD = 8;

    // ---- horizontal-to-horizontal (most common) -----------------------------
    if (isHFrom && isHTo) {
      const dx = e.x - s.x, dy = e.y - s.y;
      let cx = Math.max(30, Math.min(Math.abs(dx) * 0.45, 90));
      const fromRight = sides.from === "right";
      const toLeft    = sides.to   === "left";
      const tilt = Math.sign(dy) * Math.min(Math.abs(dy) * 0.18, 60);
      let c1y = s.y + tilt;
      let c2y = e.y - tilt;
      let c1x = fromRight ? s.x + cx : s.x - cx;
      let c2x = toLeft    ? e.x - cx : e.x + cx;
      // Band-based obstacle routing: find ALL boxes the curve passes through,
      // treat them as one band, then route around the whole band in one go.
      // This avoids oscillation (dodging A only to hit B, then dodging B only
      // to hit A) that single-obstacle deflection suffers from.
      for (let pass = 0; pass < 3; pass++) {
        const hits = curveObstacles(scene, a, b, s, { x: c1x, y: c1y }, { x: c2x, y: c2y }, e, PAD);
        if (hits.length === 0) break;
        const bandMin = Math.min.apply(null, hits.map(h => h.y));
        const bandMax = Math.max.apply(null, hits.map(h => h.y + h.h));
        // Choose route side: above the band, or below the band.
        // Target's position drives the decision so the curve approaches the
        // target cleanly from outside the band (no threading through boxes).
        let routeAbove;
        if (e.y < bandMin)        routeAbove = true;   // target above band → route above
        else if (e.y > bandMax)   routeAbove = false;  // target below band → route below
        else                      routeAbove = (e.y - bandMin) <= (bandMax - e.y); // target inside band → closer edge wins
        const targetMid = routeAbove ? bandMin - 30 : bandMax + 30;
        // Bezier midpoint y = (s.y + 3c1y + 3c2y + e.y) / 8.
        // Pushing both control points by d shifts midpoint by 0.75d.
        const currentMid = bezAt(s, { x: c1x, y: c1y }, { x: c2x, y: c2y }, e, 0.5).y;
        const d = (targetMid - currentMid) / 0.75;
        c1y += d;
        c2y += d;
        // Strengthen horizontal pull so the bow has room to clear the band
        cx = Math.min(cx + 20, 130);
        c1x = fromRight ? s.x + cx : s.x - cx;
        c2x = toLeft    ? e.x - cx : e.x + cx;
      }
      const d = `M ${s.x} ${s.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${e.x} ${e.y}`;
      const mid = bezAt(s, { x: c1x, y: c1y }, { x: c2x, y: c2y }, e, 0.5);
      return { d, end: e, dir: "h", toSide: sides.to, mid };
    }

    // ---- vertical-to-vertical -----------------------------------------------
    if (!isHFrom && !isHTo) {
      const dx = e.x - s.x, dy = e.y - s.y;
      let cy = Math.max(25, Math.min(Math.abs(dy) * 0.42, 80));
      const fromBottom = sides.from === "bottom";
      const toTop      = sides.to   === "top";
      const tilt = Math.sign(dx) * Math.min(Math.abs(dx) * 0.18, 50);
      let c1x = s.x + tilt;
      let c2x = e.x - tilt;
      let c1y = fromBottom ? s.y + cy : s.y - cy;
      let c2y = toTop      ? e.y - cy : e.y + cy;
      for (let pass = 0; pass < 3; pass++) {
        const hits = curveObstacles(scene, a, b, s, { x: c1x, y: c1y }, { x: c2x, y: c2y }, e, PAD);
        if (hits.length === 0) break;
        const bandMin = Math.min.apply(null, hits.map(h => h.x));
        const bandMax = Math.max.apply(null, hits.map(h => h.x + h.w));
        let routeLeft;
        if (e.x < bandMin)        routeLeft = true;
        else if (e.x > bandMax)   routeLeft = false;
        else                      routeLeft = (e.x - bandMin) <= (bandMax - e.x);
        const targetMid = routeLeft ? bandMin - 30 : bandMax + 30;
        const currentMid = bezAt(s, { x: c1x, y: c1y }, { x: c2x, y: c2y }, e, 0.5).x;
        const d = (targetMid - currentMid) / 0.75;
        c1x += d;
        c2x += d;
        cy = Math.min(cy + 20, 120);
        c1y = fromBottom ? s.y + cy : s.y - cy;
        c2y = toTop      ? e.y - cy : e.y + cy;
      }
      const d = Math.abs(s.x - e.x) < 1 && Math.abs(c1x - s.x) < 1 && Math.abs(c2x - e.x) < 1
        ? `M ${s.x} ${s.y} L ${e.x} ${e.y}`
        : `M ${s.x} ${s.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${e.x} ${e.y}`;
      const mid = bezAt(s, { x: c1x, y: c1y }, { x: c2x, y: c2y }, e, 0.5);
      return { d, end: e, dir: "v", toSide: sides.to, mid };
    }

    // ---- mixed (horizontal ↔ vertical) — smooth L-curve ---------------------
    if (isHFrom && !isHTo) {
      const cx = Math.max(40, Math.min(Math.abs(e.x - s.x) * 0.4, 80));
      const cy = Math.max(30, Math.min(Math.abs(e.y - s.y) * 0.35, 60));
      const c1x = sides.from === "right" ? s.x + cx : s.x - cx;
      const c2y = sides.to   === "top"   ? e.y - cy : e.y + cy;
      const d = `M ${s.x} ${s.y} C ${c1x} ${s.y}, ${e.x} ${c2y}, ${e.x} ${e.y}`;
      return { d, end: e, dir: "h", toSide: sides.to,
               mid: { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 } };
    }
    const cx = Math.max(40, Math.min(Math.abs(e.x - s.x) * 0.35, 60));
    const cy = Math.max(30, Math.min(Math.abs(e.y - s.y) * 0.4, 80));
    const c1y = sides.from === "bottom" ? s.y + cy : s.y - cy;
    const c2x = sides.to   === "left"   ? e.x - cx : e.x + cx;
    const d = `M ${s.x} ${s.y} C ${s.x} ${c1y}, ${c2x} ${e.y}, ${e.x} ${e.y}`;
    return { d, end: e, dir: "v", toSide: sides.to,
             mid: { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 } };
  }

  // =========================================================================
  // NODE FACE
  // =========================================================================
  function NodeFace({ node, isFocused, onClick }) {
    const cls = `node ${node.tone}${node.child ? " has-child" : ""}${isFocused ? " is-focused" : ""}`;
    const compact = node.h <= 104;
    const style = {
      left: node.x, top: node.y, width: node.w, height: node.h,
      padding: compact ? "12px 15px" : "15px 18px",
    };
    // size type to the box so content always fits (no clipping)
    const isDecision = node.tone === "decision";
    const tBase = Math.max(15, Math.min(28, node.h * 0.185));
    const ts = Math.round((isDecision ? tBase * 0.82 : tBase) * 10) / 10;
    const ss = Math.round(Math.max(11.5, Math.min(15.5, node.h * 0.112)) * 10) / 10;
    const ks = Math.round(Math.max(10, Math.min(12.5, node.h * 0.085)) * 10) / 10;
    const body = (
      <React.Fragment>
        {node.kind ? <div className="kind" style={{ fontSize: ks }}>{node.kind}</div> : null}
        <div className="title" style={{ fontSize: ts }}>{node.title}</div>
        {node.sub ? <div className="sub" style={{ fontSize: ss, marginTop: compact ? 4 : 7 }}>{node.sub}</div> : null}
        {node.child ? (
          <div className="drill-tag" title="Zoom in">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
        ) : null}
      </React.Fragment>
    );
    return (
      <div className={cls} style={style} onClick={(e) => { e.stopPropagation(); onClick(node); }}>
        {node.tone === "decision" ? <div className="inner">{body}</div> : body}
      </div>
    );
  }

  // =========================================================================
  // SCENE (recursive)
  // =========================================================================
  function Scene({ sceneId, pathPrefix, nativeScale, cameraScale, vw, vh, focusedNodeId, focusPath, onNode }) {
    const scene = SC(sceneId);
    // viewport-aware visibility: how close is the camera to fitting THIS scene?
    const fitScale = Math.min(vw / (nativeScale * scene.w), vh / (nativeScale * scene.h)) * 0.86;
    const r = cameraScale / fitScale;
    // A sub-scene only "unlocks" once you've entered its branch — i.e. its key
    // path is a prefix of the current focus path. This keeps sibling sub-flows
    // hidden (as plain cards) so their overflowing previews never collide.
    const unlocked = pathPrefix.every((v, i) => focusPath[i] === v);
    const isActive = unlocked && pathPrefix.length === focusPath.length;
    // The scene you're currently in stays fully visible no matter how you zoom;
    // only ancestor layers recede (as children take over when you go deeper).
    let opacity;
    const L = Math.log2(Math.max(r, 1e-4));
    if (!unlocked) opacity = 0;
    // Active scene: fade IN as the camera arrives (kills spill on the way in),
    // then stay fully solid even if you zoom past its fit (no blank-out).
    else if (isActive) opacity = smoothstep(-1.7, -0.35, L);
    // Ancestors recede as their children take over.
    else opacity = 1 - smoothstep(0.6, 1.9, L);
    const interactive = opacity > 0.55;

    const nodeMap = useMemo(() => Object.fromEntries(scene.nodes.map((n) => [n.id, n])), [sceneId]);
    const fanIndex = useMemo(() => buildFanIndex(scene), [sceneId]);
    const markerId = `arrow-${sceneId}`;

    return (
      <div className="scene" style={{ width: scene.w, height: scene.h }}>
        {/* content layer (faces + edges) — fades as a unit, NOT including drills.
            Fade IN smoothly when unlocked; snap OUT instantly when locked so a
            leaving sub-scene never lingers/spills across the map during zoom-out. */}
        <div
          className="scene-content"
          style={{ position: "absolute", inset: 0, opacity, pointerEvents: interactive ? "auto" : "none", transition: unlocked ? undefined : "none" }}
        >
          <svg className="scene-svg" viewBox={`0 0 ${scene.w} ${scene.h}`} width={scene.w} height={scene.h}>
            <defs>
              <marker id={markerId} markerWidth="9" markerHeight="9" refX="6.5" refY="4.5" orient="auto">
                <path d="M1,1 L7,4.5 L1,8" fill="none" stroke="var(--connector)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            {scene.edges.map((ed, i) => {
              const a = nodeMap[ed.from], b = nodeMap[ed.to];
              if (!a || !b) return null;
              const sides = fanIndex.sides[i];
              if (!sides) return null;
              const outList = fanIndex.map.get(`${a.id}|${sides.from}|out`) || [b.id];
              const inList  = fanIndex.map.get(`${b.id}|${sides.to}|in`)    || [a.id];
              const outIdx = outList.indexOf(b.id);
              const fanFrom = fanT(outIdx, outList.length);
              const fanTo   = fanT(inList.indexOf(a.id),  inList.length);
              const p = edgePath(scene, a, b, sides, fanFrom, fanTo, outIdx, outList.length);
              const isFlow = ed.type !== "branch";
              return (
                <g key={i}>
                  <path className={`edge ${isFlow ? "" : "branch"}`} d={p.d} markerEnd={isFlow ? `url(#${markerId})` : undefined} />
                  {ed.label ? (
                    <text className="edge-label" x={p.mid.x} y={p.mid.y} textAnchor="middle" dominantBaseline="central">
                      {ed.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          {scene.nodes.map((n) => (
            <NodeFace key={n.id} node={n} isFocused={focusedNodeId === n.id} onClick={(nn) => onNode([...pathPrefix, nn.id], nn)} />
          ))}
        </div>

        {/* drills: nested sub-scenes, siblings of content so opacity does NOT compound */}
        {scene.nodes.filter((n) => n.child).map((n) => {
          const cs = SC(n.child);
          const pl = placement(n, cs);
          return (
            <div
              key={`drill-${n.id}`}
              className="drill"
              style={{ left: n.x, top: n.y, width: n.w, height: n.h, background: "transparent", pointerEvents: "none" }}
            >
              <div
                className="drill-scaler"
                style={{ left: pl.ox, top: pl.oy, width: cs.w, height: cs.h, transform: `scale(${pl.f})`, pointerEvents: "none" }}
              >
                <Scene
                  sceneId={n.child}
                  pathPrefix={[...pathPrefix, n.id]}
                  nativeScale={nativeScale * pl.f}
                  cameraScale={cameraScale}
                  vw={vw}
                  vh={vh}
                  focusedNodeId={focusedNodeId}
                  focusPath={focusPath}
                  onNode={onNode}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // =========================================================================
  // ZOOM CANVAS — owns the camera
  // =========================================================================
  function ZoomCanvas({ focusPath, focusedNodeId, onNode, onBackground, onZoomCommit, registerApi }) {
    const stageRef = useRef(null);
    const [vp, setVp] = useState({ w: 1200, h: 800 });
    const [cam, setCam] = useState({ scale: 0.5, tx: 0, ty: 0 });
    const [animate, setAnimate] = useState(true);
    const camRef = useRef(cam);
    camRef.current = cam;
    const focusPathRef = useRef(focusPath);
    focusPathRef.current = focusPath;

    // measure viewport — synchronously on mount (before the fit effect runs)
    // so the first camera fit uses the real stage size, not the default.
    useLayoutEffect(() => {
      const el = stageRef.current;
      if (!el) return;
      const measure = () => setVp({ w: el.clientWidth, h: el.clientHeight });
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // recompute camera whenever focus path or viewport changes
    useEffect(() => {
      const rect = targetRect(focusPath);
      const padFrac = focusPath.length === 0 ? 0.9 : 0.82;
      const fit = fitCamera(rect, vp.w, vp.h, padFrac);
      setAnimate(true);
      setCam(fit);
    }, [focusPath, vp.w, vp.h]);

    // zoom bounds tied to the active scene: you can enlarge to read (up to
    // ~2.6× its fit) but never zoom into emptiness, and you can always pull
    // back far enough to see the whole map.
    const bounds = useMemo(() => {
      const activeFit = fitCamera(targetRect(focusPath), vp.w, vp.h, focusPath.length === 0 ? 0.9 : 0.82).scale;
      const rootFit = fitCamera(targetRect([]), vp.w, vp.h, 0.9).scale;
      return { min: rootFit * 0.45, max: activeFit * 2.6 };
    }, [focusPath, vp.w, vp.h]);
    const boundsRef = useRef(bounds);
    boundsRef.current = bounds;

    // expose imperative zoom controls to the shell
    useEffect(() => {
      if (!registerApi) return;
      registerApi({
        zoomBy: (factor) => {
          const c = camRef.current;
          const b = boundsRef.current;
          const cx = vp.w / 2, cy = vp.h / 2;
          const ns = clamp(c.scale * factor, b.min, b.max);
          const k = ns / c.scale;
          setAnimate(true);
          setCam({ scale: ns, tx: cx - (cx - c.tx) * k, ty: cy - (cy - c.ty) * k });
        },
      });
    }, [registerApi, vp.w, vp.h]);

    // Wheel handler — Figma/Miro style:
    //   • Two-finger scroll (or mouse wheel)          → pan
    //   • Pinch on trackpad (sends wheel + ctrlKey)   → zoom around pointer
    //   • Cmd/Ctrl + wheel                            → also zoom (mouse fallback)
    // Wheel events are batched via requestAnimationFrame so React only re-renders
    // once per frame, even when the trackpad fires events at 120 Hz. That keeps
    // panning buttery and zooming silky on macOS trackpads in particular.
    const drillArmed = useRef(false);
    const pending = useRef({ pan: { dx: 0, dy: 0 }, zoom: null, raf: 0 });
    const flushWheel = useCallback(() => {
      pending.current.raf = 0;
      const c = camRef.current;
      const b = boundsRef.current;
      let ns = c.scale, ntx = c.tx, nty = c.ty;
      // apply pan
      const pan = pending.current.pan;
      if (pan.dx !== 0 || pan.dy !== 0) {
        ntx -= pan.dx;
        nty -= pan.dy;
        pending.current.pan = { dx: 0, dy: 0 };
      }
      // apply zoom (around the last cursor position)
      const zoom = pending.current.zoom;
      if (zoom) {
        const factor = Math.exp(-zoom.dy * 0.012);
        ns = clamp(c.scale * factor, b.min, b.max);
        const k = ns / c.scale;
        ntx = zoom.px - (zoom.px - ntx) * k;
        nty = zoom.py - (zoom.py - nty) * k;
        pending.current.zoom = null;

        // auto-drill: when pinned at the ceiling and still zooming in, fly
        // into whichever child node sits under the cursor.
        const zoomingIn = zoom.dy < 0;
        const atCeiling = ns >= b.max - 1e-3;
        if (zoomingIn && atCeiling && !drillArmed.current) {
          const wx = (zoom.px - ntx) / ns, wy = (zoom.py - nty) / ns;
          const { T, sceneId } = activeTransform(focusPathRef.current);
          const scene = SC(sceneId);
          const hit = scene.nodes.find((n) => {
            if (!n.child) return false;
            const x = T.ox + T.s * n.x, y = T.oy + T.s * n.y;
            return wx >= x && wx <= x + T.s * n.w && wy >= y && wy <= y + T.s * n.h;
          });
          if (hit) {
            drillArmed.current = true;
            onZoomCommit([...focusPathRef.current, hit.id]);
            setTimeout(() => (drillArmed.current = false), 700);
          }
        }
      }
      setAnimate(false);
      setCam({ scale: ns, tx: ntx, ty: nty });
    }, []);
    const onWheel = useCallback((e) => {
      e.preventDefault();
      const rect = stageRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      // Pinch on macOS trackpad sets ctrlKey automatically; explicit Cmd/Ctrl
      // also means "zoom" so mouse-only users can still zoom with modifier.
      const wantZoom = e.ctrlKey || e.metaKey;
      if (wantZoom) {
        // Accumulate zoom intent for this frame; the last cursor position wins.
        const prev = pending.current.zoom;
        pending.current.zoom = { dy: (prev ? prev.dy : 0) + e.deltaY, px, py };
      } else {
        // Accumulate pan intent. deltaX/deltaY from two-finger swipe are small
        // per event but arrive often — batching keeps it smooth.
        pending.current.pan.dx += e.deltaX;
        pending.current.pan.dy += e.deltaY;
      }
      if (!pending.current.raf) {
        pending.current.raf = requestAnimationFrame(flushWheel);
      }
    }, [flushWheel]);

    // drag to pan
    const drag = useRef(null);
    const onPointerDown = (e) => {
      if (e.target.closest(".node")) return; // let node clicks through
      drag.current = { x: e.clientX, y: e.clientY, tx: camRef.current.tx, ty: camRef.current.ty, moved: false };
      stageRef.current.classList.add("is-panning");
    };
    const onPointerMove = (e) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
      setAnimate(false);
      setCam((c) => ({ ...c, tx: drag.current.tx + dx, ty: drag.current.ty + dy }));
    };
    const endDrag = (e) => {
      const wasMoved = drag.current && drag.current.moved;
      drag.current = null;
      stageRef.current && stageRef.current.classList.remove("is-panning");
      if (!wasMoved && e && !e.target.closest(".node")) onBackground();
    };

    useEffect(() => {
      const el = stageRef.current;
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    }, [onWheel]);

    return (
      <div
        className="stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={() => { drag.current = null; stageRef.current && stageRef.current.classList.remove("is-panning"); }}
      >
        <div className={`world ${animate ? "" : "no-anim"}`} style={{ transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})` }}>
          <Scene
            sceneId={window.FIU.meta.rootScene}
            pathPrefix={[]}
            nativeScale={1}
            cameraScale={cam.scale}
            vw={vp.w}
            vh={vp.h}
            focusedNodeId={focusedNodeId}
            focusPath={focusPath}
            onNode={onNode}
          />
        </div>
      </div>
    );
  }

  window.FIUEngine = { ZoomCanvas, walkPath };
})();
