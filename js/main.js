
let fullpageCounter = 0;
// Scrolling
new fullpage('#fullpage', {
    // Callback function
    afterLoad: function(origin, destination, direction){
        const headline = document.querySelectorAll('.headline-img');
        const storytitle = document.querySelector('#story-title');

        // on title page load
        if(destination.index == 0){
            headline.forEach((element) => element.classList.add('active'));
            storytitle.classList.add('active');
        }

        // Little circle graphic
        if (destination.index == 1 && fullpageCounter === 0) {
            circleComparison.drawCircles();
            fullpageCounter++;
        }

    },
	//options here
    sectionsColor: ['white', 'white', 'white', 'white', 'white', 
                    "white", "white", "white", 
                    "white", "white", "white", "white"],
	autoScrolling:true,
	scrollHorizontally: true,
    normalScrollElements: '#tableDiv',
    navigation: true
});

// Globals
let scatterVis;
let myDataTable,
    myBrushVis,
    myMapVis,
    myBarVisOne,
    myBoxPlot,
    guessingGame,
    pieInitiatingAction,
    pieBanStatus;

let selectedTimeRange = [];
let selectedState = '';

let promises = [
    // general data
    d3.csv("data/pen_2324.csv"),
    d3.json("data/goodreads_banned100.json"),
    d3.csv("data/kaggle_books.csv"),
    d3.csv("data/mergedBooks.csv"),

    // map-specific data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),

    // goodreads tag data
    d3.json("data/banned100_characteristics.json"),

    //bannedmerged for barchart & boxplot
    d3.csv("data/bannedMerged3.csv"),

    // PEN data for previous years
    d3.csv("data/PEN_2122.csv"),
    d3.csv("data/PEN_2223.csv")
];

Promise.all(promises)
    .then(function (data) {
        initPage(data);
    })
    .catch(function (err) {
        console.log(err)
    });

function initPage(data) {
    let pen_2324 = data[0];
    let goodreads100 = data[1];
    let kaggle = data[2];
    let mergedBooks = data[3];
    let geoStates = data[4];

    let book_characteristics = data[5];
    let banned_data = data[6];

    let pen_2122 = data[7];
    let pen_2223 = data[8];

    let Districts = [];
    pen_2324.forEach( function(book) {
        if (book.State === "Florida") {
            Districts.push(book["Ban Status"]);
        }
        
    })
    
    let uniqueDistricts = new Set(Districts)

    let reasonsArray = Array.from(uniqueDistricts, function(d){
        let element = {
            reason: d,
            count: Districts.filter(item => item === d).length
        }
        return element
    })
   
    // Convert type all together here
    kaggle.forEach((book) => {
        book.average_rating = +book.average_rating;
        book.ratings_count = +book.ratings_count;
    })
    goodreads100.forEach((book) => {
        book.average_rating = +book.average_rating;
        book.ratings_count = +book.ratings_count;
        book.publication_year = +book.publication_year;
    })

    

    // Top 100 most banned books from PEN 23-24
    let banned_counts = d3.rollup(pen_2324, (v) => v.length, (d) => d.Title);
    let banned_array = Array.from(banned_counts, ([key, value]) => ({key, value}));
    banned_array.sort((a, b) => b.value - a.value);
    let top100 = banned_array.slice(0, 100);



    let singleBan = banned_array.filter((d) => d.value === 1)


    goodreads100.forEach((book) => {
        top100.forEach((d => {
            if (d.key == book.title) {
                book.bans = d.value;
            }
        }))
    })

    // Create event handler (from week 9 lab)
    let eventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    }
    // Bind event handler
    // when 'stateClick' is triggered, specified function is called
    eventHandler.bind("stateClick", function(event){
        let stateName = event.detail;
   
        myMapBar.onStateClick(stateName);
    });

    // Interactive scatterplot
    scatterVis = new scatterChart("scatter-area", goodreads100, kaggle);

    // Brushable table
    myDataTable = new DataTable('tableDiv', data[3]);
    myBrushVis = new BrushVis('brushDiv', data[3]);
    // mapVis
    guessingGame = new mapGuess('guessingGame', geoStates, mergedBooks);
    myMapVis = new MapVis('mapDiv', geoStates, mergedBooks, eventHandler);
    myMapBar = new MapBar("map-bar", summarizePenData(pen_2122), summarizePenData(pen_2223), summarizePenData(pen_2324))

    // Bubbles sortable by tag
    tagBubbles = new tagVis("tagbubbles-area", book_characteristics);

    // Boxplot & barchart of reasons 
    let topReasons = [];
    myBarVisOne = new BarVis('barvis-area', banned_data);
    myBoxPlot = new BoxPlotVis('boxplot-area', banned_data, topReasons);

    // Intro circles
    circleComparison = new compareCircles("compareCircles", 275, pen_2122.length, pen_2223.length, pen_2324.length)

    // Pie charts for state focus
    pieInitiatingAction = new statePie("pie-chart-initiating-action", pen_2324, "Initiating Action");
    pieBanStatus = new statePie("pie-chart-ban-status", pen_2324, "Ban Status");

    // Basic grid of books for parts of a whole
    gridBooks = new bookGrid("books-grid", singleBan.length / banned_array.length);

}

