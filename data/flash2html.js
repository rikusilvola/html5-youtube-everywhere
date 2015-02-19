(function () {
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