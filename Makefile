QUICK_TERMS_COUNT = 20
TERMS_COUNT = 50

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
	make -s time-measure-quick > times.dat
	gnuplot graph.gplot

graph:
	make -s time-measure > times.dat
	gnuplot graph.gplot
