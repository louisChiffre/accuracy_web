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
function make_random_polygon(LENGTH)
{
    var H = Phaser.Math.Between(300, 0.9*LENGTH); 
    var points = make_random_base(H);
    var n_points = 3
    var x = new Array(n_points);
    var y = new Array(n_points);
    for (i = 0; i < x.length; i++) { 
        x[i] = Phaser.Math.Between(0.5*H, H);
        y[i] = Phaser.Math.Between(0.25*H, 0.75*H);
    }
    console.log(y)
    y.sort((a, b) => a - b)
    console.log(y)
    for (i = 0; i < x.length; i++) 
    {
        points.push(x[i]);
        points.push(y[i]);

    }
    points.push(points[0]);
    points.push(points[1]);
    return points
}

function get_player_relative_position(pointer)
{
    return new Phaser.Geom.Point(pointer.x - PLAYER_ORIGIN.x, pointer.y - PLAYER_ORIGIN.y);
}

var blob_config = {
    'name': 'Blob',
    'eval_name': 'EvalBlob',
    'make_reference': function(){
        var points = make_random_polygon(LENGTH);
        return new Phaser.Geom.Polygon(points);
    },
    'make_player': function() {
        var points = [0,0,100,0];
        return {
            polygon:new Phaser.Geom.Polygon(points),
            square: new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH),
            pointer: 1,
            done: false};
    },
    'draw_reference': function(data)
    {
        graphics.lineStyle(1, WHITE, 0.2);
        graphics.strokeRectShape(data.player.square);
        graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
        graphics.strokePoints(data.reference.points);
        //graphics.fillPoints(data.reference.points);
    },
    'draw_player': function(data)
    {
        graphics.lineStyle(1, WHITE, 0.2);
        graphics.strokeRectShape(data.player.square);
        graphics.lineStyle(1, RED, 1.0);
        graphics.strokePoints(data.player.polygon.points);
        if(data.player.done)
        {
            //for(var circle of data.player.circles)
            //{
            //    console.log(circle);
            //    graphics.strokeCircleShape(circle);
            //}

        }
    },

    'draw_evaluation': function(data)
    {
        graphics.fillStyle(GREEN, 0.3);
        graphics.fillPoints(data.reference.points);

        graphics.fillStyle(RED, 0.3);
        graphics.fillPoints(data.player.polygon.points);
    },
    'process_cursors_input': function(cursors, data)
    {

    },

    'pointermove': function(pointer, data)
    {
        if(data.player.done==false)
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

    },
    'pointerdown': function(pointer, data, scene)
    {
        if(data.player.done==false)
        {
            data.player.done = data.player.polygon.points[data.player.pointer] == data.player.polygon.points[0];
            console.log('are we done %s', data.player.done)

            if(data.player.done)
            {
                data.player.polygon.points.push(data.player.polygon.points[0]);
                data.player.pointer = 1 ;
                data.player.done = true;
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



    },
    'drag': function(pointer, gameObject, dragX, dragY)
    {
        gameObject.x = dragX;
        gameObject.y = dragY;
        gameObject._point.x = dragX - PLAYER_ORIGIN.x;
        gameObject._point.y = dragY - PLAYER_ORIGIN.y;

    },


    'inputs': {
        'Tab': function(data) {
            console.log('TAB')
            data.player.pointer=(data.player.pointer+1)%data.player.polygon.points.length;
        }
    }


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
        graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
        graphics.strokeCircleShape(data.reference);
    },
    'draw_player': function(data)
    {
        graphics.lineStyle(1, RED, 1.0);
        graphics.strokeCircleShape(data.player);
    },

    'draw_evaluation': function(data)
    {
        graphics.fillStyle(GREEN, 0.3);
        graphics.fillCircleShape(data.reference);
        graphics.fillStyle(RED, 0.3);
        graphics.fillCircleShape(data.player);
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

    }

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
        graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
        graphics.strokeRectShape(data.reference);
    },
    'draw_player': function(data)
    {
        graphics.lineStyle(1, RED, 1.0);
        graphics.strokeRectShape(data.player);
    },

    'draw_evaluation': function(data)
    {
        graphics.fillStyle(GREEN, 0.3);
        graphics.fillRectShape(data.reference);
        graphics.fillStyle(RED, 0.3);
        graphics.fillRectShape(data.player);
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

    }

};

