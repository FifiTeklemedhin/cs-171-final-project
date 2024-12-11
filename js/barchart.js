class BarVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis = this; 

        // Step 3: Create the bar chart
        vis.margin = { top: 20, right: 30, bottom: 70, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this; 

        // Step 1: Extract and process the "Reason" column
        let reasons = vis.data.map(d => d.Reason).join(" "); // Combine all reasons into one string
        let stopwords = new Set(["and", "the", "for", "was", "to", "it", "with", "of", "a", "in", "on", "that", "is", "be", "as", "because", "challenged", "banned", "considered"]); // Add more as needed

        // Clean and split the words
        let words = reasons
            .toLowerCase() // Convert to lowercase
            .replace(/[.,!?;:()"]/g, "") // Remove punctuation
            .split(/\s+/) // Split by whitespace
            .filter(word => word && !stopwords.has(word)); // Remove stopwords and empty strings

        words.forEach((word, i) => {
                if (word === "sexually" && words[i + 1] === "explicit") {

                    words[i] = "sexually explicit"
                    words.splice(i + 1, 1);
                }
                else if (word === "lgbtqia+" && words[i + 1] === "content") {
   
                    words[i] = "lgbtqia+ content"
                    words.splice(i + 1, 1);
                }
                else if (word === "age" && words[i + 1] === "group") {
   
                    words[i] = "age group"
                    words.splice(i + 1, 1);
                }
            })

        // Count word occurrences
        let wordCounts = {};
            words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        // Step 2: Get the top 10 most common words
        let topWords = Object.entries(wordCounts) // Convert to array of [word, count]
            .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
            .slice(0, 10); // Get the top 10 words

        // Prepare data for D3
        vis.chartData = topWords.map(([word, count]) => ({ word, count }));

        vis.drawVis();
    }

    drawVis() {
        let vis = this;

        // Scales
        const x = d3.scaleBand()
        .domain(vis.chartData.map(d => d.word))
        .range([0, vis.width])
        .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(vis.chartData, d => d.count)])
            .nice()
            .range([vis.height, 0]);

        // Axes
        vis.svg.append("g")
            .attr("transform", `translate(0,${vis.height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        vis.svg.append("g")
            .call(d3.axisLeft(y));

        // Bars
        vis.svg.selectAll(".bar")
            .data(vis.chartData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.word))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => vis.height - y(d.count))
            .attr("fill", "steelblue");

        // Add labels
        vis.svg.selectAll(".label")
            .data(vis.chartData)
            .enter()
            .append("text")
            .attr("x", d => x(d.word) + x.bandwidth() / 2)
            .attr("y", d => y(d.count) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.count);

    }
}
