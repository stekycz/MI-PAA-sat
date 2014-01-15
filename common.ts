///<reference path="./definitions/node.d.ts" />

import fs = require("fs");

/**
 * Returns modified value by callback or given default value if value is empty.
 */
export function get_option(value : any, default_value : any = null, value_format_callback : any = null) : any {
	if (value !== undefined && value !== null && value != "") {
		return value_format_callback === null
			? value
			: value_format_callback(value);
	}

	return default_value;
}

/**
 * Parses count of terms in instances in given file.
 */
export function parse_terms_count(filename : string) : number {
	return parseInt(filename.trim().replace(/^.*sat\./, '').replace(/\.inst\.dat$/, ''));
}

/**
 * Class for one term.
 */
export class Term {
	private _name : string;
	private _weight : number;

	constructor(private name : string, private weight : number) {
		this._name = name;
		this._weight = weight;
	}

	public getName() : string {
		return this._name;
	}

	public getWeight() : number {
		return this._weight;
	}

	public clone() : Term {
		return new Term(this._name, this._weight);
	}
}

/**
 * Class which contains one clause terms in one group.
 */
export class Clause {
	private _terms : Term[];
	private _negations;

	constructor(private terms : Term[], private negations) {
		this._terms = terms.slice(0);
		this._negations = negations;
	}

	public isTrue(values) : boolean {
		for (var i = 0; i < this._terms.length; i++) {
			if ((!this._negations[this._terms[i].getName()] && values[this._terms[i].getName()])
				|| (this._negations[this._terms[i].getName()] && !values[this._terms[i].getName()])
			) {
				return true;
			}
		}
		return false;
	}
}

/**
 * Class for one instance of the problem.
 */
export class Instance {
	private _id : number;
	private _terms : Term[];
	private _clauses : Clause[];

	constructor(private id : number, private terms : Term[], private clauses : Clause[]) {
		this._id = id;
		this._terms = terms.slice(0);
		this._clauses = clauses.slice(0);
	}

	public getId() : number {
		return this._id;
	}

	public getTerms() : Term[] {
		return this._terms.slice(0);
	}

	public getClauses() : Clause[] {
		return this._clauses.slice(0);
	}

	public isTrue(solution : Sat) : boolean {
		for (var i = 0; i < this._clauses.length; i++) {
			if (!this._clauses[i].isTrue(solution.getValues())) {
				return false;
			}
		}
		return true;
	}
}

/**
 * Class for one SAT (solution).
 */
export class Sat {
	private _weight : number;
	private _values;

	constructor(terms : Term[]) {
		this._weight = 0;
		this._values = {};
		for (var i = 0; i < terms.length; i++) {
			this._values[terms[i].getName()] = false;
		}
	}

	public clone() : Sat {
		var sat = new Sat([]);
		sat._values = {};
		for (var key in this._values) {
			sat._values[key] = this._values[key];
		}
		sat._weight = this._weight;
		return sat;
	}

	public getWeight() : number {
		return this._weight;
	}

	public getValues() {
		var values = {};
		for (var key in this._values) {
			values[key] = this._values[key];
		}
		return values;
	}

	public getValue(term : Term) {
		return this._values[term.getName()];
	}

	public toggleValue(term : Term) : Sat {
		if (this._values[term.getName()]) {
			this._values[term.getName()] = false;
			this._weight -= term.getWeight();
		} else {
			this._values[term.getName()] = true;
			this._weight += term.getWeight();
		}
		return this;
	}
}

/**
 * Parser of input files.
 */
class Parser {
	private _filepath : string;
	private _fileLoaded : boolean;
	private _data : any;
	private _index : number;

	constructor(private filepath : string) {
		this._filepath = filepath;
		this._fileLoaded = false;
		this._data = [];
		this._index = 0;
	}

