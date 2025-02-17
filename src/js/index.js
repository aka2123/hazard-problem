const controllPanelCheckboxes = document.querySelectorAll('.simulation__control-panel-checkbox')
const controllPanelInputs = document.querySelectorAll('.simulation__control-panel-input')
const controllPanelInputRounds = document.querySelector('.simulation__control-panel-input--rounds')
const controllPanelInputInitialCapital = document.querySelector('.simulation__control-panel-input--capital')
const controllPanelInputBet = document.querySelector('.simulation__control-panel-input--bet')
const controllPanelInputNumberOfPlayersForAStrategy = document.querySelector(
	'.simulation__control-panel-input--number-players'
)
const controllPanelInputChanseOfWinForStrategy = document.querySelector(
	'.simulation__control-panel-input--chanse-of-win'
)
const controllPanelInputInfoValues = document.querySelectorAll('.simulation__control-panel-input-value')
const header = document.querySelector('.header')

let rounds = +controllPanelInputRounds.value
console.log(rounds)
let initialCapital = +controllPanelInputInitialCapital.value
let numberOfPlayersForStrategy = +controllPanelInputNumberOfPlayersForAStrategy.value
let chanseOfWinOfTheStrategy = +controllPanelInputChanseOfWinForStrategy.value / 100
let lastRounds = []
let numLines = 10
let headerHeight = header.clientHeight
let headerWidth = header.clientWidth

function generateRandomPath() {
	let data = []
	let y = 15
	for (let x = 0; x <= 100; x += 10) {
		y += (Math.random() - 0.75) * 10
		data.push({ x, y })
	}
	return data
}
let tickSpacing = Math.ceil(rounds / 10)
let tickValues = d3.range(0, rounds + 1, tickSpacing)

const headerScaleX = d3.scaleLinear().domain([0, 100]).range([0, headerWidth])

const headerScaleY = d3.scaleLinear().domain([-20, 20]).range([headerHeight, 0])

const headerBackgroundSvg = d3
	.select('.header__svg')
	.attr('width', headerWidth)
	.attr('height', headerHeight + headerHeight * 0.3)

const headerCreateLines = d3
	.line()
	.x(d => headerScaleX(d.x))
	.y(d => headerScaleY(d.y))
	.curve(d3.curveLinear)

const headerLinesGroup = headerBackgroundSvg.append('g')

const headerLinesData = headerLinesGroup
	.selectAll('.header__svg-line')
	.data(Array.from({ length: numLines }, generateRandomPath))

const headerLines = headerLinesData
	.enter()
	.append('path')
	.attr('class', 'header__svg-line')
	.merge(headerLinesData)
	.attr('d', headerCreateLines)
	.attr('stroke', (d, i) => d3.interpolateBlues(i / numLines))
	.attr('stroke-width', 2)
	.attr('fill', 'none')
	.attr('opacity', 0.6)

headerBackgroundSvg.on('mousemove', function (event) {
	const [mouseX, mouseY] = d3.pointer(event)

	headerLines.each(function (d) {
		let newData = d.map(point => {
			let dx = headerScaleX(point.x) - mouseX
			let dy = headerScaleY(point.y) - mouseY
			let distance = Math.sqrt(dx * dx + dy * dy)

			if (distance < 100) {
				// Próg działania efektu
				let angle = Math.atan2(dy, dx)
				let force = (100 - distance) / 20 // Siła odpychania
				return {
					x: point.x + Math.cos(angle) * force,
					y: point.y + Math.sin(angle) * force,
				}
			}
			return point
		})
		d3.select(this).transition().duration(200).ease(d3.easeLinear).attr('d', headerCreateLines(newData))
	})
})
let timeout
headerBackgroundSvg.on('mouseleave', function () {
	clearTimeout(timeout)
	timeout = setTimeout(() => {
		headerLines
			.transition()
			.duration(500)
			.ease(d3.easeCubicOut)
			.attr('d', d => headerCreateLines(d))
	}, 300)
})
const strategies = {
	flatBet: (capital, bet) => bet,
	martingale: (capital, bet, prevLoss) => (prevLoss ? bet * 2 : bet),
	antiMartingale: (capital, bet, prevLoss) => (prevLoss ? bet : bet * 2),
}
const baseColors = {
	flatBet: d3.hsl('green'),
	martingale: d3.hsl('red'),
	antiMartingale: d3.hsl('blue'),
}

