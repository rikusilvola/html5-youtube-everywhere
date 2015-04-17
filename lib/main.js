var pageMod = require("sdk/page-mod");
var system = require("sdk/system");
var xul_app = require("sdk/system/xul-app");
var {data, id} = require("sdk/self");
var flashmod, ytmod;
var simplePrefs = require("sdk/simple-prefs");
var blacklist = simplePrefs.prefs['yt-blacklist'].trim().split(/\s*,\s*/);
clean_blacklist();
simplePrefs.on("yt-blacklist", refresh_blacklist);

function is_valid_domain_str(str) {
	if (str == "*") // exclude all
	  return true;
	// string starts with *. and has no extra asterisks
	return (str.match(/^\*\./) && !str.slice(1).match(/\*/))
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
  var contentOptions = { settings: simplePrefs };
  // pageMod exclude is only supported on windows firefox 32.0 and higher, others require manual
  if (system.platform != "WINNT" || xul_app.versionInRange(system.version, "32.0") != true) 
    contentOptions.manual_blacklist = true;
  else
    contentOptions.manual_blacklist = false;
  var options = {
	include: "*",
	contentScriptWhen: 'ready',
	contentScriptFile: data.url("flash2html.js"),
	contentScriptOptions: contentOptions
      }

  if (blacklist.length != 0)
    options.exclude = blacklist;
  flashmod = pageMod.PageMod(options);
}

function ytmod_create() {
    ytmod = pageMod.PageMod( {
        include: /.*www\.youtube\.com\/(?!(embed\/|v\/)).*/,
        contentScriptWhen: 'ready',
        contentScriptFile: data.url("tube2html.js"),
        contentScriptOptions: { settings: simplePrefs }
    });
}

exports.main = function(options) {
    flashmod_create();
    // Support for YouTube site mods missing on Fennec
    if (xul_app.is("Firefox")) {
        ytmod_create();
    }
}
