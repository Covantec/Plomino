# -*- coding: utf-8 -*-

from jsonutil import jsonutil as json
from plone.autoform import directives as form
from plone.autoform.interfaces import IFormFieldProvider, ORDER_KEY
from plone.supermodel import directives, model
from zope.interface import implementer, provider
from zope.pagetemplate.pagetemplatefile import PageTemplateFile
from zope import schema
from zope.schema.vocabulary import SimpleVocabulary

from .. import _
from ..config import SCRIPT_ID_DELIMITER
from ..exceptions import PlominoScriptException
from ..utils import asUnicode
from base import BaseField


@provider(IFormFieldProvider)
class IDoclinkField(model.Schema):
    """ Selection field schema
    """

    widget = schema.Choice(
        vocabulary=SimpleVocabulary.fromItems([
            ("Selection list", "SELECT"),
            ("Multi-selection list", "MULTISELECT"),
            ("Embedded view", "VIEW"),
            ("Datagrid","DATAGRID"),
        ]),
        title=u'Widget',
        description=u'Field rendering',
        default="SELECT",
        required=True)

    sourceview = schema.Choice(
        vocabulary='Products.CMFPlomino.fields.vocabularies.get_views',
        title=u'Source view',
        description=u'View containing the linkable documents',
        required=False)

    labelcolumn = schema.TextLine(
        title=u'Label column',
        description=u'View column used as label',
        required=False)

    associated_form = schema.Choice(
        vocabulary='Products.CMFPlomino.fields.vocabularies.get_forms',
        title=u'Associated form',
        description=u'Form to use to create/edit documents',
        required=False)

    form.widget('documentslistformula', klass='plomino-formula')
    documentslistformula = schema.Text(
        title=u'Documents list formula',
        description=u"Formula to compute the linkable documents list "
        "(must return a list of 'label|docid_or_path')",
        required=False)

    separator = schema.TextLine(
        title=u'Separator',
        description=u'Only apply if multiple values will be displayed',
        required=False)

# bug in plone.autoform means order_after doesn't moves correctly
IDoclinkField.setTaggedValue(ORDER_KEY,
                               [('widget', 'after', 'field_type'),
                                ('sourceview', 'after', ".widget"),
                                ('associated_form', 'after', ".sourceview"),
                                ('labelcolumn', 'after', ".associated_form"),
                                ('documentslistformula', 'after', ".labelcolumn"),
                                ('separator', 'after', ".documentslistformula"),
                               ]
)

