import { PlominoViewSaveProcess } from './view-save-process';
import { FakeFormData } from './../../utility/fd-helper/fd-helper';
import { Observable, Subject } from 'rxjs/Rx';
import { PlominoFormSaveProcess } from './form-save-process';
import { TinyMCEFormContentManagerService } from './../../editors/tiny-mce/content-manager/content-manager.service';
import { Injectable } from '@angular/core';
import { PlominoHTTPAPIService, ElementService, 
  WidgetService, PlominoActiveEditorService } from '../';
import { LabelsRegistryService } from '../../editors/tiny-mce/services';

@Injectable()
export class PlominoSaveManagerService {

  private savedStates: Map<string, string> = new Map<string, string>();
  private saveStack: Array<Observable<any>> = [];
  private saveNotifier: Subject<string> = new Subject<string>();
  private currentFormIsUnsaved: boolean = false;

  constructor(
    private contentManager: TinyMCEFormContentManagerService,
    private http: PlominoHTTPAPIService,
    private elementService: ElementService,
    private widgetService: WidgetService,
    private labelsRegistry: LabelsRegistryService,
    private activeEditorService: PlominoActiveEditorService,
  ) {
    Observable
      .interval(500)
      .flatMap(() => this.saveStack.length 
        ? this.saveStack.pop() : Observable.of(null))
      .subscribe((data) => {
        if (data) {
          this.saveNotifier.next(data.url);
        }
      });

    this.listenDocumentClicks();
    this.listenFormInnerChangeProcesses();
  }

  onBackgroundSaveProcessComplete() {
    return this.saveNotifier.asObservable();
  }

  nextEditorSavedState(editorId: string, state: string = null): void {
    this.savedStates.set(editorId, state || this.contentManager.getContent(editorId));
  }

  isEditorUnsaved(editorId: string): boolean {
    if (this.savedStates.has(editorId)) {
      return this.savedStates.get(editorId)
        !== this.contentManager.getContent(editorId);
    }
    else {
      return true;
    }
  }

  createViewSaveProcess(viewURL: string, formData: FakeFormData = null) {
    viewURL = viewURL.replace(/^(.+?)\/?$/, '$1');

    if (formData === null) {
      const $form = $('form[action="' + viewURL + '/@@edit"]');
      
      if (!$form.length) {
        debugger;
        return null;
      }

      formData = new FakeFormData(<HTMLFormElement> $form.get(0));
      formData.set('form.buttons.save', 'Save');
    }

    const process = new PlominoViewSaveProcess({
      immediately: false,
      formURL: viewURL,
      formData: formData,
      labelsRegistryLink: this.labelsRegistry,
      httpServiceLink: this.http,
      activeEditorServiceLink: this.activeEditorService,
      widgetServiceLink: this.widgetService
    });

    return process;
  }

  createFormSaveProcess(formURL: string, formData: FakeFormData = null) {
    formURL = formURL.replace(/^(.+?)\/?$/, '$1');

    if (formData === null) {
      const $form = $('form[action="' + formURL + '/@@edit"]');
      
      if (!$form.length) {
        return null;
      }

      formData = new FakeFormData(<HTMLFormElement> $form.get(0));
      formData.set('form.buttons.save', 'Save');
      formData.set('form.widgets.form_layout', this.contentManager.getContent(formURL));
    }

    const process = new PlominoFormSaveProcess({
      immediately: false,
      formURL: formURL,
      formData: formData,
      labelsRegistryLink: this.labelsRegistry,
      httpServiceLink: this.http,
      activeEditorServiceLink: this.activeEditorService,
      widgetServiceLink: this.widgetService
    });

    return process;
  }

  enqueueNewFormSaveProcess(formURL: string) {
    const process = this.createFormSaveProcess(formURL);
    this.saveStack.unshift(process.start());
  }

  detectNewIFrameInnerClick(ev: MouseEvent) {
    return this.onOutsideClick((<any>$).event.fix(ev), true);
  }

  detectNewFormSave() {
    this.currentFormIsUnsaved = false;
    this.cleanOutsideArea();
  }

