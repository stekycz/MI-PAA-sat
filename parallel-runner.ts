///<reference path="./definitions/node.d.ts" />
///<reference path="./definitions/node-getopt.d.ts"/>

import os = require("os");
import fs = require("fs");
import child_process = require('child_process');
import common = require("./common");

var opt = require("node-getopt").create([
	['i', 'instances=ARG', 'directory with instances'],
	['j', 'jobs=ARG', 'count of parallel jobs'],
	['d', 'difficulty=ARG', 'count of maximum terms in one instance'],
	['t', 'test=ARG', 'turns correctness testing on'],
	['m', 'measure', 'turns time measure on']
])
.setHelp(
	"Usage: node app.js --instances=<instances>\n" +
	"\n" +
	"  -i, --instances=ARG   directory with instances\n" +
	"  -j, --jobs=ARG        count of parallel jobs\n" +
	"  -d, --difficulty=ARG  count of maximum items in one instance\n" +
	"  -t, --test=ARG        turns correctness testing on (using given path as directory with corrent results)\n" +
	"  -m, --measure         turns time measure on\n"
)
.bindHelp();

var options = opt.parseSystem();

var base_dir = common.get_option(options.options.instances, null);
if (base_dir === null) {
	console.info("Missing parameter instances\n");
	opt.showHelp();
	return 1;
}

var jobs = common.get_option(options.options.jobs, os.cpus().length, function (value : any) {
	return parseInt(value);
});

var files = fs.readdirSync(base_dir);
var max_items = common.get_option(options.options.difficulty, null);
if (max_items !== null) {
	files = files.filter(function (item : string) : boolean {
		return common.parse_terms_count(item) <= max_items;
	});
}

var test = common.get_option(options.options.test, null);
var time_measure = common.get_option(options.options.measure, false, function (value : any) : boolean {
	return true;
});

files.sort(function (a : string, b : string) : number {
	var num_a = common.parse_terms_count(a);
	var num_b = common.parse_terms_count(b);
	return num_b - num_a;
});

function writeLines(lines : string[]) : void {
	lines.sort(function (a : string, b : string) : number {
		var num_a = parseFloat(a.split(/\s+/).shift());
		var num_b = parseFloat(b.split(/\s+/).shift());
		return num_a - num_b;
	});
	for (var i = 0; i < lines.length; i++) {
		console.log(lines[i].trim());
	}
}

function build_command(filename : string) : string {
	var command = "node app.js -f " + base_dir + "/" + filename;
	if (time_measure) {
		command += " -m";
	} else if (test) {
		command += " -t | diff " + test + "/sat." + common.parse_terms_count(filename) + ".sol.dat -";
	}

	return command;
}

var results = [];
var childs = [];

function bindEvents(child : child_process.ChildProcess) : void {
	child.on("exit", function (code : number, signal : string) : void {
		var index = childs.indexOf(child);
		childs.splice(index, 1);
		runProcess();
	});
	child.on("close", function (code : number, signal : string) : void {
		if (childs.length <= 0) {
			writeLines(results);
		}
	});
}

function runProcess() : void {
	if (files.length <= 0) {
		return;
	}
	var filename = files.shift();
	var command = build_command(filename);
	var child = child_process.exec(command,
		function (error, stdout, stderr) : void {
			results.push("" + stdout);
		});
	bindEvents(child);
	childs.push(child);
}

for (var i = 0; i < jobs; i++) {
	runProcess();
}
