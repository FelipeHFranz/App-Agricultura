import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WKT from 'ol/format/WKT.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { AreaService } from '../area.service';
import { Solo } from '../solo.model';
import BingMaps from 'ol/source/BingMaps.js';
import { ZoomSlider } from 'ol/control.js';
import MousePosition from 'ol/control/MousePosition.js';
import {createStringXY} from 'ol/coordinate.js';
import {defaults as defaultControls} from 'ol/control.js';

@Component({
  selector: 'app-area-details',
  templateUrl: './area-details.component.html',
  styleUrls: ['./area-details.component.css']
})
export class AreaDetailsComponent implements OnInit {

  constructor(private areaService: AreaService, private activateRoute: ActivatedRoute) { }
  id;
  desc;
  geometria;
  solos;
  coordenadas;

  ngOnInit() {

    this.desc = this.activateRoute.snapshot.params['description'];
    this.geometria = this.activateRoute.snapshot.params['geometria'];
    this.solos = this.activateRoute.snapshot.params['soloID'];
    (<HTMLInputElement>document.getElementById("area")).value = this.desc;
    this.getSolo(this.solos);
    this.coordenadas = this.geometria.substr(10);
    this.mapa(this.coordenadas);
  }

  solo: Solo;

  getSolo(id: string) {
    this.areaService.getSoloByID(id).subscribe(
      (data: Solo) => {
        this.solo = data;
        (<HTMLInputElement>document.getElementById("solo")).value = this.solo.description;
      },
      (error) => {
        console.log(error);
      }
    );
  }


  mapa(wkt) {

    //mouse controle
    var mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(14),
      projection: 'EPSG:4326',
      // comment the following two lines to have the mouse position
      // be placed within the map.
      className: 'custom-mouse-position',
      target: document.getElementById('mousePos'),
      undefinedHTML: '&nbsp;'
    });
    //Chama mapa Bing
    var raster = new TileLayer({
      source: new BingMaps({
        imagerySet: 'AerialWithLabels',
        key: 'AiFl58LN-AEl9p55F1fEXD3nZx8EydZjJUqWL9-eeq4aLxgIdIF13rjAxD9ARpZE'
      })
    });
     //estilos
    var styles = {
      'MultiPolygon': new Style({
        stroke: new Stroke({
          color: 'orange',
          lineDash: [4],
          width: 3
        }),
        fill: new Fill({
          color: 'rgba(255,165,0, 0.2)'
        })
      }),
    }

    var format = new WKT();

    var feature = format.readFeature(wkt, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    var styleFunction = function (feature) {
      return styles[feature.getGeometry().getType()];
    };
    var vector = new VectorLayer({
      source: new VectorSource({
        features: [feature]
      }),
      style: styleFunction
    });
    var view = new View({
      center: [0, 0],
      zoom: 1
    });

    view.fit(feature.getGeometry(), { padding: [170, 50, 30, 150], minResolution: 3 });
    var map = new Map({
      controls: defaultControls().extend([mousePositionControl]),
      layers: [raster, vector],
      target: 'map',
      view: view

    });
    //zoom
    var zoomslider = new ZoomSlider();
    map.addControl(zoomslider);


  }

}
declare var ol: any;