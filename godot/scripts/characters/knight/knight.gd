class_name Knight
extends Node2D
## Il Cavaliere (Hollow Knight) — corpo, movimento e Maschere.
##
## L'unico input del giocatore è il movimento: l'Aculeo (KnightNail, figlio di
## questo nodo) attacca e gestisce l'Anima da solo.

signal masks_changed(current: int, maximum: int)
signal damaged
signal died

const INK := Color("1a1220")
const VOID := Color("0b0910")
const SHELL := Color("f2efe6")
const CLOAK := Color("6b7085")

@export var move_speed: float = 95.0
@export var max_masks: int = 5
@export var hurt_radius: float = 6.0
## Invulnerabilità dopo un colpo (≈ quella dell'originale).
@export var invulnerability_time: float = 1.3
## Amuleti oltre il limite di Tacche: danno subito raddoppiato, come in Hallownest.
@export var overcharmed: bool = false

var masks: int
var facing := Vector2.RIGHT
var velocity := Vector2.ZERO
## Letti dall'Aculeo per decidere se il Focus è sicuro.
var time_still := 0.0
var time_since_hit := INF

var _invulnerable := 0.0
var _recoil := Vector2.ZERO


func _ready() -> void:
	masks = max_masks
	masks_changed.emit(masks, max_masks)


func _physics_process(delta: float) -> void:
	var input := _read_input()
	velocity = input * move_speed
	if input != Vector2.ZERO:
		facing = input.normalized()
		time_still = 0.0
	else:
		time_still += delta

	global_position += (velocity + _recoil) * delta
	_recoil = _recoil.move_toward(Vector2.ZERO, 500.0 * delta)
	_invulnerable = maxf(0.0, _invulnerable - delta)
	time_since_hit += delta
	queue_redraw()


func take_damage(amount: int, from: Vector2) -> void:
	if _invulnerable > 0.0 or masks <= 0:
		return
	if overcharmed:
		amount *= 2
	masks = maxi(0, masks - amount)
	_invulnerable = invulnerability_time
	time_since_hit = 0.0
	_recoil += from.direction_to(global_position) * 160.0
	damaged.emit()
	masks_changed.emit(masks, max_masks)
	if masks == 0:
		died.emit()


func heal_mask(amount: int = 1) -> void:
	masks = mini(max_masks, masks + amount)
	masks_changed.emit(masks, max_masks)


## Rinculo dei fendenti e degli incantesimi.
func apply_recoil(impulse: Vector2) -> void:
	_recoil += impulse


func _read_input() -> Vector2:
	var v := Input.get_vector(&"ui_left", &"ui_right", &"ui_up", &"ui_down")
	v.x += float(Input.is_physical_key_pressed(KEY_D)) - float(Input.is_physical_key_pressed(KEY_A))
	v.y += float(Input.is_physical_key_pressed(KEY_S)) - float(Input.is_physical_key_pressed(KEY_W))
	return v.limit_length(1.0)


## Segnaposto in primitive: guscio bianco a due corna, occhi di Vuoto, mantello grigio.
func _draw() -> void:
	if _invulnerable > 0.0 and int(_invulnerable * 20.0) % 2 == 0:
		return
	var side := 1.0 if facing.x >= 0.0 else -1.0
	draw_colored_polygon(PackedVector2Array([
		Vector2(-6, -1), Vector2(6, -1), Vector2(8, 9), Vector2(-8, 9)]), CLOAK)
	draw_line(Vector2(-4, -8), Vector2(-6, -16), SHELL, 2.0)
	draw_line(Vector2(4, -8), Vector2(6, -16), SHELL, 2.0)
	draw_circle(Vector2(0, -5), 7.0, INK)
	draw_circle(Vector2(0, -5), 6.0, SHELL)
	draw_circle(Vector2(-2.5 + side, -4), 1.8, VOID)
	draw_circle(Vector2(2.5 + side, -4), 1.8, VOID)
