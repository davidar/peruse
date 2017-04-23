#!/bin/sh

for file in test/*.md; do
    base=`basename $file .md`
    echo -n "$base... "
    ./index.js node_modules/readability/test/test-pages/$base/source.html > test.out 2>/dev/null
    if diff -q $file test.out >/dev/null; then
        echo PASS
    else
        echo FAIL
        diff $file test.out
        exit 1
    fi
    rm -f test.out
done
