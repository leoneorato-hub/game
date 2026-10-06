class_name VengefulSpirit
extends Node2D
## Spirito Vendicativo: proiettile spettrale che perfora ogni nemico in linea,
## colpendo ciascuno una sola volta.

var direction := Vector2.RIGHT
var speed: float = 260.0
var damage: float = 15.0
var hit_radius: float = 10.0
var max_distance: float = 320.0
var knockback: float = 120.0

var _travelled := 0.0
var _already_hit: Dictionary = {}  # instance_id -> true


func _ready() -> void:
	rotation = direction.angle()


func _physics_process(delta: float) -> void:
	var step := speed * delta
	global_position += direction * step
	_travelled += step

	for e in EnemyTracker.get_in_radius(global_position, hit_radius):
		var id := e.get_instance_id()
		if _already_hit.has(id):
			continue
		_already_hit[id] = true
		e.take_hit(damage, direction * knockback)

	if _travelled >= max_distance:
		queue_free()


func _draw() -> void:
	var r := hit_radius
	draw_colored_polygon(PackedVector2Array([
		Vector2(r, 0), Vector2(-r * 0.4, -r * 0.8), Vector2(-r * 2.2, 0), Vector2(-r * 0.4, r * 0.8)]),
		Color(0.85, 0.9, 1.0, 0.85))
	draw_circle(Vector2(r * 0.2, 0), r * 0.45, Color.WHITE)
	draw_circle(Vector2(r * 0.35, -r * 0.15), r * 0.12, Color("0b0910"))
