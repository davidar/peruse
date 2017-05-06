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
    if(href && href[0] === "#")
      link.removeAttribute("href");

    var hasImage = false;
    for(var j = link.children.length - 1; j >= 0; j--) {
      var child = link.children[j];
      if(child && child.nodeName.toLowerCase() === "img")
        hasImage = true;
    }

    if(link.textContent.trim() === "" && !hasImage)
      link.parentNode.removeChild(link);
  }

  var links = document.querySelectorAll("pre a");
  for(var i = links.length - 1; i >= 0; i--) {
    var link = links[i];
    link.outerHTML = link.innerHTML;
  }

  var images = document.getElementsByTagName("img");
  for(var i = images.length - 1; i >= 0; i--) {
    var image = images[i];
    if(image.getAttribute("src") === "")
      image.parentNode.removeChild(image);
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

  var breaks = document.querySelectorAll(
    "h1 br, h2 br, h3 br, h4 br, h5 br, h6 br");
  for(var i = breaks.length - 1; i >= 0; i--)
    breaks[i].outerHTML = " ";

  var waybackToolbar = document.getElementById("wm-ipp");
  if(waybackToolbar) waybackToolbar.parentNode.removeChild(waybackToolbar);

  var mwEdits = document.getElementsByClassName("mw-editsection");
  for(var i = mwEdits.length - 1; i >= 0; i--)
    mwEdits[i].parentNode.removeChild(mwEdits[i]);

  var span;
  while((span = document.querySelector("span")))
    span.outerHTML = span.innerHTML;

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

  var markdown = [
    "markdown",
    "-bracketed_spans",
    "-citations",
    "-escaped_line_breaks",
    "-fenced_code_attributes",
    "-header_attributes",
    "-inline_code_attributes",
    "-link_attributes",
    "-multiline_tables",
    "-native_divs",
    "-native_spans",
    "-pipe_tables",
    "-raw_html",
    "-simple_tables",
  ].join("");

  var convert = spawn("pandoc", [
    "-f", "html",
    "-t", markdown + "-smart",
    "--reference-links",
  ], {
    stdio: ["pipe", "pipe", process.stderr]
  });

  var normalise = spawn("pandoc", [
    "-f", markdown,
    "-t", markdown + "-smart",
    "--reference-links",
  ].concat(process.argv.slice(3)), {
    stdio: ["pipe", process.stdout, process.stderr]
  });

  convert.stdin.end(content);
  convert.stdout.pipe(normalise.stdin);
});
