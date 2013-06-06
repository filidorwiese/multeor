$(document).ready(function(){

	$.get('/high-score-public.json?' + new Date().getTime(), function(data) {
		var highScore = JSON.parse(data);
		if (highScore) {
			$('#high-score').text('The current high-score is ' + highScore.score + ' by ' + highScore.name + ', try to beat it!');
		}
	});

});
