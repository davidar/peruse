#!/usr/bin/env node

var escapeHTML = require("escape-html");
var jsdom = require("jsdom").jsdom;
var Readability = require("readability/index").Readability;
var spawn = require("child_process").spawn;

function removeNode(node) {
  node.parentNode.removeChild(node);
}

function nonempty(node) {
  return node.textContent.trim() || node.querySelector("img");
}

jsdom.env(process.argv[2], [], function(err, window) {
  if(err) return console.error(err);
  var document = window.document;

  var links = document.getElementsByTagName("a");
  for(var i = links.length - 1; i >= 0; i--) {
    var link = links[i];
    var href = link.getAttribute("href");
    if(href && href[0] === "#")
      link.removeAttribute("href");
  }

  var links = document.querySelectorAll("pre a");
  for(var i = links.length - 1; i >= 0; i--) {
    var link = links[i];
    link.outerHTML = link.innerHTML;
  }

  var nodes = document.querySelectorAll("a, em, strong, b, i");
  for(var i = nodes.length - 1; i >= 0; i--) {
    var node = nodes[i];
    if(!nonempty(node))
      node.outerHTML = node.innerHTML;
  }

  var images = document.getElementsByTagName("img");
  for(var i = images.length - 1; i >= 0; i--) {
    var image = images[i];
    if(image.getAttribute("src") === "")
      removeNode(image);
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

  var codes = document.getElementsByTagName("code");
  for(var i = codes.length - 1; i >= 0; i--) {
    var code = codes[i];
    if(code.textContent.split("\n").length > 2)
      code.outerHTML = "<pre>" + code.outerHTML + "</pre>";
  }

  var svgs = document.getElementsByTagName("svg");
  for(var i = svgs.length - 1; i >= 0; i--) {
    var svg = svgs[i];
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var dataURI = "data:image/svg+xml," + encodeURIComponent(svg.outerHTML);
    svg.outerHTML = "<img src=\"" + dataURI + "\" />";
  }

  var breaks = document.querySelectorAll(
    "h1 br, h2 br, h3 br, h4 br, h5 br, h6 br");
  for(var i = breaks.length - 1; i >= 0; i--)
    breaks[i].outerHTML = " ";

  var waybackToolbar = document.getElementById("wm-ipp");
  if(waybackToolbar) removeNode(waybackToolbar);

  var mwEdits = document.getElementsByClassName("mw-editsection");
  for(var i = mwEdits.length - 1; i >= 0; i--)
    removeNode(mwEdits[i]);

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
    pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1),
  };
  var readability = new Readability(uri, document);
  var article = readability.parse();

  if(article) {
    content = "<h1>" + escapeHTML(article.title) + "</h1>";
    content += article.content.replace(
      /<(embed|iframe|video|audio) /g, "<img ").replace(
      /<p style="display: inline;" class="readability-styled">([^<]*)<\/p>/g, "$1");
  }

  var markdown = [
    "markdown",
    "-bracketed_spans",
    "-citations",
    "-escaped_line_breaks",
    "-fenced_code_attributes",
    "-fenced_divs",
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
