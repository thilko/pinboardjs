require('events').EventEmitter.prototype._maxListeners = Infinity;
const https = require("https");
const http = require("http");

var data = "";
var json;
var c = https.get('https://api.pinboard.in/v1/posts/all?format=json&auth_token=thilko:CC3DBDA67FC2060DE710', (res) => {
      res.on('data', (d) => { data += d; }); 
      res.on('error', (e) => { console.error(e); });
      res.on('end', () => { 
        json = JSON.parse(data); 

        checkUrl(0, json);
      });
});

function checkUrl(index, json) {
  var entry = json[index];
  if(entry.href.startsWith("https")){
     https.get(entry.href, (result) => {
        if(result.statusCode == 404){
         console.log("Broken link detected: " + entry.href);
         https.get('https://api.pinboard.in/v1/posts/delete?url=' + entry.href + '&auth_token=thilko:CC3DBDA67FC2060DE710', 
             (r) => { console.log("Delete result " + r.statusCode); });
        }else{
         console.log(result.statusCode + " " + entry.href);
         result.on('error', (e) => {console.error(e);}); 
         result.on('data', (e) => {});
         result.on('end', (e) =>  { checkUrl(++index, json);});
        }
     });
  }else if(entry.href.startsWith("http")){
     http.get(entry.href, (result) => {
        if(result.statusCode == 404){
         console.log("Broken link detected: " + entry.href);
         var deleteUrl ='https://api.pinboard.in/v1/posts/delete?url=' + entry.href + '&auth_token=thilko:CC3DBDA67FC2060DE710'; 
         https.get(deleteUrl, (r) => { console.log("Delete result " + r.statusCode); });
        
        }else{
         console.log(result.statusCode + " " + entry.href);
         result.on('error', (e) => {console.error(e);}); 
         result.on('data', (e) => {});
         result.on('end', (e) =>  { checkUrl(++index, json);});
        }
     });
  }else {
     console.log("bla"+entry.href);
  }
}
