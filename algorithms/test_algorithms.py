"""
test_algorithms.py — Testa os dois cenários obrigatórios do enunciado.

Cenário 1 — Circuito Sul (4 cidades): Maputo, Inhambane, Vilanculos, Beira
Cenário 2 — Circuito Completo (8 cidades): Maputo, Inhambane, Vilanculos, Beira,
            Chimoio, Tete, Nampula, Pemba

Executa com: python algorithms/test_algorithms.py  (raiz do projecto TurRoute)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from algorithms.runner import run_all_algorithms

CENARIO_1 = {
    "nome": "Circuito Sul — 4 cidades",
    "cidades": ["Maputo", "Inhambane", "Vilanculos", "Beira"],
    "partida": "Maputo",
    "algoritmos": ["A*", "Greedy", "BFS", "DFS"],
}

CENARIO_2 = {
    "nome": "Circuito Completo — 8 cidades",
    "cidades": ["Maputo", "Inhambane", "Vilanculos", "Beira", "Chimoio", "Tete", "Nampula", "Pemba"],
    "partida": "Maputo",
    "algoritmos": ["A*", "Greedy", "DFS"],  # BFS omitido: demasiadas cidades
}


def run_cenario(c):
    print(f"\n{'='*60}")
    print(f"  {c['nome']}")
    print(f"  Cidades: {', '.join(c['cidades'])}")
    print(f"  Partida: {c['partida']}")
    print(f"{'='*60}")
    print(f"{'Algoritmo':<30} {'Custo (km)':<14} {'Nós':<10} {'Tempo (ms)':<12} {'Óptimo'}")
    print(f"{'-'*30} {'-'*14} {'-'*10} {'-'*12} {'-'*6}")

    results = run_all_algorithms(c["cidades"], c["partida"], c["algoritmos"])

    for r in results:
        warning = r.get("_warning", "")
        note = f" ⚠ {warning}" if warning else ""
        print(
            f"{r['algorithm']:<30} {r['cost']:<14.1f} {r['nodes_expanded']:<10} "
            f"{r['time_ms']:<12.2f} {'Sim' if r['optimal'] else 'Não'}{note}"
        )
        print(f"  Rota: {' -> '.join(r['path'])}")

    for r in results:
        assert set(r["path"]) == set(c["cidades"]), f"{r['algorithm']}: cidades em falta na rota"
        assert r["path"][0] == c["partida"], f"{r['algorithm']}: não parte de {c['partida']}"
        required_keys = {"algorithm", "path", "cost", "nodes_expanded", "time_ms", "optimal"}
        assert required_keys.issubset(r.keys()), f"{r['algorithm']}: chaves em falta"

    print(f"\n  ✓ Todas as validações passaram para '{c['nome']}'")


if __name__ == "__main__":
    run_cenario(CENARIO_1)
    run_cenario(CENARIO_2)
    print(f"\n{'='*60}")
    print("  Todos os cenários concluídos com sucesso.")
    print(f"{'='*60}\n")
