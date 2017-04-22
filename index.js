#!/usr/bin/env node

var jsdom = require("jsdom").jsdom;
var Readability = require("readability/index").Readability;
var spawn = require("child_process").spawn;

jsdom.env(process.argv[2], [], function(err, window) {
  if(err) return console.error(err);
  var document = window.document;

  var loc = document.location;
  var uri = {
    spec: loc.href,
    host: loc.host,
    prePath: loc.protocol + "//" + loc.host,
    scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
    pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
  };
  var article = new Readability(uri, document).parse();

  if(!article) article = {
    title: document.title,
    content: document.documentElement.outerHTML
  };

  console.log("#", article.title.replace(/\s+/g, " ").trim());
  console.log("");

  spawn("pandoc", ["-f","html","-t","commonmark"], {
    stdio: ["pipe", process.stdout]
  }).stdin.end(article.content);
});
