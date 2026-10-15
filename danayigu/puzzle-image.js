/* One square crop per round, shared by every tile and preview. */
(function (root) {
  function crop(width, height) {
    var side = Math.min(width, height);
    return { x: (width - side) / 2, y: (height - side) / 2, side: side };
  }
  function pick(photos, random) {
    return photos[Math.floor((random || Math.random)() * photos.length)];
  }
  function prepare(src) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onerror = function () { reject(new Error("photo_load_failed")); };
      image.onload = function () {
        try {
          var rect = crop(image.naturalWidth, image.naturalHeight);
          if (!rect.side) throw new Error("photo_empty");
          var canvas = document.createElement("canvas");
          canvas.width = canvas.height = Math.min(1600, rect.side);
          canvas.getContext("2d").drawImage(image, rect.x, rect.y, rect.side, rect.side, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } catch (error) { reject(error); }
      };
      image.src = src;
    });
  }
  var api = { crop: crop, pick: pick, prepare: prepare };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DanayiguPuzzleImage = api;
})(typeof window !== "undefined" ? window : null);
