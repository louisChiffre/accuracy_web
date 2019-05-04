var reference;
var player;



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

class square extends Phaser.Scene {
    constructor() {
        super("rectangle");
    }

    create()
    {
        graphics = this.add.graphics({ lineStyle: { width: 1, color: 0x00ff00 }, fillStyle: { color: 0xff0000 }});
        reference = make_reference_square(); 
        player = make_player_square();
        //point = new Phaser.Geom.Rectangle(0, 0, 16, 16);
        cursors = this.input.keyboard.createCursorKeys();
        //var shift_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    }
    update ()
    {
        if (cursors.shift.isDown)
            SPEED=10;
        else
            SPEED=1.0 
        if (cursors.up.isDown)  player.height +=   -SPEED
        if (cursors.down.isDown)  player.height +=    SPEED
        if (cursors.left.isDown)  player.width += -SPEED
        if (cursors.right.isDown) player.width +=  SPEED

        graphics.clear();

        graphics.save();
        graphics.translate(REFERENCE_ORIGIN.x, REFERENCE_ORIGIN.y);
        graphics.lineStyle(1, REFERENCE_COLOR, 1.0);
        graphics.strokeRectShape(reference);
        graphics.restore();

        graphics.save();
        graphics.translate(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        graphics.lineStyle(1, RED, 1.0);
        graphics.strokeRectShape(player);
        graphics.restore();

        graphics.fillStyle(0xff00ff);
        //graphics.fillRect(point.x - 8, point.y - 8, point.width, point.height);
    }
}
console.log('done')
