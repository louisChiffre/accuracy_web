function make_help_text(control_help_instructions, space_bar_action)
{
    var lines = control_help_instructions.concat([`Hit Space Bar to ${space_bar_action}`]).map((x)=>'  * ' + x)
    return ['ORIENTATION: Reproduce white figure below'].concat(lines).join('\n')
}

function make_random_square(min_height, max_height, min_width, max_width)
{
    console.assert(min_height <= max_height)
    console.assert(min_width <= max_width)
    var height = Phaser.Math.Between(min_height, max_height);  
    var width =  Phaser.Math.Between(min_width, max_height);
    return new Phaser.Geom.Rectangle(0, 0, width, height);
}

function make_random_triangle(n_rotation)
{
    var x = Phaser.Math.Between(0, LENGTH);  
    var y =  Phaser.Math.Between(100, LENGTH);
    var p = rotate_points([0, 0, LENGTH, 0, x, y], n_rotation);
    return new Phaser.Geom.Triangle(p[0], p[1], p[2], p[3], p[4], p[5]);
}


function make_random_circle(LENGTH)
{
    return new Phaser.Geom.Circle(LENGTH*0.5, LENGTH*0.5, Phaser.Math.Between(50, 0.4*LENGTH));
}

function make_random_base(H)
{
    var points =[ 
        H/2, H, //bottom left corner
        0,   H,   //bottom right corner
        0,   0,   //top left corner
        H/2, 0]  //top right corner]
    return points;
}


function rotate_points(points, n_rotation)
{
    var chunk = (arr, size) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );

    var angle = Phaser.Math.PI2/4 * n_rotation
    return chunk(points,2).map(
        x=>Phaser.Math.RotateAround(new Phaser.Geom.Point(x[0],x[1]),LENGTH/2,LENGTH/2,angle)).map(x=> [x.x,x.y]).reduce((a, b) => [...a, ...b])
}


function make_random_polygon(length)
{
    var H = Phaser.Math.Between(0.75*length, 0.9*length); 
    var points = make_random_base(H);
    var n_points = 3
    var x = new Array(n_points);
    var y = new Array(n_points);
    for (i = 0; i < x.length; i++) { 
        x[i] = Phaser.Math.Between(0.5*H, H);
        y[i] = Phaser.Math.Between(0.25*H, 0.75*H);
    }
    y.sort((a, b) => a - b)
    for (i = 0; i < x.length; i++) 
    {
        points.push(x[i]);
        points.push(y[i]);

    }
    points.push(points[0]);
    points.push(points[1]);
    return points;

}
function make_random_shape()
{
    var length=LENGTH;
    var H = Phaser.Math.Between(0.75*length, 0.9*length); 
    var points = make_random_base(H);
    var n_points = 3
    var x = new Array(n_points);
    var y = new Array(n_points);
    for (i = 0; i < x.length; i++) { 
        x[i] = Phaser.Math.Between(0.5*H, H);
        y[i] = Phaser.Math.Between(0.25*H, 0.75*H);
    }
    y.sort((a, b) => a - b)
    for (i = 0; i < x.length; i++) 
    {
        points.push(x[i]);
        points.push(y[i]);

    }
    points.push(points[0]);
    points.push(points[1]);
    return points;

}

function get_player_relative_position(pointer)
{
    return new Phaser.Geom.Point(pointer.x - PLAYER_ORIGIN.x, pointer.y - PLAYER_ORIGIN.y);
}

function draw_player_frame(data)
{
    GRAPHICS.lineStyle(1, WHITE, 0.2);
    GRAPHICS.strokeRectShape(data.player.square);

}

function draw_polygon_reference(data)
{
    draw_player_frame(data)
    GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
    GRAPHICS.strokePoints(data.reference.points);
}

function draw_polygon_player_wo_frame(data)
{
    if(has_point(data))
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokePoints(data.player.polygon.points);
    }
}

function draw_polygon_player(data)
{
    draw_player_frame(data)
    if(has_point(data))
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokePoints(data.player.polygon.points);
    }
}


function draw_polygon_player_centered(data)
{
    draw_player_frame(data)

    if(has_point(data))
    {
        var player_points = data.player.polygon.points
        var reference_points = data.reference.points
        var points = align_player_points(player_points, reference_points)

        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokePoints(points);

    }
}



function draw_polygon_evaluation(data)
{
    GRAPHICS.fillStyle(GREEN, 0.3);
    GRAPHICS.fillPoints(data.reference.points);

    if(has_point(data))
    {
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillPoints(data.player.polygon.points);
    }
}