@implementer(IDoclinkField)
class DoclinkField(BaseField):
    """
    """

    read_template = PageTemplateFile('doclink_read.pt')
    edit_template = PageTemplateFile('doclink_edit.pt')

    def getSelectionList(self, doc):
        """ Return the documents list, format: label|docid_or_path, use
        value is used as label if no label.
        """

        # if formula available, use formula, else use view entries
        f = self.context.documentslistformula
        if not f:
            if not(self.context.sourceview and self.context.labelcolumn):
                return []
            v = self.context.getParentDatabase().getView(self.context.sourceview)
            if not v:
                return []
            label_key = v.getIndexKey(self.context.labelcolumn)
            if not label_key:
                return []
            result = []
            for b in v.getAllDocuments(getObject=False):
                val = getattr(b, label_key, '')
                if not val:
                    val = ''
                result.append(asUnicode(val) + "|" + b.id)
            return result
        else:
            # if no doc provided (if OpenForm action), we use the PlominoForm
            if doc is None:
                obj = self.context.getParentNode()
            else:
                obj = doc
            try:
                s = self.context.runFormulaScript(
                    SCRIPT_ID_DELIMITER.join(['field',
                        self.context.getParentNode().id,
                        self.context.id,
                        'documentslistformula']),
                    obj,
                    f)
            except PlominoScriptException, e:
                p = self.context.absolute_url_path()
                e.reportError(
                    '%s doclink field selection list formula failed' %
                    self.context.id,
                    path=p + '/getSettings?key=documentslistformula')
                s = None
            if s is None:
                s = []

        # if values not specified, use label as value
        proper = []
        for v in s:
            l = v.split('|')
            if len(l) == 2:
                proper.append(v)
            else:
                proper.append(v + '|' + v)
        return proper

    def processInput(self, submittedValue):
        """
        """

        #TODO: Not sure if its save to create new documents here

        db = self.context.getParentDatabase()


        if submittedValue and submittedValue.startswith('['):
            # Assume its json from datagrid.
            value = json.loads(submittedValue)
            fields = self.getFieldMapping().split(',')
            value = []
            for row in value:
                if 'document_id' in row:
                    # existing document. update it
                    pass
                    form = db.getForm(row['Form'])
                    form.saveDocument(row)
                    value.append(row['document_id'])

                else:
                    # create a new document
                    #TODO will need to validate data
                    form = db.getForm(row['Form'])

                    # really hackly way to get the docid but plomino doesn't have nice api to return it
                    # or could create empty doc and then save on it?
                    doc_url = None
                    def fake_redirect(self, url):
                        doc_url = url
                    row['RESPONSE'] = Object()
                    row['RESPONSE'].redirect = fake_redirect

                    doc = form.createDocument(row)
                    # TODO: more robust way
                    docid = doc_url.split('/')[-1].split('?')[0]
                    row.append(docid)
            return value


        if "|" in submittedValue:
            return submittedValue.split("|")
        else:
            return submittedValue

    # I think this was never used
    # def tojson(self, selectionlist=None):
    #     """Return a JSON table storing documents to be displayed
    #     """
    #     if self.context.sourceview:
    #         sourceview = self.context.getParentDatabase().getView(
    #             self.sourceview)
    #         brains = sourceview.getAllDocuments(getObject=False)
    #         columns = [col for col in sourceview.getColumns()
    #                 if not col.hidden_column]
    #         column_ids = [col.id for col in columns]
    #
    #         datatable = []
    #         for b in brains:
    #             row = [b.id]
    #             for col in column_ids:
    #                 v = getattr(b, sourceview.getIndexKey(col))
    #                 if not isinstance(v, str):
    #                     v = unicode(v).encode('utf-8').replace('\r', '')
    #                 row.append(v or '&nbsp;')
    #             datatable.append(row)
    #     else:
    #         datatable = [v.split('|')[::-1] for v in selectionlist]
    #
    #     return json.dumps(datatable)


    def tojson(self, datatable):
        "just used for the datagrid to produce a json version for template"
        return json.dumps(datatable)

    def getDatagrid(self, value):
        """ return a list of dicts which have the field info just for the columns we care about.
        This will be used to render the datagrid and also to will be submitted back as json as the vable
        """


        paths = value
        fields = self.getFieldMapping()
        db = self.context.getParentDatabase()

        if self.context.sourceview:
            sourceview = self.context.getParentDatabase().getView(
                self.sourceview)
            # Lets reduce down to our paths
            #TODO: this is going to filter by access permissions? if so some might be missing
            brains = sourceview.getAllDocuments(getObject=False,
                                                request_query={'path':paths})

            datatable = []
            for b in brains:
                row = {}
                for col in fields:
                    v = getattr(b, sourceview.getIndexKey(col))
                    if not isinstance(v, str):
                        v = unicode(v).encode('utf-8').replace('\r', '')
                    row[col] = (v or '&nbsp;')
                datatable.append(row)
            return datatable

        form = self.getAssociatedForm()
        if form is not None:
            #HACK just get last part as id. Should do proper traverse. Could be other DB?
            datatable = []
            for path in paths:
                doc = db.getDocument(path.split('/')[-1])
                row = {}
                for field in fields:
                    row[field] = (doc.getValue(field))
                datatable.append(row)
            return datatable

        #TODO: handle a datatable when formula

        return []

    def getAssociatedForm(self):
        child_form_id = self.context.associated_form
        if child_form_id:
            db = self.context.getParentDatabase()
            return db.getForm(child_form_id)


    def getFieldMapping(self):
        """ work out which fields to display. Either based on sourceview, or associatedform, or
        based on the formula
         """
        #
        field_ids = None
        if self.context.sourceview:
            #TODO: for now just show the cols that are based on fields.
            # later we can show calculated cols but have to work out how to show when new row added dynamically

            sourceview = self.context.getParentDatabase().getView(
                self.sourceview)
            columns = [col for col in sourceview.getColumns()
                    if not col.hidden_column and col.displayed_field]
            field_ids = [col.displayed_field for col in columns]
            return ','.join(field_ids)
        #TODO: get first result of formula and return fields based on this? but need to cache so not run twice

        if self.context.associated_form:

            child_form_id = self.context.associated_form
            if not child_form_id:
                return ""

            db = self.context.getParentDatabase()
            child_form = db.getForm(child_form_id)
            return ','.join([f.id for f in child_form.getFormFields(includesubforms=True)])

        # TODO: need some better result if not settings. Should be all data? or just a id?
        return ['id']
