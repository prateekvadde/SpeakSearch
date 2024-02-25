const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.continuous = true;

const iframe = document.getElementById('webFrame');

let gazeCoordinates = { x: 0, y: 0 };

const ws = new WebSocket('ws://localhost:8765');

ws.onmessage = (event) => {
    const [eyeX, eyeY] = event.data.split(',');
    updateGazeCoordinates(parseFloat(eyeX), parseFloat(eyeY));
};

function updateGazeCoordinates(x, y) {
    gazeCoordinates.x = x;
    gazeCoordinates.y = y;
}

function simulateMouseClick(buttonType = 'left') {
    let eventType;
    let buttonValue;
    if (buttonType === 'right') {
        eventType = 'contextmenu';
        buttonValue = 2; 
    } else {
        eventType = 'click';
        buttonValue = 0; 
    }

    const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        button: buttonValue,
    });

    document.activeElement.dispatchEvent(event);
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
    if (!isNaN(parsedNumber)) {
        return parsedNumber;
    } else {
        return convertTextToNumber(lastWord);
    }
}

function convertTextToNumber(text) {
    const numberWords = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10
    };
    return numberWords[text.toLowerCase()] || 1; 
}

// Function to search on Google
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

    const query = encodeURIComponent(command.trim());
    if (searchType) {
        searchUrl += `${query}&tbm=${searchType}`;
    } else {
        searchUrl += query;
    }

    // Using a CORS proxy to bypass CORS restrictions
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

// Modify iframe content to handle link clicks through CORS proxy
function modifyIframeContentForCORS(iframe) {
    iframe.onload = () => {
        const links = iframe.contentDocument.querySelectorAll('a');
        links.forEach(link => {
            link.onclick = (event) => {
                event.preventDefault(); // Prevent the default link behavior

                // Extract the actual URL from the href attribute
                let originalLink = link.getAttribute('href');

                // Check if the URL is absolute or needs to be resolved
                if (originalLink && !originalLink.startsWith('http')) {
                    // Resolve relative URLs or malformed URLs
                    // Assuming you have a base URL or a way to resolve URLs correctly
                    const baseUrl = 'https://www.example.com'; // Adjust based on your context
                    const resolvedUrl = new URL(originalLink, baseUrl).href;
                    // Navigate using the resolved URL
                    window.open(resolvedUrl, '_blank');
                } else {
                    // For absolute URLs, open as is in a new tab/window
                    window.open(originalLink, '_blank');
                }
            };
        });
    };
}


// Including previously provided functions for context
// Initialize speech recognition, WebSocket connection, updateGazeCoordinates, etc.

// Ensure to replace 'webFrame' with the actual ID of your iframe in the HTML
// Ensure WebSocket server is running and accessible at 'ws://localhost:8765'
// Adjust the CORS proxy URL as needed, considering the usage policy of 'cors-anywhere'

