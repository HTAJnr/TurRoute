import time
from data.distances import get_distance


def run_greedy(cities: list, start_city: str, problem=None) -> dict:
    t0 = time.time()
    unvisited = list(cities)
    unvisited.remove(start_city)
    path = [start_city]
    current = start_city
    nodes = 1

    while unvisited:
        nearest = min(unvisited, key=lambda c: get_distance(current, c))
        path.append(nearest)
        unvisited.remove(nearest)
        current = nearest
        nodes += 1

    cost = sum(get_distance(path[i], path[i + 1]) for i in range(len(path) - 1))

    return {
        "algorithm": "Greedy (Vizinho Mais Próximo)",
        "path": path,
        "cost": round(cost, 1),
        "nodes_expanded": nodes,
        "time_ms": round((time.time() - t0) * 1000, 2),
        "optimal": False,
    }
