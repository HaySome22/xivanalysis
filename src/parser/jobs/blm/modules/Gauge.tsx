//I've heard it's cool to build your own job gauge.
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {Cause, Event, Events, FieldsBase} from 'event'
import {TimestampHookArguments} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import BrokenLog from 'parser/core/modules/BrokenLog'
import CastTime from 'parser/core/modules/CastTime'
import {CounterGauge, TimerGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React from 'react'
import {isSuccessfulHit} from 'utilities'
import {FIRE_SPELLS, ICE_SPELLS_TARGETED, ICE_SPELLS_UNTARGETED} from './Elements'

/** Configuration */
const ENOCHIAN_DURATION_REQUIRED = 30000
export const ASTRAL_UMBRAL_DURATION = 15000
export const MAX_ASTRAL_UMBRAL_STACKS = 3
export const MAX_UMBRAL_HEART_STACKS = 3
const MAX_ASTRAL_UMBRAL_CAST_SCALAR = 0.5
const FLARE_MAX_HEART_CONSUMPTION = 3
const MAX_POLYGLOT_STACKS = 2
const ASTRAL_UMBRAL_HANDLE = 'astralumbral'

const AFFECTS_GAUGE_ON_DAMAGE: ActionKey[] = [
	...FIRE_SPELLS,
	...ICE_SPELLS_TARGETED,
]

const AFFECTS_GAUGE_ON_CAST: ActionKey[] = [
	...ICE_SPELLS_UNTARGETED,
	'TRANSPOSE',
	'FOUL',
	'XENOGLOSSY',
	'ENOCHIAN',
]

/** Gauge state interface for consumers */
export interface BLMGaugeState {
	astralFire: number,
	umbralIce: number,
	umbralHearts: number,
	polyglot: number,
	enochian: boolean,
}

/** BLM Gauge Event interface & include in Event repository */
interface EventBLMGauge extends FieldsBase {
	type: 'blmgauge',
}
declare module 'event' {
	interface EventTypeRepository {
		blmgauge: EventBLMGauge
	}
}

/** Graph colors/fade settings */
const STANCE_FADE = 0.5
const GAUGE_FADE = 0.25
const TIMER_FADE = 0.75
/* eslint-disable @typescript-eslint/no-magic-numbers */
const ICE_COLOR = Color.rgb(47, 113, 177)
const FIRE_COLOR = Color.rgb(210, 62, 38)
/* eslint-enable @typescript-eslint/no-magic-numbers */
const POLYGLOT_COLOR = Color(JOBS.BLACK_MAGE.colour)

export class Gauge extends CoreGauge {
	static override handle = 'gauge'
	static override title = t('blm.gauge.title')`Gauge`

	@dependency private suggestions!: Suggestions
	@dependency private brokenLog!: BrokenLog
	@dependency private unableToAct!: UnableToAct
	@dependency private castTime!: CastTime

	private droppedEnoTimestamps: number[] = []
	private overwrittenPolyglot: number = 0

	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)
	private iceSpellIds = [
		...ICE_SPELLS_TARGETED.map(key => this.data.actions[key].id),
		...ICE_SPELLS_UNTARGETED.map(key => this.data.actions[key].id),
	]
	private affectsGaugeOnDamage = AFFECTS_GAUGE_ON_DAMAGE.map(key => this.data.actions[key].id)

	private castTimeIndex: number | null = null

	/** Astral Fire */
	private astralFireGauge = this.add(new CounterGauge({
		maximum: MAX_ASTRAL_UMBRAL_STACKS,
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.astral-fire">Astral Fire</Trans>,
			color: FIRE_COLOR.fade(STANCE_FADE),
		},
	}))
	private astralFireTimer = this.add(new TimerGauge({
		maximum: ASTRAL_UMBRAL_DURATION,
		onExpiration: this.onAstralUmbralTimeout.bind(this),
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.astral-timer">Astral Fire Timer</Trans>,
			color: FIRE_COLOR.fade(TIMER_FADE),
		},
	}))
	/** Umbral Ice */
	private umbralIceGauge = this.add(new CounterGauge({
		maximum: MAX_ASTRAL_UMBRAL_STACKS,
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.umbral-ice">Umbral Ice</Trans>,
			color: ICE_COLOR.fade(STANCE_FADE),
		},
	}))
	private umbralIceTimer = this.add(new TimerGauge({
		maximum: ASTRAL_UMBRAL_DURATION,
		onExpiration: this.onAstralUmbralTimeout.bind(this),
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.umbral-timer">Umbral Ice Timer</Trans>,
			color: ICE_COLOR.fade(TIMER_FADE),
		},
	}))

	/** Umbral Hearts */
	private umbralHeartsGauge = this.add(new CounterGauge({
		maximum: MAX_UMBRAL_HEART_STACKS,
		graph: {
			label: <Trans id="blm.gauge.resource.umbral-hearts">Umbral Hearts</Trans>,
			color: ICE_COLOR.fade(GAUGE_FADE),
		},
	}))

	/** Polyglot */
	private polyglotGauge = this.add(new CounterGauge({
		maximum: MAX_POLYGLOT_STACKS,
		graph: {
			label: <Trans id="blm.gauge.resource.polyglot">Polyglot</Trans>,
			color: POLYGLOT_COLOR.fade(GAUGE_FADE),
		},
	}))
	private polyglotTimer = this.add(new TimerGauge({
		maximum: ENOCHIAN_DURATION_REQUIRED,
		onExpiration: this.onGainPolyglot.bind(this),
		graph: {
			label: <Trans id="blm.gauge.resource.polyglot-timer">Polyglot Timer</Trans>,
			color: POLYGLOT_COLOR.fade(TIMER_FADE),
		},
	}))
	private enochianActive: boolean = false

	private previousGaugeState: BLMGaugeState | undefined = this.getGaugeState(this.parser.pull.timestamp)

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		// The action event is sufficient for actions that don't need to do damage to affect gauge state (ie. Transpose, Enochian, Umbral Soul)
		// Foul and Xenoglossy also fall into this category since they consume Polyglot on execution
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(AFFECTS_GAUGE_ON_CAST)), this.onCast)

		// The rest of the fire and ice spells must do damage in order to affect gauge state, so hook that event instead.
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(oneOf(this.affectsGaugeOnDamage))), this.onCast)

		this.addEventHook('complete', this.onComplete)

		this.resourceGraphs.addDataGroup({
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.astral-umbral">Astral Fire and<br></br>Umbral Ice</Trans>,
			collapse: true,
			forceCollapsed: true,
		})
	}

	/**
	 * Retrieves the gauge state at the specified epoch timestamp
	 * @param timestamp The epoch timestamp to get the gauge state at, defaults to parser.currentEpochTimestamp
	 * @returns The BLMGaugeState object for this timestamp, or undefined if not found
	*/
	public getGaugeState(timestamp: number = this.parser.currentEpochTimestamp): BLMGaugeState | undefined {
		return {
			astralFire: this.astralFireGauge.getValueAt(timestamp),
			umbralIce: this.umbralIceGauge.getValueAt(timestamp),
			umbralHearts: this.umbralHeartsGauge.getValueAt(timestamp),
			polyglot: this.polyglotGauge.getValueAt(timestamp),
			enochian: this.enochianActive,
		}
	}

	//#region onCast and gauge state modification
	private onCast(event: Events['damage'] | Events['action']) {
		let abilityId
		if ('cause' in event && 'action' in event.cause) {
			abilityId = event.cause.action
		} else if ('action' in event) {
			abilityId = event.action
		}

		// If we couldn't figure out what ability this is (somehow wound up here because of a DoT?), bail
		if (abilityId == null) { return }

		// Bail out if the event didn't do damage and the action needs to in order to affect gauge state
		if (this.affectsGaugeOnDamage.includes(abilityId) && event.type === 'damage' && !isSuccessfulHit(event)) { return }

		switch (abilityId) {
		case this.data.actions.ENOCHIAN.id:
			if (this.astralFireGauge.empty && this.umbralIceGauge.empty) {
				this.brokenLog.trigger(this, 'no stack eno', (
					<Trans id="blm.gauge.trigger.no-stack-eno">
						<DataLink action="ENOCHIAN"/> was cast without any Astral Fire or Umbral Ice stacks detected.
					</Trans>
				))
			}
			if (!this.enochianActive) {
				this.startEnochianUptime()
				this.addEvent()
			}
			break
		case this.data.actions.BLIZZARD_I.id:
		case this.data.actions.BLIZZARD_II.id:
			this.onGainUmbralIceStacks(1)
			break
		case this.data.actions.FREEZE.id:
			this.onGainUmbralIceStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			this.tryGainUmbralHearts(1)
			break
		case this.data.actions.BLIZZARD_III.id:
			this.onGainUmbralIceStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.BLIZZARD_IV.id:
			if (!this.enochianActive) {
				this.brokenLog.trigger(this, 'no eno b4', (
					<Trans id="blm.gauge.trigger.no-eno-b4">
						<DataLink action="BLIZZARD_IV"/> was cast while <DataLink action="ENOCHIAN"/> was deemed inactive.
					</Trans>
				))
				this.startEnochianUptime()
			}
			this.umbralHeartsGauge.set(MAX_UMBRAL_HEART_STACKS)
			this.addEvent()
			break
		case this.data.actions.UMBRAL_SOUL.id:
			this.onGainUmbralIceStacks(1)
			this.tryGainUmbralHearts(1)
			break
		case this.data.actions.FIRE_I.id:
		case this.data.actions.FIRE_II.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(1)
			break
		case this.data.actions.FIRE_III.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.FIRE_IV.id:
			if (!this.enochianActive) {
				this.brokenLog.trigger(this, 'no eno f4', (
					<Trans id="blm.gauge.trigger.no-eno-f4">
						<DataLink action="FIRE_IV"/> was cast while <DataLink action="ENOCHIAN"/> was deemed inactive.
					</Trans>
				))
				this.startEnochianUptime()
			}
			this.tryConsumeUmbralHearts(1)
			break
		case this.data.actions.DESPAIR.id:
			if (!this.enochianActive) {
				this.brokenLog.trigger(this, 'no eno despair', (
					<Trans id="blm.gauge.trigger.no-eno-despair">
						<DataLink action="DESPAIR"/> was cast while <DataLink action="ENOCHIAN"/> was deemed inactive.
					</Trans>
				))
				this.startEnochianUptime()
			}
			this.onGainAstralFireStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.FLARE.id:
			this.tryConsumeUmbralHearts(FLARE_MAX_HEART_CONSUMPTION, true)
			this.onGainAstralFireStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.XENOGLOSSY.id:
		case this.data.actions.FOUL.id:
			this.onConsumePolyglot()
			break
		case this.data.actions.TRANSPOSE.id:
			this.onTransposeStacks()
			break
		}
	}

	private addEvent() {
		if (!this.astralFireGauge.empty && this.astralFireTimer.expired) {
			this.astralFireTimer.start()
		}
		if (!this.umbralIceGauge.empty && this.umbralIceTimer.expired) {
			this.umbralIceTimer.start()
		}
		if (this.enochianActive && this.polyglotTimer.expired) {
			this.polyglotTimer.start()
		}

		if (this.gaugeValuesChanged(this.previousGaugeState)) {
			this.updateCastTimes(this.previousGaugeState)
			this.previousGaugeState = this.getGaugeState(this.parser.currentEpochTimestamp)

			// Queue event to tell other analysers about the change
			this.parser.queueEvent({
				type: 'blmgauge',
				timestamp: this.parser.currentEpochTimestamp,
			})
		}
	}

	private updateCastTimes(lastGaugeState?: BLMGaugeState): void {
		const lastAstralFire = lastGaugeState?.astralFire || 0
		const lastUmbralIce = lastGaugeState?.umbralIce || 0

		// If we have gained max AF, set Blizzard spells to be fast
		if (lastAstralFire !== MAX_ASTRAL_UMBRAL_STACKS && this.astralFireGauge.value === MAX_ASTRAL_UMBRAL_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = this.castTime.setPercentageAdjustment(this.iceSpellIds, MAX_ASTRAL_UMBRAL_CAST_SCALAR)
		}
		// If we have gained max UI, set Fire spells to be fast
		if (lastUmbralIce !== MAX_ASTRAL_UMBRAL_STACKS && this.umbralIceGauge.value === MAX_ASTRAL_UMBRAL_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = this.castTime.setPercentageAdjustment(this.fireSpellIds, MAX_ASTRAL_UMBRAL_CAST_SCALAR)
		}
		// If our current gauge state doesn't have either max AF or max UI, drop the cast time adjustment entirely
		if (this.astralFireGauge.value !== MAX_ASTRAL_UMBRAL_STACKS && this.umbralIceGauge.value !== MAX_ASTRAL_UMBRAL_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = null
		}
	}

	private gaugeValuesChanged(lastGaugeEvent?: BLMGaugeState) {
		if (lastGaugeEvent == null) {
			return true
		}
		if (lastGaugeEvent.astralFire !== this.astralFireGauge.value ||
			lastGaugeEvent.umbralIce !== this.umbralIceGauge.value ||
			lastGaugeEvent.umbralHearts !== this.umbralHeartsGauge.value ||
			lastGaugeEvent.enochian !== this.enochianActive ||
			lastGaugeEvent.polyglot !== this.polyglotGauge.value
		) {
			return true
		}
		return false
	}
	//#endregion

	//#region Astral Fire and Umbral Ice
	private onAstralUmbralTimeout(_args: TimestampHookArguments) {
		this.onAstralUmbralEnd(true)
	}

	private onAstralUmbralEnd(flagIssues: boolean) {
		this.astralFireTimer.reset()
		this.astralFireGauge.reset()

		this.umbralIceTimer.reset()
		this.umbralIceGauge.reset()

		this.onEnochianTimeout(flagIssues)
	}

	private onGainAstralFireStacks(stackCount: number, dropsElementOnSwap: boolean = true) {
		if (!this.umbralIceGauge.empty && dropsElementOnSwap) {
			this.onAstralUmbralEnd(true)
		} else {
			this.umbralIceTimer.reset()
			this.umbralIceGauge.reset()

			this.astralFireTimer.start()
			this.astralFireGauge.generate(stackCount)

			this.addEvent()
		}
	}

	private onGainUmbralIceStacks(stackCount: number, dropsElementOnSwap: boolean = true) {
		if (!this.astralFireGauge.empty && dropsElementOnSwap) {
			this.onAstralUmbralEnd(true)
		} else {
			this.astralFireTimer.reset()
			this.astralFireGauge.reset()

			this.umbralIceTimer.start()
			this.umbralIceGauge.generate(stackCount)

			this.addEvent()
		}
	}

	private onTransposeStacks() {
		// If we're in neither stance, Transpose is a no-op
		if (this.astralFireGauge.empty && this.umbralIceGauge.empty) { return }

		// If we're currently in Fire, we're swapping to Ice
		if (!this.astralFireGauge.empty) {
			this.onGainUmbralIceStacks(1, false)
		} else { // Otherwise, we're swapping to fire
			this.onGainAstralFireStacks(1, false)
		}

		this.addEvent()
	}
	//#endregion

	//#region Umbral Hearts
	private tryGainUmbralHearts(count: number) {
		if (this.umbralIceGauge.empty) { return }

		this.umbralHeartsGauge.generate(count)

		this.addEvent()
	}

	private tryConsumeUmbralHearts(count:  number, force: boolean = false) {
		if (this.umbralHeartsGauge.empty || (this.astralFireGauge.empty && !force)) { return }

		this.umbralHeartsGauge.spend(count)

		this.addEvent()
	}
	//#endregion

	//#region Polyglot
	private onEnochianTimeout(flagIssues: boolean = true) {
		if (this.polyglotTimer.active && flagIssues) {
			this.droppedEnoTimestamps.push(this.parser.currentEpochTimestamp)
		}

		this.polyglotTimer.reset()

		this.enochianActive = false
		this.umbralHeartsGauge.reset()

		this.addEvent()
	}

	private onGainPolyglot() {
		this.polyglotTimer.refresh()

		if (this.polyglotGauge.capped) {
			this.overwrittenPolyglot++
		}

		this.polyglotGauge.generate(1)

		this.addEvent()
	}

	private onConsumePolyglot() {
		if (this.polyglotGauge.empty && this.overwrittenPolyglot > 0) {
			// Safety to catch ordering issues where Foul is used late enough to trigger our overwrite check but happens before Poly actually overwrites
			this.overwrittenPolyglot--
		}

		this.polyglotGauge.spend(1)

		this.addEvent()
	}

	private startEnochianUptime() {
		this.enochianActive = true
		this.polyglotTimer.start()
	}

	// Refund unable-to-act time if the downtime window was longer than the AF/UI timer
	private countLostPolyglots(time: number) {
		return Math.floor(time / ENOCHIAN_DURATION_REQUIRED)
	}
	//#endregion

	override onDeath() {
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this.onAstralUmbralEnd(false)
	}

	private onComplete() {
		const fightStartLeniency = this.parser.pull.timestamp + this.data.actions.FIRE_IV.castTime // Give the player a bit of time at the start to get Enochian up. Using F4's cast time as a proxy for this
		const forceDropUtaWindows = this.unableToAct.getWindows().filter(uta => Math.max(0, uta.end - uta.start) >= ASTRAL_UMBRAL_DURATION)
		const forceDropForgive = this.data.actions.BLIZZARD_III.castTime + 1000 // Allow a Blizzard III cast time's worth of time (plus a second's worth of jitter) to get Enochian back up after a UTA
		const polyGlotExpirationTime = this.polyglotTimer.getExpirationTime(fightStartLeniency, this.parser.currentEpochTimestamp, forceDropUtaWindows, forceDropForgive)
		const lostPolyglot = this.countLostPolyglots(polyGlotExpirationTime)

		// Find out how many of the enochian drops ocurred during times where the player could not act for longer than the AF/UI buff timer. If they could act, they could've kept it going, so warn about those.
		const droppedEno = this.droppedEnoTimestamps.filter(drop =>
			this.unableToAct
				.getWindows({
					start: drop,
					end: drop,
				})
				.filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION)
				.length === 0
		).length
		if (droppedEno > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.ENOCHIAN.icon,
				content: <Trans id="blm.gauge.suggestions.dropped-enochian.content">
					Dropping <DataLink action="ENOCHIAN"/> may lead to lost <DataLink action="XENOGLOSSY"/> or <DataLink action="FOUL"/> casts, more clipping because of additional <DataLink action="ENOCHIAN"/> casts, unavailability of <DataLink action="FIRE_IV"/> and <DataLink action="BLIZZARD_IV"/> or straight up missing out on the 15% damage bonus that <DataLink action="ENOCHIAN"/> provides.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.gauge.suggestions.dropped-enochian.why">
					<DataLink showIcon={false} action="ENOCHIAN"/> was dropped <Plural value={droppedEno} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (lostPolyglot > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.lost-polyglot.content">
					You lost Polyglot due to dropped <DataLink action="ENOCHIAN"/>. <DataLink action="XENOGLOSSY"/> and <DataLink action="FOUL"/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.lost-polyglot.why">
					<Plural value={lostPolyglot} one="# Polyglot stack was" other="# Polyglot stacks were"/> lost.
				</Trans>,
			}))
		}

		if (this.overwrittenPolyglot > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-polyglot.content">
					You overwrote Polyglot due to not casting <DataLink action="XENOGLOSSY"/> or <DataLink action="FOUL"/> for 30s after gaining a second stack. <DataLink action="XENOGLOSSY"/> and <DataLink action="FOUL"/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.overwritten-polyglot.why">
					<DataLink showIcon={false} action="XENOGLOSSY"/> got overwritten <Plural value={this.overwrittenPolyglot} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}

