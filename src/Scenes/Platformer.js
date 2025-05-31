class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 600;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.coinsCollected = 0;
        this.totalCoins = 4;
        this.map = this.add.tilemap("candyland", 18, 18, 60, 21);
        this.cameras.main.setBackgroundColor('#ffc0cb');
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Create coins from Objects layer in tilemap
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 14
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // Find water tiles


    
        // Water bubble emitters (inline, Phaser 3.60+)

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocity(300, 1000);
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        
        // TODO: create coin collect particle effect here
        // Important: make sure it's not running
        my.vfx.coin = this.add.particles(0, 0, "kenny-particles", {
            frame: "circle_01.png",
            lifespan: 500,
            speed: { min: -80, max: 80 },
            scale: 0.04 ,
            alpha: { start: 1, end: 0 },
            quantity: 10,
            emitting: false
        });
        my.vfx.coin.stop();
        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (player, coin) => {
            my.vfx.coin.emitParticleAt(coin.x, coin.y);  // trigger particle effect
            coin.destroy();                              // remove coin
            this.coinsCollected++;

            if (this.coinsCollected >= this.totalCoins) {
                this.endGame();
            }
        });
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        // TODO: Add movement vfx here
          // Initialize vfx namespace if not already

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_02.png', 'smoke_08.png'],
            scale: { start: 0.01, end: 0.1 },
            lifespan: 350,
            alpha: { start: 0.3, end: 0.1 },
            emitting: false, // Start off not emitting
            frequency: 10
        });
        my.vfx.walking.stop();
        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_10.png'],
            scale: { start: 0.02, end: 0.1 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 400,
            quantity: 5,
            emitting: false
        });
        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 10, my.sprite.player.displayHeight/2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                if (!this.sound.get("footstep")?.isPlaying) {
                    this.sound.play("footstep");
                }
            }
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, -my.sprite.player.displayWidth/2 + 10, my.sprite.player.displayHeight/2 - 5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                if (!this.sound.get("footstep")?.isPlaying) {
                    this.sound.play("footstep");
                }
            }
        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jump.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        
    }
    endGame() {
            this.physics.world.pause();
            my.sprite.player.setTint(0x888888);
            my.sprite.player.anims.stop();
            this.add.text(this.cameras.main.width/2, this.cameras.main.height/3, "Level Complete!\nPress R to Restart", {
                fontSize: "24px",
                color: "#ffffff",
                align: "center"
            }).setOrigin(0.5);
        }
}