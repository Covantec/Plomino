## START selectionlistformula {

### START macro_field_selection_db_elements_2 ###

defaultitems = ['Select...|']
editpath = plominoContext.REQUEST.get('Plomino_Macro_Context')
Log('editpath %s' % editpath, 'macro_field_selection_db_elements/selectionlistformula', severity='debug')
if editpath is None:
    return defaultitems # we aren't being used in a popup
editcontext = plominoContext.restrictedTraverse(editpath)
Log('editcontext %s' % editcontext, 'macro_field_selection_db_elements/selectionlistformula', severity='debug')
ctype = editcontext.getPortalTypeName()
Log('ctype %s' % ctype, 'macro_field_selection_db_elements/selectionlistformula', severity='debug')
editform = None
if ctype != 'PlominoView':
    if ctype == 'PlominoForm':
        editform = editcontext
    else:
        editform = editcontext.getParentNode()
editdb = editcontext.getParentDatabase()
Log('editdb %s' % editdb, 'macro_field_selection_db_elements/selectionlistformula', severity='debug')

def item(elm, form_name=''):
    if form_name:
        return '{title} ({id}) from form: {form_name}|{id}'.format(id=elm.id, title=elm.Title(), form_name=form_name)
    return '{title} ({id})|{id}'.format(id=elm.id, title=elm.Title())

items = defaultitems
if ctype == 'PlominoField':
    items.append('Current field |%s' % editcontext.id)
for f in editform.getFormFields():
    try:
        if f.getPortalTypeName() == "PlominoField":
            items.append(item(f))
    except AttributeError:
        continue

return items

### END macro_field_selection_db_elements_2 ###
## END selectionlistformula }
