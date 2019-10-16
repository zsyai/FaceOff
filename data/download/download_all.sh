#!/bin/sh

URLList="urls.txt"
dirpath="../raw_data"
cnt=0

if [ ! -d $dirpath ];then
    mkdir $dirpath
fi

while read url
do
    echo "------------------------------------------"
    echo $cnt: $url
    phantomjs one_page.js $dirpath $cnt $url
    let "cnt++"
done < $URLList