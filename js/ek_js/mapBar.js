class MapBar {
    constructor(parentElement, pen_2122, pen_2223, pen_2324) {
        this.parentElement = parentElement;
        this.AY_21 = pen_2122;
        this.AY_22 = pen_2223;
        this.AY_23 = pen_2324;

        this.initVis();
    }

    initVis() {
        let vis = this; 

        // Step 3: Create the bar chart
        vis.margin = { top: 40, right: 10, bottom: 30, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.selectedState = "Florida";

        // Title
        vis.svg
            .append("text")
            .attr("id", "map-bars-title")

        // Axis
        vis.axis = vis.svg.append("g")
            .attr("transform", `translate(0,${vis.height})`)

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this; 

        // move wrangling from main to here? probably a good idea 

        // Most bans of any year
        vis.maxBans = d3.max([...Object.values(vis.AY_21), ...Object.values(vis.AY_22), ...Object.values(vis.AY_23)], (d) => d.totalBans)

        
        vis.displayData = [
            {
                year: "2021-22",
                bans: vis.AY_21[vis.selectedState] ? vis.AY_21[vis.selectedState].totalBans : 0, 
                id: "2021-22" + vis.selectedState
            }, 
            {
                year: "2022-23",
                bans: vis.AY_22[vis.selectedState] ? vis.AY_22[vis.selectedState].totalBans : 0,
                id: "2022-23" + vis.selectedState
            },
            {
                year: "2023-24",
                bans: vis.AY_23[vis.selectedState] ? vis.AY_23[vis.selectedState].totalBans : 0,
                id: "2023-24" + vis.selectedState
            }
        ]
        console.log(vis.displayData)

        vis.drawVis();
    }

    drawVis() {
        let vis = this;

        // Scales
        const x = d3.scaleBand()
            .domain(vis.displayData.map(((d) => d.year)))
            .range([0, vis.width])
            .padding(0.1);

        const y = d3.scaleLinear()
            // Do we want to emphasize vs its own prev years or vs all years all states
            //.domain([0, d3.max(vis.displayData, (d) => d.bans)])
            .domain([0, vis.maxBans])
            .nice()
            .range([vis.height, 0]);

        // Axes
        vis.axis
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "middle");

        // Bars
        vis.bars = vis.svg.selectAll(".bar")
            .data(vis.displayData, (d) => d.year)

        vis.bars.exit().remove();
        
        vis.bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(vis.bars)
            .transition()
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.bans))
            .attr("width", x.bandwidth())
            .attr("height", d => vis.height - y(d.bans))
            .attr("fill", "#12CECB");

        // Add labels
        vis.labels = vis.svg.selectAll(".label")
            .data(vis.displayData, (d) => d.year)

        vis.labels.exit().remove();
        
        vis.labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .merge(vis.labels)
            .transition()
            .attr("x", d => x(d.year) + x.bandwidth() / 2)
            .attr("y", d => y(d.bans) - 5)
            .text(d => d.bans);

        // Title
        vis.svg.select("#map-bars-title")
            .text("Total bans in " + vis.selectedState + " by academic year")
            .attr("x", vis.width / 2)
            .attr("y", -vis.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)

    }

    onStateClick(state) {
        let vis = this;

        vis.selectedState = state;
        vis.wrangleData();
    }
}