function align_player_points(player_points, reference_points)
{
    var distance = (p) => p.x**2 + p.y**2
    var pl = _.minBy(player_points, distance)
    var ref = _.minBy(reference_points, distance) 

    var dx = ref.x - pl.x
    var dy = ref.y - pl.y
    return player_points.map((p)=> new Phaser.Geom.Point(p.x + dx, p.y+dy));
}



// not used be cause it average out difference
function align_player_points_centroid(player_points, reference_points)
{
    var player_x = Phaser.Math.Average(player_points.slice(0,4).map((x)=>x.x)) 
    var player_y = Phaser.Math.Average(player_points.slice(0,4).map((x)=>x.y))

    var ref_x = Phaser.Math.Average(reference_points.slice(0,4).map((x)=>x.x)) 
    var ref_y = Phaser.Math.Average(reference_points.slice(0,4).map((x)=>x.y)) 

    var dx = ref_x - player_x
    var dy = ref_y - player_y
    return player_points.map((p)=> new Phaser.Geom.Point(p.x + dx, p.y+dy));
}


function draw_polygon_evaluation_centered(data)
{
    GRAPHICS.fillStyle(GREEN, 0.3);
    GRAPHICS.fillPoints(data.reference.points);

    if(has_point(data))
    {
        var player_points = data.player.polygon.points
        var reference_points = data.reference.points
        var points = align_player_points(player_points, reference_points)

        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillPoints(points);
    }
}

function process_cursors_input(cursors, data)
{
    // keyboard arrow key callback

}

function has_point(data)
{
    return data.player.polygon.points.length > 0
}

function is_polygon_closed(data)
{
    if (has_point(data))
    {
        return data.player.polygon.points[data.player.pointer] == data.player.polygon.points[0];
    }
    return false

}

function polygon_pointermove(pointer, data)
{
    if( (data.player.done==false) & has_point(data) )
    {
        var position =get_player_relative_position(pointer);
        var dist = Phaser.Math.Distance.Between(
            position.x,
            position.y,
            data.player.polygon.points[0].x,
            data.player.polygon.points[0].y,
            );
        if(dist < 20)
        {
            data.player.polygon.points[data.player.pointer] = data.player.polygon.points[0];
        }
        else
        {
            data.player.polygon.points[data.player.pointer] = get_player_relative_position(pointer);
        }
    }

}

function polygon_pointerdown(pointer, data, scene)
{
    if (pointer.buttons==1) //4 is for the middle button
    {
        //check if we didnt closed the polygon
        if(data.player.done==false)
        {
            data.player.done = is_polygon_closed(data)

            if(data.player.done)
            {
                data.player.polygon.points.push(data.player.polygon.points[0]);
                data.player.pointer = 1 ;
                data.player.done = true;
                // we make the necessary to be able to edit the points
                for(var point of data.player.polygon.points)
                {
                    var circle_real =  scene.add.circle(point.x + PLAYER_ORIGIN.x, point.y+ PLAYER_ORIGIN.y, 10)
                    circle_real._point = point;
                    circle_real.setInteractive();
                    scene.input.setDraggable(circle_real);

                }

            } else
            {
                var position = get_player_relative_position(pointer);
                data.player.polygon.points.push(position);
                data.player.pointer = data.player.pointer + 1 ;
            }
        }
    }

}
 function polygon_drag(pointer, gameObject, dragX, dragY)
{
    gameObject.x = dragX;
    gameObject.y = dragY;
    gameObject._point.x = dragX - PLAYER_ORIGIN.x;
    gameObject._point.y = dragY - PLAYER_ORIGIN.y;

}
const polygon_instructions_without_editing =  [
        'Use mouse to control last point', 
        'Left-click to freeze current point', 
        'Click on the first point to close polygon']

const polygon_instructions = polygon_instructions_without_editing.concat(['Once closed, single point can be dragged and dropped by holding left button'])




var blob_config = {
    name: 'Blob',
    eval_name: 'EvalBlob',
    control_help_instructions:polygon_instructions ,
    make_data: function(cache)
    {
        var n_rotation = Phaser.Math.Between(0,3);
        var reference = new Phaser.Geom.Polygon(rotate_points(make_random_polygon(LENGTH),n_rotation));
        var player = {
            polygon:new Phaser.Geom.Polygon(rotate_points([0,0,100,0],n_rotation)),
            square: new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH),
            pointer: 1,
            done: false};

        return {
            'reference' :reference,
            player :player
        };
    },
    draw_reference: draw_polygon_reference ,
    draw_player: draw_polygon_player ,
    draw_evaluation: draw_polygon_evaluation,
    process_cursors_input: process_cursors_input ,
    pointermove: polygon_pointermove,
    pointerdown: polygon_pointerdown,
    drag: polygon_drag,
    inputs: {},
}

