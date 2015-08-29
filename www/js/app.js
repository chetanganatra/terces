
// CG MKB


var mkbdb;

angular.module('mkb', ['ionic', 'ngCordova'])
.run(function ($ionicPlatform, $cordovaSQLite) {
	$ionicPlatform.ready(function () {
		if (window.StatusBar) {
			StatusBar.styleDefault();
		}
		mkbdb = $cordovaSQLite.openDB({
				name : "mkb.db",
				location : 0
			});
		$cordovaSQLite.execute(mkbdb, 'CREATE TABLE IF NOT EXISTS terces (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)');
	});
})
.config(function ($stateProvider, $urlRouterProvider) {
	$stateProvider
	.state('tabs', {
		url : "/tab",
		abstract : true,
		templateUrl : "tabs.html"
	})
	.state('reset', {
		url : '/reset',
		templateUrl : 'pub.html'
	})
	.state('deleteall', {
		url : '/deleteall',
		templateUrl : 'pub.html'
	})
	.state('about', {
		url : '/about',
		templateUrl : 'about.html'
	})
	.state('tabs.pub', {
		url : "/pub",
		views : {
			'public-tab' : {
				templateUrl : "pub.html"
			}
		}
	})
	.state('tabs.prof', {
		url : "/prof",
		views : {
			'professional-tab' : {
				templateUrl : "pro.html"
			}
		}
	})
	.state('tabs.per', {
		url : "/per",
		views : {
			'personal-tab' : {
				templateUrl : "per.html"
			}
		}
	})
	.state('login', {
		url : '/login',
		templateUrl : 'login.html',
	})
	.state('pass', {
		url : '/pass',
		templateUrl : 'pass.html',
	});
	if (window.localStorage.localSettings && JSON.parse(window.localStorage.localSettings).appPass) {
		$urlRouterProvider.otherwise('/login');
	} else {
		$urlRouterProvider.otherwise('/pass');
	}
})
.controller('mkbNavCtrl', function ($scope, $state, $ionicSideMenuDelegate, $ionicLoading, $ionicPopup, $ionicModal, $cordovaSQLite, $interval) {

	$scope.pwdList = JSON.parse(localStorage.getItem("pwdList"));
	$scope.docs = [];
	$scope.tabCat = 'PUB';
	$scope.tabTitle = ' ';
	$scope.firstRun = true;
	$scope.tmp = {
		currPassword : ""
	};
	$scope.enableSettings = false;
	$scope.userAuth = false;
	$scope.sigFill = Array.apply(null, Array(198)).map(String.prototype.valueOf, 'C6');
	$scope.platformAndroid = true;
	$scope.graceTime = 10000;
	$scope.graceCompleted = true;

	var localSettings = JSON.parse(localStorage.getItem("localSettings"));
	var terces = localStorage.getItem("terces");
	if (!localSettings) {
		var settings = {
			show : {
				checked : true
			},
			time : 500,
			logout : {
				checked : false
			},
			inactivity : 30,
			appPass : false
		};
		localStorage.setItem("localSettings", JSON.stringify(settings));
		localSettings = JSON.parse(localStorage.getItem("localSettings"));
		console.log("Setting Local:" + localSettings);
	}
	$scope.displayFlashPass = {
		checked : localSettings.show.checked
	};
	$scope.displayFlashTime = localSettings.time;
	$scope.autoLogout = {
		checked : localSettings.logout.checked
	};
	$scope.inactivity = localSettings.inactivity;
	$scope.formPass = {
		pass1 : "",
		pass2 : "",
		oldPass : ""
	};
	$scope.appPassword = "";
	$scope.appPassword_confirm = "";
	$scope.passFound = localSettings.appPass;
	console.log("PassFound:" + $scope.passFound);

	$scope.savePass = function () {
		var updateDbRecords = false;
		if ($scope.passFound) {
			if ($scope.formPass.oldPass == "") {
				$ionicLoading.show({
					template : "Provide Old password!",
					noBackdrop : true,
					duration : 1000
				});
				return;
			} else {
				if (!$scope.passVerify($scope.formPass.oldPass)) {
					$ionicLoading.show({
						template : "Old password mismatch!",
						noBackdrop : true,
						duration : 1000
					});
					return;
				} else
					updateDbRecords = true;
			}
		}
		if ($scope.formPass.pass1 == "" || $scope.formPass.pass2 == "") {
			$ionicLoading.show({
				template : "Blank passwords!",
				noBackdrop : true,
				duration : 1000
			});
			return;
		}
		if ($scope.formPass.pass1 != $scope.formPass.pass2) {
			$ionicLoading.show({
				template : "Password and Confirm-Password mismatch!",
				noBackdrop : true,
				duration : 1000
			});
			return;
		}

		localStorage.setItem("terces", CryptoJS.AES.encrypt("646576616775687961", $scope.formPass.pass1));
		$scope.passFound = true;
		$scope.storeSettings();

		if (updateDbRecords) {
			console.log("calling update with " + $scope.formPass.pass1)
			$scope.updateAllMKBs($scope.formPass.pass1);
		} else {
			window.location = 'index.html';
		}
	};

	$scope.storeSettings = function () {
		var settings = {
			show : $scope.displayFlashPass,
			time : $scope.displayFlashTime,
			logout : $scope.autoLogout,
			inactivity : $scope.inactivity,
			appPass : $scope.passFound
		};
		localStorage.setItem("localSettings", JSON.stringify(settings));
	};

	$scope.changeFlashTime = function (displayFlashTime) {
		$scope.displayFlashTime = displayFlashTime;
		$scope.storeSettings();
	};

	$scope.changeLogoutTime = function (logoutTime) {
		$scope.inactivity = logoutTime;
		$scope.storeSettings();
	};

	$scope.showFlashMsg = function (msg) {
		if ($scope.displayFlashPass.checked)
			$ionicLoading.show({
				template : msg,
				noBackdrop : true,
				duration : $scope.displayFlashTime
			});
	};

	$scope.showFlashMsgLong = function (msg) {
		$ionicLoading.show({
			template : msg,
			noBackdrop : true,
			duration : 2000
		});
	};

	$scope.showMenu = function () {
		$ionicSideMenuDelegate.toggleLeft();
	};
	$scope.showRightMenu = function () {
		$ionicSideMenuDelegate.toggleRight();
	};

	$scope.passVerify = function (currPassword) {
		try {
			var decodedText = CryptoJS.AES.decrypt(localStorage.getItem("terces"), currPassword).toString(CryptoJS.enc.Utf8);
		} catch (e) {
			$ionicLoading.show({
				template : "Unable to verify password!",
				noBackdrop : true,
				duration : 2000
			});
			return false;
		}
		if (decodedText == "646576616775687961")
			return true else
				return false
	};

	$scope.passSubmit = function (currPassword) {
		if ($scope.passVerify(currPassword)) {
			$scope.appPassword = currPassword;
			$scope.currPassword = $scope.sigFill;
			$ionicLoading.show({
				template : "Password Match!",
				noBackdrop : true,
				duration : 1000
			});
			$scope.enableSettings = true;
			$scope.userAuth = true;
			$scope.getAllMKBs();
			$state.go('tabs.pub', {}, {
				reload : true
			});
			console.log("Password Match");
		} else {
			$scope.enableSettings = false;
			$ionicLoading.show({
				template : "Password Mismatch!",
				noBackdrop : true,
				duration : 1000
			});
			console.log(currPassword);
			return;
		}
	};

	$scope.addCharToPass = function (char) {
		$scope.tmp.currPassword += char;
	}
	$scope.delLastChar = function (tmpPassword) {
		if (tmpPassword.length > 0)
			$scope.tmp.currPassword = tmpPassword.substr(0, tmpPassword.length - 1);
		return
		if ($scope.currPassword && $scope.currPassword.length > 0) {
			$scope.currPassword = $scope.currPassword.substr(0, $scope.currPassword.length - 1)
		}
	}

	$ionicSideMenuDelegate.toggleRight();

	$ionicModal.fromTemplateUrl('aed-mkb.html', {
		scope : $scope,
		animation : 'slide-in-up'
	}).then(function (modal) {
		$scope.modal = modal;
	});

	$ionicModal.fromTemplateUrl('pass.html', {
		scope : $scope,
		animation : 'slide-in-up'
	}).then(function (modal) {
		$scope.modalPass = modal;
	});

	$scope.setPass = function () {
		$scope.modalPass.show();
	}

	$scope.cancelModal = function () {
		$scope.modalPass.hide();
	}

	$scope.cancelAbout = function () {
		$state.go('tabs.pub', {}, {
			reload : true
		});
	}

	$scope.addMKB = function () {
		$scope.mkbItem = {};
		$scope.mkbItem.Cat = "PUB";
		$scope.mkbItem.Type = "SYS";
		$scope.mkbItem.Pass = "";
		$scope.mkbItem.Title = "";
		$scope.action = 'Add';
		$scope.isAdd = true;
		$scope.modal.show();
	};

	$scope.editMKB = function (currId) {
		console.log("Edit:: " + currId);
		$scope.currId = currId;
		$scope.mkbItem = {};
		var found = false;
		$scope.docs.forEach(function (doc) {
			if (doc.id == currId) {
				$scope.mkbItem.Cat = doc.cat;
				$scope.mkbItem.Pass = doc.pass;
				$scope.mkbItem.Type = doc.type;
				$scope.mkbItem.Title = doc.title;
				$scope.action = 'Edit';
				$scope.isAdd = false;
				$scope.modal.show();
				found = true;
			}
		});
		if (!found)
			$scope.showFlashMsgLong("Could not edit!");
	};

	$scope.cancelModal = function () {
		$scope.modal.hide();
	}

	$scope.tabSelected = function (tab) {
		$scope.tabCat = tab;
		if (tab == 'PER') {
			$state.go('tabs.per', {}, {
				reload : true
			});
			$scope.tabTitle = 'Personal';
		}
		if (tab == 'PRO') {
			$state.go('tabs.prof', {}, {
				reload : true
			});
			$scope.tabTitle = 'Professional';
		}
		if (tab == 'PUB') {
			$state.go('tabs.pub', {}, {
				reload : true
			});
			$scope.tabTitle = 'Public';
		}
	}

	$scope.updateAllMKBs = function (newPass) {
		if (!$scope.userAuth)
			return;
		var recordsToBeUpdated = $scope.docs.length;
		var recordsUpdated = 0;
		//$scope.getAllMKBs();
		$scope.docs.forEach(function (doc) {
			var currObj = {
				Cat : doc.cat,
				Pass : doc.pass,
				Type : doc.type,
				Title : doc.title
			};
			var newEncMsg = CryptoJS.AES.encrypt(JSON.stringify(currObj), newPass);
			$cordovaSQLite.execute(mkbdb, 'UPDATE terces SET message = ? WHERE ID = ?', [newEncMsg, doc.id])
			.then(function (result) {
				recordsUpdated++;
				if (recordsUpdated >= recordsToBeUpdated)
					window.location = 'index.html';
			}, function (error) {
				$scope.showFlashMsg("Error on saving: " + error.message);
				recordsUpdated++;
				if (recordsUpdated >= recordsToBeUpdated)
					window.location = 'index.html';
			});
		});

	};

	$scope.getAllMKBs = function () {
		if (!$scope.userAuth)
			return;
		$scope.pdocs = [];
		$scope.docs = [];
		$cordovaSQLite.execute(mkbdb, 'SELECT * FROM terces ORDER BY id DESC')
		.then(
			function (res) {
			if (res.rows.length > 0) {
				var failedRecords = 0;
				for (var i = 0; i < res.rows.length; i++) {
					try {
						var currMsg = JSON.parse(CryptoJS.AES.decrypt(res.rows.item(i).message, $scope.appPassword).toString(CryptoJS.enc.Utf8));
					} catch (e) {
						failedRecords++;
						continue;
					}
					if (currMsg.Cat && currMsg.Type) {
						var tmpObj = {
							id : res.rows.item(i).id,
							cat : currMsg.Cat,
							pass : currMsg.Pass,
							type : currMsg.Type,
							title : currMsg.Title
						};

						$scope.docs.push(tmpObj);
					}
				} // EndFor
				console.log("Failed Records to Get: " + failedRecords);
			}
		},
			function (error) {
			//$scope.showFlashMsgLong("Error on loading: " + error.message);
		});
	};

	$scope.addUpdateMKBitem = function () {
		if (!$scope.userAuth)
			return;
		if ((!$scope.mkbItem.Title) || $scope.mkbItem.Title == "") {
			$scope.showFlashMsgLong("Please provide title !");
			return;
		}
		if (!$scope.mkbItem.Pass) {
			$scope.mkbItem.Pass = "";
		}
		if (!$scope.mkbItem.Type) {
			$scope.mkbItem.Type = "SYS";
		}
		if (!$scope.mkbItem.Cat) {
			$scope.mkbItem.Cat = "PUB";
		}
		var newMessage = CryptoJS.AES.encrypt(JSON.stringify($scope.mkbItem), $scope.appPassword);
		if ($scope.action == 'Add') {
			$cordovaSQLite.execute(mkbdb, 'INSERT INTO terces (message) VALUES (?)', [newMessage])
			.then(function (result) {
				$scope.modal.hide();
				$scope.showFlashMsg("Message saved successful, cheers!");
				$scope.getAllMKBs();
				$scope.tabSelected($scope.mkbItem.Cat);
			}, function (error) {
				$scope.showFlashMsg("Error on saving: " + error.message);
			});
		} else {
			$cordovaSQLite.execute(mkbdb, 'UPDATE terces SET message = ? WHERE ID = ?', [newMessage, $scope.currId])
			.then(function (result) {
				$scope.modal.hide();
				$scope.showFlashMsg("Message saved successful, cheers!");
				$scope.getAllMKBs();
				$scope.tabSelected($scope.mkbItem.Cat);
			}, function (error) {
				$scope.showFlashMsg("Error on saving: " + error.message);
			});
		}
	}; // End addUpdateMKBitem

	$scope.deleteMKB = function () {
		if (!$scope.userAuth)
			return;
		$cordovaSQLite.execute(mkbdb, 'UPDATE terces SET message = ? WHERE ID = ?', [$scope.sigFill, $scope.currId])
		.then(function (result) {
			$cordovaSQLite.execute(mkbdb, 'DELETE FROM terces WHERE ID = ?', [$scope.currId])
			.then(function (result2) {
				$scope.modal.hide();
				$scope.showFlashMsg("Record Deleted!");
				$scope.getAllMKBs();
			}, function (error2) {
				$scope.modal.hide();
				$scope.showFlashMsgLong("Could not Delete!");
			});
		}, function (error) {
			$scope.modal.hide();
			$scope.showFlashMsg("Could not update/delete!");
		});
	}; // End $scope.deleteMKB

	$scope.deleteAllMKB = function () {
		if (!$scope.userAuth)
			return;
		$cordovaSQLite.execute(mkbdb, 'UPDATE terces SET message = ?', [$scope.sigFill])
		.then(function (result) {
			$cordovaSQLite.execute(mkbdb, 'DELETE FROM terces')
			.then(function (result) {
				$scope.modal.hide();
				$scope.showFlashMsg("Record Deleted!");
				$scope.getAllMKBs();
			}, function (error) {
				$scope.modal.hide();
				$scope.showFlashMsgLong("Could not Delete!");
			});
		}, function (error) {
			$scope.modal.hide();
			$scope.showFlashMsg("Could not update/delete!");
		});
	}; // End $scope.deleteAllMKB

	$scope.lastDigestRun = Date.now();
	$scope.lastDigestRunForFirstTime = true;

	var idleCheck = $interval(function () {
			if (!$scope.autoLogout.checked) {
				return;
			}
			var now = Date.now();
			if ($scope.lastDigestRunForFirstTime) {
				$scope.lastDigestRunForFirstTime = false;
				$scope.lastDigestRun = Date.now();
			}
			if (now - $scope.lastDigestRun > ($scope.inactivity - $scope.graceTime)) {
				$scope.lastDigestRun = Date.now();
				$scope.graceCompleted = false;
				$scope.logout(true);
			}
		}, 10 * 1000);

	$scope.stillActive = function () {
		$scope.lastDigestRun = Date.now();
		$scope.graceCompleted = false;
	};

	$scope.logout = function (withGracePeriod) {
		if (!$scope.userAuth)
			return;
		if (!withGracePeriod) {
			$scope.enableSettings = false;
			$scope.userAuth = false;
			$scope.appPassword = $scope.sigFill;
			if ($scope.platformAndroid)
				navigator.app.exitApp(); //window.location = 'index.html'; 	//
		} else {
			$scope.graceCompleted = true;
			$ionicLoading.show({
				template : "Exiting in 10 Sec...",
				noBackdrop : true,
				duration : 3000
			});
			var idleCheck = $interval(function () {
					if ($scope.graceCompleted) {
						$scope.enableSettings = false;
						$scope.userAuth = false;
						$scope.appPassword = $scope.sigFill;
						if ($scope.platformAndroid)
							navigator.app.exitApp(); //window.location = 'index.html'; 	//
					}
				}, 10 * 1000);
		}
	};

	$scope.deleteAllConfirm = function () {
		var confirmPopup = $ionicPopup.confirm({
				title : 'Delete All',
				template : 'Are you sure you want to delete all entries?'
			});
		confirmPopup.then(function (res) {
			if (res) {
				$scope.deleteAllMKB();
			} else {
				console.log('Not deleting.');
			}
		});
	};

	$scope.hex2a = function (hexx) {
		var hex = hexx.toString(); //force conversion
		var str = '';
		for (var i = 0; i < hex.length; i += 2)
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		return str;
	};

});


// End