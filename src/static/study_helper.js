var ENTER = 13;

var note_cache = []
	, milliseconds_per_word = 1000;

$(document).ready(function() {
	initialize_event_handlers();
	// Start polling for any notes that were posted
	// since page render
	updater.poll();
	stream_notes(0);
});

function stream_notes(current_note) {
	if (current_note >= note_cache.length)
		current_note = 0;
	showNote(note_cache[current_note]);
	if (note_cache[current_note])
		var milliseconds_to_show_note = note_cache[current_note - 1] ? milliseconds_per_word * note_cache[current_note - 1].word_count : milliseconds_per_word * note_cache[0].word_count;
	else
		var milliseconds_to_show_note = milliseconds_per_word;
	current_note += 1;
	window.setTimeout(stream_notes, milliseconds_to_show_note, current_note);
}

function initialize_event_handlers() {
	$("#new_note_form").on("submit", function(event) {
		newNote($(this));
		return false;
	});
	$("#new_note_form").on("keypress", function(event) {
		if (event.keyCode === ENTER) {
			newNote($(this));
			return false;
		}
	});
}

function newNote(form) {
	var note = form.formToDict();
	$.postJSON("/a/note/new", note, function(response) {
		form.find("input[type=text]").val("").select();
	});
}

function addNoteToCache(response) {
	note_cache.push(response);
}

function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}

jQuery.postJSON = function(url, args, callback) {
    args._xsrf = getCookie("_xsrf");
    $.ajax({url: url, data: $.param(args), dataType: "text", type: "POST",
       success: function(response) {
        if (callback) 
        	callback(eval("(" + response + ")"));
    }, error: function(response) {
        console.log("ERROR:", response);
    }});
};

jQuery.fn.formToDict = function() {
    var fields = this.serializeArray();
    var json = {};
    for (var i = 0; i < fields.length; i++) {
        json[fields[i].name] = fields[i].value;
    }
    if (json.next) delete json.next;
    return json;
};

function showNote(note) {
	if (note) {
		var new_note = $(note.html);
		new_note.hide();
		$("#stream").html(new_note);
		new_note.slideDown();
	}
}

// Deals with doing live updates of any notes added by other users
var updater = {
    errorSleepTime: 500,
    cursor: null,

    poll: function() {
        var args = {"_xsrf": getCookie("_xsrf")};
        if (updater.cursor) args.cursor = updater.cursor;
        $.ajax({url: "/a/note/updates", type: "POST", dataType: "text",
                data: $.param(args), success: updater.onSuccess,
                error: updater.onError});
    },
    onSuccess: function(response) {
        try {
            updater.newNotesFromServer(JSON.parse(response));
        } catch (e) {
            updater.onError();
            return;
        }
        updater.errorSleepTime = 500;
        window.setTimeout(updater.poll, 0);
    },
    onError: function(response) {
        updater.errorSleepTime *= 2;
        console.log("Poll error; sleeping for", updater.errorSleepTime, "ms");
        window.setTimeout(updater.poll, updater.errorSleepTime);
    },
    newNotesFromServer: function(response) {
        if (!response.notes) return;
        updater.cursor = response.cursor;
        var notes = response.notes;
        updater.cursor = notes[notes.length - 1].id;
        console.log(notes.length, "new notes, cursor:", updater.cursor);
        for (var i = 0; i < notes.length; i++) {
            addNoteToCache(notes[i]);
        }
    }
};