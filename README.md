BublThisBenchmark
=================
Start server.py 
	note that it will try to kill any Firefox or Chrome browser after a 
	successful benchmark run; be sure to save any existing session. It 
	logs results to results.txt in the same path.

Edit the paths in benchmark.py to reflect the browsers you want to test.
Firefox tries to start in a profile called "benchmark" - you should 
configure this to automatically load benchmark.html (and not save/restore 
previous session)

Run benchmark.py
	note if a browser crashes before completing the run, you can restart
	it manually and the benchmarking should continue to work.

