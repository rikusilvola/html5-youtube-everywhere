
var pageMod = require("sdk/page-mod");
var self = require("sdk/self");

pageMod.PageMod({
	include: "*",
	contentScriptWhen: 'ready',
	contentScriptFile: self.data.url("flash2html.js")
});