var quad_config = {
    name: 'Quad',
    eval_name: 'EvalQuad',
    make_data: function(cache)
    {
        const f = Phaser.Math.Between
        var L = LENGTH;
        var L2 = LENGTH/2;
        var points = [
            f(0,L2), f(0,L2),
            f(L2,L), f(0,L2),
            f(L2,L), f(L2,L),
            f(0,L2), f(L2,L),
        ];
        points =points.concat(points.slice(0,2));
        var reference = new Phaser.Geom.Polygon(points);
        var player = {
            polygon:new Phaser.Geom.Polygon([]),
            square: new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH),
            pointer: 0,
            done: false};

        return {
            reference :reference,
            player :player
        };
    },
}

var quad_config = {...blob_config, ...quad_config}

// we disable the ability to drag and drop points to create a new exercise
var quad_config_hard = {...blob_config, ...quad_config}
delete quad_config_hard.drag
quad_config_hard.name = 'QuadHard'
quad_config_hard.eval_name = 'EvalQuadHard'
quad_config_hard.control_help_instructions = polygon_instructions_without_editing


var quad_space_config = {
    name: 'QuadSpace',
    eval_name: 'EvalQuadSpace',
    draw_evaluation: draw_polygon_evaluation_centered,
    draw_player_evaluation: draw_polygon_player_centered,
    draw_player: draw_polygon_player_wo_frame 
}
quad_space_config = {...quad_config_hard, ...quad_space_config}

var quad_space_config_w_corr = {
    name: 'QuadSpaceWCorr',
    eval_name: 'EvalQuadSpaceWCorr',
    drag : polygon_drag
}
quad_space_config_w_corr = {...quad_space_config, ...quad_space_config_w_corr}


var free_config = {
    name: 'Free',
    eval_name: 'EvalFree',
    make_data: function(cache)
    {
        var points = cache.json.get('example').points;
        var reference = new Phaser.Geom.Polygon(points);
        var player = {
            polygon:new Phaser.Geom.Polygon([]),
            square: new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH),
            pointer: 0,
            done: false};

        return {
            reference :reference,
            player :player
        };
    },
    draw_reference: draw_polygon_reference ,
    draw_player: draw_polygon_player ,
    draw_evaluation: draw_polygon_evaluation,
    process_cursors_input: process_cursors_input ,
    pointermove: polygon_pointermove,
    pointerdown: polygon_pointerdown,
    drag: polygon_drag,
    inputs: {},
    filepack: 'assets/pack_free',
}

var circle_config = {
    inputs: {},
    name: 'Circle',
    eval_name: 'EvalCircle',
    control_help_instructions: ['Use mouse pointer to control radius of circle'],
    make_reference: function(){
        return make_random_circle(LENGTH);
    },
    make_data: function(){
        return {
            player: make_random_circle(LENGTH),
            reference: make_random_circle(LENGTH),
        }
    },
    draw_reference: function(data)
    {
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeCircleShape(data.reference);
    },
    draw_player: function(data)
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokeCircleShape(data.player);
    },

    draw_evaluation: function(data)
    {
        GRAPHICS.fillStyle(GREEN, 0.3);
        GRAPHICS.fillCircleShape(data.reference);
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillCircleShape(data.player);
    },
    process_cursors_input: function(cursors, data)
    {
        if (cursors.shift.isDown)
            SPEED=5;
        else
            SPEED=0.5; 
        if (cursors.up.isDown)    data.player.radius +=   -SPEED
        if (cursors.down.isDown)  data.player.radius +=    SPEED
        if (cursors.left.isDown)  data.player.radius += -SPEED
        if (cursors.right.isDown) data.player.radius +=  SPEED

    },
    pointermove: function(pointer, data)
    {
        var position =get_player_relative_position(pointer);
        var distance = Phaser.Math.Distance.Between(position.x, position.y, LENGTH/2.0, LENGTH/2.0); 
        data.player.radius = distance;
    },
};


var circle_config_with_timer = {...circle_config, ...{name:'CircleTimer',eval_name:'EvalCircleTimer', max_time_s:5}}


