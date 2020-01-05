let repeat = (x,n) => Array.from(Array(n).keys()).map(i=>x)
// levels

stop_if_too_bad = function(stats)
{
    var has_lost = _.some(stats, (x)=> x.score<0.01)
    return {
        has_lost: has_lost
    }
}
never =  function(stats)
{
            return {
                has_lost: false
            }
}
var BASE_LEVEL_NAMES = ['CIRCLE', 'SQUARE','PROPORTION', 'TRIANGLE', 'QUAD_WO_FRAME_W_COR', 'QUAD_WO_FRAME', 'QUAD_HARD_TIMED', 'TRAINING']
LEVELS =
{
    DEV:
    {
        name: 'Dev',
        key: 'dev',
        make_scenes_fun: ()=>create_random_scenes_sequence(1 ,['QuadSpaceTimer']),
        evaluate_loss_condition:  never,
        description: 'Just for dev purpose',
    },

    TRAINING:
    {
        name: 'Training',
        key: 'training_1',
        make_scenes_fun: ()=>create_random_scenes_sequence(3 ,['Proportion','Triangle', 'Square', 'Circle',  'QuadSpaceWCorr']),
        evaluate_loss_condition:  never,
        description: '15 exercises selected randomly',

    },
    QUAD_WO_FRAME_W_COR:
    {
        name: 'Quadrilateral',
        make_scenes_fun: ()=> repeat('QuadSpaceWCorr',12),
        key: 'quad_wo_frame_w_corrx12',
        evaluate_loss_condition:  never,
        description: '12 quadrilaterals exercises'
    },

    QUAD_WO_FRAME:
    {
        name: 'Quadrilateral Hard',
        make_scenes_fun: ()=> repeat('QuadSpace',12),
        key: 'quad_wo_frame_and_corrx12',
        evaluate_loss_condition:  never,
        description: '12 quadrilaterals exercises where edges cannot be moved once set'

    },

    QUAD_HARD_TIMED:
    {
        name: 'Quadrilateral Turbo',
        make_scenes_fun: ()=> repeat('QuadSpaceTimer',12),
        key: 'quad_wo_frame_and_corr5x12',
        evaluate_loss_condition:  never,
        description: '12 quadrilaterals exercises with 5 second timer'

    },

    QUAD:{
        name: 'Quad x 12',
        make_scenes_fun: ()=> repeat('Quad',12),
        key: 'quadx12',
        evaluate_loss_condition:  never,
        //evaluate_loss_condition: stop_if_too_bad
    },
    QUAD_HARD:{
        name: 'Quad Hard x 12',
        make_scenes_fun: ()=> repeat('QuadHard',12),
        key: 'quad_hardx12',
        evaluate_loss_condition:  never,
        //evaluate_loss_condition: stop_if_too_bad
    },

    PROPORTION:{
        name: 'Proportion',
        make_scenes_fun: ()=> repeat('Proportion',12),
        key: 'proportionx12',
        evaluate_loss_condition: stop_if_too_bad,
        description: '12 rectangle proportion exercises',
    },

    TRIANGLE:{
        name: 'Triangle',
        make_scenes_fun: ()=> repeat('Triangle',12),
        key: 'trianglex12',
        evaluate_loss_condition: stop_if_too_bad,
    },

    POLYGON:{
        name: 'Polygon x 6',
        make_scenes_fun: ()=> repeat('Blob',6),
        key: 'polygonx6',
        evaluate_loss_condition: stop_if_too_bad,
    },

    CIRCLE:{
        name: 'Circle',
        make_scenes_fun: ()=> repeat('Circle',12),
        key: 'circlex12',
        evaluate_loss_condition: stop_if_too_bad,
        description: '12 circle exercises',
    },
    SQUARE:{
        name: 'Rectangle',
        make_scenes_fun: ()=> repeat('Square',12),
        key: 'squarex12',
        evaluate_loss_condition: stop_if_too_bad,
        description: '12 rectangles exercises',
    },

}




