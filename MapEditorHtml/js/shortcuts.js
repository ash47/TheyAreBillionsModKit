function moveView() {
	var conMap = $('#mapDisplayHolder');

	
}

$(document).bind('keydown', 'left', function() {
	moveView('left');
});

$(document).bind('keydown', 'right', function() {
	moveView('right');
});

