var pageMod = require("sdk/page-mod");
var system = require("sdk/system");
var xul_app = require("sdk/system/xul-app");
var {data, id} = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var { viewFor } = require("sdk/view/core");
var panels = require("sdk/panel");
var flashmod, ytmod, hostfinder, hostname;
var yt_re_str = "\/.*youtube\\.com.*\/";
var ytblacklist = clean_blacklist([yt_re_str]);
var blacklist = [];
if (ss.storage.blacklist)
    blacklist = ss.storage.blacklist;
else
    ss.storage.blacklist = [];
var buttons = require('sdk/ui/button/action');

function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

RegExp.quote = function(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

var button = buttons.ActionButton({
  id: "yt-button",
  label: "HTML5 YouTube Everywhere",
  icon: {
    "16": "./logo16.png",
    "32": "./logo32.png",
    "64": "./logo64.png"
  },
  onClick: handleChange,
});

var panel = panels.Panel({
  contentScriptFile: data.url("panel.js"),
  contentScriptWhen: "end",
  contentURL: data.url("panel.html"),
  width: 145,
  height: 66
});

function handleChange(state) {
    if (hostname) {
        panel.show({
          position: button
        });
    }
}

panel.port.on("block-domain", blockDomain);
panel.port.on("block-url", blockURL);
panel.port.on("unblock-domain", unblockThisDomain);
panel.port.on("unblock-url", unblockThisURL);
panel.port.on("refresh-blocks", refreshAndLoad);
panel.port.on("toggle-disable", toggleDisable);

function toggleDisable() {
    if (isInBlackList("*")) {
        unblockThis("*");
    }
    else {
        blockThis("*");
    }
}

function isInBlackList(str) {
    return ss.storage.blacklist.findIndex(function(item) { return item == str;}) != -1;
}

function blockDomain() {
    var t = tabs.activeTab;
    var d = parseUri(t.url).host; // replace this with URL() once it matures
    var wd = "*." + d;
    blockThis(wd);
}

function blockURL() {
    var re = "/.*" + RegExp.quote(tabs.activeTab.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    blockThis(re);
}

function unblockThisDomain() {
    var t = tabs.activeTab;
    var d = parseUri(t.url).host; // replace this with URL() once it matures
    var wd = "*." + d;
    unblockThis(wd);
}

function unblockThisURL() {
    var t = tabs.activeTab;
    var re = "/.*" + RegExp.quote(t.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    unblockThis(re);
}

function unblockThis(dst) {
    var loc = ss.storage.blacklist.findIndex(function(item) { return item == dst;});
    if (loc != -1) {
        console.log("unblocking: " + dst);
        ss.storage.blacklist.splice(loc, 1);
        refreshPanel();
    }
}

function blockThis(dst) {
    if (isInBlackList(dst) == false) {
        console.log("blocking: " + dst);
        ss.storage.blacklist.push(dst);
        refreshPanel();
    }
}

function isBlacklisted() {
    var t, d, wd, re;
    if (isInBlackList("*")) 
        return true;
    t = tabs.activeTab;
    d = parseUri(t.url).host; // replace this with URL() once it matures
    wd = "*." + d;
    if (isInBlackList(wd))
        return true;
    re = "/.*" + RegExp.quote(t.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    if (isInBlackList(re))
        return true;
    return false;
}

function refreshPanel() {
    var t = tabs.activeTab;
    var d = parseUri(t.url).host; // replace this with URL() once it matures
    var wd = "*." + d;
    var re = "/.*" + RegExp.quote(t.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    var h = (isInBlackList("*") ? 30 : isInBlackList(wd) ? 50 : 65);
    panel.height = h;
    args = { 
        "hidden" : {
            "bdm" : isInBlackList("*") || isInBlackList(wd),
            "bpg" : isInBlackList("*") || isInBlackList(wd) || isInBlackList(re),
            "ubdm" : isInBlackList("*") || !isInBlackList(wd),
            "ubpg" : isInBlackList("*") || isInBlackList(wd) || !isInBlackList(re),
            "ball" : isInBlackList("*"),
            "uball" : !isInBlackList("*")
        },
        "blocked" : isBlacklisted()
    }
    panel.port.emit("refresh", args);
}

function refreshAndLoad() {
    var t = tabs.activeTab;
    refresh_blacklist();
    t.reload();
}

function is_valid_domain_str(str) {
	if (str == "*") // exclude all
	  return true;
	// string starts with *. and has no extra asterisks
	return (str.match(/^\*\./) && !str.slice(1).match(/\*/))
}
function is_regexp_str(str) {
	return (str.match(/^\/.+?\/$/));
}
function clean_blacklist(bl) {
    if (!bl) return [];
	var domains = bl.filter(is_valid_domain_str);
	var regexps = bl.filter(is_regexp_str);
	for (var i = 0; i < regexps.length; i++)
	  regexps[i] = new RegExp(regexps[i].slice(1,-1)); // create regexps from the strings
	return domains.concat(regexps);
//DEBUG	blacklist.forEach(function(item) { console.log('"' + item + '"'); });
}

function refresh_blacklist() {
	blacklist = clean_blacklist(ss.storage.blacklist);
	if (flashmod)
        flashmod.destroy();
	flashmod_create();
	if (ytmod)
        ytmod.destroy();
    // Support for YouTube site mods missing on Fennec
    if (xul_app.is("Firefox"))
        ytmod_create();
}

function flashmod_create() {
    if (flashmod)
        flashmod.destroy();
    var contentOptions = {
        settings: simplePrefs,
        blacklist: ss.storage.blacklist.concat([yt_re_str])
        };
    // pageMod exclude is only supported on windows firefox 32.0 and higher, others require manual
    if (system.platform != "WINNT" || xul_app.versionInRange(system.version, "32.0") != true) 
        contentOptions.manual_blacklist = true;
    else
        contentOptions.manual_blacklist = true;
    var options = {
        include: "*",
        contentScriptWhen: 'ready',
        contentScriptFile: data.url("flash2html.js"),
        contentScriptOptions: contentOptions
    }
    options.exclude = ytblacklist.concat(blacklist);
    flashmod = pageMod.PageMod(options);
}

function ytmod_create() {
    if (ytmod)
        ytmod.destroy();
    var contentOptions = {
        settings: simplePrefs,
        blacklist: ss.storage.blacklist
        };
    // pageMod exclude is only supported on windows firefox 32.0 and higher, others require manual
    if (system.platform != "WINNT" || xul_app.versionInRange(system.version, "32.0") != true) 
        contentOptions.manual_blacklist = true;
    else
        contentOptions.manual_blacklist = true;
    var options = {
        include: /.*www\.youtube\.com\/(?!(embed\/|v\/)).*/,
        contentScriptWhen: 'ready',
        contentScriptFile: data.url("tube2html.js"),
        contentScriptOptions: contentOptions
    }
    if (blacklist.length != 0)
        options.exclude = blacklist;
    ytmod = pageMod.PageMod(options);
}

function setHostname(hst){
    hostname = hst;
    console.log("Hostname: " + hostname);
}

tabs.on('ready', function(tab) {
    if (tab === tabs.activeTab) {
        var worker = tab.attach({
            contentScript: "self.port.emit('hostname', (window ? location.hostname : ''));"
        });
        worker.port.on("hostname", setHostname);
    }
});

tabs.on('activate', function(tab) {
    var worker = tab.attach({
        contentScript: "self.port.emit('hostname', (window ? location.hostname : ''));"
    });
    worker.port.on("hostname", setHostname);
});

function test() {
    tabs.open("http://riqpe.pingtimeout.net/flashtube.html");
    tabs.open("http://riqpe.pingtimeout.net/flashtube2.html");
   // tabs.open("https://youtube.com");
}

exports.main = function(options) {
	console.log("HTML5 YouTube Everywhere!");
    refresh_blacklist();
    refreshPanel();
//    test();
}
