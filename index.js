"use strict";
const Pinboard = require("./pinboard.js");

const my = new Pinboard(process.env.api_key);
my.scanBookmarks();
