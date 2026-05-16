# data/routes.py
# Rotas directas da LAM (Linhas Aéreas de Moçambique)
# Fonte: mapa oficial de rotas LAM
# Cada par representa um voo directo bidireccional.

_LAM_PAIRS = [
    # Hub Maputo — conecta a todas as cidades
    ("Maputo", "Inhambane"),
    ("Maputo", "Vilanculos"),
    ("Maputo", "Beira"),
    ("Maputo", "Chimoio"),
    ("Maputo", "Quelimane"),
    ("Maputo", "Tete"),
    ("Maputo", "Nampula"),
    ("Maputo", "Nacala"),
    ("Maputo", "Lichinga"),
    ("Maputo", "Pemba"),

    # Beira — hub centro
    ("Beira", "Vilanculos"),
    ("Beira", "Chimoio"),
    ("Beira", "Quelimane"),
    ("Beira", "Tete"),
    ("Beira", "Nampula"),

    # Norte
    ("Nampula", "Nacala"),
    ("Nampula", "Pemba"),
    ("Nampula", "Lichinga"),
    ("Nampula", "Quelimane"),

    # Sul
    ("Inhambane", "Vilanculos"),
]

# Conjunto de frozensets para lookup O(1)
LAM_ROUTES: frozenset = frozenset(
    frozenset(pair) for pair in _LAM_PAIRS
)


def has_direct_flight(city_a: str, city_b: str) -> bool:
    """Devolve True se existe voo directo LAM entre as duas cidades."""
    return frozenset({city_a, city_b}) in LAM_ROUTES


def valid_destinations(from_city: str, candidates: list) -> list:
    """Filtra candidatos para apenas cidades com voo directo a partir de from_city."""
    return [c for c in candidates if has_direct_flight(from_city, c)]
