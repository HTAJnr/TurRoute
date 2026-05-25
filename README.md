# TurRoute — Optimização de Rotas Turísticas em Moçambique

<p align="center">
  <img src="TurRoute_Logo.png" alt="TurRoute Logo" width="200"/>
</p>

Sistema inteligente que calcula o circuito óptimo entre cidades de Moçambique usando algoritmos de busca (TSP — Problema do Caixeiro Viajante). Projecto académico — ISCTEM 2026, Disciplina de Inteligência Artificial, Grupo 1.

## O Problema

Uma agência de turismo quer organizar circuitos entre cidades servidas pela **LAM (Linhas Aéreas de Moçambique)**. Com 11 cidades há 3.628.800 rotas possíveis — é necessário um algoritmo inteligente para encontrar o circuito óptimo sem testar todas.

![Rede de rotas LAM em Moçambique](Mapa%20de%20rotas%28LAM%29%20mocambique.png)

*Rede de voos LAM usada como base para as rotas directas do sistema. Hubs principais: Maputo (sul), Beira (centro), Nampula (norte).*

## Pré-requisitos

- Python 3.9 ou superior
- pip

## Instalação

```bash
pip install flask
```

> Todos os outros módulos (`heapq`, `collections`, `time`, `json`) são da biblioteca padrão do Python.

## Executar

```bash
cd TurRoute/
python app.py
```

Abre o browser em **http://localhost:8080**

## Testes

```bash
# Testes dos algoritmos com saída legível
python -X utf8 algorithms/test_algorithms.py

# Todos os testes automatizados (48 testes)
python -m pytest tests/ -v
```

**Resultados esperados:** 48 testes a passar ✅

## Estrutura do Projecto

```
TurRoute/
├── app.py                        # Servidor Flask + API REST + cálculo flight_time_min
├── algorithms/
│   ├── greedy.py                 # Vizinho Mais Próximo — O(N²), não óptimo
│   ├── bfs.py                    # Busca em Largura — óptimo, limitado a ≤10 cidades
│   ├── dfs.py                    # Busca em Profundidade — rápido, não óptimo
│   ├── astar.py                  # A* com heurística MST (Prim) — óptimo garantido
│   ├── runner.py                 # Dispatcher: chama o(s) algoritmo(s) seleccionado(s)
│   └── test_algorithms.py        # Testes dos 2 cenários obrigatórios
├── data/
│   ├── cities.py                 # 11 cidades com coordenadas lat/lon reais
│   ├── distances.py              # Distâncias geodésicas (fórmula Haversine)
│   ├── problem_model.py          # TSPState e TSPProblem — modelação formal do TSP
│   ├── routes.py                 # Rede de voos directos LAM
│   └── mozambique_*.json         # GeoJSON do contorno e províncias
├── ui/
│   ├── index.html                # SPA principal com Chart.js
│   ├── css/linear.css            # Design system + estilos métricas
│   └── js/
│       ├── map.js                # Mapa SVG de Moçambique + animação do avião
│       └── app.js                # Lógica: presets, API fetch, resultados, gráficos
└── tests/
    ├── test_integration.py       # 14 testes end-to-end
    ├── test_edge_cases.py        # 17 testes de casos extremos
    └── test_metrics.py           # 15 testes de métricas e formatação
```

## Algoritmos

| Algoritmo | Óptimo | Complexidade | Limite | Melhor para |
| --------- | ------ | ------------ | ------ | ----------- |
| Greedy | Não | O(N²) | Sem limite | Circuitos grandes, resposta rápida |
| BFS | Sim\* | O(N!) | ≤ 10 cidades | Circuitos pequenos, exploração completa |
| DFS | Não | O(N!) | 500 000 nós | Exploração com pouca memória |
| A\* (MST) | Sim | O(N² · 2ᴺ) | ≤ 12 cidades | Óptimo garantido, eficiente |

\* BFS garante óptimo em nº de passos; com distâncias variáveis, A\* é o verdadeiro óptimo.

### Heurística do A*

O A* usa a **Minimum Spanning Tree (MST)** das cidades ainda não visitadas como estimativa do custo restante, calculada pelo algoritmo de Prim. Esta heurística é **admissível** — nunca sobrestima — porque qualquer rota que visite todas as cidades restantes tem de as conectar, e a MST é o custo mínimo absoluto de conexão. Uma heurística admissível garante que o A* encontra sempre a solução óptima.

## Resultados Experimentais

### Circuito Sul — 4 cidades (Maputo, Inhambane, Vilanculos, Beira)

