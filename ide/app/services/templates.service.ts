import { Injectable } from '@angular/core';

import { 
  Http, 
  Response 
} from '@angular/http';

import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class TemplatesService {
  $insertion: Subject<any> = new Subject();

  constructor(private http: Http) {}
  
  addTemplate(formUrl: string, templateId: string): Observable<any> {
    return this.http.get(`${formUrl}/add-template?id=${templateId}`).map(this.extractData);
  }

  getTemplate(formUrl: string, templateId: string): Observable<string> {
    return Observable.of(`
      <span class="plominoLabelClass mceNonEditable">Untitled</span>
      <span><input type="text"></span>
    `);
  }

  getTemplates(formUrl: string): Observable<any> {
    console.info('getTemplates called', formUrl);
    return this.http.get(`${formUrl}/@@list-templates`).map(this.extractData);
  }

  insertTemplate(templateData: any): void {
    this.$insertion.next(templateData);
  }

  getInsertion(): Observable<any> {
    return this.$insertion.asObservable();
  }

  private extractData(response: Response): Response {
    return response.json();
  }
}
