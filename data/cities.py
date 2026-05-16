# data/cities.py
# Coordenadas geográficas (latitude, longitude) das 12 cidades de Moçambique

CITIES = {
    # Região Sul
    "Maputo": (-25.9692, 32.5732),
    "Inhambane": (-23.865, 35.38333),
    "Vilanculos": (-22.0, 35.3167),

    # Região Centro
    "Beira": (-19.84361, 34.83889),
    "Chimoio": (-19.11639, 33.48333),
    "Quelimane": (-17.87861, 36.88833),
    "Tete": (-16.15639, 33.58667),

    # Região Norte
    "Nampula": (-15.11646, 39.2666),
    "Nacala": (-14.56257, 40.68538),
    "Lichinga": (-13.31278, 35.24056),
    "Pemba": (-12.97395, 40.51775),
}

CITY_NAMES = list(CITIES.keys())