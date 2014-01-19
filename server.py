import BaseHTTPServer
import subprocess
import urlparse
import os

HOST_NAME = ''
PORT_NUMBER = 8000
LOG_FILE = open('results.txt', 'a', 0)


class MyHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_HEAD(s):
        s.send_response(200)
        s.send_header("Content-type", "text/html")
        s.end_headers()
    def do_GET(s):
        """Respond to a GET request."""
        s.send_response(200)
        s.send_header("Content-type", "text/html")
        s.end_headers()
        params = urlparse.parse_qs(urlparse.urlparse(s.path).query)
        LOG_FILE.write("%s %s %s\n" % (params.get("browser", [None])[0], params.get("average", [None])[0], params.get("stderr", [None])[0]))
        # LOG_FILE.flush()
        s.wfile.write("<html><head><title>Title goes here.</title></head>")
        s.wfile.write("<body><p>This is a test.</p>")
        # If someone went to "http://something.somewhere.net/foo/bar/",
        # then s.path equals "/foo/bar/".
        s.wfile.write("<p>You accessed path: %s</p>" % s.path)
        s.wfile.write("</body></html>")
        pidfile = open('pid.lock','r')
        pid = pidfile.readline().strip()
        print "Killing pid %s" % pid
        # kp = subprocess.Popen(["kill", '-9', pid])
        # kp = subprocess.Popen(["pkill", '-9', 'firefox-bin'])
        kp = subprocess.Popen(["pkill", 'Chrom*'])
        kp.wait()
        kp = subprocess.Popen(["pkill", 'firefox-bin'])
        kp.wait()
        os.remove('pid.lock')

if __name__ == '__main__':
    server_class = BaseHTTPServer.HTTPServer
    httpd = server_class((HOST_NAME, PORT_NUMBER), MyHandler)
    print "Starting server..."
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    LOG_FILE.close()
    print "Shutting down..."