function make_random_square(min_height, max_height, min_width, max_width)
{
    console.assert(min_height <= max_height)
    console.assert(min_width <= max_width)
    var height = Phaser.Math.Between(min_height, max_height);  
    var width =  Phaser.Math.Between(min_width, max_height);
    return new Phaser.Geom.Rectangle(0, 0, width, height);
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

function draw_reference(data)
{
    GRAPHICS.lineStyle(1, WHITE, 0.2);
    GRAPHICS.strokeRectShape(data.player.square);
    GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
    GRAPHICS.strokePoints(data.reference.points);
}

function draw_player(data)
{
    GRAPHICS.lineStyle(1, WHITE, 0.2);
    GRAPHICS.strokeRectShape(data.player.square);
    if(has_point(data))
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokePoints(data.player.polygon.points);
    }
}

 function draw_evaluation(data)
{
    GRAPHICS.fillStyle(GREEN, 0.3);
    GRAPHICS.fillPoints(data.reference.points);

    if(has_point(data))
    {
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillPoints(data.player.polygon.points);
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

function pointermove(pointer, data)
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

function pointerdown(pointer, data, scene)
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
 function drag(pointer, gameObject, dragX, dragY)
{
    gameObject.x = dragX;
    gameObject.y = dragY;
    gameObject._point.x = dragX - PLAYER_ORIGIN.x;
    gameObject._point.y = dragY - PLAYER_ORIGIN.y;

}



var blob_config = {
    'name': 'Blob',
    'eval_name': 'EvalBlob',
    'make_data': function(cache)
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
            'player' :player
        };
    },
    'draw_reference': draw_reference ,
    'draw_player': draw_player ,
    'draw_evaluation': draw_evaluation,
    'process_cursors_input': process_cursors_input ,
    'pointermove': pointermove,
    'pointerdown': pointerdown,
    'drag': drag,
    'inputs': {},
}

var free_config = {
    'name': 'Free',
    'eval_name': 'EvalFree',
    'make_data': function(cache)
    {
        var points = cache.json.get('example').points;
        var reference = new Phaser.Geom.Polygon(points);
        var player = {
            polygon:new Phaser.Geom.Polygon([]),
            square: new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH),
            pointer: 0,
            done: false};

        return {
            'reference' :reference,
            'player' :player
        };
    },
    'draw_reference': draw_reference ,
    'draw_player': draw_player ,
    'draw_evaluation': draw_evaluation,
    'process_cursors_input': process_cursors_input ,
    'pointermove': pointermove,
    'pointerdown': pointerdown,
    'drag': drag,
    'inputs': {},
    'filepack': 'assets/pack_free',
}

var circle_config = {
    'inputs': {},
    'name': 'Circle',
    'eval_name': 'EvalCircle',
    'make_reference': function(){
        return make_random_circle(LENGTH);
    },
    'make_player': function() {
        return make_random_circle(LENGTH);
    },
    'draw_reference': function(data)
    {
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeCircleShape(data.reference);
    },
    'draw_player': function(data)
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokeCircleShape(data.player);
    },

    'draw_evaluation': function(data)
    {
        GRAPHICS.fillStyle(GREEN, 0.3);
        GRAPHICS.fillCircleShape(data.reference);
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillCircleShape(data.player);
    },
    'process_cursors_input': function(cursors, data)
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
    'pointermove': function(pointer, data)
    {
        var position =get_player_relative_position(pointer);
        var distance = Phaser.Math.Distance.Between(position.x, position.y, LENGTH/2.0, LENGTH/2.0); 
        data.player.radius = distance;
    },

};

