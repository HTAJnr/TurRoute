import time
from collections import deque

MAX_NODES = 500_000


def run_bfs(cities: list, start_city: str, problem) -> dict:
    t0 = time.time()
    initial = problem.initial_state()
    queue = deque([initial])
    visited = set()
    best = None
    nodes = 0
    truncated = False

    while queue:
        state = queue.popleft()
        nodes += 1

        if nodes > MAX_NODES:
            truncated = True
            break

        key = (state.current_city, state.visited)
        if key in visited:
            continue
        visited.add(key)

        if problem.is_goal(state):
            if best is None or state.cost < best.cost:
                best = state
            continue

        for successor in problem.successors(state):
            queue.append(successor)

    if best is None:
        best = initial

    return {
        "algorithm": "BFS",
        "path": best.path,
        "cost": round(best.cost, 1),
        "nodes_expanded": nodes,
        "time_ms": round((time.time() - t0) * 1000, 2),
        "optimal": not truncated,
    }
