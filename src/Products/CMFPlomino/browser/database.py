from AccessControl import Unauthorized
from jsonutil import jsonutil as json
from Products.Five import BrowserView
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from ..config import READ_PERMISSION


class DatabaseView(BrowserView):

    acl_template = ViewPageTemplateFile("templates/acl.pt")
    design_template = ViewPageTemplateFile("templates/design.pt")
    replication_template = ViewPageTemplateFile("templates/replication.pt")
    view_template = ViewPageTemplateFile("templates/opendatabase.pt")
    profiling_template = ViewPageTemplateFile("templates/profiling.pt")

    def __init__(self, context, request):
        self.context = context
        self.request = request
        self.form = self.context
        self.target = self.context

    def view(self):
        if self.context.checkUserPermission(READ_PERMISSION):
            if self.context.start_page:
                target = getattr(self.context, self.context.start_page, None)
                if target:
                    self.request.response.redirect(target.absolute_url())
            else:
                return self.view_template()
        else:
            raise Unauthorized("You cannot read this content")

    def design(self):
        return self.design_template()

    def profiling(self):
        return self.profiling_template()

    def code(self):
        if self.request.method == "GET":
            code = ""
            if self.request.get("Form") != None:
                formID = self.request.get("Form")
                form = self.context.getForm(formID)
                if not form :
                    return "##Unknown"

                code+= "## START document_title {\n"
                code+= form.document_title or ''
                code+= "\n## END document_title }\n\r"

                code+= "## START document_id {\n"
                code+= form.document_id or ''
                code+= "\n## END document_id }\n\r"

                code+= "## START search_formula {\n"
                code+= form.search_formula or ''
                code+= "\n## END search_formula }\n\r"

                code+= "## START onCreateDocument {\n"
                code+= form.onCreateDocument or ''
                code+= "\n## END onCreateDocument }\n\r"

                code+= "## START onOpenDocument {\n"
                code+= form.onOpenDocument or ''
                code+= "\n## END onOpenDocument }\n\r"

                code+= "## START beforeSaveDocument {\n"
                code+= form.beforeSaveDocument or ''
                code+= "\n## END beforeSaveDocument }\n\r"

                code+= "## START onSaveDocument {\n"
                code+= form.onSaveDocument or ''
                code+= "\n## END onSaveDocument }\n\r"

                code+= "## START onDeleteDocument {\n"
                code+= form.onDeleteDocument or ''
                code+= "\n## END onDeleteDocument }\n\r"

                code+= "## START onSearch {\n"
                code+= form.onSearch or ''
                code+= "\n## END onSearch }\n\r"

                code+= "## START beforeCreateDocument {\n"
                code+= form.beforeCreateDocument or ''
                code+= "\n## END beforeCreateDocument }\n\r"

            if self.request.get("FormField") != None:
                fieldID = self.request.get("FormField").split("/")
                field = self.context.getForm(fieldID[0]).getFormField(fieldID[1])

                if not field :
                    return "##Unknown"

                code+= "## START formula {\n"
                code+= field.formula or ''
                code+= "\n## END formula }\n\r"

                code+= "## START validation_formula {\n"
                code+= field.validation_formula or ''
                code+= "\n## END validation_formula }\n\r"

                code+= "## START html_attributes_formula {\n"
                code+= field.html_attributes_formula or ''
                code+= "\n## END html_attributes_formula }\n\r"

            if self.request.get("FormAction") != None:
                actionID = self.request.get("FormAction").split("/")
                action = self.context.getForm(actionID[0]).getFormActions()

                for act in action:
                    if act.id == actionID[1]:
                        code+= "## START content {\n"
                        code+= act.content or ''
                        code+= "\n## END content }\n\r"

                        code+= "## START hidewhen {\n"
                        code+= act.hidewhen or ''
                        code+= "\n## END hidewhen }\n\r"

                        break

            if self.request.get("View") != None:
                viewID = self.request.get("View")
                view = self.context.getView(viewID)

                if not view:
                    return "##Unknown"

                code+= "## START selection_formula {\n"
                code+= view.selection_formula or ''
                code+= "\n## END selection_formula }\n\r"

                code+= "## START form_formula {\n"
                code+= view.form_formula or ''
                code+= "\n## END form_formula }\n\r"

                code+= "## START onOpenView {\n"
                code+= view.onOpenView or ''
                code+= "\n## END onOpenView }\n\r"

            if self.request.get("ViewAction") != None:
                actionID = self.request.get("ViewAction").split("/")
                action = self.context.getView(actionID[0]).getActions()

            self.request.RESPONSE.setHeader(
                'content-type', 'text/plain; charset=utf-8')
            return code

        if self.request.method == "POST":
            return "post"
        return formID

    def tree(self):
        database = self.context.getParentDatabase()

        # Create form tree
        forms = []
        for form in database.getForms():
            fields = []
            for field in form.getFormFields():
                fields.append({
                    "label": field.id,
                    "url": field.absolute_url(),
                    "type" : 'field'
                })
            plomino_form = []
            plomino_form.append({
                "label" : "Fields",
                "folder" : True,
                "children" : fields,
                "type" : "fields",
            })
            actions = []
            for action in form.getFormActions():
                actions.append({
                    "label": action.id,
                    'type' : 'action',
                    "url" : action.absolute_url()
                })
            plomino_form.append({
                "label": "Actions",
                "folder": True,
                "children": actions,
                "type" : "actions",
            })
            forms.append({
                "label": form.id,
                "folder": True,
                "children": plomino_form,
                "type" : "form",
                "url" : form.absolute_url(),
            })

        # Create Views Tree
        views = []
        for view in database.getViews():
            plomino_view = []
            actions = []
            for action in view.getActions():
                # view.getActions() returns tuples
                actions.append({
                    "label": action[0].id,
                    "type": 'action',
                    "url": action[0].absolute_url()
                })
            plomino_view.append({
                "label": "Actions",
                "folder": True,
                "children": actions,
                "type": "actions",
            })
            columns = []
            for column in view.getColumns():
                columns.append({
                    "label": column.id,
                    "type": 'column',
                    "url": column.absolute_url()
                })
            plomino_view.append({
                "label": "Columns",
                "folder": True,
                "children": columns,
                "type": "columns",
            })
            views.append({
                "label": view.id,
                "type": "view",
                "children": plomino_view,
                "url": view.absolute_url(),
            })


        # Create Agents View
        agents = []
        for agent in database.getAgents():

            agents.append({
                "label" : agent.id,
                "type" : "agent",
                "url" : agent.absolute_url()
            })

        # Build the final element tree
        elements = [
            {
                "label": "Forms",
                "folder": True,
                "children": forms,
                "type" : 'database'
            },
            {
                "label": "Views",
                "folder": True,
                "children": views,
                "type" : 'views'
            },
            {
                "label": "Agents",
                "folder": True,
                "children": agents ,
                "type" : 'agents'
            }
        ]
        self.request.RESPONSE.setHeader(
            'content-type', 'application/json; charset=utf-8')
        return json.dumps(elements)

    def acl(self):
        return self.acl_template()

    def replication(self):
        return self.replication_template()
