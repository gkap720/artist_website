var socket = io();
var step = 0;
var boolArr = [];
var rooms = ["3harm", "5harm", "7harm", "11harm", "1band", "2band", "3band", "4band"];
socket.emit("masterConnect");
$("#change").on("click", function() {
    var fundamental = $("#fundamental").val();
    var numUsers = $("#numUsers").val();
    socket.emit("change", {fundamental: fundamental, numUsers: numUsers, rooms: boolArr});
});
$("#hide").on("click", function() {
    socket.emit("masterHide", {rooms: boolArr});
});
$("#mute").on("click", function() {
    socket.emit("mute");
});
$("#add").on("click", function() {
    socket.emit("masterAdd", {rooms: boolArr});
});
$(".btn-group button").on("click", function() {
    $(this).toggleClass("active");
    $(".btn-group button").each(function(i){
        boolArr[i] = $(this).hasClass("active");
    });
});
$("#flash").on("click", () => {
    socket.emit("masterFlash");
});
$("#clicks").on("click", function() {
    socket.emit("masterMode", {mode: 2, rooms: boolArr});
});
$("#sines").on("click", function() {
    socket.emit("masterMode", {mode: 1, rooms: boolArr});
});

socket.on("update", function(data) {
    $("h1 span").text(data.numUsers);
});
socket.on("clients", function(data) {
    console.log(data.clients);
    for(var i = 0; i<rooms.length; i++) {
        if(data.clients[i]) {
            $("#" + rooms[i] + " span").text(data.clients[i]);
        } else {
            $("#" + rooms[i] + " span").text(0);
        }
    }
});

// $("#colors .btn").each(function(i, el) {
//     $(this).on("click", function() {
//         socket.emit("meow", i);
//     });
// });

$("#back_button").click(function() {
    step--;
    if (step < 0) {
        step = 0;
    }
    $("#count").text(step);
    console.log(step);
    socket.emit("meow", step);
});
$("#forward_button").click(function() {
    step++;
    if (step > 18) {
        step = 18;
    }
    $("#count").text(step);
    console.log(step);
    socket.emit("meow", step);
});
$("#reset_button").click(function() {
    step = 0;
    $("#count").text(step);
    console.log(step);
    socket.emit("meow", step);
});