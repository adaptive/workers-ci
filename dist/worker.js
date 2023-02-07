/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./test/worker.js ***!
  \************************/
const handleRequest = request => new Response("hello world", { status: 200 });

addEventListener("fetch", event =>
  event.respondWith(handleRequest(event.request))
);

/******/ })()
;