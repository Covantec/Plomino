# -*- coding: utf-8 -*-

from collective.instancebehavior import (
    enable_behaviors,
    instance_behaviors_of,
    disable_behaviors,
)
from Products.CMFCore.CMFBTreeFolder import manage_addCMFBTreeFolder
from Products.CMFPlone.interfaces import IHideFromBreadcrumbs
from zope.interface import directlyProvides

from .config import SCRIPT_ID_DELIMITER, VERSION
from .index.index import PlominoIndex
from . import get_resource_directory


def afterDatabaseCreated(obj, event):
    obj.plomino_version = VERSION
    obj.setStatus("Ready")
    manage_addCMFBTreeFolder(obj, id='plomino_documents')
    directlyProvides(obj.documents, IHideFromBreadcrumbs)
    obj.ACL_initialized = 0
    obj.UserRoles = {}
    obj.initializeACL()
    index = PlominoIndex(FULLTEXT=obj.fulltextIndex)
    obj._setObject('plomino_index', index)
    for i in ['resources', 'scripts']:
        manage_addCMFBTreeFolder(obj, id=i)
    # Add permission to avoid manual confirmation dialog
    if not hasattr(obj, 'specific_rights'):
        obj.specific_rights = {'specific_deletedocument': 'PlominoAuthor'}
    # Create temporary file for attachment
    manage_addCMFBTreeFolder(obj, id='temporary_files')

    # Due to plone.protect we need to ensure the resource directory is created
    write_on_read = get_resource_directory()

def afterDatabaseMoved(obj, event):
    """
    """
    # If event oldName is not defiend, it is a new database, so skip the refreshDB
    if event.oldName and event.newName:
        obj.getIndex().renameDB(event.oldName, event.newName)

def afterFieldModified(obj, event):
    """
    """
    field_type = obj.field_type
    behavior = 'Products.CMFPlomino.fields.%s.I%sField' % (
        field_type.lower(),
        field_type.capitalize(),
    )

    # reset behavior if changed
    existing_behaviors = instance_behaviors_of(obj)
    if not(len(existing_behaviors) == 1 and existing_behaviors[0] == behavior):
        # clean up current behavior
        disable_behaviors(obj, existing_behaviors, [])

        # also clean up attributes declared in different field schema
        for attr in ['widget', 'format', 'type', ]:
            if hasattr(obj, attr):
                setattr(obj, attr, None)

        enable_behaviors(obj, [behavior, ], [])

    # cleanup compiled formulas
    obj.cleanFormulaScripts(
        SCRIPT_ID_DELIMITER.join(["field", obj.getPhysicalPath()[-2], obj.id]))

    # re-index
    db = obj.getParentDatabase()
    if obj.to_be_indexed and not db.do_not_reindex:
        db.getIndex().createFieldIndex(
            obj.id,
            obj.field_type,
            indextype=obj.index_type,
            fieldmode=obj.field_mode,
        )


def afterFormModified(obj, event):
    """
    """
    obj.cleanFormulaScripts(SCRIPT_ID_DELIMITER.join(["form", obj.id]))


def afterActionModified(obj, event):
    """
    """
    obj.cleanFormulaScripts(SCRIPT_ID_DELIMITER.join(
        ['action', obj.getParentNode().id, obj.id]))


def afterViewCreated(obj, event):
    """
    """
    pass # Now handled he afterViewMoved event


def afterViewMoved(obj, event):
    """ We need to ensure the view index name changes when the view name changes
    """
    db = obj.getParentDatabase()
    if event.newName is not None and db != event.newParent:
        # Event is not for us
        return
    obj.onRenameView(event.oldName, event.newName)



def afterViewModified(obj, event):
    """
    """
    if not obj.getParentNode():
        # modifying the view from folder_contents
        return
    db = obj.getParentDatabase()
    obj.cleanFormulaScripts(SCRIPT_ID_DELIMITER.join(["view", obj.id]))
    if not db.do_not_reindex:
        obj.getParentDatabase().getIndex().refresh()

def afterColumnMoved(obj, event):
    """
    """
    view = obj.getParentView()
    if event.newName is not None and view != event.newParent:
        # Event is not for us
        return
    view.onRenameColumn(obj, event.oldName, event.newName)


def afterColumnModified(obj, event):
    """
    """
    #TODO: if a col changed type, this doesn't remove the unwanted index
    # should iterate over the indexes and remove any no longer not needed
    view = obj.getParentView()
    view.declareColumn(obj.id, obj, refresh=False)
    obj.cleanFormulaScripts(
        SCRIPT_ID_DELIMITER.join(["column", view.id, obj.id, 'formula']))
    db = obj.getParentDatabase()
    if not db.do_not_reindex:
        db.getIndex().refresh()


def afterAgentModified(obj, event):
    """
    """
    obj.cleanFormulaScripts(SCRIPT_ID_DELIMITER.join(["agent", obj.id]))


def afterHidewhenModified(obj, event):
    """
    """
    obj.cleanFormulaScripts(SCRIPT_ID_DELIMITER.join(
        ['hidewhen', obj.getParentNode().id, obj.id]))

def afterDocumentRemoved(obj, event):
    """
    """
    if not obj.getParentDatabase():
        # modifying the view from folder_contents
        return
    db = obj.getParentDatabase()
    db.getIndex().unindexDocument(obj)