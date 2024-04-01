/************************************ 
*   query functionality 
*/
async function getQuotes(query) {
    // fill out the URL
    let url = baseURL;  
    if (query === "") {
        url += "random";
    }
    else {
        url += `search?query=${query}`;
    }

    // make request
    let result = null;
    let contents = null;
    try {
        result = await fetch(url);
        contents = await result.json();
    } catch(error) {
        displayMessage(`A network or other error occurred\n(returned code ${result.status})`, "error");
        return;
    }

    if (initialState) {
        // random quote on app opening
        addQuotation(contents._id, contents.content, contents.author)
    }
    else {
        // processing quotes from query
        const quotations = document.getElementById("quotations");
        quotations.innerHTML = "";

        // filter out pinned duplicates
        contents.results = contents.results.filter(isNotDuplicate);

        if (searchLevel < 4) {
            // filter results for exact or partial matches
            contents.results = contents.results.filter((quote) => filterNames(quote, query, searchLevel));
        }

        // Add quotations to page
        contents.results.forEach((item) => {
            addQuotation(item._id, item.content, item.author)
        });
        displayMessage(`${contents.results.length} new quotations found for author "${query}"`, "message");
    }
}

function isNotDuplicate(quote) {
    // check for duplicate in pinned by id
    const pinned = document.getElementById("pinned-quotations");
    const quotes = pinned.querySelectorAll("blockquote");
    for (let i = 0; i < quotes.length; i++) {
        if (quotes[i].id === quote._id) {
            return false;
        }
    }
    return true;
}

function filterNames(quote, query, level) {
    const nameParts = quote.author.toLowerCase().split(" ");
    const queryParts = query.toLowerCase().split(" ");

    if (level === 1) {
        // Exact match
        if (quote.author.toLowerCase() === query.toLowerCase()) {
            return true;
        }
    }
    else if (level === 2) {
        // Match last name
        const lastName = nameParts.slice(-1);
        const lastQueryName = queryParts.slice(-1);
        if (lastName[0] === lastQueryName[0]) {
            return true;
        }
    }
    else if (level === 3) {
        // Match any name
        const namePartsSet = new Set(nameParts);
        const queryPartsSet = new Set(queryParts);
        if (namePartsSet.intersection(queryPartsSet).size > 0) {
            return true;
        }
    }

    // No cigar
    return false;
}

function addQuotation(id, quote, citation) {
    // Create blockquote element
    const blockquote = document.createElement("blockquote");                
    blockquote.classList.add("quotation");
    blockquote.id = id;
    blockquote.tabIndex = "0";

    // add icons to the quote
    const icons = document.createElement("div");
    icons.classList.add("icons");
    let html = `<span class="material-icons-outlined pin" aria-label="pin" 
    tabindex="0" role="button">push_pin</span>
    <span class="material-icons-outlined copy" aria-label="copy" 
    tabindex="0" role="button">content_copy</span>`
    
    // include share icon only if navigator.share is available
    if (navigator.canShare) {
        html += `<span class="material-icons-outlined share" aria-label="share" tabindex="0" 
    role="button">share</span>`
    }
    icons.innerHTML = html;
    blockquote.appendChild(icons);

    // Add body of the quote
    const text = document.createElement("p");
    text.innerText = quote;
    blockquote.appendChild(text);

    // Add citation
    const cite = document.createElement("footer");
    if (citation.length === 0) {
        citation = "Anonymous";
    }
    cite.innerText = `\u2014 ${citation}`;
    blockquote.appendChild(cite);

    // Add event listeners to the new blockquote
    blockquote.addEventListener("click", (e) => handleQuoteClick(e));

    blockquote.addEventListener("keypress", (e) => {
        if (e.code === "Enter") {
            handleQuoteClick(e);
        }
    });

    // For screen readers
    blockquote.addEventListener("focus", (e) => {
        readQuote(e.currentTarget);
    });

    // Append to unpinned quotes
    const quotations = document.getElementById("quotations");
    quotations.appendChild(blockquote);
}

function handleQuoteClick(e) {
    // if icon specifically clicked, handle that request
    if (e.target.classList.contains("copy")) {
        copyQuote(e.currentTarget);
    }
    else if (e.target.classList.contains("share")) {
        shareQuote(e.currentTarget);
    }
    // otherwise pin/unpin quote
    else {
        pinUnpinQuotation(e.currentTarget);
    }
}

/************************************ 
*   pin/unpin functionality 
*/
function pinUnpinQuotation(quote) {
    const quotations = document.getElementById("quotations");
    const pinned = document.getElementById("pinned-quotations");
    if (quotations.contains(quote)) {
        // Remove quote from unpinned
        quotations.removeChild(quote);

        // Append to pinned
        pinned.appendChild(quote);
        quote.dataset.pinned = "true";
        displayMessage("Pinned", "");
    }
    else {
        // Remove from pinned
        pinned.removeChild(quote);

        // insert at top of unpinned
        if (quotations.firstChild) {
            quotations.insertBefore(quote, quotations.firstChild);
        }
        else {
            quotations.appendChild(quote);
        }
        quote.dataset.pinned = "false";
        displayMessage("Unpinned", "");
    }
    searchText.focus();
}

