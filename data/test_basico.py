# test_basico.py
from data.cities import CITIES, CITY_NAMES
from data.distances import get_distance, build_distance_matrix

def test_cidades():
    print("=" * 60)
    print("Teste básico: cities.py e distances.py")
    print("=" * 60)

    # 1. Verificar número de cidades
    print(f"\n1. Cidades carregadas: {len(CITY_NAMES)}")
    print(f"   Lista: {CITY_NAMES}")
    assert len(CITY_NAMES) == 12, "Deveriam ser 12 cidades"
    print("   ✅ OK (12 cidades)")

    # 2. Mostrar coordenadas de cada cidade
    print("\n2. Coordenadas (lat, lon):")
    for nome, (lat, lon) in CITIES.items():
        print(f"   {nome:12} → ({lat:8.4f}, {lon:8.4f})")

    # 3. Testar algumas distâncias conhecidas
    print("\n3. Distâncias calculadas (km):")
    pares = [
        ("Maputo", "Matola"),
        ("Maputo", "Inhambane"),
        ("Beira", "Chimoio"),
        ("Nampula", "Nacala"),
        ("Pemba", "Nacala"),
        ("Maputo", "Pemba"),
    ]
    for c1, c2 in pares:
        dist = get_distance(c1, c2)
        print(f"   {c1:12} → {c2:12} : {dist:8.2f} km")

    # 4. Construir matriz de distâncias
    matrix = build_distance_matrix(CITY_NAMES)
    print("\n4. Matriz de distâncias:")
    print(f"   Dimensão: {len(matrix)} x {len(matrix[0])}")
    print(f"   Primeira linha (de Maputo):")
    print(f"   {[round(x, 1) for x in matrix[0]]}")

    # 5. Testar simetria
    print("\n5. Teste de simetria: ", end="")
    d1 = get_distance("Maputo", "Inhambane")
    d2 = get_distance("Inhambane", "Maputo")
    assert abs(d1 - d2) < 0.001, "Distância não é simétrica!"
    print("✅ OK")

    print("\n" + "=" * 60)
    print("✅ TODOS OS TESTES BÁSICOS PASSARAM!")
    print("=" * 60)

if __name__ == "__main__":
    test_cidades()