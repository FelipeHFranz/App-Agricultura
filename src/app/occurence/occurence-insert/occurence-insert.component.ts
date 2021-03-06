import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OccurenceService } from '../occurence.service';
import { Occurrencetype } from 'src/app/occurrencetype/occurrencetype.model';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WKT from 'ol/format/WKT.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';

import BingMaps from 'ol/source/BingMaps.js';
import { ZoomSlider } from 'ol/control.js';
import MousePosition from 'ol/control/MousePosition.js';
import { createStringXY } from 'ol/coordinate.js';
import { defaults as defaultControls } from 'ol/control.js';
import { transform } from 'ol/proj';
import Draw from 'ol/interaction/Draw.js';

import { Occurrence } from '../occurrence.model';
import {Location} from '@angular/common';
@Component({
  selector: 'app-occurence-insert',
  templateUrl: './occurence-insert.component.html',
  styleUrls: ['./occurence-insert.component.css']
})
export class OccurenceInsertComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private location: Location,
    private occurenceService: OccurenceService, private activateRoute: ActivatedRoute) { }
  id;
  geometria;
  coordenadas;
  message;
  areaDesc;
  ownerForm: FormGroup;
  occurenceTipe: Occurrencetype[];

  ngOnInit() {

    //pega os valor  
    this.id = this.activateRoute.snapshot.params['id'];
    this.areaDesc = this.activateRoute.snapshot.params['description'];
    this.geometria = this.activateRoute.snapshot.params['geometria'];
    
    this.getOccurenceTipe();
    this.ownerForm = this.formBuilder.group({
      descricao: new FormControl('', [Validators.required]),
      ocorrencia: new FormControl('', [Validators.required]),
      observacao: new FormControl('', [Validators.required])
    });

    this.coordenadas = this.geometria.substr(25);
    this.coordenadas = this.coordenadas.substr(0, this.coordenadas.length - 3);

  

    this.mapa(this.coordenadas);

  }
  public hasError = (controlName: string, errorName: string) => {
    return this.ownerForm.controls[controlName].hasError(errorName);
  }
  get f() {
    return this.ownerForm.controls;
  }
  volta(){
    this.location.back();
  }
  add() {

    var coordenadas = (<HTMLInputElement>document.getElementById("coordenada")).value;
    if (coordenadas == "") {
      alert("Selecione os pontos da localização!!!!");
    } else {

      this.occurenceService.insertOcccurrence(this.f.descricao.value,this.f.ocorrencia.value,this.id).subscribe((id:Occurrence) => {
          
          // redireciona a view
    
          console.log(id.id +" "+coordenadas);
           this.addLocation(coordenadas, id.id);
         
        },
          (error) => {
            this.message = error;
          }
        );
    }
  }
addLocation(coordenadas,id){
  this.occurenceService.postOccurenceLocation("SRID=4326;GEOMETRYCOLLECTION("+ coordenadas+")",this.f.observacao.value,id).subscribe(
    () => {
            
      alert("Occorencia cadastrada!");
      this.volta();
    },
    (error) => {
      this.message = error;
    }
  );
}
  getOccurenceTipe() {
    this.occurenceService.getOccutenceTypeAll().subscribe(
      (data: Occurrencetype[]) => {
        this.occurenceTipe = data;
      },
      (error) => {
        console.log(error);
      }
    );
  }


  limpaMapa() {
    document.getElementById("map").innerHTML = "";
    (<HTMLInputElement>document.getElementById("coordenada")).value = this.coordenadas;
    this.mapa(this.coordenadas);
  }

  mapa(wtk) {

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
      "Polygon": new Style({
        fill: new Fill({
          color: 'rgba(255,0,0, 0.2)'
        }),
        stroke: new Stroke({
          color: 'Red',
          width: 2
        })
      })
    }

    var format = new WKT();

    var feature = format.readFeature("MULTIPOLYGON((( " + wtk + ")))", {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    var styleFunction = function (feature) {
      return styles[feature.getGeometry().getType()];
    };
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


    var vectorSource = new VectorSource({ features: [feature] });
    var vector = new VectorLayer({
      source: vectorSource,
      style: styleFunction
    });
    var view = new View({
      center: [0, 0],
      zoom: 1
    });

    view.fit(feature.getGeometry(), { padding: [170, 50, 30, 150], minResolution: 5 });
    var map = new Map({
      controls: defaultControls().extend([mousePositionControl]),
      layers: [raster, vector],
      target: 'map',
      view: view

    });


    var draw = new Draw({
      source: vectorSource,
      type: 'Polygon'

    });
    map.addInteraction(draw);
    var colecao;
    draw.on('drawend', function (event) {
      var poligono;
     
      var EPSG4326;
      var feature = event.feature;
      var p = feature.getGeometry().getCoordinates();
      for (var k = 0; k < p.length; k++) {
        EPSG4326 = transform(p[k][0], 'EPSG:3857', 'EPSG:4326');
        poligono = EPSG4326[0] + " " + EPSG4326[1];
        for (var x = 0; x < p[0].length; x++) {
          EPSG4326 = transform(p[k][x], 'EPSG:3857', 'EPSG:4326');
          poligono = poligono + "," + EPSG4326[0] + " " + EPSG4326[1];
        }
        if(colecao==null){
        colecao = "POLYGON(( " + poligono + "))";
        }else{
          colecao= colecao +",POLYGON(( " + poligono + "))";
        }
      }

      (<HTMLInputElement>document.getElementById("coordenada")).value = colecao;
      return;
    });

    //zoom
    var zoomslider = new ZoomSlider();
    map.addControl(zoomslider);
    map.on('');

  };


}
