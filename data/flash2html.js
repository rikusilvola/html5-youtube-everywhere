var iframeObserver, embedObserver;
function srcHasOptions (src) {
    "use strict";
    return (-1 === src.indexOf("?"));
};
function getSrcParams (src) {
    "use strict";
    var query = src.replace(/^[^\?]+\??/, ''),
        Params = {},
        Pairs,
        i,
        KeyVal,
        key,
        val;
    if (!query) {
        return Params; // return empty object
    }
    Pairs = query.split(/[;&]/);
    for (i = 0; i < Pairs.length; i++) {
        KeyVal = Pairs[i].split('=');
        if (KeyVal && KeyVal.length == 2) {
            key = decodeURIComponent(KeyVal[0]);
            val = decodeURIComponent(KeyVal[1]);
            val = val.replace(/\+/g, ' ');
            Params[key] = val;
        }
    }
    return Params;
};
function clickToPlayEnabled () {
    "use strict";
    var clicktoplay = false;
    if (document.URL.match(/youtube\.?com/)) {
        clicktoplay = self.options.settings.prefs["yt-clicktoplay"];
    } else {
        clicktoplay = self.options.settings.prefs["yt-clicktoplay-ext"];
    }
    return clicktoplay;
};
function addSrcOptions (src) {
    "use strict";
    var srcToConcat = "";
    if (src.match(/youtube\.(googleapis\.)?com/)) {
        var firstOption = srcHasOptions(src);
        if (!src.match(/html5=1/)) {
            srcToConcat += firstOption ? "?html5=1" : "&html5=1";
            firstOption = false;
        }
        if (clickToPlayEnabled() && !src.match(/autoplay=0/)) {
            srcToConcat += firstOption ? "?autoplay=0" : "&autoplay=0";
            firstOption = false;
        } else if (!clickToPlayEnabled() && !src.match(/autoplay=1/)) {
            srcToConcat += firstOption ? "?autoplay=1" : "&autoplay=1";
            firstOption = false;
        }
    }
    return srcToConcat // did we ad any?
};
/* not used */
function replaceNode (newNode, oldNode) {
    "use strict";
    if (oldNode.parentNode) {
        oldNode.parentNode.insertBefore(newNode, oldNode);
        oldNode.parentNode.removeChild(oldNode);
    } else {
        oldNode.nodeValue = newNode.nodeValue;
    }
}
function replaceEmbedYouTubeFlashPlayer (embed) {
    var video,
    	playlist,
    	params,
	iframe;
    if (embed.src.match(/youtube\.(googleapis\.)?com/)) {
	video = embed.src.match(/\/v\/([^&]+)/);
	playlist = embed.src.match(/\/p\/([^&]+)/);
	if (video || playlist) {
		iframe = document.createElement("iframe");
                if (video && video[1]) {    // video ID is the first match within match
                    iframe.src = "//www.youtube.com/embed/" + video[1];
                    params = getSrcParams(embed.src);
                    if (params.list) {
                        iframe.src += "?list=" + params.list;
                    }
                } else if (playlist && playlist[1]) { // playlist ID is the first match within match
                    iframe.src = "//www.youtube.com/embed/videoseries?list=" + playlist[1];
                    params = getSrcParams(embed.src);
                    if (params.v) {
                        iframe.src += "&v=" + params.v;
                    }
                }
                if (iframe.src) {
		    if (!self.options.settings.prefs["yt-dynamic-player-replace"]) {
		    	iframe.src += addSrcOptions(iframe.src); // add options here if dynamic replace disabled
		    }
		    console.log(iframe.src);
                    iframe.width = embed.width;
                    iframe.height = embed.height;
                    iframe.type = "text/html";
                    iframe.frameBorder = "0";
                    embed.parentNode.insertBefore(iframe, embed);
                    embed.parentNode.removeChild(embed);
		}
        }
    }
}
if (self.options.settings.prefs["yt-dynamic-player-replace"]) {
	// init iframe mutation summary
	iframeObserver = new MutationSummary({
		callback: function (summaries) {
				summaries.forEach(function (summary) {
					var srcToConcat = "";
					summary["added"].forEach(function (node) {
						srcToConcat = addSrcOptions(node.src);
						if (srcToConcat) { // don't cause a reflow for nothing
							node.src += srcToConcat;
						}
					});
				});
		    },
		queries: [
		{ element: "iframe" }
		]
	});
}
if (self.options.settings.prefs["yt-dynamic-player-replace"]) {
	// init embed mutation summary
	embedObserver = new MutationSummary({
		callback: function (summaries) {
				summaries.forEach(function (summary) {
					summary["added"].forEach(function (node) {
						replaceEmbedYouTubeFlashPlayer(node);
					});
				});
		    },
		queries: [
		{ element: "embed" }
		]
	});
}
// add correct options to existing iframes and replace flash embeds on page load
(function () {
	"use strict";
	var iframes = document.getElementsByTagName("iframe"),
	iframe,
	srcToConcat;
    	for (iframe of iframes) {
		srcToConcat = addSrcOptions(iframe.src);
		if (srcToConcat) { // don't cause a reflow for nothing
			iframe.src += srcToConcat;
		}
    	}
}());
(function () {
	"use strict";
	var embeds = [],
	embed;
	for (embed of document.getElementsByTagName("embed")) {
		embeds.push(embed); // create a static array of nodes
	}
	if (embedObserver) {
		embedObserver.disconnect(); // prevent recursion
	}
	for (embed of embeds) {
		replaceEmbedYouTubeFlashPlayer(embed);
	}
	if (embedObserver) {
		embedObserver.reconnect();
	}
}());

