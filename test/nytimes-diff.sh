#!/bin/sh
./index.js diff https://web.archive.org/web/20121215032153/http://www.nytimes.com/2012/12/15/nyregion/shooting-reported-at-connecticut-elementary-school.html \
                https://web.archive.org/web/20121215055204/http://www.nytimes.com/2012/12/15/nyregion/shooting-reported-at-connecticut-elementary-school.html \
                --wrap=none
