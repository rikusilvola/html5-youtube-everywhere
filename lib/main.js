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

RegExp.quote = function(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

var button = buttons.ActionButton({
    id: "yt-button",
    label: "HTML5 YouTube Everywhere",
    icon: {
        "16": "./disabled16.png",
        "32": "./disabled32.png",
        "64": "./disabled64.png"
    },
    onClick: handleChange
});

function toggleButtonIcons(disabled) {
    if (disabled) {
        button.icon = {
            "16": "./disabled16.png",
            "32": "./disabled32.png",
            "64": "./disabled64.png"
        };
    }
    else {
        button.icon = {
            "16": "./logo16.png",
            "32": "./logo32.png",
            "64": "./logo64.png"
        };
    }
}

var panel = panels.Panel({
  contentScriptFile: data.url("panel.js"),
  contentScriptWhen: "end",
  contentURL: data.url("panel.html"),
  width: 145,
  height: 66
});

function handleChange(state) {
    console.log("height: " + panel.height);
    panel.show({
      position: button
    });
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
    if (hostname) {
        var wd = "*." + hostname;
        blockThis(wd);
    }
}

function blockURL() {
    var re = "/.*" + RegExp.quote(tabs.activeTab.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    blockThis(re);
}

function unblockThisDomain() {
    if (hostname) {
        var wd = "*." + hostname;
        unblockThis(wd);
    }
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
        panel.port.emit("blockstatus", {"blocked" : isBlacklisted()});
    }
}

function blockThis(dst) {
    if (isInBlackList(dst) == false) {
        console.log("blocking: " + dst);
        ss.storage.blacklist.push(dst);
        refreshPanel();
        panel.port.emit("blockstatus", {"blocked" : isBlacklisted()});
    }
}

function isBlacklisted() {
    var d, wd, re;
    if (!hostname)
        return true;
    if (isInBlackList("*")) 
        return true;
    wd = "*." + hostname;
    if (isInBlackList(wd))
        return true;
    re = "/.*" + RegExp.quote(tabs.activeTab.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    if (isInBlackList(re))
        return true;
    return false;
}

function refreshPanel() {
    var t, wd, re, h = 0;
    if (hostname) {
        t = tabs.activeTab;
        wd = "*." + hostname;
        re = "/.*" + RegExp.quote(t.url.replace(/http(s)*:\/\//g, "")) + ".*/";
    }
    h = (!hostname || isInBlackList("*") ? 30 : isInBlackList(wd) ? 50 : 65);
    panel.height = h;
    args = { 
        "hidden" : {
            "bdm" : !hostname || isInBlackList("*") || isInBlackList(wd),
            "bpg" : !hostname || isInBlackList("*") || isInBlackList(wd) || isInBlackList(re),
            "ubdm" : !hostname || isInBlackList("*") || !isInBlackList(wd),
            "ubpg" : !hostname || isInBlackList("*") || isInBlackList(wd) || !isInBlackList(re),
            "ball" : isInBlackList("*"),
            "uball" : !isInBlackList("*")
        }
    }
    toggleButtonIcons(isInBlackList("*"));
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
        blacklist: ss.storage.blacklist.concat([yt_re_str]) // must be passed in string array format
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
    options.exclude = ytblacklist.concat(blacklist); // has to be cleaned to RegExp / string wildcard domain array format
    flashmod = pageMod.PageMod(options);
}

function ytmod_create() {
    if (ytmod)
        ytmod.destroy();
    var contentOptions = {
        settings: simplePrefs,
        blacklist: ss.storage.blacklist // must be passed in string array format
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
        options.exclude = blacklist; // has to be cleaned to RegExp / string wildcard domain array format
    ytmod = pageMod.PageMod(options);
}

function setHostname(hst){
    hostname = hst;
    console.log("Hostname: " + hostname);
    refreshPanel();
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
