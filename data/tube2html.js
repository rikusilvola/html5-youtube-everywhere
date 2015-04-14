function insertVideoIframe(video, insertInto) {
	if (!insertInto) {
		return false;
	}
	var player = document.createElement("iframe");
	player.src = "//www.youtube.com/embed/";
	player.src += video;
	if (isPlaylistSite()) {
		player.src += "?list=" + getUrlParams().list;
		// remove irrelevant sidebar as it refers to the old embed frame
		var sb = document.getElementById("watch7-sidebar-playlist");
		if (sb) {
			sb.remove();
		}
	}
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
function getSrcParams(src) {	
    var query = src.replace(/^[^\?]+\??/,'');
    var Params = new Object ();
    if ( ! query ) return Params; // return empty object
    var Pairs = query.split(/[;&]/);
    for ( var i = 0; i < Pairs.length; i++ ) {
        var KeyVal = Pairs[i].split('=');
        if ( ! KeyVal || KeyVal.length != 2 ) continue;
        var key = unescape( KeyVal[0] );
        var val = unescape( KeyVal[1] );
        val = val.replace(/\+/g, ' ');
        Params[key] = val;
    }
    return Params;
}

mtx = 0;
function trylock() { return mtx; }
function lock() { while (trylock()) {} mtx = 1; }
function unlock() { mtx = 0; }
function doYoutube() {
	if (trylock()) return false;
	else lock();
	var url = getSrcParams(location.href);
	if(url && url.v) {
//DEBUG        console.log("inserting video id: " + url.v);
		var insertInto = document.getElementById("player-api") || document.getElementById("player-api-legacy");
		if (!insertInto) { 
			unlock(); 
//DEBUG            console.log("watch video frame not found");
			return false; 
		}
		var iframe = insertVideoIframe(url.v, insertInto); 
		if (!iframe) { 
			unlock();
//DEBUG            console.log("failed to insert watch video iframe");
			return false; 
		}
		// get rid of the overlay blocking access to player
		var tb = document.getElementById("theater-background");
		if (tb) tb.remove();
	}
	else {
		unlock();
//DEBUG        console.log("watch url or video id not found");
		return false;
	}
	unlock();
	return true;
}

function doChannel() {
	if (trylock()) 
        return false;
	else 
        lock();
    var video = document.getElementById("upsell-video");
    if (!video || !video.hasAttributes() || !video.attributes["data-video-id"]) {
//DEBUG        console.log("channel video frame not found or has no video id");
        unlock();
        return false;
    }
//DEBUG    console.log("id: " + video.attributes["data-video-id"].value);
//DEBUG    console.log("inserting video id: " + url.v);
    var iframe = insertVideoIframe(video.attributes["data-video-id"].value, video);
    if (!iframe) { 
        unlock();
//DEBUG        console.log("failed to insert channel video iframe");
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
		if (isChannelSite()) {
            doChannel();
        }
        else {
            doYoutube();
        }
		bindObserver(); // rebind to catch further mutations
	}
});

function isPlaylistSite() {
	return !! (getUrlParams().list);
}

function isChannelSite() {
    return document.URL.match(/youtube/) && document.URL.match(/channel/);
}

var mutationConfig = { childList: true };
	
function bindObserver() {		
	if (isPlaylistSite() && !self.options.settings.prefs["yt-experimental-playlist"]) {
		// Support for playlists only experimental after introduction of WebM player
		return;
	}
	if (self.options.settings.prefs["yt-html-youtube"]) {
        var addTo = (isChannelSite() ? document.getElementById("upsell-video") : document.getElementById("player-api") || document.getElementById("player-api-legacy"));
        if (addTo) {
            // first time has to be forced, observer then notices later scripted changes and reacts
            if (!document.getElementById("fallbackIframe")) {
                observer.disconnect();
                if (isChannelSite()) {
                    doChannel();
                }
                else {
                    doYoutube();
                }
            }
            observer.observe(addTo, mutationConfig);
        }
//DEBUG        else console.log("no video frame found");
	}
}

function getVideoFrameTitleHref(iframe) {
	var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
	var videohref = innerDoc.getElementsByClassName("html5-title-text") || innerDoc.getElementsByClassName("ytp-watermark");
	if (videohref.length != 0 && getSrcParams(videohref[0].href).v) {
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
var videohref, oldvideohref;
setInterval(function() {
	var URL = document.URL, 
        fallbackIframe;
    if (URL.match(/youtube/)) {
        fallbackIframe = document.getElementById("fallbackIframe");
        if(location.href != oldLocation) {
            oldLocation = location.href;
            if (fallbackIframe)
                fallbackIframe.remove();
        }
        // iframe playlist does not trigger page refresh automatically so we must do it manually
        else if (fallbackIframe && isPlaylistSite()) {
            videohref = getVideoFrameTitleHref(fallbackIframe);
            if(videohref != "") {
                if (!oldvideohref)
                    oldvideohref = videohref;
                else if (videohref != oldvideohref) {
//DEBUG                    console.log("videohref: " + videohref);
//DEBUG                    console.log("oldvideohref: " +  oldvideohref);
                    oldvideohref = videohref;
                    location.href = videohref;
                    return;
                }
            }
        }
        bindObserver();
    }
}, 500); // check twice every second