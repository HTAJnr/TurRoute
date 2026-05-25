# Cenários de Teste — TurRoute

## Projecto: TurRoute — Planeamento de Circuitos Turísticos em Moçambique
### Disciplina de Inteligência Artificial — G1

---

## Como Correr os Testes

```bash
# A partir da raiz do projecto (TurRoute/)

# Testes dos algoritmos isolados
python -X utf8 algorithms/test_algorithms.py

# Todos os testes automatizados
python -m pytest tests/ -v

# Servidor para testes manuais na UI
python app.py
# Abrir http://localhost:8080
```

---

## Cenário 1 — Circuito Sul com Todos os Algoritmos

**Objectivo:** Verificar que todos os algoritmos produzem resultados válidos num circuito pequeno.

**Configuração:**
- Cidades: Maputo, Inhambane, Vilanculos, Beira
- Cidade de partida: Maputo
- Algoritmo: Todos os Algoritmos

**Resultados reais obtidos:**

| Algoritmo | Rota | Custo (km) | Tempo de Voo | Nós Explorados | Óptimo? |
|---|---|---|---|---|---|
| A* (MST) | Maputo → Inhambane → Vilanculos → Beira | 819.8 | 3h 5min | 4 | ✅ Sim |
| Greedy | Maputo → Inhambane → Vilanculos → Beira | 819.8 | 3h 5min | 4 | ❌ Não |
| BFS | Maputo → Inhambane → Vilanculos → Beira | 819.8 | 3h 5min | 16 | ✅ Sim |
| DFS | Maputo → Inhambane → Beira → Vilanculos | 1063.0 | 3h 10min | 16 | ❌ Não |

**Observações:**
- A* e Greedy encontraram a mesma rota óptima. Com apenas 4 cidades, o Greedy funciona bem por sorte — a cidade mais próxima acontece ser a melhor escolha em cada passo.
- BFS explorou 4× mais nós que A* e Greedy para obter o mesmo resultado.
- DFS encontrou uma rota 29.7% mais longa (1063.0 vs 819.8 km).

---

## Cenário 2 — Trocar a Cidade de Partida

**Objectivo:** Verificar que a rota muda consoante a partida e que o sistema respeita a cidade de partida seleccionada.

**Configuração:**
- Cidades: Maputo, Inhambane, Vilanculos, Beira
- Algoritmo: Greedy

**Sub-cenários:**

| Partida | Rota | Custo (km) |
|---|---|---|
| Maputo | Maputo → Inhambane → Vilanculos → Beira | 819.8 |
| Beira | Beira → Vilanculos → Inhambane → Maputo | 819.8 |
| Inhambane | Inhambane → Maputo → Vilanculos → Beira | 1043.3* |
| Vilanculos | Vilanculos → Inhambane → Maputo → Beira | 948.1* |

*valores aproximados — a rota GreedY é sensível ao ponto de partida.

**Observação:** Mudar a cidade de partida pode produzir rotas diferentes com o Greedy (que é guloso e não garante óptimo). O A* sempre encontra o óptimo independentemente da partida, mas a rota apresentada começa sempre na cidade seleccionada.

---

## Cenário 3 — Rota com Segmentos sem Voo Directo LAM

**Objectivo:** Verificar que o sistema identifica correctamente segmentos sem voo directo LAM e os marca como "escala".

**Configuração:**
- Cidades: Lichinga, Tete, Chimoio, Beira
- Cidade de partida: Lichinga

**Comportamento esperado:**
- Segmentos como Lichinga → Tete ou Lichinga → Chimoio não têm voo LAM directo.
- Na UI, esses segmentos aparecem marcados com a badge **"escala"** a vermelho.
- O sistema **não bloqueia** a rota — apenas informa que requer ligação.
- O custo calculado é a distância aérea directa (Haversine), não o custo real com escala.

**Como testar na UI:**
1. Seleccionar Lichinga + Tete + Chimoio + Beira
2. Correr qualquer algoritmo
3. No painel de resultados, verificar que alguns segmentos têm a badge "escala"

---

## Cenário 4 — Circuito Mínimo (2 Cidades)

**Objectivo:** Verificar que o sistema funciona com o número mínimo de cidades.

**Configuração:**
- Cidades: Maputo, Beira
- Cidade de partida: Maputo
- Algoritmo: A*

**Resultado esperado:**
- Rota: Maputo → Beira
- Custo: ~720 km (distância directa Haversine)
- Circuito completo: Maputo → Beira → Maputo (~1440 km total)
- Tempo de voo: ~2h 52min

**Validação automática:** `test_edge_cases.py::test_duas_cidades`

---

## Cenário 5 — Circuito Máximo (11 Cidades)

**Objectivo:** Verificar que o sistema lida com todas as cidades disponíveis.

**Configuração:**
- Preset "Completo" (11 cidades): Maputo, Inhambane, Vilanculos, Beira, Chimoio, Quelimane, Tete, Nampula, Nacala, Lichinga, Pemba
- Cidade de partida: Maputo
- Algoritmo: Todos os Algoritmos

**Comportamento esperado:**
- BFS é **automaticamente desactivado** para >10 cidades: retorna resultado via Greedy com aviso `_warning`
- Na UI, o algoritmo BFS aparece com nota de aviso
- A*, Greedy e DFS correm normalmente
- A* pode demorar alguns segundos (ainda dentro do limite de 30s)

