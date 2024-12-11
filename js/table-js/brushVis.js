
class BrushVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.displayData = [];
        this.parseDate = d3.timeParse("%Y");

        this.initVis();
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 50, bottom: 20, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.x = d3.scaleTime().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + vis.height + ")");
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis--y");

        vis.barGroup = vis.svg.append("g")
            .attr("class", "bars");

        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush");

        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", function (event) {
                selectedTimeRange = [
                    vis.x.invert(event.selection[0]),
                    vis.x.invert(event.selection[1])
                ];

                myDataTable.wrangleData();
                myBoxPlot.wrangleData();


            });

        this.wrangleDataStatic();
    }

    wrangleDataStatic() {
        let vis = this;

        const parseDate = d3.timeParse("%m/%d/%Y");

        let booksByYear = d3.group(vis.data, d => {
            let pubDate = parseDate(d.publication_date);
            if (!pubDate) {
                console.warn("Invalid publication date:", d.publication_date);
                return null;
            }
            return pubDate.getFullYear();
        });

        booksByYear = new Map([...booksByYear].filter(([key, value]) => key !== null));

        vis.preProcessedData = [];

        booksByYear.forEach((books, year) => {
            vis.preProcessedData.push({
                date: d3.timeParse("%Y")(year),
                count: books.length
            });
        });

        vis.preProcessedData.sort((a, b) => a.date - b.date);

        this.updateVis();
    }


    handleBrush(selection) {
        if (!selection) return;

        let [x0, x1] = selection;
        let startYear = this.x.invert(x0).getFullYear();
        let endYear = this.x.invert(x1).getFullYear();

        let filteredBooks = this.data.filter(d => {
            let pubYear = this.parseDate(d.publication_date).getFullYear();
            return pubYear >= startYear && pubYear <= endYear;
        });

        myDataTable.updateVis(filteredBooks) // Assuming myDataTable.updateTableWithBooks() is a method to update your table

    }

    updateVis(){
        let vis = this;

        vis.x.domain(d3.extent(vis.preProcessedData, d => d.date));
        vis.y.domain([0, d3.max(vis.preProcessedData, d => d.count)]);

        vis.xAxis.transition().duration(400).call(d3.axisBottom(vis.x));
        vis.yAxis.transition().duration(400).call(d3.axisLeft(vis.y).ticks(5));

        vis.barGroup.selectAll("rect")
            .data(vis.preProcessedData)
            .enter()
            .append("rect")
            .attr("x", d => vis.x(d.date))
            .attr("y", d => vis.y(d.count))
            .attr("width", vis.width / vis.preProcessedData.length)
            .attr("height", d => vis.height - vis.y(d.count))
            .attr("fill", "#e05547");

        vis.brushGroup.call(vis.brush);
    }
}
