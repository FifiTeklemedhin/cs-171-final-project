class DataTable {

    // constructor method to initialize DataTable object
    constructor(parentElement, mergedData) {
        this.parentElement = parentElement;
        this.mergedData = mergedData;
        this.displayData = [];

        // initialize table
        this.initTable();
    }

    initTable() {
        let tableObject = this;
        tableObject.table = d3.select(`#${tableObject.parentElement}`)
            .append("table")
            .attr("class", "table table-hover");

        // append table head
        tableObject.thead = tableObject.table.append("thead");
        tableObject.thead.html(
            `<tr>
                <th scope="col">Title</th>
                <th scope="col">Authors</th>
                <th scope="col">Average Rating</th>
                <th scope="col">Ratings Count</th>
                <th scope="col">Publication Date</th>
                <th scope="col">Times Banned</th> <!-- New column for times banned -->
            </tr>`
        );

        // append table body
        tableObject.tbody = tableObject.table.append("tbody");

        // wrangle data
        tableObject.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Step 1: Initialize the filtered data array based on the selected time range
        let filteredData = [];

        // Check if a time range is selected (non-empty selectedTimeRange)
        if (selectedTimeRange.length !== 0) {
            // Filter the mergedData based on publication date within the selected time range
            filteredData = vis.mergedData.filter(row => {
                let publicationYear = new Date(row.publication_date).getFullYear(); // Extract year from publication date
                return publicationYear >= selectedTimeRange[0].getFullYear() && publicationYear <= selectedTimeRange[1].getFullYear();
            });
        } else {
            // If no time range is selected, use the full data
            filteredData = vis.mergedData;
        }

        // Step 2: Count frequency of each book based on the title in the filtered data
        let bookFrequency = d3.rollup(filteredData, v => v.length, d => d.Title);

        // Step 3: Sort the books by frequency and get the top 50 most banned books
        let topBannedBooks = Array.from(bookFrequency.entries())
            .sort((a, b) => b[1] - a[1])  // sort by frequency, descending
            .slice(0, 50);  // get top 50

        // Step 4: Map the top 50 books to get their details
        vis.displayData = topBannedBooks.map(([title, count]) => {
            // Get the first instance of the book details (since they have the same title)
            let bookDetails = filteredData.find(book => book.Title === title);

            return {
                title: bookDetails.Title,
                authors: bookDetails.authors || "Unknown", // Handle missing authors
                average_rating: bookDetails.average_rating || "N/A",
                ratings_count: bookDetails.ratings_count || "N/A",
                publication_date: bookDetails.publication_date || "N/A",
                banned_count: count // Add the times banned (frequency) as a new field
            };
        });

        // Step 5: Update the table with the filtered top banned books
        vis.updateTable();
    }


    updateTable() {
        let tableObject = this;

        // reset tbody
        tableObject.tbody.html('');

        // loop over all top 10 books
        tableObject.displayData.forEach(book => {
            let row = tableObject.tbody.append("tr");
            row.html(
                `<td>${book.title}</td>
                <td>${book.authors}</td>
                <td>${book.average_rating}</td>
                <td>${book.ratings_count}</td>
                <td>${book.publication_date}</td>
                <td>${book.banned_count}</td>` // Display the times banned count
            );
        });
    }
}
