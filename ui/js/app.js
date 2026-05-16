/* app.js — TurRoute application logic */

'use strict';

// ── Haversine distance (km) ───────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Build closed waypoints + segments for a path ─────────────────────────

function buildClosedRoute(path, cityMap) {
  const closed = [...path, path[0]]; // closed circuit

  const waypoints = closed.map(name => {
    const c      = cityMap[name];
    const [x, y] = lonLatToXY(c.lon, c.lat);
    return { name, x, y };
  });

  const segments = [];
  for (let i = 0; i < closed.length - 1; i++) {
    const a = cityMap[closed[i]];
    const b = cityMap[closed[i + 1]];
    segments.push({
      from:     closed[i],
      to:       closed[i + 1],
      distance: Math.round(haversineKm(a.lat, a.lon, b.lat, b.lon) * 10) / 10,
    });
  }

  return { waypoints, segments };
}

// ── Presets ───────────────────────────────────────────────────────────────

const PRESETS = {
  south:        { cities: ['Maputo', 'Inhambane', 'Vilanculos'],                         start: 'Maputo' },
  'center-north': { cities: ['Beira', 'Chimoio', 'Quelimane', 'Tete', 'Nampula'],       start: 'Beira'  },
  complete:     { cities: ['Maputo', 'Inhambane', 'Vilanculos', 'Beira', 'Quelimane', 'Tete', 'Nampula', 'Pemba'], start: 'Maputo' },
};

// ── State ─────────────────────────────────────────────────────────────────

const state = {
  allCities:   [],
  selected:    [],
  startCity:   '',
  algorithm:   'Todos',
  lastResults: [],
  activeAlgoIdx: -1,
};

// ── DOM refs ──────────────────────────────────────────────────────────────

const $cityGrid    = document.getElementById('city-checkboxes');
const $cityCount   = document.getElementById('city-count');
const $startSelect = document.getElementById('start-city-select');
const $algoSelect  = document.getElementById('algorithm-select');
const $runBtn      = document.getElementById('run-btn');
const $hint        = document.getElementById('hint-text');
const $resultsPanel= document.getElementById('results-panel');
const $resultsBody = document.getElementById('results-content');

// ── Validation ────────────────────────────────────────────────────────────

function validate() {
  const ok = state.selected.length >= 2 && state.startCity !== '';
  $runBtn.disabled = !ok;
  $hint.textContent = ok ? '' : 'Selecione pelo menos 2 cidades';
}

// ── City toggle list ──────────────────────────────────────────────────────

function buildCityList() {
  $cityGrid.innerHTML = '';
  $cityGrid.className = 'city-list';

  const regions = [
    { label: 'Sul',    names: ['Maputo','Inhambane','Vilanculos'] },
    { label: 'Centro', names: ['Beira','Chimoio','Quelimane','Tete'] },
    { label: 'Norte',  names: ['Nampula','Nacala','Lichinga','Pemba'] },
  ];

  regions.forEach(({ label, names }) => {
    const header = document.createElement('div');
    header.className = 'city-region-header';
    header.textContent = label;
    $cityGrid.appendChild(header);

    names.forEach(name => {
      if (!state.allCities.find(c => c.name === name)) return;

      const btn = document.createElement('button');
      btn.className = 'city-toggle';
      btn.dataset.city = name;
      btn.type = 'button';
      btn.innerHTML = `<span class="city-toggle-indicator">✓</span><span class="city-toggle-name">${name}</span>`;
      btn.addEventListener('click', () => onCityToggle(name, btn));
      $cityGrid.appendChild(btn);
    });
  });
}

function onCityToggle(name, btn) {
  const idx = state.selected.indexOf(name);
  if (idx === -1) {
    state.selected.push(name);
    btn.classList.add('selected');
  } else {
    state.selected.splice(idx, 1);
    btn.classList.remove('selected');
  }

  $cityCount.textContent = state.selected.length;

  // Rebuild start-city dropdown
  $startSelect.innerHTML = '<option value="">Selecionar...</option>';
  state.selected.forEach(n => {
    const opt = new Option(n, n);
    $startSelect.appendChild(opt);
  });

  if (!state.selected.includes(state.startCity)) {
    state.startCity = state.selected[0] || '';
    $startSelect.value = state.startCity;
  } else {
    $startSelect.value = state.startCity;
  }

  validate();
  updateMapCities(state.selected, state.startCity);
}

$startSelect.addEventListener('change', () => {
  state.startCity = $startSelect.value;
  validate();
  updateMapCities(state.selected, state.startCity);
});

$algoSelect.addEventListener('change', () => { state.algorithm = $algoSelect.value; });

// ── Preset buttons ────────────────────────────────────────────────────────

document.querySelectorAll('[data-preset]').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;

    // Deactivate all preset buttons, activate this one
    document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Set toggle buttons
    document.querySelectorAll('.city-toggle').forEach(btn => {
      btn.classList.toggle('selected', preset.cities.includes(btn.dataset.city));
    });

    state.selected  = [...preset.cities];
    state.startCity = preset.start;
    $cityCount.textContent = state.selected.length;

    // Rebuild start select
    $startSelect.innerHTML = '<option value="">Selecionar...</option>';
    state.selected.forEach(name => {
      const opt = new Option(name, name);
      $startSelect.appendChild(opt);
    });
    $startSelect.value = state.startCity;

    validate();
    updateMapCities(state.selected, state.startCity);
  });
});