var triangle_config = {
    inputs: {},
    name: 'Triangle',
    eval_name: 'EvalTriangle',
    control_help_instructions: ['Use cursor to control edge of triangle'],
    make_data: function(cache)
    {
        var n_rotation = Phaser.Math.Between(0,3);
        return {
            reference: make_random_triangle(n_rotation),
            player: make_random_triangle(n_rotation)
        }


    },
    draw_reference: function(data)
    {
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeTriangleShape(data.reference);
    },

    draw_player: function(data)
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokeTriangleShape(data.player);
    },

    draw_evaluation: function(data)
    {
        GRAPHICS.fillStyle(GREEN, 0.3);
        GRAPHICS.fillTriangleShape(data.reference);
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillTriangleShape(data.player);
    },

    process_cursors_input: function(cursors, data)
    {
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=1; 
        if (cursors.up.isDown)    data.player.y3 +=   -SPEED
        if (cursors.down.isDown)  data.player.y3 +=    SPEED
        if (cursors.left.isDown)  data.player.x3 += -SPEED
        if (cursors.right.isDown) data.player.x3 +=  SPEED

    },

    pointermove: function(pointer, data)
    {
        var position =get_player_relative_position(pointer);
        data.player.y3 = position.y
        data.player.x3 = position.x

    },


};
var proportion_config = {
    inputs: {},
    name: 'Proportion',
    eval_name: 'EvalProportion',
    control_help_instructions: ['Use cursor to control edge of rectangle'],
    make_data: function(cache)
    {
        var min_width = 50; 
        var scale = Phaser.Math.Between(2.0, 3.0);  
        var ref = make_random_square(min_width, LENGTH/scale, min_width, LENGTH/scale);
        var player = new Phaser.Geom.Rectangle(0, 0, ref.width*scale, 100);
        return {
            player : player, 
            reference: ref,
            scale: scale,
        };
    },
    draw_reference: function(data)
    {
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeRectShape(data.reference);
    },

    draw_reference_evaluation: function(data)
    {
        var scale = data.scale;
        var scaled_reference = new Phaser.Geom.Rectangle(0, 0, data.reference.width*scale, data.reference.height*scale);
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeRectShape(scaled_reference);
    },

    draw_player: function(data)
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokeRectShape(data.player);
    },

    draw_evaluation: function(data)
    {
        var scale = 1.0/data.scale;
        var scaled_player = new Phaser.Geom.Rectangle(0, 0, data.player.width*scale, data.player.height*scale);
        GRAPHICS.fillStyle(GREEN, 0.3);
        GRAPHICS.fillRectShape(data.reference);
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillRectShape(scaled_player);
    },


    process_cursors_input: function(cursors, data)
    {
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=1; 
        if (cursors.up.isDown)    data.player.height +=   -SPEED
        if (cursors.down.isDown)  data.player.height +=    SPEED

    },

    pointermove: function(pointer, data)
    {
        var position =get_player_relative_position(pointer);
        data.player.height = position.y
    },

}

var square_config = {
    inputs: {},
    name: 'Square',
    eval_name: 'EvalSquare',
    control_help_instructions: ['Use cursor to control edge of rectangle'],
    make_data: function()
    {
        return {
            reference : make_random_square(50, LENGTH, 50, LENGTH),
            player : make_random_square(50, LENGTH, 50, LENGTH),
        };
    },
    draw_reference: function(data)
    {
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeRectShape(data.reference);
    },

    draw_player: function(data)
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokeRectShape(data.player);
    },

    draw_evaluation: function(data)
    {
        GRAPHICS.fillStyle(GREEN, 0.3);
        GRAPHICS.fillRectShape(data.reference);
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillRectShape(data.player);
    },

    process_cursors_input: function(cursors, data)
    {
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=1; 
        if (cursors.up.isDown)    data.player.height +=   -SPEED
        if (cursors.down.isDown)  data.player.height +=    SPEED
        if (cursors.left.isDown)  data.player.width += -SPEED
        if (cursors.right.isDown) data.player.width +=  SPEED

    },

    pointermove: function(pointer, data)
    {
        var position =get_player_relative_position(pointer);
        data.player.height = position.y
        data.player.width = position.x

    },


};


class EvaluateScene extends Phaser.Scene {
    constructor (config)
    {
        super(config);
    }

    preload()
    {

        //this.load.audio('sfx', [
        //    'assets/fx_mixdown.ogg',
        //    'assets/fx_mixdown.mp3'
        //    ], {
        //    instances: 4
        //});
    }


