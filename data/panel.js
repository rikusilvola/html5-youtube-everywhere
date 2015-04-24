var firstload = true;
var blocked;

function update(id, text) {
  var node = document.getElementById(id);
  if(node.hasChildNodes()) node.removeChild(node.firstChild);
  node.appendChild(document.createTextNode(text));
}
function blockURL() {
    console.log("emitting block-url");
    self.port.emit('block-url', '');
}
function blockDomain() {
    console.log("emitting block-domain");
    self.port.emit('block-domain', '');
}
function unblockURL() {
    console.log("emitting unblock-url");
    self.port.emit('unblock-url', '');
}
function unblockDomain() {
    console.log("emitting unblock-domain");
    self.port.emit('unblock-domain', '');
}
function toggleBall() {
    console.log("emitting toggle-disable");
    self.port.emit('toggle-disable', '');
}
var bpg = document.getElementById("bpg");
if (bpg)
    bpg.addEventListener("click", blockURL, false);
else console.log("no bpg");
var bdm = document.getElementById("bdm");
if (bdm)
    bdm.addEventListener("click", blockDomain, false);
else console.log("no bdm");
var ubpg = document.getElementById("ubpg");
if (ubpg)
    ubpg.addEventListener("click", unblockURL, false);
else console.log("no ubpg");
var ubdm = document.getElementById("ubdm");
if (ubdm)
    ubdm.addEventListener("click", unblockDomain, false);
else console.log("no ubdm");
var ball = document.getElementById("ball");
if (ball)
    ball.addEventListener("click", toggleBall, false);
else console.log("no ball");
var uball = document.getElementById("uball");
if (uball)
    uball.addEventListener("click", toggleBall, false);
else console.log("no uball");

self.port.on("refresh", function(args) {
   if (args) {
       if (args.hidden) {
            bpg.hidden = args.hidden["bpg"];
            bdm.hidden = args.hidden["bdm"];
            ubpg.hidden = args.hidden["ubpg"];
            ubdm.hidden = args.hidden["ubdm"];
            ball.hidden = args.hidden["ball"];
            uball.hidden = args.hidden["uball"];
       }
       domain = args.domain;
   }
   if (domain == null || domain == "") {
       update("domain", "HTML5 YouTube Everywhere");
   }
   else {
        update("domain", domain);
   }
});

self.port.on("blockstatus", function(args) {
   if (args) {
       if (firstload) {
            firstload = false;
            blocked = args.blocked;
       }
       else if (args.blocked != blocked) {
           self.port.emit("refresh-blocks", '');
           blocked = args.blocked;
       }
   }
});
console.log("panel loaded");