| Algoritmo | Rota | Custo | Tempo Voo | Nós Explorados |
| --------- | ---- | ----- | --------- | -------------- |
| A\* (MST) | Maputo → Inhambane → Vilanculos → Beira | **819.8 km** | 3h 5min | 4 |
| Greedy | Maputo → Inhambane → Vilanculos → Beira | **819.8 km** | 3h 5min | 4 |
| BFS | Maputo → Inhambane → Vilanculos → Beira | **819.8 km** | 3h 5min | 16 |
| DFS | Maputo → Inhambane → Beira → Vilanculos | 1.063 km | 3h 10min | 16 |

### Circuito Completo — 11 cidades

| Algoritmo | Custo | Tempo Voo | Nós Explorados |
| --------- | ----- | --------- | -------------- |
| A\* (MST) | **2.951 km** | 9h 14min | **21** |
| Greedy | 3.165 km | 8h 20min | 11 |
| BFS | — (bloqueado >10 cidades) | — | 0 |
| DFS | 5.524 km | 14h 6min | 23.051 |

*Tempo de voo = circuito completo incluindo regresso à partida, a 500 km/h (velocidade de cruzeiro LAM).*

## API

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| GET | `/api/cities` | Lista das 11 cidades com lat/lon |
| GET | `/api/border` | GeoJSON do contorno de Moçambique |
| GET | `/api/provinces` | GeoJSON das províncias |
| POST | `/api/route` | Calcula rota óptima |

### POST `/api/route`

```json
{
  "cities": ["Maputo", "Inhambane", "Beira"],
  "start_city": "Maputo",
  "algorithm": "Todos"
}
```

`algorithm` aceita: `"Todos"`, `"A* (MST)"`, `"Greedy"`, `"BFS"`, `"DFS"`.

**Resposta:**
```json
{
  "results": [...],
  "best": { "algorithm": "A*", "path": [...], "cost": 819.8, "flight_time_min": 185 },
  "segments": [{ "from": "Maputo", "to": "Inhambane", "direct_flight": true }]
}
```

**Erros:**
- `HTTP 400` `{"error": "Selecione pelo menos 2 cidades"}` — menos de 2 cidades
- `HTTP 400` `{"error": "Cidade de partida inválida"}` — partida não está nas cidades seleccionadas

## Presets

| Preset | Cidades | Partida |
| ------ | ------- | ------- |
| Sul | Maputo, Inhambane, Vilanculos | Maputo |
| Centro-Norte | Beira, Chimoio, Quelimane, Tete, Nampula | Beira |
| Completo | Maputo, Inhambane, Vilanculos, Beira, Quelimane, Tete, Nampula, Pemba, Chimoio, Nacala, Lichinga | Maputo |

## Cenários de Teste

O ficheiro [`cenarios_de_teste.md`](cenarios_de_teste.md) documenta 12 cenários de teste com resultados reais:

| # | Cenário | Foco |
| - | ------- | ---- |
| 1 | Circuito Sul — todos os algoritmos | Validade e qualidade de rotas |
| 2 | Troca da cidade de partida | Sensibilidade do Greedy à partida |
| 3 | Rota com segmentos sem voo LAM directo | Badge "escala" correcto |
| 4 | Circuito mínimo (2 cidades) | Casos extremos |
| 5 | Circuito máximo (11 cidades) | BFS bloqueado com aviso |
| 6 | Presets Sul / Centro-Norte / Completo | Cidades carregadas correctamente |
| 7 | Algoritmo único vs Todos | UI adapta painel de resultados |
| 8 | A* vs Greedy (qualidade vs velocidade) | Trade-off demonstrado |
| 9 | Input inválido: partida fora da selecção | HTTP 400 correcto |
| 10 | Input inválido: menos de 2 cidades | Botão desactivado na UI |
| 11 | BFS com 11+ cidades | Fallback Greedy + campo `_warning` |
| 12 | Animação com rota alternativa | Clicar algoritmo → rota muda |

## Cidades Disponíveis

| Cidade | Região | Coordenadas |
| ------ | ------ | ----------- |
| Maputo | Sul | -25.9667, 32.5833 |
| Inhambane | Sul | -23.8650, 35.3833 |
| Vilanculos | Sul | -21.9833, 35.3167 |
| Beira | Centro | -19.8436, 34.8389 |
| Chimoio | Centro | -19.1167, 33.4833 |
| Quelimane | Centro | -17.8786, 36.8881 |
| Tete | Centro | -16.1564, 33.5867 |
| Nampula | Norte | -15.1167, 39.2667 |
| Nacala | Norte | -14.5422, 40.6783 |
| Lichinga | Norte | -13.3147, 35.2392 |
| Pemba | Norte | -12.9667, 40.5167 |

## Dependências

```
flask       # servidor web
pytest      # testes automatizados (opcional)
```

Chart.js carregado via CDN — não requer instalação local.
