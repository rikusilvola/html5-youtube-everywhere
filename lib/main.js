var pageMod = require("sdk/page-mod");
var system = require("sdk/system");
var xul_app = require("sdk/system/xul-app");
var {data, id} = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var { viewFor } = require("sdk/view/core");
var flashmod, ytmod;
var ytblacklist = simplePrefs.prefs['yt-blacklist'].trim().split(/\s*,\s*/);
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
  onClick: handleClick,
  onHover: handleClick
});

function handleClick(state) {    
    var w = tabs.activeTab;
    var d = parseUri(w.url).host; // replace this with URL() when it matures
    var re = "/.*" + RegExp.quote(w.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    //var re =  "*." + d;
    console.log(re);
    ss.storage.blacklist.push(re);
    refresh_blacklist();
    w.reload();
//  tabs.open("https://www.mozilla.org/");
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
    ytblacklist = clean_blacklist(simplePrefs.prefs['yt-blacklist'].trim().split(/\s*,\s*/));
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
    blacklist: ss.storage.blacklist
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

  if (blacklist.length != 0)
    options.exclude = ytblacklist;
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

  //if (blacklist.length != 0) options.exclude = ss.storage.blacklist;
  ytmod = pageMod.PageMod(options);
}

function test() {
    tabs.open("http://riqpe.pingtimeout.net/flashtube.html");
    tabs.open("http://riqpe.pingtimeout.net/flashtube2.html");
    tabs.open("https://youtube.com");
}

exports.main = function(options) {
	console.log("HTML5 YouTube Everywhere!");
    refresh_blacklist();
    test();
}
