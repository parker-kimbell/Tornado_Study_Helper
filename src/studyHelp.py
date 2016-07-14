import logging
import tornado.escape
import tornado.ioloop
import tornado.web
import os.path
import uuid

from tornado import gen
from tornado.concurrent import Future
from tornado.options import define, options, parse_command_line

define("port", default=3000, help="determines what port the app listens on", type=int)
define("debug", default=False, help="run in debug mode with verbose logging", type=bool)

class NotesBuffer(object):
	def __init__(self):
		self.waiters = set()
		self.cache = []
		self.cache_size = 200

	def wait_for_notes(self, cursor=None):
		result_future = Future()
		if cursor:
			new_count = 0
			for note in reversed(self.cache):
				if note["id"] == cursor:
					break
				new_count += 1
			if new_count:
				result_future.set_result(self.cache[-new_count:])
				return result_future
		# Add our future to the list of futures waiting for a result
		self.waiters.add(result_future)
		return result_future

	def cancel_wait(self, future):
		logging.info('in cancel wait')
		self.waiters.remove(future)
		future.set_result([])

	def new_note(self, notes):
		logging.info("Sending new note to %r listeners", len(self.waiters));
		for future in self.waiters:
			future.set_result(notes)
		self.waiters = set()
		self.cache.extend(notes);
		# keep only the latest cache_size notes
		if len(self.cache) > self.cache_size:
			self.cache = self.cache[-self.cache_size:]

global_note_buffer = NotesBuffer()

class MainHandler(tornado.web.RequestHandler):
	def get(self):
		self.render("index.html", notes=global_note_buffer.cache)

class NotesNewHandler(tornado.web.RequestHandler):
	def post(self):
		note = {
			"id" : str(uuid.uuid4()),
			"content" : self.get_argument("content")
		}
		note["html"] = tornado.escape.to_basestring(
			self.render_string("note.html", note=note))
		note["word_count"] = len(note["content"].split())
		if self.get_argument("next", None):
			self.redirect(self.get_argument("next"))
		else:
			# Note that lists are not converted to JSON because of a potential cross-site security vulnerability. All JSON output should be wrapped in a dictionary. More details at http://haacked.com/archive/2009/06/25/json-hijacking.aspx/ and https://github.com/facebook/tornado/issues/1009
			self.write(note)
		global_note_buffer.new_note([note])

class NotesUpdatesHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def post(self):
		# cursor is used to determine how many cached notes we need to return
		# to a client. Under some cases they may have missed several. Cursor tracks
		# where they last received a note
		cursor = self.get_argument("cursor", None)
		self.future = global_note_buffer.wait_for_notes(cursor=cursor)
		# Return here and continue execution once we have
		# finished waiting for our new notes
		notes = yield self.future
		if self.request.connection.stream.closed():
		    return
		self.write(dict(notes=notes))

	def on_connection_close(self):
	    global_note_buffer.cancel_wait(self.future)

def main():
	parse_command_line()
	#http://www.tornadoweb.org/en/stable/web.html#tornado.web.Application
	app = tornado.web.Application(
		[
			(r"/", MainHandler),
			(r"/a/note/new", NotesNewHandler),
			(r"/a/note/updates", NotesUpdatesHandler)
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