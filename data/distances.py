# data/distances.py
import math
from data.cities import CITIES

def haversine(lat1, lon1, lat2, lon2):
    """
    Calcula a distância em quilómetros entre dois pontos na Terra
    usando a fórmula de Haversine.
    """
    R = 6371  # Raio médio da Terra em km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def get_distance(city1, city2):
    """Devolve a distância em km entre duas cidades."""
    lat1, lon1 = CITIES[city1]
    lat2, lon2 = CITIES[city2]
    return haversine(lat1, lon1, lat2, lon2)

def build_distance_matrix(city_names):
    """Constrói uma matriz de distâncias (km) entre todas as cidades."""
    n = len(city_names)
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i][j] = get_distance(city_names[i], city_names[j])
    return matrix