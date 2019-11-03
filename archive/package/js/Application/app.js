var app = angular.module('Application', []),
		gui = require('nw.gui'),
		crypt = require('crypto');
		assert = require('assert'),
		path = require('path'),
		clipboard = gui.Clipboard.get();
app.controller('AppCtrl', ['$scope', function ($scope) {
	
	var dirchooser = document.getElementById('dirchooser'),
			folderpath = document.getElementById('folderpath'),
			pgcontainer = document.getElementById('pgcontainer'),
			pglabel = document.getElementById('pglabel'),
			pgbar = document.getElementById('pgbar'),
			apparea = document.querySelector('.apparea');

	function changeFolderpath() {

		if(!angular.isUndefined(localStorage.path)) {
			folderpath.innerHTML = localStorage.path;
			folderpath.setAttribute('title', localStorage.path);
		}

	}

	function openDialog(cb) {
		pglabel.innerHTML = '';
		pgbar.style.width = '0';
		pgcontainer.style.opacity = 1;
		pgcontainer.style.display = "block";
		apparea.style.WebkitFilter = "blur(8px)";
		setTimeout(function() {
			cb();
		},800);
	}

	function closeDialog() {
		pgcontainer.style.opacity = 0;
		apparea.style.WebkitFilter = "blur(0px)";
		setTimeout(function() {
			pgcontainer.style.display = "none";
			$scope.cryption = false;
			$scope.servicelogin = false;
		},500);
	}

	function encodeFile(filesArray, index) {
		var len = filesArray.length,
				filepath = filesArray[index];

    if(len == index) {

    	closeDialog();
    	return;
    }

		if(path.extname(filepath) != '.de' && !/^\./g.test(path.basename(filepath)) != '.') {

			pglabel.innerHTML = path.basename(filepath) + " ( " + (index+1) + " / " + (len) + " )";
			pgbar.style.width = (parseFloat((index+1)/len)*100) + "%";

			setTimeout(function() {

				fs.readFile(filepath, function(err, data) {
				    if (err) {
				        console.log(err);
				    }

						var exec = require('child_process').exec;
						exec('openssl aes-256-cbc -in "'+filepath+'" -out "' + filepath+'.de" -pass pass:'+$scope.hash, function (error, stdout, stderr) {
							if (fs.existsSync(filepath+".de")) {
							  fs.unlink(filepath, function() {
									fs.rename(filepath+'.de', filepath, function(err) {
									    if ( err ) console.log('ERROR: ' + err);
									    encodeFile(filesArray, index+1);
									});
							  });
							} else {
								
							}
						});
						

				});

			},300);

		} else {
			encodeFile(filesArray, index+1);
		}
	}

	function decodeFile(filesArray, index) {
		var len = filesArray.length,
				filepath = filesArray[index];

    if(len == index) {

    	closeDialog();
    	return;
    }

		if(!/^\./g.test(path.basename(filepath)) != '.') {

			pglabel.innerHTML = path.basename(filepath) + " ( " + (index+1) + " / " + (len) + " )";
			pgbar.style.width = (parseFloat((index+1)/len)*100) + "%";

			setTimeout(function() {

				fs.readFile(filepath, function(err, data) {
				    if (err) {
				        console.log(err);
				    }

						var exec = require('child_process').exec;
						exec('openssl aes-256-cbc -d -in "'+filepath+'" -out "' + filepath+'.de" -pass pass:'+$scope.hash, function (error, stdout, stderr) {

							if(/bad decrypt/i.test(stderr)) {
									fs.unlink(filepath+'.de', function() {
										alert("Falsches Passwort!");
							    	closeDialog();
						    	});
						    	return;
							}

						  fs.unlink(filepath, function() {
								fs.rename(filepath+'.de', filepath, function(err) {
								    if ( err ) console.log('ERROR: ' + err);
								    decodeFile(filesArray, index+1);
								});
						  });
						});

				});

			},300);

		} else {
			decodeFile(filesArray, index+1);
		}
	}

	function genPass(length)
	{
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$%&§/=?+#-";

	    for( var i=0; i < length; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}

	function isEncoded() {
		var isEncrypted = fs.existsSync(localStorage.path+"/.dataencrypter");
		if(isEncrypted) {
			$('#isOpen').hide();
			$('#isNotOpen').show();
		} else {
			$('#isOpen').show();
			$('#isNotOpen').hide();
		}
		return isEncrypted;
	}

	$scope.close = function() {
		gui.App.quit();
	}

	$scope.upload = function() {
		if(isEncoded()) {
			openDialog(function() {

			});
		}
		else {
			alert("Der Ordner muss verschlüsselt sein.");
		}
	}

	$scope.disconnect = function() {
		$.ajax({
			url : $scope.host + "api/disconnect",
			type : 'post',
			data : {
			},
			success : function(result) {
				if(result == '1') {
					$scope.hash = '';
					$scope.connected = false;
				}
				$scope.$apply();
			},
			xhrFields: {
				withCredentials: true
			}
		});
	}

	$scope.connectToService = function() {
		$scope.hostname = $scope.host;
		$.ajax({
			url : $scope.host + "api/connect",
			type : 'post',
			data : {
				username : $scope.username,
				password : $scope.password
			},
			success : function(result) {
				if(result != '') {
					$scope.hash = result;
					$scope.closeTheDialog();
					$scope.connected = true;
				}
				$scope.$apply();
			},
			xhrFields: {
				withCredentials: true
			}
		});
	}

	$scope.closeTheDialog = function() {
		console.log('asd')
		closeDialog();
	}

	$scope.openConnectDialog = function() {
		$scope.servicelogin = true;
		openDialog(function() {

		});
	}

	$scope.choose_folder = function() {
		dirchooser.addEventListener("change", function(evt) {
      localStorage.path = this.value;
      changeFolderpath();
    }, false);
    dirchooser.click();  
	}

	$('textarea[ng-value="hash"]').bind('change paste input', function() {
		$scope.hash = $(this).val();
	}).trigger('change');

	$scope.generate_hash = function() {
		$scope.hash = genPass(32);
		$('textarea[ng-value="hash"]').val($scope.hash);
	}
	$scope.encode_folder = function() {
		if(!angular.isUndefined(localStorage.path)) {
			if(!angular.isUndefined($scope.hash) && $scope.hash != '') {
				$scope.cryption = true;
				openDialog(function() {
					
					fs.writeFile(localStorage.path+"/.dataencrypter", "", function(err) {
					    if(err) {
					        console.log(err);
					    } else {
					    	isEncoded();
								walk(localStorage.path, function(err, results) {
								  if (err) console.log(err);
								  encodeFile(results,0);
								});
					    }
					}); 
				});
			} else {
				alert('Es wurde kein Passwort angegeben.');
			}
		} else {
			alert('Es wurde keinen Pfad ausgewählt.');
		}
	}

	$scope.decode_folder = function() {
		if(!angular.isUndefined(localStorage.path)) {
			if(!angular.isUndefined($scope.hash) && $scope.hash != '') {
				openDialog(function() {

					if (fs.existsSync(localStorage.path+"/.dataencrypter")) {
					  fs.unlink(localStorage.path+"/.dataencrypter", function() {
					  	isEncoded();
					  });
				  }

					walk(localStorage.path, function(err, results) {
					  if (err) console.log(err);
					  decodeFile(results,0);
					});
				});
			} else {
				alert('Es wurde kein Passwort angegeben.');
			}
		} else {
			alert('Es wurde keinen Pfad ausgewählt.');
		}
	}

	isEncoded();

	changeFolderpath();

}]);