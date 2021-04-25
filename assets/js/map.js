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

map.addEventListener("click", (event) => {
  const newPolygon = handleClickEvent(event);
  const {
    latlng: { lat, lng },
  } = event;

  state.features.push({
    id: getId(lat, lng),
    lat: lat,
    lng: lng,
    polygon: newPolygon,
  });
});

var agentmap = L.A.agentmap(map);