// Function to generate different shades for multiple players
const getShadedColor = (strategy, playerIndex, totalPlayers) => {
	let baseColor = baseColors[strategy] // Get base color
	let factor = 1 - (playerIndex / (totalPlayers + 1)) * 0.75
	let hFactor = (playerIndex / totalPlayers) * 70
	return d3.hsl(baseColor.h + hFactor, baseColor.s, baseColor.l * factor).formatRgb()
}

let strategyPlayers = {
	flatBet: [],
	martingale: [],
	antiMartingale: [],
}

const width = 600,
	height = 350,
	margin = 50

const scaleX = d3
	.scaleLinear()
	.domain([0, rounds])
	.range([margin, width - margin])
const scaleY = d3
	.scaleLinear()
	.domain([0, initialCapital * 2])
	.range([height - margin, margin])

// Tworzenie SVG
const svg = d3.select('.simulation__chart').attr('width', width).attr('height', height)
const gridGroup = svg.append('g').attr('class', 'simulation__chart-grid-group')


const xAxis = svg
	.append('g')
	.attr('transform', `translate(0,${height - margin})`)
	.call(d3.axisBottom(scaleX).tickValues(tickValues))
const yAxis = svg.append('g').attr('transform', `translate(${margin},0)`).call(d3.axisLeft(scaleY))

const yGrid = d3
	.axisLeft(scaleY)
	.tickSize(-width + 2 * margin)
	.tickFormat('')

const line = d3
	.line()
	.x(d => scaleX(d.index))
	.y(d => scaleY(d.value))
	.curve(d3.curveLinear)

const pathGroup = svg.append('g')
const pointsGroup = svg.append('g')
const tooltip = svg.append('g').attr('class', 'simulation__chart-tooltip')
const tooltipText = tooltip.append('text')

function updateChart() {
	gridGroup.attr('transform', `translate(${margin},0)`).call(yGrid)

	const strategyData = Object.entries(strategyPlayers).flatMap(([strategy, players]) =>
		players.map((playerData, index) => ({
			strategy,
			playerData,
			playerIndex: index,
			totalPlayers: players.length,
		}))
	)
	// console.log(strategyData)
	const strategyLines = pathGroup.selectAll('.strategy-line').data(strategyData)

	strategyLines
		.enter()
		.append('path')
		.attr('class', 'strategy-line')
		.attr('stroke', d => getShadedColor(d.strategy, d.playerIndex, d.totalPlayers))
		.attr('stroke-width', 2)
		.attr('fill', 'none')
		.attr('d', d => line(d.playerData))
		.each(function (d) {
			const totalLength = this.getTotalLength()
			d3.select(this)
				.attr('stroke-dasharray', totalLength + ' ' + totalLength)
				.attr('stroke-dashoffset', totalLength)
				.transition()
				.duration(750)
				.ease(d3.easeLinear)
				.attr('stroke-dashoffset', 0)
		})
		.merge(strategyLines)
		.attr('d', d => line(d.playerData))

	strategyLines.exit().remove()
}

const changeControllPanelInputInfoValues = () => {
	controllPanelInputInfoValues.forEach(InfoValue => {
		const inputOfInfoValue = InfoValue.parentElement.nextElementSibling

		InfoValue.textContent = inputOfInfoValue.value

		if (inputOfInfoValue.getAttribute('data-add-percentage')) {
			InfoValue.textContent = `${InfoValue.textContent}%`
		}
	})
}

const changeAControllPanelInputInfoValue = () => {
	controllPanelInputInfoValues.forEach(InfoValue => {
		const inputOfInfoValue = InfoValue.parentElement.previousElementSibling
		if (inputOfInfoValue === this) {
			if (InfoValue.classList.contains('simulation__control-panel-info-value--current')) {
				InfoValue.textContent = inputOfInfoValue.value
			}
		}
	})
}