  private listenDocumentClicks() {
    $('body').delegate('*', 'mousedown', ($event) => {
      const isFormClick = Boolean($($event.currentTarget)
        .closest('form:visible[data-pat-autotoc]').length);
      $event.stopPropagation();
      if (!isFormClick) {
        this.onOutsideClick($event, false).then(() => {}, () => {});
      }
    });
  }

  private listenFormInnerChangeProcesses() {
    $('body').delegate('form[id!="plomino_form"]', 'keydown input change paste', ($event) => {
      const isFormInnerEvent = $($event.currentTarget)
        .is('form:visible[data-pat-autotoc]');
      $event.stopPropagation();
      if (isFormInnerEvent && !($event.type === 'keydown' && $event.keyCode === 9)) {
        if (!this.currentFormIsUnsaved) {
          this.currentFormIsUnsaved = true;
          this.hackOutsideArea();
        }
      }
    });
  }

  private hackOutsideArea() {
    /* ngx-bootstrap tab switch */
    const $tabset = $('div.main-app.panel > tabset');
    const $tsb = $('<div id="tab-switch-block"></div>');

    $tsb.css({
      background: 'transparent',
      height: '50px',
      position: 'absolute',
      'z-index': 99999,
      width: '100%',
      top: 0,
      left: 0,
    });

    $tabset.prepend($tsb);

    /* palette tab change */
    const $tabset2 = $('plomino-palette > div > div.mdl-tabs__tab-bar');
    const $tsb2 = $('<div id="tab-switch-block-2"></div>');

    $tsb2.css({
      background: 'transparent',
      height: '60px',
      position: 'absolute',
      'z-index': 99999,
      width: '100%',
      top: 0,
      left: 0,
    });

    $tabset2.prepend($tsb2);

    /* tree field click */
    const $treeWrapperView = $('div.tree-wrapper > div > plomino-tree > div');
    const $tsb3 = $('<div id="tree-switch-block"></div>');

    $tsb3.css({
      background: 'transparent',
      height: '100%',
      position: 'absolute',
      // 'z-index': 99999,
      width: '100%',
      top: '20px',
      left: 0,
    });

    $treeWrapperView.prepend($tsb3);
  }

  private cleanOutsideArea() {
    $('#tab-switch-block,#tab-switch-block-2,#tree-switch-block').remove();
  }

  private onOutsideClick($event: JQueryEventObject, iframe: boolean): Promise<any> {
    /* here is outside click - check that form is changed or not */

    return new Promise((resolve, reject) => {

      const showUnsavedConfirmDialog = () => {
        return this.elementService
          .awaitForConfirm('The changes are not saved, continue?');
      };

      const resolveAndConfirm = (_iframe: boolean) => {
        this.currentFormIsUnsaved = false;
        this.cleanOutsideArea();
        if (!iframe) {
          try {
            const elementFromPoint = 
              <HTMLElement> document.elementFromPoint($event.pageX, $event.pageY);
            elementFromPoint.click();
          }
          catch (e) {

          }
        }
        resolve();
      };

      const $currentTarget = $($event.currentTarget);

      if (!this.currentFormIsUnsaved) {
        resolve();
      }
      else if (iframe || $currentTarget.is(
        '#tab-switch-block, #tab-switch-block-2, #tree-switch-block'
      )) {
        showUnsavedConfirmDialog()
          .then(() => resolveAndConfirm(iframe))
          .catch(() => reject('cancelled'));
      }
    });

    /**
     * 1. check that current form has got some edit processes
     * 2. if true -> in all touch points prevent it before confirmation
     * 3. on confirmation -> throw event
     * 
     * touch points:
     * 1. iframe inner mousedown
     * - prevent test: OK
     * 2. ngx-bootstrap tab switch
     * - prevent test: can't be prevented, hack - create up transparent div, OK
     * 3. palette tab change
     * - prevent test: can't be prevented, hack - create up transparent div, OK
     * 4. tree field click
     * - prevent test: can't be prevented, hack - create up transparent div, OK
     */
  }
}
