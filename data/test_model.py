# test_model.py
from data.cities import CITY_NAMES
from data.distances import get_distance
from data.problem_model import TSPProblem, TSPState

def test():
    print("=" * 50)
    print("Teste completo - TSP Turismo Moçambique")
    print("=" * 50)

    # 1. Testar número de cidades
    print(f"\n1. Cidades carregadas: {len(CITY_NAMES)}")
    assert len(CITY_NAMES) == 12, "Deveriam ser 12 cidades"
    print("   ✅ OK")

    # 2. Testar distância
    dist = get_distance("Maputo", "Beira")
    print(f"\n2. Distância Maputo → Beira: {dist:.2f} km")
    assert dist > 0
    print("   ✅ OK")

    # 3. Criar problema
    problema = TSPProblem(CITY_NAMES, "Maputo")
    estado_inicial = problema.initial_state()
    print(f"\n3. Estado inicial: {estado_inicial.current_city}")
    assert estado_inicial.current_city == "Maputo"
    print("   ✅ OK")

    # 4. Testar sucessores
    sucessores = list(problema.successors(estado_inicial))
    print(f"\n4. Número de sucessores: {len(sucessores)}")
    assert len(sucessores) == 11
    print("   ✅ OK")

    # 5. Testar igualdade
    s1 = TSPState("Maputo", frozenset(["Maputo"]), 0, ["Maputo"])
    s2 = TSPState("Maputo", frozenset(["Maputo"]), 100, ["Maputo"])
    assert s1 == s2
    print("\n5. Teste de igualdade: ✅ OK")

    # 6. Testar objectivo
    todas = frozenset(CITY_NAMES)
    estado_final = TSPState("Pemba", todas, 2000, CITY_NAMES)
    assert problema.is_goal(estado_final) == True
    print("\n6. Teste de objectivo: ✅ OK")

    print("\n" + "=" * 50)
    print("✅ TODOS OS TESTES PASSARAM!")
    print("=" * 50)

if __name__ == "__main__":
    test()