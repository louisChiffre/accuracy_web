var BORDER = 10;
var WIDTH = 640;
var HEIGHT = 640;

var WHITE=0xFFFFFF;
var RED=0xFF0000;


LENGTH = Math.floor((Math.min(WIDTH, HEIGHT)-BORDER)/2)

var REFERENCE_ORIGIN ={x:3,y:3}
var PLAYER_ORIGIN = {x:LENGTH, y:LENGTH} 
var STATS_ORIGIN = {x:REFERENCE_ORIGIN.x, y:LENGTH}

var TEXT_HEIGHT = 15

var REFERENCE_COLOR = WHITE

var config = {
    width: 800,
    height: 800,
    type: Phaser.AUTO,
    parent: 'Accuracy Training',
    scene: [Square, EvaluateSquare]
};

function rand(min,max)
{
     return Math.random() * (+max - +min) + +min;
}


var graphics;
var cursors;




var player;
var reference;


var game = new Phaser.Game(config);
var SPEED = 1.0
