let rounds = 20;
let initialCapital = 100;
let data = Array.from({ length: rounds }, () => initialCapital);
const width = 500, height = 350, margin = 50;

// Create scales
const scaleX = d3.scaleLinear().domain([0, rounds]).range([margin, width - margin]);
const scaleY = d3.scaleLinear().domain([0, initialCapital * 2]).range([height - margin, margin]);

// Create SVG
const svg = d3.select(".chart").attr("width", width).attr("height", height);

// Add axes
const xAxis = svg.append("g").attr("class", "chart__axis chart__axis--x").attr("transform", `translate(0,${height - margin})`).call(d3.axisBottom(scaleX).ticks(rounds));
const yAxis = svg.append("g").attr("class", "chart__axis chart__axis--y").attr("transform", `translate(${margin},0)`).call(d3.axisLeft(scaleY));

 
// Create line generator
const line = d3.line()
    .x((d, i) => scaleX(i))
    .y(d => scaleY(d))
    .curve(d3.curveLinear);
    

// Append path for line chart
const path = svg.append("path").datum(data).attr("class", "chart__line").attr("d", line);

// Update chart function
function updateChart() {
    path.datum(data)
        .transition().duration(500)
        .attr("d", line);
    yAxis.transition().duration(500).call(d3.axisLeft(scaleY));
}

// Simulate gambling rounds
function simulateGame() {
    data = [initialCapital];
    for (let i = 1; i < rounds; i++) {
        let change = Math.random() > 0.5 ? 10 : -10;
        data.push(Math.max(0, data[i - 1] + change));
    }
    scaleY.domain([0, d3.max(data) * 1.1]); // Adjust Y-axis dynamically
    updateChart();
}

// UI Controls
d3.select(".controll-panel__btn-start").on("click", simulateGame);
d3.select(".controll-panel__input--rounds").on("input", function() {
    rounds = +this.value;
    data = Array.from({ length: rounds }, () => initialCapital);
    scaleX.domain([0, rounds]);
    xAxis.transition().duration(500).call(d3.axisBottom(scaleX).ticks(rounds));
    updateChart();
});
d3.select(".controll-panel__input--capital").on("input", function() {
    initialCapital = +this.value;
    data = Array.from({ length: rounds }, () => initialCapital);
    scaleY.domain([0, initialCapital * 2]);
    yAxis.transition().duration(500).call(d3.axisLeft(scaleY));
    updateChart();
});
