let repeat = (x,n) => Array.from(Array(n).keys()).map(i=>x)
// levels

stop_if_too_bad = function(stats)
{
    var has_lost = _.some(stats, (x)=> x.score<0.8)
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

LEVELS =
{
    'DEV':
    {
        name: 'Dev',
        key: 'dev',
        make_scenes_fun: ()=>create_random_scenes_sequence(12 ,['QuadSpaceWCorr']),
        evaluate_loss_condition:  never
    },

    'TRAINING':
    {
        name: 'Training',
        key: 'training5x3',
        make_scenes_fun: ()=>create_random_scenes_sequence(3 ,['Proportion','Triangle', 'Quad', 'Square', 'Circle']),
        evaluate_loss_condition:  never
    },
    'QUAD_WO_FRAME_W_COR':{
        name: 'Quad Without Frame With Correction x 12',
        make_scenes_fun: ()=> repeat('QuadSpaceWCorr',12),
        key: 'quad_wo_frame_w_corrx12',
        evaluate_loss_condition:  never
        //evaluate_loss_condition: stop_if_too_bad
    },

    'QUAD_WO_FRAME':{
        name: 'Quad Without Frame x 12',
        make_scenes_fun: ()=> repeat('QuadSpace',12),
        key: 'quad_wo_framex12',
        evaluate_loss_condition:  never
        //evaluate_loss_condition: stop_if_too_bad
    },

    'QUAD':{
        name: 'Quad x 12',
        make_scenes_fun: ()=> repeat('Quad',12),
        key: 'quadx12',
        evaluate_loss_condition:  never
        //evaluate_loss_condition: stop_if_too_bad
    },
    'QUAD_HARD':{
        name: 'Quad Hard x 12',
        make_scenes_fun: ()=> repeat('QuadHard',12),
        key: 'quad_hardx12',
        evaluate_loss_condition:  never
        //evaluate_loss_condition: stop_if_too_bad
    },

    'PROPORTION':{
        name: 'Proportion x 12',
        make_scenes_fun: ()=> repeat('Proportion',12),
        key: 'proportionx12',
        evaluate_loss_condition: stop_if_too_bad
    },

    'TRIANGLE':{
        name: 'Triangle x 12',
        make_scenes_fun: ()=> repeat('Triangle',12),
        key: 'trianglex12',
        evaluate_loss_condition: stop_if_too_bad
    },

    'POLYGON':{
        name: 'Polygon x 6',
        make_scenes_fun: ()=> repeat('Blob',6),
        key: 'polygonx6',
        evaluate_loss_condition: stop_if_too_bad
    },

    'CIRCLE':{
        name: 'Circle x 12',
        make_scenes_fun: ()=> repeat('Circle',12),
        key: 'circlex12',
        evaluate_loss_condition: stop_if_too_bad
    },
    'SQUARE':{
        name: 'Square x 12',
        make_scenes_fun: ()=> repeat('Square',12),
        key: 'squarex12',
        evaluate_loss_condition: stop_if_too_bad 
    },

}




const CONFIGS = [
    triangle_config, blob_config, circle_config, square_config, 
    proportion_config, free_config, quad_config, quad_config_hard, quad_space_config, quad_space_config_w_corr]
const GAME_NAMES  = CONFIGS.map(x=>x.name).concat(['All']);

var FIREBASE_APP;
var FIREBASE_USER;
var FIREBASE_DB;

var USER_INFO;


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
var PLAYER_ORIGIN = {x:REFERENCE_ORIGIN.x+LENGTH, y:REFERENCE_ORIGIN.y+LENGTH};
var STATS_ORIGIN = {x:REFERENCE_ORIGIN.x, y:PLAYER_ORIGIN.y+BORDER};
var HELP_ORIGIN = {x:PLAYER_ORIGIN.x, y:REFERENCE_ORIGIN.y};
var PLAYER_NAME_ORIGIN = {x:REFERENCE_ORIGIN.x, y:2*LENGTH-BORDER};
var SCORE_ORIGIN =  {x:REFERENCE_ORIGIN.x, y:BORDER};


const make_session_id = (key)=>`${Date.now()}__${key}`

function extract_regex_from_session_id(session_id)
{
    var x = session_id.split('__')
    if (x.length==1)
        return /\d$/
    return new RegExp(`__${x[1]}`)

}

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


const get_firestore_user_ref=()=>FIREBASE_DB.collection('users').doc(FIREBASE_USER.uid)
const get_firestore_stats_collection=()=>get_firestore_user_ref().collection('stats')
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
        console.log(`got in wit ${x.data()}`)
        console.log(x.data())
        data = x.data()||{}
        return data;
    })
}

function read_local_stats()
{
    var data = JSON.parse(localStorage.getItem(FIREBASE_USER.uid))||[];
    console.log(`${data.length} stat read from local storage`);
    return data;

}

function get_session_stats(session_id)
{
    console.time('local stats read');
    var stats = read_local_stats()
    console.timeEnd('local stats read');
    return stats.filter((x)=>x.session_id==session_id)
}

