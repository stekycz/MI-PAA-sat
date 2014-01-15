QUICK_TERMS_COUNT = 3
TERMS_COUNT = 10

# Compilation

all:
	tsc --module commonjs common.ts simulated-annealing.ts app.ts parallel-runner.ts

clean:
	rm *.js

# Tests

test: all
	node parallel-runner.js -i ./zadani -d $(QUICK_TERMS_COUNT) -t ./reseni

# Measure

time-measure-quick: all
	node parallel-runner.js -i ./zadani -d $(QUICK_TERMS_COUNT) -m

time-measure: all
	node parallel-runner.js -i ./zadani -d $(TERMS_COUNT) -m

graph-quick:
	make -s time-measure-quick > graphs/times.dat
	gnuplot graphs/graph.gplot

graph:
	make -s time-measure > graphs/times.dat
	gnuplot graphs/graph.gplot
