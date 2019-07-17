import { DataSource } from '@angular/cdk/table';
import { Entity } from '../models/entity.model';
import  { Observable, BehaviorSubject, of } from 'rxjs';
import { EntityService } from '../services/entity.service';
import { CollectionViewer } from '@angular/cdk/collections';

export class EntityDataSource implements DataSource<Entity> {
    
    private entitiesSubject = new BehaviorSubject<Entity[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$ = this.loadingSubject.asObservable();

    constructor(private entityService: EntityService) {
    }

    connect(collectionViewer: CollectionViewer): Observable<Entity[] | readonly Entity[]> {
        return this.entitiesSubject.asObservable();
    }    
    
    disconnect(collectionViewer: CollectionViewer): void {
        this.entitiesSubject.complete();
        this.loadingSubject.complete();
    }

    loadEntities() {
        this.loadingSubject.next(true);

        this.entityService.getEntities()
        .subscribe((res:any[]) => {
            this.entitiesSubject.next(res)
        });

        this.loadingSubject.next(false);

    }
}