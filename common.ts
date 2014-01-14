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
	return parseFloat(filename.trim().replace(/^.*sat_/, '').replace(/_\d+(\.\d+)?\.inst\.dat$/, ''));
}

/**
 * Class for one elementary item in the problem.
 */
export class Item {
	private _weight : number;
	private _price : number;

	constructor(private weight : number, private price : number) {
		this._weight = weight;
		this._price = price;
	}

	public getPrice() : number {
		return this._price;
	}

	public setPrice(price : number) : Item {
		this._price = price;
		return this;
	}

	public getWeight() : number {
		return this._weight;
	}
}

/**
 * Class for one instance of the problem.
 */
export class Instance {
	private _id : number;
	private _maxWeight : number;
	private _items : Item[];

	constructor(private id : number, private maxWeight :number) {
		this._id = id;
		this._maxWeight = maxWeight;
		this._items = [];
	}

	public addItem(item : Item) : Instance {
		this._items.push(item);

		return this;
	}

	public getItems() : Item[] {
		return this._items;
	}

	public getId() : number {
		return this._id;
	}

	public getMaxWeight() : number {
		return this._maxWeight;
	}
}

/**
 * Parser of input files.
 */
class Parser {
	private _fileContent : string[];
	private _index : number;
	private _filepath : string;
	private _fileLoaded : boolean;

	constructor(private filepath : string) {
		this._fileContent = [];
		this._index = 0;
		this._filepath = filepath;
		this._fileLoaded = false;
	}

	private _loadFileContent() {
		if (this._fileLoaded === false) {
			var rows = fs.readFileSync(this._filepath).toString("utf8").split(/\n/);
			for (var i = 0; i < rows.length; i++) {
				if (rows[i].trim() != '') {
					this._fileContent.push(rows[i]);
				}
			}
			this._fileLoaded = true;
		}
	}

	public hasNextInstance() : boolean {
		this._loadFileContent();

		return this._index < this._fileContent.length;
	}

	public buildNextInstance() : Instance {
		this._loadFileContent();

		var fields = this._fileContent[this._index].split(/\s+/);
		var numbers = [];
		for(var i = 0; i < fields.length; i++) {
			numbers.push(parseInt(fields[i]));
		}

		var instance = new Instance(numbers[0], numbers[2]);
		for (var i = 0; i < numbers[1]; i++) {
			var index = 3 + (2 * i);
			var item = new Item(numbers[index], numbers[index + 1]);
			instance.addItem(item);
		}

		this._index += 1;

		return instance;
	}
}

/**
 * Class for one SAT (solution).
 */
export class Sat {
	private _weight : number;
	private _price : number;
	private _items : Item[];

	constructor() {
		this._reset();
	}

	public clone() : Sat {
		var knapsack = new Sat();
		knapsack._weight = this._weight;
		knapsack._price = this._price;
		knapsack._items = this._items.slice(0);
		return knapsack;
	}

	private _reset() : Sat {
		this._weight = 0;
		this._price = 0;
		this._items = [];

		return this;
	}

	private _itemIndex(item : Item) : number {
		return this._items.indexOf(item);
	}

	public contains(item : Item) : boolean {
    	return this._itemIndex(item) > -1;
	}

	public addItem(item : Item) : Sat {
		if (!this.contains(item)) {
			this._items.push(item);
			this._weight += item.getWeight();
			this._price += item.getPrice();
		}

		return this;
	}

	public removeItem(item : Item) : Sat {
		if (this.contains(item)) {
			var index = this._itemIndex(item);
			this._weight -= this._items[index].getWeight();
			this._price -= this._items[index].getPrice();
			this._items.splice(index, 1);
		}

		return this;
	}

	public setItems(items : Item[]) : Sat {
		this._reset();
		for (var i = 0; i < items.length; i++) {
			this.addItem(items[i]);
		}

		return this;
	}

	public getWeight() : number {
		return this._weight;
	}

	public getPrice() : number {
		return this._price;
	}

	public getItems() : Item[] {
		return this._items;
	}
}

/**
 * Handles formatting of output.
 */
export class OutputFormatter {
	public printSolution(instance : Instance, solution : Knapsack) {
		var items_string = "";
		var instanceItems = instance.getItems();
		for (var i = 0; i < instanceItems.length; i++) {
			if (solution.contains(instanceItems[i])) {
				items_string += " 1"
			} else {
				items_string += " 0"
			}
		}
		console.log(instance.getId() + " " + instance.getItems().length + " " + solution.getPrice() + " " + items_string);
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

	public findSolution(items : Item[], maxWeight : number) : Sat {
		if (this._timer) {
			this._timer.onBegin();
		}

		var solution = this._find(items.slice(0), maxWeight);

		if (this._timer) {
			this._timer.onFinish();
		}

		return solution;
	}

	public _find(items : Item[], maxWeight : number) : Sat {
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
		var solution = problemSolver.findSolution(instance.getItems(), instance.getMaxWeight());
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
