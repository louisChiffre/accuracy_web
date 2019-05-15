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
    'done': false,
    'eval_name': 'EvalBlob',
    'make_reference': function(){
        var points = make_random_polygon(LENGTH);
        return new Phaser.Geom.Polygon(points);
    },
    'make_player': function() {
        var points = [0,0,100,0];
        return {
            polygon:new Phaser.Geom.Polygon(points),
            pointer: 1};
    },
    'draw_reference': function(data)
    {
        graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
        graphics.strokePoints(data.reference.points);
        //graphics.fillPoints(data.reference.points);
    },
    'draw_player': function(data)
    {
        graphics.lineStyle(1, RED, 1.0);
        graphics.strokePoints(data.player.polygon.points);
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
        /*if (cursors.shift.isDown)
            SPEED=5;
        else
            SPEED=2; 
        if (cursors.space.isDown)
        {
            data.player.polygon.points.push(new Phaser.Geom.Point(100,100));
            data.player.pointer = data.player.pointer + 1 ;
        }
        var i = data.player.pointer;
        if (cursors.up.isDown)    data.player.polygon.points[i].y =   -SPEED +  data.player.polygon.points[i].y;
        if (cursors.down.isDown)  data.player.polygon.points[i].y =    SPEED +  data.player.polygon.points[i].y;
        if (cursors.left.isDown)  data.player.polygon.points[i].x =   -SPEED +  data.player.polygon.points[i].x;
        if (cursors.right.isDown) data.player.polygon.points[i].x =    SPEED +  data.player.polygon.points[i].x;
        */


    },

    'pointermove': function(pointer, data)
    {
        data.player.polygon.points[data.player.pointer] = get_player_relative_position(pointer);

    },
    'pointerdown': function(pointer, data)
    {
        console.log('are we done %s', data.config.done)
        if(data.config.done==false)
        {
            var position =get_player_relative_position(pointer);
            var dist = Phaser.Math.Distance.Between(
                position.x,
                data.player.polygon.points[0].x,
                position.y,
                data.player.polygon.points[0].y);
            if(dist < 10)
            {
                data.player.polygon.points.push(data.player.polygon.points[0]);
                data.player.pointer = 1 ;
                data.config.done = true;
                console.log('aa')
            } else
            {
                data.player.polygon.points[data.player.pointer] = position; 
                data.player.polygon.points.push(position);
                data.player.pointer = data.player.pointer + 1 ;
                console.log(dist);
            }
        }



    },


}

var circle_config = {
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
            SPEED=2; 
        if (cursors.up.isDown)    data.player.radius +=   -SPEED
        if (cursors.down.isDown)  data.player.radius +=    SPEED
        if (cursors.left.isDown)  data.player.radius += -SPEED
        if (cursors.right.isDown) data.player.radius +=  SPEED

    }

};

var square_config = {
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
            SPEED=2; 
        if (cursors.up.isDown)    data.player.height +=   -SPEED
        if (cursors.down.isDown)  data.player.height +=    SPEED
        if (cursors.left.isDown)  data.player.width += -SPEED
        if (cursors.right.isDown) data.player.width +=  SPEED

    }

};






class EvaluatePolygon extends Phaser.Scene {
    constructor (config)
    {
        super(config);
    }


    create (data)
    {
        graphics = this.add.graphics();
        this.data_=data

        this.input.keyboard.on('keydown_ENTER', function (event)
        {
            this.scene.start(this.data_.config.name);

        }, this);

        var textureManager = this.textures;
        this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
        {
            calc_score(textureManager, image);
        });

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
            'config': config,
        };
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', function (event) {
            if(event.keyCode in code2game)
            {
                this.scene.start(code2game[event.keyCode]);

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
              this.input.on('pointerdown', function (pointer) {

                    config.pointerdown(pointer, this.data_);

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
        this.data_.config.draw_player(this.data_);
        graphics.restore();

    }
}


