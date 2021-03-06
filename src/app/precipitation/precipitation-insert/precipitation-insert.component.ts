import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { PrecipitationService } from '../precipitation.service';
import * as moment from 'moment';
import { Location } from '@angular/common';
@Component({
  selector: 'app-precipitation-insert',
  templateUrl: './precipitation-insert.component.html',
  styleUrls: ['./precipitation-insert.component.css']
})
export class PrecipitationInsertComponent implements OnInit {
  ownerForm: FormGroup;
  id;
  message;
  constructor(private activateRoute:ActivatedRoute,iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, private formBuilder: FormBuilder, private router: Router,
    private precipitationService: PrecipitationService, private location: Location) {
    iconRegistry.addSvgIcon('iconClose', sanitizer.bypassSecurityTrustResourceUrl('assets/baseline-close-24px.svg'));
  }

  ngOnInit() {
    this.id =this.activateRoute.snapshot.params['id'];
    this.ownerForm = this.formBuilder.group({
      observation: new FormControl('', [Validators.required, Validators.maxLength(60)]),
      collectionType: new FormControl('', [Validators.required]),
      volume: new FormControl('', [Validators.required, Validators.maxLength(60)]),
      startDate: new FormControl('', [Validators.required, Validators.maxLength(60)]),
      endDate: new FormControl('', [Validators.required, Validators.maxLength(60)]),

    });
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
    this.precipitationService.postPrecipitation(this.f.observation.value,
      this.f.collectionType.value,this.f.volume.value,moment(this.f.startDate.value).format("YYYY-MM-DDTHH:mm:ssZZ"),
      moment(this.f.endDate.value).format("YYYY-MM-DDTHH:mm:ssZZ"),this.id).subscribe(() => {
      // redireciona a view
      this.volta();
    },
      (error) => {
        this.message = error;
      }

    );
  }
}
