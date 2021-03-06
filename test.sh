#!/bin/sh
export TZ=UTC
export PATH="$PWD/node_modules/.bin:$PATH"

./index.js server --unsafe-local --wrap=none & sleep 3
PID=$!

for file in test/md/*.md; do
    base=`basename $file .md`
    echo -n "$base... "

    href=""
    if [ -e test/input/$base.href ] && [ "$1" != "fast" ]; then
        href=`cat test/input/$base.href`
    elif [ -e test/input/$base.html ]; then
        href=test/input/$base.html
    elif [ -x test/input/$base.sh ] && [ "$1" != "fast" ]; then
        test/input/$base.sh > test.out
    elif [ -e readability/test/test-pages/$base/source.html ]; then
        href=readability/test/test-pages/$base/source.html
    fi

    if [ -n "$href" ]; then
        curl -s http://localhost:4343/text/$href > test.out
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
            kill -INT $PID
            sleep 1
            exit 1
        fi
    fi

    rm -f test.out
done

kill -INT $PID
sleep 1
