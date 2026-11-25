#!/bin/sh
# Downloads the SHACL shapes of odrl-multi-agent-llm at the commit used by the benchmark
# and installs pyshacl in a Python virtual environment.
# Requirements: curl and Python 3.10 or newer.
# Usage, from the root of this repository: sh validators/odrl-multi-agent-shacl/setup.sh
set -e
DIR=validators/odrl-multi-agent-shacl
VENV=$DIR/.venv
COMMIT=c7013963c1815d396384ad9243a13f78ef9281b4

if [ ! -f "$DIR/odrl_shapes.ttl" ] || [ "$(cat "$DIR/odrl_shapes.commit" 2>/dev/null)" != "$COMMIT" ]; then
    curl -sSfL "https://raw.githubusercontent.com/Daham-Mustaf/odrl-multi-agent-llm/$COMMIT/backend/agents/validator/odrl_shapes.ttl" -o "$DIR/odrl_shapes.ttl"
    echo "$COMMIT" > "$DIR/odrl_shapes.commit"
fi

if [ ! -x "$VENV/bin/python" ]; then
    python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install --quiet --disable-pip-version-check -r "$DIR/requirements.txt"
echo "The SHACL shapes of odrl-multi-agent-llm are ready."
