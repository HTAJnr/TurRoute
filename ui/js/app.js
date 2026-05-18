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
  const closed = [...path, path[0]];

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
  south:          { cities: ['Maputo', 'Inhambane', 'Vilanculos'],                                                                   start: 'Maputo' },
  'center-north': { cities: ['Beira', 'Chimoio', 'Quelimane', 'Tete', 'Nampula'],                                                   start: 'Beira'  },
  complete:       { cities: ['Maputo', 'Inhambane', 'Vilanculos', 'Beira', 'Chimoio', 'Quelimane', 'Tete', 'Nampula', 'Nacala', 'Lichinga', 'Pemba'], start: 'Maputo' },
};

// ── State ─────────────────────────────────────────────────────────────────

const state = {
  allCities:    [],
  selected:     [],
  startCity:    '',
  algorithm:    'Todos',
  lastResults:  [],
  activeAlgoIdx: -1,
};

// ── DOM refs ──────────────────────────────────────────────────────────────

const $cityGrid     = document.getElementById('city-checkboxes');
const $cityCount    = document.getElementById('city-count');
const $startSelect  = document.getElementById('start-city-select');
const $algoSelect   = document.getElementById('algorithm-select');
const $runBtn       = document.getElementById('run-btn');
const $hint         = document.getElementById('hint-text');
const $resultsPanel = document.getElementById('results-panel');
const $panelRota    = document.getElementById('panel-rota');
const $panelAnalise = document.getElementById('panel-analise');
const $tabRota      = document.getElementById('tab-rota');
const $tabAnalise   = document.getElementById('tab-analise');

// ── Chart registry (destroy before recreate) ──────────────────────────────

const chartRegistry = {};

function destroyChart(id) {
  if (chartRegistry[id]) {
    chartRegistry[id].destroy();
    delete chartRegistry[id];
  }
}

// ── Formatters ────────────────────────────────────────────────────────────

function fmtKm(km) { return `${Math.round(km).toLocaleString('pt-PT')} km`; }

function fmtMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function fmtFlightTime(km) {
  return fmtMinutes(km / 500 * 60);
}

function fmtSegTime(km) {
  return fmtMinutes(km / 500 * 60);
}

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
    { label: 'Sul',    names: ['Maputo', 'Inhambane', 'Vilanculos'] },
    { label: 'Centro', names: ['Beira', 'Chimoio', 'Quelimane', 'Tete'] },
    { label: 'Norte',  names: ['Nampula', 'Nacala', 'Lichinga', 'Pemba'] },
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

    document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.city-toggle').forEach(btn => {
      btn.classList.toggle('selected', preset.cities.includes(btn.dataset.city));
    });

    state.selected  = [...preset.cities];
    state.startCity = preset.start;
    $cityCount.textContent = state.selected.length;

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

  $runBtn.disabled    = true;
  $runBtn.textContent = 'A calcular…';
  $hint.textContent   = '';

  const $progressWrap = document.getElementById('run-progress-wrap');
  const $progressBar  = document.getElementById('run-progress-bar');
  if ($progressWrap) $progressWrap.style.display = 'block';

  let progPct = 0;
  const progInterval = setInterval(() => {
    progPct = Math.min(progPct + 4, 88);
    if ($progressBar) $progressBar.style.width = progPct + '%';
  }, 180);

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

    if ($progressBar) $progressBar.style.width = '100%';

    state.lastResults   = data.results;
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
    clearInterval(progInterval);
    setTimeout(() => {
      if ($progressWrap) $progressWrap.style.display = 'none';
      if ($progressBar)  $progressBar.style.width = '0%';
    }, 500);
    $runBtn.disabled    = false;
    $runBtn.textContent = 'Calcular Rota';
    validate();
  }
}

// ── Tab management ────────────────────────────────────────────────────────

let _analiseRendered = false;

function activateTab(tabId) {
  const isRota = tabId === 'rota';
  $tabRota.classList.toggle('active', isRota);
  $tabAnalise.classList.toggle('active', !isRota);
  $tabRota.setAttribute('aria-selected', String(isRota));
  $tabAnalise.setAttribute('aria-selected', String(!isRota));
  $panelRota.hidden    = !isRota;
  $panelAnalise.hidden =  isRota;

  if (!isRota && !_analiseRendered && state.lastResults.length > 1) {
    _analiseRendered = true;
    _buildCharts(state.lastResults);
  } else if (!isRota && _analiseRendered) {
    ['cost', 'nodes', 'time'].forEach(id => {
      if (chartRegistry[id]) chartRegistry[id].resize();
    });
  }
}

