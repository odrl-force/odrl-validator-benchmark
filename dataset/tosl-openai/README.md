# TOSL: OpenAI

The OpenAI Europe Terms of Use (2024), modelled with the [TOSL profile](https://w3id.org/tosl/): the whole terms and one file per rule.
Copied from [odrl-force/odrl-validator](https://github.com/odrl-force/odrl-validator), commit `e329d2f` (`data/profiles/tosl/openai`).

The expected results are in [expected.json](expected.json).

## Changes to the original files

The originals are kept in `original/`. The files in this folder are the corrected ones:

| File | What was wrong |
|---|---|
| openai_38_liability06.ttl | `:liability06` was not linked to the policy, so its constraint (`tosl:totalAmount`) was outside the policy, and the TOSL profile did not apply to it. We added `tosl:liability :liability06` to `:agreement01`, as the whole terms do with `:liability05`. The same link is also missing in `Europe_terms_of_use_2024.ttl` and in the [TOSL example](https://github.com/isa-group/tosl/blob/main/examples/openai/Europe_terms_of_use_2024.ttl). That file is expected to be invalid for other reasons, so it is not changed |
