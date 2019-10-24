const CONFIGS = [free_config,blob_config, circle_config, square_config]
const GAME_NAMES  = CONFIGS.map(x=>x.name).concat(['All']);

var BORDER = 10;
var WIDTH = 800;
var HEIGHT = 800;

var WHITE=0xFFFFFF;
var RED=0xFF0000;
var GREEN=0x00FF00;

var FONT_FAMILY = 'monospace';


// roughly the size of a panel
LENGTH = Math.floor((Math.min(WIDTH, HEIGHT)-BORDER)/2)

var REFERENCE_ORIGIN ={x:3,y:3}
var PLAYER_ORIGIN = {x:LENGTH, y:LENGTH};
var STATS_ORIGIN = {x:REFERENCE_ORIGIN.x, y:PLAYER_ORIGIN.y+BORDER};
var PLAYER_NAME_ORIGIN = {x:REFERENCE_ORIGIN.x, y:2*LENGTH-BORDER};
var SCORE_ORIGIN =  {x:REFERENCE_ORIGIN.x, y:BORDER};
var PLAYER_NAME = 'Louis';


const make_session_id = ()=>Date.now()

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

var GRAPHICS;
var GAME = new Phaser.Game(config);

class SessionManager
{
    constructor() 
    {
        console.log('constructing session manager');
        // prepare the sequence of game
        this.initialize_session_sequences();
    }

    update_next_scene_name()
    {
        var next = this._next_scene_name;
        this.update_next_session()
        return next;
    }

    next_scene_name()
    {
        return this._next_scene_name;
    }

    update_next_session()
    {
        console.log('updating next session')
        this._next_scene_name = this._scene_names.pop();
        console.log(`next scene name is ${this._next_scene_name}`);
        if(this._next_scene_name==undefined)
        {
            console.log('session has ended');
            this.initialize_session_sequences();
        }

    }

    get remaining_scenes()
    {
        return this._scene_names.length

    }

    get session_state_string()
    {
        var done_scenes = this._scene_count - this.remaining_scenes;
        return  `${done_scenes}/${this._scene_count}`
    }

    
    get session_id()
    {
        return this._session_id
    }


    initialize_session_sequences()
    {
        console.log('initialize sequences');
        this._session_id =make_session_id();
        console.log('session_id %s', this._session_id);
        // create the time filters that will define the stats columns
        update_time_filters(this._session_id);
        // create the sequence of scene names
        this._scene_names = create_random_scenes_sequence();
        this._scene_count=this._scene_names.length;
        this.update_next_session();
    }


}


function read_stats()
{
    //console.time('retrieve stats');
    var stats = JSON.parse(localStorage.getItem(PLAYER_NAME))||[];
    //console.timeEnd('retrieve stats');
    return stats;
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
    //stats = stats.filter(x=> GAME_NAMES.includes(x.name ));
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

function make_score_table(stats)
{
    //debugger


}


const t2d = x => new Date(x.getFullYear(), x.getMonth(), x.getDate())
const TODAY = t2d(new Date(Date.now()));
var TIME_FILTERS; 

function update_time_filters(current_session_id)
{
    stats = read_stats();
    session_ids = stats.map(x=>x.session_id).sort();
    TIME_FILTERS = {};
    TIME_FILTERS['session'] = x => x.session_id == current_session_id
    if (session_ids.length>0)
    {
        TIME_FILTERS['prev'] =  x => x.session_id == session_ids.slice(-1)[0]
    }

    TIME_FILTERS['today'] =  x => t2d(new Date(x.time)).getTime() == TODAY.getTime()
    TIME_FILTERS['all'] = x => true
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
        'median': x=>isNaN(x)?'':(100*x).toFixed(1)

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
    //console.log(score)
    textureManager.remove('snap');
    return score;
}

function create_random_scenes_sequence()
{
    var repetitions_per_game = 1;
    var random_scenes = [];
    function add(config)
    {
        for(i=0;i<repetitions_per_game;i++)
        {
            random_scenes.push(config.name)
        }
    }
    CONFIGS.forEach(add)
    random_scenes = Phaser.Math.RND.shuffle(random_scenes);
    return random_scenes;
}


var codes = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE', 'ZERO'];
var CODE2GAME = {}

function initialize_scenes()
{
    function add_polygon_game(config, index)
    {
        var should_start = config.name==SESSION_MANAGER.next_scene_name();
        should_start = false;
        console.log('adding scene with config')
        console.log(config)
        GAME.scene.add(config.name, InputScene, should_start, config);
        GAME.scene.add(config.eval_name, EvaluateScene, false, config);
        CODE2GAME[Phaser.Input.Keyboard.KeyCodes[codes[index]]]=config.name;

    }
    CONFIGS.forEach(add_polygon_game)
}


function make_status_string()
{
    var stats = read_stats();
    var historical_stats = calculate_historical_performance(stats);
    var stat_strings = make_stats_strings(historical_stats);
    stat_strings.push(SESSION_MANAGER.session_state_string)
    return stat_strings;
}

// Starting scene
class Start extends Phaser.Scene {
    constructor(config) {
        super(config);
        var stats = read_stats();
        var table = make_score_table(stats);
    }

    preload()
    {
        console.log('preloading')
        //this.load.audio('init', 'assets/snd/init.wav');
        //this.load.audio('init', 'assets/fx_mixdown.ogg')
        //console.log('done')
    }

    create(config)
    {
        //var music = this.sound.add('init');
        //music.play()
        GRAPHICS = this.add.graphics();
        this.stats_text = this.add.text(
            STATS_ORIGIN.x, 
            STATS_ORIGIN.y, 'PRESS SPACE TO START').setFontSize(16).setFontFamily(FONT_FAMILY)
         
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(SESSION_MANAGER.next_scene_name());

        }, this);

    }
    update ()
    {
    }
}
// ending scene
class End extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    create(config)
    {
        GRAPHICS = this.add.graphics();
        this.stats_text = this.add.text(
            STATS_ORIGIN.x, 
            STATS_ORIGIN.y, 'WE ARE DONE').setFontSize(16).setFontFamily(FONT_FAMILY)
         
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(SESSION_MANAGER.update_next_scene_name());

        }, this);

    }
    update ()
    {
    }
}

//var name = prompt('Enter your name');
PLAYER_NAME = 'Louis';

var SESSION_MANAGER = new SessionManager();
// instantiate all scenes
initialize_scenes(); //perhaps this should be put in session manager


GAME.scene.add('Start', Start, true, config);
GAME.scene.add('End', End, false, config);
//GAME.canvas.oncontextmenu = (e) => e.preventDefault()
