var express = require("express");
var app = express();
var server = require("http").createServer(app);
var mongoose = require("mongoose");
var ObjectId = require('mongodb').ObjectID;
var aws = require("aws-sdk");
var s3 = new aws.S3();
var seedDb = require("./seeds");
var Page = require("./pages.js");
var io = require("socket.io")(server);
var _ = require('lodash');
var auth = require('http-auth');
var basic = auth.basic({
        realm: "Web."
    }, function (username, password, callback) { // Custom authentication method.
        callback(username === "blank" && password === "blank");
    }
);
var port = process.env.PORT || 3000;
var numUsers = 0;
var fundamental = 440;
var currLevel = 0;
var userIds = [];
var rooms = ["3harm", "5harm", "7harm", "11harm", "1band", "2band", "3band", "4band"];
var clients = [0,0,0,0,0,0,0,0];
//[mode,color,group #, fundamental, other, xfade time, (degree)]
var score = 
    [[[1,0,0,440,0,1],[1,0,1,440,0,1],[1,0,2,440,0,1],[1,0,3,440,0,1]], //0
    [[1,0,0,430,0,3],[1,0,1,538,0,3],[1,1,2,753.5,0,3],[1,1,3,591.75,0,3]], //1
    [[5,0,4,440,1,5,0],[5,2,5,450.1354,3,5,0],[5,1,6,460.1762,5,5,0],[5,3,7,470.9811,7,5,0]], //bell harmonics, 2
    [[0,0,4,440,1,5,0],[0,2,5,450.1354,3,5,0],[0,1,6,460.1762,5,5,0],[0,3,7,470.9811,7,5,0]], //3
    [[1,0,0,540,0,2],[1,0,1,540,0,2],[2,1,2,0,0,2],[2,1,3,2,0,2]], //4
    [[1,0,0,453,0,2],[1,0,1,453,0,2],[2,1,2,0,0,2],[2,1,3,2,0,2]], //5
    [[2,0,4,0,0,2],[2,1,5,2,0,2],[2,2,6,3,0,2],[2,3,7,1,0,2]], //6
    [[2,0,4,2.3,0,2],[2,1,5,2.5,0,2],[2,2,6,2.7,0,2],[2,3,7,2.9,0,2]], //7
    [[2,0,4,2.5,0,1],[3,1,5,880,1.029302,1],[3,2,6,1320,1.029302,1],[2,3,7,3,0,1]], //8
    [[3,0,4,1760,1.029302,3],[3,1,5,880,1.029302,3],[3,2,6,660,1.029302,3],[3,3,7,1320,1.029302,3]], //9
    [[3,3,4,2640,1.059463,5],[3,0,5,880,1.059463,5],[3,0,6,440,1.059463,5],[3,1,7,1760,1.059463,5]], //10
    [[3,3,4,1760,1,1],[3,0,5,440,1.00483,5],[3,0,6,440.5,1.00483,5],[3,1,7,440,1,1]], //pre-gliss, 11
    [[6,3,4,1760,440,30],[3,0,5,440,1.00483,1],[3,0,6,440.5,1.00483,1],[6,1,7,440,1760,30]], //step with glisses, 12
    [[4,2,4,2200,5,10],[5,0,5,440,5,10,0],[4,1,6,1320,5,10],[4,3,7,3080,5,10]], //13
    [[4,2,4,2200,5,10],[5,0,5,440,5,10,0],[4,1,6,1320,5,10],[4,3,7,3080,5,10]], //14, no change, but starts rotating
    [[4,2,4,2200,3,10],[5,0,5,440,5,10,1],[5,1,6,440,8,1],[4,3,7,3080,3,10]], //15
    [[4,2,4,2200,2,10],[5,0,5,440,5,10,3],[5,1,6,440,8, 3],[5,3,7,440,6,3]], //16
    [[7,2,4,440,3,20],[7,0,5,440,0,20],[7,1,6,440,1,20],[7,3,7,440,2,20]]]; //17
mongoose.connect("mongodb://blank:blank@ds137102.mlab.com:37102/heroku_pkffkvh4");
//seedDb();
app.set("view engine", "ejs");
server.listen(port, function(){
    console.log("server is running on port " + port);
});

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
    res.render("works");
});
app.get("/bio", function(req, res) {
    res.render("bio");
});
app.get("/cv", function(req, res) {
    res.render("cv");
});
app.get("/contact", function(req, res) {
    res.render("contact");
});
app.get("/pls", function(req, res) {
    res.render("home");
});
app.get("/master", auth.connect(basic), function(req, res) {
    res.render("master");
});
app.get("/works", function(req, res) {
    res.render("works");
});

app.get("/works/:id", function(req, res) {
    Page.findOne({_id: new ObjectId(req.params.id)}, function(err, foundPage) {
        if(err) {
            console.log(err);
        } else {
            try {
                var params = {
                  Bucket: "gkappes", 
                  Prefix: 'images/' + foundPage.image
                };
                var files = [];
                s3.listObjectsV2(params, function(err, data) {
                   if (err) console.log(err, err.stack); // an error occurred
                   else {
                        data["Contents"].forEach(function(el, i) {
                           files.push("https://s3.amazonaws.com/gkappes/" + el["Key"]);
                        });
                        res.render("detail", {page: foundPage, images: files});
                   }
                });
                
            } catch(err) {
                res.render("detail", {page: foundPage, images: []});
            }
        }
    })
})
app.get("/dreams", function(req, res) {
    res.render("dreams");
});

