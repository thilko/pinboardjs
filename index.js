"use strict";

require('events').EventEmitter.prototype._maxListeners = Infinity;
const https = require("https");
const http = require("http");

var data = "";
var json;
var deleteCounter = 0;
var totalCount = 0;
var c = https.get('https://api.pinboard.in/v1/posts/all?format=json&auth_token=thilko:CC3DBDA67FC2060DE710', (res) => {
      res.on('data', (d) => { data += d; }); 
      res.on('error', (e) => { console.error(e); });
      res.on('end', () => { 
        console.log("I have " + JSON.parse(data).length + " bookmarks to check. Let´s start!");
        checkUrl(0, JSON.parse(data));
      });
}).on("error", () => { console.log("Unable to fetch bookmarks");});


var deleteFunction = (url, callback) => {
   console.log("Broken link detected: " + url);
   var deleteUrl ='https://api.pinboard.in/v1/posts/delete?url=' + url + '&auth_token=thilko:CC3DBDA67FC2060DE710'; 
   https.get(deleteUrl, (r) => { 
     console.log("Delete result " + r.statusCode);
     deleteCounter++;
     callback();
   });
}

const httpCall = (json, index) => {
  totalCount++;
   https.get(json[index].href, (result) => {
      if(result.statusCode == 404){
           deleteFunction(entry.href, () => {checkUrl(++index, json)}); 
      }else{
       console.log(result.statusCode + " " + json[index].href);
       result.on('error', (e) => {
           deleteFunction(json[index].href, () => {checkUrl(++index, json);}); 
         }); 
       result.on('data', (e) => {});
       result.on('end', (e) =>  { checkUrl(++index, json);});
      }
   }).on("error", () =>{ console.log("error"); checkUrl(++index, json);});
}

function checkUrl(index, json) {
  console.log(index + " " + json.length);
  if(index >= json.length){
    console.log("Checked " + totalCount + " urls");
    console.log("Deleted " + deleteCounter + " urls");
    return;
  }
  var entry = json[index];
     try {
        if(entry.href.startsWith("https")){
          httpCall(json, index);
        }else{
            totalCount++;
             http.get(entry.href, (result) => {
                if(result.statusCode == 404){
                     deleteFunction(entry.href, () => {checkUrl(++index, json)}); 
                }else{
                 console.log(result.statusCode + " " + entry.href);
                 result.on('error', (e) => {
                     deleteFunction(entry.href, () => {checkUrl(++index, json);}); 
                   }); 
                 result.on('data', (e) => {});
                 result.on('end', (e) =>  { checkUrl(++index, json);});
                }
             }).on("error", () => { console.log("error"); checkUrl(++index, json);});
        }
     }catch(e){
       console.log(e);
       console.log("unable to reach " + entry.href );
       checkUrl(++index, json);
     }
}



