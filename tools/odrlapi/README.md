# Running odrlapi locally

[odrlapi](https://github.com/oeg-upm/licensius/tree/master/odrlapi) is the ODRL validator behind https://odrlapi.appspot.com/.
Its web app does not start locally (dependency conflicts), so we call the validator directly from `jshell`, the Java console.
The results are the same as the online service. Nothing in the repository is modified.

Tested on macOS, October 2026.

## Requirements

- Java 11 or newer (`java -version`)
- Maven (`mvn -v`): on macOS `brew install maven`; on Windows see https://maven.apache.org/install.html

## 1. Get the code

```sh
git clone https://github.com/oeg-upm/licensius.git
cd licensius/odrlapi
```

## 2. Build (once)

```sh
mvn -q -DskipTests -Dmaven.compiler.release=8 package
```

It takes 1–2 minutes the first time. It worked if the file `target/odrlapi.war` exists.

## 3. Open jshell

From the `odrlapi` folder:

macOS / Linux:

```sh
jshell --class-path "target/odrlapi/WEB-INF/classes:target/odrlapi/WEB-INF/lib/*"
```

Windows (separator is `;`):

```sh
jshell --class-path "target/odrlapi/WEB-INF/classes;target/odrlapi/WEB-INF/lib/*"
```

## 4. Validate

Inside `jshell>`:

```java
import oeg.odrlapi.validator.ODRLValidator;
import java.nio.file.*;

ODRLValidator.validate(Files.readString(Path.of("src/main/webapp/samples/sample006")))
```

Output:

```
$3 ==> {"status":415,"valid":false,"text":"not valid. Rule in offer without assigner"}
```

- `valid`: whether the policy is valid
- `text`: the reason
- `status`: 200 if valid, 415 if not

The `SLF4J` warnings can be ignored.

To validate all the samples:

```java
var files = new java.io.File("src/main/webapp/samples").listFiles();
java.util.Arrays.sort(files);
for (var f : files)
    if (!f.getName().endsWith(".json"))
        System.out.println(f.getName() + " " + ODRLValidator.validate(Files.readString(f.toPath())));
```

Type `/exit` to quit.
