import {ReportProcessingError} from 'errors'
import ky, {Options} from 'ky'
import _ from 'lodash'
import {Report} from 'store/report'
import {FflogsEvent, Fight, Pet, ReportEventsQuery, ReportEventsResponse} from './fflogs'

const token = process.env.REACT_APP_GQL_ACCESS_TOKEN;

const options: Options = {
	prefixUrl: process.env.REACT_APP_FFLOGS_V1_BASE_URL,
	// We're dealing with some potentially slow endpoints - avoid throwing obtuse errors if it takes a bit
	timeout: false,
}

if (process.env.REACT_APP_FFLOGS_V1_API_KEY) {
	options.searchParams = {
		api_key: process.env.REACT_APP_FFLOGS_V1_API_KEY,
	}
}

// Core API via ky
export const fflogsApi = ky.create(options)

function fetchEvents(code: string, searchParams: Record<string, string | number | boolean>) {
	return fflogsApi.get(
		`report/events/${code}`,
		{searchParams},
	).json<ReportEventsResponse>()
}

async function requestEvents(
	code: string,
	query: ReportEventsQuery,
) {
	const searchParams = query as Record<string, string | number | boolean>
	let response = await fetchEvents(
		code,
		searchParams,
	)

	// If it's blank, try again, bypassing the cache
	if (response === '') {
		response = await fetchEvents(
			code,
			{...searchParams, bypassCache: 'true'},
		)
	}

	// If it's _still_ blank, bail and get them to retry
	if (response === '') {
		throw new ReportProcessingError()
	}

	// If it's a string at this point, there's an upstream failure.
	if (typeof response === 'string') {
		throw new Error(response)
	}

	return response
}

// this is cursed shit
let eventCache: {
	key: string,
	events: FflogsEvent[],
} | undefined

async function getFflogsEventsGql(report, fight, source, start, end) {
	const url = 'https://www.fflogs.com/api/v2/user';
	const body = `
	query q {
		reportData {
			report(code: "${report}") {
				events(fightIDs: [${fight}], sourceID: ${source}) {
					data
					nextPageTimestamp
				}
			}
		}
	}
	`
	const res = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			query: body
		}),
		headers: {
			"Content-type": "application/json",
			'Authorization': `Bearer ${token}`,
		}
	})
	
	const body2 = `
	query q {
		reportData {
			report(code: "${report}") {
				events(fightIDs: [${fight}], filterExpression: "type=\\"targetabilityupdate\\"") {
					data
					nextPageTimestamp
				}
			}
		}
	}
	`
	const res2 = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			query: body2
		}),
		headers: {
			"Content-type": "application/json",
			'Authorization': `Bearer ${token}`,
		}
	})

	const data = await res.json();
	const data2 = await res2.json();

	return [...data.data.reportData.report.events.data, ...data2.data.reportData.report.events.data]
}

export async function getFflogsEventsNew(
	report: Report,
	fight: Fight,
	actorId,
) {
	const {code} = report
	
	const events = await getFflogsEventsGql(code, fight.id, actorId, fight.start_time, fight.end_time)

	for (let e of events) {
		e.ability = {guid: e.abilityGameID}
	}

	// And done
	return events
}

// Helper for pagination and suchforth
export async function getFflogsEvents(
	report: Report,
	fight: Fight,
	extra: ReportEventsQuery,
	authoritative = false,
) {
	const {code} = report
	const cacheKey = `${code}|${fight}`

	// Base parameters
	const searchParams: ReportEventsQuery = {
		start: fight.start_time,
		end: fight.end_time,
		translate: true,
		..._.omitBy(extra, _.isNil),
	}

	// If this is a non-authoritative request, and we have an
	// authoritative copy in cache, try to filter that into shape.
	if (!authoritative && eventCache?.key === cacheKey) {
		const filter = buildEventFilter(searchParams, report)
		if (filter != null) {
			return eventCache.events.filter(filter)
		}
	}

	// Initial data request
	let data = await requestEvents(code, searchParams)
	const events = data.events

	// Handle pagination
	while (data.nextPageTimestamp && data.events.length > 0) {
		searchParams.start = data.nextPageTimestamp
		data = await requestEvents(code, searchParams)
		events.push(...data.events)
	}

	// If this is an authoritative request, cache the data
	if (authoritative) {
		eventCache = {
			key: cacheKey,
			events,
		}
	}

	// And done
	return events
}

function buildEventFilter(
	query: ReportEventsQuery,
	report: Report,
) {
	const {start, end, actorid, filter} = query

	// TODO: Do we want to try and parse the mess of filters?
	if (filter != null) {
		return
	}

	const predicates: Array<(event: FflogsEvent) => boolean> = []

	if (start != null) {
		predicates.push((event: FflogsEvent) => event.timestamp >= start)
	}

	if (end != null) {
		predicates.push((event: FflogsEvent) => event.timestamp <= end)
	}

	if (actorid != null) {
		const petFilter = (pets: Pet[]) => pets
			.filter(pet => pet.petOwner === actorid)
			.map(pet => pet.id)

		const involvedActors = [actorid]
			.concat(petFilter(report.friendlyPets))
			.concat(petFilter(report.enemyPets))

		predicates.push((event: FflogsEvent) => false
			|| involvedActors.includes(event.sourceID ?? NaN)
			|| involvedActors.includes(event.targetID ?? NaN),
		)
	}

	return (event: FflogsEvent) => predicates.every(predicate => predicate(event))
}
