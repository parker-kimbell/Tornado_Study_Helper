import tornado.ioloop
import tornado.web
import os.path

from tornado.options import define, options, parse_command_line


define("port", default=3000, help="determines what port the app listens on", type=int)
define("debug", default=False, help="run in debug mode with verbose logging", type=bool)

# class NotesBuffer(object):
# 	def __init__(self):
# 		self.waiters = set()
# 		self.cache = []
# 		self.cache_size = 200

# 	def wait_for_notes

class MainHandler(tornado.web.RequestHandler):
	def get(self):
		self.render("index.html")#, notes=global_notes_buffer.cache

# class NotesHandler(tornado.web.RequestHandler):
# 	def get(self):
# 		self.render("notes.html")

def main():
	parse_command_line()
	#http://www.tornadoweb.org/en/stable/web.html#tornado.web.Application
	app=tornado.web.Application(
		[
			(r"/", MainHandler),
			],
		cookie_secret="studdy_buddy",
		template_path=os.path.join(os.path.dirname(__file__), "templates"),
		static_path=os.path.join(os.path.dirname(__file__), "static"),
		xsrf_cookies=True,
		debug=options.debug
		)
	app.listen(options.port)
	tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
	main()