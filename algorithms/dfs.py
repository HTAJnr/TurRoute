import time

MAX_NODES = 500_000


def run_dfs(cities: list, start_city: str, problem) -> dict:
    t0 = time.time()
    initial = problem.initial_state()
    stack = [initial]
    visited = set()
    best = None
    nodes = 0
    truncated = False

    while stack:
        state = stack.pop()
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
            stack.append(successor)

    if best is None:
        best = initial

    return {
        "algorithm": "DFS",
        "path": best.path,
        "cost": round(best.cost, 1),
        "nodes_expanded": nodes,
        "time_ms": round((time.time() - t0) * 1000, 2),
        "optimal": False,
    }
