$("a.delete-button").bind("click", function(event) {
    bootbox.confirm(event.target.rel + "<br/>Are you sure?",
		    function(result) {
			if (result) {
			    $.post(event.target.href, '', function() {
				var el = $(event.target).parent().parent();
				el.fadeOut();
			    });
			}
		    });
});

