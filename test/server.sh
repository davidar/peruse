#!/bin/sh
./index.js server >&2 &
sleep 5
curl http://localhost:4343/html/https://www.atlasobscura.com/articles/musical-cryptography-codes
kill -INT $!
