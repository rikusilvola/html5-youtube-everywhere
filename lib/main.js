
var pageMod = require("sdk/page-mod");
var {data, id} = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");

exports.main = function(options) {
var settings = {};
settings["yt-force-iframe"] = simplePrefs.prefs["yt-force-iframe"];
console.log(settings["yt-force-iframe"]);
pageMod.PageMod({
	include: "*",
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("flash2html.js")
});
pageMod.PageMod({
	include: "*.youtube.com",
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("youtube.js"),
	contentScriptOptions: {
		settings: settings
	}
});
}
