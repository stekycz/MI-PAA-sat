import common = require("./common");

class SimulatedAnnealing extends common.ProblemSolver {
	public _find(instance : common.Instance) : common.Sat {
		var terms = instance.getTerms();
		var t = 5 * terms.length;
		var inner_loop_limit = terms.length;
		var solution = new common.Sat(terms);
		for (var i = 0; i < terms.length; i++) {
			if (i%2 == 0) {
				solution.toggleValue(terms[i]);
			}
		}
		// var iteration = 0;

		while (t > this.frozen()) {
			var i = 0;
			while (i < inner_loop_limit) {
				var next = this.randomNeighbour(solution, terms);
				var cost = solution.getWeight() - next.getWeight(); // Higher weight is better
				if ((cost < 0 || this.accept(cost, t)) && instance.isTrue(next)) {
					solution = next;
				}
				i++;
				// console.log(iteration + " " + solution.getWeight());
				// iteration++;
			}
			t = this.cool(t);
		}

		return solution;
	}

	private frozen() : number {
		return 4;
	}

	private randomNeighbour(solution : common.Sat, terms : common.Term[]) : common.Sat {
		var index = Math.floor(Math.random() * terms.length);
		var next = solution.clone();
		next.toggleValue(terms[index]);
		return next;
	}

	private accept(cost : number, t : number) : boolean {
		return Math.random() < Math.exp(-cost / t);
	}

	private cool(t : number) : number {
		return 0.99 * t;
	}
}

export function create() : common.ProblemSolver {
	return new SimulatedAnnealing();
}
