
utils.setup()
utils.setStyles()
utils.setGlobals()

var su = 0
var lastTime = 0
var delta = 0

var time = 0

var ticks = 0
var tickRate = 100
var tDelta = 1/tickRate
var tps = 0
var fps = 0
var lastTickTime = 0
var accumulator = 0
var jKeysG = {}

var selected = 1
var sLayer = 0

var editor = false

var playerImg = ui.newImg("player.png")
var tilesImg = ui.newImg("tiles.png")
var tilesLoaded = false
var tilesImgB = {}
var players = {}

var editorBG = new ui.Canvas()

tilesImg.onload = () => {
    
    for (let layer in lbrightness) {
        tilesImgB[layer] = ui.shadeImg(tilesImg, (r, g, b, a) => {
            r *= lbrightness[layer]
            g *= lbrightness[layer]
            b *= lbrightness[layer]
            return [r, g, b, a]
        })
    }

    tilesLoaded = true
}

let dot = false

var tCanvas = document.createElement("canvas")
var tCtx = tCanvas.getContext("2d")

function saveWorld() {
    console.log(JSON.stringify(sets))
}

function drawLayer(layer, cover={}, defaultA=1) {
    if (!tilesLoaded) return
    tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height)
    let oCtx = ctx
    ctx = tCtx
    for (let chunk in chunks) {
        if (layer in chunks[chunk]) {
            let pos = chunk.split(",").map(a => parseInt(a))
            for (let x = 0; x < cs.x; x++) {
                for (let y = 0; y < cs.y; y++) {
                    let tile = chunks[chunk][layer][x*cs.y+y]
                    if (tile != 0) {
                        ctx.globalAlpha = 1
                        let a = defaultA
                        if (tile in cover) a = cover[tile]
                        let s = ((x+pos[0]*cs.x)*2+(y+pos[1]*cs.y))
                        if (hoverT.includes(tile)) y -= Math.sin(time*2+s) / 8
                        if (transparent.includes(tile) || a < 1) {
                            ctx.globalCompositeOperation = "destination-out"
                            ui.rect(Math.round(tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer])[0]), Math.round(tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer])[1]), Math.round((ts.x*camera.zoom*lparallax[layer]+1) / 2) * 2, Math.round((ts.y*camera.zoom*lparallax[layer]+1) / 2) * 2, [0, 0, 0, 1])
                            ctx.globalAlpha = a
                            ctx.globalCompositeOperation = "source-over"
                            ui.img(...tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer]), ts.x*camera.zoom*lparallax[layer]+1, ts.y*camera.zoom*lparallax[layer]+1, tilesImgB[layer], [tiles[tile-1][0]*16, tiles[tile-1][1]*16, 16, 16])
                        } else {
                            ui.img(...tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer]), ts.x*camera.zoom*lparallax[layer]+1, ts.y*camera.zoom*lparallax[layer]+1, tilesImgB[layer], [tiles[tile-1][0]*16, tiles[tile-1][1]*16, 16, 16])
                        }
                        if (hoverT.includes(tile)) y += Math.sin(time*2+s) / 8
                    }
                }
            }
        }
    }
    ctx = oCtx
    ui.img(canvas.width/2, canvas.height/2, canvas.width, canvas.height, tCanvas)
    ctx.globalCompositeOperation = "source-over"
}

function gDir(v) {
    return v / Math.abs(v)
}