//API calls
app.get('/api/pages', function(req, res) {
    var condition = {};
    if(req.query.tags != undefined) {
        condition["tags"] = {$all:req.query.tags};
    }
    if(req.query.year != undefined) {
        condition["year"] = req.query.year;
    }
    Page.find(condition, function(err, pages) {

        if (err)
            res.send(err);

        res.json(pages);
    }).sort({importance: 1, year: -1});
});

io.on("connection", function(socket) {

    socket.on("add user", function() {
        numUsers++;
        userIds.push(socket.id);
        console.log(userIds);
        console.log("numUsers: " + numUsers);
        io.emit("new user", {
            username: socket.id,
            numUsers: numUsers
        });
        io.emit("update", {numUsers: numUsers});
    });
    socket.on("disconnect", function() {
        if(_.includes(userIds, socket.id)) {
            if(numUsers > 0) {
                --numUsers;
            }
            console.log("numUsers: " + numUsers +" "+socket.id);
            socket.broadcast.emit('user left', {
                username: socket.id,
                numUsers: numUsers
            });
            if(userIds.indexOf(socket.id) > -1) {
                userIds.splice(userIds.indexOf(socket.id), 1);
            }
            io.emit("update", {numUsers: numUsers});
            getClientCount();
        }
    });
    socket.on("reconnect", function() {
        numUsers++;
        console.log("numUsers(reconnect): " + numUsers);
        io.emit("update", {numUsers: numUsers});
        userIds.push(socket.id);
        io.emit("getRoom", {id: socket.id});
        getClientCount();
    });
    socket.on("change", function(data) {
        
        fundamental = data.fundamental;
        //clicked is a bool array corresponding to the rooms in the rooms array
        var clicked = data.rooms;
        clicked.forEach(function(el, i) {
            if(el) {
                io.to(rooms[i]).emit("fundamental", {
                    fundamental: data.fundamental
                });
            }
        });
    });
    socket.on("masterConnect", function() {
        io.emit("update", {numUsers: numUsers});
        socket.join("master");
    });
    socket.on("masterMode", function(data) {
        var clicked = data.rooms;
        clicked.forEach(function(el, i) {
            if(el) {
                io.to(rooms[i]).emit("mode", {mode: data.mode});
            }
        });
    });
    socket.on("masterColor", function(data) {
        var clicked = data.rooms;
        clicked.forEach(function(el, i) {
            if(el) {
                io.to(rooms[i]).emit("color", {color: data.color});
            }
        });
    });
    socket.on("masterFlash", function() {
        io.emit("flash");
    });
    socket.on("start", function() {
        //now passing id as parameter so that we can confirm we're getting the right client
        var limit, band;
        //assigning bands so that there are AT LEAST 4 people in each
        for(var i = 4; i < 8; i++) {
            if(clients[i] < 4) {
                band = i - 3;
                limit = clients[i] % 4;
                break;
            } else {
                band = 0;
            }
        }
        //this means that each band has at least 4 so we default to less strict ordering
        if(!band) {
            band = Math.ceil(Math.random() * 4);
            limit = userIds.indexOf(socket.id) % 4;
        }
        socket.join(rooms[limit]);
        socket.join(rooms[band+3]);
        io.emit("makeNoise", {
            fundamental: fundamental,
            id: socket.id,
            limit: limit,
            band: band
        });
        if (currLevel > 16) {
            currLevel = 16;
        }
        for(var i = 0; i < rooms.length; i++) {
            var sioRoom = io.sockets.adapter.rooms[rooms[i]];
            if( sioRoom ) { 
                clients[i] = io.sockets.adapter.rooms[rooms[i]].length;
                Object.keys(sioRoom.sockets).forEach( function(socketId){
                    console.log(rooms[i] + " client socket Id: " + socketId );
                    //sends the level of the score we currently are on
                    score[currLevel].forEach(function(el) {
                        if(rooms[el[2]] === rooms[i]) {
                            if(socketId === socket.id) {
                                io.sockets.connected[socketId].emit("level", {
                                    mode: el[0], 
                                    color: el[1], 
                                    fundamental: el[3],
                                    other: el[4],
                                    xfade: el[5],
                                    degree: el[6] ? el[6] : 0,
                                    level: currLevel
                                });
                            }
                        } else if(rooms[el[2]] === rooms[i]) {
                            if(socketId === socket.id) {
                                io.sockets.connected[socketId].emit("level", {
                                    mode: el[0], 
                                    color: el[1], 
                                    fundamental: el[3],
                                    other: el[4],
                                    xfade: el[5],
                                    degree: el[6] ? el[6] : 0,
                                    level: currLevel
                                });
                            }
                        }
                    });
              }); 
            } else {
                clients[i] = 0;
            }
        }
        console.log(clients);
        io.to("master").emit("clients", {clients: clients});
    });
    
    socket.on("mute", function() {
        io.emit("mute");
    });
    socket.on("error", (data) => {
        console.log(data);
    });
    socket.on("meow", function(data) {
        io.emit("meow", data);
        currLevel = data;
        if(data===18) {
            io.emit("finale", 30);
        } else {
            score[data].forEach(function(el) {
                var room = el[2];
                io.to(rooms[room]).emit("level", {
                    mode: el[0], 
                    color: el[1], 
                    fundamental: el[3],
                    other: el[4],
                    xfade: el[5],
                    degree: el[6] ? el[6] : 0,
                    level: currLevel
                });
            });
        }
    });
});

//function for shuffling elements in an array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getClientCount() {
    var clients = new Array(8);
    for(var i = 0; i < rooms.length; i++) {
            var sioRoom = io.sockets.adapter.rooms[rooms[i]];
            if( sioRoom ) { 
            clients[i] = io.sockets.adapter.rooms[rooms[i]].length;
        }   
    }
    console.log(clients);
    io.to("master").emit("clients", {clients: clients});
}
