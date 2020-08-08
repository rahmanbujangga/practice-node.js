/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicmFobWFuYnVqYW5nZ2EiLCJhIjoiY2tjZWp4YWZzMDkzejJycGJjdjRoY3N4dSJ9.yd59mBrwUWBMYq3bJGld5Q';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rahmanbujangga/ckcevd73m1b9e1iqrk778mm81/draft',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //add pop-up
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} ${loc.description}</p>`)
      .addTo(map);

    //extends map bounds to include current tour location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      right: 100,
      left: 100,
    },
  });
};
