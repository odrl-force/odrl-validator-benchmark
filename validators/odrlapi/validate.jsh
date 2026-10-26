// Validates one policy with odrlapi and prints one CSV row: file,valid,status,text
// The file is given with -R-Dfile=<path relative to dataset/>. See run.sh.
import oeg.odrlapi.validator.ODRLValidator;
import java.nio.file.*;
import java.util.regex.*;

var file = System.getProperty("file");
var output = String.valueOf(ODRLValidator.validate(Files.readString(Path.of("dataset").resolve(file))));
var valid = Pattern.compile("\"valid\"\\s*:\\s*true").matcher(output).find();
var status = Pattern.compile("\"status\"\\s*:\\s*(\\d+)").matcher(output);
var text = Pattern.compile("\"text\"\\s*:\\s*\"(.*?)\"\\s*[,}]").matcher(output);
System.out.println("ROW:" + file + "," + valid + "," + (status.find() ? status.group(1) : "") + ",\""
    + (text.find() ? text.group(1) : output).replace("\"", "\"\"") + "\"");
/exit