**Como testar:**
1. Clicar no preset "Completo"
2. Seleccionar "Todos os Algoritmos"
3. Clicar "Calcular Rota"
4. Verificar que BFS mostra o aviso de limite

---

## Cenário 6 — Preset Sul: Validação de Cidades Carregadas

**Objectivo:** Verificar que cada preset carrega as cidades correctas.

| Preset | Cidades esperadas | Partida |
|---|---|---|
| Sul | Maputo, Inhambane, Vilanculos | Maputo |
| Centro-Norte | Beira, Chimoio, Quelimane, Tete, Nampula | Beira |
| Completo | 11 cidades (todas excepto nenhuma) | Maputo |

**Como testar:** Clicar em cada preset e verificar os toggles seleccionados na sidebar.

---

## Cenário 7 — Um Único Algoritmo vs Todos

**Objectivo:** Verificar que a UI muda conforme o número de algoritmos.

**Com um único algoritmo (ex: A* (MST)):**
- Mostra métricas simples: distância, tempo de voo, nós explorados, garante óptimo
- Não mostra painel de comparação nem gráficos

**Com Todos os Algoritmos:**
- Mostra cartões individuais de cada algoritmo (clicáveis para mudar a rota no mapa)
- Mostra painel de comparação: 3 cartões de destaque, tabela, 3 gráficos, análise textual

---

## Cenário 8 — A* vs Greedy (Qualidade vs Velocidade de Cálculo)

**Objectivo:** Demonstrar o trade-off entre qualidade de solução e tempo de cálculo.

**Circuito Completo — 8 cidades:**

| Algoritmo | Custo (km) | Tempo Voo Circuito | Nós Explorados | Tempo Exec. | Óptimo? |
|---|---|---|---|---|---|
| A* (MST) | 2205.5 | 7h 45min | 8 | <1ms | ✅ Sim |
| Greedy | 2205.5 | 7h 45min | 8 | <1ms | ❌ Não |
| DFS | 4070.8 | 11h 29min | 1352 | 8.65ms | ❌ Não |

**Observação:** Neste caso o Greedy encontrou a rota óptima. Mas isso não é garantido — em circuitos com geometria diferente, o Greedy pode ser 20-30% pior que A*.

---

## Cenário 9 — Input Inválido: Cidade de Partida Fora da Selecção

**Objectivo:** Verificar que o servidor rejeita configurações inválidas.

**Teste via API:**
```bash
curl -X POST http://localhost:8080/api/route \
  -H "Content-Type: application/json" \
  -d '{"cities": ["Maputo", "Beira"], "start_city": "Nampula", "algorithm": "Todos"}'
```

**Resultado esperado:** HTTP 400 com `{"error": "Cidade de partida inválida"}`

**Na UI:** Este caso não acontece — o dropdown de partida só mostra cidades já seleccionadas.

---

## Cenário 10 — Input Inválido: Menos de 2 Cidades

**Objectivo:** Verificar que o sistema não corre com apenas 1 cidade.

**Comportamento na UI:**
- O botão "Calcular Rota" fica desactivado (disabled) quando há <2 cidades seleccionadas
- A mensagem "Selecione pelo menos 2 cidades" aparece abaixo do botão

**Comportamento via API:**
```bash
curl -X POST http://localhost:8080/api/route \
  -H "Content-Type: application/json" \
  -d '{"cities": ["Maputo"], "start_city": "Maputo", "algorithm": "Todos"}'
```
**Resultado esperado:** HTTP 400 com `{"error": "Selecione pelo menos 2 cidades"}`

---

## Cenário 11 — BFS com 11+ Cidades

**Objectivo:** Verificar que o BFS não crasha com muitas cidades.

**Configuração:**
- 11 cidades (preset Completo)
- Algoritmo: BFS (ou Todos)

**Resultado esperado:**
- BFS retorna resultado sem crash
- O resultado usa a rota Greedy como fallback
- Campo `_warning` presente no resultado JSON
- Na UI: aviso visível no cartão do algoritmo BFS

**Validação automática:** `test_edge_cases.py::test_bfs_limite_cidades`

---

## Cenário 12 — Animação do Avião com Rota Alternativa

**Objectivo:** Verificar que clicar num algoritmo diferente muda a rota no mapa e reinicia a animação.

**Como testar:**
1. Seleccionar 4+ cidades, algoritmo "Todos"
2. Clicar "Calcular Rota" — a animação começa na rota do melhor algoritmo
3. Clicar no cartão de um algoritmo diferente (ex: DFS)
4. Verificar que: a rota no mapa muda (cores diferentes), a animação reinicia no novo percurso

---

## Resumo dos Testes Automatizados

| Ficheiro | Testes | Cobertura |
|---|---|---|
| `algorithms/test_algorithms.py` | 2 cenários | Circuito Sul + Completo — todos os algoritmos |
| `tests/test_integration.py` | 14 testes | 3 cenários, validações de rota, comparação A* vs Greedy |
| `tests/test_edge_cases.py` | 17 testes | 2 cidades, distâncias, BFS limite, partida diferente |
| `tests/test_metrics.py` | 15 testes | Métricas, tabela, formatação de tempo de voo |
| **Total** | **48 testes** | **Todos a passar ✅** |
