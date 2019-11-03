const electron = require('electron');
const remote = electron.remote;
const fs = require('fs');
var session = '';
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {

	var path = remote.app.getPath('userData');
	var filepath = path + '/dataEncrypter.json';
	if (fs.existsSync(filepath)) {
		let rawdata = fs.readFileSync(filepath);
		let settings = JSON.parse(rawdata);

		$('[name=host]').val(settings.hostname);
		$('[name=username]').val(settings.username);
	} else {
		let settings = { 
		    hostname: '',
		    username: '', 
		    session: ''
		};
		 
		let data = JSON.stringify(settings);
		fs.writeFileSync(filepath, data);
	}

	$('.saveSettings').click(function() {
		// perform authentication to receive session
		$.ajax({
			url : $('[name=host]').val() + "api/connect",
			type : 'post',
			data : {
				username : $('[name=username]').val(),
				password : $('[name=password]').val()
			},
			success : function(result) {
				if(result != '') {
					// get session
					session = result;
					
					// save settings

					let settings = { 
						username : $('[name=username]').val(),
						password : $('[name=password]').val(),
					    session: session
					};
					 
					let data = JSON.stringify(settings);
					fs.writeFileSync(filepath, data);
				}
				$scope.$apply();
			},
			xhrFields: {
				withCredentials: true
			}
		});
		
		
		
	});

	/////////////////////////////////////////////
	
	$('#quitApp').click(function() {
		remote.app.exit();
	});

	$('.menu a').click(function(e) {
		e.preventDefault();
		var id = $(this).attr('data-id');
		$('.menu a').removeClass('active');
		$(this).addClass('active');
		$('[data-view]').hide();
		$('#' + id).show();
	});

	$('.menu a').eq(0).trigger('click');
})
