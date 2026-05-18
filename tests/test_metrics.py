"""
test_metrics.py — Valida a lógica de cálculo de métricas comparativas.

Executa com: pytest tests/ -v  (raiz do projecto TurRoute)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest


# ── Dados de exemplo ──────────────────────────────────────────────────────

SAMPLE_RESULTS = [
    {
        "algorithm": "A* (MST)",
        "path": ["Maputo", "Inhambane", "Vilanculos", "Beira"],
        "cost": 760.0,
        "nodes_expanded": 14,
        "time_ms": 3.0,
        "flight_time_min": 104.4,
        "optimal": True,
    },
    {
        "algorithm": "Greedy (Vizinho Mais Próximo)",
        "path": ["Maputo", "Inhambane", "Vilanculos", "Beira"],
        "cost": 940.0,
        "nodes_expanded": 4,
        "time_ms": 0.3,
        "flight_time_min": 128.4,
        "optimal": False,
    },
    {
        "algorithm": "DFS",
        "path": ["Maputo", "Beira", "Vilanculos", "Inhambane"],
        "cost": 1050.0,
        "nodes_expanded": 24,
        "time_ms": 2.0,
        "flight_time_min": 142.8,
        "optimal": False,
    },
    {
        "algorithm": "BFS",
        "path": ["Maputo", "Inhambane", "Vilanculos", "Beira"],
        "cost": 760.0,
        "nodes_expanded": 64,
        "time_ms": 12.0,
        "flight_time_min": 104.4,
        "optimal": True,
    },
]


# ── Lógica de métricas (equivalente Python ao que o JS faz) ──────────────

def get_best(results):
    return min(results, key=lambda r: r["cost"])

def get_fastest(results):
    return min(results, key=lambda r: r["flight_time_min"])

def get_fewest_nodes(results):
    return min(results, key=lambda r: r["nodes_expanded"])

def pct_delta(r, best):
    if r["cost"] == best["cost"]:
        return 0.0
    return (r["cost"] - best["cost"]) / best["cost"] * 100

def fmt_minutes(mins):
    h = int(mins // 60)
    m = round(mins % 60)
    return f"{h}h {m}min" if h > 0 else f"{m}min"


# ── Testes ────────────────────────────────────────────────────────────────

def test_identifica_melhor_algoritmo():
    best = get_best(SAMPLE_RESULTS)
    assert best["algorithm"] in ("A* (MST)", "BFS")
    assert best["cost"] == 760.0


def test_identifica_mais_rapido_de_calcular():
    fastest = get_fastest(SAMPLE_RESULTS)
    assert fastest["algorithm"] in ("A* (MST)", "BFS")
    assert fastest["flight_time_min"] == 104.4


def test_identifica_menos_nos():
    fewest = get_fewest_nodes(SAMPLE_RESULTS)
    assert "Greedy" in fewest["algorithm"]
    assert fewest["nodes_expanded"] == 4


def test_percentagem_delta_melhor_e_zero():
    best = get_best(SAMPLE_RESULTS)
    assert pct_delta(best, best) == 0.0


def test_percentagem_delta_greedy():
    best   = get_best(SAMPLE_RESULTS)
    greedy = next(r for r in SAMPLE_RESULTS if "Greedy" in r["algorithm"])
    delta  = pct_delta(greedy, best)
    assert abs(delta - 23.68) < 0.1, f"Delta esperado ~23.68%, obtido {delta:.2f}%"


def test_percentagem_delta_pior():
    best  = get_best(SAMPLE_RESULTS)
    worst = max(SAMPLE_RESULTS, key=lambda r: r["cost"])
    delta = pct_delta(worst, best)
    assert delta > 0


def test_fmt_minutes_horas():
    assert fmt_minutes(90) == "1h 30min"
    assert fmt_minutes(60) == "1h 0min"
    assert fmt_minutes(125) == "2h 5min"


def test_fmt_minutes_so_minutos():
    assert fmt_minutes(45) == "45min"
    assert fmt_minutes(0)  == "0min"


def test_sorted_por_custo():
    sorted_r = sorted(SAMPLE_RESULTS, key=lambda r: r["cost"])
    assert sorted_r[0]["cost"] <= sorted_r[-1]["cost"]
    assert sorted_r[0]["cost"] == 760.0


def test_optimais():
    optimais = [r for r in SAMPLE_RESULTS if r["optimal"]]
    nomes = [r["algorithm"] for r in optimais]
    assert "A* (MST)" in nomes
    assert "BFS" in nomes
    assert len(optimais) == 2


def test_flight_time_min_positivo():
    for r in SAMPLE_RESULTS:
        assert r["flight_time_min"] > 0


def test_tabela_tem_todas_colunas():
    required = {"algorithm", "cost", "nodes_expanded", "flight_time_min", "optimal", "path"}
    for r in SAMPLE_RESULTS:
        assert required.issubset(r.keys()), f"Chaves em falta: {required - r.keys()}"
