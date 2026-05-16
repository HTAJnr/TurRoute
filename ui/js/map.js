/* map.js — SVG map rendering + airplane animation */

'use strict';

// ── Coordinate system (mirrors ui/map_view.py) ────────────────────────────

const MAP = {
  VW: 500, VH: 760,
  LON_MIN: 29.5, LON_MAX: 41.5,
  LAT_MIN: -27.5, LAT_MAX: -9.5,
  PAD_X: 30, PAD_Y: 30,
};
MAP.DRAW_W = MAP.VW - 2 * MAP.PAD_X;
MAP.DRAW_H = MAP.VH - 2 * MAP.PAD_Y;

function lonLatToXY(lon, lat) {
  const x = MAP.PAD_X + (lon - MAP.LON_MIN) / (MAP.LON_MAX - MAP.LON_MIN) * MAP.DRAW_W;
  const y = (MAP.VH - MAP.PAD_Y) - (lat - MAP.LAT_MIN) / (MAP.LAT_MAX - MAP.LAT_MIN) * MAP.DRAW_H;
  return [+x.toFixed(1), +y.toFixed(1)];
}

// ── City data store (set by app.js via setCityData) ───────────────────────

let _cityData = {};

function setCityData(cities) {
  _cityData = {};
  cities.forEach(c => { _cityData[c.name] = c; });
}

// ── Province colour palette (dark, no rainbow) ────────────────────────────

const PROVINCE_FILLS = [
  '#1c1f2a',  // 0 — blue-charcoal
  '#1e2230',  // 1 — navy-dark
  '#191d28',  // 2 — cool dark
  '#1b2035',  // 3 — deep indigo-dark
];

// ── SVG element refs ──────────────────────────────────────────────────────

const $border       = document.getElementById('moz-border');
const $borderStroke = document.getElementById('moz-border-stroke');
const $borderGlow   = document.getElementById('moz-border-glow');
const $clipPath     = document.getElementById('moz-clip-path');
const $provinces    = document.getElementById('provinces-layer');
const $cities     = document.getElementById('cities-layer');
const $routes     = document.getElementById('route-layer');
const $planeWrap  = document.getElementById('plane-wrapper');
const $planeBody  = document.getElementById('plane-body');
const $hud        = document.getElementById('flight-hud');
const $hudFrom    = document.getElementById('hud-from');
const $hudTo      = document.getElementById('hud-to');
const $hudDist    = document.getElementById('hud-distance');
const $hudTime    = document.getElementById('hud-time');
const $hudBar     = document.getElementById('hud-progress-bar');

// ── SVG namespace helper ──────────────────────────────────────────────────

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// ── Map init: border + provinces ──────────────────────────────────────────

