import {Attribute} from 'event'
import {ensureActions} from '../type'

export const DNC = ensureActions({
	SINGLE_STANDARD_FINISH: {
		id: 16191,
		icon: 'https://xivapi.com/i/003000/003459.png',
		name: 'Single Standard Finish',
		onGcd: true,
		cooldown: 1500,
	},
	DOUBLE_STANDARD_FINISH: {
		id: 16192,
		icon: 'https://xivapi.com/i/003000/003459.png',
		name: 'Double Standard Finish',
		onGcd: true,
		cooldown: 1500,
	},
	SINGLE_TECHNICAL_FINISH: {
		id: 16193,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Single Technical Finish',
		onGcd: true,
		cooldown: 1500,
	},
	DOUBLE_TECHNICAL_FINISH: {
		id: 16194,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Double Technical Finish',
		onGcd: true,
		cooldown: 1500,
	},
	TRIPLE_TECHNICAL_FINISH: {
		id: 16195,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Triple Technical Finish',
		onGcd: true,
		cooldown: 1500,
	},
	QUADRUPLE_TECHNICAL_FINISH: {
		id: 16196,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Quadruple Technical Finish',
		onGcd: true,
		cooldown: 1500,
	},
	CASCADE: {
		id: 15989,
		icon: 'https://xivapi.com/i/003000/003451.png',
		name: 'Cascade',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
		statusesApplied: ['FLOURISHING_CASCADE'],
	},
	FOUNTAIN: {
		id: 15990,
		icon: 'https://xivapi.com/i/003000/003452.png',
		name: 'Fountain',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 15989,
			end: true,
		},
		statusesApplied: ['FLOURISHING_FOUNTAIN'],
	},
	REVERSE_CASCADE: {
		id: 15991,
		icon: 'https://xivapi.com/i/003000/003460.png',
		name: 'Reverse Cascade',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},
	FOUNTAINFALL: {
		id: 15992,
		icon: 'https://xivapi.com/i/003000/003464.png',
		name: 'Fountainfall',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},
	WINDMILL: {
		id: 15993,
		icon: 'https://xivapi.com/i/003000/003453.png',
		name: 'Windmill',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
		statusesApplied: ['FLOURISHING_WINDMILL'],
	},
	BLADESHOWER: {
		id: 15994,
		icon: 'https://xivapi.com/i/003000/003461.png',
		name: 'Bladeshower',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 15993,
			end: true,
		},
		statusesApplied: ['FLOURISHING_SHOWER'],
	},
	RISING_WINDMILL: {
		id: 15995,
		icon: 'https://xivapi.com/i/003000/003463.png',
		name: 'Rising Windmill',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},
	BLOODSHOWER: {
		id: 15996,
		icon: 'https://xivapi.com/i/003000/003465.png',
		name: 'Bloodshower',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},
	STANDARD_STEP: {
		id: 15997,
		icon: 'https://xivapi.com/i/003000/003454.png',
		name: 'Standard Step',
		onGcd: true,
		cooldown: 30000,
		gcdRecast: 1500,
		statusesApplied: ['STANDARD_STEP'],
	},
	TECHNICAL_STEP: {
		id: 15998,
		icon: 'https://xivapi.com/i/003000/003473.png',
		name: 'Technical Step',
		onGcd: true,
		cooldown: 120000,
		gcdRecast: 1500,
		statusesApplied: ['TECHNICAL_STEP'],
	},
	EMBOITE: {
		id: 15999,
		icon: 'https://xivapi.com/i/003000/003455.png',
		name: 'Emboite',
		onGcd: true,
		cooldown: 1000,
	},
	ENTRECHAT: {
		id: 16000,
		icon: 'https://xivapi.com/i/003000/003456.png',
		name: 'Entrechat',
		onGcd: true,
		cooldown: 1000,
	},
	JETE: {
		id: 16001,
		icon: 'https://xivapi.com/i/003000/003457.png',
		name: 'Jete',
		onGcd: true,
		cooldown: 1000,
	},
	PIROUETTE: {
		id: 16002,
		icon: 'https://xivapi.com/i/003000/003458.png',
		name: 'Pirouette',
		onGcd: true,
		cooldown: 1000,
	},
	STANDARD_FINISH: {
		id: 16003,
		icon: 'https://xivapi.com/i/003000/003459.png',
		name: 'Standard Finish',
		onGcd: true,
		cooldown: 1500,
	},
	TECHNICAL_FINISH: {
		id: 16004,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Technical Finish',
		onGcd: true,
		cooldown: 1500,
	},
	SABER_DANCE: {
		id: 16005,
		icon: 'https://xivapi.com/i/003000/003476.png',
		name: 'Saber Dance',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},
	CLOSED_POSITION: {
		id: 16006,
		icon: 'https://xivapi.com/i/003000/003470.png',
		name: 'Closed Position',
		onGcd: false,
		cooldown: 30000,
	},
	FAN_DANCE: {
		id: 16007,
		icon: 'https://xivapi.com/i/003000/003462.png',
		name: 'Fan Dance',
		onGcd: false,
		cooldown: 1000,
		statusesApplied: ['FLOURISHING_FAN_DANCE'],
	},
	FAN_DANCE_II: {
		id: 16008,
		icon: 'https://xivapi.com/i/003000/003466.png',
		name: 'Fan Dance II',
		onGcd: false,
		cooldown: 1000,
		statusesApplied: ['FLOURISHING_FAN_DANCE'],
	},
	FAN_DANCE_III: {
		id: 16009,
		icon: 'https://xivapi.com/i/003000/003472.png',
		name: 'Fan Dance III',
		onGcd: false,
		cooldown: 1000,
	},
	EN_AVANT: {
		id: 16010,
		icon: 'https://xivapi.com/i/003000/003467.png',
		name: 'En Avant',
		onGcd: false,
		cooldown: 30000,
		charges: 3,
	},
	DEVILMENT: {
		id: 16011,
		icon: 'https://xivapi.com/i/003000/003471.png',
		name: 'Devilment',
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['DEVILMENT'],
	},
	SHIELD_SAMBA: {
		id: 16012,
		icon: 'https://xivapi.com/i/003000/003469.png',
		name: 'Shield Samba',
		onGcd: false,
		cooldown: 180000,
		statusesApplied: ['SHIELD_SAMBA'],
	},
	FLOURISH: {
		id: 16013,
		icon: 'https://xivapi.com/i/003000/003475.png',
		name: 'Flourish',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: [
			'FLOURISHING_CASCADE',
			'FLOURISHING_FOUNTAIN',
			'FLOURISHING_WINDMILL',
			'FLOURISHING_SHOWER',
			'FLOURISHING_FAN_DANCE',
		],
	},
	IMPROVISATION: {
		id: 16014,
		icon: 'https://xivapi.com/i/003000/003477.png',
		name: 'Improvisation',
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['IMPROVISATION', 'IMPROVISATION_HEALING'],
	},
	CURING_WALTZ: {
		id: 16015,
		icon: 'https://xivapi.com/i/003000/003468.png',
		name: 'Curing Waltz',
		onGcd: false,
		cooldown: 60000,
	},
	ENDING: {
		id: 18073,
		icon: 'https://xivapi.com/i/003000/003478.png',
		name: 'Ending',
		onGcd: false,
		cooldown: 1000,
	},
})
