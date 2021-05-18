var map = L.map("map")
  .fitBounds(mapConfig.bounding_box)
  .setZoom(mapConfig.zoom);

L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  minZoom: mapConfig.minZoom,
  maxZoom: mapConfig.maxZoom,
}).addTo(map);

function handleClickEvent(event) {
  const { latlng } = event;
  return drawFeature(latlng, map);
}

var agentmap = L.A.agentmap(map);
