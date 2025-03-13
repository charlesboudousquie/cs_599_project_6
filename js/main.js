// code partially inspired by https://d3-graph-gallery.com/graph/density_basic.html

// 49 percent very good
const animationTime = 1000;

const margins ={
    top: 30, right: 30, bottom: 30, left: 40
};

// const width = 900;
const width = document.getElementById("selections").offsetWidth;
const height = 600;

const graphWidth = width - margins.right - margins.left;
const graphHeight = height - margins.top - margins.bottom;

// selectors
const ids = [
    "numTrialsFromGUI", 
    "numSimsFromGUI",
    "percentToBetFromGUI",
    "winMultiplierFromGUI",
    "chanceOfBlowupFromGUI",
    "percentOfBetToBlowupFromGUI",
    "binNumberFromGUI",
    "kernelEpFromGUI",
];

function print(message){
    console.log(message);
}

let config = {};

function setConfigMember(configMember, newValue){
    config[configMember] = newValue;
    print(config);
}

let maxCapital = 0;
let endCapitals= [];

d3.select('#chart-area')
    .attr('x', 0);

var chartContainer = d3.select("#chart-area")
    .append("svg")
        .attr("width", width)
        .attr("height", height)
    .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top})`);


let lineCurve = chartContainer.append('g')
        .append('path')
        .attr("class", "graph_path")
        .attr('fill', 'none')
        .attr("opacity", ".8")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round");

let curveFilledArea = chartContainer.append('g')
    .append('path')
    .attr("fill", "#69b3a2")
    .attr("opacity", ".8");

// Kernel functions from: https://d3-graph-gallery.com/graph/density_basic.html
// Function to compute density
function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        // This returns an x,y coordinate for the path.
        // If x is just the monetary value of this tick,
        // then x-v is telling us how far this data point
        // is from this tick. The further the distance, the less
        // impact it has on bumping up the curve.
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }

  // k is bandwidth and controls the smoothness of the curve
  // by determining the influence each data item has.
function kernelEpanechnikov(k) {
    return function(v) {
        // k is always whatever you put into kernelEpanechnikov(N)
        const condition = Math.abs(v /= k) <= 1.0;
        return condition ? 0.75 * (1.0 - v * v) / k : 0.0;
    };
}

// let printedBets = false;

// simulate N bets and return end capital
function runBets(N, startingMoney) {
    let currentMoney = startingMoney;
    const percentToBet = config.percentToBetFromGUI / 100.0;
    const winMultiplier = config.winMultiplierFromGUI;
    
    // how likely is your bet to fail. Min is 1%, max is 100%
    const blowUpChance = config.chanceOfBlowupFromGUI / 100.0;
    
    // what percentage of your bet do you lose if the bet fails. min="1" max="100"
    const blowUpLossPercentage = config.percentOfBetToBlowupFromGUI / 100.0;
    
    // if(!printedBets) {
    //     print("-".repeat(10));
    //     print(`Current money: ${currentMoney}`);
    //     print(`Percent to bet: ${percentToBet}`);
    //     print(`Win multiplier: ${winMultiplier}`);
    //     print(`Blow-up chance: ${blowUpChance }`);
    //     print(`Blow-up loss percentage: ${blowUpLossPercentage }`);
    //     // printedBets = true;
    // }
    
    // run N bets
    for(let i = 0; i < N; i++){
        const success = blowUpChance < Math.random();
        const betAmount = currentMoney * percentToBet;
        const betResult = success ? (betAmount * winMultiplier) : (1.0 - blowUpLossPercentage) * betAmount;
        currentMoney -= betAmount;
        currentMoney += betResult;
        // if(!printedBets) {
        //     print("|".repeat(10));
        //     print(`success: ${success}`)
        //     print(`betAmount: ${betAmount}`)
        //     print(`betResult: ${betResult}`)
        //     print(`current money: ${currentMoney}`)
        //     print("|".repeat(10));
        // }
    }
    
    // if(!printedBets) {
    //     printedBets = true;
    //     print("-".repeat(10));
    // }

    return Math.floor(currentMoney);
}
    
function render(){
    // print("Rendering")
    // Create the x axis mapping from money to pixels.
    // get min and max of values to create appropriate padding
    const graphRange = d3.extent(endCapitals);
    // padding based on distance between minimum and maximum value
    const graphPadding = (graphRange[1] - graphRange[0]) * 0.3;
    const xMapping = d3.scaleLinear()
        .domain([Math.min(-graphPadding, -100), maxCapital + graphPadding + 500])
        .range([0, graphWidth]);

    // print(`Render: graphPadding ${graphPadding}`)
    // print(`Render: Max Capital ${maxCapital}`)
    // print(`Render: graphWidth ${graphWidth}`)
    // print(`Render: graphHeight ${graphHeight}`)

    chartContainer.select(".x_axis").remove();
    // shift it to bottom
    chartContainer.append('g')
        .attr("class", "x_axis")
        .attr("transform", `translate(0, ${graphHeight})`)
        .call(d3.axisBottom(xMapping));
    
    // estimator is a function that will take in various values.
    // The bin count should determine the number of ticks.
    const binCount = config.binNumberFromGUI;
    // Bandwidth determines how much influence a single point has on
    // the graph.
    const bandwidth = config.kernelEpFromGUI;
    let estimator = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xMapping.ticks(binCount));
    const density = estimator(endCapitals);

    let maxDensity = 0;
    for(let [_,y] of density) {
        if(isNaN(y)) {
            throw new Error("Nan found!");
        }
        maxDensity = Math.max(maxDensity, y);
    }

    // print( `max density is: ${maxDensity}`)

    // Create y mapping 
    const yMapping = d3.scaleLinear()
                .domain([0, maxDensity])
                // values close to 0 are mapped towards graphHeight,
                // values close to max are mapped towards top of graph.
                .range([graphHeight, 0]);
    
    chartContainer.select('.y_axis').remove();            
    chartContainer.append('g')
        .attr('class', 'y_axis')
        .call(d3.axisLeft(yMapping));

    // print(`density (length ${density.length}) is ${density}`);

    lineCurve
        .datum(density)
        .transition()
        .duration(animationTime)
        .attr('d',  d3.line()
        .curve(d3.curveBasis)
            .x(function(d) { return xMapping(d[0]); })
            .y(function(d) { return yMapping(d[1]); })
        );

    const curveArea = d3.area()
        .x(function(d) { return xMapping(d[0]); })
        // y0 is bottom of graph, so it has to be graphHeight
        .y0(function(d) { return graphHeight; })
        // y1 is top of curve
        .y1(function(d) { return yMapping(d[1]); })
        .curve(d3.curveBasis)

    curveFilledArea.datum(density)
        .transition()
        .duration(animationTime)
        .attr('d', curveArea);


    // JITTER PLOT of final capitals
    // The x is determined by what bin you are in.
    // The y is jittered to avoid drawing on top of each other.

    const jitterWidth = 10.0;
    const halfGraphHeight = graphHeight / 2.0;
    // remove old dots
    chartContainer.selectAll('circle').remove();

    endCapitals.sort((a, b) => a - b)
    // print(`end capitals for dots ${endCapitals}`)

     // Add dots
  chartContainer.append('g')
    .selectAll("dot")
    .data(endCapitals)
    .enter()
    .append("circle")
    .attr("cx", function (d) { 
        const baseX = xMapping(d);
        // let baseX = d;
        let offset = Math.random() * (jitterWidth / 2);
        offset *= Math.random() < 0.5 ? -1 : 1;
        return baseX + offset;
     } )
    .attr("cy", 
        // start at halfway point in graph,
        // then offset up or down by some random amount.
        function (d) {
            let offset = Math.random() * halfGraphHeight;
            offset *= Math.random() < 0.5 ? -1 : 1;
            return halfGraphHeight + offset;
    } )
    .attr("r", 1.5)
    .style("fill", "black")
    .style("opacity", "0.2")

}

function updateSimulation(){
    // print('Updating simulation')
    // print(`config is ${config}`)

    // printedBets = false;

    // update end capital values by rerunning simulation
    const simulations = config.numSimsFromGUI;
    const betsPerSimulation = config.numTrialsFromGUI;
    const startingMoney = 100;

    maxCapital = 0;
    endCapitals = new Array(simulations).fill(0);

    for(let i = 0; i < simulations; i++){
        let endCapital = runBets(betsPerSimulation, startingMoney);
        maxCapital = Math.max(maxCapital, endCapital);
        if(isNaN(endCapital)) {
            throw new Error("Nan found!");
        }
        endCapitals[i] = endCapital;
    }
}

for (let id of ids){
    // set up initial values of config
    config[id] = d3.select("#" + id).property("value");

    // print(`hooking up id ${id}`);
    d3.select("#" + id).on("change", function(d){
        print(`setting ${id} changed.`);
        setConfigMember(id, this.value);
        updateSimulation();
        render();
    });
}

// print(`config is initially`)
// console.dir(config)

updateSimulation();
render();

