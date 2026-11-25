# SHACL shapes of odrl-multi-agent-llm

[odrl-multi-agent-llm](https://github.com/Daham-Mustaf/odrl-multi-agent-llm) by Daham Mustafa, commit `c701396`, generates
ODRL policies with LLMs. Its validator agent checks the generated policies with the SHACL shapes in
`backend/agents/validator/odrl_shapes.ttl`. The benchmark uses only these shapes, without any LLM, so the results are
always the same.

The shapes check the structure of a policy: at least one rule, an IRI action and target in each rule, the parts of a
constraint, the operands of a logical constraint, the assigner in an Offer, the assigner and assignee in an Agreement,
and a remedy without a consequence.

## How it is run

`setup.sh` downloads `odrl_shapes.ttl` at that commit and installs pyshacl (`requirements.txt`) in `.venv`. `run.py`
validates each policy as `shacl_validator.py` does (pyshacl, `inference="rdfs"`, `advanced=True`) and writes
`evaluation/results/odrl-multi-agent-shacl.csv`. Files that cannot be read are `Error`.

The shapes are used as they are, without changes.

## Things to know when reading the results

- The shape **"Policy must have exactly one IRI uid"** requires an `odrl:uid` triple in each policy. In Turtle the uid of a
  policy is its IRI (`<http://example.com/policy1> a odrl:Set`), and almost no policy of the dataset has that triple, so
  almost every policy is rejected. This is why it gets all the rdflicenses right (they are all invalid) and rejects most
  valid policies. Without this shape it would get 228/389 (59%) instead of 282/389 (72%), with 66 valid policies rejected
  instead of 106 and 95 invalid policies accepted instead of 1.

- The shapes use `sh:targetClass`, so they only check the nodes with an explicit type. A rule written as
  `odrl:permission [ odrl:action ... ]`, without `a odrl:Permission`, is not checked. This is why many permissions without
  target in rdflicenses are not detected.
- In an Agreement or Offer, the assigner and the assignee must be in each rule. A policy that has them at policy level
  (a compact policy, ODRL IM 2.7.1), like the TOSL policies, is rejected.
- The action must be an IRI, so an action with a refinement (`[ rdf:value odrl:use ; odrl:refinement ... ]`) is rejected.
