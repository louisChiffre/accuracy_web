const CONFIGS = [blob_config, circle_config, square_config];
const GAME_NAMES  = CONFIGS.map(x=>x.name).concat(['All']);

var BORDER = 10;
var WIDTH = 800;
var HEIGHT = 800;

var WHITE=0xFFFFFF;
var RED=0xFF0000;
var GREEN=0x00FF00;

var FONT_FAMILY = 'monospace';


LENGTH = Math.floor((Math.min(WIDTH, HEIGHT)-BORDER)/2)

var REFERENCE_ORIGIN ={x:3,y:3}
var PLAYER_ORIGIN = {x:LENGTH, y:LENGTH};
var STATS_ORIGIN = {x:REFERENCE_ORIGIN.x, y:PLAYER_ORIGIN.y+BORDER};
var PLAYER_NAME_ORIGIN = {x:REFERENCE_ORIGIN.x, y:2*LENGTH-BORDER};
var SCORE_ORIGIN =  {x:REFERENCE_ORIGIN.x, y:LENGTH+BORDER};
var PLAYER_NAME = 'Louis';


const make_session_id = ()=>Date.now()

var SESSION_ID;
var NEXT_SCENE_NAME;
var SCENE_NAMES;
var SCENE_COUNT;


var TEXT_HEIGHT = 15

var REFERENCE_COLOR = WHITE

var config = {
    width: WIDTH+100,
    height: HEIGHT+100,
    type: Phaser.AUTO,
    parent: 'Accuracy Training',
    pixelArt:true,
    audio: {
        disableWebAudio: true
    }
};

var data;

var graphics;
var player;
var reference;


var game = new Phaser.Game(config);

function read_stats()
{
    return JSON.parse(localStorage.getItem(PLAYER_NAME))||[];
}

function save_stats(stat)
{
    // load the stats from local storage
    //console.time('stats calculation');
    var stats = read_stats();
    stats.push(stat)
    //calculate_stats_summary(stats);
    // save the stats
    localStorage.setItem(PLAYER_NAME, JSON.stringify(stats));
    //console.timeEnd('stats calculation');
    return stats
}

function calculate_stats_summary(stats)
{

    //we group the stat on each bucket
    m = {};
    GAME_NAMES.forEach(x=>m[x] = []);
    stats.forEach(x=>m[x.name].push(x));
    m[GAME_NAMES[GAME_NAMES.length-1]]=stats;

    //then for each bucket we compute the actual stats
    var s={};
    Object.keys(m).forEach(
        k=>s[k]={
            'median':median(m[k].map(x=>x.score)),
            'size': m[k].length
            }
    )
    return s;
}

const t2d = x => new Date(x.getFullYear(), x.getMonth(), x.getDate())
const TODAY = t2d(new Date(Date.now()));
var TIME_FILTERS; 

function update_time_filters()
{
    TIME_FILTERS = {
        'session': x => x.session_id == SESSION_ID,
        'today': x => t2d(new Date(x.time)).getTime() == TODAY.getTime(),
        'all': x => true,};
}



function calculate_historical_performance(stats)
{
    var today = t2d(new Date(Date.now()));
    var s = {};
    Object.keys(TIME_FILTERS).forEach(k=> s[k] = {});
    Object.keys(TIME_FILTERS).forEach(k=> s[k]=calculate_stats_summary(stats.filter(TIME_FILTERS[k])))
    return s;
}

function make_stats_strings(historical_stats)
{
    const CHAR_PER_COL=5;
    var columns = Object.keys(TIME_FILTERS);
    var rows  = GAME_NAMES;
    var funcs = {
        'size': x=> x.toFixed(0),
        'median': x=>isNaN(x)?'':(100*x).toFixed(0)

    }
    var row_header_size = Math.max(...GAME_NAMES.map(x=>x.length)) + 2;
    var column_sizes = {}
    columns.forEach(x=>column_sizes[x]=Math.max(x.length+2,CHAR_PER_COL));
    function pad(x, column)
    {
        return x.padStart(column_sizes[column]);
    }
    function pad_row_name(x)
    {
        return x.padEnd(row_header_size);
    }

    function get(exercise, time, field)
    {
        var x = funcs[field](historical_stats[time][exercise][field]);
        return pad(x, time);
    }
    var headers_line = pad_row_name('') + columns.map(column=>pad(column,column)).join('');
    var row_lines = rows.map(row=>pad_row_name(row)+columns.map(column=> get(row, column, 'median') ).join(''));
    return [headers_line].concat(row_lines);

}




// lifted from  https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};



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

function create_random_scenes_sequence()
{
    var n_scene = 3;
    var random_scenes = [];
    function add(config)
    {
        for(i=0;i<n_scene;i++)
        {
            random_scenes.push(config.name)
        }
    }
    CONFIGS.forEach(add)
    SCENE_COUNT=random_scenes.length
    return Phaser.Math.RND.shuffle(random_scenes)
}

function update_session()
{
    NEXT_SCENE_NAME = SCENE_NAMES.pop();
    if(NEXT_SCENE_NAME==undefined)
    {
        console.log('session has ended');
        initialize_session();
    }

}

function initialize_session()
{
    SESSION_ID=make_session_id();
    update_time_filters();
    SCENE_NAMES = create_random_scenes_sequence();
    update_session();
}

var codes = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE', 'ZERO'];
var CODE2GAME = {}

function initialize_scenes()
{
    function add_polygon_game(config, index)
    {
        var is_first = config.name==NEXT_SCENE_NAME;
        game.scene.add(config.name, Polygon, is_first, config);
        //game.scene.add(config.name, Polygon, false, config);
        game.scene.add(config.eval_name, EvaluateScene, false, config);
        CODE2GAME[Phaser.Input.Keyboard.KeyCodes[codes[index]]]=config.name;

    }
    CONFIGS.forEach(add_polygon_game)
}

function make_session_state_string()
{
    var remaining_scenes = SCENE_NAMES.length
    var done_scenes = SCENE_COUNT - remaining_scenes -1;
    return  `${done_scenes}/${SCENE_COUNT}`

}


//var name = prompt('Enter your name');
PLAYER_NAME = 'Louis';
initialize_session();
initialize_scenes();

