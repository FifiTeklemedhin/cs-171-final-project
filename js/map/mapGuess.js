
class mapGuess {

    // constructor method to initialize Timeline object
    constructor(parentElement, geoData, bookData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.bookData = bookData;

        this.displayData = [];
        this.colors = d3.scaleSequential().interpolator(t => d3.interpolateBlues(0.15 + t * 0.8)); // referenced gpt: skips the lightest 20% of the range
        //d3.scaleSequential().interpolator(d3.interpolateRgb('#ea3939', '#d54a1e', '#39a105', '#126c04', '#FFFF00', '#BFFF00', '#80FF00', '#40FF00', '#00FF00'))
            //d3.scaleSequential().interpolator(t => d3.interpolateBlues(0.15 + t * 0.8)); // referenced gpt: skips the lightest 20% of the range

       this.gameStatus = "playing";

        this.initVis()
    }

    initVis() {
        let vis = this;

        //console.log(vis.geoData)
        vis.margin = {top: 0, right: 20, bottom: 20, left: 20};
        vis.width = document.documentElement.clientWidth * 0.66 - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("id", "us-map")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = Math.min(vis.width / vis.viewpoint.width, vis.height / vis.viewpoint.height); //vis.width / vis.viewpoint.width;

        // code to center. referenced gpt
        const translateX = vis.width / 2 - (vis.width / 2 * vis.zoom);
        const translateY = vis.height / 2 - (vis.height / 2 * vis.zoom);

        // adjust map position
        vis.map = vis.svg.append("g") // group will contain all state paths
            .attr("class", "states-guessing map-guessing")
            // .attr('transform', `scale(${vis.zoom} ${vis.zoom})`)
            .attr('transform', `translate(${translateX}, ${translateY}) scale(${vis.zoom} ${vis.zoom})`);



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
            .attr('class', 'state-guessing map-guessing')
            .attr("d", vis.path)

        // Legend color. Referenced https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient/, and GPT for debugging
        let legendWidth = 300;
        let legendHeight = 20;

        vis.svgLegend = d3.select("#mapSvg")
            .append("svg")
            .attr("class", "svg-legend")
            .attr("width", legendWidth + 50)
            .attr("height", legendHeight + 40)
            .attr("transform", `translate(${vis.width - (legendWidth + 50)}, ${legendHeight})`);

    // Group for legend content
        let legendGroup = vis.svgLegend.append("g")
            .attr("transform", `translate(${legendWidth / 2}, ${legendHeight})`);

        const gradient = vis.svgLegend.append("defs")
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

        vis.updateVis()

    }

    updateVis() {
        let vis = this;



        if(vis.gameStatus === "playing")
        {
            console.log("playing game!")
            d3.select('#correct-map-guesses').text("")
            d3.select('#incorrect-map-guesses').text("")
            vis.svgLegend.style("opacity", 0);
            d3.selectAll(".state-guessing").style("fill", 'gray')
            // let guessingStatusDiv = vis.svg.select("#guessing-status-div")

            // color a state green if clicked on and has a banned book. else, if clicked on turn red.
            d3.selectAll(".state-guessing").on('click', function(event, d) {

                let state = d.properties.name
                let color = vis.topBooksByState[state] != undefined ? 'rgb(76, 187, 23)' : 'rgb(168, 11, 0)'
                d3.select(this).style("fill", color)
            });
            
        }
        else if(vis.gameStatus === "revealing answers")
        {   
            let numberCorrect = 0;
            let numberWrong = 0;
            d3.selectAll(".state-guessing").each(function(d)
            {
                if (d3.select(this).style("fill") === "rgb(76, 187, 23)") {
                    numberCorrect++;
                    console.log("correct");
                }
                else if (d3.select(this).style("fill") === "rgb(168, 11, 0)") {
                    numberWrong++;
                }
                
                let state = d.properties.name
                let color = vis.topBooksByState[state] != undefined ? 'rgb(76, 187, 23)' : 'rgb(168, 11, 0)'
                d3.select(this).style("fill", color)
            });
            d3.select('#correct-map-guesses').html(`<strong>Correct guesses:</strong> ${numberCorrect}`)
            d3.select('#incorrect-map-guesses').html(`<strong>Incorrect guesses:</strong> ${numberWrong}`)
            console.log(`you correctly selected ${numberCorrect} and incorrectly selected ${numberWrong}`)
        }
        else
        {
            vis.svgLegend.style("opacity", 1);
            d3.selectAll(".state-guessing").each(function(d)
            { // d represents vis.world data bound to each element
                try
                {
                    let state = d.properties.name
                    // console.log("tally", vis.topBooksByState[d.properties.name] ? vis.tallyStatusByState[d.properties.name] : 0)
                    let tally =  vis.tallyStatusByState[state]  ? vis.tallyStatusByState[state] : 0
                    let color = vis.colors(tally);

                    d3.select(this)
                        .style("fill", color)
                        .text(tally === 0 ? "" : tally)

                }
                catch
                {
                    //console.log("region/state not in data: ", d.properties.name)
                }
            });
        }







    }

}