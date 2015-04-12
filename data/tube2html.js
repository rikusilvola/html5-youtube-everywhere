function insertVideoIframe(video, insertInto) {
	if (!insertInto) {
		return false;
	}
	var player = document.createElement("iframe");
	player.src = "//www.youtube.com/embed/";
	if (isPlaylistSite()) {
		player.src += "videoseries?list=" + getUrlParams().list + "&v=";
		// remove irrelevant sidebar as it refers to the old embed frame
		var sb = document.getElementById("watch7-sidebar-playlist");
		if (sb) {
			sb.remove();
		}
	}
	player.src += video;
	player.src += (-1 === player.src.indexOf("?")) ? "?html5=1" : "&html5=1";
	player.src += "&autoplay=1"
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
		doYoutube();
		bindObserver(); // rebind to catch further mutations
	}
});

function isPlaylistSite() {
	return !! (getUrlParams().list);
}

var mutationConfig = { childList: true };
	
function bindObserver() {		
	if (isPlaylistSite() && !self.options.settings.prefs["yt-experimental-playlist"]) {
		// Support for playlists only experimental after introduction of WebM player
		return;
	}
	if (self.options.settings.prefs["yt-html-youtube"]) {
		var addTo = document.getElementById("player-api") || document.getElementById("player-api-legacy");
		if (addTo) observer.observe(addTo, mutationConfig);
	}
}

bindObserver();

function getVideoFrameTitleHref(iframe) {
	var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
	var videohref = innerDoc.getElementsByClassName("html5-title-text");
	if (videohref.length != 0) {
		videohref = videohref[0].href;
	}
	else {
		videohref = 0;
	}
	return videohref;
}


// When clicking YouTube logo on YouTube the video has to be removed manually
// otherwise it will keep playing even though the frame is hidden
var oldLocation = location.href;
var videohref;
setInterval(function() {
	var URL = document.URL,
	fallbackIframe = document.getElementById("fallbackIframe");
	if(location.href != oldLocation) {
		if (fallbackIframe && URL.match(/youtube/) && !URL.match(/watch/)) {
			fallbackIframe.remove();
		}
		oldLocation = location.href
	}
	// iframe playlist does not trigger page refresh automatically so we must do it manually
	if (fallbackIframe && URL.match(/youtube/) && URL.match(/watch/)) {
		videohref = getVideoFrameTitleHref(fallbackIframe);
		if(videohref != "" && location.href != videohref) {
			console.log("videohref: " + videohref);
			console.log("location: " +  location.href);
			fallbackIframe.remove();
			oldlocation = videohref;
			location.href = videohref; 
		}
	}
}, 500); // check twice every second
