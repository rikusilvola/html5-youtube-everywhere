Array.prototype.forEach.call(
	document.getElementsByTagName("embed"),
	function(embed){
		if (!embed.src.match(/youtube\.(googleapis\.)?com/)) { return; }
		var videoID = embed.src.match(/\/v\/([^&]+)/)[1];
		var iframe = document.createElement("iframe");
		iframe.width = embed.width;
		iframe.height = embed.height;
		iframe.type = "text/html";
		iframe.frameBorder = "0";
		iframe.src = "http://www.youtube.com/embed/" + videoID + "?html5=1";
		embed.parentNode.insertBefore(iframe, embed);
		embed.parentNode.removeChild(embed);
	}
);
Array.prototype.forEach.call(
	document.getElementsByTagName("iframe"),
	function(iframe){
		if (!iframe.src.match(/youtube\.(googleapis\.)?com/) || iframe.src.match(/html5=1/) ) { return; }
		iframe.src += (-1 === iframe.src.indexOf("?")) ? "?html5=1" : "&html5=1";
	}
);
