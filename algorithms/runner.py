from data.problem_model import TSPProblem
from algorithms.bfs import run_bfs
from algorithms.dfs import run_dfs
from algorithms.greedy import run_greedy
from algorithms.astar import run_astar

BFS_CITY_LIMIT = 10


def run_all_algorithms(cities: list, start_city: str, selected_algorithms: list) -> list:
    problem = TSPProblem(cities, start_city)
    results = []
    bfs_blocked = len(cities) >= BFS_CITY_LIMIT

    for algo in selected_algorithms:
        if algo == "A*":
            results.append(run_astar(cities, start_city, problem))
        elif algo == "Greedy":
            results.append(run_greedy(cities, start_city, problem))
        elif algo == "DFS":
            results.append(run_dfs(cities, start_city, problem))
        elif algo == "BFS" and not bfs_blocked:
            results.append(run_bfs(cities, start_city, problem))

    return results
