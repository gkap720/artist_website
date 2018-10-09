var mongoose = require("mongoose");
var pageSchema = new mongoose.Schema({
    name: String,
    year: Number,
    image: String,
    description: String,
    video: String,
    profile: String,
    color: String,
    tags: [String],
    sound: String,
    thumbnail: String,
    importance: Number
});

module.exports = mongoose.model("Page", pageSchema);