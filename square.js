var data;



function make_random_square(min_height, max_height, min_width, max_width)
{
    console.assert(min_height <= max_height)
    console.assert(min_width <= max_width)
    var height = Phaser.Math.Between(min_height, max_height);  
    var width =  Phaser.Math.Between(min_width, max_height);
    return new Phaser.Geom.Rectangle(0, 0, width, height);

}


function make_reference_square()
{
    return make_random_square(50, LENGTH, 50, LENGTH);

}

function make_player_square()
{
    return make_random_square(50, LENGTH, 50, LENGTH);
}


function draw_reference()
{
    graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
    graphics.strokeRectShape(data.reference);
}

function draw_player()
{
    graphics.lineStyle(1, RED, 1.0);
    graphics.strokeRectShape(data.player);
}




class EvaluateSquare extends Phaser.Scene {

 
    constructor ()
    {
        super({ key: 'EvaluateSquare' });
        console.log('construct')
    }

    preload ()
    {

    }

    create ()
    {
        graphics = this.add.graphics({ lineStyle: { width: 1, color: 0x00ff00 }, fillStyle: { color: 0xff0000, alpha:0.1 }});

        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown_SPACE', function (event)
        {
            this.scene.start('Square');

        }, this);

        var textureManager = this.textures;
        var scene = this.scene;

        this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
        {
            var canvas = textureManager.createCanvas('snap', image.width, image.height);
            canvas.draw(0, 0, image);
            var data = canvas.imageData.data
            var i,j,k;
            var key,r,g,b;
            var M = {};
            var intersection_key = [76,53];
            var only_ref_key = [0,76];
            var only_player_key = [76,0];
            //0,76,0,255: 13940 only ref
            //76,0,0,255: 24120 only player
            //76,53,0,255: 29520 intersection

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
            var only_ref = M[only_ref_key]||0
            var only_player = M[only_player_key]||0
            var intersection = M[intersection_key]||0
            var union = only_ref + only_player + intersection
            var score = intersection/union
            console.log(score)
            console.log(M)
            textureManager.remove('snap');

        });

    }

    update()
    {
        graphics.clear();
        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        graphics.fillStyle(GREEN, 0.3);
        graphics.fillRectShape(data.reference);
        graphics.fillStyle(RED, 0.3);
        graphics.fillRectShape(data.player);
        graphics.restore();

    }

}


class Square extends Phaser.Scene {
    constructor() {
        super("Square");
    }

    create()
    {
        graphics = this.add.graphics({ lineStyle: { width: 1, color: 0x00ff00 }, fillStyle: { color: 0xff0000 }});
        data = {
            'reference' :make_reference_square() ,
            'player' :make_player_square()

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
        draw_reference()
        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        draw_player();
        graphics.restore();

    }
}


