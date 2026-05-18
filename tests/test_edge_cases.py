"""
test_edge_cases.py — Casos extremos e comportamento com inputs incomuns.

Executa com: pytest tests/ -v  (raiz do projecto TurRoute)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from data.distances import get_distance
from algorithms.runner import run_all_algorithms


# ── Distâncias ────────────────────────────────────────────────────────────

CITIES_SAMPLE = ["Maputo", "Beira", "Nampula", "Pemba", "Lichinga"]


@pytest.mark.parametrize("a,b", [
    ("Maputo", "Beira"),
    ("Nampula", "Pemba"),
    ("Tete", "Quelimane"),
    ("Inhambane", "Vilanculos"),
    ("Chimoio", "Lichinga"),
])
def test_distancia_simetrica(a, b):
    assert abs(get_distance(a, b) - get_distance(b, a)) < 0.01, (
        f"get_distance('{a}','{b}') != get_distance('{b}','{a}')"
    )


@pytest.mark.parametrize("city", ["Maputo", "Beira", "Nampula"])
def test_distancia_consigo_mesmo(city):
    assert get_distance(city, city) == 0, f"get_distance('{city}','{city}') deve ser 0"


def test_distancia_positiva():
    assert get_distance("Maputo", "Beira") > 0


# ── 2 cidades — mínimo possível ───────────────────────────────────────────

@pytest.mark.parametrize("algo", ["A*", "Greedy", "DFS"])
def test_duas_cidades(algo):
    cities = ["Maputo", "Beira"]
    results = run_all_algorithms(cities, "Maputo", [algo])
    assert len(results) == 1
    r = results[0]
    assert set(r["path"]) == set(cities)
    assert r["path"][0] == "Maputo"
    assert r["cost"] > 0


# ── BFS com muitas cidades ────────────────────────────────────────────────

def test_bfs_limite_cidades():
    cities = ["Maputo", "Inhambane", "Vilanculos", "Beira", "Chimoio",
              "Quelimane", "Tete", "Nampula", "Nacala", "Lichinga", "Pemba"]
    assert len(cities) == 11  # > BFS_CITY_LIMIT (10)
    results = run_all_algorithms(cities, "Maputo", ["BFS"])
    assert len(results) == 1
    r = results[0]
    assert "_warning" in r, "BFS deve incluir campo _warning quando excede o limite"
    assert set(r["path"]) == set(cities)


# ── Todas as cidades visitadas ────────────────────────────────────────────

@pytest.mark.parametrize("algo,cities,start", [
    ("Greedy", ["Maputo", "Beira", "Nampula"], "Maputo"),
    ("A*",     ["Beira", "Tete", "Quelimane"], "Beira"),
    ("DFS",    ["Maputo", "Inhambane", "Vilanculos", "Beira"], "Inhambane"),
])
def test_todas_cidades_no_path(algo, cities, start):
    results = run_all_algorithms(cities, start, [algo])
    r = results[0]
    assert set(r["path"]) == set(cities), (
        f"{algo}: path contém {set(r['path'])} mas devia conter {set(cities)}"
    )


# ── Cidade de partida diferente ───────────────────────────────────────────

@pytest.mark.parametrize("start", ["Maputo", "Beira", "Nampula"])
def test_partida_diferente(start):
    cities = ["Maputo", "Beira", "Nampula", "Pemba"]
    results = run_all_algorithms(cities, start, ["Greedy"])
    r = results[0]
    assert r["path"][0] == start, f"Deve partir de {start}"
    assert set(r["path"]) == set(cities)


# ── Consistência entre execuções ──────────────────────────────────────────

def test_greedy_determinista():
    cities = ["Maputo", "Inhambane", "Vilanculos", "Beira"]
    r1 = run_all_algorithms(cities, "Maputo", ["Greedy"])[0]
    r2 = run_all_algorithms(cities, "Maputo", ["Greedy"])[0]
    assert r1["path"] == r2["path"]
    assert r1["cost"] == r2["cost"]