function update(timestamp) {
    requestAnimationFrame(update)
    dot = !dot
    // if (!dot) return
    fps++
    
    utils.getDelta(timestamp)
    ui.resizeCanvas()
    tCanvas.width = canvas.width
    tCanvas.height = canvas.height
    ui.getSu()
    input.setGlobals()

    jKeysG = {...jKeysG, jKeys}

    if (wConnect && !document.hidden) {
        connectToServer()
        wConnect = false
    }

    for (let player in playerData) {
        if (id != player && !(player in players)) {
            players[player] = {x: 0, y: 0, frame: 1, angle: 0}
        }
    }

    for (let player in players) {
        if (id == player || !(player in playerData)) {
            delete players[player]
        } else {
            playerData[player].framesT += delta
            while (playerData[player].framesT > 1/10 / playerData[player].framesA && playerData[player].frames.length > 1) {
                playerData[player].frames.splice(0, 1)
                playerData[player].framesT -= 1/10 / playerData[player].framesA
            }
            players[player].x = lerp(players[player].x, playerData[player].x, delta*15)
            players[player].y = lerp(players[player].y, playerData[player].y, delta*15)
            players[player].angle = lerp(players[player].angle, playerData[player].angle, delta*10)
            players[player].frame = playerData[player].frames[0]
        }
    }

    time += delta
    accumulator += delta
    let startTime = new Date().getTime()
    while ((accumulator >= tDelta || keys["KeyT"]) && new Date().getTime() - startTime < Math.min(1000/60, 1000*delta)) {
        gameTick()
        jKeysG = {}
        lastTickTime = time
        tps++
        accumulator -= tDelta
    }

    if (jKeys["Tab"]) {
        // editor = !editor
    }

    if (keys["KeyT"]) {
        accumulator = 0
    }

    camera.zoom = lerp(camera.zoom, su*0.875, delta*10)
    if (time < 0.1) camera.zoom = su*0.875

    camera.x = lerp(camera.x, player.x, delta*10)
    camera.y = lerp(camera.y, player.y, delta*10)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let layer of dlayers) {
        if (layer < 1 && (layer == sLayer || !editor || !keys["KeyF"])) drawLayer(layer)
    }

    for (let player in players) {
        ctx.save()
        ctx.translate(...tsc(players[player].x, players[player].y))
        if (playerData[player].ball) {
            ctx.translate(0, 6*pxs*camera.zoom)
            ctx.rotate(players[player].angle)
            ctx.translate(0, -6*pxs*camera.zoom)
            ctx.scale(playerData[player].scale, 1)
        } else {
            ctx.scale(playerData[player].scale, 1)
        }
        ui.img(0, 0, 18*pxs*camera.zoom, 26*pxs*camera.zoom, playerImg, [players[player].frame*18, 0, 18, 26])
        ctx.restore()
    }

    player.draw()

    for (let cover in player.covers) {
        if (player.covers[cover] == 0) continue
        if (!(player.covers[cover] in covers[cover])) covers[cover][player.covers[cover]] = coverDfs[cover]
        covers[cover][player.covers[cover]] = lerp(covers[cover][player.covers[cover]], 0, delta*10)
    }

    for (let cover in covers) {
        if (mergeCovers.includes(parseInt(cover)) && player.covers[cover] != 0) continue
        for (let tile in covers[cover]) {
            if (tile == player.covers[cover]) continue
            covers[cover][tile] = lerp(covers[cover][tile], coverDfs[cover], delta*10)
            if (covers[cover][tile] > coverDfs[cover]-0.01) delete covers[cover][tile]
        }
    }

    for (let layer of dlayers) {
        let cover = {}
        let defaultA = 1
        if (layer in covers) {
            cover = covers[layer]
            defaultA = coverDfs[layer]
            if (mergeCovers.includes(layer)) {
                let smallest = Math.min(...Object.values(covers[layer]), coverDfs[layer])
                defaultA = smallest
                cover = {}
            }
        }
        if (layer >= 1 && (layer == sLayer || !editor || !keys["KeyF"])) drawLayer(layer, cover, defaultA)
        ctx.globalAlpha = 1
    }

    if (editor) {
        let mw = {x: (mouse.x - canvas.width/2) / camera.zoom / lparallax[sLayer] + camera.x, y: ((canvas.height-mouse.y) - canvas.height/2) / lparallax[sLayer] / camera.zoom + camera.y}
        
        if (!ui.hovered(canvas.width - 64*su*6/2-10*su, 128*su*6/2+10*su, 64*su*6, 128*su*6)) {
            ctx.globalAlpha = 0.5
            ui.img(...tsc(Math.floor(mw.x/ts.x)*ts.x+ts.x/2, Math.floor(mw.y/ts.y)*ts.y+ts.y/2, lparallax[sLayer]), ts.x*camera.zoom*lparallax[sLayer], ts.y*camera.zoom*lparallax[sLayer], tilesImgB[sLayer], [tiles[selected-1][0]*16, tiles[selected-1][1]*16, 16, 16])
            ui.text(...tsc(Math.floor(mw.x/ts.x)*ts.x+ts.x, Math.floor(mw.y/ts.y)*ts.y+ts.y, lparallax[sLayer]), 20*camera.zoom, sLayer.toString())
            ctx.globalAlpha = 1
        }
       
        let w = tilesImg.width * su * 6
        let h = tilesImg.height * su * 6

        editorBG.set(canvas.width - 64*su*6/2-10*su, 128*su*6/2+10*su, 64*su*6, 128*su*6)
        editorBG.bounds.minY = 128*su*6 - h
        editorBG.colour = [0, 0, 0, 0.25]
        
        editorBG.draw()
        ui.setC(editorBG)

        ui.img(w/2, h/2, w, h, tilesImg)

        ui.rect(tiles[selected-1][0]*16*6*su + 16*3*su, tiles[selected-1][1]*16*6*su + 16*3*su, 16*6*su, 16*6*su, [0, 0, 0, 0], 5*su, [255, 255, 255, 0.5])

        if (jKeys["KeyE"] && (sLayer+1) in lbrightness) {
            sLayer += 1
        }
        if (jKeys["KeyQ"] && (sLayer-1) in lbrightness) {
            sLayer -= 1
        }

        if (jKeys["ArrowRight"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0] + 1,y:tiles[selected-1][1]}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }
        if (jKeys["ArrowLeft"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0] - 1,y:tiles[selected-1][1]}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }
        if (jKeys["ArrowUp"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0],y:tiles[selected-1][1] - 1}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }
        if (jKeys["ArrowDown"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0],y:tiles[selected-1][1] + 1}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }

        if (ui.hovered(canvas.width - w/2-10*su, h/2+10*su, w, h)) {
            let tx = Math.floor((mouse.x - (canvas.width - w-10*su)) / (16*6*su*lparallax[sLayer]))
            let ty = Math.floor((mouse.y - 10*su - editorBG.off.y) / (16*6*su*lparallax[sLayer]))
            let poses = tiles.map(a => a[0]+","+a[1])
            if (!mouse.ldown && poses.includes(tx+","+ty)) {
                ui.rect(tx*16*6*su + 16*3*su, ty*16*6*su + 16*3*su, 16*6*su, 16*6*su, [255, 255, 255, 0.1])
            }
            if (mouse.lclick) {
                if (poses.includes(tx+","+ty)) selected = poses.indexOf(tx+","+ty)+1
            }
        }

        if (jKeys["KeyR"]) {
            navigator.clipboard.writeText(JSON.stringify(sets)).then(() => console.log("World Copied"))
        }

        editorBG.drawScroll({x: 5*su, y: 5*su}, 5*su)
        editorBG.drawBorder(10*su, [0, 0, 0, 0.1])
        ui.setC()
    }

    ctx.globalCompositeOperation = "destination-over"
    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [100, 220, 255, 1])
    ctx.globalCompositeOperation = "source-over"

    input.updateInput()
} 

requestAnimationFrame(update)

input.scroll = (x, y) => {
    if (editor && editorBG.hovered()) {
        editorBG.scroll(x, y)
    }
}

function tsc(x, y, parallax=1) {
    return [(x-camera.x)*parallax*camera.zoom + canvas.width/2, (-y+camera.y)*parallax*camera.zoom + canvas.height/2]
}

setInterval(() => {
    console.log(tps, fps)
    tps = 0
    fps = 0
}, 1000)