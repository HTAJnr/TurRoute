import time
import heapq
from data.distances import get_distance


def _mst_cost(unvisited: frozenset, current_city: str) -> float:
    """Prim's MST over unvisited cities + current city — admissible lower bound."""
    all_nodes = list(unvisited) + [current_city]
    if len(all_nodes) <= 1:
        return 0.0

    in_mst = {current_city}
    min_edge = {n: get_distance(current_city, n) for n in all_nodes if n != current_city}
    total = 0.0

    while min_edge:
        best_node = min(min_edge, key=min_edge.get)
        best_cost = min_edge.pop(best_node)
        in_mst.add(best_node)
        total += best_cost
        for n in min_edge:
            d = get_distance(best_node, n)
            if d < min_edge[n]:
                min_edge[n] = d

    return total


def run_astar(cities: list, start_city: str, problem) -> dict:
    t0 = time.time()
    initial = problem.initial_state()
    all_cities = frozenset(cities)

    unvisited0 = all_cities - frozenset([start_city])
    h0 = _mst_cost(unvisited0, start_city)

    counter = 0
    heap = [(initial.cost + h0, counter, initial)]
    best_g = {}
    nodes = 0

    while heap:
        f, _, state = heapq.heappop(heap)
        nodes += 1

        key = (state.current_city, state.visited)
        if key in best_g and best_g[key] <= state.cost:
            continue
        best_g[key] = state.cost

        if problem.is_goal(state):
            return {
                "algorithm": "A* (MST)",
                "path": state.path,
                "cost": round(state.cost, 1),
                "nodes_expanded": nodes,
                "time_ms": round((time.time() - t0) * 1000, 2),
                "optimal": True,
            }

        for successor in problem.successors(state):
            s_key = (successor.current_city, successor.visited)
            if s_key in best_g and best_g[s_key] <= successor.cost:
                continue
            unvisited = all_cities - successor.visited
            h = _mst_cost(unvisited, successor.current_city)
            counter += 1
            heapq.heappush(heap, (successor.cost + h, counter, successor))

    return {
        "algorithm": "A* (MST)",
        "path": [start_city],
        "cost": 0.0,
        "nodes_expanded": nodes,
        "time_ms": round((time.time() - t0) * 1000, 2),
        "optimal": False,
    }
