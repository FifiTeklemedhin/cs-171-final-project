
class MapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, geoData, bookData, eventhandler) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.bookData = bookData;
        this.eventHandler = eventhandler;
        // this.covidData = covidData;
        // this.usaData = usaData;

        //console.log(bookData);
        this.displayData = [];
        this.colors = d3.scaleSequential()
            .interpolator(t => d3.interpolateBlues(0.15 + t * 0.8)); // referenced gpt: skips the lightest 20% of the range
        // .range(["#6f9c3d", "#a5c90f",
        //     "#ffb366", "#ff8829", "#fe6b40", "#a22626"]);
        //     .range(["#6f9c3d", "#a5c90f",
        //         "#ff8829", "#A2264B", "#A2264B", "#A2264B"]);

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis() {
        let vis = this;

        //console.log(vis.geoData)
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = vis.zoom = Math.min(vis.width / vis.viewpoint.width, vis.height / vis.viewpoint.height);//vis.height / vis.viewpoint.height;

        // code to center. referenced gpt
        const translateX = vis.width / 2 * (1 - vis.zoom);
        const translateY = vis.height / 2 * (1 - vis.zoom);

        // adjust map position
        vis.map = vis.svg.append("g") // group will contain all state paths
            .attr("class", "states map")
            // .attr('transform', `scale(${vis.zoom} ${vis.zoom})`)
            .attr(
            'transform',
            `translate(${translateX}, ${translateY}) scale(${vis.zoom} ${vis.zoom})`
        );




        vis.tooltip = d3.select("#" + vis.parentElement).append('div')
            .attr('class', 'tooltip map')
            .attr("width", vis.width * .4)
            .attr("height", vis.height * .4)
            .attr('id', 'map-tooltip')

        // TODO
        let zoom = 249.5




        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width/2, vis.height/2])
            .scale(1200)
        vis.path = d3.geoPath()
            .projection(vis.projection);
        // //console.log("geodata states",  vis.geoData.objects.states)
        vis.US = topojson.feature(vis.geoData, vis.geoData.objects.states).features
        // //console.log(vis.US[0])
        vis.states = vis.map.selectAll("path")
            .data(vis.US)
            .enter()
            .append("path")
            .attr('class', 'state map')
            .attr("d", vis.path);
            

        // Legend color. Referenced https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient/, and GPT for debugging
        let legendWidth = 300;
        let legendHeight = 20;

        let svgLegend = d3.select("#mapDiv")
            .append("svg")
            .attr("class", "svg-legend")
            .attr("width", legendWidth + 50)
            .attr("height", legendHeight + 40)
            .attr("transform", `translate(${vis.width - (legendWidth + 50)}, ${legendHeight})`);

    // Group for legend content
        let legendGroup = svgLegend.append("g")
            .attr("transform", `translate(${legendWidth / 2}, ${legendHeight})`);

        const gradient = svgLegend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

      // adds color range for gradient
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", vis.colors(vis.colors.domain()[0]));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", vis.colors(vis.colors.domain()[1]));

     // create rectangle with the fill of the gradient  just made
            legendGroup.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legend-gradient)");

        vis.wrangleData()
    }

    allBanStatusTypes() { // referenced gpt
        // Create a Set to store unique ban statuses
        let vis = this
        let uniqueStatuses = new Set();

        vis.bookData.forEach(row => {
            let banStatus = row['Ban Status']; // Column name for ban status
            if (banStatus) {
                uniqueStatuses.add(banStatus.trim());
            }
        });

        // Convert the Set to an array for easy handling
        uniqueStatuses = Array.from(uniqueStatuses);

        return(uniqueStatuses);
    }
     highestBooksByState()
     {
         let vis = this
         let topBooksByState = {}

         vis.bookData.forEach(row => {
             let state = row['State']
             let banStatus = row['Ban Status'];
             let totalRatings = parseInt(row['ratings_count']);
             let title = row['Title'];
             let author = row['Author'];
             let reason = row['Initiating Action']



             if(banStatus != null && banStatus.toLowerCase() === vis.selectedCategory || vis.selectedCategory === "all ban types") // property exists and the type of ban we want
             {

                 // if no data for state, add. else add if greatest rating so far
                 if(!topBooksByState[state] || topBooksByState[state].totalRatings < totalRatings)
                 {
                     topBooksByState[state] = {
                         title: title,
                         authors: author,
                         reason_banned: reason,
                         totalRatings: totalRatings
                     };
                 }
             }
         })
         console.log("total restricted books: ", vis.bookData)
         console.log("top books by state", topBooksByState)
         return topBooksByState
     }
    totalStatusByState()
    {
        let vis = this
        vis.selectedCategory =  document.getElementById('mapCategorySelector').value;

        let bannedBooksByState = {};

        vis.bookData.forEach(row => { // referenced gpt
            const state = row['State']; // Column name for state
            const banStatus = row['Ban Status']; // Column name for ban status
            if(vis.selectedCategory === "all ban types")
            {
                if (!bannedBooksByState[state]) {
                    bannedBooksByState[state] = 0;
                }
                bannedBooksByState[state]++;
            }
            // Only count if the book is banned
            else if (banStatus.toLowerCase() ===  vis.selectedCategory) {
                if (!bannedBooksByState[state]) {
                    bannedBooksByState[state] = 0;
                }
                bannedBooksByState[state]++;
            }
        });

        console.log("bannedBooksByState", bannedBooksByState);
        return bannedBooksByState

    }
    wrangleData() {


        let vis = this
        vis.selectedCategory =  document.getElementById('mapCategorySelector').value;

        vis.tallyStatusByState = vis.totalStatusByState()
        vis.topBooksByState = vis.highestBooksByState()
        vis.allBanStatusTypes()

        vis.colors.domain([
            d3.min(Object.values(vis.tallyStatusByState), function(d) { return d; }),
            d3.max(Object.values(vis.tallyStatusByState), function(d) { return d; })
        ]);

        // //console.log("colors domain", vis.colors.domain())

        d3.selectAll(".state")
            .on("mouseover", null)
            .on("mouseout", null)
            .on("click", null)

        vis.updateVis()

    }

    updateVis() {
        let vis = this;

        //console.log("updating vis")
        d3.selectAll(".state").each(function(d)
        { // d represents vis.world data bound to each element
           try
           {
               let name = d.properties.name
               // console.log("tally", vis.topBooksByState[d.properties.name] ? vis.tallyStatusByState[d.properties.name] : 0)
               let tally =  vis.tallyStatusByState[name]  ? vis.tallyStatusByState[name] : 0
               let color = vis.colors(tally);
               d.properties.color = color;
               d.properties.tally = tally;

               d3.select(this)
                   .style("fill", () => {
                        return tally ? color : "lightgrey"; 
                   })
                   .attr("class", () => {
                        return tally ? "state-w-bans state map" : "state-no-bans state map";
                   })
                   //.style("opacity", .8)
                   .text(tally === 0 ? "" : tally)

               let stateLabel = vis.svg.selectAll(`#${name}-label`).data(d)
               stateLabel.enter().append("text")
                   .class(`#${name}-label map`)
                   .merge(stateLabel)
                   .text(tally === 0 ? "" : tally)
                   // .attr("transform", `translate(${d3.geoCentroid(d)[0] * -1}, ${d3.geoCentroid(d)[1]})`)
                   .attr("x", 0) // X-coordinate of state centroid
                   .attr("y", 0) // Y-coordinate of state centroid
                   .attr("text-anchor", "middle")
                   .attr("font-size", "50px")

           }
           catch
           {
              //console.log("region/state not in data: ", d.properties.name)
           }
        });



        d3.selectAll(".state-w-bans").on('mouseover', function(event, d) {

            

            let state = d.properties.name
            let stateData = vis.topBooksByState[state] != undefined ? vis.topBooksByState[state] : {
                    title: "NA",
                    authors: "NA",
                    reason_banned: "NA",
                    totalRatings: "NA"
            }
            vis.tooltip.html(`
                            <h3>${state}'s Most Banned Book</h3>
                            Title: ${stateData.title} <br><br>
                            Authors: ${stateData.authors} <br><br>
                            Reason Banned: ${stateData.reason_banned} <br><br>
                        `);

            // Get the bounding rectangle of the hovered element. referenced GPT
            let { x, y } = this.getBoundingClientRect();
            //let positionFactor = -180
            let positionFactor = 20;


            vis.tooltip.style("opacity", 1)
                .style("top", `${y}px`)//.attr("transform", "translate(" +x + "," + y + ")")
                //.style("left", `${x <= 150 ? x : x + positionFactor}px`)
                .style("left", () => {
                    let tooltipWidth = document.getElementById("map-tooltip").getBoundingClientRect().width;
                    return tooltipWidth + positionFactor > event.pageX ? event.pageX + positionFactor + "px" : event.pageX - (positionFactor + tooltipWidth) + "px";
                })

            d3.select(this)
                .style('fill', '#12CECB')


        })
        .on('mouseout', function(event, d){
            vis.tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);
            
            d3.select(this)
                .style("fill", () => {
                    return d.properties.tally ? d.properties.color : "lightgrey"; 
                })
        })
        .on("click", function(event, d) {
            // Change barchart
            vis.eventHandler.trigger("stateClick", d.properties.name);
            
        })

    }


}