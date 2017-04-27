#!/usr/bin/env node

var escapeHTML = require("escape-html");
var jsdom = require("jsdom").jsdom;
var Readability = require("readability/index").Readability;
var spawn = require("child_process").spawn;

jsdom.env(process.argv[2], [], function(err, window) {
  if(err) return console.error(err);
  var document = window.document;

  var links = document.getElementsByTagName("a");
  for(var i = links.length - 1; i >= 0; i--) {
    var link = links[i];
    var href = link.getAttribute("href");
    if(link.textContent.trim() === "")
      link.parentNode.removeChild(link);
    if(href && href[0] === "#")
      link.removeAttribute("href");
  }

  var tables = document.getElementsByTagName("table");
  for(var i = tables.length - 1; i >= 0; i--) {
    var table = tables[i];
    if(table.rows.length === 1 && table.rows[0].cells.length === 1)
      table.outerHTML = table.rows[0].cells[0].innerHTML;
  }

  var items = document.getElementsByTagName("li");
  for(var i = items.length - 1; i >= 0; i--)
    items[i].removeAttribute("id");

  var waybackToolbar = document.getElementById("wm-ipp");
  if(waybackToolbar) waybackToolbar.parentNode.removeChild(waybackToolbar);

  var mwEdits = document.getElementsByClassName("mw-editsection");
  for(var i = mwEdits.length - 1; i >= 0; i--)
    mwEdits[i].parentNode.removeChild(mwEdits[i]);

  var content = document.documentElement.outerHTML;

  var loc = document.location;
  var uri = {
    spec: loc.href,
    host: loc.host,
    prePath: loc.protocol + "//" + loc.host,
    scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
    pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
  };
  var article = new Readability(uri, document).parse();

  if(article) {
    content = "<h1>" + escapeHTML(article.title) + "</h1>";
    content += article.content.replace(
      /<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, "$1");
  }

  spawn("pandoc", [
    "-f", "html",
    "-t", [
      "markdown",
      "-bracketed_spans",
      "-fenced_code_attributes",
      "-header_attributes",
      "-link_attributes",
      "-native_divs",
      "-native_spans",
      "-raw_html"
    ].join(""),
    "--atx-headers",
    "--reference-links",
    "--smart",
    "--wrap=none"
  ], {
    stdio: ["pipe", process.stdout]
  }).stdin.end(content);
});
