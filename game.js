var BORDER = 10;
var WIDTH = 640;
var HEIGHT = 640;

var WHITE=0xFFFFFF;
var RED=0xFF0000;
var GREEN=0x00FF00;


LENGTH = Math.floor((Math.min(WIDTH, HEIGHT)-BORDER)/2)

var REFERENCE_ORIGIN ={x:3,y:3}
var PLAYER_ORIGIN = {x:LENGTH, y:LENGTH} 
var STATS_ORIGIN = {x:LENGTH, y:REFERENCE_ORIGIN.y}

var TEXT_HEIGHT = 15

var REFERENCE_COLOR = WHITE

var config = {
    width: 800,
    height: 800,
    type: Phaser.AUTO,
    parent: 'Accuracy Training',
    pixelArt:true,
    //scene: [Square, EvaluateSquare, Circle]
};

var data;

var graphics;
var player;
var reference;


var game = new Phaser.Game(config);
var stats_data = [];

function update_stats(stats)
{
    stats_data.push(stats)
}

var codes = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE', 'ZERO'];
var code2game = {}
function add_polygon_game(config, index)
{
    game.scene.add(config.name, Polygon, true, config);
    game.scene.add(config.eval_name, EvaluatePolygon, false, config);
    code2game[Phaser.Input.Keyboard.KeyCodes[codes[index]]]=config.name;

}
[blob_config, circle_config, square_config].forEach(add_polygon_game)


var SPEED = 1.0

function calc_score(textureManager, image)
{
    var canvas = textureManager.createCanvas('snap', image.width, image.height);
    canvas.draw(0, 0, image);
    var data = canvas.imageData.data
    var i,j,k;
    var key,r,g;
    var M = {};
    var intersection_key = [76,53];
    var only_ref_key = [0,76];
    var only_player_key = [76,0];

    for (i = 0; i < LENGTH; i++) {
        for (j = 0; j < LENGTH; j++) {
            k =(i + j*LENGTH)*4
            r = data[k];
            g = data[k+1];
            key = [r,g];
            if (key in M)
            {
                M[key] = M[key]+1;
            }
            else
            {
                M[key] = 1;
            }
            //k = scene.scene.textures.getPixel(i,j, 'snap');
        }
    }
    var only_ref = M[only_ref_key]||0;
    var only_player = M[only_player_key]||0;
    var intersection = M[intersection_key]||0;
    var union = only_ref + only_player + intersection;
    var score = intersection/union;
    console.log(score)
    textureManager.remove('snap');
    return score;
}


