var tools = require("./tools"),
    validSrcs = ["//youtube.com/"]
    invalidSrcs = ["//kekkonen.com/", ""],
    validURLs = ["//www.youtube.com/"],
    invalidURLs = ["//kekkonen.com/", ""],
    srcWithOptions = "//example.com/123?test1=1&test2=2",
    srcWithoutOptions = "//example.com/123",
    playlistSrc = "//youtube.com/p/123",
    videoSrc = "//youtube.com/v/123";
    srcWOid = "//youtube.com/";

exports["test isYouTubeSrc"] = function(assert) {
      assert.ok(validSrcs.every(tools.isYouTubeSrc), "valid srcs work");
      assert.ok(!invalidSrcs.some(tools.isYouTubeSrc), "invalid srcs work");
}
 
exports["test isYouTubeSite"] = function(assert) {
      assert.ok(validURLs.every(tools.isYouTubeSite), "valid URLs work");
      assert.ok(!invalidURLs.some(tools.isYouTubeSite), "invalid URLs work");
}

exports["test srcHasOptions"] = function(assert) {
  assert.ok(tools.srcHasOptions(srcWithOptions), "srcHasOptions works with options"); 
  assert.ok(!tools.srcHasOptions(srcWithoutOptions), "srcHasOptions works without options");
}
 
exports["test getSrcParams"] = function(assert) {
  assert.ok(tools.getSrcParams(srcWithOptions) &&
	    !tools.getSrcParams(srcWithoutOptions), "getSrcParams works");
}
 
exports["test getSrcParams"] = function(assert) {
  assert.ok(tools.isPlaylist(playlistSrc) && !tools.isPlaylist(videoSrc) && !tools.isPlaylist(srcWOid), "isPlaylist works");
  assert.ok(!tools.isVideo(playlistSrc) && tools.isVideo(videoSrc) && !tools.isVideo(srcWOid), "isVideo works");
}

require("sdk/test").run(exports);
