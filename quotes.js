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

    if (!contents.count) {
        addQuotation(contents.content, contents.author)
    }
    else {
        const quotations = document.getElementById("quotations");
        quotations.innerHTML = "";
        contents.results.forEach((item) => {
            addQuotation(item.content, item.author)
        });
        displayMessage(`${contents.results.length} quotations found for author "${query}"`, "message");
    }
}

function addQuotation(quote, citation) {
    const quotations = document.getElementById("quotations");
    const blockquote = document.createElement("blockquote");                
    blockquote.classList.add("quotation");
    blockquote.tabIndex = "0";

    const text = document.createElement("p");
    text.innerText = quote;
    blockquote.appendChild(text);
    const cite = document.createElement("footer");
    cite.innerText = `\u2014 ${citation}`;
    blockquote.appendChild(cite);

    blockquote.addEventListener("click", (e) => {
        pinUnpinQuotation(e.currentTarget);
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

        const p = quote.querySelector("p");
        const span = document.createElement("span");
        span.classList.add("material-icons-outlined");
        span.innerText = "push_pin";
        p.insertBefore(span,p.firstChild);

        pinned.appendChild(quote);
        quote.dataset.pinned = "true";
        displayMessage("Pinned", "");
    }
    else {
        pinned.removeChild(quote);
        const p = quote.querySelector("p");
        const span = p.querySelector("span");
        if (span) {
            p.removeChild(span);
        }
        if (quotations.firstChild) {
            quotations.insertBefore(quote, quotations.firstChild);
        }
        else {
            quotations.appendChild(quote);
        }
        quote.dataset.pinned = "false";
        displayMessage("Unpinned", "");
    }
}

function readQuote(quote) {
    const quotations = document.getElementById("quotations");
    const pinned = document.getElementById("pinned-quotations");
    message = quote.innerText;
    if (quotations.contains(quote)) {
        message += ". Enter to pin"
    }
    else {
        message += ". Pinned, Enter to unpin";
    }
    displayMessage(message, "");
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
        e.target.value = "";
    }
});

addEventListener("load", getQuotes(""));