// ── Run route ─────────────────────────────────────────────────────────────

$runBtn.addEventListener('click', runRoute);
document.getElementById('close-results').addEventListener('click', () => {
  $resultsPanel.style.display = 'none';
});

async function runRoute() {
  if (state.selected.length < 2 || !state.startCity) return;

  $runBtn.disabled   = true;
  $runBtn.textContent = 'A calcular…';

  try {
    const res = await fetch('/api/route', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        cities:     state.selected,
        start_city: state.startCity,
        algorithm:  state.algorithm,
      }),
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }

    const data = await res.json();

    // Find best result index in results array for colour highlighting
    state.lastResults  = data.results;
    state.activeAlgoIdx = data.results.findIndex(r => r === data.best);
    if (state.activeAlgoIdx === -1) state.activeAlgoIdx = 0;

    renderResults(data);

    const cityMap = {};
    state.allCities.forEach(c => { cityMap[c.name] = c; });

    const waypoints = data.best.path.map(name => {
      const c = cityMap[name];
      const [x, y] = lonLatToXY(c.lon, c.lat);
      return { name, x, y };
    });

    drawAllRoutes(data.results, state.activeAlgoIdx);
    startAnimation(waypoints, data.segments);

  } catch (err) {
    $hint.textContent = `Erro: ${err.message}`;
  } finally {
    $runBtn.disabled   = false;
    $runBtn.textContent = 'Calcular Rota';
    validate();
  }
}

// ── Render results panel ──────────────────────────────────────────────────

function fmtKm(km) { return `${Math.round(km).toLocaleString('pt-PT')} km`; }

function fmtFlightTime(km) {
  const mins = km / 500 * 60;
  const h    = Math.floor(mins / 60);
  const m    = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function fmtSegTime(km) {
  const mins = km / 500 * 60;
  const h    = Math.floor(mins / 60);
  const m    = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function renderResults(data) {
  const best = data.best;

  let html = `
    <div class="result-summary">
      <div class="result-stat">
        <span class="stat-label">Distância</span>
        <span class="stat-value">${fmtKm(best.cost)}</span>
      </div>
      <div class="result-stat">
        <span class="stat-label">Tempo de Voo</span>
        <span class="stat-value">${fmtFlightTime(best.cost)}</span>
      </div>
    </div>

    <div class="result-section-label">Segmentos</div>
    <div class="segments-list">
  `;

  data.segments.forEach((seg, i) => {
    html += `
      <div class="segment-item">
        <span class="seg-idx">${i + 1}</span>
        <div class="seg-info">
          <span class="seg-route">${seg.from} → ${seg.to}</span>
          <span class="seg-details">${seg.distance} km · ${fmtSegTime(seg.distance)}</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  if (data.results.length > 1) {
    html += `<div class="result-section-label">Algoritmos</div>`;
    const sorted = [...data.results].map((r, origIdx) => ({ ...r, _origIdx: origIdx })).sort((a, b) => a.cost - b.cost);
    const ALGO_COLORS = ['#5e6ad2','#27a644','#f0bf00','#fc7840'];
    sorted.forEach((r, i) => {
      const isBest   = i === 0;
      const isActive = r._origIdx === state.activeAlgoIdx;
      const color    = ALGO_COLORS[r._origIdx % ALGO_COLORS.length];
      html += `
        <div class="algo-card ${isBest ? 'algo-card--best' : ''} ${isActive ? 'algo-card--active' : ''}"
             data-algo-orig-idx="${r._origIdx}"
             style="border-left-color:${color}">
          <div class="algo-card-header">
            <span class="algo-name" style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
              ${r.algorithm}
            </span>
            ${isBest ? '<span class="badge-best">melhor</span>' : ''}
          </div>
          <div class="algo-metrics">
            <span>${fmtKm(r.cost)}</span>
            <span>${r.time_ms.toFixed(1)}ms</span>
            <span>${r.nodes_expanded} nós</span>
          </div>
        </div>
      `;
    });
  }

  html += `<div class="result-section-label">Ordem de Visita</div><div class="visit-order">`;
  best.path.forEach((city, i) => {
    const isStart = i === 0;
    html += `
      <div class="visit-item">
        <span class="visit-num">${i + 1}</span>
        <span class="visit-city">${city}</span>
        ${isStart ? '<span class="visit-badge">partida</span>' : ''}
      </div>
    `;
  });
  html += `</div>`;

  $resultsBody.innerHTML = html;
  $resultsPanel.style.display = 'flex';

  // Wire algo-card clicks: highlight route + fly plane to new route
  const cityMap = {};
  state.allCities.forEach(c => { cityMap[c.name] = c; });

  $resultsBody.querySelectorAll('[data-algo-orig-idx]').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.algoOrigIdx);
      if (idx === state.activeAlgoIdx) return; // already active
      state.activeAlgoIdx = idx;
      setActiveRoute(idx);
      $resultsBody.querySelectorAll('[data-algo-orig-idx]').forEach(c => {
        c.classList.toggle('algo-card--active', parseInt(c.dataset.algoOrigIdx) === idx);
      });

      const r = state.lastResults[idx];
      if (r && r.path && r.path.length >= 2) {
        const { waypoints, segments } = buildClosedRoute(r.path, cityMap);
        switchToRoute(waypoints, segments);
      }
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  await initMap();

  const res  = await fetch('/api/cities');
  state.allCities = await res.json();

  setCityData(state.allCities);
  buildCityList();
  validate();
}

init();
