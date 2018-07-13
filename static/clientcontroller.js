var socket = io();

//==============================
// Game Variables
//==============================

var sessionID;

var myShips = [];

// these reset every turn
var guesses = [];
var canPlay = false;
var isSettingUp = false;

// these update every time get answers from server
var numHitsOnMe = 0; // number of times opponent hits you
var numHitsOnOppo = 0; // number of times opponent hits you

//==============================
// Handle messages from Sever
//==============================

// get sessionID, print it to console, and alert server that client joined
socket.on('connect', function() {
    sessionID = socket.io.engine.id;

    // testing code
    console.log('client-side sessionID: ' + sessionID);
    socket.emit('server-log', 'I am client ' + sessionID);
});

// testing code
// recieve message from server and print it out to console
socket.on('client-log', function(data) {
    console.log('client got: ' + data);
});

socket.on('disconnect', function() {
    guesses = [];
});

//==============================
// Handle messages from Sever - Creating and Joining Room
//==============================

// recieve roomcode and alert user, setUp new board 
socket.on('player1-joined', function(data) {
    alert('Tell your opponent to join: ' + data);
    console.log('player1 joined ' + data);
    startSetUpBoard();
});

// setUp new board
socket.on('player2-joined', function(data) {
    console.log('player2 joined ' + data);
    startSetUpBoard();
});

// error, send alert with error message to user
socket.on('err', function(data) {
    alert(data);
});

//==============================
// Interactions with html page - Creating and Joining Room
//==============================

// when html page loaded
$(document).ready(function() {

    // when new button clicked, tell server user wants to create new room
    $('#new').on('click', function() {
        socket.emit('newRoom', {});
    });

     // when join button clicked, tell server user wants to join room
    $('#join').on('click', function() {
        var roomcode = $('#roomcode').val();
        if(!roomcode) {
            alert('Please enter your room code!')
            return;
        }
        socket.emit('joinRoom', roomcode);
    });

});

//==============================
// Handle messages from Sever - Playing
//==============================

// update oppoBoard
socket.on('your-answers', function(data) {
    for(let i = 0; i < data.hits.length; i++) {
        let id = '#o_' + data.hits[i];
        // hits are brownish
        $(id).css("background-color", "Crimson");

        numHitsOnOppo++;
    }

    for(let j = 0; j < data.misses.length; j++) {
        let id = '#o_' + data.misses[j];
        // misses are ocean blue
        $(id).css("background-color", "DarkBlue");
    }
});

// update myBoard
socket.on('opponent-answers', function(data) {
    for(let i = 0; i < data.hits.length; i++) {
        let id = '#m_' + data.hits[i];
        // hits are brownish
        $(id).css("background-color", "IndianRed");

        numHitsOnMe++;
    }

    for(let j = 0; j < data.misses.length; j++) {
        let id = '#m_' + data.misses[j];
        // misses are ocean blue
        $(id).css("background-color", "CornflowerBlue");
    }

    // reset canPlay, status text, and guesses array
    resetGameVars();
});


//==============================
// Interactions with html page - Setting Up Board
//==============================

// removes elements of menu and calls function to create new board
function startSetUpBoard() {
    $('#menu').remove();

    // add buttons here
    createOppoBoard();
    createMyBoard();
    $('#status').text('Pick 15 locations on your board to place your ships');
    isSettingUp = true;
}

//==============================
// Interactions with html page - MyBoard and Hits
//============================== 

// dynamically generates buttons + header
function createMyBoard() {
    
    $('#myBoard').append($('<h2/>', {
        text: 'Me',
        left: '50%',
    }));

    $('#myBoard').append($('<h4/>', {
        text: 'Ships placed: -',
        id: 'hitsOnMe',
        left: '50%',
    }));
    
    for (let i = 1; i <= 8; i++) {
        //let chr = String.fromCharCode(65 + i);
        for(let j = 1; j <= 8; j++) {
            var button = $('<button/>', {
                text: i + '' + j,
                id: 'm_' + i + '' + j,
                disabled: false,
                width: window.innerWidth/8.5,
                height: 25,
                class: 'myboard-buttons',
            }).click(placeShips);

            $('#myBoard').append(button);
        }
        $('#myBoard').append($('<br/>'));
    }
}

function placeShips() {
    if (isSettingUp) {
        index = parseInt(event.target.id.substring(2));
        event.target.disabled = true;
        // guesses are green
        event.target.style.background = '#ffffff';
        myShips.push(index);
        $('#hitsOnMe').text('Ships placed: ' + myShips.length);
    }
    if (myShips.length === 15) {
        isSettingUp = false;
        canPlay = true;
        $('.myboard-buttons').attr("disabled", "disabled");
    }
}

//==============================
// Interactions with html page - OppoBoard and Guesses
//==============================

// dynamically generates buttons + header
function createOppoBoard() {

    // $('#oppoBoard').append($('<h4/>', {
    //     text: 'Status: Pick 5 locations',
    //     id: 'status',
    // }));

    $('#oppoBoard').append($('<h2/>', {
        text: 'Opponent',
        left: '50%',
    }));

    $('#oppoBoard').append($('<h4/>', {
        text: 'Hits On Opponent: 0/15',
        id: 'hitsOnOppo',
        left: '50%',
    }));

    $('#status').text('Pick 5 locations');

    for (let i = 1; i <= 8; i++) {
        //let chr = String.fromCharCode(65 + i);
        for(let j = 1; j <= 8; j++) {
            var button = $('<button/>', {
                text: i + '' + j,
                id: 'o_' + i + '' + j,
                disabled: false,
                width: window.innerWidth/8.5,
                height: 25,
            }).click(clickOppoBoardButton);
    
            $('#oppoBoard').append(button);
        }
        $('#oppoBoard').append($('<br/>'));
    }
}

// called on click by all buttons generated in create board
function clickOppoBoardButton(event) {
    if (canPlay) {
        index = parseInt(event.target.id.substring(2));
        event.target.disabled = true;
        // guesses are green
        event.target.style.background = '#4abc38';
        addGuesses(index);
    }
}

// add all guesses to guesses[] and when get 5 guesses, sort and send to server
function addGuesses(guess) {
    guesses.push(guess);
    if (guesses.length == 5) {

        canPlay = false;
        $('#status').text('Waiting for other player...');

        guesses.sort(function(a, b) {return a-b});
        socket.emit('guesses-ships', {
            guesses: guesses,
            ships: myShips,
            player: sessionID
        });
    }
}

function resetGameVars() {
    canPlay = true;
    $('#status').text('Pick 5 locations on the enemy board to attack');
    $('#hitsOnMe').text('Hits On Me: ' + numHitsOnMe + '/15');
    $('#hitsOnOppo').text('Hits On Opponent: ' + numHitsOnOppo + '/15');

    guesses = [];

    if (numHitsOnOppo === 15) {iWon();}

    else if(numHitsOnMe === 15) {iLost();}
}

function iWon() {
    $('#status').text('YOU WON!');
    canPlay = false;
    alert('YOU WON! You hit all your opponent\'s ships!');
}

function iLost() {
    $('#status').text('YOU LOST...');
    canPlay = false;
    alert('YOU LOST! Your opponent hit all your ships!');
}