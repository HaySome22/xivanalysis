import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const description = t('ast.about.description-2')`
Playing any healer requires you to carefully manage your MP and cooldowns to efficiently keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end up putting out more DPS with the extra GCDs gained.
`

export default new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	Description: () =><>
		<p><Trans id="ast.about.description-1">The biggest <DataLink action="DRAW" /> to an Astrologian is their ability to buff their party DPS with Arcanum.
		This analyzer will show you how the stars work for you and not the other way around</Trans></p>
		<TransMarkdown source={description} key="ast.about.description-2"/>
		<Message warning icon>
			<Icon name="warning sign" />
			<Message.Content>
				<Trans id="ast.about.description.warning.development">
				There's still lots more work to be done for this tool to be comprehensive! If you have a suggestion for what is worth tracking
				please pop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.05',
		to: '5.5',
	},
	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.CASUALSUPERMAN, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.OTOCEPHALY, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2021-11-30'),
			Changes: () => <>
				<strong>Updated sect suggestion, and <DataLink action="LIGHTSPEED" /> structure.</strong>:
				<ul>
					<li><DataLink action="LIGHTSPEED"/> now shows actual casts and total possible uses.</li>
					<li>Sect now has an updated suggestion to show possibility of using sect very close to the beginning of the encounter leading to unpreparedness. (i.e. using sect at the same time as the pull would be the same as using an oGCD which wastes time that could be spent starting your <DataLink action="MALEFIC_III" /> or other action cast.)</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2021-10-31'),
			Changes: () => <>
				Fix Undraw improperly not showing up in checklist.
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2021-09-24'),
			Changes: () => <>
				Astrologian support updated to 5.5 and added Players Buffed by divination to Arcana Tracking
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2020-12-07'),
			Changes: () => <>
				Astrologian support updated to 5.4
			</>,
			contributors: [CONTRIBUTORS.CASUALSUPERMAN],
		},
		{
			date: new Date('2020-12-01'),
			Changes: () => <>
				Fix incorrect action ID and timeline view for Diurnal Sect <DataLink action="ASPECTED_BENEFIC" />.
			</>,
			contributors: [CONTRIBUTORS.CASUALSUPERMAN],
		},
		{
			date: new Date('2020-10-05'),
			Changes: () => <>
				Fixed <DataLink action="EARTHLY_STAR" /> drift calculation.
			</>,
			contributors: [CONTRIBUTORS.CASUALSUPERMAN],
		},
		{
			date: new Date('2020-10-05'),
			Changes: () => <>
				Fixed bug where sect was always reported forgotten, even when it wasn't.
			</>,
			contributors: [CONTRIBUTORS.CASUALSUPERMAN],
		},
		{
			date: new Date('2020-08-13'),
			Changes: () => <>
				Updated AST for 5.3, adjustments to calculations for counting theoretical maximum card draws/plays.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2020-04-29'),
			Changes: () => <>
				Updated AST for 5.1 & 5.2
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-10-08'),
			Changes: () => <>
				Fixed bug where the target of the card wouldn't display if that target was yourself.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-09-25'),
			Changes: () => <>
				<DataLink action="SYNASTRY" /> now triggers a minor suggestion for single-target heals without it despite it being available.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-09-01'),
			Changes: () => <>
				<DataLink action="CELESTIAL_OPPOSITION" /> now triggers a suggestion for dropping uses.
				<DataLink action="DIVINATION" /> gets its own checklist tracker.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-08-10'),
			Changes: () => <>
				<DataLink action="HOROSCOPE" /> reworked tracking for accuracy
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-08-08'),
			Changes: () => <>
				<strong>Get more of those cards</strong>:
				<ul>
					<li>Calculation for number of <DataLink action="PLAY" /> in a fight</li>
					<li>Suggestions for not keeping (<DataLink action="DRAW" /><DataLink action="SLEEVE_DRAW" />) on cooldown</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-07-30'),
			Changes: () => <>
				<strong>5.05 Support</strong>:
				<ul>
					<li>Ability cast times and cooldowns updated for 5.05</li>
					<li>(<DataLink action="SLEEVE_DRAW" />) Arcana logs updated for 5.05</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-07-27'),
			Changes: () => <>
				<strong>Overheal and Celestial Intersection modules</strong>:
				<ul>
					<li>(<DataLink action="CELESTIAL_INTERSECTION" />) Throws a suggestion for infrequent usage</li>
					<li>Added an overheal checklist, which counts both heals and HoT percentage overheals for better clarity into the matter.</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-07-22'),
			Changes: () => <>
				<strong>Sect detection and Combust improvements</strong>:
				<ul>
					<li>(<DataLink action="COMBUST_III" />) Added warn tier at 85-90%</li>
					<li>(<DataLink action="DIURNAL_SECT" /><DataLink action="NOCTURNAL_SECT" />) Added support for modules to make Sect specific suggestions. <br/>
					Triggers a suggestion if player pulled without a sect on, and if they used Noct while healing with a Scholar</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-07-23'),
			Changes: () => <>
				<strong>Arcana play logs support for Shadowbringers</strong>:
				<ul>
					<li>(<DataLink action="PLAY" />) Arcana Logs are back up, now includes prepull Plays</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-07-11'),
			Changes: () => <>
				<strong>Basic support for Shadowbringers</strong>:
				<ul>
					<li>(<DataLink action="COMBUST_III" />) DoT update</li>
					<li>(<DataLink action="UNDRAW" />) Using it triggers suggestion not to use it</li>
					<li>(<DataLink action="LUCID_DREAMING" />, <DataLink action="LIGHTSPEED" />) Message update</li>
					<li>(<DataLink action="HOROSCOPE" />) Failing to read the cards again triggers suggestion</li>
					<li>(<DataLink action="PLAY" />) Coming soon™</li>
					<li>Made improvements to timeline CD display - merged draw actions, displaying horoscope and earthly detonations</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
	],
})
