class statePie {
    constructor(parentElement, bans_2023, category) {
        this.parentElement = parentElement;
        this.bans_2023 = bans_2023;
        this.category = category;
        this.colors = ['#12CECB', '#0B8381', '#053837'];

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Margin convention
        let parentSize = document.getElementById(vis.parentElement).getBoundingClientRect();
        vis.margin = {top: vis.category === "Ban Status" ? 10 : parentSize.height * .15, right: 10, bottom: vis.category === "Ban Status" ? parentSize.height * .15 : 10, left: 10};
        vis.width = parentSize.width - vis.margin.left - vis.margin.right;
        vis.height = parentSize.height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Grabbing this from week 8 lab

        vis.pieChartGroup = vis.svg
            .append('g')
            .attr('class', 'pie-chart')
            .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");
            
        // Define a default pie layout
        vis.pie = d3.pie()
            .value(d => d.count);

        // Pie chart settings
        let outerRadius = d3.min([vis.width, vis.height]) / 2;
        let innerRadius = 0;      // Relevant for donut charts

        // Path generator for the pie segments
        vis.arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

        // Tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip state-focus-tooltip")
            .attr('id', `pieTooltip-${vis.category[0]}`)

        // Title
        vis.title = vis.svg
            .append("text")
            .attr("class", "pie-title")

        // Title
        vis.title
            .text(vis.category)
            .attr("x", vis.width / 2)
            .attr("y", vis.category === "Ban Status" ? vis.margin.bottom + vis.height : -vis.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)

        this.wrangleData();
    }

    wrangleData() {
        let vis = this;

        let allCategory = [];
        vis.state = [...document.querySelectorAll('.state-focus:checked')].map((d) => d.value)[0];

        vis.bans_2023.forEach(function(book) {
            if (book.State === vis.state) {
                allCategory.push(book[vis.category]);
            }
            
        })
        
        let uniqueCategory = new Set(allCategory)

        vis.displayData = Array.from(uniqueCategory, function(d){
            
            let element = {
                reason: d,
                count: allCategory.filter(item => item === d).length
            };
            return element;
        })
        
        vis.displayData.forEach(function(d, i) {
            d.color = vis.colors[i];
        })


        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // Bind data
        vis.arcs = vis.pieChartGroup.selectAll(".state-focus-arc")
            .data(vis.pie(vis.displayData), (d) => {
                ("hi")
                console.log(d.data.reason)
                return d.data.reason
            })

        console.log(vis.arcs)
        vis.arcs.exit().remove()

        // Append paths
        vis.arcs.enter()
            .append("path")
            .attr("class", "state-focus-arc")
            .merge(vis.arcs)
            .attr("d", vis.arc)
            .attr("fill", (d) => d.data.color)
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('fill', '#e05547');

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY + "px")
                    .html(`
   
                            <h3>${vis.category}: ${d.data.reason}<h3>
                            <h4> bans: ${d.data.count}</h4>                             
                        `);     
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d => d.data.color)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
    }
}