#!/bin/sh
# Runs the whole benchmark: downloads the validators, validates the dataset with each one, and compares the results.
# Requirements: git, Node 20 or newer, Java 11 or newer, and Maven.
# Usage, from the root of this repository: sh run-benchmark.sh
set -e

echo "1/4 Downloading and building odrlapi"
sh validators/odrlapi/setup.sh

echo "2/4 Installing odrl-validator and validating the dataset"
npm install --silent --prefix validators/odrl-validator
node validators/odrl-validator/run.js > /dev/null

echo "3/4 Validating the dataset with odrlapi (about 5 minutes)"
sh validators/odrlapi/run.sh > /dev/null

echo "4/4 Comparing the results"
node evaluation/compare.mjs
