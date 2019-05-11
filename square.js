function make_random_square(min_height, max_height, min_width, max_width)
{
    console.assert(min_height <= max_height)
    console.assert(min_width <= max_width)
    var height = Phaser.Math.Between(min_height, max_height);  
    var width =  Phaser.Math.Between(min_width, max_height);
    return new Phaser.Geom.Rectangle(0, 0, width, height);

}

var SquareStruct = {
    'name': 'Square',
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
    constructor ()
    {
        super({ key: 'EvaluateSquare' });
        console.log('construct')
    }


    create ()
    {
        graphics = this.add.graphics();

        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start('Square');

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
        struct.draw_evaluation(data);
        graphics.restore();

    }

}

var struct;

class Square extends Phaser.Scene {
    constructor() {
        super("Square");
    }

    create()
    {
        struct = SquareStruct;
        graphics = this.add.graphics();//{ lineStyle: { width: 1, color: 0x00ff00 }, fillStyle: { color: 0xff0000 }});
        data = {
            'reference' :struct.make_reference() ,
            'player' :struct.make_player()

        };
        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start('EvaluateSquare');

        }, this);

    }
    update ()
    {
        graphics.clear();
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=2; 
        if (cursors.up.isDown)    data.player.height +=   -SPEED
        if (cursors.down.isDown)  data.player.height +=    SPEED
        if (cursors.left.isDown)  data.player.width += -SPEED
        if (cursors.right.isDown) data.player.width +=  SPEED


        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        struct.draw_reference(data)
        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        struct.draw_player(data);
        graphics.restore();

    }
}


