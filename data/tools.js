function isYouTubeSrc (src) {
    "use strict";
    /* this should be switched to a more generic one (check webcat youtube code) */
    return src.match(/youtube\.(googleapis\.)?com/);
}
function isYouTubeSite (URL) {
    "use strict";
    return URL.match(/youtube\.?com/);
}
function srcHasOptions (src) {
    "use strict";
    return (-1 === src.indexOf("?"));
}
/* returns a map of parameters held in src */
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
}
/* returns whether click to play should be enabled on this site */
function clickToPlayEnabled () {
    "use strict";
    var clicktoplay = false;
    if (isYouTubeSite(document.URL)) {
        clicktoplay = self.options.settings.prefs["yt-clicktoplay"];
    } else {
        clicktoplay = self.options.settings.prefs["yt-clicktoplay-ext"];
    }
    return clicktoplay;
}
/* get additional src options string according to preferences */
function addSrcOptions (src) {
    "use strict";
    var srcToConcat = "";
    if (isYouTubeSrc(src)) {
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
    return srcToConcat;
}
function isPlaylist (src) {
    return embed.src.match(/\/p\/([^&]+)/);
}
function isVideo (src) {
    return embed.src.match(/\/v\/([^&]+)/);
}
function getYtId (src) {
    var id,
        match;
    match = isVideo(src);
    if (!match) {
        match = isPlaylist(src);
    }
    if (match) {
        id = match[1];
    }
    return id;
}
function replaceNodeWith(oldNode, newNode) {
    if (oldNode.parentNode) {
        oldNode.parentNode.insertBefore(newNode, oldNode);
        /* consider hiding the embed instead of removal to reduce reflows */
        oldNode.parentNode.removeChild(embed);
    }
}
function buildIframeFromEmbed (embed) {
    var video,
    	playlist,
    	params,
        iframe,
        id;
    if (isYouTubeSrc(embed.src)) {
        id = getYtId(src);
        if (id) {
            iframe = document.createElement("iframe");
            iframe.src = "//www.youtube.com/embed/";
            params = getSrcParams(embed.src);
            if (isVideo(embed.src)) {
                iframe.src += id;
                if (params.list) {
                    iframe.src += "?list=" + params.list;
                }
            } else if (isPlaylist(src)) {
                iframe.src += "videoseries?list=" + id;
                if (params.v) {
                    iframe.src += "&v=" + params.v;
                }
            }
            if (iframe.src) {
                /* only add the src options here too if dynamic replacement is disabled */
                if (!self.options.settings.prefs["yt-dynamic-player-replace"]) {
                    /* figure out a smart way to preserve embed options if existing */
                    iframe.src += addSrcOptions(iframe.src);
                }
//DEBUG         console.log(iframe.src);
                iframe.width = embed.width;
                iframe.height = embed.height;
                iframe.type = "text/html";
                iframe.frameBorder = "0";
            }
        }
    }
    return iframe;
}