//** Helper functions **//
// map category changes
function mapCategoryChange() {
    //myMapVis.selectedCategory =  document.getElementById('mapCategorySelector').value;
    myMapVis.wrangleData(); // maybe you need to change this slightly depending on the name of your MapVis instance
}

function tagChecked() {
    // from https://stackoverflow.com/a/61598154
    const selectedboxes = [...document.querySelectorAll('.tags:checked')].map((d) => d.value);
    const sizedByBans = document.querySelector('#tag-sizing:checked') !== null ? true : false;

    
    tagBubbles.boxCheck(selectedboxes, sizedByBans);
}

// Bans per state for '21-'22, '22-'23, and '23-'24
function summarizePenData(data) {
    let stateRoll = d3.group(data, (d) => d.State)
    stateRoll = Array.from(stateRoll, ([key, value]) => ({key, value}));
    let penArr = {};
    stateRoll.forEach((state) => {
        let element = {
            totalBans: state.value.length,
            uniqueBooksBanned: d3.group(state.value, (d) => d.Title).size
        }
        penArr[state.key] = element;
    })
    
    return penArr;
}

function playGuessingGame()
{
    guessingGame.gameStatus = "playing";
    guessingGame.updateVis();
}

function stopGuessingGame()
{
    guessingGame.gameStatus = "revealing answers";
    guessingGame.updateVis();
}

function stateFocus() {
    let selectedButton = [...document.querySelectorAll('.state-focus:checked')].map((d) => d.id)[0];
    let focusText = d3.select(".state-focus-text")
    if (selectedButton === "iowa-focus") {
        focusText
            .attr("id", "iowa-focus-text")
            .html(`
            <p>
                Iowa had over <span class="brown-highlight">600 times more bans</span> in 2023-24 than in the previous school year because of a <span class="brown-highlight">law passed in May 2023</span> regulating the contents of school libraries, <a href="https://www.legis.iowa.gov/legislation/BillBook?ga=90&ba=SF496">SF 496</a>. The law requires school libraries to contain “only age-appropriate materials” which excludes “any material with descriptions or visual depictions of a sex act.” Because of this law, all bans originate from the administration and the vast majority fully remove the book.
            </p>
            <p>
                The overwhelming number of books to screen, with no guidance from the state’s Department of Education on whether classroom libraries are covered by the law, caused <a href="https://www.nytimes.com/2023/09/01/opinion/book-ban-schools-iowa.html">one school administrator</a> to turn to ChatGPT, as well as conservative sites like Book Looks, for assistance in determining which books contain a sex act.
            </p>
            <p>
                Each school library had to make their own decisions in an attempt to comply with the law, leading to discrepancies between school districts. For example, while the author of the op-ed’s district did not remove “The Absolutely True Diary of a Part-Time Indian,” 44 other Iowa school districts chose to remove it.
            </p>
        `)
    }
    else {
        focusText
            .attr("id", "florida-focus-text")
            .html(`
            <p>
                Florida, leading the country in number of book bans, had approximately <span class="brown-highlight">three times as many bans</span> in 2023-24 as in the previous school year. In May 2023, <a hreg=“https://www.flsenate.gov/Session/Bill/2023/1069/“>HB 1069</a> was signed into law. The law expanded the ways books can be challenged, exposed classroom libraries to bans, and specified that a book “depict[ing] or describ[ing] sexual conduct” makes it challengeable.
            </p>
            <p>
                The law also requires that all books challenged for including “sexual conduct” be <span class="brown-highlight">removed from access within five days</span> until undergoing a review process, which is why the majority of bans in Florida are “banned pending investigation”.
            </p>
        `)
    }
    pieInitiatingAction.wrangleData();
    pieBanStatus.wrangleData();
}
