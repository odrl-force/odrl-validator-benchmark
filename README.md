# odrl-validator-benchmark
Benchmark to compare ODRL policy validators using a shared dataset of valid and invalid policies.

Validators compared:

- [odrl-validator](https://github.com/odrl-force/odrl-validator), commit `33a82d7`
- [odrlapi](https://github.com/oeg-upm/licensius/tree/master/odrlapi), commit `9949458`

The latest results are explained in [REPORT.md](REPORT.md). The detailed results are in [evaluation/results/summary.md](evaluation/results/summary.md).

## Structure

- `dataset/`: the policies, one folder per source, and `expected.json` with the expected result of each policy. Each folder has a README with the source and any changes.
- `validators/`: one folder per validator, with what is needed to run it on the whole dataset.
- `evaluation/`: compares the results of the validators with the expected ones. The output of the validators and of the comparison is in `evaluation/results/`.

## How to run

Requirements: git, Node 20 or newer, Java 11 or newer, and Maven.

```sh
git clone https://github.com/odrl-force/odrl-validator-benchmark.git
cd odrl-validator-benchmark
sh run-benchmark.sh
```

It takes about 6 minutes. The results are written to `evaluation/results/`, and the summary is printed at the end.

The script downloads each validator at a fixed commit, so everyone gets the same results:

- odrl-validator from GitHub, at the commit in `validators/odrl-validator/package.json`.
- odrlapi from the licensius repository, at the commit in `validators/odrlapi/setup.sh`. It is built locally with Maven.
