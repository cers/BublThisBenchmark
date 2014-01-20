import subprocess
import glob
import os
import time
import shutil

fflist = glob.glob("/Users/Christian/Downloads/Firefox Installers/Unpacked/Firefox */Firefox.app/Contents/MacOS/firefox-bin")
chlist = glob.glob("/Users/Christian/Downloads/Chrome Installers/Unpacked/Chrom*/*Chrom*.app/Contents/MacOS/*Chrom*")

for browser in fflist+chlist:
	print browser
	if browser in fflist:
		sp = subprocess.Popen([browser, '-no-remote', '-p', 'benchmark'])
	elif browser in chlist:
		if os.path.isdir(".tmpProfile"):
			shutil.rmtree(".tmpProfile/", True)
		sp = subprocess.Popen([browser, '--user-data-dir=/Users/Christian/Projects/Benchmark/.tmpProfile/', '--no-default-browser-check', '--no-first-run', 'file:///Users/Christian/Projects/Benchmark/v2/benchmark.html'])
	else:
		print "WHAT THE HELL!"
	fd = open('pid.lock', 'w')
	print "Launched with pid %s" % sp.pid
	fd.write(str(sp.pid))
	fd.close()
	while os.path.isfile('pid.lock'):
		# sp.wait()
		time.sleep(1)

