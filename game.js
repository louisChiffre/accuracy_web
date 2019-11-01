//const CONFIGS = [free_config, blob_config, circle_config, square_config]
const CONFIGS = [blob_config, circle_config, square_config]
const GAME_NAMES  = CONFIGS.map(x=>x.name).concat(['All']);

var FIREBASE_APP;
var FIREBASE_USER;
var FIREBASE_DB;


var BORDER = 10;
var WIDTH = 800;
var HEIGHT = 800;

var WHITE=0xFFFFFF;
var RED=0xFF0000;
var GREEN=0x00FF00;

var FONT_FAMILY = 'monospace';
var DEFAULT_FONT_SIZE = 16;
//var FONT_FAMILY = 'battle';
//var DEFAULT_FONT_SIZE = 14;


// roughly the size of a panel
var LENGTH = Math.floor((Math.min(WIDTH, HEIGHT)-BORDER)/2)

var REFERENCE_ORIGIN ={x:3,y:3}
var PLAYER_ORIGIN = {x:LENGTH, y:LENGTH};
var STATS_ORIGIN = {x:REFERENCE_ORIGIN.x, y:PLAYER_ORIGIN.y+BORDER};
var PLAYER_NAME_ORIGIN = {x:REFERENCE_ORIGIN.x, y:2*LENGTH-BORDER};
var SCORE_ORIGIN =  {x:REFERENCE_ORIGIN.x, y:BORDER};


const make_session_id = ()=>Date.now()

var TEXT_HEIGHT = 15

var REFERENCE_COLOR = WHITE

var PHASER_CONFIG = {
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
var GAME = new Phaser.Game(PHASER_CONFIG);

class SessionManager
{
    constructor() 
    {
        console.log('constructing session manager');
        load_firebase_stats();
        this._scene_names = []
        CONFIGS.forEach((config)=>this.initialize_scene(config.name))
        this.state = 'START'
    }

    _create_random_scenes()
    {
        // we have reached the end
        this._session_id =make_session_id();
        console.log(`session_id ${this._session_id}`)
        this._scene_names = create_random_scenes_sequence();
        this.scenes_count = this._scene_names.length
        update_time_filters(this._session_id);

    }

    next_scene_name()
    {
        var state2func = {
            'END': function(this_){
                console.log('end')
                this_._create_random_scenes();
                this_.state='PLAY'
                return this_._scene_names.pop();
            },
            'PLAY': function(this_) {
                if (this_._scene_names.length==0)
                {
                    this_.state='END'
                    return 'End'

                }
                this_.state='PLAY'
                return this_._scene_names.pop();

            },

            'START': function(this_){
                this_._create_random_scenes();
                this_.state='PLAY'
                return this_._scene_names.pop();
                },
        }
        console.log(`STATE is ${this.state}`)
        var next_scene =  state2func[this.state](this);
        console.log(`STATE is now ${this.state} and next scene is ${next_scene}`)
        return next_scene;
    }

    initialize_scene(scene_name)
    {
        console.log(`initializing ${scene_name}`)
        var config = CONFIGS.find(({ name }) => name === scene_name );
        GAME.scene.add(config.name, InputScene, false, config);
        GAME.scene.add(config.eval_name, EvaluateScene, false, config);
    }

    get session_state_string()
    {
        var done_scenes = this.scenes_count - this._scene_names.length;
        return  `${done_scenes}/${this.scenes_count}`
    }

    
    get session_id()
    {
        return this._session_id
    }




}

function get_firebase_stats_path()
{
    return `/user/${FIREBASE_USER.uid}/stats.json`
}

function get_firebase_stats_ref()
{
    return FIREBASE_APP.storage().ref().child(get_firebase_stats_path()) 
}

function read_stats()
{
    var stats = JSON.parse(localStorage.getItem(FIREBASE_USER.uid))||[];
    return stats;

}

async function get_firebase_stats_url()
{
    var url = await get_firebase_stats_ref().getDownloadURL()
    .catch(function(error) {
        if (error.code == 'storage/object-not-found')
        {
            console.log('no stats available');
            return '' 
        }

      }
    );
    return url
}

function  save_local_stats(stats)
{
    console.log(`saving ${stats.length} points`)
    localStorage.setItem(FIREBASE_USER.uid, JSON.stringify(stats));
}

function save_stat_firestore(stat)
{
    FIREBASE_DB.collection('users').doc(FIREBASE_USER.uid).collection('stats').doc(stat.session_id.toString()).set(stat)
    .then(function(docRef) {
        console.log("Document written ", stat);
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

function read_stat_firestore()
{
    var ref = FIREBASE_DB.collection("users").doc(FIREBASE_USER.uid).collection('stats').get().then( function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());
        })})
}

