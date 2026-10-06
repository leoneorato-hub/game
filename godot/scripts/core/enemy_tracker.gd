extends Node
## Autoload "EnemyTracker": registro globale dei nemici vivi.
##
## Con centinaia di nemici a schermo, cercare "il più vicino" scorrendo tutta
## la lista per ogni arma costa O(armi × nemici) a frame. Qui i nemici vengono
## distribuiti in una spatial hash grid, ricostruita una volta per frame fisico
## (prima di qualunque arma, grazie alla priorità negativa), così ogni query
## guarda solo le celle vicine.

const CELL_SIZE: float = 96.0
const CARDINALS: Array[Vector2] = [Vector2.RIGHT, Vector2.LEFT, Vector2.DOWN, Vector2.UP]

var _enemies: Array[Enemy] = []
var _grid: Dictionary = {}  # Vector2i -> Array (di Enemy)


func _ready() -> void:
	process_physics_priority = -100


func _physics_process(_delta: float) -> void:
	_grid.clear()
	for e in _enemies:
		var key := _cell_of(e.global_position)
		var bucket: Variant = _grid.get(key)
		if bucket == null:
			bucket = []
			_grid[key] = bucket
		bucket.append(e)


# --- Registrazione ----------------------------------------------------------

func register(enemy: Enemy) -> void:
	if enemy.has_meta(&"tracker_index"):
		return
	enemy.set_meta(&"tracker_index", _enemies.size())
	_enemies.append(enemy)


## Rimozione O(1) con swap-remove: l'ultimo nemico prende il posto del rimosso.
func unregister(enemy: Enemy) -> void:
	if not enemy.has_meta(&"tracker_index"):
		return
	var idx: int = enemy.get_meta(&"tracker_index")
	var last: Enemy = _enemies[_enemies.size() - 1]
	_enemies[idx] = last
	last.set_meta(&"tracker_index", idx)
	_enemies.pop_back()
	enemy.remove_meta(&"tracker_index")


func count() -> int:
	return _enemies.size()


# --- Query ------------------------------------------------------------------

## Nemico vivo più vicino entro max_radius, o null.
## Esplora la griglia ad anelli concentrici e si ferma appena un anello non
## può più contenere niente di più vicino del migliore già trovato.
func get_nearest(origin: Vector2, max_radius: float) -> Enemy:
	var best: Enemy = null
	var best_d2 := max_radius * max_radius
	var center := _cell_of(origin)
	var max_ring := int(ceil(max_radius / CELL_SIZE))
	for ring in range(max_ring + 1):
		if best != null and ring > 0:
			var min_dist := (ring - 1) * CELL_SIZE
			if min_dist * min_dist > best_d2:
				break
		for cell in _ring_cells(center, ring):
			var bucket: Variant = _grid.get(cell)
			if bucket == null:
				continue
			for e in bucket:
				if not _is_alive(e):
					continue
				var d2 := origin.distance_squared_to(e.global_position)
				if d2 < best_d2:
					best_d2 = d2
					best = e
	return best


## Tutti i nemici vivi entro radius.
func get_in_radius(origin: Vector2, radius: float) -> Array[Enemy]:
	var result: Array[Enemy] = []
	var r2 := radius * radius
	var min_c := _cell_of(origin - Vector2(radius, radius))
	var max_c := _cell_of(origin + Vector2(radius, radius))
	for cx in range(min_c.x, max_c.x + 1):
		for cy in range(min_c.y, max_c.y + 1):
			var bucket: Variant = _grid.get(Vector2i(cx, cy))
			if bucket == null:
				continue
			for e in bucket:
				if _is_alive(e) and origin.distance_squared_to(e.global_position) <= r2:
					result.append(e)
	return result


## Direzione cardinale con più nemici entro radius (per incantesimi "a corsia"
## come lo Spirito Vendicativo). Vector2.ZERO se nessuna arriva a min_count.
func get_densest_cardinal(origin: Vector2, radius: float, min_count: int) -> Vector2:
	var counts := PackedInt32Array([0, 0, 0, 0])
	for e in get_in_radius(origin, radius):
		var d := e.global_position - origin
		if absf(d.x) >= absf(d.y):
			counts[0 if d.x >= 0.0 else 1] += 1
		else:
			counts[2 if d.y >= 0.0 else 3] += 1
	var best := -1
	var best_count := min_count - 1
	for i in 4:
		if counts[i] > best_count:
			best_count = counts[i]
			best = i
	return CARDINALS[best] if best >= 0 else Vector2.ZERO


# --- Interni ----------------------------------------------------------------

func _cell_of(p: Vector2) -> Vector2i:
	return Vector2i(floori(p.x / CELL_SIZE), floori(p.y / CELL_SIZE))


## Celle sul bordo del quadrato di "raggio" ring attorno a center.
func _ring_cells(center: Vector2i, ring: int) -> Array[Vector2i]:
	if ring == 0:
		return [center]
	var cells: Array[Vector2i] = []
	for x in range(-ring, ring + 1):
		cells.append(center + Vector2i(x, -ring))
		cells.append(center + Vector2i(x, ring))
	for y in range(-ring + 1, ring):
		cells.append(center + Vector2i(-ring, y))
		cells.append(center + Vector2i(ring, y))
	return cells


## La griglia vive un frame: un nemico ucciso a metà frame resta nel bucket
## ma non deve più essere bersagliato.
func _is_alive(e: Variant) -> bool:
	return is_instance_valid(e) and (e as Enemy).alive
