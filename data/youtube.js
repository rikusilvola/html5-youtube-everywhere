function insertVideoIframe(video, insertInto) {
	if (!insertInto) {
		return false;
	}
	var player = document.createElement("iframe");
	player.src = location.protocol + "//www.youtube.com/embed/" + video + "?rel=0";
    if (!player.src.match(/html5=1/)) {
        player.src += (-1 === player.src.indexOf("?")) ? "?html5=1" : "&html5=1";
    }
	if (isPlaylistSite()) {
		player.src += "&list=" + getUrlParams().list;
		// remove irrelevant sidebar as it refers to the old embed frame
		var sb = document.getElementById("watch7-sidebar-playlist");
		if (sb) {
			sb.remove();
		}
	}
	player.id = "fallbackIframe";
	player.width = "100%";
	player.height = "100%";
	player.setAttribute('allowfullscreen', '');

	// Remove all childern before inserting iframe
	while (insertInto.hasChildNodes()) {
		insertInto.removeChild(insertInto.firstChild);
	}
	insertInto.appendChild(player);
	return player;
}
 
// http://web.archive.org/web/20130807080443/http://www.techtricky.com/how-to-get-url-parameters-using-javascript/
function getUrlParams() {
	var params = {};
	window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
		params[key] = value;
	});
	return params;
}
mtx = 0;
function trylock() { return mtx; }
function lock() { while (trylock()) {} mtx = 1; }
function unlock() { mtx = 0; }
function doYoutube() {
	if (trylock()) return false;
	else lock();
	var url = getUrlParams();
	if(url && url.v) {
		var insertInto = document.getElementById("player-api") || document.getElementById("player-api-legacy");
		if (!insertInto) { 
			unlock(); 
			return false; 
		}
		var iframe = insertVideoIframe(url.v, insertInto); 
		if (!iframe) { 
			console.log("insertion failed");
			unlock();
			return false; 
		}
		// get rid of the overlay blocking access to player
		var tb = document.getElementById("theater-background");
		if (tb) tb.remove();
	}
	else {
		unlock();
		return false;
	}
	unlock();
	return true;
}

var observer = new MutationObserver(function(mutations) {
	var doTube = false;
	mutations.forEach(function(mutation) { 
		if (mutation.addedNodes.length > 0) // only replace when something was added
			doTube = true;
	});
	if (doTube && !trylock()) { // don't even try if already replacing
		this.disconnect(); // prevent triggering self
		//console.log("doYoutube"); 
		doYoutube();
		bindObserver(); // rebind to catch further mutations
	}
});

function isPlaylistSite() {
	return !! (getUrlParams().list);
}

var mutationConfig = { childList: true };
	
function bindObserver() {		
	if (self.options.settings.prefs["yt-force-iframe"]) {
		var addTo = document.getElementById("player-api") || document.getElementById("player-api-legacy");
		if (addTo) observer.observe(addTo, mutationConfig);
	}
}

bindObserver();
