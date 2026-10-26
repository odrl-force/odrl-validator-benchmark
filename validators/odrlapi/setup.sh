#!/bin/sh
# Downloads odrlapi (in the licensius repository) at the commit used by the benchmark and builds it.
# Requirements: git, Java 11 or newer, and Maven.
# Usage, from the root of this repository: sh validators/odrlapi/setup.sh
set -e
DIR=validators/odrlapi/licensius
COMMIT=9949458e6093105d650c79ce8084d26e7d28ae3a

# Download only that commit, not the whole history.
if [ ! -d "$DIR/.git" ]; then
    git init --quiet "$DIR"
    git -C "$DIR" remote add origin https://github.com/oeg-upm/licensius.git
fi
git -C "$DIR" fetch --quiet --depth 1 origin "$COMMIT"
git -C "$DIR" checkout --quiet FETCH_HEAD

# Build. It takes 1-2 minutes the first time.
(cd "$DIR/odrlapi" && mvn -q -DskipTests -Dmaven.compiler.release=8 package)
echo "odrlapi is ready."
