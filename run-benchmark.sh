#!/bin/sh
# Runs the whole benchmark: downloads the validators, validates the dataset with each one, and compares the results.
# Requirements: git, curl, Node 20 or newer, Java 11 or newer, Maven, and Python 3.10 or newer.
# Usage, from the root of this repository: sh run-benchmark.sh
set -e

# The time of each validator is saved in evaluation/results/times.csv.
# Only the validation is measured, not the download or the installation.
TIMES=evaluation/results/times.csv
echo "validator,seconds,files" > $TIMES
FILES=$(find dataset -name '*.ttl' | wc -l | tr -d ' ')
START=0
start() { START=$(date +%s); }
stop() { echo "$1,$(($(date +%s) - START)),$FILES" >> $TIMES; }

echo "1/5 Preparing odrlapi (downloaded and built only the first time)"
sh validators/odrlapi/setup.sh

echo "2/5 Installing odrl-validator and validating the dataset"
npm install --silent --prefix validators/odrl-validator
start
node validators/odrl-validator/run.js > /dev/null
stop odrl-validator

echo "3/5 Installing the SHACL shapes of odrl-multi-agent-llm and validating the dataset"
sh validators/odrl-multi-agent-shacl/setup.sh
start
validators/odrl-multi-agent-shacl/.venv/bin/python validators/odrl-multi-agent-shacl/run.py > /dev/null
stop odrl-multi-agent-shacl

echo "4/5 Validating the dataset with odrlapi (about 15 minutes)"
start
sh validators/odrlapi/run.sh
stop odrlapi

echo "5/5 Comparing the results"
node evaluation/compare.mjs