	private _loadFileContent() {
		if (this._fileLoaded === false) {
			var rows = fs.readFileSync(this._filepath).toString("utf8").split(/\n/);
			var data = [];
			var loadingData = false;
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i].trim();
				if (row == '' || row.substring(0, 1) == 'c') {
					if (data.length > 0) {
						this._data.push(data);
						data = [];
					}
					loadingData = false;
				} else if (row.substring(0, 1) == 'p') {
					if (data.length > 0) {
						this._data.push(data);
						data = [];
					}
					loadingData = true;
				} else if (loadingData && row.substring(row.length - 1) == '0') {
					data.push(row.substring(0, row.length - 1).trim());
				}
			}
			this._fileLoaded = true;
		}
	}

	public hasNextInstance() : boolean {
		this._loadFileContent();

		return this._index < this._data.length;
	}

	public buildNextInstance() : Instance {
		this._loadFileContent();

		var id = this._index;
		var clauseStrings = this._data[this._index];

		var terms = {};
		var clauses : Clause[] = [];
		for(var i = 0; i < clauseStrings.length; i++) {
			var clauseParts : string[] = clauseStrings[i].split(/\s+/);
			var clauseTerms : Term[] = [];
			var negations = {};
			for (var j = 0; j < clauseParts.length; j++) {
				var term = terms[clauseParts[j]];
				var value = parseInt(clauseParts[j]);
				if (!term) {
					var termValue = value < 0 ? -1 * value : value;
					term = new Term("" + termValue, termValue);
					terms[term.getName()] = term;
				}
				clauseTerms.push(term);
				negations[term.getName()] = value < 0 ? true : false;
			}
			clauses.push(new Clause(clauseTerms, negations));
		}
		var termsInArray = [];
		for (var key in terms) {
			termsInArray.push(terms[key]);
		}

		var instance = new Instance(id, termsInArray, clauses);

		this._index += 1;

		return instance;
	}
}

/**
 * Handles formatting of output.
 */
export class OutputFormatter {
	public printSolution(instance : Instance, solution : Sat) {
		var terms_string = "";
		var instanceTerms = instance.getTerms();
		for (var i = 0; i < instanceTerms.length; i++) {
			terms_string += "\n" + instanceTerms[i].getName();
			if (solution.getValue(instanceTerms[i])) {
				terms_string += " => 1";
			} else {
				terms_string += " => 0";
			}
		}
		console.log(instance.getId() + " " + solution.getWeight() + "" + terms_string);
	}
}

/**
 * Basic interface for time measurement.
 */
export interface Timer {
	onBegin() : void;
	onFinish() : void;
}

/**
 * Timer which uses node.js library for time measurement.
 */
export class SystemTimer implements Timer {
	private _times : number[]; // In nanoseconds
	private _begin : number[];

	constructor() {
		this._times = [];
		this._begin = null;
	}

	public onBegin() : void {
		if (this._begin !== null) {
			throw new Error("Cannot begin measure when previous is not finished.");
		}

		this._begin = process.hrtime();
	}

	public onFinish() : void {
		if (this._begin === null) {
			throw new Error("Cannot finish measure when onBegin was not triggered first.");
		}

		var end = process.hrtime();
		var diff = (end[0] * 1e9 + end[1]) - (this._begin[0] * 1e9 + this._begin[1]);
		this._times.push(diff / 1e9);
		this._begin = null;
	}

	public getAverageTime() : number {
		var time = 0;
		for (var i = 0; i < this._times.length; i++) {
			time += this._times[i];
		}

		return time / this._times.length;
	}

	public getMinimumTime() : number {
		var times = this._times.slice(0);
		times.sort(function (a : number, b : number) : number {
			return a - b;
		});

		return times.shift();
	}

	public getMaximumTime() : number {
		var times = this._times.slice(0);
		times.sort(function (a : number, b : number) : number {
			return b - a;
		});

		return times.shift();
	}
}

/**
 * Abstract class for problem solving.
 */
export class ProblemSolver {
	private _timer : Timer;

	public setTimer(timer : Timer) : ProblemSolver {
		this._timer = timer;

		return this;
	}

	public findSolution(instance : Instance) : Sat {
		if (this._timer) {
			this._timer.onBegin();
		}

		var solution = this._find(instance);

		if (this._timer) {
			this._timer.onFinish();
		}

		return solution;
	}

	public _find(instance : Instance) : Sat {
		throw new Error('This method is abstract. Override it please.');
	}
}

/**
 * Runs solving of instances in given file using given solver and show output using next parameters.
 */
export function run(filepath : string, problemSolver : ProblemSolver, outputFormatter : OutputFormatter = null, timer : SystemTimer = null) {
	var name = parse_terms_count(filepath);
	var parser = new Parser(filepath);
	if (timer) {
		problemSolver.setTimer(timer);
	}

	while (parser.hasNextInstance()) {
		var instance = parser.buildNextInstance();
		var solution = problemSolver.findSolution(instance);
		if (outputFormatter) {
			outputFormatter.printSolution(instance, solution);
		}
	}

	if (timer) {
		var average_time = timer.getAverageTime();
		var min_time = timer.getMinimumTime();
		var max_time = timer.getMaximumTime();
		console.log(name + " " + average_time + " " + min_time + " " + max_time);
	}
}