$tabRota.addEventListener('click',    () => activateTab('rota'));
$tabAnalise.addEventListener('click', () => activateTab('analise'));

// Delegated click for algo-card switching (registered once)
$panelRota.addEventListener('click', e => {
  const card = e.target.closest('[data-algo-orig-idx]');
  if (!card) return;
  const idx = parseInt(card.dataset.algoOrigIdx);
  if (idx === state.activeAlgoIdx) return;
  state.activeAlgoIdx = idx;
  setActiveRoute(idx);
  $panelRota.querySelectorAll('[data-algo-orig-idx]').forEach(c => {
    c.classList.toggle('algo-card--active', parseInt(c.dataset.algoOrigIdx) === idx);
  });
  const r = state.lastResults[idx];
  if (r && r.path && r.path.length >= 2) {
    const cityMap = {};
    state.allCities.forEach(c => { cityMap[c.name] = c; });
    const { waypoints, segments } = buildClosedRoute(r.path, cityMap);
    switchToRoute(waypoints, segments);
  }
});

// ── Render results panel ──────────────────────────────────────────────────

function renderResults(data) {
  const best = data.best;
  const totalCircuitKm = data.segments.reduce((sum, s) => sum + s.distance, 0);

  _analiseRendered = false;

  // ── Rota tab ──
  let html = `
    <div class="hero-stats">
      <div class="hero-stat">
        <span class="hero-stat-label">Distância</span>
        <span class="hero-stat-value">${fmtKm(best.cost)}</span>
        <span class="hero-stat-sub">circuito completo</span>
      </div>
      <div class="hero-stat">
        <span class="hero-stat-label">Tempo de Voo</span>
        <span class="hero-stat-value">${fmtFlightTime(totalCircuitKm)}</span>
        <span class="hero-stat-sub">a 500 km/h</span>
      </div>
    </div>

    <div class="result-section-label">Segmentos</div>
    <div class="segments-list">
  `;

  data.segments.forEach((seg, i) => {
    const directBadge = seg.direct === false
      ? `<span class="seg-connecting" title="Sem voo directo LAM — requer escala">escala</span>`
      : '';
    html += `
      <div class="segment-item${seg.direct === false ? ' segment-item--connecting' : ''}">
        <span class="seg-idx">${i + 1}</span>
        <div class="seg-info">
          <span class="seg-route">${seg.from} → ${seg.to}${directBadge}</span>
          <span class="seg-details">${seg.distance} km · ${fmtSegTime(seg.distance)}</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  if (data.results.length > 1) {
    html += `<div class="result-section-label">Algoritmos</div>`;
    const sorted = [...data.results].map((r, origIdx) => ({ ...r, _origIdx: origIdx })).sort((a, b) => a.cost - b.cost);
    const ALGO_COLORS = ['#5e6ad2', '#27a644', '#f0bf00', '#fc7840'];
    sorted.forEach((r, rank) => {
      const isBest   = rank === 0;
      const isActive = r._origIdx === state.activeAlgoIdx;
      const color    = ALGO_COLORS[r._origIdx % ALGO_COLORS.length];
      const warning  = r._warning ? `<div class="algo-warning">⚠ ${r._warning}</div>` : '';
      html += `
        <div class="algo-card ${isBest ? 'algo-card--best' : ''} ${isActive ? 'algo-card--active' : ''}"
             data-algo-orig-idx="${r._origIdx}"
             style="border-left-color:${color}">
          <div class="algo-card-header">
            <span class="algo-name" style="display:flex;align-items:center;gap:6px;">
              <span class="algo-rank-badge${isBest ? ' algo-rank-badge--first' : ''}">#${rank + 1}</span>
              <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
              ${r.algorithm}
            </span>
            ${isBest ? '<span class="badge-best">melhor</span>' : ''}
          </div>
          <div class="algo-metrics">
            <span>${fmtKm(r.cost)}</span>
            <span>${fmtMinutes(r.flight_time_min)}</span>
            <span>${r.nodes_expanded.toLocaleString('pt-PT')} nós</span>
          </div>
          ${warning}
        </div>
      `;
    });
  } else if (data.results.length === 1) {
    const r = data.results[0];
    html += `
      <div class="result-section-label">Métricas</div>
      <div class="single-metrics">
        <div class="single-metric">
          <span class="single-metric-label">Distância</span>
          <span class="single-metric-value">${fmtKm(r.cost)}</span>
        </div>
        <div class="single-metric">
          <span class="single-metric-label">Tempo de Voo</span>
          <span class="single-metric-value">${fmtMinutes(r.flight_time_min)}</span>
        </div>
        <div class="single-metric">
          <span class="single-metric-label">Nós Explorados</span>
          <span class="single-metric-value">${r.nodes_expanded.toLocaleString('pt-PT')}</span>
        </div>
        <div class="single-metric">
          <span class="single-metric-label">Garante Óptimo</span>
          <span class="single-metric-value">${r.optimal ? '✅ Sim' : '❌ Não'}</span>
        </div>
      </div>
    `;
  }

  html += `<div class="result-section-label">Ordem de Visita</div><div class="visit-order">`;
  best.path.forEach((city, i) => {
    html += `
      <div class="visit-item">
        <span class="visit-num">${i + 1}</span>
        <span class="visit-city">${city}</span>
        ${i === 0 ? '<span class="visit-badge">partida</span>' : ''}
      </div>
    `;
  });
  html += `</div>`;

  $panelRota.innerHTML = html;

  if (data.results.length > 1) {
    _buildAnaliseTabShell(data.results);
    $tabAnalise.style.display = '';
  } else {
    $panelAnalise.innerHTML = '';
    $tabAnalise.style.display = 'none';
  }

  $resultsPanel.style.display = 'flex';
  activateTab('rota');
}

// ── Build Análise tab shell (no charts yet) ───────────────────────────────

function _buildAnaliseTabShell(results) {
  const best        = results.reduce((a, b) => a.cost < b.cost ? a : b);
  const fastest     = results.reduce((a, b) => a.flight_time_min < b.flight_time_min ? a : b);
  const fewestNodes = results.reduce((a, b) => a.nodes_expanded < b.nodes_expanded ? a : b);
  const sorted      = [...results].sort((a, b) => a.cost - b.cost);
  const worst       = sorted[sorted.length - 1];
  const worstPct    = ((worst.cost - best.cost) / best.cost * 100).toFixed(1);
  const shortName   = r => r.algorithm.split(' ')[0];
  const optimalList = results.filter(r => r.optimal).map(shortName).join(', ');

  let html = `
    <div class="result-section-label">Comparação</div>
    <div class="metrics-cards">
      <div class="metrics-card">
        <span class="metrics-icon">🏆</span>
        <span class="metrics-card-label">Melhor Rota</span>
        <span class="metrics-card-value">${shortName(best)}</span>
        <span class="metrics-card-sub">${fmtKm(best.cost)}</span>
      </div>
      <div class="metrics-card">
        <span class="metrics-icon">✈</span>
        <span class="metrics-card-label">Voo Mais Curto</span>
        <span class="metrics-card-value">${shortName(fastest)}</span>
        <span class="metrics-card-sub">${fmtMinutes(fastest.flight_time_min)}</span>
      </div>
      <div class="metrics-card">
        <span class="metrics-icon">🔬</span>
        <span class="metrics-card-label">Menos Nós</span>
        <span class="metrics-card-value">${shortName(fewestNodes)}</span>
        <span class="metrics-card-sub">${fewestNodes.nodes_expanded.toLocaleString('pt-PT')}</span>
      </div>
      <div class="metrics-card">
        <span class="metrics-icon">✅</span>
        <span class="metrics-card-label">Óptimo</span>
        <span class="metrics-card-value">${optimalList || 'Nenhum'}</span>
        <span class="metrics-card-sub">&nbsp;</span>
      </div>
    </div>
  `;

  html += `
    <div class="metrics-table-wrap">
      <table class="metrics-table">
        <thead>
          <tr>
            <th>Algoritmo</th>
            <th>Custo</th>
            <th>Tempo</th>
            <th>Nós</th>
          </tr>
        </thead>
        <tbody>
  `;
  sorted.forEach(r => {
    const isBest   = r === best;
    const deltaPct = isBest
      ? `<span class="delta-badge delta-badge--best">✓</span>`
      : `<span class="delta-badge delta-badge--warn">+${((r.cost - best.cost) / best.cost * 100).toFixed(1)}%</span>`;
    html += `
      <tr${isBest ? ' class="row-best"' : ''}>
        <td>${shortName(r)}</td>
        <td>${fmtKm(r.cost)} ${deltaPct}</td>
        <td>${fmtMinutes(r.flight_time_min)}</td>
        <td>${r.nodes_expanded.toLocaleString('pt-PT')}</td>
      </tr>
    `;
  });
  html += `</tbody></table></div>`;

  html += `
    <div class="result-section-label">Gráficos</div>
    <div class="chart-wrap">
      <div class="chart-title">Custo Total (km)</div>
      <canvas id="chart-cost"></canvas>
    </div>
    <div class="chart-wrap">
      <div class="chart-title">Nós Explorados</div>
      <canvas id="chart-nodes"></canvas>
    </div>
    <div class="chart-wrap">
      <div class="chart-title">Tempo de Voo (min)</div>
      <canvas id="chart-time"></canvas>
    </div>
  `;

  html += `
    <div class="result-section-label">Análise</div>
    <div class="metrics-analysis">
      <p>O melhor algoritmo foi <strong>${best.algorithm}</strong> com <strong>${fmtKm(best.cost)}</strong> e ${fmtMinutes(best.flight_time_min)} de voo.</p>
      ${worstPct > 0 ? `<p>O pior foi <strong>${worst.algorithm}</strong>, ${worstPct}% acima do óptimo.</p>` : ''}
      ${optimalList ? `<p>Garantem solução óptima: <strong>${optimalList}</strong>.</p>` : ''}
      <p>O Greedy explora menos nós e calcula mais rápido, mas não garante a rota mínima. O A* usa a heurística MST para encontrar o óptimo com menos exploração que o BFS exaustivo.</p>
    </div>
  `;

  $panelAnalise.innerHTML = html;
}

// ── Build Chart.js charts (lazy, horizontal bars) ─────────────────────────

function _buildCharts(results) {
  if (typeof Chart === 'undefined') return;

  const sorted      = [...results].sort((a, b) => a.cost - b.cost);
  const best        = sorted[0];
  const fewestNodes = results.reduce((a, b) => a.nodes_expanded < b.nodes_expanded ? a : b);
  const shortName   = r => r.algorithm.split(' ')[0];
  const labels      = sorted.map(shortName);

  const GREEN  = 'rgba(39,166,68,0.85)';
  const BLUE   = 'rgba(94,106,210,0.75)';
  const CORAL  = 'rgba(252,120,64,0.75)';
  const PURPLE = 'rgba(110,100,200,0.75)';

  const costColors = sorted.map(r => r === best        ? GREEN : BLUE);
  const nodeColors = sorted.map(r => r === fewestNodes ? GREEN : CORAL);
  const timeColors = sorted.map(() => PURPLE);

  const baseOpts = {
    indexAxis: 'y',
    responsive: true,
    animation: { duration: 600 },
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#8b8f9a', font: { size: 10 } },
        grid:  { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#8b8f9a', font: { size: 10 } },
        grid:  { display: false },
      },
    },
  };

  destroyChart('cost');
  chartRegistry['cost'] = new Chart(document.getElementById('chart-cost'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: sorted.map(r => r.cost), backgroundColor: costColors, borderRadius: 4 }],
    },
    options: baseOpts,
  });

  destroyChart('nodes');
  chartRegistry['nodes'] = new Chart(document.getElementById('chart-nodes'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: sorted.map(r => r.nodes_expanded), backgroundColor: nodeColors, borderRadius: 4 }],
    },
    options: baseOpts,
  });

  destroyChart('time');
  chartRegistry['time'] = new Chart(document.getElementById('chart-time'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: sorted.map(r => r.flight_time_min), backgroundColor: timeColors, borderRadius: 4 }],
    },
    options: baseOpts,
  });
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  await initMap();

  const res = await fetch('/api/cities');
  state.allCities = await res.json();

  setCityData(state.allCities);
  buildCityList();
  validate();
}

init();
