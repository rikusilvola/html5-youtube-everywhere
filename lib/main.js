
var pageMod = require("sdk/page-mod");
var {data, id} = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");

exports.main = function(options) {
pageMod.PageMod({
	include: "*",
	contentScriptWhen: 'ready',
	contentScriptFile: [data.url("mutation-summary.js"),data.url("flash2html.js")],
	contentScriptOptions: {
		settings: simplePrefs
	}
});
pageMod.PageMod({
	include: "*.youtube.com",
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("youtube.js"),
	contentScriptOptions: {
		settings: simplePrefs
	}
});
}
