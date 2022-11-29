/* eslint-disable */

export const displayMap = locations => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYnJhaWFuMDkyMiIsImEiOiJjbGFjengwZDcwZmVoM3FwZXVlaGJ6dGEzIn0.ZK87Oln3_M6WSPQbX7Xumg';
    var map = new mapboxgl.Map({
        //map como en el html del tour con el que obtuvimos las locaciones
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        scrollZoom: false
    });

    //Variables vinculada
    const bounds = new mapboxgl.LngLatBounds();

    //Recorremos las locaciones para generar los marcadores en el mapa
    locations.forEach(loc => {
        //Creamos el marcador
        const el = document.createElement('div');
        el.className = 'marker';

        //Añadimos el marcador
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        //Se añade un popup a los marcadores para saber que localizacion es
        new mapboxgl.Popup({
            //Para que el icono del marcador no se superponga con el popup
            offset: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);

        //Se incluyen las coordenadas
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 200,
            right: 200
        }
    });
}
