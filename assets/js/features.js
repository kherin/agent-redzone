function onClickHandler(event) {
  event.originalEvent.view.L.DomEvent.stopPropagation(event);
}

function drawFeature(latlng, map) {
  const bounding_coordinates = getBoundingCoordinates(latlng);
  let polygonOptions = {
    color: "red",
    draggable: true,
    transform: true,
    weight: 1,
  };

  let newPolygon = L.polygon(bounding_coordinates, polygonOptions).addTo(map);
  newPolygon.transform.enable({ rotation: true, scaling: false });
  newPolygon.addEventListener("click", onClickHandler, false);
  return newPolygon;
}

function getBoundingCoordinates(latlng) {
  const { lat, lng } = latlng;
  return [
    [lat, lng],
    [lat + mapConfig.latDistance, lng],
    [lat + mapConfig.latDistance, lng + mapConfig.lngDistance],
    [lat, lng + mapConfig.lngDistance],
  ];
}

function getId(lat, lng) {
  return `${Math.abs(lat)}${Math.abs(lng)}`;
}