function save_local_stats(stats)
{
    console.log(`saving ${stats.length} points to local store`)
    localStorage.setItem(FIREBASE_USER.uid, JSON.stringify(stats));
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
    //var stats_pairs = _.partition(stats, (x)=>_.isInteger(x.session_id))
    //var stats_ = stats_pairs[0].map((x)=>_.assign(x,{'session_id':`${x.session_id}__training`}))
    //stats = stats_pairs[1].concat(stats_)

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

function update_local_stats(stat)
{
    var stats = read_local_stats();
    stats.push(stat)
    save_local_stats(stats);
    return stats
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
    console.log('random scenes ', random_scenes)
    return random_scenes;
}


var CODES = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE', 'ZERO'];
var CODE2GAME = {}
// CONFIGS.forEach(function(x,index) { CODE2GAME[Phaser.Input.Keyboard.KeyCodes[CODES[index]]]=x})


function make_status_string()
{
    var stats = read_local_stats();
    var historical_stats = calculate_historical_performance(stats);
    var stat_strings = make_stats_strings(historical_stats);
    stat_strings.push(SESSION_MANAGER.session_state_string)
    return stat_strings;
}

function make_scene_setup(scene)
{
    console.time('scene setup')
    GRAPHICS = scene.add.graphics();

    scene.stats_text = scene.add.text(
        STATS_ORIGIN.x, 
        STATS_ORIGIN.y).setFontSize(16).setFontFamily(FONT_FAMILY)

    scene.score_text = scene.add.text(
        SCORE_ORIGIN.x, SCORE_ORIGIN.y, '')
        .setFontSize(64)
        .setFontStyle('bold')
        .setFontFamily(FONT_FAMILY);

    scene.list_text = scene.add.text(
        PLAYER_ORIGIN.x, PLAYER_ORIGIN.y, '')
        .setFontSize(DEFAULT_FONT_SIZE)
        .setFontStyle('bold')
        .setFontFamily(FONT_FAMILY);

    scene.name_text = scene.add.text(
        PLAYER_NAME_ORIGIN.x, 
        PLAYER_NAME_ORIGIN.y).setFontSize(DEFAULT_FONT_SIZE).setFontFamily(FONT_FAMILY);

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
        this.load.html('nameform', 'assets/nameform.html');
    }

    create(config)
    {
        make_scene_setup(this);
        this.stats_text.setText('LOGGING IN ...')

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
                FIREBASE_DB = firebase.firestore();
                scene.stats_text.setText(`LOGGED IN AS ${get_display_name()}`)

                // see https://eloquentjavascript.net/2nd_edition/18_forms.html
                // also lifted from public/src/game objects/dom element/input test.js in phaser3 examples
                function read_input_name(user_info)
                {
                    console.log(user_info);
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
                                        targets: this.scene.stats_text,
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

                Promise.all([user_info, stats]).then(function(objects)
                {
                    var user_info = objects[0] 
                    var stats = objects[1]
                    USER_INFO = user_info
                    scene.name_text.setText(`Hello ${user_info.name}!`)
                    scene.help_text.setText(`${stats.length} exercises loaded`)
                    scene.stats_text.setText('PRESS SPACE TO START')
                    scene.tweens.add({
                        targets: scene.stats_text,
                        alpha: 0.2,
                        duration: 700,
                        //ease: 'Power3',
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
                scene.stats_text.setText('LOGGED OUT. PLEASE LOG IN');
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
        make_scene_setup(this);
        //this.stats_text.setText('WE ARE DONE\n[recap of performance]')
        this.stats_text.setText(make_status_string());
        var all_stats=read_local_stats()
        var session_id = SESSION_MANAGER._session_id
        var current_stats = all_stats.filter((x)=> x.session_id == session_id)
        //console.log(current_stats)
        this.list_text.setText('Saving stats ..')
        
        var result = rank_sessions(all_stats, session_id);
        var highscore_text = _.take(result.sessions,10).map(x=> [
            `${x.rank.toFixed(0)}.  `.padStart(4),
            `${(x.mean*100).toFixed(1)}`.padEnd(6), 
            moment(new Date(x.time)).fromNow()
        ].join('')).join('\n')
        this.score_text.setFontSize(DEFAULT_FONT_SIZE).setText(highscore_text)

        var session_stat = result.sessions[result.rank]
        var list_strings = current_stats.map(x=> `${x.name.padEnd(10)} ${(100*x.score).toFixed(1)}`)
        list_strings.push(`--------------`)
        list_strings.push(`${'Average'.padEnd(10)} ${(100*session_stat.mean).toFixed(1)}`)
        var list_text = list_strings.join('\n');
        this.help_text.setText(list_text)
        
        //var =summary = calculate_stats_summary(read_local_stats().filter((x)=> x.session_id == SESSION_MANAGER._session_id))
        var scene = this;
        sync_stats().then(function(stats)
        {
            scene.list_text.setText(`We are done. ${stats.length} exercises saved. Hit space bar to continue`)
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

class Menu extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    create(config)
    {
        make_scene_setup(this);
        var scene = this;
        const M = Phaser.Input.Keyboard.KeyCodes;
        var KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO']
        var key2level = {}
        Object.keys(LEVELS).forEach(
            (x,index)=>{key2level[KEY_NAMES[index]]=x})
        var code2level = {}
        Object.entries(key2level).map(function(x) {code2level[M[x[0]]]=x[1]})
        var text = Object.entries(key2level).map((x,i) => `${(i+1).toString().padStart(2)}. ${LEVELS[x[1]].name}`).join('\n')
        this.stats_text.setText( `Select one level\n${text}`);

        scene.input.keyboard.on('keydown', function (event)
        {
            if(event.keyCode in code2level)
            {
                SESSION_MANAGER = new SessionManager(LEVELS[code2level[event.keyCode]])
                scene.scene.start(SESSION_MANAGER.next_scene_name());
            }

        }, scene);

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


// let's start
GAME.scene.add('Start', Start, true)
GAME.scene.add('Menu', Menu, false)
GAME.scene.add('End', End, false)
//GAME.canvas.oncontextmenu = (e) => e.preventDefault()
