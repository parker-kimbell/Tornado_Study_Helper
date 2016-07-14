var ENTER = 13;

$(document).ready(function() {
	initialize_event_handlers();
});

function initialize_event_handlers() {
	$("#new_note_form").on("submit", function(event) {
		event.stopPropagation();
		newNote($(this));
	});
	$("#new_note_form").on("keypress", function(event) {
		if (event.keyCode === ENTER) {
			event.stopPropagation();
			newNote($(this));
		}
	});
}

function newNote(form) {
	var note = form.formToDict();
	$.postJSON("/a/note/new", note, postNewNoteCB);
}

function postNewNoteCB(err, response) {
	if (err) {
		console.log('Error posting new note: ' + err);
		return;
	} else {
		showNote(response);
		form.find("input[type=text]").val("").select();
	}	
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
	var new_note = $(note.html);
	new_note.hide();
	$("#stream").append(new_note);
	new_note.slideDown();
}