#!/bin/sh

for file in test/*.md; do
    base=`basename $file .md`
    echo -n "$base... "
    ./index.js readability/test/test-pages/$base/source.html \
        --atx-headers --wrap=none \
        | sed "s|$PWD|...|g" \
        > test.out
    if diff -q $file test.out >/dev/null; then
        echo PASS
    else
        echo FAIL
        diff $file test.out
        if [ "$1" = "update" ]; then
            mv -f test.out $file
        else
            exit 1
        fi
    fi
    rm -f test.out
done
