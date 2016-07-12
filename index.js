"use strict";

require('events').EventEmitter.prototype._maxListeners = Infinity;
const https = require("https");
const http = require("http");
const apiKey = process.env.api_key;

var data = "";
var json;
var deleteCounter = 0;
var totalCount = 0;

https.get('https://api.pinboard.in/v1/posts/all?format=json&auth_token=' + apiKey, (res) => {
      res.on('data', (d) => { data += d; });
      res.on('error', (e) => { console.error(e); });
      res.on('end', () => {
        console.log("I have " + JSON.parse(data).length + " bookmarks to check. Let´s start!");
        checkUrl(0, JSON.parse(data));
      });
}).on("error", () => { console.log("Unable to fetch bookmarks");});


var deleteFunction = (url, callback) => {
   var deleteUrl = 'https://api.pinboard.in/v1/posts/delete?url=' + url + '&auth_token=' + apiKey;
   https.get(deleteUrl, (r) => {
     console.log("[" + index + "/" + json.length + "] (404) " + json[index].href + " (DELETED)");
     deleteCounter++;
     callback();
   });
}

const httpCall = (caller, json, index) => {
  totalCount++;
   caller.get(json[index].href, (result) => {
      if(result.statusCode == 404){
        deleteFunction(entry.href, () => { checkUrl(++index, json) });
      }else if(result.statusCode == 301 || result.statusCode == 302){
        console.log("[" + index + "/" + json.length + "] (" + result.statusCode + ") " + json[index].href);
        json[index].href = result.headers.location;
        checkUrl(index, json);
      }else{
       console.log("[" + index + "/" + json.length + "] (" + result.statusCode + ") " + json[index].href);
       result.on('error', (e) => {
           deleteFunction(json[index].href, () => {checkUrl(++index, json);});
         });
       result.on('data', (e) => {});
       result.on('end', (e) =>  { checkUrl(++index, json);});
      }
   }).on("error", () =>{
       console.log("[" + index + "/" + json.length + "] (ERR) " + json[index].href);
       checkUrl(++index, json);
   });
}

function checkUrl(current, allLinks) {
  if(current >= allLinks.length){
    console.log("Checked " + totalCount + " urls");
    console.log("Deleted " + deleteCounter + " urls");
    return;
  }

  var entry = allLinks[current];
 try {
    if(entry.href.startsWith("https")){
      httpCall(https, allLinks, current);
    }else{
      httpCall(http, allLinks, current);
    }
 }catch(e){
   console.log(e);
   console.log("unable to reach " + entry.href );
   checkUrl(++current, allLinks);
 }
}



