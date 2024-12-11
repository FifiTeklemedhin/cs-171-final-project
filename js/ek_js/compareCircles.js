class compareCircles {
    constructor(parentElement, bans_2015, bans_2021, bans_2022, bans_2023) {
        this.parentElement = parentElement;
        this.bans_2015 = bans_2015;
        this.bans_2021 = bans_2021;
        this.bans_2022 = bans_2022;
        this.bans_2023 = bans_2023;

        this.initVis();
    }

    initVis() {
        let vis = this;
        
        // Margin convention
        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
        
        vis.c_2023 = vis.svg.append("g")
            .attr("class", "2022-circle")
        vis.c_2022 = vis.svg.append("g")
            .attr("class", "2022-circle")
        vis.c_2021 = vis.svg.append("g")
            .attr("class", "2021-circle")
        vis.c_2015 = vis.svg.append("g")
            .attr("class", "2015-circle")

        vis.rscale = d3.scaleLinear().domain([0,
                                            Math.sqrt(d3.max([vis.bans_2015, vis.bans_2021, vis.bans_2022, vis.bans_2023]))])
                                    .range([0, d3.min([vis.width, vis.height]) / 3])
    }

    drawCircles() {
        let vis = this;

        let transition1 = 1000;

        vis.c_2015 = vis.c_2015
            .append("circle")
            .attr("cx", vis.width / 2)
            .attr("cy", vis.height / 2)
            .attr("r", d3.min([vis.width, vis.height]) / 3)
            .attr("opacity", 0)
            .attr("class", "circle_2015")

        vis.c_2015
            .transition()
            .duration(transition1)
            .attr("fill", "#45C0C9")
            .attr("opacity", 1)

        vis.c_2015_text = vis.svg
            .append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height / 2)
            .attr("text-anchor", "middle")
            .attr("opacity", 0)
            .attr("fill", "white")
            .text(`${vis.bans_2015}`)
            
        
        vis.c_2015_text
            .transition()
            .duration(transition1)
            .attr("opacity", 1)

        d3.select("#compareCircles-text")
            .append("p")
            .html(`In 2015, the American Library Association reported <span style="color: #45C0C9; font-weight: bold;">${vis.bans_2015}</span> challenges to books in US schools.
                A challenge isn't a ban—it's just an attempt to remove a book and doesn't necessarily succeed.`)
            .style("opacity", 0)
            .transition()
            .duration(transition1)
            .style("opacity", 1)
            .on("end", function() {
                vis.paragraph2()
            })
            
    }

    paragraph2() {
        let vis = this;
        let transition2 = 1500;

        d3.select("#compareCircles-text")
            .append("p")
            .style("opacity", 0)
            .text(`Challenges and bans have only risen since then.`)
            .transition()
            .duration(transition2)
            .style("opacity", 1)
            .on("end", function() {
                vis.shrinkCircle()
            })
    }

    shrinkCircle() {
        let vis = this;
        let transition2 = 1500;

        vis.c_2015_text
            .transition()
            .duration(transition2)
            .style("opacity", 0)
            .remove()

        vis.c_2015
            .transition()
            .duration(transition2)
            .attr("r", () => vis.rscale(Math.sqrt(vis.bans_2015)))
            .on("end", function() {
                vis.circle2021()
            })
    }

    circle2021() {
        let vis = this;

        let transition3 = 1500;

        d3.select("#compareCircles-text")
            .append("p")
            .style("opacity", 0)
            .html(`During the 2021-22 academic year, PEN America recorded
                <span style="color: #0B8381; font-weight: bold;">${vis.bans_2021}</span> instances of books being banned by school districts.`)
            .transition()
            .duration(transition3)
            .style("opacity", 1)

        vis.c_2021
            .append("circle")
            .attr("cx", vis.width / 2)
            .attr("cy", vis.height / 2)
            .attr("r", () => vis.rscale(Math.sqrt(vis.bans_2021)))
            .attr("opacity", 0)
            .attr("fill", "#0B8381")
            .transition()
            .duration(transition3)
            .attr("opacity", 1)
            .on("end", function() {
                vis.paragraph3()
            })
    }

    paragraph3() {
        let vis = this;
        let transition4 = 1500;

        d3.select("#compareCircles-text")
            .append("p")
            .style("opacity", 0)
            .html(`During the 2022-23 academic year, they recorded
            <span style="color: #0BB071; font-weight: bold;">${vis.bans_2022}</span>.`)
            .transition()
            .duration(transition4)
            .style("opacity", 1)
            .on("end", function() {
                vis.paragraph4()
            })

        vis.c_2022
            .append("circle")
            .attr("cx", vis.width / 2)
            .attr("cy", vis.height / 2)
            .attr("r", () => vis.rscale(Math.sqrt(vis.bans_2022)))
            .attr("opacity", 0)
            .attr("fill", "#0BB071")
            .transition()
            .duration(transition4)
            .attr("opacity", 1)
    }

    paragraph4() {
        let vis = this;
        let transition5 = 1500;

        d3.select("#compareCircles-text")
            .append("p")
            .style("opacity", 0)
            .html(`Last year, 2023-24, they counted <span style="color: #032A29; font-weight: bold;">${vis.bans_2023}</span> bans.`)
            .transition()
            .duration(transition5)
            .style("opacity", 1)
            .on("end", function() {
                vis.conclusionPar()
            })

        vis.c_2023
            .append("circle")
            .attr("cx", vis.width / 2)
            .attr("cy", vis.height / 2)
            .attr("r", () => vis.rscale(Math.sqrt(vis.bans_2023)))
            .attr("opacity", 0)
            .attr("fill", "#032A29")
            .transition()
            .duration(transition5)
            .attr("opacity", 1)
    }

    conclusionPar() {
        let transition6 = 1500;

        d3.select("#compareCircles-conclusion")
        .append("p")
        .style("opacity", 0)
        .html(`That might seem like a lot of bans, but is it? With 50 states and (typically) tens to hundreds of school districts
                per state, <span class="brown-highlight">are there just a few controversial books being broadly banned across the country?</span>`)
        .transition()
        .duration(transition6)
        .style("opacity", 1)
    }
}