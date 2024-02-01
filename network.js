
var ws
var connected = false

var data = {x: 0, y: 0, frame: 1, angle: 0, scale: 1, ball: false}
var playerData = {}
var id = 0

var vid = ""
var vidLoaded = localStorage.getItem("id")
var letters = "abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRS0123456789"
if (vidLoaded) {
	vid = vidLoaded
} else {
	for (let i = 0; i < 8; i++) {
		vid += letters[Math.round(Math.random()*(letters.length-1))]
	}
	localStorage.setItem("id", vid)
}

function getViews() {
	ws.send(JSON.stringify({getViews: true}))
}

function sendMsg(sendData, bypass=false) {
	if (ws.readyState == WebSocket.OPEN && (connected || bypass)) {
		ws.send(JSON.stringify(sendData))
	}
}

var wConnect = false

function connectToServer() {
    console.log("Connecting...")
    if (ws) {
        if (ws.readyState == WebSocket.OPEN) {
			ws.close()
		}
    }
    connected = false
    id = 0
    ws = new WebSocket("wss://server.silverspace.online:443")

    ws.addEventListener("open", (event) => {
        sendMsg({connect: "platformer"}, true)
    })

    ws.addEventListener("message", (event) => {
        let msg = JSON.parse(event.data)
        if ("connected" in msg) {
            console.log("Connected!")
            connected = true
            id = msg.connected
            sendMsg({view: vid})
        }
        if ("ping" in msg && !document.hidden) {
            sendMsg({ping: true})
        }
        if ("views" in msg) {
            console.log(JSON.stringify(msg.views))
        }
        if ("data" in msg) {
            playerData = msg.data
            for (let player in playerData) {
                if ("frames" in playerData[player]) {
                    playerData[player].framesA = playerData[player].frames.length
                    playerData[player].framesT = 0
                }
            }
        }
    })

    ws.addEventListener("close", (event) => {
        console.log("Disconnected")
        wConnect = true
    })
}

connectToServer()

setInterval(() => {
    data = {
        x: Math.round(player.x*100)/100,
        y: Math.round(player.y*100)/100,
        frames: player.frames,
        angle: player.angle,
        scale: player.ball ? player.ballDir : player.dir,
        ball: player.ball
    }
    player.frames = []
    sendMsg({data: data})
}, 1000/10)