"""
test_integration.py — Testes end-to-end usando run_all_algorithms directamente.

Executa com: pytest tests/ -v  (raiz do projecto TurRoute)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from algorithms.runner import run_all_algorithms


# ── Helpers ───────────────────────────────────────────────────────────────

def assert_result_valid(r, cities, start_city):
    assert set(r["path"]) == set(cities),        f"{r['algorithm']}: cidades em falta na rota"
    assert r["path"][0] == start_city,            f"{r['algorithm']}: não parte de {start_city}"
    assert r["cost"] > 0,                         f"{r['algorithm']}: custo deve ser positivo"
    assert r["nodes_expanded"] >= 0,              f"{r['algorithm']}: nós explorados inválidos"
    assert r["time_ms"] >= 0,                     f"{r['algorithm']}: tempo inválido"
    required = {"algorithm", "path", "cost", "nodes_expanded", "time_ms", "optimal"}
    assert required.issubset(r.keys()),           f"{r['algorithm']}: chaves em falta — {required - r.keys()}"


# ── Cenário 1 — Circuito Sul (4 cidades) ─────────────────────────────────

CITIES_SUL    = ["Maputo", "Inhambane", "Vilanculos", "Beira"]
START_SUL     = "Maputo"
ALGOS_SUL     = ["A*", "Greedy", "BFS", "DFS"]


@pytest.mark.parametrize("algo", ALGOS_SUL)
def test_cenario_sul_rota_valida(algo):
    results = run_all_algorithms(CITIES_SUL, START_SUL, [algo])
    assert len(results) == 1
    assert_result_valid(results[0], CITIES_SUL, START_SUL)


def test_cenario_sul_astar_menor_ou_igual_greedy():
    results = run_all_algorithms(CITIES_SUL, START_SUL, ["A*", "Greedy"])
    astar  = next(r for r in results if r["algorithm"] == "A* (MST)")
    greedy = next(r for r in results if "Greedy" in r["algorithm"])
    assert astar["cost"] <= greedy["cost"], (
        f"A* ({astar['cost']:.1f} km) deve ser <= Greedy ({greedy['cost']:.1f} km)"
    )


def test_cenario_sul_astar_optimal():
    results = run_all_algorithms(CITIES_SUL, START_SUL, ["A*"])
    assert results[0]["optimal"] is True


def test_cenario_sul_greedy_nao_optimal():
    results = run_all_algorithms(CITIES_SUL, START_SUL, ["Greedy"])
    assert results[0]["optimal"] is False


def test_cenario_sul_todos_algoritmos():
    results = run_all_algorithms(CITIES_SUL, START_SUL, ALGOS_SUL)
    assert len(results) == 4
    for r in results:
        assert_result_valid(r, CITIES_SUL, START_SUL)


# ── Cenário 2 — Circuito Centro-Norte (5 cidades) ────────────────────────

CITIES_CENTRO = ["Beira", "Chimoio", "Tete", "Quelimane", "Nampula"]
START_CENTRO  = "Beira"


def test_cenario_centro_norte_astar():
    results = run_all_algorithms(CITIES_CENTRO, START_CENTRO, ["A*"])
    assert_result_valid(results[0], CITIES_CENTRO, START_CENTRO)
    assert results[0]["optimal"] is True


def test_cenario_centro_norte_greedy():
    results = run_all_algorithms(CITIES_CENTRO, START_CENTRO, ["Greedy"])
    assert_result_valid(results[0], CITIES_CENTRO, START_CENTRO)


def test_cenario_centro_norte_astar_vs_greedy():
    results = run_all_algorithms(CITIES_CENTRO, START_CENTRO, ["A*", "Greedy"])
    astar  = next(r for r in results if r["algorithm"] == "A* (MST)")
    greedy = next(r for r in results if "Greedy" in r["algorithm"])
    assert astar["cost"] <= greedy["cost"]


# ── Cenário 3 — Circuito Completo (8 cidades) ─────────────────────────────

CITIES_COMP = ["Maputo", "Inhambane", "Vilanculos", "Beira", "Chimoio", "Tete", "Nampula", "Pemba"]
START_COMP  = "Maputo"


def test_cenario_completo_greedy_rapido():
    import time
    t0 = time.time()
    results = run_all_algorithms(CITIES_COMP, START_COMP, ["Greedy"])
    elapsed = time.time() - t0
    assert elapsed < 1.0, f"Greedy demorou {elapsed:.2f}s — deve ser < 1s"
    assert_result_valid(results[0], CITIES_COMP, START_COMP)


def test_cenario_completo_astar_termina():
    import time
    t0 = time.time()
    results = run_all_algorithms(CITIES_COMP, START_COMP, ["A*"])
    elapsed = time.time() - t0
    assert elapsed < 30.0, f"A* demorou {elapsed:.2f}s — deve ser < 30s"
    assert_result_valid(results[0], CITIES_COMP, START_COMP)
    assert results[0]["optimal"] is True


def test_cenario_completo_dfs():
    results = run_all_algorithms(CITIES_COMP, START_COMP, ["DFS"])
    assert_result_valid(results[0], CITIES_COMP, START_COMP)
