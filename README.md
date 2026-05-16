# TurRoute — Optimização de Rotas Turísticas em Moçambique

Sistema inteligente que calcula o circuito óptimo entre cidades de Moçambique usando algoritmos de busca (TSP). Projecto académico — ISCTEM 2026, Disciplina de Inteligência Artificial.

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
python app.py
```

Abre o browser em **http://localhost:8080**

## Estrutura do Projecto

```
TurRoute/
├── app.py                  # Servidor Flask (ponto de entrada)
├── data/
│   ├── cities.py           # 12 cidades com coordenadas lat/lon
│   ├── distances.py        # Distâncias geodésicas entre cidades
│   ├── problem_model.py    # TSPState e TSPProblem (Tarefa A)
│   └── mozambique_*.json   # GeoJSON do contorno e províncias
├── algorithms/
│   ├── greedy.py           # Vizinho mais próximo — O(N²), não óptimo
│   ├── bfs.py              # Busca em largura — garante óptimo (limite: 10 cidades)
│   ├── dfs.py              # Busca em profundidade — rápido, não óptimo
│   ├── astar.py            # A* com heurística MST (Prim) — óptimo
│   └── runner.py           # Orquestrador: corre os algoritmos seleccionados
└── ui/
    ├── index.html          # SPA principal
    ├── css/linear.css      # Design system Linear
    └── js/
        ├── map.js          # Mapa SVG, animação do avião
        └── app.js          # Lógica da aplicação, presets, fetch API
```

## API

| Método | Endpoint         | Descrição                         |
| ------ | ---------------- | --------------------------------- |
| GET    | `/api/cities`    | Lista das 12 cidades com lat/lon  |
| GET    | `/api/border`    | GeoJSON do contorno de Moçambique |
| GET    | `/api/provinces` | GeoJSON das províncias            |
| POST   | `/api/route`     | Calcula rota óptima               |

### POST `/api/route`

```json
{
  "cities": ["Maputo", "Inhambane", "Beira"],
  "start_city": "Maputo",
  "algorithm": "Todos"
}
```

`algorithm` pode ser `"Todos"`, `"A* (MST)"`, `"Greedy"`, `"BFS"`, ou `"DFS"`.

## Algoritmos

| Algoritmo | Óptimo | Complexidade | Limite       |
| --------- | ------ | ------------ | ------------ |
| Greedy    | Não    | O(N²)        | Sem limite   |
| BFS       | Sim\*  | O(N!)        | ≤ 10 cidades |
| DFS       | Não    | O(N!)        | 500 000 nós  |
| A\* (MST) | Sim    | O(N² · 2ᴺ)   | Sem limite   |

\* BFS garante óptimo em nº de passos; com distâncias variáveis, A\* é o verdadeiro óptimo.

## Presets

| Preset       | Cidades                                                               |
| ------------ | --------------------------------------------------------------------- |
| Sul          | Maputo, Inhambane, Vilanculos                                         |
| Centro-Norte | Beira, Chimoio, Quelimane, Tete, Nampula                              |
| Completo     | Maputo, Inhambane, Vilanculos, Beira, Quelimane, Tete, Nampula, Pemba |
