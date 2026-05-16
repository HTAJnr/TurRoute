import json
import os
import sys

from flask import Flask, jsonify, request, send_from_directory

sys.path.insert(0, os.path.dirname(__file__))

from data.cities import CITIES
from data.distances import get_distance
from algorithms.runner import run_all_algorithms

ROOT = os.path.dirname(__file__)
app = Flask(__name__, static_folder='ui', static_url_path='/ui')

BORDER_FILE    = os.path.join(ROOT, 'data', 'mozambique_border.json')
PROVINCES_FILE = os.path.join(ROOT, 'data', 'mozambique_provinces.json')

ALGO_MAP = {
    'A* (MST)': 'A*',
    'Greedy':   'Greedy',
    'BFS':      'BFS',
    'DFS':      'DFS',
}


@app.route('/')
def index():
    return send_from_directory('ui', 'index.html')


@app.route('/logo.png')
def logo():
    return send_from_directory(ROOT, 'TurRoute_Logo.png')


@app.route('/api/border')
def border():
    with open(BORDER_FILE, encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/api/provinces')
def provinces():
    with open(PROVINCES_FILE, encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/api/cities')
def cities():
    result = [
        {'name': name, 'lat': lat, 'lon': lon}
        for name, (lat, lon) in CITIES.items()
    ]
    return jsonify(result)


@app.route('/api/route', methods=['POST'])
def route():
    body = request.get_json(force=True)
    cities_list = body.get('cities', [])
    start_city = body.get('start_city', cities_list[0] if cities_list else '')
    algorithm = body.get('algorithm', 'Todos')

    if len(cities_list) < 2:
        return jsonify({'error': 'Selecione pelo menos 2 cidades'}), 400
    if start_city not in cities_list:
        return jsonify({'error': 'Cidade de partida inválida'}), 400

    if algorithm == 'Todos':
        selected = ['A*', 'Greedy', 'BFS', 'DFS']
    else:
        key = ALGO_MAP.get(algorithm)
        selected = [key] if key else ['A*']

    results = run_all_algorithms(cities_list, start_city, selected)

    best = min(results, key=lambda r: r['cost'])
    path = best['path']

    segments = []
    for i in range(len(path) - 1):
        d = get_distance(path[i], path[i + 1])
        segments.append({
            'from': path[i],
            'to': path[i + 1],
            'distance': round(d, 1),
        })

    # Close the circuit: return leg to start city
    d_return = get_distance(path[-1], path[0])
    segments.append({
        'from': path[-1],
        'to': path[0],
        'distance': round(d_return, 1),
    })

    # Closed path for animation (includes start city at end)
    best_closed = dict(best)
    best_closed['path'] = path + [path[0]]

    return jsonify({'results': results, 'best': best_closed, 'segments': segments})


if __name__ == '__main__':
    port = 8080
    print(f'\n  TurRoute rodando em http://localhost:{port}\n')
    app.run(debug=True, port=port, host='127.0.0.1')
