
var pxs = 4

var ts = {x: 16*pxs, y: 16*pxs}
var cs = {x: 10, y: 10}
var rd = {x: 2, y: 2}

var player = new Player(0, 150)

var baseColours = {
    red: [204, 0, 0, 1],
    yellow: [204, 198, 0, 1],
    green: [0, 204, 10, 1],
    blue: [0, 109, 204, 1]
}

var camera = {x: player.x, y: player.y, zoom: 1}
var cameraZoom = 0.875

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
/*45*/ [0, 11],
/*46*/ [1, 11],
/*47*/ [2, 11],
/*48*/ [3, 11]
// /*00*/ [0, 0],
]

var nsolid = [0, 5, 6, 16, 26, 27, 28]
var transparent = [16]
var hoverT = [26, 27, 28]

var coverDfs = {"3": 0.8, "4": 0.8, "5": 1, "6": 1, "7": 0.8}
var covers = {"3": {}, "4": {}, "5": {}, "6": {}, "7": {}}
var mergeCovers = [3, 4, 5, 6, 7]

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
    "45": [0.5, -0.5, -0.5, 0.5, 1],
    "46": [-0.5, -0.5, 0.5, 0.5, 1],
}
var dlayers = [-2, -1, -3, 0, 1, 2, 3, 4, 7, 5, 6]
var clayers = [0, -1]
var lbrightness = {"-3": 1, "-2": 0.6, "-1": 1, "0": 1, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1}
var lparallax = {"-3": 1, "-2": 1, "-1": 1, "0": 1, "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1}

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

function setTile(x, y, l,  v, newS=true) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in sets) {
        let poses = sets[c].map(set => set[0]+","+set[1]+","+set[2])
        if (poses.includes(x+","+y+","+l)) {
            if (v == 0) {
                sets[c].splice(poses.indexOf(x+","+y+","+l), 1)
            } else {
                sets[c][poses.indexOf(x+","+y+","+l)][3] = v
            }
        } else if (v != 0) {
            sets[c].push([x, y, l, v])
        }
    } else if (v != 0) {
        sets[c] = [[x, y, l, v]]
    }

    if (newS && !editor) {
        if (c in newSets) {
            let poses = newSets[c].map(set => set[0]+","+set[1]+","+set[2])
            if (poses.includes(x+","+y+","+l)) {
                newSets[c][poses.indexOf(x+","+y+","+l)][3] = v
            } else {
                newSets[c].push([x, y, l, v])
            }
        } else {
            newSets[c] = [[x, y, l, v]]
        }
        savedNewSets = JSON.stringify(newSets)
    }

    if (c in chunks) {
        setTileR(x, y, l, v)
        return true
    } else {
        return false
    }
}

var moveLayers = {}
var savedSets = {}
var savedNewSets = {}

var totalCollect = 1

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
    totalCollect = 0
    for (let chunk in loaded) {
        for (let set of loaded[chunk]) {
            if (set[2] in moveLayers) set[2] = moveLayers[set[2]]
            if (set[2] in lbrightness) setTile(set[0], set[1], set[2], set[3], false)
            if (set[2] == 0 && hoverT.includes(set[3])) totalCollect++
        }
    }
    savedSets = JSON.stringify(sets)
    console.log("World loaded in", new Date().getTime() - startTime+"ms")

    if (saveData) {
        if ("savedSets" in saveData) {
            loadNewSets(JSON.parse(saveData.savedSets))
            newSets = JSON.parse(saveData.savedSets)
            savedNewSets = saveData.savedSets
        }
    }
  })
  .catch(error => {
    console.error("Error fetching the file:", error)
  })

function loadNewSets(newSets={}) {
    for (let chunk in newSets) {
        for (let set of newSets[chunk]) {
            setTile(set[0], set[1], set[2], set[3], false)
        }
    }
}

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

    let set = 0
    let offs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    let t = 0
    let ospread = [...spread]
    for (let pos of ospread) {
        let pos2 = pos.split(",").map(a => parseInt(a))
        for (let off of offs) {
            t = getTile(pos2[0]+off[0], pos2[1]+off[1], spreadl)
            if (t != spreadt && t == spreadb) {
                if (setTile(pos2[0]+off[0], pos2[1]+off[1], spreadl, spreadt)) {
                    spread.push([pos2[0]+off[0], pos2[1]+off[1]].join(","))
                    set++
                }
            }
        }
    }
    if (set <= 0) {
        spread = []
        spreadt = 0
        spreadb = 0
        spreadl = 0
    }  

    player.tick()
}