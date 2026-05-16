import math
from data.distances import get_distance

# STUB — substituir pelas implementações reais da Tarefa D
def run_all_algorithms(cities: list, start_city: str, selected_algorithms: list) -> list:
    """
    Orquestrador dos algoritmos de busca.

    Retorna lista de dicionários, um por algoritmo, com o formato contratual:
        algorithm, path, cost, nodes_expanded, time_ms, optimal
    """
    def _greedy_path(cities, start):
        unvisited = list(cities)
        unvisited.remove(start)
        path = [start]
        current = start
        while unvisited:
            nearest = min(unvisited, key=lambda c: get_distance(current, c))
            path.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        return path

    path = _greedy_path(cities, start_city)
    cost = sum(get_distance(path[i], path[i + 1]) for i in range(len(path) - 1))

    n = len(cities)
    nodes_astar = n * n
    nodes_greedy = n
    nodes_bfs = sum(math.perm(n, k) for k in range(1, n + 1))
    nodes_dfs = max(n * (n - 1) * 2, n + 1)

    _stub_results = {
        "A*": {
            "algorithm": "A* (MST)",
            "path": path,
            "cost": round(cost, 1),
            "nodes_expanded": nodes_astar,
            "time_ms": round(nodes_astar * 0.6, 1),
            "optimal": True
        },
        "Greedy": {
            "algorithm": "Greedy (Vizinho Mais Próximo)",
            "path": path,
            "cost": round(cost * 1.12, 1),
            "nodes_expanded": nodes_greedy,
            "time_ms": round(nodes_greedy * 0.15, 2),
            "optimal": False
        },
        "BFS": {
            "algorithm": "BFS",
            "path": path,
            "cost": round(cost, 1),
            "nodes_expanded": nodes_bfs,
            "time_ms": round(nodes_bfs * 0.5, 1),
            "optimal": True
        },
        "DFS": {
            "algorithm": "DFS",
            "path": path,
            "cost": round(cost * 1.30, 1),
            "nodes_expanded": nodes_dfs,
            "time_ms": round(nodes_dfs * 0.3, 1),
            "optimal": False
        }
    }

    return [_stub_results[k] for k in selected_algorithms if k in _stub_results]
