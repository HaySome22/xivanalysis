import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import Checklist, {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'

// In seconds
const USE_SEVERITY = {
	95: TARGET.WARN,
	100: TARGET.SUCCESS,
}

interface SwordOath {
	initial: number
	stacks: number
	used: number
}

export class Atonement extends Analyser {
	static override handle = 'Atonement'
	static override title = t('pld.Atonement.title')`Atonement`

	@dependency private checklist!: Checklist
	@dependency private data!: Data

	protected overcap: number = 0

	private currentSwordOath: SwordOath | undefined
	private swordOathHistory: SwordOath[] = []

	override initialise() {

		this.addEventHook({
			type: 'action',
			source: this.parser.actor.id,
			action: this.data.actions.ATONEMENT.id,
		}, this.onAtonement)

		this.addEventHook({
			type: 'statusApply',
			target: this.parser.actor.id,
			status: this.data.statuses.SWORD_OATH.id,
		}, this.onApplySwordOath)
		this.addEventHook({
			type: 'statusRemove',
			target: this.parser.actor.id,
			status: this.data.statuses.SWORD_OATH.id,
		}, this.onRemoveSwordOath)

		this.addEventHook('complete', this.onComplete)
	}

	private onAtonement() {
		if (this.currentSwordOath == null) { return }
		this.currentSwordOath.used++
	}

	private onApplySwordOath(event: Events['statusApply']): void {
		if (event.data == null) { return }

		// Track potential uses & any overcap due to reapplication while the status was still active
		if (event.data === this.data.statuses.SWORD_OATH.stacksApplied) {
			if (this.currentSwordOath != null) {
				this.overcap += this.currentSwordOath.stacks
				this.onRemoveSwordOath()
			}
		}

		if (this.currentSwordOath == null) {
			this.currentSwordOath = {
				initial: event.data,
				stacks: event.data,
				used: 0,
			}
		} else {
			this.currentSwordOath.stacks = event.data
		}
	}

	private onRemoveSwordOath(): void {
		if (this.currentSwordOath == null) { return }
		this.swordOathHistory.push(this.currentSwordOath)
		this.currentSwordOath = undefined
	}

	private onComplete() {
		this.onRemoveSwordOath()

		const stacks = this.data.statuses.SWORD_OATH.stacksApplied
		const stacksUsed = this.swordOathHistory.reduce((used, swordOath) => used + swordOath.used, 0)
		const potentialStacks = this.swordOathHistory.reduce((potential, swordOath) => potential + swordOath.initial, 0)
		// Leaving the following commented out since it's not actually being used right now, but here's the calculation for checking dropped stacks if that data becomes useful
		// const droppedStacks = this.swordOathHistory.reduce((dropped, swordOath) => dropped + Math.max(swordOath.initial - swordOath.used, 0), 0)

		this.checklist.add(new TieredRule({
			name: <Trans id= "pld.atonement.checklist.name"> Use Atonements Generated By Royal Authority </Trans>,
			description: <Trans id="pld.atonement.checklist.description">
				<DataLink action="ROYAL_AUTHORITY" /> generates {stacks} stacks of <DataLink status="SWORD_OATH" /> to use on <DataLink action="ATONEMENT" />.
				This is effectively the same as getting {stacks} uses of <DataLink showIcon={false} action="ROYAL_AUTHORITY" /> and you should make sure to use all stacks generated.
			</Trans>,
			tiers: USE_SEVERITY,
			requirements: [
				new Requirement({
					name: <Trans id="pld.atonement.checklist.requirement.atonement.name">
						Uses of <DataLink action="ATONEMENT" /> out of possible uses
					</Trans>,
					overrideDisplay: `${stacksUsed} / ${potentialStacks} (${this.getPercent(stacksUsed, potentialStacks).toFixed(2)}%)`,
					percent: this.getPercent(stacksUsed, potentialStacks),
				}),
			],
		}))
	}

	private getPercent(actual: number, possible: number): number {
		return ((actual/possible) * 100)
	}

}