const CONFIGS = [
    triangle_config, blob_config, circle_config, square_config, circle_config_with_timer, 
    proportion_config, free_config, quad_config, quad_config_hard, quad_space_config, quad_space_config_w_corr, quad_space_timer_config]
const GAME_NAMES  = CONFIGS.map(x=>x.name).concat(['All']);

var FIREBASE_APP = firebase.initializeApp(firebase_config);

var FIREBASE_USER;
var FIREBASE_DB;

var USER_INFO;
var LEADERBOARDS;


const BORDER = 10;
const WIDTH = 800;
const HEIGHT = 800;
const BOTTOM_BORDER = 100;

const WHITE=0xFFFFFF;
const RED=0xFF0000;
const GREEN=0x00FF00;

const RED_TEXT='#ff0000';
const WHITE_TEXT='#ffffff';

const FONT_FAMILY = 'monospace';
const DEFAULT_FONT_SIZE = 16;
//var FONT_FAMILY = 'battle';
//var DEFAULT_FONT_SIZE = 14;


// roughly the size of a panel
const LENGTH = Math.floor((Math.min(WIDTH, HEIGHT)-BORDER)/2)
const CENTER = {x:(WIDTH+BOTTOM_BORDER)/2, y:(HEIGHT+BOTTOM_BORDER)/2}
const CENTER_TOP = {x:CENTER.x, y:BORDER}
const CENTER_BOTTOM = {x:CENTER.x, y:HEIGHT+(BOTTOM_BORDER*0.8)}

const REFERENCE_ORIGIN ={x:3,y:3}
const PLAYER_ORIGIN = {x:REFERENCE_ORIGIN.x+LENGTH, y:REFERENCE_ORIGIN.y+LENGTH};
const STATS_ORIGIN = {x:REFERENCE_ORIGIN.x, y:PLAYER_ORIGIN.y+BORDER};
const HELP_ORIGIN = {x:PLAYER_ORIGIN.x, y:REFERENCE_ORIGIN.y};
const PLAYER_NAME_ORIGIN = {x:CENTER.x, y:2*LENGTH};
const SCORE_ORIGIN =  {x:REFERENCE_ORIGIN.x, y:BORDER};


const make_session_id = (key)=>`${Date.now()}__${key}`
const extract_session_key = (session_id)=>session_id.split('__')[1]

function extract_regex_from_session_id(session_id)
{
    var x = session_id.split('__')
    if (x.length==1)
        return /\d$/
    return new RegExp(`__${x[1]}$`)

}

var TEXT_HEIGHT = 15

var REFERENCE_COLOR = WHITE

var PHASER_CONFIG = {
    width: WIDTH + BOTTOM_BORDER,
    height: HEIGHT + BOTTOM_BORDER,
    type: Phaser.AUTO,
    parent: 'Accuracy Training',
    pixelArt:true,
    audio: {
        disableWebAudio: true
    },
    dom: {
        createContainer: true
    },
};

var GRAPHICS;
var GAME = new Phaser.Game(PHASER_CONFIG);

class SessionManager
{
    constructor(level) 
    {
        console.log(`constructing session manager for ${level.name}`);
        this._scene_names = level.make_scenes_fun()
        // we make sure all the scenes are initialized
        CONFIGS.forEach((config)=>this.initialize_scene(config.name))
        // starting state is START
        this.state = 'START'
        this.level_config = level;
        PREV_LEVEL = level;
    }


