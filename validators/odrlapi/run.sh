#!/bin/sh
# Validates every policy (.ttl) in the dataset folder with odrlapi
# and writes the results to evaluation/results/odrlapi.csv.
# Each policy is validated in a new Java process, because odrlapi keeps state
# between validations and its result can depend on the policies validated before.
# Run setup.sh first.
# Usage, from the root of this repository: sh validators/odrlapi/run.sh
set -e
LIB=validators/odrlapi/licensius/odrlapi/target/odrlapi/WEB-INF
SEP=":"
case "$(uname)" in MINGW*|MSYS*|CYGWIN*) SEP=";" ;; esac

echo "file,valid,status,text" > evaluation/results/odrlapi.csv
for file in $(cd dataset && find . -name '*.ttl' | sed 's#^\./##' | sort); do
    jshell --class-path "$LIB/classes$SEP$LIB/lib/*" -R-Dfile="$file" validators/odrlapi/validate.jsh 2>/dev/null \
        | grep '^ROW:' | sed 's/^ROW://' >> evaluation/results/odrlapi.csv
    echo "$file"
done