async function initMap() {
  // Load national border
  try {
    const res  = await fetch('/api/border');
    const data = await res.json();
    const ring = data.coordinates[0];
    const pts  = ring.map(([lon, lat]) => lonLatToXY(lon, lat));
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]},${pts[i][1]}`;
    d += ' Z';
    // Base fill (country shape)
    $border.setAttribute('d', d);
    // Clip path (same shape — keeps provinces inside country outline)
    $clipPath.setAttribute('d', d);
    // Outline strokes drawn on top of provinces
    $borderStroke.setAttribute('d', d);
    $borderGlow.setAttribute('d', d);
  } catch (_) {
    const fallback = 'M 140,670 L 445,670 L 435,58 L 182,58 Z';
    [$border, $clipPath, $borderStroke, $borderGlow].forEach(el => el.setAttribute('d', fallback));
  }

  // Load and draw provinces
  try {
    const res  = await fetch('/api/provinces');
    const data = await res.json();
    $provinces.innerHTML = '';

    data.provinces.forEach(prov => {
      const pts = prov.coordinates.map(([lon, lat]) => lonLatToXY(lon, lat));
      let d = `M ${pts[0][0]},${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]},${pts[i][1]}`;
      d += ' Z';

      const fill = PROVINCE_FILLS[prov.colorIdx % PROVINCE_FILLS.length];

      $provinces.appendChild(svgEl('path', {
        d,
        fill,
        stroke: 'rgba(94,106,210,0.2)',
        'stroke-width': '0.7',
        'stroke-linejoin': 'round',
      }));
    });
  } catch (_) {
    // Province draw failure is silent — border still renders
  }
}

// ── City markers ──────────────────────────────────────────────────────────

function updateMapCities(selectedNames, startCity) {
  $cities.innerHTML = '';

  selectedNames.forEach(name => {
    const c = _cityData[name];
    if (!c) return;

    const [x, y] = lonLatToXY(c.lon, c.lat);
    const isStart = name === startCity;
    const r      = isStart ? 10 : 7;
    const fill   = isStart ? '#f7f8f8' : '#5e6ad2';
    const stroke = isStart ? '#5e6ad2' : '#7170ff';
    const sw     = isStart ? 2.5 : 2.0;
    const fw     = isStart ? '600' : '500';

    if (isStart) {
      $cities.appendChild(svgEl('circle', {
        cx: x, cy: y, r: r + 5,
        fill: 'none', stroke: '#5e6ad2',
        'stroke-width': '1', opacity: '0.25',
      }));
    }

    $cities.appendChild(svgEl('circle', {
      cx: x, cy: y, r,
      fill, stroke, 'stroke-width': sw,
      class: 'city-dot', 'data-city': name,
    }));

    const labelY = y - r - 5;

    // Shadow
    const shadow = svgEl('text', {
      x, y: labelY, 'text-anchor': 'middle',
      fill: '#0f1011', 'font-size': '13', 'font-weight': fw,
      'font-family': 'Inter, sans-serif',
      stroke: '#0f1011', 'stroke-width': '3', 'paint-order': 'stroke',
    });
    shadow.textContent = name;
    $cities.appendChild(shadow);

    const label = svgEl('text', {
      x, y: labelY, 'text-anchor': 'middle',
      fill: '#d0d6e0', 'font-size': '13', 'font-weight': fw,
      'font-family': 'Inter, sans-serif',
    });
    label.textContent = name;
    $cities.appendChild(label);
  });
}

// ── Route paths ───────────────────────────────────────────────────────────

const ALGO_COLORS = ['#5e6ad2', '#27a644', '#f0bf00', '#fc7840'];

function drawAllRoutes(results, activeIndex) {
  $routes.innerHTML = '';
  if (!results || results.length === 0) return;

  results.forEach((r, i) => {
    if (!r.path || r.path.length < 2) return;
    const pts = r.path.map(name => {
      const c = _cityData[name];
      return c ? lonLatToXY(c.lon, c.lat) : null;
    }).filter(Boolean);
    if (pts.length < 2) return;

    const d      = pts.map(([x, y], j) => `${j === 0 ? 'M' : 'L'} ${x},${y}`).join(' ');
    const color  = ALGO_COLORS[i % ALGO_COLORS.length];
    const active = i === activeIndex;

    const glow = svgEl('path', {
      d, fill: 'none', stroke: color,
      'stroke-width': active ? '7' : '4',
      'stroke-opacity': active ? '0.2' : '0.06',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      class: 'route-glow', 'data-algo-idx': i,
    });
    const line = svgEl('path', {
      d, fill: 'none', stroke: color,
      'stroke-width': active ? '2' : '1.2',
      opacity: active ? '1' : '0.25',
      'stroke-dasharray': '7,5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      class: 'route-line', 'data-algo-idx': i,
    });

    $routes.appendChild(glow);
    $routes.appendChild(line);
  });
}

function setActiveRoute(activeIndex) {
  $routes.querySelectorAll('.route-glow').forEach(el => {
    const i      = parseInt(el.getAttribute('data-algo-idx'));
    const active = i === activeIndex;
    el.setAttribute('stroke-width', active ? '7' : '4');
    el.setAttribute('stroke-opacity', active ? '0.2' : '0.06');
  });
  $routes.querySelectorAll('.route-line').forEach(el => {
    const i      = parseInt(el.getAttribute('data-algo-idx'));
    const active = i === activeIndex;
    el.setAttribute('stroke-width', active ? '2' : '1.2');
    el.setAttribute('opacity', active ? '1' : '0.25');
  });
}

function drawRoute(path) {
  drawAllRoutes(path && path.length >= 2 ? [{ path }] : [], 0);
}

// ── Landing pulse ring ────────────────────────────────────────────────────

function pulseCity(name) {
  const c = _cityData[name];
  if (!c) return;
  const [x, y] = lonLatToXY(c.lon, c.lat);

  const ring = svgEl('circle', {
    cx: x, cy: y, r: 8, fill: 'none',
    stroke: '#5e6ad2', 'stroke-width': '1.8', opacity: '0.9',
  });
  $cities.appendChild(ring);

  // Animate outward and fade
  ring.style.transition = 'all 700ms ease-out';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.r = 24;
    ring.style.opacity = 0;
    ring.setAttribute('r', '22');
    ring.setAttribute('opacity', '0');
    ring.setAttribute('stroke-width', '0.5');
    setTimeout(() => ring.remove(), 800);
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fmtTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// ── Plane control ─────────────────────────────────────────────────────────

let _currentX = 0;
let _currentY = 0;

function setPlanePos(x, y, angleDeg) {
  _currentX = x;
  _currentY = y;
  $planeWrap.setAttribute('transform', `translate(${x},${y}) rotate(${angleDeg})`);
}

function setPlaneScale(s) {
  $planeBody.style.transform = `scale(${s})`;
}

// ── Fly segment: RAF-based interpolation ──────────────────────────────────

// Silent fly: no HUD, just position + angle
function _flyQuiet(x0, y0, x1, y1, durMs, signal) {
  return new Promise(resolve => {
    const dx    = x1 - x0;
    const dy    = y1 - y0;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const t0    = performance.now();

    function tick(now) {
      if (signal.aborted) { resolve(); return; }
      const t = Math.min((now - t0) / durMs, 1);
      setPlanePos(x0 + dx * t, y0 + dy * t, angle);
      if (t < 1) requestAnimationFrame(tick);
      else       resolve();
    }

    requestAnimationFrame(tick);
  });
}

function flySegment(x0, y0, x1, y1, durMs, flightMin, signal) {
  return new Promise(resolve => {
    const dx    = x1 - x0;
    const dy    = y1 - y0;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const t0    = performance.now();

    function tick(now) {
      if (signal.aborted) { resolve(); return; }

      const t = Math.min((now - t0) / durMs, 1);

      setPlanePos(x0 + dx * t, y0 + dy * t, angle);

      // HUD time update
      const vMins = flightMin * t;
      $hudTime.textContent = fmtTime(vMins);
      $hudBar.style.width  = `${(t * 100).toFixed(1)}%`;

      if (t < 1) requestAnimationFrame(tick);
      else       resolve();
    }

    requestAnimationFrame(tick);
  });
}

// ── Main animation loop ───────────────────────────────────────────────────

// FLIGHT_SCALE: 1 real second = FLIGHT_SCALE virtual minutes of flight
// at 500 km/h: duration(ms) = (distKm / 500 * 60 / FLIGHT_SCALE) * 1000
const FLIGHT_SCALE = 30;
const SPEED_KMH    = 500;

let _animController = null;

async function startAnimation(waypoints, segments) {
  if (_animController) { _animController.abort(); await sleep(80); }
  _animController = new AbortController();
  const { signal } = _animController;

  // Place plane at start, shrunk (just landed)
  const s0 = waypoints[0];
  setPlanePos(s0.x, s0.y, 0);
  setPlaneScale(0.4);

  $hud.style.display = 'block';
  await sleep(60); // let browser render initial position

  while (!signal.aborted) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (signal.aborted) break;

      const from = waypoints[i];
      const to   = waypoints[i + 1];
      const dist = segments[i].distance;          // km
      const flightMin = dist / SPEED_KMH * 60;   // virtual minutes
      const animMs = Math.max(1600, (flightMin / FLIGHT_SCALE) * 1000);

      // Update HUD
      $hudFrom.textContent = from.name;
      $hudTo.textContent   = to.name;
      $hudDist.textContent = `${dist} km`;
      $hudTime.textContent = fmtTime(0);
      $hudBar.style.width  = '0%';

      // Takeoff: grow to full size
      setPlaneScale(1.0);
      await sleep(380);
      if (signal.aborted) break;

      // Fly
      await flySegment(from.x, from.y, to.x, to.y, animMs, flightMin, signal);
      if (signal.aborted) break;

      // Land: shrink + pulse ring
      setPlaneScale(0.4);
      pulseCity(to.name);
      $hudTime.textContent = fmtTime(flightMin);
      $hudBar.style.width  = '100%';

      await sleep(1500);
      if (signal.aborted) break;
    }

    // Path ends at start city (closed circuit) — loop restarts naturally
    if (!signal.aborted) await sleep(400);
  }
}

// ── Switch to another algorithm's route (natural transition) ──────────────

async function switchToRoute(newWaypoints, newSegments) {
  if (_animController) { _animController.abort(); await sleep(80); }

  _animController = new AbortController();
  const { signal } = _animController;

  const target = newWaypoints[0];
  const dx = target.x - _currentX;
  const dy = target.y - _currentY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 8) {
    const transitMs = Math.max(600, Math.min(1400, dist * 2.5));
    setPlaneScale(1.0);
    await sleep(200);
    if (signal.aborted) return;
    await _flyQuiet(_currentX, _currentY, target.x, target.y, transitMs, signal);
    if (signal.aborted) return;
    setPlaneScale(0.4);
    pulseCity(target.name);
    await sleep(350);
    if (signal.aborted) return;
  }

  startAnimation(newWaypoints, newSegments);
}
