///<reference path="./definitions/node.d.ts" />
///<reference path="./definitions/node-getopt.d.ts"/>

import common = require("./common");

var opt = require("node-getopt").create([
	['i', 'instances', 'number of instances'],
	['t', 'terms', 'number of terms'],
	['r', 'ration', 'ration of the number of clauses to the number of terms'],
])
.setHelp(
	"Usage: node generator.js --instances=<instances> --terms=<terms> --ration=<ration>\n" +
	"\n" +
	"  -i, --instances     number of instances\n" +
	"  -t, --terms         number of terms\n" +
	"  -r, --ration        ration of the number of clauses to the number of terms\n"
)
.bindHelp();

var options = opt.parseSystem();

var instances = common.get_option(options.argv[0], null, function (value) {
	return parseInt(value);
});
if (instances === null) {
	console.info("Missing parameter instances\n");
	opt.showHelp();
	return 1;
}

var terms = common.get_option(options.argv[1], null, function (value) {
	return parseInt(value);
});
if (terms === null) {
	console.info("Missing parameter terms\n");
	opt.showHelp();
	return 1;
}

var ratio = common.get_option(options.argv[2], null, function (value) {
	return parseFloat(value);
});
if (ratio === null) {
	console.info("Missing parameter ratio\n");
	opt.showHelp();
	return 1;
}

var clauses = terms * ratio;
for (var i = 0; i < instances; i++) {
	console.log("p cnf " + terms + " " + clauses);

	var weights = "v";
	var term_names = [];
	for (var j = 0; j < terms; j++) {
		term_names.push("" + (j + 1));
		weights += " " + Math.ceil(Math.random() * 10 * ratio);
	}
	console.log(weights);

	for (var j = 0; j < clauses; j++) {
		var term_names_2 = term_names.slice(0);
		var clause = ""
		var terms_in_clause = 3;

		for (var t = 0; t < terms_in_clause; t++) {
			var term = Math.floor(Math.random() * term_names_2.length);
			clause += (Math.random() >= 0.5 ? "" : "-") + term_names_2[term] + " ";
			term_names_2 = term_names_2.slice(0, term).concat(term_names_2.slice(term + 1));
		}

		console.log(clause + "0");
	}
	console.log("");
}