async function load_firebase_stats()
{
    // CORS configuration needs to be done see https://firebase.google.com/docs/storage/web/download-files
    console.time('stats firebase read');
    const url = await get_firebase_stats_url()
    if (url=='')
    {
        console.log('no stats available');
        save_local_stats([]);
        return;
    }

    const response = await fetch(url).then(function(response) {
        if (!response.ok) {
            debugger
            throw Error(response.statusText);
        }
        return response;
    }).catch(function(error) {
        console.log(error);
    });

    const promise = await response.text()
        .then(function(text){
            stats = JSON.parse(LZString.decompressFromBase64(text))
            save_local_stats(stats)
            }
            )
        .catch(function(error) {
            console.log(error);
        });

    console.timeEnd('stats firebase read');
}

async function upload_firebase_stats()
{
    var stats = read_stats();
    console.time('upload stats')
    get_firebase_stats_ref().putString(LZString.compressToBase64(JSON.stringify(stats)))

        .then(function(snapshot) { console.timeEnd('upload stats')})

}

function update_local_stats(stat)
{
    // load the stats from local storage
    var stats = read_stats();
    stats.push(stat)
    save_local_stats(stats);
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

function make_score_table(stats)
{
    //debugger


}


const t2d = x => new Date(x.getFullYear(), x.getMonth(), x.getDate())
const TODAY = t2d(new Date(Date.now()));
var TIME_FILTERS; 

function update_time_filters(current_session_id)
{
    var stats = read_stats();
    var session_ids = stats.map(x=>x.session_id).sort();
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
    var stats = stats.filter(x=> GAME_NAMES.includes(x.name ))
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
    var repetitions_per_game = 3;
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
    console.log('random scenes ', random_scenes)
    return random_scenes;
}


var CODES = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE', 'ZERO'];
var CODE2GAME = {}
// CONFIGS.forEach(function(x,index) { CODE2GAME[Phaser.Input.Keyboard.KeyCodes[CODES[index]]]=x})


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
        GRAPHICS = this.add.graphics();
        var stats_text = this.add.text(
            STATS_ORIGIN.x, 
            STATS_ORIGIN.y, 'LOGGING IN ...').setFontSize(16).setFontFamily(FONT_FAMILY)

        FIREBASE_APP = firebase.initializeApp(firebase_config);
        var scene = this;

        FIREBASE_APP.auth().onAuthStateChanged(function (user) {
            if (user) {
                console.log('User is signed in');
                var displayName = user.displayName;
                var email = user.email;
                var emailVerified = user.emailVerified;
                var photoURL = user.photoURL;
                var isAnonymous = user.isAnonymous;
                var uid = user.uid;
                var providerData = user.providerData;
                console.log(displayName + '(' + uid + '): ' + email);
                FIREBASE_USER = user;
                SESSION_MANAGER = new SessionManager();
                FIREBASE_DB = firebase.firestore();

                scene.input.keyboard.on('keydown_SPACE', function (event)
                {
                    scene.scene.start(SESSION_MANAGER.next_scene_name());

                }, scene);

                stats_text.setText(`LOGGED IN AS ${get_display_name()}. PRESS SPACE TO START`);

            } else {
                stats_text.setText('LOGGED OUT. PLEASE LOG IN');
                console.log('log-out');
                var provider = new firebase.auth.GoogleAuthProvider();
                FIREBASE_APP.auth().signInWithPopup(provider).then(function (result) {
                    console.log(user);

                }).catch(function (error) {
                    var errorMessage = error.message;
                    console.log(errorMessage);
                });

            }
        });

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
        upload_firebase_stats();
         
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(SESSION_MANAGER.next_scene_name());

        }, this);

    }
    update ()
    {
    }
}

function get_display_name()
{
    var provider_id = FIREBASE_USER.providerData[0].providerId;

    providerId2name = {
        'google.com' : FIREBASE_USER.email,
        'github.com': FIREBASE_USER.providerData[0].email,

    }
    var display_name = providerId2name[provider_id] || FIREBASE_USER.email;
    return `${display_name} [${provider_id}]`;

}

var SESSION_MANAGER;


// let's start
GAME.scene.add('Start', Start, true)
GAME.scene.add('End', End, false)
//GAME.canvas.oncontextmenu = (e) => e.preventDefault()
