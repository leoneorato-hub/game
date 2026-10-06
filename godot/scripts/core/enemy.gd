class_name Enemy
extends Node2D
## Nemico base del prototipo.
##
## Node2D puro, senza fisica: con centinaia di istanze move_and_slide() costa
## troppo. Collisioni e bersagli passano tutti da EnemyTracker. In produzione i
## nemici base verranno disegnati con MultiMeshInstance2D (vedi GDD §7).

signal died(enemy: Enemy)

const INK := Color("1a1220")

@export var max_hp: float = 12.0
@export var speed: float = 55.0
@export var radius: float = 6.0
@export var contact_damage: int = 1
@export_range(0.0, 1.0) var knockback_resistance: float = 0.0
@export var color: Color = Color(0.55, 0.42, 0.75)

var hp: float
var alive := true
var target: Node2D

var _knockback := Vector2.ZERO
var _flash := 0.0


func _ready() -> void:
	hp = max_hp
	EnemyTracker.register(self)


func _exit_tree() -> void:
	EnemyTracker.unregister(self)


func _physics_process(delta: float) -> void:
	var dir := Vector2.ZERO
	if is_instance_valid(target):
		dir = global_position.direction_to(target.global_position)
	global_position += (dir * speed + _knockback) * delta
	_knockback = _knockback.move_toward(Vector2.ZERO, 600.0 * delta)

	if _flash > 0.0:
		_flash -= delta
		if _flash <= 0.0:
			queue_redraw()

	_check_contact()


## Infligge danno e knockback. Restituisce true se il colpo ha ucciso.
func take_hit(amount: float, knockback: Vector2) -> bool:
	if not alive:
		return false
	hp -= amount
	_knockback += knockback * (1.0 - knockback_resistance)
	_flash = 0.08
	queue_redraw()
	if hp <= 0.0:
		_die()
		return true
	return false


func _check_contact() -> void:
	if not is_instance_valid(target) or not target.has_method(&"take_damage"):
		return
	var reach: float = radius + float(target.get(&"hurt_radius"))
	if global_position.distance_squared_to(target.global_position) <= reach * reach:
		target.call(&"take_damage", contact_damage, global_position)


func _die() -> void:
	alive = false
	EnemyTracker.unregister(self)
	died.emit(self)
	queue_free()


func _draw() -> void:
	draw_circle(Vector2.ZERO, radius + 1.0, INK)
	draw_circle(Vector2.ZERO, radius, Color.WHITE if _flash > 0.0 else color)
