function manual_blacklist_check() {
	var blacklist = self.options.settings.prefs["yt-blacklist"].trim().split(/\s*,\s*/);
	return blacklist.every(function(item) { // if none match, return true, else false
		if (item == "*") // blacklist everything
			return false;
		if (item.match(/^\/.+?\/$/)) {// regexp
//DEBUG			//DEBUG console.log(item);
			return !document.URL.match(item);
		}
		if (item.match(/^\*\./) && !item.slice(1).match(/\*/)) { // wildcard domain
			var s_item = item.split(".");
			if (s_item.length < 2) // not valid domain (allow simply *.tld)
			  return true;
			var re_str = "/.*?";
			for (var i = 1; i < s_item.length; i++) {
				re_str += "\\." + s_item[i];
			}
			re_str += ".*/";
//DEBUG			//DEBUG console.log(re_str);
			return !document.URL.match(re_str);
		}
		return true;
	});
}
function isInIframe() {
	try {
		//DEBUG console.log("top:" + top);
		//DEBUG console.log("window: " + window);
		return top !== window;
	}
	catch (e) {
		return true;
	}
}
(function () {
	// this mod should not run in iframes. if necessary do manual blacklist check then exit if url is blacklisted
	if (isInIframe() || (self.options.manual_blacklist == true && manual_blacklist_check() != true)) 
		return;
console.log("flashmod called");
	this.getSrcParams = function( src ) {	
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
	var iframes = document.getElementsByTagName("iframe");
	for (var iframe of iframes) {
		if (iframe.src.match(/youtube\.(googleapis\.)?com/)) {
            if (!iframe.src.match(/html5=1/)) {
			iframe.src += (-1 === iframe.src.indexOf("?")) ? "?html5=1" : "&html5=1";
            }
            if (!self.options.settings.prefs["yt-clicktoplay-ext"]) {
                iframe.src += "&autoplay=1"
            }
            else {		
                iframe.src += "&autoplay=0"
            }
        }
	}
	var embeds = []; // create a static copy of selected DOM elements
	for (var embed of document.getElementsByTagName("embed")) {
		embeds.push(embed);
	}
	for (var embed of embeds) {
		if (embed.src.match(/youtube\.(googleapis\.)?com/)) {
			var video = embed.src.match(/\/v\/([^&]+)/);
			var playlist = embed.src.match(/\/p\/([^&]+)/);
			if (video || playlist) {
				var iframe = document.createElement("iframe");
				if (video && video[1]) {	// video ID is the first match within match
					iframe.src = "//www.youtube.com/embed/" + video[1] + "?html5=1";
					var params = this.getSrcParams(embed.src);
					if (params.list) {
						iframe.src += "&list=" + params.list;
					}
				}
				else if (playlist && playlist[1]) { // playlist ID is the first match within match
					iframe.src = "//www.youtube.com/embed/videoseries?list=" + playlist[1] + "&html5=1";
					var params = this.getSrcParams(embed.src);
					if (params.v) {
						iframe.src += "&v=" + params.v;
					}
				}
				else { 
					continue;
				}				
				if (!self.options.settings.prefs["yt-clicktoplay-ext"]) {
					iframe.src += "&autoplay=1"
				}
				else {		
					iframe.src += "&autoplay=0"
				}
				iframe.width = embed.width;
				iframe.height = embed.height;
				iframe.type = "text/html";
				iframe.frameBorder = "0";
				embed.parentNode.insertBefore(iframe, embed);
				embed.parentNode.removeChild(embed);
			}
			else {
			}
		}
	}
})();
