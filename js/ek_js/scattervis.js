class scatterChart {
    
	constructor(parentElement, bannedData, popularData) {
		this.parentElement = parentElement;
		this.bannedData = bannedData;
		this.popularData = popularData;

        this.initVis()
	}

    initVis() {
		let vis = this; 



		vis.parentWidth = document.getElementById(vis.parentElement).getBoundingClientRect().width;
		vis.parentHeight = document.getElementById(vis.parentElement).getBoundingClientRect().height;
		
        vis.margin = {top: 10, right: vis.parentWidth * 0.18, bottom: 50, left: vis.parentWidth * 0.1};

		vis.width = vis.parentWidth - vis.margin.left - vis.margin.right;
		vis.height = vis.parentHeight - vis.margin.top - vis.margin.bottom;

		// Crucial unit of measurement
		vis.circleRadius = 0.006 * vis.width;

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// Scales
		vis.xScale = d3.scaleLog()
			.range([0, vis.width]);
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

		//Timelines scale
		vis.xTimeScale = d3.scaleLinear()
			.range([0, vis.width]);

		// Bans scale
		vis.xBanScale = d3.scaleLinear()
			.range([0, vis.width]);

		// Generate axes 
        vis.yAxisG = vis.svg.append("g")
            .attr("class", "axis-scatter y-axis-scatter");            
        vis.xAxisG = vis.svg.append("g")
            .attr("class", "axis-scatter x-axis-scatter")
            .attr("transform", `translate(0, ${vis.height})`);

		// Legend
		vis.legend = vis.svg.append("g")
			.attr("class", "scatter-legend")
			.attr("transform", `translate(${vis.width + vis.margin.right / 3.5}, 0)`)
			.attr("opacity", 1)
		
		vis.legend
			.append("circle")
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("r", vis.circleRadius)
			.attr("fill", "#0B9895")
		vis.legend
			.append("circle")
			.attr("cx", 0)
			.attr("cy", vis.circleRadius * 10)
			.attr("r", vis.circleRadius)
			.attr("fill", "lightgrey")
		vis.legend
			.append("text")
			.text("banned book")
			.attr("x", vis.circleRadius * 2)
			.attr("y", vis.circleRadius * 1)
			.attr("font-size", vis.circleRadius * 4)
		vis.legend
			.append("text")
			.text("popular book")	
			.attr("x", vis.circleRadius * 2)
			.attr("y", vis.circleRadius * 11)
			.attr("font-size", vis.circleRadius * 4)

		//vis.infoBoxHtml = vis.svg.append("g")
		//	.attr("transform", "translate(" + (vis.width / 14 + vis.circleRadius * 2) + "," + (vis.height / 14 + vis.circleRadius * 2) + ")");
          
        this.wrangleData();
    }


	wrangleData() {
		let vis = this;

		vis.displayData = [];
		vis.popularBooks = [];



		vis.bannedData.forEach(book => {
            book.selected = false;
            vis.displayData.push(book);
        });

		console.log(vis.displayData)


		// For timelines things
		//console.log(d3.group(vis.bannedData, d => d.publication_year).get(vis.bannedData[100].publication_year))
		//console.log(d3.group(vis.bannedData, d => d.publication_year).get(vis.bannedData[100].publication_year).indexOf(vis.bannedData[100]))

		// Highest rated
		vis.popularData.filter((book) => book.ratings_count > 1000).sort((a, b) => b.average_rating - a.average_rating).slice(0, 100).forEach(book => {
			book.selected = false;
			vis.popularBooks.push(book);
		});
		// Most rated
		vis.popularData.sort((a, b) => b.ratings_count - a.ratings_count).slice(0, 103).forEach(book => {
			book.selected = false;
			vis.popularBooks.push(book);
		});

		// Get rid of overlap between highest rate and most rated
		let noDuplicateBooks = new Set(vis.popularBooks);
		vis.popularBooks = [...noDuplicateBooks];

		// Timeline scale
		vis.xTimeScale.domain([1965, d3.max(vis.displayData, (d) => d.publication_year)])
		// Ban scale
		vis.xBanScale.domain([d3.min(vis.displayData, (d) => d.bans) - 1, d3.max(vis.displayData, (d) => d.bans)])
		
		// Update other scales
        vis.yScale.domain([2.7, 5]);
        vis.xScale.domain([d3.min(vis.displayData, (d) => d.ratings_count) - (d3.min(vis.displayData, (d) => d.ratings_count) / 2), d3.max(vis.popularBooks, (d) => d.ratings_count)]);

		
		
		/*
		vis.selectedButton = [...document.querySelectorAll('.scatter-buttons:checked')].map((d) => d.value)[0];
		if (vis.selectedButton === "scatter-ratings") {
			vis.updateVis();
		}
		else if (vis.selectedButton === "scatter-year") {
			vis.timelineView();
		}
		*/



		vis.restoreElems();
		
	}

	restoreElems() {
		let vis = this;

		// Make legend visible
		vis.legend
			.style("opacity", 1)

		// Tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr("class", "tooltip")
			.attr("id", "scatter-tooltip")

		// Axis labels
		vis.xLabel = vis.svg.append("text")
			.attr("transform", `translate(${vis.width / 2}, ${vis.height + vis.circleRadius * 11})`)
			.attr("text-anchor", "middle")
			.attr("font-size", vis.circleRadius * 4)

		vis.yLabel = vis.svg.append("text")
			.attr("text-anchor", "middle")
			.attr("x", -vis.circleRadius * 13)
			.attr("y", vis.height / 2)
			.attr("transform", `rotate(-90, ${-vis.circleRadius * 13}, ${vis.height / 2})`)
			.attr("font-size", vis.circleRadius * 4)
			.text("Rating (out of 5)")

		d3.selectAll(".scatter-buttons")
			.on("click", function(){
				vis.selectedButton = [...document.querySelectorAll('.scatter-buttons:checked')].map((d) => d.value)[0];
	
				if (vis.selectedButton === "scatter-year") {
					vis.timelineView();
				}
				else if (vis.selectedButton === "scatter-ratings") {
					
					vis.ratingsView();
				}
				else if (vis.selectedButton === "scatter-banned") {
					
					vis.bansView();
				}
				
			});

		/////// Make circles ///////
		vis.selectedButton = [...document.querySelectorAll('.scatter-buttons:checked')].map((d) => d.value)[0];

		vis.popularCircles = vis.svg.selectAll("circle.popular")
			.data(vis.popularBooks, (d) => d.bookID);

		// Grey background circles <- just 0 opacity during timeline sort, never move
		vis.popularCircles.enter()
			.append("circle")
			.style("opacity", 1)
			.merge(vis.popularCircles)
			.attr("cx", (d) => vis.xScale(d.ratings_count))
			.attr("cy", (d) => vis.yScale(d.average_rating))
			.attr("r", vis.circleRadius)
			.attr("fill", "lightgrey")
			.attr("class", "popular")
			.transition()
			.duration(400)
			.style("opacity", 1);

		vis.bannedCircles = vis.svg.selectAll("circle.banned")
			.data(vis.displayData, (d) => d.book_id);

		vis.bannedCircles.enter()
			.append("circle")
			.attr("cx", (d) => {
				if (vis.selectedButton === "scatter-ratings") {
					return vis.xScale(d.ratings_count);
				}
				else if (vis.selectedButton === "scatter-year") {
					return vis.xTimeScale(d.publication_year);
				}
				else if (vis.selectedButton === "scatter-banned") {
					return vis.xBanScale(d.bans);
				}
				
			})
			.attr("cy", (d) => {
				if (vis.selectedButton === "scatter-ratings") {
					return vis.yScale(d.average_rating);
				}
				else if(vis.selectedButton === "scatter-year") {
					let yearIndex =  d3.group(vis.bannedData, row => row.publication_year).get(d.publication_year).indexOf(d);
					return vis.height - (yearIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
				}
				else if (vis.selectedButton === "scatter-banned") {
					let bansIndex =  d3.group(vis.bannedData, row => row.bans).get(d.bans).indexOf(d);
					return vis.height - (bansIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
				}
			})
			.attr("r", vis.circleRadius)
			.attr("fill", "#0B9895")
			.style("opacity", 1)
			.attr("class", "banned")
			// merge with returning circle that was red x button
			.merge(vis.bannedCircles)
			.attr("r", vis.circleRadius)
			.attr("fill", "#0B9895")
			.style("opacity", 1)
			.attr("class", "banned")
			.attr('stroke-width', '0px')
			// Tooltip listeners
			.on('mouseover', function(event, d){
				d3.select(this)
					.attr('stroke-width', '2px')
					.attr('stroke', 'black')
					.attr('fill', 'rgb(0,255,0)')

				vis.tooltip
					.style("opacity", 1)
					.html(`
						<div style="border: thin solid grey; border-radius: 5px; background: white; padding: 20px; text-align: center;">
							<h3 style="padding: 1vh;">${d.title}</h3>
							<img src=${d.image_url} alt="Cover of ${d.title}" height="150">
							<p style="padding: 1vh;"><i>click for more info</i></p>             
						</div>`); 

				let tooltipHeight = document.getElementById("scatter-tooltip").getBoundingClientRect().height;
				let parentSize = document.getElementById(vis.parentElement).getBoundingClientRect();

				vis.tooltip
					.style("left", () => {
						return event.pageX + 20 + "px";
					})
					.style("top", () => {
						return event.pageY + tooltipHeight > parentSize.y + parentSize.height ?  event.pageY - tooltipHeight + "px" : event.pageY + "px";
					})
				//console.log("bounded", document.getElementById("tooltip").getBoundingClientRect())
			})
			.on('mouseout', function(event, d){
				d3.select(this)
					.attr('stroke-width', '0px')
					.attr("fill", "#0B9895")

				vis.tooltip
					.style("opacity", 0)
					.style("left", 0)
					.style("top", 0)
					.html(``);
			})
			.on('click', function(event, d){
				d.selected = true;

				vis.tooltip
					.remove();

				d3.select(this)
					.attr("class", "selected");

				// Take away his clicking power
				d3.select(this).on('click',null);
				d3.select(this).on('mouseover',null);
				d3.select(this).on('mouseout',null);

				d3.selectAll("circle.banned")
					.transition()
					.duration(300)
					.style("opacity", 0)
					.remove();
				d3.selectAll("circle.popular")
					.transition()
					.duration(300)
					.style("opacity", 0);
				d3.select(".axis-scatter")
					.transition()
					.duration(300)
					.style("opacity", 0)
					//.remove()
				d3.select(".x-axis-scatter")
					.transition()
					.duration(300)
					.style("opacity", 0)
					//.remove()
				vis.legend
					.transition()
					.duration(300)
					.style("opacity", 0)

				vis.xLabel
					.remove()
				vis.yLabel
					.remove()

				// Move him to upper left
				d3.select(this)
					.transition()
					.duration(600)
					.on("end", function(d){
						vis.focusVis(d, this)
					})
					.attr("cx", vis.width / 16)
					.attr("cy", vis.height / 16);
			})
		

		if (vis.selectedButton === "scatter-year") {
			vis.timelineView();
		}
		else if (vis.selectedButton === "scatter-ratings") {
			vis.ratingsView();
		}
		else if (vis.selectedButton === "scatter-banned") {
			vis.bansView();
		}

		
	}

	
	ratingsView() {
		let vis = this;

		d3.select("#scatterTitle")
			.html(`<span class="brown-highlight">Are the most frequently banned books popular or well-rated?</span>`);


		// Axes
        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale);
        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale);
		vis.xAxisG
			.style("opacity", 1)
            .call(vis.xAxis);
        vis.yAxisG
			.call(vis.yAxis)
			.transition()
			.duration(400)
			.style("opacity", 1);

		vis.xLabel
			.text("# of Ratings")
		vis.yLabel
			.attr("opacity", 1)

		// Show the grey circles
		vis.svg.selectAll("circle.popular")
			.transition()
			.duration(400)
			.style("opacity", 1);

		vis.svg.selectAll("circle.banned")
			.transition()
			.duration(400)
			.attr("cx", (d) => vis.xScale(d.ratings_count))
			.attr("cy", (d) => vis.yScale(d.average_rating))
		
	}

	timelineView(){
		let vis = this;

		d3.select("#scatterTitle")
			.html(`<span class="brown-highlight">When were the most frequently banned books of 2023-24 published?</span>`)

		vis.yAxisG
			.transition()
			.duration(300)
			.style("opacity", 0);

		vis.xAxis
			.scale(vis.xTimeScale)
			.tickFormat(d3.format("d"));

		d3.select(".x-axis-scatter")
			.transition(300)
			.style("opacity", 1)
			.call(vis.xAxis);
		
		vis.xLabel
			.text("Year")
		vis.yLabel
			.transition()
			.duration(300)
			.attr("opacity", 0)

		d3.selectAll("circle.popular")
			.transition()
			.duration(300)
			.style("opacity", 0);

		d3.selectAll("circle.banned")
			.transition()
			.duration(600)
			.attr("cx", (d) => {
				return vis.xTimeScale(d.publication_year);
			})
			.attr("cy", (d) => {
				//console.log(d3.group(vis.bannedData, row => row.publication_year))
				let yearIndex =  d3.group(vis.bannedData, row => row.publication_year).get(d.publication_year).indexOf(d);
				return vis.height - (yearIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
			})
	}

	bansView(){
		let vis = this;

		d3.select("#scatterTitle")
			.html(`<span class="brown-highlight">How many school districts banned each book?</span>`)

		vis.yAxisG
			.transition()
			.duration(300)
			.style("opacity", 0);

		vis.xAxis
			.scale(vis.xBanScale);

		d3.select(".x-axis-scatter")
			.transition()
			.style("opacity", 1)
			.call(vis.xAxis);

		vis.xLabel
			.text("# of Banning Districts")
		vis.yLabel
			.transition()
			.duration(300)
			.attr("opacity", 0)

		d3.selectAll("circle.popular")
			.transition()
			.duration(300)
			.style("opacity", 0);

		d3.selectAll("circle.banned")
			.transition()
			.duration(600)
			.attr("cx", (d) => {
				return vis.xBanScale(d.bans);
			})
			.attr("cy", (d) => {
				//console.log(d3.group(vis.bannedData, row => row.publication_year))
				let bansIndex =  d3.group(vis.bannedData, row => row.bans).get(d.bans).indexOf(d);
				return vis.height - (bansIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
			})
	}

	focusVis(book, circle){
		let vis = this;



		vis.infoBoxHtml = d3.select("#scatter-section").append("div")
			.style("opacity", 0)
			.style("left", 0)
			.style("top", 0)
			.html(``);
		


		vis.infoBox = vis.svg.append("g")
			.attr("transform", "translate(" + (vis.width / 14 + vis.circleRadius * 2) + "," + (vis.height / 14 + vis.circleRadius * 2) + ")");
		
		vis.infoBox
			.append("rect")
			.attr("id", "infoRect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", vis.width)
			.attr("height", vis.height * 0.7)
			.attr("stroke", "black")
			.attr("fill", "rgba(0, 0, 0, 0)")

		let svgCoords = vis.infoBox.node().getBoundingClientRect();


		let imageHeight = vis.height * 0.4;
	
		vis.infoBoxHtml
			.attr("class", "infoBoxHtml container-fluid")
			.attr("id", "infoBoxHtml")
			.style("opacity", 1)
			.style("position", "absolute")
			.style("left", svgCoords.x + "px")
			.style("top", svgCoords.y + "px")
			.style("width", svgCoords.width + "px")
			.style("height", svgCoords.height + "px")
			.html(`

				<div class="row justify-content-center">
					<div class="col-8 text-center" style="padding-top: 1.5vh;">
						<h6>
						<a href="${book.url}">${book.title}</a>
						</h6>
					</div>
				</div>
				<div class="row justify-content-center">
					<div class="col-4 text-center">
						
					</div>
					<div class="col-8">
						<p>
							Average Goodreads rating: ${book.average_rating}
						</p>
						<p>
							Total number of ratings: ${book.ratings_count}
						</p>
						<p>
							Publication year: ${book.publication_year}
						</p>
						<p>
							Page count: ${book.num_pages}
						</p>
						<p>
							Bans: ${book.bans}
						</p>
					</div>
				</div>
			
			`)

		
		// <img height="${imageHeight}" src="${book.image_url}"/>
		let coverImage = vis.infoBox
			.append("image")
			.attr("xlink:href", book.image_url)
			.attr("id", "coverImage")
			.attr('height', imageHeight)
			.attr("x", vis.circleRadius * 3)
			.attr("y", vis.height * 0.7 / 2 - imageHeight / 2)

		// Title
		/*
		vis.infoBox
			.append("text")
			.attr("x", vis.width - vis.margin.right - vis.circleRadius * 3)
			.attr("y", vis.circleRadius * 5)
			.attr("text-anchor", "end")
			.text(`${book.title}`);
		*/
		
		let coverImg = coverImage.node().getBBox();
		//let image_x = parseInt(d3.select("#coverImage").attr("y"));

		// Ratings

		vis.infoBox
			.append("text")
			.attr("x", coverImg.x + coverImg.width + vis.circleRadius * 3)
			.attr("y", coverImg.y)
			//.attr("text-anchor", "end")
			.text(``)
		
		d3.selectAll(".scatter-buttons")
			.on('click', function() {
				vis.removeFocusBox()
			});

		d3.select("circle.selected")
			.attr("fill", "red")
			.attr("r", vis.circleRadius * 3)
			.on('click', function(event, d) {
				
				vis.infoBox
					.remove();

				vis.infoBoxHtml
					.remove();

				d3.select("circle.selected")
					.attr("r", vis.circleRadius);

				/*additionalInfo
					.remove();
				*/

				d3.select("circle.selected")
					.attr("class", "banned")
					.transition()
					.duration(700)
					.attr("cx", (d) => {
						if (vis.selectedButton === "scatter-ratings") {
							
							return vis.xScale(d.ratings_count);
						}
						else if (vis.selectedButton === "scatter-year") {
							return vis.xTimeScale(d.publication_year);
						}
						else if (vis.selectedButton === "scatter-banned") {
							return vis.xBanScale(d.bans);
						}
						
					})
					.attr("cy", (d) => {
						if (vis.selectedButton === "scatter-ratings") {
							
							return vis.yScale(d.average_rating);
						}
						else if(vis.selectedButton === "scatter-year") {
							let yearIndex =  d3.group(vis.bannedData, row => row.publication_year).get(d.publication_year).indexOf(d);
							return vis.height - (yearIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
						}
						else if (vis.selectedButton === "scatter-banned") {
							let bansIndex =  d3.group(vis.bannedData, row => row.bans).get(d.bans).indexOf(d);
							return vis.height - (bansIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
						}
					})
					.on("end", function(){
						vis.restoreElems();
					})		
			})
			
	}


	removeFocusBox() {
		let vis = this;
		
		vis.infoBox
			.remove();

		vis.infoBoxHtml
			.remove();

		vis.infoBoxHtml
			.style("opacity", 0)
			.style("left", 0)
			.style("top", 0)
			.html(``);

	

		vis.selectedButton = [...document.querySelectorAll('.scatter-buttons:checked')].map((d) => d.value)[0];

		

		d3.select("circle.selected")
			.attr("r", vis.circleRadius);

		d3.select("circle.selected")
			.attr("class", "banned")
			.transition()
			.duration(700)
			.attr("cx", (d) => {
				if (vis.selectedButton === "scatter-ratings") {
				
					return vis.xScale(d.ratings_count);
				}
				else if (vis.selectedButton === "scatter-year") {
					return vis.xTimeScale(d.publication_year);
				}
				else if (vis.selectedButton === "scatter-banned") {
					return vis.xBanScale(d.bans);
				}
				
			})
			.attr("cy", (d) => {
				if (vis.selectedButton === "scatter-ratings") {
				
					return vis.yScale(d.average_rating);
				}
				else if(vis.selectedButton === "scatter-year") {
					let yearIndex =  d3.group(vis.bannedData, row => row.publication_year).get(d.publication_year).indexOf(d);
					return vis.height - (yearIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
				}
				else if (vis.selectedButton === "scatter-banned") {
					let bansIndex =  d3.group(vis.bannedData, row => row.bans).get(d.bans).indexOf(d);
					return vis.height - (bansIndex * vis.circleRadius * 2.3) - vis.circleRadius * 1.5;
				}
			})
			.on("end", function(){
				vis.restoreElems();
			})	

	}
	
}

