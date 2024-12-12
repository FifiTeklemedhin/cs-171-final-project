class bookGrid {
    constructor(parentElement, percentOneBan) {
        this.parentElement = parentElement;
        this.onlyBan = Math.round(percentOneBan * 100);

        this.initVis();
    }

    initVis() {
        let vis = this;
        
        // Margin convention
        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.square = Math.min(document.getElementById(vis.parentElement).getBoundingClientRect().width, document.getElementById(vis.parentElement).getBoundingClientRect().height)
        vis.width = vis.square - vis.margin.left - vis.margin.right;
        vis.height = vis.square - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.cellHeight = d3.min([vis.height, vis.width]) / 10 / 3 * 2; 
        vis.cellPadding = d3.min([vis.height, vis.width]) / 10 / 3 * 1;

        // For explanation of how to use custom svgs with symbol tag
        // https://observablehq.com/@bchoatejr/scatterplot-with-symbols
        let symbols = vis.svg.append("defs").html(`<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="0" name="book" viewBox="0 0 500 500">
            <path d="M 451.373 27.085 L 256.533 111.806 L 255.525 421.993 L 445.781 354.064 L 451.373 27.085 Z M 43.955 27.085 L 238.795 111.806 L 239.803 421.993 L 49.547 354.064 L 43.955 27.085 Z M 27.573 66.326 L 31.699 374.12 L 250.165 444.093 L 468.286 373.062 L 472.682 66.279 L 500 45.554 L 494.348 398.81 L 250.052 472.915 L 5.897 398.886 L 0 45.674 L 27.573 66.326 Z"></path>
        </symbol>
        </svg>
        `)

        vis.makeData();
    }

    makeData() {
        let vis = this;

        vis.data = [];

        for (let row = 0; row < 10; row++) {
            let line = [];
            for (let col = 0; col < 10; col++) {
                let entry = {
                    index : row * 10 + col,
                    filled : row * 10 + col < vis.onlyBan ? 1 : 0
                }
                line.push(entry);

            }
            vis.data.push(line)
        }

        vis.drawBooks();
    }

    drawBooks() {
        let vis = this;

        let rowGroups = vis.svg.selectAll("g.matrix-row")
            .data(vis.data)
            
        let rows = rowGroups.enter()
            .append("g")
            .attr("class", "matrix-row")
            .attr("transform", (d, i) => {
                return `translate(0, ${i * (vis.cellHeight + vis.cellPadding)})`;
            })


        let books = rows.selectAll(".book-paths")
			.data((d) => d);

		books.enter()
			.append("g")
            .attr("class", "book-paths")
            .attr("transform", (d, index) => `translate(${(vis.cellHeight + vis.cellPadding) * index},0)`)
            .call(g => g.append("use")
                .attr("href", `#0`)
                .attr("width", vis.cellHeight)
                .attr("height", vis.cellHeight)            
                .attr("stroke", "black")
                .attr("stroke-width", (d) => d.filled ? 0 : 10)
                .attr("fill", (d) => d.filled ? "#e05547" : "none"))
    }
}