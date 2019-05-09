var data;



function make_random_square(min_height, max_height, min_width, max_width)
{
    console.assert(min_height <= max_height)
    console.assert(min_width <= max_width)
    var height = rand(min_height, max_height);  
    var width =  rand(min_width, max_height);
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
        graphics.clear();
        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        graphics.fillStyle(REFERENCE_COLOR, 0.1);
        graphics.fillRectShape(data.reference);
        graphics.fillStyle(RED, 0.1);
        graphics.fillRectShape(data.player);
        graphics.restore();
        var textureManager = this.textures;
        var scene = this.scene;
        this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
        {
            textureManager.addImage('snap', image);
            var i; 
            var j;
            var k;
            for (i = 0; i < LENGTH; i++) {
                for (j = 0; j < LENGTH; j++) {
                    //console.log(i,j);
                    k = scene.scene.textures.getPixel(i,j, 'snap');
                }
            }
            //scene.scene.textures.getPixel(0,0, 'snap');
            //console.log(scene.scene.textures.getPixel(0,0, 'snap'));0
            textureManager.remove('snap');
            console.log('done')
        });

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
        if (cursors.space.isDown)
        {
            
            //var scene =this.scene;
            //var textureManager = this.textures;

            ////graphics.save()
            ////graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
            ////graphics.lineStyle(1, RED, 1.0);
            ////graphics.strokeRectShape(player);
            ////graphics.restore()

            //graphics.save();
            //graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);

            //graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
            //graphics.strokeRectShape(reference);

            //graphics.restore();

            //graphics.save();

            //graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
            //graphics.lineStyle(1, RED, 1.0);
            //graphics.strokeRectShape(player);
            //graphics.restore();


            //this.game.renderer.snapshotArea(0, 0, LENGTH, LENGTH, function (image)
            //{
            //    textureManager.addImage('snap', image);
            //    scene.scene.textures.getPixel(0,0, 'snap');
            //    textureManager.remove('snap');
            //    console.log('done')
            //    //scene.restart()
            //    scene.start('evaluate')
            //});
            //this.scene.restart();

        }
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=1.0 
        if (cursors.up.isDown)    data.player.height +=   -SPEED
        if (cursors.down.isDown)  data.player.height +=    SPEED
        if (cursors.left.isDown)  data.player.width += -SPEED
        if (cursors.right.isDown) data.player.width +=  SPEED


        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
        graphics.strokeRectShape(data.reference);
        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        graphics.lineStyle(1, RED, 1.0);
        graphics.strokeRectShape(data.player);
        graphics.restore();

        graphics.fillStyle(0xff00ff);
        //graphics.fillRect(point.x - 8, point.y - 8, point.width, point.height);
    }
}
console.log('done')
