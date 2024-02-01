
var pxs = 4

var ts = {x: 16*pxs, y: 16*pxs}
var cs = {x: 10, y: 10}
var rd = {x: 2, y: 2}

var player = new Player(0, 150)

var camera = {x: player.x, y: player.y, zoom: 1}

var chunks = {}
var loadC = 0
var sets = {}

var tiles = [
/*1*/  [0, 0],
/*2*/  [1, 0],
/*3*/  [0, 1],
/*4*/  [1, 1],
/*5*/  [2, 0],
/*6*/  [2, 1],
/*7*/  [3, 0],
/*8*/  [3, 2],
/*9*/  [3, 3],
/*10*/ [1, 2],
/*11*/ [0, 2],
/*12*/ [2, 2],
/*13*/ [1, 3],
/*14*/ [0, 3],
/*15*/ [2, 3],
/*16*/ [3, 1],
/*17*/ [0, 4],
/*18*/ [1, 4],
/*19*/ [2, 4],
/*20*/ [3, 4],
/*21*/ [0, 5],
/*22*/ [1, 5],
/*23*/ [2, 5],
/*24*/ [3, 5],
/*25*/ [0, 6],
/*26*/ [1, 6],
/*27*/ [2, 6],
/*28*/ [3, 6],
/*29*/ [0, 7],
/*30*/ [1, 7],
/*31*/ [2, 7],
/*32*/ [3, 7],
/*33*/ [1, 8],
/*34*/ [0, 8],
/*35*/ [2, 8],
/*36*/ [3, 8],
/*37*/ [3, 9],
/*38*/ [1, 9],
/*39*/ [0, 9],
/*40*/ [2, 9],
/*41*/ [0, 10],
/*42*/ [1, 10],
/*43*/ [2, 10],
/*44*/ [3, 10],

// /*00*/ [0, 0],
]

var nsolid = [0, 5, 6, 16, 26, 27, 28]
var transparent = [16]
var hoverT = [26, 27, 28]

var coverDfs = {"3": 0.8, "4": 0.8, "5": 1, "6": 1}
var covers = {"3": {}, "4": {}, "5": {}, "6": {}}
var mergeCovers = [3, 4, 5, 6]

var slopes = {
    "8": [-0.5, -0.5, 0.5, 0.5, -1], 
    "9": [0.5, -0.5, -0.5, 0.5, -1], 
    "10": [-0.5, -0.5, 0.5, 0, 0], 
    "11": [-0.5, -0.5, 0.5, 0, -1],     
    "12": [0.5, -0.5, -0.5, 0, -1], 
    "13": [-0.5, 0, 0.5, 0.5, 0],
    "14": [-0.5, 0, 0.5, 0.5, -1],
    "15": [0.5, 0, -0.5, 0.5, -1],
    "17": [0, -0.5, 0.5, 0.5, 0],
    "18": [0, -0.5, -0.5, 0.5, 0],
    "19": [0, -0.5, 0.5, 0.5, -1],
    "20": [0, -0.5, -0.5, 0.5, -1],
    "21": [-0.5, -0.5, 0, 0.5, -1],
    "22": [0.5, -0.5, 0, 0.5, -1],
    "23": [0.5, -0.5, -0.5, 0.5, 1],
    "24": [-0.5, -0.5, 0.5, 0.5, 1],
    "29": [-0.5, -0.5, 0.5, 0.5, -1],
    "30": [0.5, -0.5, -0.5, 0.5, -1],
    "33": [-0.5, -0.5, 0.5, 0, 0],
    "34": [-0.5, -0.5, 0.5, 0, -1],
    "35": [0.5, -0.5, -0.5, 0, -1],
    "38": [-0.5, 0, 0.5, 0.5, 0],
    "39": [-0.5, 0, 0.5, 0.5, -1],
    "40": [0.5, 0, -0.5, 0.5, -1],
    "41": [0.5, -0.5, -0.5, 0.5, 1],
    "42": [-0.5, -0.5, 0.5, 0.5, 1],
    "43": [0.5, -0.5, -0.5, 0.5, 1],
    "44": [-0.5, -0.5, 0.5, 0.5, 1],
}
var dlayers = [-2, -1, 0, 1, 2, 3, 4, 5, 6]
var clayers = [0, -1]
var lbrightness = {"-2": 0.6, "-1": 1, "0": 1, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1}
var lparallax = {"-2": 1, "-1": 1, "0": 1, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1}

