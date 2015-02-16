
var pageMod = require("sdk/page-mod");
var self = require("sdk/self");

pageMod.PageMod({
	include: "*",
	contentScriptWhen: 'end',
	contentScriptFile: self.data.url("flash2html.js")
});
