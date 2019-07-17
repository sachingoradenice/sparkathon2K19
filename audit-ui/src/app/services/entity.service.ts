import { Injectable } from '@angular/core';
import { Entity } from '../models/entity.model'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntityService {

  entityListUrl = "assets/data.json";
  entityHistoryUrl = "// TODO use correct URL";

  entities: Array<Entity> = [];

  constructor(private http: HttpClient) {
  }

  getEntities() {
    return this.http.get(this.entityListUrl);
  }

  getHistoryForKey(entity: string, entityInstanceId: string) {
    return this.http.get(this.entityListUrl);
  }

}
