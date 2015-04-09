
var pageMod = require("sdk/page-mod");
var {data, id} = require("sdk/self");
var flashmod, ytmod;
var simplePrefs = require("sdk/simple-prefs");
var blacklist = simplePrefs.prefs['yt-blacklist'].split(/\s*,\s*/);
simplePrefs.on("yt-blacklist", refresh_blacklist);

function refresh_blacklist() {
	blacklist = simplePrefs.prefs['yt-blacklist'].split(/\s*,\s*/);
	flashmod.destroy();
	flashmod_create();
//DEBUG blacklist.forEach(console.log);
}

function flashmod_create() {
  if (flashmod)
    flashmod.destroy();

  flashmod = pageMod.PageMod({
	include: "*",
	exclude: blacklist,
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("flash2html.js"),
	contentScriptOptions: {
		settings: simplePrefs
	}
  });
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
