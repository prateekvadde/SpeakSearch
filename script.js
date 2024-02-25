const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.continuous = true;

const iframe = document.getElementById('webFrame');

const ws = new WebSocket('ws://localhost:8765');

ws.onmessage = (event) => {
    // Process WebSocket messages if needed
};

function simulateMouseClick(buttonType = 'left') {
    const elementUnderCursor = document.elementFromPoint(window.cursorPosition.x, window.cursorPosition.y);
    if (elementUnderCursor && elementUnderCursor.tagName === 'A') {
        let href = elementUnderCursor.getAttribute('href');
        if (href) {
            // Prepend the CORS proxy to navigate using the CORS server
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            href = `${proxyUrl}${href}`;
            iframe.src = href; // Load in iframe instead of direct navigation
        }
    } else if (buttonType === 'right') {
        // Handle right-click if needed
    }
}


function startRecognition() {
    try {
        recognition.start();
        console.log('Voice recognition activated. Start speaking.');
    } catch (e) {
        console.error('Recognition start error:', e);
    }
}

startRecognition();

recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const command = event.results[last][0].transcript.trim().toLowerCase();
    console.log('Voice command:', command);

    executeCommand(command);
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
};

recognition.onend = () => {
    console.log('Speech recognition ended. Restarting...');
    startRecognition();
};
// Initialize window.cursorPosition with a default value
window.cursorPosition = { x: 0, y: 0 };

// Example update mechanism for window.cursorPosition based on mouse movements
document.addEventListener('mousemove', (event) => {
    window.cursorPosition.x = event.clientX;
    window.cursorPosition.y = event.clientY;
});


function executeCommand(command) {
    if (command === 'mouse click' || command === 'left click mouse') {
        simulateMouseClick('left');
    } else if (command === 'right click mouse') {
        simulateMouseClick('right');
    } else if (command.startsWith('turn on dark mode')) {
        document.body.classList.add('dark-mode');
    } else if (command.startsWith('turn off dark mode')) {
        document.body.classList.remove('dark-mode');
    } else if (command.startsWith('scroll down by ')) {
        const multiplier = parseMultiplier(command);
        iframe.contentWindow.scrollBy(0, multiplier * 100);
    } else if (command.startsWith('scroll up by ')) {
        const multiplier = parseMultiplier(command);
        iframe.contentWindow.scrollBy(0, -(multiplier * 100));
    } else if (command.startsWith('search ')) {
        searchGoogle(command);
    } else if (command === "move mouse") {
        ws.send("move mouse");
    } else if (command === "stop mouse") {
        ws.send("stop mouse");
    } else {
        console.log('Command not recognized:', command);
    }
}

function parseMultiplier(command) {
    const parts = command.split(' ');
    const lastWord = parts[parts.length - 1];
    const parsedNumber = parseInt(lastWord);
    return !isNaN(parsedNumber) ? parsedNumber : convertTextToNumber(lastWord);
}

function convertTextToNumber(text) {
    const numberWords = {
        one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };
    return numberWords[text.toLowerCase()] || 1; 
}

function searchGoogle(command) {
    const commandLower = command.toLowerCase();
    let searchType = '';
    let searchUrl = 'https://www.google.com/search?q=';

    if (commandLower.startsWith('search images ')) {
        searchType = 'isch';
        command = command.replace('search images ', '');
    } else if (commandLower.startsWith('search shopping ')) {
        searchType = 'shop';
        command = command.replace('search shopping ', '');
    }
    command = command.replace('search ', '');

    const query = encodeURIComponent(command.trim());
    if (searchType) {
        searchUrl += `${query}&tbm=${searchType}`;
    } else {
        searchUrl += query;
    }

    // Using a CORS proxy to bypass CORS restrictions for demonstration purposes
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const proxiedSearchUrl = `${proxyUrl}${searchUrl}`;

    fetch(proxiedSearchUrl)
        .then(response => response.text())
        .then(html => {
            iframe.srcdoc = html;
            modifyIframeContentForCORS(iframe);
        })
        .catch(error => console.error('Error fetching search results:', error));
}



function modifyIframeContentForCORS(iframe) {
    iframe.onload = () => {
        const links = iframe.contentDocument.querySelectorAll('a');
        links.forEach(link => {
            link.onclick = (event) => {
                event.preventDefault(); // Prevent the default link behavior

                // Extract the actual URL from the href attribute
                let originalLink = link.getAttribute('href');

                // Prepend the CORS proxy to navigate using the CORS server
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                let proxiedLink = proxyUrl + originalLink;

                // Assuming all links should be opened within the iframe for CORS handling
                iframe.src = proxiedLink;
            };
        });
    };
}

// Note: Ensure you have a method to update window.cursorPosition based on the head tracking cursor movement.
// Adjust the CORS proxy URL as needed, considering the usage policy of 'cors-anywhere' or use an alternative CORS solution.
