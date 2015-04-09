
var pageMod = require("sdk/page-mod");
var {data, id} = require("sdk/self");
var flashmod, ytmod;
var simplePrefs = require("sdk/simple-prefs");
var blacklist = simplePrefs.prefs['yt-blacklist'].trim().split(/\s*,\s*/);
clean_blacklist();
simplePrefs.on("yt-blacklist", refresh_blacklist);

function is_valid_domain_str(str) {
	return (str.match(/^\*/));
}
function is_regexp_str(str) {
	return (str.match(/^\/.+?\/$/));
}
function clean_blacklist() {
	blacklist = simplePrefs.prefs['yt-blacklist'].trim().split(/\s*,\s*/);
	var domains = blacklist.filter(is_valid_domain_str);
	var regexps = blacklist.filter(is_regexp_str);
	for (var i = 0; i < regexps.length; i++)
	  regexps[i] = new RegExp(regexps[i].slice(1,-1)); // create regexps from the strings
	blacklist = domains.concat(regexps);
//DEBUG	blacklist.forEach(function(item) { console.log('"' + item + '"'); });
}

function refresh_blacklist() {
	clean_blacklist();
	flashmod.destroy();
	flashmod_create();
//DEBUG blacklist.forEach(console.log);
}

function flashmod_create() {
  if (flashmod)
    flashmod.destroy();
  var options = {
	include: "*",
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("flash2html.js"),
	contentScriptOptions: {
		settings: simplePrefs
	}
      }

  if (blacklist.length != 0)
    options.exclude = blacklist;
  flashmod = pageMod.PageMod(options);
}

exports.main = function(options) {
flashmod_create();
/*
pageMod.PageMod({
	include: "*.youtube.com",
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("youtube.js"),
	contentScriptOptions: {
		settings: simplePrefs
	}
});
*/
}
