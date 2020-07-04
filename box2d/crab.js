(function(window) {
    function crab() {
        this.view = new createjs.Bitmap("crab.png");
        this.view.regX = this.view.regY = 50;

        var fixDef = new box2d.b2FixtureDef();
                    fixDef.density = 1;
                    fixDef.friction = 0.5;
                    fixDef.restitution = .8;
                    var bodyDef = new box2d.b2BodyDef();
                    bodyDef.type = box2d.b2Body.b2_dynamicBody;
                    bodyDef.position.x = 50/SCALE;
                    bodyDef.position.y = 0;
                    fixDef.shape = new box2d.b2PolygonShape();
                    fixDef.shape.SetAsBox(100/SCALE,50/SCALE);
                    this.view.body = world.CreateBody(bodyDef);
                    this.view.body.CreateFixture(fixDef);
                    this.view.onTick = tick;
    }

    function tick(e) {
        this.x = this.body.GetPosition().x * SCALE;
        this.y = this.body.GetPosition().y * SCALE;
        this.rotation = this.body.GetAngle() * (180/Math.PI);
    }

    window.crab = crab;
})(window);