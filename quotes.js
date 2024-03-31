async function getQuotes(query) {
    let url = baseURL;
    
    if (query === "") {
        url += "random";
    }
    else {
        url += `search?query=${query}`;
    }

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
        // random quote
        addQuotation(contents.content, contents.author)
    }
    else {
        const quotations = document.getElementById("quotations");
        quotations.innerHTML = "";

        if (searchLevel < 4) {
            // filter results to full or partial matches
            contents.results = contents.results.filter((quote) => filterNames(quote, query, searchLevel));
        }

        // Add quotations to page
        contents.results.forEach((item) => {
            addQuotation(item.content, item.author)
        });
        displayMessage(`${contents.results.length} quotations found for author "${query}"`, "message");
    }
}

function filterNames(quote, query, level) {
    // Complete match
    if (quote.author.toLowerCase() === query.toLowerCase()) {
        return true;
    }

    const nameParts = quote.author.toLowerCase().split(" ");
    const queryParts = query.toLowerCase().split(" ");

    if (level === 2) {
        // Match last name
        const lastName = nameParts.slice(-1);
        const lastQueryName = queryParts.slice(-1);
        if (lastName[0] === lastQueryName[0]) {
            return true;
        }
    }

    if (level === 3) {
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

function addQuotation(quote, citation) {
    const quotations = document.getElementById("quotations");
    const blockquote = document.createElement("blockquote");                
    blockquote.classList.add("quotation");
    blockquote.tabIndex = "0";

    const icons = document.createElement("div");
    icons.classList.add("icons");
    let html = `<span class="material-icons-outlined copy" aria-label="copy" 
    tabindex="0" role="button">content_copy</span>`
    if (navigator.canShare) {
        html += `<span class="material-icons-outlined share" aria-label="share" tabindex="0" 
    role="button">share</span>`
    }
    icons.innerHTML = html;
    blockquote.appendChild(icons);

    const text = document.createElement("p");
    text.innerText = quote;
    blockquote.appendChild(text);

    const cite = document.createElement("footer");
    if (citation.length === 0) {
        citation = "Anonymous";
    }
    cite.innerText = `\u2014 ${citation}`;
    blockquote.appendChild(cite);

    blockquote.addEventListener("click", (e) => {
        if (e.target.classList.contains("copy")) {
            copyQuote(e.currentTarget);
        }
        else if (e.target.classList.contains("share")) {
            shareQuote(e.currentTarget);
        }
        else {
            pinUnpinQuotation(e.currentTarget);
        }
    });

    blockquote.addEventListener("keypress", (e) => {
        if (e.code === "Enter") {
            pinUnpinQuotation(e.currentTarget);
        }
    });

    blockquote.addEventListener("focus", (e) => {
        readQuote(e.currentTarget);
    });

    quotations.appendChild(blockquote);
}

function pinUnpinQuotation(quote) {
    const quotations = document.getElementById("quotations");
    const pinned = document.getElementById("pinned-quotations");
    if (quotations.contains(quote)) {
        quotations.removeChild(quote);

        const icons = quote.querySelector("div");
        const span = document.createElement("span");
        span.classList.add("material-icons-outlined");
        span.innerText = "push_pin";
        icons.insertBefore(span, icons.firstChild);

        pinned.appendChild(quote);
        quote.dataset.pinned = "true";
        displayMessage("Pinned", "");
    }
    else {
        pinned.removeChild(quote);
        const icons = quote.querySelector("div");
        const span = icons.querySelector("span");
        if (span) {
            icons.removeChild(span);
        }
        if (quotations.firstChild) {
            quotations.insertBefore(quote, quotations.firstChild);
        }
        else {
            quotations.appendChild(quote);
        }
        quote.dataset.pinned = "false";
        displayMessage("Unpinned", "");
        searchText.focus();
    }
}

function readQuote(quote) {
    const quotations = document.getElementById("quotations");
    message = quote.innerText;
    if (quotations.contains(quote)) {
        message += ". Enter to pin"
    }
    else {
        message += ". Pinned, Enter to unpin";
    }
    displayMessage(message, "");
}

async function copyQuote(quote) {
    const text = quote.querySelector("p").innerText;
    const cite = quote.querySelector("footer").innerText;
    const quotation =  `${text}\n\n${cite}`
    
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(quotation);
        } catch(error) {
            displayMessage(`An error occured copying ${error}`, "error");
            return;
        }
    }
    else {
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

function displayMessage(message, show) {
    const errorBox = document.getElementById("message");
    errorBox.innerText = message;
    if (show === "message") {
        const span = document.createElement("span");
        span.classList.add("material-icons-outlined");
        span.innerText = "info ";
        errorBox.insertBefore(span, errorBox.firstChild);
        errorBox.style.setProperty("top", "200px");
    }
    else if (show === "error") {
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

const baseURL = "https://usu-quotes-mimic.vercel.app/api/";
const searchText = document.getElementById("search-text");
let initialState = true;

searchText.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
        if (e.target.value === "") {
            displayMessage("Specify author name to search", "error");
            return;
        }

        if (initialState) {
            const container = document.getElementById("container");
            const searchBar = document.getElementById("search-bar");
            const header = document.getElementById("header");
            container.removeChild(searchBar);
            header.appendChild(searchBar);
            container.style.setProperty("justify-content", "flex-start");
            container.style.setProperty("margin-top", "78px");
            initialState = false;
        }
        getQuotes(e.target.value);
        e.target.focus();
    }
});

/* search settings dialog */
let settingsDisplayed = false;
let searchLevel = 1;
const searchSettings = document.getElementById("search-settings");
const searchCancel = document.getElementById("search-cancel");

function toggleSettingsDialog() {
    settingsDisplayed = !settingsDisplayed;
    const settings = document.getElementById("settings");
    settings.dataset.open = `${settingsDisplayed}`;
    const mask = document.getElementById("mask");
    mask.dataset.open = `${settingsDisplayed}`;
}

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

const okButton = document.getElementById("ok-button");
okButton.addEventListener("click", toggleSettingsDialog);

addEventListener("load", () => {
    getQuotes("");
    searchText.focus();
});

const searchOptions = [...document.getElementsByClassName("search-level")];
searchOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
        searchLevel = Number(e.target.value);
    });
});
