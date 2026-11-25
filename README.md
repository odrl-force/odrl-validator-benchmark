# odrl-validator-benchmark
Benchmark to compare ODRL policy validators using a shared dataset of valid and invalid policies.

Validators compared:

- [odrl-validator](https://github.com/odrl-force/odrl-validator), version 0.2.0 (commit `0e6b7e4`), with the TOSL and DPV-ODRL profiles
- [odrlapi](https://github.com/oeg-upm/licensius/tree/master/odrlapi), commit `9949458`
- The SHACL shapes of [odrl-multi-agent-llm](https://github.com/Daham-Mustaf/odrl-multi-agent-llm) (`odrl-multi-agent-shacl`), commit `c701396`, see [its README](validators/odrl-multi-agent-shacl/README.md)

The latest results are explained in [REPORT.md](REPORT.md). The detailed results are in [evaluation/results/summary.md](evaluation/results/summary.md).

## Structure

- `dataset/`: the policies, one folder per source. Each folder has an `expected.json` with the expected result of each policy, and a README with the source and any changes.

  | Folder | Policies | Source |
  |---|---|---|
  | [odrlapi-samples](dataset/odrlapi-samples) | 83 | Examples of odrlapi |
  | [elena-test](dataset/elena-test) | 11 | Tests of odrl-validator |
  | [odrl-evaluator-test-suite](dataset/odrl-evaluator-test-suite) | 29 | ODRL Test Suite (SolidLab) |
  | [odrl-dpv](dataset/odrl-dpv) | 29 | DPV-ODRL profile (SDS 2026) |
  | [tosl-elsevier](dataset/tosl-elsevier) | 17 | Elsevier API Service Agreement, TOSL profile |
  | [tosl-openai](dataset/tosl-openai) | 41 | OpenAI Europe Terms of Use, TOSL profile |
  | [rdflicenses](dataset/rdflicenses) | 179 | Licenses of Licensius |
- `validators/`: one folder per validator, with what is needed to run it on the whole dataset.
- `evaluation/`: compares the results of the validators with the expected ones. A policy counts as invalid when the validator reports a violation or a conflict; warnings do not count. The output of the validators and of the comparison is in `evaluation/results/`.

## How to run

Requirements: git, curl, Node 20 or newer, Java 11 or newer, Maven, and Python 3.10 or newer.

```sh
git clone https://github.com/odrl-force/odrl-validator-benchmark.git
cd odrl-validator-benchmark
sh run-benchmark.sh
```

It takes about 16 minutes. The results are written to `evaluation/results/`, and the summary is printed at the end.

The script downloads each validator at a fixed commit, so everyone gets the same results:

- odrl-validator from GitHub, at the commit in `validators/odrl-validator/package.json`.
- odrlapi from the licensius repository, at the commit in `validators/odrlapi/setup.sh`. It is built locally with Maven.
- The SHACL shapes of odrl-multi-agent-llm from GitHub, at the commit in `validators/odrl-multi-agent-shacl/setup.sh`. pyshacl is installed in a `.venv` folder inside that folder.

## License

The code of this repository is licensed under the [MIT License](LICENSE.md).

The policies in `dataset/` are copied from other projects and keep the license of their source:

| Folder | Source | License |
|---|---|---|
| odrlapi-samples, rdflicenses | [oeg-upm/licensius](https://github.com/oeg-upm/licensius) | MIT |
| elena-test | [odrl-force/odrl-validator](https://github.com/odrl-force/odrl-validator) | MIT |
| odrl-evaluator-test-suite | [SolidLabResearch/ODRL-Test-Suite](https://github.com/SolidLabResearch/ODRL-Test-Suite) | MIT |
| tosl-elsevier, tosl-openai | [isa-group/tosl](https://github.com/isa-group/tosl) | CC BY 4.0 |
| odrl-dpv | [besteves4/SDS2026-DPV-ODRL-mapping](https://github.com/besteves4/SDS2026-DPV-ODRL-mapping) | CC BY-SA 4.0 |

The validators are not copied into this repository: `run-benchmark.sh` downloads them. [odrl-multi-agent-llm](https://github.com/Daham-Mustaf/odrl-multi-agent-llm) is MIT.