var square_config = {
    'inputs': {},
    'name': 'Square',
    'eval_name': 'EvalSquare',
    'make_reference': function(){
        return make_random_square(50, LENGTH, 50, LENGTH);
    },
    'make_player': function() {
        return make_random_square(50, LENGTH, 50, LENGTH);
    },
    'draw_reference': function(data)
    {
        GRAPHICS.lineStyle(1, REFERENCE_COLOR, 1.0);
        GRAPHICS.strokeRectShape(data.reference);
    },

    'draw_player': function(data)
    {
        GRAPHICS.lineStyle(1, RED, 1.0);
        GRAPHICS.strokeRectShape(data.player);
    },

    'draw_evaluation': function(data)
    {
        GRAPHICS.fillStyle(GREEN, 0.3);
        GRAPHICS.fillRectShape(data.reference);
        GRAPHICS.fillStyle(RED, 0.3);
        GRAPHICS.fillRectShape(data.player);
    },

    'process_cursors_input': function(cursors, data)
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

    'pointermove': function(pointer, data)
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
        GRAPHICS = this.add.graphics();
        this.data_=data;
        this.score_text = this.add.text(
            SCORE_ORIGIN.x, SCORE_ORIGIN.y, '')
            .setFontSize(64)
            .setFontStyle('bold')
            .setFontFamily(FONT_FAMILY)
        this.name_text = this.add.text(
            PLAYER_NAME_ORIGIN.x, 
            PLAYER_NAME_ORIGIN.y, get_display_name()).setFontSize(16).setFontFamily(FONT_FAMILY)
        this.stats_text = this.add.text(
            STATS_ORIGIN.x, 
            STATS_ORIGIN.y, '').setFontSize(16).setFontFamily(FONT_FAMILY)
        this.stats_text.setText(make_status_string());

        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(SESSION_MANAGER.next_scene_name());

        }, this);

        var textureManager = this.textures;
        var scene = this;
        this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
        {
            var score = calc_score(textureManager, image);
            var stat  = {
                time: Date.now(),
                name:scene.data_.config.name,
                score:score,
                session_id:SESSION_MANAGER.session_id
                };
            var stats = update_local_stats(stat);
            upload_firebase_stats();
            console.time('stats calculation');
            var historical_stats = calculate_historical_performance(stats);
            console.timeEnd('stats calculation');

            scene.score_text.setText((1000*score).toFixed(0));
        });
        this.blinder = new Phaser.Geom.Rectangle(-10, -10, LENGTH+10, LENGTH+10);

    }

    update()
    {
        GRAPHICS.clear();
        GRAPHICS.save();
        GRAPHICS.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        this.data_.config.draw_evaluation(this.data_);
        GRAPHICS.restore();

        GRAPHICS.save();
        GRAPHICS.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        this.data_.config.draw_reference(this.data_)

        GRAPHICS.fillStyle(0x000000, 0.7);
        GRAPHICS.fillRectShape(this.blinder);

        GRAPHICS.restore();

        GRAPHICS.save();
        GRAPHICS.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        this.data_.config.draw_player(this.data_);
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
        GRAPHICS = this.add.graphics();

        if ('make_data' in config)
        {
            this.data_ = config.make_data(this.cache);
        }
        else
        {
            this.data_ = {
                'reference' :config.make_reference() ,
                'player' :config.make_player(),
            };
        }

        this.data_.config = config;
        this.name_text = this.add.text( PLAYER_NAME_ORIGIN.x, PLAYER_NAME_ORIGIN.y, get_display_name())
            .setFontSize(16).setFontStyle('bold').setFontFamily(FONT_FAMILY).setPadding({ right: 16 });

        // remove duplication with evaluate
        this.stats_text = this.add.text(
            STATS_ORIGIN.x, 
            STATS_ORIGIN.y).setFontSize(16).setFontFamily(FONT_FAMILY)

        this.stats_text.setText(make_status_string());

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
        

        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(this.data_.config.eval_name, this.data_);

        }, this);



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
        GRAPHICS.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        this.data_.config.draw_reference(this.data_)
        GRAPHICS.restore();

        GRAPHICS.save();
        GRAPHICS.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        this.data_.config.draw_player(this.data_);
        GRAPHICS.restore();

    }
}