/************************************ 
*   functionality to read quote aloud
*/
function readQuote(quote) {
    const pinnedQuotes = document.getElementById("pinned-quotations");
    const quotation = quote.querySelector("p").innerText;
    const citation = quote.querySelector("footer").innerText.replace("\u2014", "").trim();
    message = `${quotation}. ${citation}`;
    if (pinnedQuotes.contains(quote)) {
        message += ". Pinned";
    }
    displayMessage(message, "");
}

/************************************ 
*   functionality to handle icons in quotation blocks 
*/
async function copyQuote(quote) {
    const text = quote.querySelector("p").innerText;
    const cite = quote.querySelector("footer").innerText;
    const quotation =  `${text}\n\n${cite}`
    
    if (navigator.clipboard) {
        // clipboard API is available
        try {
            await navigator.clipboard.writeText(quotation);
        } catch(error) {
            displayMessage(`An error occured copying ${error}`, "error");
            return;
        }
    }
    else {
        // if clipboard API is not available
        try {
            const textArea = document.createElement("textarea");
            textArea.textContent = quotation;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        } catch(error) {
            displayMessage(`An error occured copying ${error}`, "error");
            return;
        }
    }
    displayMessage("Copied quotation to clipboard", "message");
}

async function shareQuote(quote) {
    // If web share API is available, do sharing
    const text = quote.querySelector("p").innerText;
    const cite = quote.querySelector("footer").innerText;
    const quotation = `${text}\n\n${cite}`;
    const title = `Quotation from ${cite.replace("\u2014", "")}`;
    try {
        await navigator.share(
            {   
                title: title,
                text: quotation
            }
        );
    } catch(error) {
        displayMessage(`An error occured sharing ${error}`, "error");
    }
}

/************************************ 
*   functionality to display and/or announce messages
*/
function displayMessage(message, show) {
    const errorBox = document.getElementById("message");
    errorBox.innerText = message;
    // if show == "" message only announced by screen reader
    if (show === "message") {
        // informational message to display
        const span = document.createElement("span");
        span.classList.add("material-icons-outlined");
        span.innerText = "info ";
        errorBox.insertBefore(span, errorBox.firstChild);
        errorBox.style.setProperty("top", "200px");
    }
    else if (show === "error") {
        // error to display
        const span = document.createElement("span");
        span.classList.add("material-icons-outlined");
        span.innerText = "error_outline ";
        errorBox.insertBefore(span, errorBox.firstChild);
        errorBox.dataset.error = "true";
        errorBox.style.setProperty("top", "200px");
    }
    
    setTimeout(() => {
        errorBox.style.setProperty("top", "-1000px");
        errorBox.innerHTML = "";
        errorBox.dataset.error = "false";
    }, 3000);
}

/************************************ 
*   setup search bar and application 
*/
const baseURL = "https://usu-quotes-mimic.vercel.app/api/";
const searchText = document.getElementById("search-text");
let initialState = true;

searchText.addEventListener("keydown", (e) => {
    // deprecated method as it handles "Go" key on my phone properly?
    if (e.keyCode === 13) {
        if (e.target.value === "") {
            displayMessage("Specify author name to search", "error");
            return;
        }

        if (initialState) {
            // first query
            const container = document.getElementById("container");
            const header = document.getElementById("header");

            // relocates search bar to fixed header
            const searchBar = document.getElementById("search-bar");
            container.removeChild(searchBar);
            header.appendChild(searchBar);

            // realigns main page content
            container.style.setProperty("justify-content", "flex-start");
            container.style.setProperty("margin-top", "78px");
            initialState = false;
        }

        // service query
        getQuotes(e.target.value);
        e.target.focus();
    }
});

// search bar icons (filter and clear search text)
const searchSettings = document.getElementById("search-settings");
const searchCancel = document.getElementById("search-cancel");

searchSettings.addEventListener("click", () => {
    toggleSettingsDialog();
});

searchSettings.addEventListener("keypress", (e) => {
    if (e.code === "Enter") {
        toggleSettingsDialog();
    }
});

searchCancel.addEventListener("click", () => {
    searchText.value = "";
    searchText.focus();
});

searchCancel.addEventListener("keypress", (e) => {
    if (e.code === "Enter") {
        searchText.value = "";
        searchText.focus();
    }
});

// on loading page
addEventListener("load", () => {
    getQuotes("");
    searchText.focus();
});

/************************************ 
*   search settings dialog functionality 
*/
let settingsDisplayed = false;
let searchLevel = 1;

function toggleSettingsDialog() {
    // display dialog
    settingsDisplayed = !settingsDisplayed;
    const settings = document.getElementById("settings");
    settings.dataset.open = `${settingsDisplayed}`;

    if (settingsDisplayed) {
        levelButton = document.getElementById(`level-${searchLevel}`);
        levelButton.focus();
    }
    else {
        searchText.focus();
    }

    // app mask to make dialog modal
    mask.dataset.open = `${settingsDisplayed}`;
}

const mask = document.getElementById("mask");
const okButton = document.getElementById("ok-button");
okButton.addEventListener("click", toggleSettingsDialog);

mask.addEventListener("click", toggleSettingsDialog);

const searchOptions = [...document.getElementsByClassName("search-level")];
searchOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
        searchLevel = Number(e.target.value);
        displayMessage("Selected", "");
    });
});
