function make_random_square(min_height, max_height, min_width, max_width)
{
    console.assert(min_height <= max_height)
    console.assert(min_width <= max_width)
    var height = Phaser.Math.Between(min_height, max_height);  
    var width =  Phaser.Math.Between(min_width, max_height);
    return new Phaser.Geom.Rectangle(0, 0, width, height);

}

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
    }

};






class EvaluateSquare extends Phaser.Scene {
    constructor (config)
    {
        super(config);
    }


    create (data)
    {
        graphics = this.add.graphics();
        this.data_=data

        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown_SPACE', function (event)
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

    }

}

var polygon_config;

class Polygon extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    create(config)
    {
        console.log(config)
        graphics = this.add.graphics();
        this.data_ = {
            'reference' :config.make_reference() ,
            'player' :config.make_player(),
            'config': config,
        };
        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start(this.data_.config.eval_name, this.data_);

        }, this);

    }
    update ()
    {
        graphics.clear();
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=2; 
        if (cursors.up.isDown)    this.data_.player.height +=   -SPEED
        if (cursors.down.isDown)  this.data_.player.height +=    SPEED
        if (cursors.left.isDown)  this.data_.player.width += -SPEED
        if (cursors.right.isDown) this.data_.player.width +=  SPEED


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


