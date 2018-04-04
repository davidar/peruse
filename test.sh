#!/bin/sh
export TZ=UTC

for file in test/*.md; do
    base=`basename $file .md`
    echo -n "$base... "
    if [ -e test/$base.href ]; then
        href=`cat test/$base.href`
    elif [ -e test/$base.html ]; then
        href=test/$base.html
    else
        href=readability/test/test-pages/$base/source.html
    fi
    ./index.js $href --atx-headers --wrap=none > test.out
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
