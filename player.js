
class Player {
    minX = -51.5
    maxX = 86
    x = 0
    y = 0
    vx = 0
    vy = 0
    width = 0
    height = 0
    angle = 0
    vix = 0
    viy = 0
    gravity = 1200
    speed = 85
    floor = 0
    jumpSpeed = 650
    friction = 0
    slope = 1
    slopeAmt = 0.1
    lx = 0
    ly = 0
    size = pxs
    cPoints = []
    dir = 1
    animTime = 0
    transforming = false
    ball = false
    transformT = 1
    ballDir = 0
    splits = 4
    inWater = false
    covers = {}
    frames = []
    h = 1
    colour = "blue"
    constructor(x, y) {
        this.x = x
        this.y = y
        this.vix = x
        this.viy = y
        this.minX *= ts.x
        this.maxX *= ts.x
        this.size = pxs
        this.lx = this.vix
        this.ly = this.viy
        this.width = 12*this.size
        this.height = 24*this.size
        let splits = this.splits
        for (let y = 0; y < splits; y++) {
            let ys = (y/(splits-1)) - 0.5
            for (let x = 0; x < splits; x++) {
                let xs = (1-x/(splits-1)) - 0.5
                this.cPoints.push([xs, ys])
            }
        }
    }
    tick() {
        this.lx = this.x
        this.ly = this.y

        this.covers = {}
        for (let cover in covers) {
            this.covers[cover] = getTile(Math.floor(this.x/ts.x), Math.floor(this.y/ts.y), cover)
        }
        this.inWater = getTile(Math.floor(this.x/ts.x), Math.floor(this.y/ts.y), 1) == 16 || getTile(Math.floor(this.x/ts.x), Math.floor((this.y-this.height/4)/ts.y), 1) == 16 || getTile(Math.floor(this.x/ts.x), Math.floor((this.y+this.height/4)/ts.y), 1) == 16

        let cTile = getTile(Math.floor(this.x/ts.x), Math.floor(this.y/ts.y), 0)
        if (!editor && hoverT.includes(cTile)) {
            collected += 1
            setTile(Math.floor(this.x/ts.x), Math.floor(this.y/ts.y), 0, 0)
        }

        this.floor -= tDelta
        if (!editor) this.vy -= this.gravity * tDelta
        if (this.ball && !editor) this.speed /= 2
        if (keys["KeyA"]) {
            this.vx -= this.speed * 100 * tDelta
            this.dir = -1
        }
        if (keys["KeyD"]) {
            this.vx += this.speed * 100 * tDelta
            this.dir = 1
        }
        if (this.ball && !editor) this.speed *= 2
        if (this.ball && editor) this.speed *= 2
        if (keys["KeyS"] && editor) {
            this.vy -= this.speed/2 * 100 * tDelta
        }
        if ((keys["Space"] || keys["KeyW"]) && (editor || this.inWater)) {
            this.vy += this.speed/2 * 100 * tDelta
        }
        if (this.ball && editor) this.speed /= 2
       
        if (keys["Space"] && this.floor > 0 && !editor) {
            this.floor = 0
            this.vy = this.jumpSpeed
        }
        if (keys["ShiftLeft"]) {
            if (!this.ball) this.transform()
        } else {
            if (this.ball) this.transform()
        }

        if (this.isColliding()) {
            this.fixCollision()
        }

        if (this.transforming) {
            this.transformT += tDelta * 10
            if (this.transformT > 1) {
                this.transformT = 1
                this.transforming = false
            }
        }
        
        if (this.ball) {
            this.friction = 0.9
        } else {
            this.friction = 0.8
        }
        this.vx = lerp(this.vx, 0, tDelta*60*(1-this.friction))
        if (editor || this.inWater) this.vy = lerp(this.vy, 0, tDelta*60*(1-0.9))
        this.vy = Math.min(Math.max(this.vy, -2000), 2000)
        this.move(this.vx*tDelta, this.vy*tDelta, 1)

        if (!editor) this.x = Math.min(Math.max(this.x, this.minX), this.maxX)

        if (this.y < -10000) {
            let off = camera.y - this.y
            this.tp(this.x, 2000)
            camera.y = this.y + off
        } 

        if (this.ball) {
            this.angle += this.vx/50 * tDelta
        }

        if (Math.abs(this.vx) > 100) {
            this.animTime += Math.abs(this.vx)/50 * tDelta
        } else {
            this.animTime += tDelta
        }

        let w = 64*su*6
        let h = 128*su*6
        if (editor && !ui.hovered(canvas.width - w/2-10*su, h/2+10*su, w, h)) {
            let mw = {x: (mouse.x - canvas.width/2) / camera.zoom / lparallax[sLayer] + camera.x, y: ((canvas.height-mouse.y) - canvas.height/2) / camera.zoom / lparallax[sLayer] + camera.y}
            if (mouse.rdown && getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer) != 0) {
                if (keys["KeyB"]) {
                    spreadb = getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer)
                    spreadt = 0
                    spreadl = sLayer
                    spread = []
                    spread.push([Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y)].join(","))
                }
                setTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer, 0)
            }
            if (mouse.ldown && getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer) != selected) {
                if (keys["KeyB"]) {
                    spreadb = getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer)
                    spreadt = selected
                    spreadl = sLayer
                    spread = []
                    spread.push([Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y)].join(","))
                }
                setTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer, selected)
            }
        }
    }
    transform() {
        this.ball = !this.ball
        if (!this.ball && this.isColliding()) {
            this.ball = true
            return
        }
        this.transforming = true
        this.angle = 0
        this.ballDir = this.dir
        if (this.transformT >= 1) this.transformT = 0
    }
    isColliding() {
        if (editor) return false
        for (let point of this.cPoints) {
            if (!this.ball) {
                if (isCollidingPoint(this.x+point[0]*this.width, this.y+point[1]*this.height)) return true
            } else {
                if (isCollidingPoint(this.x+point[0]*this.width, this.y-6*this.size+point[1]*12*this.size)) return true
            }
        }
        return false
    }
    isCollidingFloor() {
        if (editor) return false
        for (let point of this.cPoints.slice(0, this.splits)) {
            if (!this.ball) {
                if (isCollidingPoint(this.x+point[0]*this.width, this.y+point[1]*this.height)) return true
            } else {
                if (isCollidingPoint(this.x+point[0]*this.width, this.y-6*this.size+point[1]*12*this.size)) return true
            }
        }
        return false
    }
    tp(x, y) {
        this.x = x
        this.y = y
        this.vix = x
        this.viy = y
        this.lx = this.vix
        this.ly = this.viy
    }
    fixCollision() {
        let d = 0
        while (this.isColliding()) {
            d += 0.01
            for (let i = 0; i < 8; i++) {
                this.x += Math.sin(i * (Math.PI*2/8)) * d
                this.y += Math.cos(i * (Math.PI*2/8)) * d
                if (!this.isColliding()) {
                    // this.vx += Math.sin(i * (Math.PI/4)) * d * 10
                    // this.vy += Math.cos(i * (Math.PI/4)) * d * 10
                    return
                }
                this.x -= Math.sin(i * (Math.PI*2/8)) * d
                this.y -= Math.cos(i * (Math.PI*2/8)) * d
            }
        }
    }
    move(x, y, steps) {
        steps = Math.round(steps)
        for (let i = 0; i < steps; i++) {
            this.x += x / steps
            if (this.isColliding()) {
                this.y += this.slope * Math.abs(x / steps)
                if (!this.isColliding()) {
                    this.y -= this.slope * Math.abs(x / steps)
                    while (this.isColliding()) {
                        this.y += this.slopeAmt
                    }
                } else {
                    this.y -= this.slope * Math.abs(x / steps) * 2
                    if (!this.isColliding()) {
                        this.y += this.slope * Math.abs(x / steps)
                        while (this.isColliding()) {
                            this.y -= this.slopeAmt
                        }
                    } else {
                        this.y += this.slope * Math.abs(x / steps)
                        this.x -= x / steps
                        this.vx = 0
                        break
                    }
                }
            } else if (y < 0) {
                this.y -= this.slope*1.1 * Math.abs(x / steps)
                if (this.isColliding()) {
                    this.y += this.slope*1.1 * Math.abs(x / steps)
                    while (!this.isCollidingFloor()) {
                        this.y -= this.slopeAmt
                    }
                    this.y += this.slopeAmt
                } else {
                    this.y += this.slope*1.1 * Math.abs(x / steps)
                }
            }
        }
        for (let i = 0; i < steps; i++) {
            this.y += y / steps
            if (this.isColliding()) {
                if (y < 0) this.floor = 0.1
                this.y -= y / steps
                if (this.ball) {
                    this.vy *= -0.8
                } else {
                    this.vy = 0
                }
                break
            }
        }
    }
    draw() {
        let amt = tickRate*delta
        amt = accumulator / tDelta

        this.vix = this.x * amt + this.lx * (1 - amt)
        this.viy = this.y * amt + this.ly * (1 - amt)

        let frame = Math.floor(this.animTime) % 2 + 1
        if (this.ball) frame = 15
        if (this.transforming && this.ball) {
            frame = 9+Math.floor(this.transformT*5)
        }
        if (this.transforming && !this.ball) {
            frame = 14-Math.floor(this.transformT*5)
        }

        if (Math.abs(this.vx) > 100 && !this.ball && !this.transforming) {
            frame = Math.floor(this.animTime) % 4 + 3
        }

        if (this.vy >= 0 && this.floor <= 0 && !this.ball && !this.transforming) {
            frame = 7
        }
        if (this.vy < 0 && this.floor <= 0 && !this.ball && !this.transforming) {
            frame = 8
        }
        this.frames.push(frame)

        if (collected >= totalCollect) {
            ctx.save()
            ctx.translate(...tsc(this.vix, this.viy))
            if (this.ball) {
                ctx.scale(this.ballDir, 1)
            } else {
                ctx.scale(this.dir, 1)
            }
            let s = Math.sin(time*5)/2+0.5
            let s2 = Math.sin(time*5+Math.PI*2/3)/2+0.5
            let s3 = Math.sin(time*5+Math.PI*2/3*2)/2+0.5
            ctx.globalAlpha = 0.5
            ui.img(0, 0, 18*this.size*(1+s*0.15)*camera.zoom, 26*this.size*(1+s*0.15)*camera.zoom, playerImgs[this.colour], [frame*18+0.1, 0, 17.8, 26])
            ui.img(0, 0, 18*this.size*(1+s2*0.15)*camera.zoom, 26*this.size*(1+s2*0.15)*camera.zoom, playerImgs[this.colour], [frame*18+0.1, 0, 17.8, 26])
            ui.img(0, 0, 18*this.size*(1+s3*0.15)*camera.zoom, 26*this.size*(1+s3*0.15)*camera.zoom, playerImgs[this.colour], [frame*18+0.1, 0, 17.8, 26])
            ctx.globalAlpha = 1
            ctx.restore()
        }
        ctx.save()
        ctx.translate(...tsc(this.vix, this.viy))
        if (this.ball) {
            ctx.translate(0, 6*this.size*camera.zoom)
            ctx.rotate(this.angle)
            ctx.translate(0, -6*this.size*camera.zoom)
            ctx.scale(this.ballDir, 1)
        } else {
            ctx.scale(this.dir, 1)
        }
        ui.img(0, 0, 18*this.size*camera.zoom, 26*this.size*camera.zoom, playerImgs[this.colour], [frame*18+0.1, 0, 17.8, 26])
        ctx.restore()

        this.h = 1
        if (this.ball) this.h = 1 - this.transformT * 0.7
        if (!this.ball) this.h = 0.3 + this.transformT * 0.7

        if (collected >= totalCollect) {
            let s = Math.sin(time*5)/2+0.5
            let s2 = Math.sin(time*5+Math.PI*2/3)/2+0.5
            let s3 = Math.sin(time*5+Math.PI*2/3*2)/2+0.5
            ctx.globalAlpha = 0.5
            ui.text(...tsc(this.vix, this.viy + (this.height/2 + 20) * this.h), 25*(1+s*0.15)*camera.zoom, username, {align: "center", colour: baseColours[this.colour]})
            ui.text(...tsc(this.vix, this.viy + (this.height/2 + 20) * this.h), 25*(1+s2*0.15)*camera.zoom, username, {align: "center", colour: baseColours[this.colour]})
            ui.text(...tsc(this.vix, this.viy + (this.height/2 + 20) * this.h), 25*(1+s3*0.15)*camera.zoom, username, {align: "center", colour: baseColours[this.colour]})
            ctx.globalAlpha = 1
        }

        ui.text(...tsc(this.vix, this.viy + (this.height/2 + 20) * this.h), 25*camera.zoom, username, {align: "center"})
    }
}