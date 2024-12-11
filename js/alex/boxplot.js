class BoxPlotVis {
    constructor(parentElement, data, topReasons) {
        this.parentElement = parentElement;
        this.data = data;
        this.topReasons = topReasons;
        console.log('topReasons',this.topReasons);
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 50, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale).tickFormat(d3.format(".0s"));

        vis.svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${vis.height})`);
        vis.svg.append("g").attr("class", "y-axis");

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(255, 255, 255, 0.8)")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "12px");


        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;
        let flattenedData = [];
        vis.data.forEach(d => {
            if (d.Reason) {
                let reasons = d.Reason.split(",").map(r => r.trim());
                reasons.forEach(reason => {
                    flattenedData.push({
                        title: d.Title,
                        reason: reason,
                        ratings_count: +d.ratings_count,
                        year: +d.Publish_Year
                    });
                });
            }
        });

        let reasonCounts = d3.rollups(flattenedData, v => v.length, d => d.reason)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let topReasons = new Set(reasonCounts.map(d => d[0]));

        let filteredData = flattenedData.filter(d => topReasons.has(d.reason));
//now i need to do the year part
        let timefilteredData = [];

        if (selectedTimeRange.length !== 0) {
            console.log('selectedTimeRange', selectedTimeRange);

            selectedTimeRange.sort((a, b) => a - b);

            timefilteredData = filteredData.filter(row => {
                let publicationYear = row.year; // Ensure row.year is already a number
                return publicationYear >= selectedTimeRange[0].getFullYear() && publicationYear <= selectedTimeRange[1].getFullYear();
            });
        } else {
            timefilteredData = filteredData;
        }


        vis.boxplotData = Array.from(topReasons).map(reason => {
            let ratings = timefilteredData.filter(d => d.reason === reason).map(d => d.ratings_count);

            if (ratings.length === 0) return null;

            let sorted = ratings.sort(d3.ascending);
            let q1 = d3.quantile(sorted, 0.25);
            let median = d3.quantile(sorted, 0.5);
            let q3 = d3.quantile(sorted, 0.75);
            let min = sorted[0];
            let max = sorted[sorted.length - 1];

            return {
                reason,
                ratings,
                ratingsCount: ratings.length,
                min,
                q1,
                median,
                q3,
                max,
                dataPoints: ratings.map(rating => ({ reason, rating })) // For jittered points
            };
        }).filter(d => d !== null);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.xScale.domain(vis.boxplotData.map(d => d.reason));
        vis.yScale.domain([0, d3.max(vis.boxplotData, d => d.max)]);

        vis.svg.select(".x-axis").call(vis.xAxis).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
        vis.svg.select(".y-axis").call(vis.yAxis);

        let boxWidth = vis.xScale.bandwidth() * 0.7;

        let boxes = vis.svg.selectAll(".box").data(vis.boxplotData);

        let boxEnter = boxes.enter().append("g").attr("class", "box");

        boxEnter.append("rect")
            .attr("class", "iqr")
            .merge(boxes.select(".iqr"))
            .attr("x", d => vis.xScale(d.reason) + (vis.xScale.bandwidth() - boxWidth) / 2)
            .attr("width", boxWidth)
            .attr("y", d => vis.yScale(d.q3))
            .attr("height", d => vis.yScale(d.q1) - vis.yScale(d.q3))
            .attr("fill", "#69b3a2");

        boxEnter.append("line")
            .attr("class", "median")
            .merge(boxes.select(".median"))
            .attr("x1", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("x2", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("y1", d => vis.yScale(d.median))
            .attr("y2", d => vis.yScale(d.median))
            .attr("stroke", "black");

        boxEnter.append("line")
            .attr("class", "whisker")
            .merge(boxes.select(".whisker"))
            .attr("x1", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("x2", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("y1", d => vis.yScale(d.min))
            .attr("y2", d => vis.yScale(d.max))
            .attr("stroke", "black");

        boxes.exit().remove();

        let jitter = 0.4;
        let points = vis.svg.selectAll(".points").data(vis.boxplotData.flatMap(d =>
            d.ratings.map(r => ({ reason: d.reason, rating: r }))
        ));

        let pointRadius = 3;

        points.enter()
            .append("circle")
            .attr("class", "points")
            .attr("cx", d =>
                vis.xScale(d.reason) + vis.xScale.bandwidth() / 2 + (Math.random() - 0.5) * boxWidth * jitter
            )
            .attr("cy", d => vis.yScale(d.rating))
            .attr("r", pointRadius)
            .attr("fill", "rgba(100, 100, 200, 0.7)")
            .merge(points)
            .transition()
            .duration(500)
            .attr("cx", d =>
                vis.xScale(d.reason) + vis.xScale.bandwidth() / 2 + (Math.random() - 0.5) * boxWidth * jitter
            )
            .attr("cy", d => vis.yScale(d.rating));

        points.on("mouseover", function (event, d) {
            vis.tooltip.style("visibility", "visible")
                .html(`Reason: ${d.reason}<br>Rating: ${d.rating}`);
        })
            .on("mousemove", function (event) {
                vis.tooltip.style("top", (event.pageY + 5) + "px")
                    .style("left", (event.pageX + 5) + "px");
            })
            .on("mouseout", function () {
                vis.tooltip.style("visibility", "hidden");
            });

        points.exit().remove();
    }


    updateVis2() {
        let vis = this;

        vis.xScale.domain(vis.boxplotData.map(d => d.reason));
        vis.yScale.domain([0, d3.max(vis.boxplotData, d => d.max)]);

        vis.svg.select(".x-axis").call(vis.xAxis).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
        vis.svg.select(".y-axis").call(vis.yAxis);

        let boxWidth = vis.xScale.bandwidth() * 0.7;

        let boxes = vis.svg.selectAll(".box").data(vis.boxplotData);

        let boxEnter = boxes.enter().append("g").attr("class", "box");

        boxEnter.append("rect")
            .attr("class", "iqr")
            .merge(boxes.select(".iqr"))
            .attr("x", d => vis.xScale(d.reason) + (vis.xScale.bandwidth() - boxWidth) / 2)
            .attr("width", boxWidth)
            .attr("y", d => vis.yScale(d.q3))
            .attr("height", d => vis.yScale(d.q1) - vis.yScale(d.q3))
            .attr("fill", "#69b3a2");

        boxEnter.append("line")
            .attr("class", "median")
            .merge(boxes.select(".median"))
            .attr("x1", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("x2", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("y1", d => vis.yScale(d.median))
            .attr("y2", d => vis.yScale(d.median))
            .attr("stroke", "black");

        boxEnter.append("line")
            .attr("class", "whisker")
            .merge(boxes.select(".whisker"))
            .attr("x1", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("x2", d => vis.xScale(d.reason) + vis.xScale.bandwidth() / 2)
            .attr("y1", d => vis.yScale(d.min))
            .attr("y2", d => vis.yScale(d.max))
            .attr("stroke", "black");

        boxes.exit().remove();

        let jitter = 0.4;
        let points = vis.svg.selectAll(".points").data(vis.boxplotData.flatMap(d =>
            d.ratings.map(r => ({ reason: d.reason, rating: r }))
        ));

        let pointRadius = 3;

        points.enter()
            .append("circle")
            .attr("class", "points")
            .attr("cx", d =>
                vis.xScale(d.reason) + vis.xScale.bandwidth() / 2 + (Math.random() - 0.5) * boxWidth * jitter
            )
            .attr("cy", d => vis.yScale(d.rating))
            .attr("r", pointRadius)
            .attr("fill", "rgba(100, 100, 200, 0.7)")
            .merge(points)
            .transition()
            .duration(500)
            .attr("cx", d =>
                vis.xScale(d.reason) + vis.xScale.bandwidth() / 2 + (Math.random() - 0.5) * boxWidth * jitter
            )
            .attr("cy", d => vis.yScale(d.rating));

        points.on("mouseover", function(event, d) {
            vis.tooltip.style("visibility", "visible")
                .html(`Reason: ${d.reason}<br>Rating: ${d.rating}`);
        })
            .on("mousemove", function(event) {
                vis.tooltip.style("top", (event.pageY + 5) + "px")
                    .style("left", (event.pageX + 5) + "px");
            })
            .on("mouseout", function() {
                vis.tooltip.style("visibility", "hidden");
            });


        points.exit().remove();

        let tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(255, 255, 255, 0.8)")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "12px");

        // Add tooltip event listeners for the points (circles)
        points.on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`Reason: ${d.reason}<br>Rating: ${d.rating}`);
        })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY + 5) + "px")
                    .style("left", (event.pageX + 5) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });
    }

}