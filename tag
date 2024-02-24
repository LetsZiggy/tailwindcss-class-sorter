#!/bin/bash

# git tag
echo "${1}" | ( read version; echo "${version}" | sed 's/\.[0-9]\+$/\.\*/g' | ( read edited; git tag -a "v${version}" -m "tailwindcss ${edited} support"; ); )