function isCollidingPoint(x, y) {
    for (let clayer of clayers) {
        let t = getTile(Math.floor(x/ts.x), Math.floor(y/ts.y), clayer)
        if (t in slopes) {
            let rx = x/ts.x - Math.floor(x/ts.x) - 0.5
            let ry = y/ts.y - Math.floor(y/ts.y) - 0.5
            if (
            (rx >= Math.min(slopes[t][0], slopes[t][2]) || (slopes[t][0] > slopes[t][2] && !slopes[t][5])) && 
            (ry >= Math.min(slopes[t][1], slopes[t][3]) || (slopes[t][4] == -1 && !slopes[t][6])) && 
            (rx <= Math.max(slopes[t][0], slopes[t][2]) || (slopes[t][0] < slopes[t][2] && !slopes[t][5])) &&
            (ry <= Math.max(slopes[t][1], slopes[t][3]) || (slopes[t][4] == 1 && !slopes[t][6]))) {
                if (slopes[t][4] == 0) {
                    return true
                } else if (slopes[t][4] == -1) {
                    let re = Math.abs((rx - slopes[t][0]) / (slopes[t][2] - slopes[t][0]))
                    if (ry <= Math.min(slopes[t][1], slopes[t][3]) + re * Math.abs(slopes[t][3] - slopes[t][1])) return true
                } else if (slopes[t][4] == 1) {
                    let re = Math.abs((rx - slopes[t][0]) / (slopes[t][2] - slopes[t][0]))
                    if (ry >= Math.min(slopes[t][1], slopes[t][3]) + re * Math.abs(slopes[t][3] - slopes[t][1])) return true
                }
            }
        } else {
            if (!nsolid.includes(t)) return true
        }
    }
    return false
}

function setTile(x, y, l,  v) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in sets) {
        let poses = sets[c].map(set => set[0]+","+set[1]+","+set[2])
        if (poses.includes(x+","+y+","+l)) {
            sets[c][poses.indexOf(x+","+y+","+l)][3] = v
        } else {
            sets[c].push([x, y, l, v])
        }
    } else {
        sets[c] = [[x, y, l, v]]
    }
    if (c in chunks) {
        setTileR(x, y, l, v)
    }
}

var moveLayers = {}

fetch('world.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    return response.text()
  })
  .then(fileContent => {
    let startTime = new Date().getTime()
    let loaded = JSON.parse(fileContent)
    for (let chunk in loaded) {
        for (let set of loaded[chunk]) {
            if (set[2] in moveLayers) set[2] = moveLayers[set[2]]
            if (set[2] in lbrightness) setTile(set[0], set[1], set[2], set[3])
        }
    }
    console.log("World loaded in", new Date().getTime() - startTime+"ms")
  })
  .catch(error => {
    console.error("Error fetching the file:", error)
  })

function loadChunk(x, y) {
    let chunk = {}
    for (let x2 = 0; x2 < cs.x; x2++) {
        for (let y2 = 0; y2 < cs.y; y2++) {
            chunk.push(0)
        }
    }
    return chunk
}

function makeLayer() {
    let layer = []
    for (let x2 = 0; x2 < cs.x; x2++) {
        for (let y2 = 0; y2 < cs.y; y2++) {
            layer.push(0)
        }
    }
    return layer
}

function getTile(x, y, l) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in chunks) {
        if (l in chunks[c]) return chunks[c][l][(x - Math.floor(x/cs.x)*cs.x) * cs.y + (-y - Math.floor(-y/cs.y)*cs.y)]
    }
    return 0
}

function setTileR(x, y, l, v) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in chunks) {
        if (!(l in chunks[c])) chunks[c][l] = makeLayer()
        chunks[c][l][(x - Math.floor(x/cs.x)*cs.x) * cs.y + (-y - Math.floor(-y/cs.y)*cs.y)] = v
    }
}

function gameTick() {
    ticks++

    loadC -= tDelta

    if (loadC <= 0) {
        loadC = 0.1
        let pc = {x: Math.floor(player.x/ts.x/cs.x), y: Math.floor(-player.y/ts.y/cs.y)}
        let nearby = []
        for (let x = -rd.x; x < rd.x+1; x++) {
            for (let y = -rd.y; y < rd.y+1; y++) {
                let c = (pc.x+x)+","+(pc.y+y)
                nearby.push(c)
                if (!(c in chunks)) {
                    chunks[c] = {}
                    if (c in sets) {
                        for (let set of sets[c]) {
                            setTileR(set[0], set[1], set[2], set[3])
                        }
                    }
                }
            }
        }
        for (let chunk in chunks) {
            if (!nearby.includes(chunk)) {
                delete chunks[chunk]
            }
        }
    }

    player.tick()
}