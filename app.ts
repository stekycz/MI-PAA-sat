///<reference path="./definitions/node.d.ts" />
///<reference path="./definitions/node-getopt.d.ts"/>

import common = require("./common");
import simulatedAnnealing = require("./simulated-annealing");

var opt = require("node-getopt").create([
	['f', 'filepath=ARG', 'path to file with testing instances'],
	['t', 'test', 'turns correctness testing on'],
	['m', 'measure', 'turns time measure on']
])
.setHelp(
	"Usage: node app.js --filepath=<filepath>\n" +
	"\n" +
	"  -f, --filepath=ARG  path to file with testing instances\n" +
	"  -t, --test          turns correctness testing on\n" +
	"  -m, --messure       turns time measure on\n"
)
.bindHelp();

var options = opt.parseSystem();

var filepath = common.get_option(options.options.filepath, null);
if (filepath === null) {
	console.info("Missing parameter filepath\n");
	opt.showHelp();
	return 1;
}

var strategy = simulatedAnnealing.create();

var outputFormatter = common.get_option(options.options.test, null, function (value : any) : common.OutputFormatter {
	return new common.OutputFormatter();
});

var timer = common.get_option(options.options.measure, null, function (value : any) : common.Timer {
	return new common.SystemTimer();
});

common.run(options.options.filepath, strategy, outputFormatter, timer);
