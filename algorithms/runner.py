from data.problem_model import TSPProblem
from algorithms.bfs import run_bfs
from algorithms.dfs import run_dfs
from algorithms.greedy import run_greedy
from algorithms.astar import run_astar

BFS_CITY_LIMIT = 10


def run_all_algorithms(cities: list, start_city: str, selected_algorithms: list) -> list:
    problem = TSPProblem(cities, start_city)
    results = []

    for algo in selected_algorithms:
        if algo == "A*":
            results.append(run_astar(cities, start_city, problem))
        elif algo == "Greedy":
            results.append(run_greedy(cities, start_city, problem))
        elif algo == "DFS":
            results.append(run_dfs(cities, start_city, problem))
        elif algo == "BFS":
            results.append(_run_bfs_guarded(cities, start_city, problem))

    return results


def _run_bfs_guarded(cities, start_city, problem):
    if len(cities) > BFS_CITY_LIMIT:
        greedy = run_greedy(cities, start_city)
        return {
            "algorithm": "BFS",
            "path": greedy["path"],
            "cost": greedy["cost"],
            "nodes_expanded": 0,
            "time_ms": 0.0,
            "optimal": False,
            "_warning": f"BFS ignorado: {len(cities)} cidades excedem o limite de {BFS_CITY_LIMIT}.",
        }
    return run_bfs(cities, start_city, problem)
