import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent {
  constructor(private http: HttpClient) {}

  train$ = this.http.get('http://localhost:3000/station/8004983/train/9023065078721211182-2310152208-9/planned/231015/22');
}
