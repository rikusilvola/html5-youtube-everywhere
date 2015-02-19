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
    if (src.match(/youtube\.(googleapis\.)?com/)) {
        var firstOption = srcHasOptions(src);
        if (!src.match(/html5=1/)) {
            src += firstOption ? "?html5=1" : "&html5=1";
            firstOption = false;
        }
        if (clickToPlayEnabled() && !src.match(/autoplay=0/)) {
            src += firstOption ? "?autoplay=0" : "&autoplay=0";
            firstOption = false;
        } else if (!clickToPlayEnabled() && !src.match(/autoplay=1/)) {
            src += firstOption ? "?autoplay=1" : "&autoplay=1";
            firstOption = false;
        }
    }
    return src // did we ad any?
};
function replaceNode (newNode, oldNode) {
    "use strict";
    if (oldNode.parentNode) {
        oldNode.parentNode.insertBefore(newNode, oldNode);
        oldNode.parentNode.removeChild(oldNode);
    } else {
        oldNode.nodeValue = newNode.nodeValue;
    }
}

// init iframe observer
iframeObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        var i = 0, name = "", clone, nodesToRemove = [];
        for (i = 0; i < mutation.addedNodes.length; i++) {
            name = mutation.addedNodes.item(i).nodeName;
            if (name == "iframe" || name == "IFRAME") {
//                clone = mutation.addedNodes.item(i).cloneNode();
//                clone.src = addSrcOptions(clone.src);
                mutation.addedNodes.item(i).addEventListener("DOMNodeInsertedIntoDocument", function (event) { mutation.addedNodes.item(i).src = addSrcOptions(mutation.addedNodes.item(i).src); });
//                clone;
//                nodesToRemove.push(mutation.addedNodes.item(i));
            }
        }
        nodesToRemove.forEach(function (node) { node.remove(); });
    });
    
});
iframeObserver.observe(document.body, { childList: true });


(function () {
    var iframes = document.getElementsByTagName("iframe"),
    iframe,
    embeds = [],
    embed,
    video,
    playlist,
    params;
    for (iframe of iframes) {
        iframe.src = addSrcOptions(iframe.src);
    }
    embeds = []; // create a static copy of selected DOM elements
    for (embed of document.getElementsByTagName("embed")) {
        embeds.push(embed);
    }
    for (embed of embeds) {
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
                    if (!iframe.src.match(/html5=1/)) {
                        iframe.src += srcHasOptions(iframe.src) ? "?html5=1" : "&html5=1";
                    }
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
}());
