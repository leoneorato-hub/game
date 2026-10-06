extends Node2D
## Arena di prova autosufficiente: nessun asset richiesto.
## Il Cavaliere al centro, ondate crescenti di nemici, pavimento a toppe.
## WASD / frecce per muoversi, R per ricominciare dopo il Game Over.

const PATCH_SIZE := 48.0
const PATCH_COLORS := [
	Color("2b3a55"),  # pietra di Hallownest
	Color("4a1f24"),  # mattonelle della Casa di Ade
	Color("d8dde6"),  # neve di Celeste
	Color("3e5a2c"),  # erba di Terraria
]
const SEAM_COLOR := Color(0.85, 0.7, 0.35, 0.55)

@export var spawn_interval: float = 0.35
@export var max_enemies: int = 400
@export var spawn_distance: float = 340.0

var knight: Knight
var nail: KnightNail

var _world: Node2D
var _floor: Node2D
var _hud: Label
var _spawn_timer := 0.0
var _elapsed := 0.0
var _kills := 0
var _game_over := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

	_floor = Node2D.new()
	_floor.z_index = -10
	_floor.draw.connect(_draw_floor)
	add_child(_floor)

	_world = Node2D.new()
	_world.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(_world)

	knight = Knight.new()
	_world.add_child(knight)
	nail = KnightNail.new()
	knight.add_child(nail)
	knight.died.connect(_on_knight_died)

	var camera := Camera2D.new()
	knight.add_child(camera)
	camera.make_current()

	var layer := CanvasLayer.new()
	add_child(layer)
	_hud = Label.new()
	_hud.position = Vector2(8, 6)
	_hud.add_theme_font_size_override(&"font_size", 10)
	layer.add_child(_hud)


func _process(delta: float) -> void:
	if _game_over:
		if Input.is_physical_key_pressed(KEY_R):
			get_tree().paused = false
			get_tree().reload_current_scene()
		return

	_elapsed += delta
	_spawn_timer -= delta
	if _spawn_timer <= 0.0:
		_spawn_timer = spawn_interval / (1.0 + _elapsed / 60.0)
		_spawn_wave()

	_floor.queue_redraw()
	_hud.text = "Maschere %d/%d   Anima %d/%d   Tempo %02d:%02d   Uccisioni %d   Nemici %d" % [
		knight.masks, knight.max_masks, int(nail.soul), nail.soul_max,
		int(_elapsed) / 60, int(_elapsed) % 60, _kills, EnemyTracker.count()]


func _spawn_wave() -> void:
	var minutes := _elapsed / 60.0
	var batch := 1 + int(minutes * 2.0)
	for i in batch:
		if EnemyTracker.count() >= max_enemies:
			return
		var e := Enemy.new()
		e.max_hp = 12.0 + minutes * 8.0
		e.speed = randf_range(40.0, 65.0) + minutes * 5.0
		e.target = knight
		e.died.connect(_on_enemy_died)
		_world.add_child(e)
		e.global_position = knight.global_position \
			+ Vector2.RIGHT.rotated(randf() * TAU) * spawn_distance


func _on_enemy_died(_enemy: Enemy) -> void:
	_kills += 1


func _on_knight_died() -> void:
	_game_over = true
	get_tree().paused = true
	_hud.text += "\n\nGAME OVER — premi R per riprovare"


## Pavimento a toppe dei mondi, con cuciture tratteggiate (GDD §2.2).
func _draw_floor() -> void:
	var view := get_viewport_rect().size
	var center := knight.global_position
	var x0 := floori((center.x - view.x) / PATCH_SIZE)
	var y0 := floori((center.y - view.y) / PATCH_SIZE)
	var x1 := ceili((center.x + view.x) / PATCH_SIZE)
	var y1 := ceili((center.y + view.y) / PATCH_SIZE)
	for x in range(x0, x1):
		for y in range(y0, y1):
			var h := absi(hash(Vector2i(x, y)))
			var rect := Rect2(x * PATCH_SIZE, y * PATCH_SIZE, PATCH_SIZE, PATCH_SIZE)
			_floor.draw_rect(rect, PATCH_COLORS[h % PATCH_COLORS.size()].darkened(0.55))
			_floor.draw_dashed_line(rect.position, rect.position + Vector2(PATCH_SIZE, 0), SEAM_COLOR, 1.0, 3.0)
			_floor.draw_dashed_line(rect.position, rect.position + Vector2(0, PATCH_SIZE), SEAM_COLOR, 1.0, 3.0)
