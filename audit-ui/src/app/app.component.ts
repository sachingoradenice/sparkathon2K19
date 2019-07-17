import { Component, OnInit } from '@angular/core';
import { EntityService } from './services/entity.service';
import { Entity } from './models/entity.model';
import { BehaviorSubject } from 'rxjs';
import { EntityDataSource } from './ds/entity.datasource';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { HistoryDataSource } from './ds/history.datasource';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])]
})
export class AppComponent implements OnInit {
  
  title = 'CXOne Blockchain Based Audit Logs';
  columnsToDisplay = ["entity", "appName", "previousValue", "changedValue", "attribute", "eventTime", "history"];
  columnsNames = ["Entity", "Application", "Previous Value", "Changed Value", "Attribute", "Event Time"];
  dataSource: EntityDataSource;
  historyDataSource: HistoryDataSource;
  expandedElement: Entity = null;
  action: string = null;

  constructor(private entityService: EntityService) {
    this.historyDataSource = new HistoryDataSource(entityService);
  }

  getHistory(element) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.historyDataSource.loadHistory(element.entity, element.entity_instance_id);
  }

  ngOnInit(): void {
    this.dataSource = new EntityDataSource(this.entityService);
    this.dataSource.loadEntities();
  }

}
