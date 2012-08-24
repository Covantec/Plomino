from Products.CMFPlomino.interfaces import IXMLImportExport
from Products.CMFPlomino.interfaces import IPlominoField
from zope.component import adapts
from zope.interface import implements
from xml.dom.minidom import getDOMImplementation
from xml.dom.minidom import parseString

from archetypes.schemaextender.interfaces import IExtensionField

class ExtendedFieldImportExporter(object):
    adapts(IPlominoField)
    implements(IXMLImportExport)
    def __init__(self, context):
        self.context = context
    @property
    def fields(self):
        return [field for field in self.context.Schema().values()
                      if IExtensionField.providedBy(field)]
    def export_xml(self):
        impl = getDOMImplementation()
        doc = impl.createDocument(None, "extensionfields", None)
        root = doc.documentElement
        for field in self.fields:
            name = field.getName()
            value = field.get(self.context)
            fieldnode = doc.createElement('field')
            fieldnode.setAttribute('name', name)
            fieldnode.appendChild(doc.createTextNode(value))
            root.appendChild(fieldnode)
        return root.toxml()

    def import_xml(self, xml_strig):
        doc = parseString(xml_strig)
        schema = self.context.Schema()
        root = doc.childNodes[0]
        for fieldnode in root.childNodes:
            if fieldnode.nodeName !='field':
                continue
            field = schema[fieldnode.getAttribute('name')]
            field.set(self.context, fieldnode.childNodes[0].toxml())

