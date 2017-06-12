import { PlominoWorkflowItemEditorService } from './workflow.item-editor.service';
import { WFDragControllerService, DS_TYPE, DS_FROM_PALETTE } from './drag-controller';
import { TreeStructure } from './tree-structure';
import { FakeFormData } from './../../utility/fd-helper/fd-helper';
import { Component, ElementRef, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { PlominoBlockPreloaderComponent } from '../../utility';
import { DND_DIRECTIVES } from 'ng2-dnd';
import { treeBuilder, WF_ITEM_TYPE as WF } from './tree-builder';
import { PlominoWorkflowNodeSettingsComponent } from "../../palette-view";
import { PlominoWorkflowChangesNotifyService } from './workflow.changes.notify.service';
import { PlominoDBService, ElementService, LogService, 
  FormsService, DraggingService } from '../../services';

const NO_AUTOSAVE = false;
const AUTOSAVE = true;
const NO_AUTOUPGRADE = false;
const AUTOUPGRADE = true;

@Component({
  selector: 'plomino-workflow-editor',
  template: require('./workflow.component.html'),
  styles: [require('./workflow.component.sources.css')],
  directives: [DND_DIRECTIVES, PlominoBlockPreloaderComponent],
  providers: [PlominoWorkflowItemEditorService, WFDragControllerService],
  encapsulation: ViewEncapsulation.None,
})
export class PlominoWorkflowComponent implements OnInit {
  @ViewChild('workflowEditorNode') workflowEditorNode: ElementRef;
  tree: TreeStructure;
  latestTree: TreeStructure = null;
  editorOffset: { top: number, left: number };

  constructor(
    private log: LogService,
    private formsService: FormsService,
    private elementService: ElementService,
    private workflowChanges: PlominoWorkflowChangesNotifyService,
    private dragService: DraggingService,
    private dragController: WFDragControllerService,
    private itemEditor: PlominoWorkflowItemEditorService,
    private dbService: PlominoDBService,
  ) {
    /* mark current dragging item as nothing */
    if (!this.dragService.dndType) {
      this.dragService.followDNDType('nothing');
    }

    /* listen to forms delete */
    this.formsService.formRemoved$
      .subscribe((formId) => {
        const item = this.findWFItemByFormOrViewId(formId.split('/').pop());
        if (item !== null) {
          item[item.type === WF.FORM_TASK ? 'form' : 'view'] = '';
          this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
        }
      });

    /* listen to forms ids update */
    this.formsService.formIdChanged$
      .subscribe((data: { oldId: string, newId: string }) => {
        const item = this.findWFItemByFormOrViewId(data.oldId.split('/').pop());
        if (item !== null) {
          item[
            item.type === WF.FORM_TASK ? 'form' : 'view'
          ] = data.newId.split('/').pop();
          this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
        }
      });

    /* listen to external save trigger */
    this.workflowChanges.needSave$
      .subscribe(() => this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE));

    /* listen to external add trigger */
    this.workflowChanges.runAdd$
      .subscribe((wfType) => {
        let correctId = this.tree.getLatestId();
        const dragData = { title: '', type: wfType };
        let $item = $('.workflow-node[data-node-id="' + correctId +'"]');
        
        while (!$item.length || !this.isDropAllowed($item, wfType)) {
          if (correctId <= 1) { return; }
          correctId = correctId - 1;
          $item = $('.workflow-node[data-node-id="' + correctId +'"]');
        }

        this.dragService.followDNDType('wf-menu-dnd-callback');
        this.dragInsertPreview(
          $('.workflow-node[data-node-id="' + correctId +'"]'), dragData);
        this.onDrop();
      });

    this.itemEditor.init();
  }

  ngOnInit() {
    /* lazy loading for firefox */
    window['materialPromise'].then(() => {
      setTimeout(() => this.initialize(), 100);
    });
    /* fill outside space with correct color */
    setTimeout(() => {
      $('tabset tab.active.tab-pane').css('background', '#fafafa')
    }, 1);
  }

  initialize() {
    let tree;

    try {
      const dbLink = this.dbService.getDBLink();
      const fd = new FakeFormData(<any> $(`form[action*="${ dbLink }/@@edit"]`).get(0));
      tree = JSON.parse(fd.get('form.widgets.IBasic.description'));

      if (!fd.get('form.widgets.IBasic.description')) {
        tree = { id: 1, root: true, children: [] };
      }
    }
    catch(e) {
      tree = { id: 1, root: true, children: [] };
    }

    if (!tree.children.length) {
      tree.id = 1;
    }

    this.tree = new TreeStructure(tree);
    this.buildWFTree(this.tree, NO_AUTOSAVE, AUTOUPGRADE);
    this.itemEditor.registerTree(this.tree);

    this.editorOffset = $(this.workflowEditorNode.nativeElement).offset();
    this.dragController.registerWorkflowOffset(this.editorOffset);

    /* listen to dragController save trigger */
    this.dragController.rebuildWorkflow$.subscribe(() => {
      this.buildWFTree(this.tree, NO_AUTOSAVE, AUTOUPGRADE);
    });

    /* listen to DRAG ENTER event */
    this.dragController.enter$
      .map((data: ReceiverEvent) => {
        if (!data.item) {
          data.item = this.tree.getItemById(this.dragController.getHoveredId());
        }
        return data;
      })
      .subscribe(this.onItemDragEnter.bind(this));
    
    /* listen to DROP event */
    this.dragController.drop$
      .map((data: ReceiverEvent) => {
        if (data.item && data.item.type === 'fake') {
          data.item = this.tree.getItemById(data.item.id);
        }
        return data;
      })
      .subscribe(this.onDrop.bind(this));
    
    /* listen to DRAG LEAVE event */
    this.dragController.leave$
      .map((data: ReceiverEvent) => {
        if (data.item && data.item.type === 'fake') {
          data.item = this.tree.getItemById(data.item.id);
        }
        return data;
      })
      .subscribe(this.onItemDragLeave.bind(this));
  }

  /**
   * find workflow item by it's own form or view id
   * @param {string} fvId form or view id (not full url)
   * @param {TreeStructure} tree
   * @return {PlominoWorkflowItem|null} found item or null
   */
  findWFItemByFormOrViewId(fvId: string, tree = this.tree): PlominoWorkflowItem {
    let result: PlominoWorkflowItem = null;

    this.tree.iterate((item) => {
      if (item.form === fvId || item.view === fvId) {
        result = item;
      }
    });

    return result;
  }

  /**
   * delete workflow item by it's node and item object
   * @param wfNode item's DOM NodeElement which contains class .workflow-node
   * @param targetItem 
   */
  deleteWFItem(wfNode: HTMLElement, targetItem: PlominoWorkflowItem) {
    if (targetItem.type === WF.CONDITION || targetItem.type === WF.PROCESS) {
      /* if 1 branch -> assume to remove only it, not whole */
      const aloneBranch = targetItem.type === WF.PROCESS
        && this.tree.getItemParentById(targetItem.id).children.length === 1;
      const aloneCondition = targetItem.type === WF.CONDITION
        && targetItem.children.length === 1;
      if (aloneBranch || aloneCondition) {
        this.elementService.awaitForConfirm('One branch. Remove just division?')
        .then(() => {
          const idParent = this.tree.getItemParentById(targetItem.id).id;
          const idChildren = targetItem.children[0].id;
          const idItem = targetItem.id;
          this.tree.deleteNodeById(aloneBranch ? idParent : idChildren);
          this.tree.deleteNodeById(idItem);
          this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
        })
        .catch(() => {
          this.elementService.awaitForConfirm(
            targetItem.type === WF.CONDITION 
              ? 'This action will remove the branches below'
              : 'This action will remove the branch below')
          .then(() => {
            this.tree.deleteBranchByTopItemId(targetItem.id);
            this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
          })
          .catch(() => {});
        });
      }
      else {
        /* else */
        this.elementService.awaitForConfirm(
          targetItem.type === WF.CONDITION 
            ? 'This action will remove the branches below'
            : 'This action will remove the branch below')
        .then(() => {
          this.tree.deleteBranchByTopItemId(targetItem.id);
          this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
        })
        .catch(() => {});
      }
    }
    else {
      this.tree.deleteNodeById(targetItem.id);
      const $wfItemClosest = $(wfNode);
      $wfItemClosest.fadeOut(100, () => 
        this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE));
    }
  }

  /**
   * build temporary tree (preview what will happen after drag drop)
   * can be used for new item insert with onDrop function
   * @param {JQuery} parentItem - closest .workflow-node to the mouse cursor
   * @see this.onDrop
   */
  dragInsertPreview($parentItem: JQuery, dragData: { title: string, type: string }) {
    if ($parentItem.hasClass('workflow-node--dropping')) {
      return false; // do nothing
    }

    const previewItem: PlominoWorkflowItem = {
      id: -1,
      dropping: true,
      type: dragData.type,
      children: (<any> dragData).children || []
    };

    /* copy original tree to temporary sandbox-tree */
    const sandboxTree = this.tree.createSandbox();

    /* current preview way is just a way to temporary change the tree */
    const nodeId = +$parentItem.attr('data-node-id') || 1;
    let parentItem = sandboxTree.getItemById(nodeId);

    if (!parentItem) {
      return;
    }

    if (this.dragService.dndType !== DS_TYPE.EXISTING_WORKFLOW_ITEM) {
      
      if ([WF.FORM_TASK, WF.VIEW_TASK, WF.EXT_TASK].indexOf(dragData.type) !== -1) {
        previewItem.title = '';
  
        if (dragData.type === WF.FORM_TASK) {
          previewItem.form = '';
        }
        else if (dragData.type === WF.VIEW_TASK) {
          previewItem.view = '';
        }
      }
      else if (dragData.type === WF.PROCESS) {
        previewItem.title = '';
      }
      else if (dragData.type === WF.GOTO) {
        previewItem.goto = '';
      }
      else if (dragData.type === WF.CONDITION) {

        if (parentItem.type === WF.CONDITION) {
          previewItem.type = WF.PROCESS;
          previewItem.title = '';
        }
        else {
          previewItem.condition = '';
    
          const truePreviewItem: PlominoWorkflowItem = {
            id: -2,
            title: '',
            dropping: true,
            type: WF.PROCESS,
            children: []
          };
    
          const falsePreviewItem: PlominoWorkflowItem = {
            id: -3,
            title: '',
            dropping: true,
            type: WF.PROCESS,
            children: []
          };
    
          previewItem.children = [
            truePreviewItem, falsePreviewItem
          ];
        }
      }
  
      if (this.dragService.dndType.slice(0, 16) === DS_TYPE.EXISTING_TREE_ITEM) {
        const dragFormData = this.dragService.dndType.slice(18).split('::');
        dragFormData.pop();
        previewItem.title = dragFormData.pop();
        previewItem[previewItem.type === WF.FORM_TASK 
          ? 'form' : 'view'] = dragFormData.pop().split('/').pop();
      }
    }
    
    if (parentItem) {
      sandboxTree.pushNewItemToParentById(previewItem, parentItem.id);

      /* compare trees - if they are equal then do nothing */
      if (this.latestTree !== null) {
        if (sandboxTree.getCountOfNodes() === this.latestTree.getCountOfNodes()) {
          const hashA = sandboxTree.toJSON();
          const hashB = this.latestTree.toJSON();
          if (hashA === hashB) {
            return false;
          }
        }
      }
      
      this.buildWFTree(sandboxTree, NO_AUTOSAVE, NO_AUTOUPGRADE);
    }
  }

  /**
   * is this drop allowed?
   * @param wfItemClosest closest .workflow-node's JQuery object
   * @param dType drag type name
   */
  isDropAllowed($wfItemClosest: JQuery, dType: string): Boolean {
    let allowedDrag = true;
    const closestExists = Boolean($wfItemClosest.length);
    const onGoto = closestExists && $wfItemClosest.hasClass('workflow-node--goto');
    const onCond = closestExists && $wfItemClosest.hasClass('workflow-node--condition');
    const onRoot = closestExists && $wfItemClosest.hasClass('workflow-node--root');
    const isProcOrCondDrag = [WF.PROCESS, WF.CONDITION].indexOf(dType) !== -1;
    const isBranchDrag = dType === WF.CONDITION;
    const isGotoDrag = dType === WF.GOTO;
    const lvl = closestExists ? +$wfItemClosest.attr('data-node-level') : 0;

    if ((onCond && !isBranchDrag) || onGoto 
      || (onRoot && (isProcOrCondDrag || isGotoDrag))
    ) {
      allowedDrag = false;
    }

    if (allowedDrag && isGotoDrag) {
      allowedDrag = !Boolean($('[data-node-level="' + (lvl + 1) + '"]').length);
    }

    return allowedDrag;
  }

  /**
   * same function as isDropAllowed but for drag and drop existing items
   * @param itemA first item which begin swapping with itemB
   * @param itemB target item, which begin swapped with itemA
   */
  isSwapAllowed(itemA: PlominoWorkflowItem, itemB: PlominoWorkflowItem): Boolean {
    const isBranch = (item: PlominoWorkflowItem) => 
      item.type === WF.PROCESS;
    const isCondition = (item: PlominoWorkflowItem) => 
      item.type === WF.CONDITION;
    const isGoto = (item: PlominoWorkflowItem) => 
      item.type === WF.GOTO;
    const isLowestElementInBranch = (item: PlominoWorkflowItem) => 
      !item.children.length;

    const bothItems = (query: (item: PlominoWorkflowItem) => Boolean) => 
      query(itemA) && query(itemB);
    const oneOfItems = (query: (item: PlominoWorkflowItem) => Boolean) => 
      query(itemA) || query(itemB);
    
    if (bothItems(isBranch)) {
      return true;
    }
    else if (oneOfItems(isCondition)) {
      return false;
    }
    else if (bothItems(isGoto)) {
      return true;
    }
    else if (oneOfItems(isGoto)) {
      return isGoto(itemA) 
        ? isLowestElementInBranch(itemB) 
        : isLowestElementInBranch(itemA);
    }
    else if (isBranch(itemA)) {
      return false;
    }
    else if (isBranch(itemB)) {
      return true;
    }

    return true;
  }

  /**
   * drop function
   * can be used to create elements in tree
   * @param {ReceiverEvent} data object which contains all information for drop
   */
  onDrop(data: ReceiverEvent = null) {
    if (data && data.dragServiceType === DS_TYPE.EXISTING_WORKFLOW_ITEM) {
      /* swap items */
      const selected = this.itemEditor.getSelectedItem();
      if (this.isSwapAllowed(selected, data.item)) {
        if (data.item.type === WF.PROCESS && selected.type !== WF.PROCESS) {
          this.tree.moveNodeToAnotherParentById(selected.id, data.item.id);
        }
        else {
          this.tree.swapNodesByIds(selected.id, data.item.id);
        }
      }

      this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
    }
    else {
      const sandboxTree = this.latestTree;
      const temporaryItem = sandboxTree.getItemById(-1);
  
      if (temporaryItem) {
        sandboxTree.makeItemReal(temporaryItem);
    
        if (temporaryItem.type === WF.CONDITION) {
          const temporaryTrueProcessItem = sandboxTree.getItemById(-2);
          sandboxTree.makeItemReal(temporaryTrueProcessItem);
    
          const temporaryFalseProcessItem = sandboxTree.getItemById(-3);
          sandboxTree.makeItemReal(temporaryFalseProcessItem);
        }
    
        this.tree = sandboxTree;
        this.itemEditor.registerTree(this.tree);
        this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
      }
    }
  }

  /**
   * callback which fired when user triggers DRAG LEAVE on workflow item
   * @param {ReceiverEvent} data object which contains common information about event
   */
  onItemDragLeave(data: ReceiverEvent) {
    if (data.dragServiceType !== DS_TYPE.EXISTING_WORKFLOW_ITEM) {
      this.buildWFTree(this.tree, NO_AUTOSAVE, AUTOUPGRADE);
    }
  }

  /**
   * callback which fired when user triggers DRAG ENTER on workflow item
   * @param {ReceiverEvent} data object which contains common information about event
   */
  onItemDragEnter(data: ReceiverEvent) {
    if (data.dragServiceType !== DS_TYPE.EXISTING_WORKFLOW_ITEM) {
      /* drag from palette */
      const dragEvent = {
        dragData: {
          title: '',
          type: data.dragServiceType.slice(0, 16) === DS_TYPE.EXISTING_TREE_ITEM 
            ? (data.dragServiceType.slice(18).split('::').pop() === 'Views' 
            ? WF.VIEW_TASK : WF.FORM_TASK) : data.dragServiceType
        },
        mouseEvent: data.dragEvent,
      };
      if (this.isDropAllowed($(data.wfNode), dragEvent.dragData.type)) {
        this.dragInsertPreview($(data.wfNode), dragEvent.dragData);
      }
    }
  }

  /**
   * .workflow-node DOM element ondragstart event callback
   * @param eventData 
   * @param wfNode 
   * @param item 
   */
  onItemDragStart(eventData: DragEvent, wfNode: HTMLElement, item: PlominoWorkflowItem) {
    this.dragService.followDNDType(DS_TYPE.EXISTING_WORKFLOW_ITEM);
    this.itemEditor.setSelectedItem(item);
    this.dragController.receive(
      eventData, 'start', DS_TYPE.EXISTING_WORKFLOW_ITEM, wfNode, item
    );
  }

  /**
   * .workflow-node DOM element ondragend event callback
   * @param eventData 
   * @param wfNode 
   * @param item 
   */
  onItemDragEnd(eventData: DragEvent, wfNode: HTMLElement, item: PlominoWorkflowItem) {
    this.dragController.receive(
      eventData, 'end', DS_TYPE.EXISTING_WORKFLOW_ITEM, wfNode, item
    );
  }

  /**
   * make all workflow items not selected
   */
  unselectAllWFItems() {
    this.tree.iterate((wfItem) => {
      wfItem.selected = false;
    });

    this.workflowEditorNode.nativeElement
      .querySelectorAll('.workflow-node--selected')
      .forEach((selectedNode: HTMLElement) => {
        selectedNode.classList.remove('workflow-node--selected');
      });
  }

  /**
   * click event control function
   * @param clickEvent browser click event
   */
  onClickReceive(clickEvent: MouseEvent) {
    this.log.info(clickEvent.target);
    clickEvent.stopPropagation();
    
    /**
     * click event target HTMLElement
     * @type {HTMLElement}
     */
    const eventTarget = <HTMLElement> clickEvent.target;

    /* searching target workflow node */
    let $tmp = $(eventTarget).closest('.workflow-node');
    let wfNode = $tmp.length ? $tmp.get(0) 
      : ($(eventTarget).hasClass('workflow-node') ? eventTarget : null);

    if (wfNode === null) {
      $tmp = $(eventTarget)
        .closest('.plomino-workflow-editor__branch')
        .find('.workflow-node');
      if ($tmp.length) {
        wfNode = $tmp.get(0);
      }
      else {
        return false;
      }
    }
    
    /**
     * is workflow item delete button clicked
     */
    const isDelBtn = treeBuilder.checkTarget(eventTarget, 'workflow-node__bubble-delete');
    
    /**
     * is the small plus button between two workflow items clicked
     */
    const isAddBelow = treeBuilder.checkTarget(eventTarget, 
      'plomino-workflow-editor__branch-add-below-bubble-btn');
    
    /**
     * is the submenu item of bubble creation menu clicked (at bottom or at between items)
     */
    const isCreate = eventTarget.dataset.create;

    /**
     * is the plus button at the bottom of the branch clicked
     */
    const isVirtual = wfNode.classList.contains('workflow-node--virtual');
    
    /** 
     * is the root item clicked
     */
    const isRoot = wfNode.classList.contains('workflow-node--root');
    const isRootBranch = wfNode.classList
      .contains('plomino-workflow-editor__branches--root');

    /**
     * clicked workflow item object using founded workflow node NodeElement
     */
    const item = this.tree.getItemById(+wfNode.dataset.nodeId);

    if ((!isCreate && !isVirtual && !isAddBelow) || isRootBranch) {
      $('.mdl-menu__container').removeClass('is-visible');
    }

    /* if no closest item to click event and no submenu event - go away */
    if (!item && !isCreate) {
      return true;
    }

    if (isCreate) {
      const $wfItemClosest = $(isVirtual 
        ? wfNode.parentElement.parentElement
          .parentElement.firstElementChild 
        : wfNode.parentElement.firstElementChild);
      this.dragService.followDNDType('wf-menu-dnd-callback');
      this.dragInsertPreview($wfItemClosest, { title: '', type: isCreate });
      return this.onDrop();
    }

    if (!isRoot && !item.selected && !isDelBtn && !isCreate && !isVirtual && !isAddBelow) {
      this.unselectAllWFItems();
      item.selected = true;
      this.itemEditor.setSelectedItem(item);
      wfNode.classList.add('workflow-node--selected');
    }

    if (!isRoot && isDelBtn) {
      return this.deleteWFItem(wfNode, item);
    }
    else if (!isRoot && wfNode.classList.contains('workflow-node--condition')) {
      const newLogicItem: PlominoWorkflowItem = {
        id: null,
        dropping: false,
        title: '',
        type: WF.PROCESS,
        children: []
      };
  
      this.tree.pushNewItemToParentById(newLogicItem, item.id);
      return this.buildWFTree(this.tree, AUTOSAVE, AUTOUPGRADE);
    }
    else if (!isRoot && eventTarget.classList.contains('workflow-node__text-modal-link')) {
      if (eventTarget.parentElement.classList.contains('workflow-node__text--form')
        || eventTarget.parentElement.classList.contains('workflow-node__text--view')
      ) {
        if (item.form || item.view) {
          this.itemEditor.openResourceTab(item);
        }
        else {
          this.itemEditor.showModal(item);
        }
      }
      else if (item.type === WF.PROCESS 
        || eventTarget.parentElement.classList.contains('workflow-node__text--process')
      ) {
        /* process modal */
        this.itemEditor.showModal(item, true);
      }
      else {
        /* just modal */
        this.itemEditor.showModal(item);
      }
    }
    else if (item && item.type === WF.GOTO && item.goto) {
      $('.workflow-node[data-node-id="' + item.goto +'"]').get(0).scrollIntoView(false);
    }

    return true;
  }

  buildWFTree(tree = this.tree, autosave = AUTOSAVE, upgrade = NO_AUTOUPGRADE) {
    this.latestTree = tree;
    const wfTree: HTMLElement = this.workflowEditorNode.nativeElement;
    wfTree.innerHTML = treeBuilder.getBuildedTree(tree.getRawTree());
    const $wfTree: JQuery = $(wfTree);

    $wfTree.find('.workflow-node').each((i, wfNode: HTMLElement) => {
      const item = tree.getItemById(+wfNode.dataset.nodeId);

      if (!item || item.root) { return true; }
      if (item.type !== WF.CONDITION) {
        wfNode.ondragstart = (eventData: DragEvent) => {
          eventData.dataTransfer.setData('text', 'q:' + item.id.toString());
          return this.onItemDragStart(eventData, wfNode, item);
        };
      }

      wfNode.ondragend = (eventData: DragEvent) => {
        return this.onItemDragEnd(eventData, wfNode, item);
      };

      wfNode.ondragover = (eventData: DragEvent) => {
        eventData.preventDefault();
        eventData.stopImmediatePropagation();
      };
    });

    if (upgrade) {
      setTimeout(() => componentHandler.upgradeElements(wfTree), 200);
    }

    if (autosave) {
      const jsonTree = this.tree.toJSON();
      const dbLink = this.dbService.getDBLink();
      const raw = this.tree.getRawTree();
      const firstExists = raw.children.length > 0;
      const firstChildIsForm = firstExists && raw.children[0].type === WF.FORM_TASK;
  
      const fd = new FakeFormData(<any> $(`form[action*="${ dbLink }/@@edit"]`).get(0));
      fd.set('form.widgets.IBasic.description', jsonTree);

      const updatingData = {
        'description': jsonTree
      };

      if (firstExists) {
        const startPage = raw.children[0][firstChildIsForm ? 'form' : 'view'];
        fd.set('form.widgets.start_page', startPage);
        updatingData['start_page'] = startPage;
      }

      this.elementService
        .updateDBSettings(updatingData)
        .subscribe((response) => {});
    }

    return true;
  }
}