    create(data)
    {
        make_scene_setup(this);
        this.data_=data;
        this.center_bottom_text.setText(get_display_name())
        this.stats_text.setText(make_status_string());

        var explanations = [
            'Brown is the intersection between your drawing',
            'Big number is your score out of 1000'
        ]
        this.help_text = this.add.text(
            HELP_ORIGIN.x, 
            HELP_ORIGIN.y).setFontSize(DEFAULT_FONT_SIZE).setFontFamily(FONT_FAMILY).setText(make_help_text(explanations, 'continue'))



        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(SESSION_MANAGER.next_scene_name());

        }, this);

        var textureManager = this.textures;
        var scene = this;
        this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
        {
            var score_info = calc_score(textureManager, image);
            var score = score_info.score;
            var stat  = {
                time: Date.now(),
                name:scene.data_.config.name,
                score:score,
                session_id:SESSION_MANAGER.session_id
                };
            var stats = update_local_stats(stat);
            save_stat_firestore(stat);

            console.time('stats calculation');
            var historical_stats = calculate_historical_performance(stats);
            console.timeEnd('stats calculation');
            scene.score_text.setText((1000*score).toFixed(0));
            
        });
        this.blinder = new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH);

    }

    update()
    {
        GRAPHICS.clear();
        GRAPHICS.save();
        GRAPHICS.translateCanvas(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        this.data_.config.draw_evaluation(this.data_);
        GRAPHICS.restore();

        // we copy the reference on the player canvas
        GRAPHICS.save();
        GRAPHICS.translateCanvas(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        // if we have specified a draw reference evaluation we use it otherwise we use the standard function
        (this.data_.config.draw_reference_evaluation||this.data_.config.draw_reference)(this.data_)

        GRAPHICS.fillStyle(0x000000, 0.7);
        GRAPHICS.fillRectShape(this.blinder);
        GRAPHICS.restore();

        GRAPHICS.save();
        GRAPHICS.translateCanvas(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        (this.data_.config.draw_player_evaluation||this.data_.config.draw_player)(this.data_)
        GRAPHICS.restore();

    }

}


class InputScene extends Phaser.Scene {
    constructor(config) {
        super(config);
    }
    preload()
    {
        var config =this.scene.settings.data
        if ('filepack' in config)
        {
            this.load.pack(config.filepack)
        }
    }

    create(config)
    {
        console.log('starting scene %s', config.name)
        make_scene_setup(this);

        this.data_ = config.make_data(this.cache);

        this.data_.config = config;
        this.center_bottom_text.setText(get_display_name())
        this.stats_text.setText(make_status_string());
        this.help_text.setText(make_help_text(config.control_help_instructions||[], 'validate'))


        this.frame = new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', function (event) {
            console.log(this.data_.config);
            if(event.keyCode in CODE2GAME)
            {
                this.scene.start(CODE2GAME[event.keyCode]);

            }
            if(event.key in this.data_.config.inputs)
            {
                config.inputs[event.key](this.data_);
            }
        }, this);

        var max_time_s = config.max_time_s||3600;
        console.log('we will stop after ',max_time_s);
        var scene = this;
        const start_eval_scene = ()=>scene.scene.start(scene.data_.config.eval_name, scene.data_)
        
        this.logging_timer = this.time.addEvent({
            delay: 1000 * max_time_s,                // ms
            callback: ()=>{console.log('TIMER');start_eval_scene()},
            callbackScope: scene,
        });


        this.input.keyboard.on('keydown_SPACE',start_eval_scene)



        if ('pointermove' in config)
        {
              this.input.on('pointermove', function (pointer) {

                    config.pointermove(pointer, this.data_);

                }, this);

        }
        if ('pointerdown' in config)
        {
              var scene = this;
              this.input.on('pointerdown', function (pointer) {

                    config.pointerdown(pointer, this.data_, scene);

                }, this);

        }
        if ('drag' in config)
        {
              this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
                    config.drag(pointer, gameObject, dragX, dragY);

                }, this);

        }


    }
    update ()
    {
        GRAPHICS.clear();
        this.data_.config.process_cursors_input(this.cursors, this.data_);

        GRAPHICS.save();
        GRAPHICS.translateCanvas(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        this.data_.config.draw_reference(this.data_)
        GRAPHICS.restore();

        GRAPHICS.save();
        GRAPHICS.translateCanvas(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        this.data_.config.draw_player(this.data_);
        GRAPHICS.restore();

    }
}