var markers = [
    { name: 'alien death', start: 1, duration: 1.0, config: {} },
    { name: 'boss hit', start: 3, duration: 0.5, config: {} },
    { name: 'escape', start: 4, duration: 3.2, config: {} },
    { name: 'meow', start: 8, duration: 0.5, config: {} },
    { name: 'numkey', start: 9, duration: 0.1, config: {} },
    { name: 'ping', start: 10, duration: 1.0, config: {} },
    { name: 'death', start: 12, duration: 4.2, config: {} },
    { name: 'shot', start: 17, duration: 1.0, config: {} },
    { name: 'squit', start: 19, duration: 0.3, config: {} }
];



class EvaluatePolygon extends Phaser.Scene {
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


    create (data)
    {
        graphics = this.add.graphics();
        this.data_=data
        this.score_text = this.add.text(STATS_ORIGIN.x, STATS_ORIGIN.y, '').setFontSize(64).setFontStyle('bold').setFontFamily('Arial').setPadding({ right: 16 });
        this.name_text = this.add.text(PLAYER_NAME_ORIGIN.x, PLAYER_NAME_ORIGIN.y, PLAYER_NAME).setFontSize(16).setFontFamily('Arial').setPadding({ right: 16 });
        this.input.keyboard.on('keydown_ENTER', function (event)
        {
            this.scene.start(this.data_.config.name);

        }, this);

        //var PLAYER_NAMES = ['Louis'];
        //this.input.keyboard.on('keydown_A', function (event)
        //{
        //    PLAYER_NAME = Phaser.Math.RND.pick(PLAYER_NAMES);
        //    this.name_text.setText(PLAYER_NAME);
        //    console.log(PLAYER_NAME)

        //}, this);

        var textureManager = this.textures;
        var scene = this;
        this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
        {
            var score = calc_score(textureManager, image);
            var stat  = {
                time: Date.now(),
                name:scene.data_.config.name,
                score:score};
            var stats = JSON.parse(localStorage.getItem(PLAYER_NAME))||[];
            stats.push(stat)
            localStorage.setItem(PLAYER_NAME, JSON.stringify(stats));
            scene.score_text.setText((1000*score).toFixed(0));
        });
        this.blinder = new Phaser.Geom.Rectangle(-10, -10, LENGTH+10, LENGTH+10);

    }

    update()
    {
        graphics.clear();
        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        this.data_.config.draw_evaluation(this.data_);
        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        this.data_.config.draw_reference(this.data_)

        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRectShape(this.blinder);

        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        this.data_.config.draw_player(this.data_);
        graphics.restore();

    }

}


class Polygon extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    create(config)
    {
        graphics = this.add.graphics();
        this.data_ = {
            'reference' :config.make_reference() ,
            'player' :config.make_player(),
        };
        this.data_.config = config;
        this.name_text = this.add.text(PLAYER_NAME_ORIGIN.x, PLAYER_NAME_ORIGIN.y, PLAYER_NAME).setFontSize(16).setFontStyle('bold').setFontFamily('Arial').setPadding({ right: 16 });

        this.frame = new Phaser.Geom.Rectangle(0, 0, LENGTH, LENGTH);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', function (event) {
            console.log(this.data_.config);
            if(event.keyCode in code2game)
            {
                this.scene.start(code2game[event.keyCode]);

            }
            if(event.key in this.data_.config.inputs)
            {
                config.inputs[event.key](this.data_);
            }
        }, this);
        

        this.input.keyboard.on('keydown_ENTER', function (event)
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
        graphics.clear();
        this.data_.config.process_cursors_input(this.cursors, this.data_);


        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        this.data_.config.draw_reference(this.data_)
        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        //graphics.lineStyle(1, WHITE, 0.1);
        //graphics.strokeRectShape(this.frame);
        this.data_.config.draw_player(this.data_);
        graphics.restore();

        //this.score.setColor(WHITE);

    }
}


