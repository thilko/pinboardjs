"use strict";

const https = require("https");
const http = require("http");
const url = require("url");

class Pinboard {
    constructor(){
      this.data = "";
      this.deleteCounter = 0;
      this.totalCount = 0;
      this.apiKey = process.env.api_key;
    }

    httpCall(caller, json, index){
      this.totalCount++;

      const opt = {
        hostname: url.parse(json[index].href).host,
        path: url.parse(json[index].href).path,
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*'
        }
      };

       const req = caller.request(opt, (result) => {
          if(result.statusCode == 404){
            this.deleteFunction(json, index, () => { this.checkUrl(++index, json) });
          }else if(result.statusCode == 301 || result.statusCode == 302){
            console.log("[" + index + "/" + json.length + "] (" + result.statusCode + ") " + json[index].href);
            json[index].href = result.headers.location;
            this.checkUrl(index, json);
          }else{
           console.log("[" + index + "/" + json.length + "] (" + result.statusCode + ") " + json[index].href);
           result.on('error', (e) => {
               this.deleteFunction(json, index, () => {this.checkUrl(++index, json);});
             });
           result.on('data', (e) => {});
           result.on('end', (e) =>  { this.checkUrl(++index, json);});
          }
       }).on("error", () =>{
           console.log("[" + index + "/" + json.length + "] (ERR) " + json[index].href);
           this.checkUrl(++index, json);
       });

       req.end();
    }

   checkUrl(current, allLinks) {
    if(current >= allLinks.length){
      console.log("Checked " + this.totalCount + " urls");
      console.log("Deleted " + this.deleteCounter + " urls");
      return;
    }

   var entry = allLinks[current];
   try {
      if(entry.href.startsWith("https")){
        this.httpCall(https, allLinks, current);
      }else{
        this.httpCall(http, allLinks, current);
      }
   }catch(e){
     console.log(e);
     console.log("unable to reach " + entry.href );
     this.checkUrl(++current, allLinks);
   }
  }

  scanBookmarks() {

    https.get('https://api.pinboard.in/v1/posts/all?format=json&auth_token=' + this.apiKey, (res) => {
          res.on('data', (d) => { this.data += d; });
          res.on('error', (e) => { console.error(e); });
          res.on('end', () => {
            console.log("I have " + JSON.parse(this.data).length + " bookmarks to check. Let´s start!");

            this.checkUrl(0, JSON.parse(this.data));
          });
    }).on("error", () => { console.log("Unable to fetch bookmarks");});


  }

   deleteFunction(json, index, callback) {
       var deleteUrl = 'https://api.pinboard.in/v1/posts/delete?url=' + json[index].href + '&auth_token=' + this.apiKey;
       https.get(deleteUrl, (r) => {
         console.log("[" + index + "/" + json.length + "] (404) " + json[index].href + " (DELETED)");
         this.deleteCounter++;
         callback();
       });
    }
}

module.exports = Pinboard;
