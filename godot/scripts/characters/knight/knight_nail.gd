class_name KnightNail
extends Node2D
## L'Aculeo del Cavaliere — arma natia in versione auto-battler.
##
## Traduzione del moveset originale:
##   * Fendente automatico verso il nemico più vicino, vincolato alle 4
##     direzioni cardinali come in Hallownest, con knockback sui nemici e
##     rinculo sul Cavaliere.
##   * Ogni nemico colpito genera Anima (+11, vaso da 99).
##   * L'Anima si spende in Spirito Vendicativo (auto-cast verso la corsia più
##     affollata) oppure nel Focus, che cura una Maschera ma richiede di stare
##     fermi e si interrompe se si viene colpiti: l'Anima drenata va persa.
##   * "Priorità dell'Anima" decide come spenderla, come il dilemma originale.
##
## Va aggiunto come figlio di un nodo Knight.

signal soul_changed(current: int, maximum: int)
signal slashed(direction: Vector2, hits: int)
signal spell_cast(spell: StringName)
signal focus_started
signal focus_finished(success: bool)

enum SoulPriority { FOCUS_FIRST, SPELLS_FIRST, BALANCED }

## Danno per livello di affilatura: Vecchio, Affilato, Canalizzato, Spiralato, Puro.
const NAIL_DAMAGE := [5.0, 9.0, 13.0, 17.0, 21.0]

@export_group("Aculeo")
@export_range(0, 4) var nail_upgrade: int = 0
@export var swing_cooldown: float = 0.41
@export var nail_reach: float = 34.0
@export var slash_half_angle_deg: float = 60.0
@export var enemy_knockback: float = 180.0
@export var self_recoil: float = 60.0

@export_group("Anima")
@export var soul_per_hit: int = 11
@export var soul_max: int = 99
@export var spell_cost: int = 33
## Nemici che contano per l'Anima in un singolo fendente: evita che una folla
## riempia il vaso in un colpo.
@export var max_soul_hits_per_swing: int = 3
@export var soul_priority: SoulPriority = SoulPriority.BALANCED

@export_group("Spirito Vendicativo")
@export var spirit_damage: float = 15.0
@export var spirit_range: float = 220.0
@export var spirit_min_cluster: int = 3
@export var spell_cooldown: float = 0.6

@export_group("Focus")
## ≈ durata del Focus originale.
@export var focus_duration: float = 1.15
@export var focus_stillness_required: float = 0.5
@export var focus_hit_grace: float = 1.0

@export_group("Amuleti")
@export var charm_soul_catcher: bool = false   ## +3 Anima per colpo
@export var charm_shaman_stone: bool = false   ## Incantesimi più forti e grandi
@export var charm_quick_slash: bool = false    ## Cooldown 0,41 → 0,25 s
@export var charm_quick_focus: bool = false    ## Focus più rapido del 33%
@export var charm_grubsong: bool = false       ## Anima quando si subisce danno

var soul: float = 0.0

var _swing_timer := 0.0
var _spell_timer := 0.0
var _focusing := false
var _focus_progress := 0.0
var _slash_dir := Vector2.RIGHT
var _slash_visual := 0.0

@onready var knight: Knight = get_parent() as Knight


func _ready() -> void:
	assert(knight != null, "KnightNail deve essere figlio di un Knight")
	knight.damaged.connect(_on_knight_damaged)
	soul_changed.emit(int(soul), soul_max)


func _physics_process(delta: float) -> void:
	_swing_timer = maxf(0.0, _swing_timer - delta)
	_spell_timer = maxf(0.0, _spell_timer - delta)

	if _focusing:
		# Durante il Focus il Cavaliere non attacca, come nell'originale.
		_update_focus(delta)
		return

	_try_swing()
	_try_spend_soul()


func _process(delta: float) -> void:
	if _slash_visual > 0.0 or _focusing:
		_slash_visual = maxf(0.0, _slash_visual - delta)
		queue_redraw()


# --- Fendente ---------------------------------------------------------------

func _try_swing() -> void:
	if _swing_timer > 0.0:
		return
	var target := EnemyTracker.get_nearest(global_position, nail_reach)
	if target == null:
		return
	var dir := snap_to_cardinal(global_position.direction_to(target.global_position))
	if dir == Vector2.ZERO:
		dir = snap_to_cardinal(knight.facing)
	_swing(dir)


func _swing(dir: Vector2) -> void:
	_swing_timer = 0.25 if charm_quick_slash else swing_cooldown
	var damage: float = NAIL_DAMAGE[nail_upgrade]
	var cos_limit := cos(deg_to_rad(slash_half_angle_deg))
	var hits := 0

	for e in EnemyTracker.get_in_radius(global_position, nail_reach):
		var to_enemy := e.global_position - global_position
		if to_enemy.length_squared() > 0.01 and dir.dot(to_enemy.normalized()) < cos_limit:
			continue
		e.take_hit(damage, dir * enemy_knockback)
		hits += 1

	if hits > 0:
		var per_hit := soul_per_hit + (3 if charm_soul_catcher else 0)
		_add_soul(per_hit * mini(hits, max_soul_hits_per_swing))
		knight.apply_recoil(-dir * self_recoil)

	_slash_dir = dir
	_slash_visual = 0.12
	slashed.emit(dir, hits)


