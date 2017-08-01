import { PlominoTabsManagerService } from './../../services/tabs-manager/index';
import { Component, OnInit, OnDestroy, AfterViewInit, 
  Input, Output, EventEmitter } from '@angular/core';
import { PopoverComponent } from '../popover';
import { ElementService, TabsService, PlominoDBService } from '../../services';
import { DROPDOWN_DIRECTIVES } from 'ng2-bootstrap/ng2-bootstrap';

declare var ace: any;

@Component({
    selector: 'plomino-ace-editor',
    template: require("./ace-editor.component.html"),
    styles: [`
        .ace-editor {
            display: block;
            height: 858px;
            text-align: left;
        }
        .popover {
            width: 500px;
        }
        .toolbar {
            background-color: #F2F2F2;
            width: 100%;
            padding: 3px;
        }
        .dropdown-item {
            cursor: pointer;
        }
        .dropdown-menu {
            width: 195px;
        }
    `],
    directives: [DROPDOWN_DIRECTIVES, PopoverComponent],
    providers: [ElementService]
})
export class ACEEditorComponent implements OnDestroy, OnInit {
    @Input() aceNumber: number;
    @Input() url: string;
    @Input() path: any;
    @Output() isDirty = new EventEmitter();

    methodInfo: any;
    methodList: any[];
    name: string;
    type: string;
    fullType: string;
    editor: any;
    id: string;

    constructor(
      private _elementService: ElementService,
      private tabsManagerService: PlominoTabsManagerService,
      private dbService: PlominoDBService,
    ) {
      this.tabsManagerService.onRefreshCodeTab$
        .subscribe((fieldURL: string) => {
          if (this.url === fieldURL) {
            this.tabsManagerService.flushTabContentState(this.getCurrentTabId());
            this.ngOnInit();
            this.ngAfterViewInit();
            this.tabsManagerService.setActiveTabDirty(false);
          }
        });
    }

    private generateHash(str: string): number {
      var hash = 0, i, chr;
      if (str.length === 0) return hash;
      for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    ngOnInit() {
        this.id = 'editor' + this.generateHash(this.url);
        const codeId = this.getCurrentTabId();
        const stateData = this.tabsManagerService.getTabSavedContentState(codeId);
        this._elementService.getElement(this.url).subscribe((data) => {
            this.type = data['@type'];
            this.fullType = data.parent['@type']
                .replace('Plomino', '')
                .replace('Database', '') + this.type.replace('Plomino', '');
            this.name = this.url.replace(window.location.href
                .replace("++resource++Products.CMFPlomino/ide/index.html",""), "");

            const dbLink = this.dbService.getDBLink();
            this.name = this.name.replace(dbLink + '/', '')
              .replace(window.location.protocol + '//' + window.location.host, '');
                
            this._elementService
              .getElementCode(`${ dbLink }/code?${ this.fullType }=${ this.name }`)
              .subscribe((code: string) => {
                let parsed = JSON.parse(code);
                this.editor.setValue(stateData ? stateData.content : parsed.code, -1);
                this.methodList = parsed.methods;
                this.editor.getSession().on('change', () => {
                    this.isDirty.emit(true);
                });
                this.addMethodInfos();
                this.editor.getSession().setUndoManager(new ace.UndoManager());
              });
        })
    }

    ngOnDestroy() {
      const codeId = this.getCurrentTabId();
      /**
       * save current state on tab close
       */
      const prevStateContent = this.editor.getSession().getValue();
      this.tabsManagerService.saveTabContentState(codeId, {
        content: prevStateContent,
      });
    }

    getCurrentTabId() {
      return this.id;
    }

    ngAfterViewInit() {
        this.editor = ace.edit('editor' + this.generateHash(this.url));
        this.editor.setTheme("ace/theme/xcode");
        this.editor.getSession().setMode("ace/mode/python");
        this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });
        let staticWordCompleter = {
            getCompletions: (editor: any, session: any, pos: any, prefix: any, callback: any) => {
                var wordList = this.getMethodList();
                callback(null, wordList.map(function(word: any) {
                    return {
                        caption: word.caption,
                        value: word.value,
                        meta: "methods"
                    };
                }));
            }
        }
        this.editor.completers = [];
        this.editor.completers.push(staticWordCompleter);
        this.editor.commands.addCommand({
            name: 'saveFile',
            bindKey: {
                win: 'Ctrl-S',
                mac: 'Command-S',
                sender: 'editor|cli'
            },
            exec: (env: any, args: any, request: any) => {
                this.save();
            }
        });
    }

    addMethod(id: string) {
        this.editor.getSession().insert({
            row: this.editor.getSession().getLength(),
            column: 0
        }, "\n\n## START " + id + " {\n\n## END " + id + " }");
        this.addMethodInfos();
    }

    save() {
        this._elementService.postElementCode(
            "../../@@code",
            this.fullType,
            this.name,
            this.editor.getSession().getValue()
        ).subscribe((response: any) => {
            this.addMethodInfos();
            if (response.type == "OK") {
                this.isDirty.emit(false);
            }
            if (response.type == "Error") {
                let annotations = this.editor.getSession().getAnnotations();
                annotations.push({
                    row: response.line-1,
                    html: response.error,
                    type: "error"
                });
                this.editor.getSession().setAnnotations(annotations);
            }
        });
    }

    addMethodInfos() {
        let methods: any[] = [];
        for (let i = this.editor.getSession().getLength(); i >= 0; i--) {
            if (this.editor.getSession().getLine(i).match(/^##.START.*{$/) != null) {
                let id = this.editor.getSession().getLine(i)
                    .match(/^##.START(.*){$/).pop().trim();
                let {name, desc, error} = this.getMethodInfos(id);
                methods.push({
                    row: i,
                    html: "<strong>" + name + "</strong> <br>" + desc,
                    type: error ? "error" : "info"
                })
            }
        }
        this.editor.getSession().setAnnotations(methods);
    }

    getMethodInfos(id: string) {
        for (let method of this.methodList) {
            if (method.id === id) {
                return {
                    name: method.name,
                    desc: method.desc,
                    error: false
                }
            }
        }
        return {
            name: 'Not found',
            desc: 'Method doesn\'t exist',
            error: true
        }
    }

    getMethodList(): any[] {
        let buildMethod = (name: string) => {
            return {
                caption: name,
                value: "## START " + name + " {\n\n## END " + name + " }",
                popup: false
            }
        };
        switch (this.type) {
            case "PlominoForm":
                return this.methodList.map((method) => ({
                    caption: method.id,
                    value: "## START " + method.id + " {\n\n## END " + method.id + " }",
                    popup: false
                }));
            case "PlominoField":
                return [
                    buildMethod("formula"),
                    buildMethod("validation_formula"),
                    buildMethod("html_attributes_formula")
                ]
            case "PlominoAction":
                return [
                    buildMethod("content"),
                    buildMethod("hidewhen")
                ]
            case "PlominoView":
                return [
                    buildMethod("selection_formula"),
                    buildMethod("form_formula"),
                    buildMethod("onOpenView")
                ]
        }
    }
}