    next_scene_name()
    {
        var state2func = {
            'END': function(this_){
                console.log('end')
                this_.state = 'Menu'
                return 'Menu'
            },
            'PLAY': function(this_) {
                var stats = get_session_stats(this_.session_id)
                var loss = this_.level_config.evaluate_loss_condition(stats);
                if (loss.has_lost)
                {
                    this_.state='END'
                    return 'End'
                }

                if (this_._scene_names.length==0)
                {
                    this_.state='END'
                    return 'End'

                }
                this_.state='PLAY'
                return this_._scene_names.pop();

            },

            'START': function(this_){
                this_._session_id =make_session_id(this_.level_config.key);
                console.log(`session_id ${this_._session_id}`)
                update_time_filters(this_._session_id);
                this_.scenes_count = this_._scene_names.length
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
        if (GAME.scene.scenes.map((x)=>x.scene.key).includes(scene_name))
        {
            return;
        }
        //var config = CONFIGS.find(({ name }) => name === scene_name );
        var config = get_config_by_name(scene_name)
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

const get_config_by_name= (level_name)=> CONFIGS.find(({ name }) => name === level_name )

const get_firestore_leaderboards=()=>FIREBASE_DB.collection('leaderboards')
const get_firestore_leaderboard_ref=(key)=>get_firestore_leaderboards().doc(key)
const get_firestore_user_ref=()=>FIREBASE_DB.collection('users').doc(FIREBASE_USER.uid)
const get_firestore_stats_collection=()=>get_firestore_user_ref().collection('stats')


function parse_leaderboard_data(querySnapshot)
{
    return Object.entries(querySnapshot.data()).map((x)=> {
            var uid = x[0]
            var score = JSON.parse(x[1])
            score.uid = uid;
            return score
        })
}

function get_leader_boards(level_names)
{
    var keys = get_level_names().map((level_name)=>LEVELS[level_name].key);
    return get_firestore_leaderboards().get().then(function(querySnapshot)
    {
        var data = {};
        querySnapshot.forEach( (x)=>{
            var z = parse_leaderboard_data(x)
            if(keys.includes(x.id)) {
                data[x.id] = _.chain(z).orderBy('score','desc').value() }
            })
        return data
    }
    )
}

function remove_duplicates(stats)
{
    var txt =`remove duplicates of ${stats.length}`
    console.time(txt)
    // would prefer to use something pure es6
    var result = _.uniqBy(stats, 'time');
    result = result.filter((x)=> !(x==undefined)).filter((x)=> 'session_id' in x)
    console.timeEnd(txt);

    return result
}



function get_firebase_stats_path()
{
    return `/user/${FIREBASE_USER.uid}/stats.json`
}

function get_firebase_stats_ref()
{
    return FIREBASE_APP.storage().ref().child(get_firebase_stats_path()) 
}

function get_user_info()
{
    return get_firestore_user_ref().get().then(function(x)
    {
        console.log(`got in with ${x.data()}`)
        console.log(x.data())
        data = x.data()||{}
        return data;
    })
}

var LOCAL_STATS = []

function read_local_stats()
{
    // var data = JSON.parse(localStorage.getItem(FIREBASE_USER.uid))||[];
    console.log(`${LOCAL_STATS.length} stat read from local storage`);
    // return data;
    return LOCAL_STATS;

}

function save_local_stats(stats)
{
    //console.log(`saving ${stats.length} points to local store`)
    //localStorage.setItem(FIREBASE_USER.uid, JSON.stringify(stats));
    LOCAL_STATS = stats;
}

function update_local_stats(stat)
{
    console.time('update local stats')
    var stats = read_local_stats();
    stats.push(stat)
    save_local_stats(stats);
    console.timeEnd('update local stats')
    return stats
}



function get_session_stats(session_id)
{
    console.time('local stats read');
    var stats = read_local_stats()
    console.timeEnd('local stats read');
    return stats.filter((x)=>x.session_id==session_id)
}


function save_stat_firestore(stat)
{
    console.time('save stat to firestore');
    get_firestore_stats_collection().doc(stat.time.toString()).set(stat)
    .then(function(docRef) {
        console.timeEnd('save stat to firestore');
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

function save_highscore_firestore(game_key, game_score, user_name)
{
    console.log(`save score [${game_score}] for game [${game_key}] for user [${user_name}]`);
    var data = {[user_name]: game_score}
    return get_firestore_leaderboard_ref(game_key).set(
        {[user_name]: game_score},
        {merge:true})
    .then(function(docRef) {
        console.log('score saved');
    })
    .catch(function(error) {
        console.error("Error updating document: ", error);
    });
}


function read_stat_firestore()
{
    console.time('retrieving data from firestore');
    return get_firestore_stats_collection().get().then( function(querySnapshot) {
        if (querySnapshot.empty)
        {
            console.timeEnd('retrieving data from firestore')
            return []
        }
        const data = [];
        querySnapshot.forEach(function(doc) { data.push(doc.data())});
        console.timeEnd('retrieving data from firestore')
        console.log(`${data.length} stat read from firestore`);
        return data
        })
}

function read_stat_firebase_storage()
{
    // CORS configuration needs to be done see https://firebase.google.com/docs/storage/web/download-files
    console.time('stats firebase storage read');
    return get_firebase_stats_ref().getDownloadURL()
        .then((url)=>fetch(url))
        .then(response=>response.text())
        .then(function(text){
            data = JSON.parse(LZString.decompressFromBase64(text));
            console.log(`${data.length} stat read from firebase storage`);
            console.timeEnd('stats firebase storage read');
            return data
            })
        .catch(function(error) {
            if (error.code == 'storage/object-not-found')
            {
                console.log('no stats available');
                return [] 
            }
            console.log(error);
            console.timeEnd('stats firebase storage read');
            return []
        });
}

function write_stat_firebase_storage(stats)
{
    console.time('upload stats to remote file')
    return get_firebase_stats_ref().putString(LZString.compressToBase64(JSON.stringify(stats)))
        .then(function(snapshot) { console.timeEnd('upload stats to remote file')})
        .catch(function(error) {
            console.log(error);
            console.timeEnd('upload stats to remote file')
        });
}


async function sync_stats()
{
    console.time('sync stats')
    // read stats from local storage, cloud storage
    const local_stats = read_local_stats();

    
    const storage_stats = await read_stat_firebase_storage();
    const db_stats = await read_stat_firestore();
    var combined_stats = Array.prototype.concat(db_stats, storage_stats, local_stats);
    var stats = remove_duplicates(combined_stats)

    m = array2maparray(stats, 'session_id');

    console.log(`combined stats shrunk from ${combined_stats.length} to ${stats.length}`)
    save_local_stats(stats);
    await write_stat_firebase_storage(stats);


    var batch = FIREBASE_DB.batch();
    if (db_stats.length==0)
    {
        return stats
    }
    db_stats.forEach((stat)=> batch.delete(get_firestore_stats_collection().doc(stat.time.toString())))
    return await batch.commit().then(function(x){
            console.log(`${db_stats.length} firestore deletion done`)
            console.timeEnd('sync stats')
            return stats
            }
            )
        .catch(function(error) {
            console.log('error')
            console.log(error);
            console.timeEnd('sync stats')
            return stats

        });


}


function calculate_stats(stats)
{
    var scores =stats.map(x=>x.score);
    return {
            'time': Math.max(...stats.map(x=>x.time)),
            'median':median(scores),
            'mean': Phaser.Math.Average(scores),
            'size': stats.length
    }

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
        k=>s[k]=calculate_stats(m[k])
    )
    return s;
}

function array2maparray(array, field)
{
    const reducer = (accumulator, current_value) => 
    {
        var key = current_value[field]
        if (!(key in accumulator))
        {
            accumulator[key] = [current_value]
        }
        else
        {
            accumulator[key].push(current_value)
        }
        return accumulator

    }
   return array.reduce(reducer, {})
}

function make_sorted_sessions(stats)
{
    m = array2maparray(stats, 'session_id');
    sessions = _.chain(m)
        .mapValues((x,v) => _.assign(calculate_stats(x), {'session_id': v} ))
        .orderBy('mean','desc').value()
    sessions.forEach((x,i)=>{x['rank']=i+1})
    return sessions
}

function rank_sessions(stats, session_id)
{
    //.pickBy((value,key)=> value.length>=10)
    //sessions = make_sorted_sessions(stats)
    //rank = _.findIndex(sessions, {'key':session_id})
    var reg=extract_regex_from_session_id(session_id);
    console.assert(reg.test(session_id))
    var sessions = _.chain(stats).filter((x)=>reg.test(x.session_id)).thru(make_sorted_sessions).value()
    rank = _.findIndex(sessions, {'session_id':session_id})
    return {rank:rank, sessions:sessions}
}


const t2d = x => new Date(x.getFullYear(), x.getMonth(), x.getDate())
const TODAY = t2d(new Date(Date.now()));
var TIME_FILTERS; 

function update_time_filters(current_session_id)
{
    var stats = read_local_stats();
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
    textureManager.remove('snap');
    return {
        intersection:intersection, 
        union:union,
        score:score,
    };
}

function create_random_scenes_sequence(repetitions_per_game, scenes)
{
    var random_scenes = [];
    function add(name)
    {
        for(i=0;i<repetitions_per_game;i++)
        {
            random_scenes.push(name)
        }
    }
    scenes.forEach(add)
    random_scenes = Phaser.Math.RND.shuffle(random_scenes);
    //console.log('random scenes ', random_scenes)
    return random_scenes;
}


var CODES = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE', 'ZERO'];
var CODE2GAME = {}
// CONFIGS.forEach(function(x,index) { CODE2GAME[Phaser.Input.Keyboard.KeyCodes[CODES[index]]]=x})


function make_status_string()
{
    stat_strings = SESSION_MANAGER.session_state_string
    console.log(stat_strings)
    return stat_strings;
}

function make_scene_setup(scene)
{
    console.time('scene setup')
    GRAPHICS = scene.add.graphics();

    scene.center_text = scene.add.text(CENTER.x, CENTER.y)
        .setFontSize(DEFAULT_FONT_SIZE)
        .setFontFamily(FONT_FAMILY)
        .setAlign('center')
        .setOrigin(0.5,0)

    scene.center_bottom_text = scene.add.text(CENTER_BOTTOM.x, CENTER_BOTTOM.y)
        .setFontSize(DEFAULT_FONT_SIZE)
        .setFontFamily(FONT_FAMILY)
        .setAlign('center')
        .setOrigin(0.5,1.0)

    scene.center_top_text = scene.add.text(CENTER_TOP.x, CENTER_TOP.y)
        .setFontSize(DEFAULT_FONT_SIZE)
        .setFontFamily(FONT_FAMILY)
        .setAlign('center')
        .setOrigin(0.5,0)


    scene.stats_text = scene.add.text(
        STATS_ORIGIN.x, 
        STATS_ORIGIN.y).setFontSize(DEFAULT_FONT_SIZE).setFontFamily(FONT_FAMILY)

    scene.score_text = scene.add.text(
        SCORE_ORIGIN.x, SCORE_ORIGIN.y, '')
        .setFontSize(64)
        .setFontStyle('bold')
        .setFontFamily(FONT_FAMILY);

    //scene.countdown_text = scene.add.text(
    //    STATS_ORIGIN.x+100, STATS_ORIGIN.y, '')
    //    .setFontSize(64)
    //    .setFontStyle('bold')
    //    .setFontFamily(FONT_FAMILY);


    scene.list_text = scene.add.text(
        PLAYER_ORIGIN.x, PLAYER_ORIGIN.y, '')
        .setFontSize(DEFAULT_FONT_SIZE)
        .setFontStyle('bold')
        .setFontFamily(FONT_FAMILY);


    scene.help_text = scene.add.text(
        HELP_ORIGIN.x, 
        HELP_ORIGIN.y).setFontSize(DEFAULT_FONT_SIZE).setFontFamily(FONT_FAMILY)
    scene.input.keyboard.on('keydown_ESC', function (event)
    {
        this.scene.start('Menu');

    }, scene);
    console.timeEnd('scene setup')


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
        //particle code
        //this.load.image('spark', 'assets/particles/blue.png');
        this.load.html('nameform', 'assets/nameform.html');
    }

    create(config)
    {
        make_scene_setup(this);
        /*
        var particles = this.add.particles('spark');

        var emitter = particles.createEmitter();

        emitter.setPosition(400, 300);
        emitter.setSpeed(140);
        emitter.setBlendMode(Phaser.BlendModes.ADD);
        */

        var scene = this;
        scene.center_text.setText('LOGGING IN \n')
        const update_progress = ()=>scene.center_text.setText(scene.center_text.text + '.')
        var logging_timer = scene.time.addEvent({
            delay: 1000,                // ms
            callback: update_progress ,
            callbackScope: scene,
            repeat: 1000 
        });


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
                FIREBASE_DB = firebase.firestore();
                scene.center_text.setText(`LOADING USER INFO\n`)
                scene.center_bottom_text.setText(`logged in as ${get_display_name()}`)

                // see https://eloquentjavascript.net/2nd_edition/18_forms.html
                // also lifted from public/src/game objects/dom element/input test.js in phaser3 examples
                function read_input_name(user_info)
                {
                    console.log('this is the user info we have',user_info);
                    return new Promise(function(succeed, fail)
                    {
                        var element = scene.add.dom(200, 100).createFromCache('nameform');
                        element.addListener('click');
                        element.on('click', function (event) {

                            if (event.target.name === 'playButton')
                            {
                                var inputText = this.getChildByName('nameField');
                                //  Have they entered anything?
                                if (inputText.value !== '')
                                {
                                    //  Turn off the click events
                                    this.removeListener('click');
                                    //  Hide the login element
                                    this.setVisible(false);
                                    //  Populate the text with whatever they typed in
                                    user_info.name = inputText.value; 
                                    succeed(user_info);
                                }
                                else
                                {
                                    //  Flash the prompt
                                    this.scene.tweens.add({
                                        targets: this.scene.center_text,
                                        alpha: 0.2,
                                        duration: 250,
                                        ease: 'Power3',
                                        yoyo: true
                                    });
                                            }
                            }

                        });                       

                    }
                        
                    );

                };

                function update_user_info(user_info)
                {
                    return get_firestore_user_ref()
                    .set(user_info,{merge: true})
                        .then((x)=>user_info)
                        .catch(function(error) {
                            // The document probably doesn't exist.
                            console.error("Error updating user info: ", error);
                        });

                }

                var user_info = get_user_info().then(function(x)
                {
                    if('name' in x)
                    {
                        return x
                    }
                    return read_input_name(x).then(update_user_info)
                })
                var stats = sync_stats()
                var leaderboards = get_leader_boards(get_level_names()).then((x)=>{LEADERBOARDS=x})
                get_firestore_leaderboards(get_level_names()).onSnapshot(()=>{
                    console.log('updating leaderboards')
                    get_leader_boards(get_level_names()).then((x)=>{LEADERBOARDS=x})
                    })



                Promise.all([user_info, stats, leaderboards]).then(function(objects)
                {
                    var user_info = objects[0] 
                    var stats = objects[1]

                    USER_INFO = user_info
                    scene.center_bottom_text.setText(`Hello ${user_info.name}!`)
                    scene.center_top_text.setText(`${stats.length} exercises loaded`)
                    logging_timer.remove()
                    scene.center_text.setText('PRESS SPACE TO START')
                    scene.tweens.add({
                        targets: scene.center_text,
                        alpha: 0.2,
                        duration: 700,
                        yoyo: true,
                        repeat:-1
                    });

                    scene.input.keyboard.on('keydown_SPACE', function (event)
                    {
                        scene.scene.start('Menu')

                    }, scene);
                }
                )

            } else {
                scene.center_text.setText('REDIRECTING TO SIGN IN PAGE\n');
                window.location.href="index_with_authentication.html";
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
        make_scene_setup(this);
        //this.stats_text.setText('WE ARE DONE\n[recap of performance]')
        //this.stats_text.setText(make_status_string());
        var all_stats=read_local_stats()
        var session_id = SESSION_MANAGER._session_id
        var current_stats = all_stats.filter((x)=> x.session_id == session_id)
        this.list_text.setText('Saving stats ..')
        var scene = this;
        
        var result = rank_sessions(all_stats, session_id);
        const MAX_SCORE=30;
        
        // list personal scores
        const make_personal_leaderboard = ()=>
        {
            scene.add.text()
            .setFontSize(DEFAULT_FONT_SIZE)
            .setText(`  PERSONAL TOP ${MAX_SCORE}`)
            _.take(result.sessions,MAX_SCORE).map((x,i)=>{
                scene.add.text()
                .setFontSize(DEFAULT_FONT_SIZE)
                .setPosition(SCORE_ORIGIN.x, SCORE_ORIGIN.y+(i+1)*DEFAULT_FONT_SIZE)
                .setColor( ((i==result.rank) ? RED_TEXT:WHITE_TEXT))
                .setText(
                    [
                    `${x.rank.toFixed(0)}.  `.padStart(6),
                    `${(x.mean*100).toFixed(2)}`.padEnd(6), 
                    moment(new Date(x.time)).fromNow()].join(''))
            })
        }
        make_personal_leaderboard()


        var key = extract_session_key(session_id);

    
        // display best score at the bottom
        get_firestore_leaderboard_ref(key).get().then( function(querySnapshot) {
            var scores = parse_leaderboard_data(querySnapshot)
            var best = _.chain(scores).orderBy('score','desc').first().value()||{score:0};
            var own = _.chain(scores).filter((x)=>x.uid==FIREBASE_USER.uid).first().value()||{score:0};
            if(best.score>0)
            {
                scene.center_bottom_text.setText(`Best score is ${(best.score*100).toFixed(2)} from ${best.user}`)
            }
            })
        .catch(function(error) {
            console.error("Error adding document: ", error);
        });

        //list scores of the session
        var session_stat = result.sessions[result.rank]
        var list_strings = current_stats.map(x=> `${x.name.padEnd(10)} ${(100*x.score).toFixed(2)}`)
        list_strings.unshift(`Session Score   \n`)
        list_strings.push(   `----------------`)
        list_strings.push(`${'Average'.padEnd(10)} ${(100*session_stat.mean).toFixed(1)}`)
        var list_text = list_strings.join('\n');
        this.help_text.setText(list_text)
        
        //if it's our best we save it 
        var save_highscore;
        if(result.rank==0)
        {
            console.log('saving highscore to leaderboard');
            save_highscore = save_highscore_firestore(
                extract_session_key(session_id), 
                JSON.stringify({score:session_stat.mean, time:session_stat.time, user:USER_INFO.name}),
                FIREBASE_USER.uid);
        }
        else
        {
            save_highscore = Promise.resolve(undefined)
        }

        
        var scene = this;

        Promise.all([save_highscore, sync_stats()]).then(function(objects)
        {
            var stats = objects[1]
            scene.list_text.setText(`We are done. ${stats.length} exercises saved.\nHit space bar to continue`)
            scene.input.keyboard.on('keydown_SPACE', function (event)

            {
                this.scene.start(SESSION_MANAGER.next_scene_name());

            }, scene);

        })


    }
    update ()
    {
    }
}
const get_level_names= ()=>{
    var level_names = BASE_LEVEL_NAMES;
    if (FIREBASE_USER.uid=="WrZSvoWRIZTHOoPZ5tB4Z2xgztY2")
    {
        level_names = level_names.concat('DEV')
    }
    return level_names
}

class Menu extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    create(config)
    {
        make_scene_setup(this);
        var scene = this;
        var select_text = scene.add.text().setPosition(CENTER_TOP.x, CENTER_TOP.y).setText().setFontSize(DEFAULT_FONT_SIZE).setOrigin(0.5,0).setText('SELECT EXERCISE\n')
        scene.tweens.add({
            targets: select_text,
            alpha: 0.2,
            duration: 700,
            yoyo: true,
            repeat:-1
        });

        var level_names = get_level_names()
        var LIST_HEIGHT = DEFAULT_FONT_SIZE*(level_names.length+5)
        var reference_frame = new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH)
        var description_text = scene.add.text(CENTER.x, LIST_HEIGHT + HEIGHT/2+DEFAULT_FONT_SIZE)
            .setFontSize(DEFAULT_FONT_SIZE)
            .setFontFamily(FONT_FAMILY)
            .setAlign('center')
            .setOrigin(0.5,1.0)


        const start_level = (level)=>
        {
            SESSION_MANAGER = new SessionManager(level);
            scene.scene.start(SESSION_MANAGER.next_scene_name());
        }

        scene.input.keyboard.on('keydown_SPACE', function (event)
        {
            if (PREV_LEVEL != undefined)
            {
                start_level(PREV_LEVEL)
            }

        }, scene);

        level_names.map(name=>LEVELS[name]).map((level,i) => {
            var text = scene.add.text()
            .setPosition(CENTER_TOP.x, CENTER_TOP.y+(i+2)*DEFAULT_FONT_SIZE)
            .setText(`${level.name}`)
            .setOrigin(0.5,0)
            .setInteractive()
            .on('pointerdown', function(pointer, localX, localY, event){ start_level(level) })


            //could chain this portion because I could not refer the text in the callback
            const make_sample= (level)=>
            {
                const make_miniature= ()=>
                {
                    GRAPHICS.clear()
                    GRAPHICS.translateCanvas(CENTER.x-(LENGTH*0.5), LIST_HEIGHT);
                    GRAPHICS.scaleCanvas(1,1);
                    const name = level.make_scenes_fun()[0];
                    const config = get_config_by_name(name);
                    config.draw_reference(config.make_data())
                    GRAPHICS.lineStyle(1, WHITE, 0.2);
                    GRAPHICS.strokeRectShape(reference_frame);
                    description_text.setText(level.description||'')
                };
                make_miniature()
            }
            text
                .on('pointerover',(pointer, localX, localY, event)=> {
                    make_sample(level);text.setColor(RED_TEXT)
                    var leaderboard = LEADERBOARDS[level.key]||[];
                    scene.center_bottom_text.setAlign('left').setText(
                        'LEADERBOARD\n' +
                        '-----------\n'  +
                        leaderboard.map((x,i)=>`${i+1}. ${(x.score*100).toFixed(2)} ${x.user}`).join('\n'))
                    })
                .on('pointerout',(pointer, localX, localY, event)=> {text.setColor(WHITE_TEXT)})
            })
    }

    update ()
    {
    }
}

function get_display_name()
{
    if(FIREBASE_USER.isAnonymous)
    {
        return 'anonymous'
    }
    var provider_id = FIREBASE_USER.providerData[0].providerId;

    providerId2name = {
        'google.com' : FIREBASE_USER.email,
        'github.com': FIREBASE_USER.providerData[0].email,

    }
    var display_name = providerId2name[provider_id] || FIREBASE_USER.email;
    return `${display_name} [${provider_id}]`;

}



var SESSION_MANAGER;
var PREV_LEVEL;


// let's start
GAME.scene.add('Start', Start, true)
GAME.scene.add('Menu', Menu, false)
GAME.scene.add('End', End, false)
//GAME.canvas.oncontextmenu = (e) => e.preventDefault()
