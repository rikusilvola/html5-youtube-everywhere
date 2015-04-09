
var pageMod = require("sdk/page-mod");
var {data, id} = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");
var blacklist = simplePrefs.prefs['yt-blacklist'].split(',');
if (!blacklist) blacklist = [];
simplePrefs.on("yt-blacklist", refresh_blacklist);

function refresh_blacklist() {
	blacklist = simplePrefs.prefs['yt-blacklist'].split(',');
	if (!blacklist) blacklist = [];
//DEBUG blacklist.forEach(console.log);
}

exports.main = function(options) {
pageMod.PageMod({
	include: "*",
	exclude: blacklist,
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("flash2html.js"),
	contentScriptOptions: {
		settings: simplePrefs
	}
});/*
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
