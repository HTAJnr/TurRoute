# data/problem_model.py
from data.distances import get_distance

class TSPState:
    """
    Representa um estado no espaço de busca do Problema do Caixeiro Viajante.
    - current_city: cidade onde o agente está actualmente.
    - visited: frozenset com as cidades já visitadas.
    - cost: custo acumulado (distância percorrida até agora).
    - path: lista ordenada das cidades visitadas (incluindo a actual).
    """
    def __init__(self, current_city, visited, cost, path):
        self.current_city = current_city
        self.visited = visited          # frozenset
        self.cost = cost
        self.path = path[:]             # cópia defensiva

    def __eq__(self, other):
        if not isinstance(other, TSPState):
            return False
        return (self.current_city == other.current_city and
                self.visited == other.visited)

    def __hash__(self):
        return hash((self.current_city, self.visited))

    def __lt__(self, other):
        # Necessário para ordenar estados na fila de prioridade (UCS, A*)
        return self.cost < other.cost


class TSPProblem:
    """
    Define o problema TSP: visitar todas as cidades exactamente uma vez,
    partindo de uma cidade inicial, minimizando a distância total.
    """
    def __init__(self, city_names, start_city):
        self.city_names = city_names
        self.start_city = start_city
        self.all_cities = frozenset(city_names)

    def initial_state(self):
        """Retorna o estado inicial (apenas a cidade de partida foi visitada)."""
        return TSPState(
            current_city=self.start_city,
            visited=frozenset([self.start_city]),
            cost=0.0,
            path=[self.start_city]
        )

    def is_goal(self, state):
        """Objectivo: todas as cidades foram visitadas."""
        return len(state.visited) == len(self.city_names)

    def successors(self, state):
        """
        Gera os estados sucessores: viajar para qualquer cidade ainda não visitada.
        Cada sucessor tem custo actualizado e o novo caminho.
        """
        unvisited = self.all_cities - state.visited
        for next_city in unvisited:
            step_cost = get_distance(state.current_city, next_city)
            new_cost = state.cost + step_cost
            new_path = state.path + [next_city]
            new_visited = state.visited.union({next_city})
            yield TSPState(next_city, new_visited, new_cost, new_path)

    def path_cost(self, path):
        """
        Calcula o custo total de um caminho (lista de cidades).
        Útil para validar a solução final.
        """
        total = 0.0
        for i in range(len(path) - 1):
            total += get_distance(path[i], path[i+1])
        return total