const removeStrategyFromChart = () => {
	controllPanelCheckboxes.forEach(checkbox => {
		const strategyName = checkbox.dataset.strategyName
		if (checkbox.checked) {
			strategies[strategyName] = handleStrategiesFunctions(strategyName)
			strategyPlayers[strategyName] = []
		} else {
			delete strategies[strategyName]
			delete strategyPlayers[strategyName]
		}
	})
	updateChart()
}

function disableCheckbox() {
	let numOfSelectedCheckboxes = controllPanelCheckboxes.length

	controllPanelCheckboxes.forEach(checkbox => {
		if (!checkbox.checked) {
			numOfSelectedCheckboxes--
		}
	})
	controllPanelCheckboxes.forEach(checkbox => {
		if (checkbox.checked && numOfSelectedCheckboxes === 1) {
			checkbox.disabled = true
		} else {
			checkbox.disabled = false
		}
	})
}
const changeBetValue = () => {
	return initialCapital * (+controllPanelInputBet.value / 100)
}
function correctControllPanelInputsValues() {
	controllPanelInputs.forEach(input => {
		let inputValue = input.value.replace(/\D/g, '')

		if (inputValue < +input.getAttribute('min') || inputValue === '') {
			inputValue = +input.getAttribute('min')
		} else if (inputValue > +input.getAttribute('max')) {
			inputValue = +input.getAttribute('max')
		}
		input.value = inputValue
	})
	rounds = +controllPanelInputRounds.value
	initialCapital = +controllPanelInputInitialCapital.value
	numberOfPlayersForStrategy = +controllPanelInputNumberOfPlayersForAStrategy.value
	chanseOfWinOfTheStrategy = +controllPanelInputChanseOfWinForStrategy.value / 100
}
const handleStrategiesFunctions = strategyName => {
	const strategiesFunctions = {
		flatBet: (capital, bet) => bet,
		martingale: (capital, bet, prevLoss) => (prevLoss ? bet * 2 : bet),
		antiMartingale: (capital, bet, prevLoss) => (prevLoss ? bet : bet * 2),
	}
	return strategiesFunctions[strategyName]
}

function simulateGame() {
	correctControllPanelInputsValues()
	removeStrategyFromChart()
	lastRounds = []
	Object.keys(strategies).forEach(strategy => {
		for (let i = 0; i < numberOfPlayersForStrategy; i++) {
			let playerData = [{ index: 0, value: initialCapital }]
			let bet = changeBetValue()

			for (let round = 1; round <= rounds; round++) {
				let change = Math.random() < chanseOfWinOfTheStrategy ? bet : -bet
				let newValue = Math.max(0, playerData[round - 1].value + change)

				bet = strategies[strategy](newValue, bet, change < 0)

				playerData.push({ index: round, value: newValue })

				if (newValue === 0) {
					lastRounds.push(round)
					break
				} else if (round === rounds) {
					lastRounds.push(rounds)
				}
			}

			strategyPlayers[strategy].push(playerData)
		}
	})
	const maxValueOfLastRounds = Math.max(...lastRounds)
	scaleX.domain([0, maxValueOfLastRounds])
	scaleY.domain([0, d3.max(Object.values(strategyPlayers).flat(2), d => d.value) * 1.1])
	tickSpacing = Math.ceil(maxValueOfLastRounds / 10)
	tickValues = d3.range(0, maxValueOfLastRounds + 1, tickSpacing)
	xAxis.transition().duration(500).call(d3.axisBottom(scaleX).tickValues(tickValues))
	yAxis
		.transition()
		.duration(500)
		.call(d3.axisLeft(scaleY).tickFormat(d3.format('.2s')))

	updateChart()
}

d3.select('.simulation__control-panel-btn-start').on('click', simulateGame)

changeControllPanelInputInfoValues()
controllPanelCheckboxes.forEach(checkbox => checkbox.addEventListener('change', disableCheckbox))
controllPanelInputs.forEach(input => input.addEventListener('input', changeControllPanelInputInfoValues))
controllPanelInputBet.addEventListener('input', changeBetValue)
controllPanelInputInitialCapital.addEventListener('input', changeBetValue)