# --- Anima ------------------------------------------------------------------

func _try_spend_soul() -> void:
	if soul < spell_cost:
		return
	var wants_focus := knight.masks < knight.max_masks
	var focus_first := false
	match soul_priority:
		SoulPriority.FOCUS_FIRST:
			focus_first = true
		SoulPriority.SPELLS_FIRST:
			focus_first = false
		SoulPriority.BALANCED:
			focus_first = knight.masks <= ceili(knight.max_masks / 2.0)

	if wants_focus and focus_first:
		# Con priorità al Focus l'Anima viene conservata finché non è sicuro
		# curarsi, a meno che il vaso sia pieno e i prossimi colpi la sprechino.
		if _can_focus():
			_start_focus()
			return
		if soul + soul_per_hit <= soul_max:
			return
	if _try_cast_vengeful_spirit():
		return
	if wants_focus and _can_focus():
		_start_focus()


func _add_soul(amount: float) -> void:
	var before := int(soul)
	soul = clampf(soul + amount, 0.0, soul_max)
	if int(soul) != before:
		soul_changed.emit(int(soul), soul_max)


func _on_knight_damaged() -> void:
	if _focusing:
		_end_focus(false)
	if charm_grubsong:
		_add_soul(15)


# --- Spirito Vendicativo ----------------------------------------------------

func _try_cast_vengeful_spirit() -> bool:
	if _spell_timer > 0.0:
		return false
	var dir := EnemyTracker.get_densest_cardinal(global_position, spirit_range, spirit_min_cluster)
	if dir == Vector2.ZERO:
		return false

	_add_soul(-spell_cost)
	_spell_timer = spell_cooldown

	var spirit := VengefulSpirit.new()
	spirit.direction = dir
	spirit.damage = spirit_damage * (1.33 if charm_shaman_stone else 1.0)
	spirit.hit_radius *= 1.33 if charm_shaman_stone else 1.0
	spirit.max_distance = spirit_range * 1.5
	knight.get_parent().add_child(spirit)
	spirit.global_position = global_position + dir * 8.0

	knight.apply_recoil(-dir * 50.0)
	spell_cast.emit(&"vengeful_spirit")
	return true


# --- Focus ------------------------------------------------------------------

func _can_focus() -> bool:
	return knight.time_still >= focus_stillness_required \
		and knight.time_since_hit >= focus_hit_grace


func _start_focus() -> void:
	_focusing = true
	_focus_progress = 0.0
	focus_started.emit()


## L'Anima viene drenata gradualmente: se il Focus si interrompe, quella già
## spesa è persa — il rischio di fermarsi in mezzo all'orda resta reale.
func _update_focus(delta: float) -> void:
	if knight.time_still == 0.0:
		_end_focus(false)
		return
	var duration := focus_duration * (0.67 if charm_quick_focus else 1.0)
	var step := minf(delta, duration - _focus_progress)
	_focus_progress += step
	_add_soul(-spell_cost * step / duration)
	if _focus_progress >= duration:
		knight.heal_mask(1)
		_end_focus(true)


func _end_focus(success: bool) -> void:
	_focusing = false
	_focus_progress = 0.0
	queue_redraw()
	focus_finished.emit(success)


# --- Utilità ----------------------------------------------------------------

static func snap_to_cardinal(v: Vector2) -> Vector2:
	if v == Vector2.ZERO:
		return Vector2.ZERO
	if absf(v.x) >= absf(v.y):
		return Vector2(signf(v.x), 0.0)
	return Vector2(0.0, signf(v.y))


func _draw() -> void:
	if _slash_visual > 0.0:
		var half := deg_to_rad(slash_half_angle_deg)
		var a := _slash_dir.angle()
		var alpha := _slash_visual / 0.12
		draw_arc(Vector2.ZERO, nail_reach * 0.85, a - half, a + half, 14,
			Color(1, 1, 1, alpha), 3.0)
		draw_arc(Vector2.ZERO, nail_reach * 0.6, a - half * 0.7, a + half * 0.7, 10,
			Color(0.8, 0.85, 1.0, alpha * 0.6), 2.0)
	if _focusing:
		var duration := focus_duration * (0.67 if charm_quick_focus else 1.0)
		var t := _focus_progress / duration
		draw_arc(Vector2.ZERO, 18.0 - 10.0 * t, 0.0, TAU, 24, Color(1, 1, 1, 0.3 + 0.6 * t), 2.0)
