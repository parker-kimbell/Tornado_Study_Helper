var ENTER = 13;

$(document).ready(function() {
	initialize_event_handlers();
	// Start polling for any note that were posted
	// since page render
	updater.poll();
});

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
		showNote(response);
		form.find("input[type=text]").val("").select();
	});
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
	var existing = $("#n" + note.id);
	if (existing.length > 0) return;
	var new_note = $(note.html);
	new_note.hide();
	$("#stream").append(new_note);
	new_note.slideDown();
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
            showNote(notes[i]);
        }
    }
};