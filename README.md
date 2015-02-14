# HTML5 YouTube Everywhere #

This addon replaces the old Flash based &lt;embed tags with HTML5 iframes,
including videos with monetarisation enabled.

## Usage ##

Just install the addon and all embedded YouTube videos are now shown as HTML5. 
No need to disable Flash.

Note that many videos on YouTube are only available as H264 and thus will only
play with newer versions of Firefox.
Under windows set `media.windows-media-foundation.enabled` to true and under 
linux set `gstreamer.enabled` to true to enable H264 support.

## Building ##

This addon was built with Mozillas JetPack SDK, so building it is as simple
as running `cfx xpi`. To build it with support for Android, use `cfx xpi --force-mobile`.

## Attribution ##

Thanks to [Paul Battley] [threedaymonk] for the userscript and to [Klemens 
Schölhorn] [klemens] for his work on [YouTube ALL HTML5] [ff-youtube-all-html5]

## Licence ##

This addon by Riku-Pekka Silvola is licenced under GPLv3.<br />
The modified [HTML5 Logo][w3c] by W3C is licenced under CC-BY 3.0.

[w3c]: http://www.w3.org/html/logo/
[threedaymonk]: https://github.com/threedaymonk
[klemens]: https://github.com/klemens
[ff-youtube-all-html5]: https://github.com/klemens/ff-youtube-all-html5
