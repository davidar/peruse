#!/bin/sh
export TZ=UTC

for file in test/*.md; do
    base=`basename $file .md`
    echo -n "$base... "

    href=""
    if [ -e test/$base.href ] && [ "$1" != "fast" ]; then
        href=`cat test/$base.href`
    elif [ -e test/$base.html ]; then
        href=test/$base.html
    elif [ -x test/$base.sh ] && [ "$1" != "fast" ]; then
        test/$base.sh > test.out
    elif [ -e readability/test/test-pages/$base/source.html ]; then
        href=readability/test/test-pages/$base/source.html
    fi

    if [ -n "$href" ]; then
        ./index.js $href --atx-headers --wrap=none > test.out
    fi

    if [ -z "$href" ] && [ "$1" = "fast" ]; then
        echo SKIP
    elif diff -q $file test.out >/dev/null; then
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
