*** Setting ******************************************************************
Library     DragDrop.py


*** Keywords *****************************************************************

# --- Test Setup  ------------------------------------------------------------
Setup For View
  Open SauceLabs test browser
  I can create a new form "frm_empdata" and add some fields
  and I can add contents to "frm_empdata"

I can create a new form "${frm_empdata}" and add some fields
  Given a logged-in test user
   and I open the ide for "mydb"
   and I add a form by click
   and I add some fields to the form
   and I save the form as "${frm_empdata}"

a new form "${formid}" is created and some fields are added
    Given a logged-in test user
   and I open the ide for "mydb"
   and I add a form by click
   and I add some fields to the form
   and I save the form as "${formid}"


I can add contents to "${formid}"
  I open the form "${formid}"
  and I add contents "John Doe" , "1234567890" and "123 Main St"
  and I save the form contents
  and I open the form "${formid}"
  and I add contents "Mary Light" , "0987654321" and "123 Chicago St"
  and I save the form contents
  and I open the form "${formid}"
  and I add contents "John Snow" , "12389098543" and "123 GOT Avenue"
  and I save the form contents
 
I add contents "${empname}" , "${empcontact}" and "${empaddr}"
  I enter "${empname}" on "name" field
  I enter "${empaddr}" on "address" field
  I enter "${empcontact}" on "contactno" field

I open the form "${formid}"
  Go To     ${PLONE_URL}/mydb/${formid}/OpenForm
  Wait Until Page Contains Element   jquery=article:contains('${formid}')    60s

I enter "${input_value}" on "${fieldid}" field
  Input Text    jquery=form div div .plominoGroupClass .plominoFieldGroup p span input[id='${fieldid}']    ${input_value} 

I save the form contents
  Click Element   jquery=form div .actionButtons input[name='plomino_save']
  Wait Until Element Is Visible   jquery=form div[id='renderedForm']
  Click Element   jquery=.formControls .actionButtons input[name='plomino_close']

I add some fields to the form
#Add text fields: Name, Address, Contact No
  I add a "Text" field
  and I edit the field "text" to "name"
  and I edit the title to "Name"
  and I save the current field settings
  and I click on Add tab
  Sleep   5s
  and I add a "Text" field
  and I edit the field "text" to "address"
  and I edit the title to "Address"
  and I save the current field settings
  and I click on Add tab
  Sleep   5s
  and I add a "Text" field
  and I edit the field "text" to "contactno"
  and I edit the title to "Contact No"
  and I save the current field settings
  Sleep   5s

I click on Add tab
  Click Link  Add
  Wait Until Element Is Visible     jquery=plomino-palette-add .add-wrapper

I edit the field "${fieldid}" to "${newid}"
  sleep  0.5s
  select frame  jquery=.mce-edit-area iframe:visible
  wait until page contains element  css=.plominoFieldClass[data-plominoid="${fieldid}"]     60s
  Wait Until Element Is Visible     css=.plominoFieldClass[data-plominoid="${fieldid}"]     60s
  Wait Until Keyword Succeeds   3 min   10 sec    Click Element   css=.plominoFieldClass[data-plominoid="${fieldid}"]
  Unselect Frame
  Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id    60s
  Input Text    jquery=#form-widgets-IShortName-id      ${newid}

I edit the title to "${newtitle}"
  Input Text    jquery=#form-widgets-IBasic-title     ${newtitle}

I save the current field settings
  Click Element     jquery=.fieldsettings--control-buttons a[id='ide-fieldsettings__save-button']
  Wait Until Element Is Visible     jquery=.fieldsettings--control-buttons    60s
  Sleep   5s


# --- Given ------------------------------------------------------------------
I have "$formid" open
  Given a logged-in test user
  and I open the ide for "mydb"
  Click Element   jquery=.treeview-wrapper .tree-node .tree-node--collapsible ul li span:contains('$formid')

I added some contents to the form "${formid}"
  I can add contents to "${formid}"

I have a form and some fields saved
    Given a logged-in test user
    and I open the ide for "mydb"
    and I open the first form
    sleep  1s
    and I add a "Text" field
    and I edit the label "text" to "First name"
    Click Link  Add
    and I add a "Text" field
    and I edit the label "text_1" to "Last name"
    Click Link  Add
    and I add a "Date" field
    and description_views.I save the form as "form-is-saved"

I save the form as "${form_name}"
  Click Element       jquery=.mdl-tabs .mdl-tabs__tab-bar a:contains('Form Settings')
  Wait Until Element Is Visible       jquery=.mdl-tabs__panel plomino-palette-formsettings .form-settings-wrapper .formsettings--control-buttons
  Input Text     jquery=form .mdl-tabs__panel fieldset .field input[id='form-widgets-IShortName-id']:last     ${form_name}
  Sleep   3s
  Click Element   jquery=form .mdl-tabs__panel fieldset .field input[id='form-widgets-IBasic-title']:last
  Input Text     jquery=form .mdl-tabs__panel fieldset .field input[id='form-widgets-IBasic-title']:last     ${form_name}
  Click Element       jquery=.mdl-tabs__panel plomino-palette-formsettings .formsettings--control-buttons .mdl-button[id='ide-formsettings__save-button']
  Wait Until Element Is Visible       jquery=.mdl-tabs__panel plomino-palette-formsettings .formsettings--control-buttons .mdl-button[id='ide-formsettings__save-button']     100s
  Sleep   3s
  wait until form is loaded

I select "${formid}" from form tree
  Click Element   jquery=plomino-tree .treeview-wrapper .tree-node .tree-node--collapsible ul li span:contains('${formid}')
  wait until form is loaded

I add a datagrid to the form
  Click Element   jquery=.templates button[data-template-id='template_datagrid']
  Wait Until Page Contains Element    css=div.mce-tinymce     100s
  Wait Until Element Is Visible     css=div.mce-tinymce     100s
  I edit the field "datagrid" to "datagrid1"
  I edit the title to "datagrid1"
  I save the current field settings

I create an unsaved datagrid form
  I add a form by click
  Click Element   jquery=.templates button[data-template-id='template_datagrid']
  Wait Until Page Contains Element    css=div.mce-tinymce     100s
  Wait Until Element Is Visible     css=div.mce-tinymce     100s

I create main form with some fields
  I add a form by click
  I click on Add tab
  Sleep   5s
  I add some fields to the form

I associate the datagrid to main form
  I select "new-form" from form tree
  select frame  jquery=.mce-edit-area iframe:visible
  wait until page contains element  css=.plominoFieldClass[data-plominoid="datagrid"]
  click element  css=.plominoFieldClass[data-plominoid="datagrid"]
  Unselect Frame
  Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id
  Click Element     jquery=select[id='form-widgets-IDatagridField-associated_form']
  Wait Until Element Is Visible     jquery=select option[value='new-form-1']      60s
  Click Element   jquery=select option[value='new-form-1']
  Sleep   3s
  Capture Page Screenshot
  I save the current field settings

# --- WHEN -------------------------------------------------------------------
I preview the layout in a new tab
  # Click Element     jquery=.mdl-tabs a[href='#palette-tab-2-panel']
  # Wait Until Element Is Visible     jquery=.formsettings--control-buttons a[id='ide-formsettings__preview-button']
  # Click Element     jquery=.formsettings--control-buttons a[id='ide-formsettings__preview-button']
  # Sleep  5s
  # #Select Window  url=${PLONE_URL}/mydb/new-form/view
  # Go To      ${PLONE_URL}/mydb/new-form/view
  # #Wait Until Element Is Visible     jquery=.actions a[data-formid='new-form-1']   60s
  Go To      ${PLONE_URL}/mydb/new-form/view
  Sleep   10s
  # Run Keyword And Ignore Error     Wait Until Page Contains    Changes saved     60s
  # Wait Until Element Is Visible           jquery=a.add-row      60s

I add a row to the datagrid form to display the main form "${mainform}"
  Press Key   jquery=.actions .add-row    \\9
  Execute Javascript  $(".actions .add-row").click()
  Sleep   5s
  Capture Page Screenshot

I click on add row in "${formid}"
  #Wait Until Keyword Succeeds   5 min   5 sec   Click Element   jquery=.actions a[data-formid='${formid}']
  Run Keyword And Ignore Error    Focus     jquery=a.add-row
  Run Keyword And Ignore Error    Click Element   jquery=a.add-row
  Run Keyword And Ignore Error    Wait Until Element Is Visible     jquery=div[id=content-core] form[name='${mainform}']    60s

I fill in the fields and save the form "${mainform}"
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element     jquery=.plominoFieldGroup p span input[id='name']
  Wait Until Keyword Succeeds   2 min   5 sec   Input Text    jquery=.plominoFieldGroup p span input[id='name']      Ann
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element     jquery=.plominoFieldGroup p span input[id='address']
  Wait Until Keyword Succeeds   2 min   5 sec   Input Text    jquery=.plominoFieldGroup p span input[id='address']      123 Main St
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element     jquery=.plominoFieldGroup p span input[id='contactno']
  Wait Until Keyword Succeeds   2 min   5 sec   Input Text    jquery=.plominoFieldGroup p span input[id='contactno']      1234567890
  
  Click Element     jquery=form[name='${mainform}'] .formControls .actionButtons input[name='plomino_save']

I update the contents of "${mainform}" and save the form
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element     jquery=.plominoFieldGroup p span input[id='name']
  Wait Until Keyword Succeeds   2 min   5 sec   Input Text    jquery=.plominoFieldGroup p span input[id='name']      Nanie
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element     jquery=.plominoFieldGroup p span input[id='address']
  Wait Until Keyword Succeeds   2 min   5 sec   Input Text    jquery=.plominoFieldGroup p span input[id='address']      123 Atlanta, GA
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element     jquery=.plominoFieldGroup p span input[id='contactno']
  Wait Until Keyword Succeeds   2 min   5 sec   Input Text    jquery=.plominoFieldGroup p span input[id='contactno']      987-098-987

  Click Element     jquery=form[name='${mainform}'] .formControls .actionButtons input[name='plomino_save']

I can see that the "${datagridform}" is updated
  Wait Until Element Is Visible     jquery=div[id='content-core'] form[name='${datagridform}']      60s
  Wait Until Keyword Succeeds   2 min   5 sec   Page Should Contain Element     jquery=.plomino-datagrid table tbody tr td:contains("123 Atlanta, GA")
  Wait Until Keyword Succeeds   2 min   5 sec   Page Should Contain Element     jquery=.plomino-datagrid table tbody tr td:contains("987-098-987")
  Wait Until Keyword Succeeds   2 min   5 sec   Page Should Contain Element     jquery=.plomino-datagrid table tbody tr td:contains("Nanie")

I edit the row in the datagrid
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element   jquery=.edit-row

the "${mainform}" is rendered
  Wait Until Element Is Visible     jquery=form[name='${mainform}']   60s



I add a field to the newly created form
  I click on Add tab
  Sleep   5s
  I add a "Text" field
  I edit the field "text" to "contactno"
  I edit the title to "Contact No"
  I save the current field settings
  Sleep   5s

I add a page break to the form
  I click on Add tab
  Sleep   5s
  I add a page break

I add a page break
  Click Element     jquery=.mdl-button[id='PlominoPagebreak']
  Wait Until Element Is Visible     jquery=.mce-tinymce     60s

I add a datagrid after the page break
  Wait Until Keyword Succeeds   2 min   5 sec   Click Element At Coordinates      css=.plominoFieldClass[data-plominoid="contactno"]     0   120
  Click Element   jquery=.templates button[data-template-id='template_datagrid']
  Wait Until Page Contains Element    css=div.mce-tinymce     100s
  Wait Until Element Is Visible     css=div.mce-tinymce     100s
  I edit the field "datagrid" to "datagrid2"
  I edit the title to "datagrid2"  

I add a new empty view from '+' button
  Wait Until Element Is Visible     jquery=.mce-edit-area iframe:visible    60s
  Wait Until Element Is Visible     jquery=#add-new-form-tab    60s
  I click on the '+' button
  I select 'Add New Empty View'

I select 'Add New Empty View'
  Click Element     jquery=.mdl-button[data-create='view']

I add a new view with form from '+' button
  I click on the '+' button
  I select 'Add new view with form' option

I add a new view with form
  Click Element     jquery=.mdl-button[id='PlominoView/custom']

I fill in the fields with id="${viewid}", title="${title}", form="${form}"
  Click Element     jquery=.mdl-dialog__content-form-group input[id='new-view-dialog__id']
  Input Text    jquery=.mdl-dialog__content-form-group input[id='new-view-dialog__id']      ${viewid}
  Click Element     jquery=.mdl-dialog__content-form-group input[id='new-view-dialog__title']
  Input Text    jquery=.mdl-dialog__content-form-group input[id='new-view-dialog__title']     ${title}

  Click Element   jquery=.mdl-dialog__content-form-group select[id='new-view-dialog__form']
  Wait Until Element Is Visible     jquery=.mdl-dialog__content-form-group select option[value='${form}']   100s
  Click Element   jquery=.mdl-dialog__content-form-group select option[value='${form}']

  Sleep   3s
  # Click Element     jquery=.mdl-dialog__content-form-group select option[value='name']
  # Sleep   3s

I can successfully view all fields in the form with title="${title}"
  Click Element   jquery=.mdl-dialog__actions .new-view-dialog__create-btn
  Wait Until Page Contains Element    jquery=.plominoviewform
  Wait Until Element Is Visible     jquery=.plominoviewform h3:contains('${title}')
  I check all fields in the form
  I check all contents in the form


I check all fields in the form
  Wait Until Element Is Visible     jquery=.view-editor__column-header[data-column='address']
  Wait Until Element Is Visible     jquery=.view-editor__column-header[data-column='contactno']
  Wait Until Element Is Visible     jquery=.view-editor__column-header[data-column='name']

I check all contents in the form
  Element Should Be Visible     jquery=tr td:contains('123 Main St')
  Element Should Be Visible     jquery=tr td:contains('1234567890')
  Element Should Be Visible     jquery=tr td:contains('John Doe')

  Element Should Be Visible     jquery=tr td:contains('123 Chicago St')
  Element Should Be Visible     jquery=tr td:contains('0987654321')
  Element Should Be Visible     jquery=tr td:contains('Mary Light')

  Element Should Be Visible     jquery=tr td:contains('123 GOT Avenue')
  Element Should Be Visible     jquery=tr td:contains('12389098543')
  Element Should Be Visible     jquery=tr td:contains('John Snow')  


I click on the '+' button
  # wait until page contains element  jquery=.plomino-block-preloader:visible
  # wait until page does not contain element  jquery=.plomino-block-preloader:visible     60s
  Wait Until Page Contains Element    jquery=#add-new-form-tab    60s
  Wait Until Element Is Visible     jquery=#add-new-form-tab    60s
  Click Element   jquery=#add-new-form-tab
  Wait Until Page Contains Element    jquery=.mdl-dialog__actions--full-width   60s
  Wait Until Element Is Visible     jquery=.mdl-dialog__actions--full-width   60s

I select 'Add new view with form' option
  Wait Until Element Is Visible     jquery=.mdl-dialog__actions--full-width .mdl-button[data-create='view/custom']    100s
  Click Element     jquery=.mdl-dialog__actions--full-width .mdl-button[data-create='view/custom']


I create a view
  Click Link  Add
  wait until page contains element  jquery=#PlominoView
  wait until page contains element  jquery=div.main-app.panel
  Click Element   jquery=.mdl-button[id='PlominoView']

I create view
  Wait Until Element Is Visible   jquery=#PlominoView
  Click Element   jquery=.mdl-button[id='PlominoView']

I add an action "${actionid}"
  Click Link  Add
  Wait Until Element Is Visible   jquery=#action
  Wait Until Element Is Visible   jquery=div.main-app.panel
  Click Element   jquery=#action
  wait until page contains element  jquery=.plomino-block-preloader:visible
  wait until page does not contain element  jquery=.plomino-block-preloader:visible
  Click Element  jquery=.actionButtons input[type="button"]:last
  wait until page contains element  jquery=.actionButtons input[type="button"].view-editor__action--selected
  wait until page does not contain element  jquery=.plomino-block-preloader:visible
  Input Text  jquery=#form-widgets-IShortName-id  ${actionid}
  Input Text  jquery=#form-widgets-IBasic-title  ${actionid}
  Click Element     jquery=.fieldsettings--control-buttons a[id='ide-fieldsettings__save-button']     #this saves #{myfield column}
  Wait Until Element Is Visible     jquery=.mdl-tabs .mdl-tabs__panel plomino-palette-fieldsettings div .fieldsettings--control-buttons
  Wait Until Element Is Visible     jquery=plomino-tab .mdl-tabs__panel plomino-view-editor .view-editor .view-editor__inner form[id='plomino-view']

I add a column "${col}"
  #Click Link  Add
  Set Selenium Timeout      60s
  Wait Until Element Is Visible     jquery=.mdl-button[id='column']
  Focus     jquery=.mdl-button[id='column']
  Click Element     jquery=.mdl-button[id='column']
  Run Keyword And Ignore Error    I click on Column button again
  Capture Page Screenshot     check.jpg
  Wait Until Page Contains Element   jquery=table thead .header-row th:contains('${col}')   100s
  Wait Until Element Is Visible     jquery=table thead .header-row th:contains('${col}')    100s
  Wait Until Element Is Visible     jquery=.default form:first      100s
  Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id    100s
  Click Element   jquery=#form-widgets-IShortName-id
  Input Text  jquery=#form-widgets-IShortName-id  ${col}
  Click Element   jquery=#form-widgets-IBasic-title
  Input Text  jquery=#form-widgets-IBasic-title  ${col}
  Click Element     jquery=.fieldsettings--control-buttons a[id='ide-fieldsettings__save-button']     #this saves #{myfield column}
  Wait Until Element Is Visible     jquery=.mdl-tabs .mdl-tabs__panel plomino-palette-fieldsettings div .fieldsettings--control-buttons
  Wait Until Element Is Visible     jquery=plomino-tab .mdl-tabs__panel plomino-view-editor .view-editor .view-editor__inner form[id='plomino-view']

I check the fields after adding a column
  Wait Until Page Contains Element   jquery=table thead .header-row th:contains('${column}')
  Wait Until Element Is Visible     jquery=table thead .header-row th:contains('${column}')
  Wait Until Element Is Visible     jquery=.default form:first      60s
  Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id

I add a column "${col}" with retries
  Wait Until Element Is Visible     jquery=.mdl-button--colored[id='column']     60s
  Wait Until Element Is Enabled     jquery=.mdl-button--colored[id='column']     60s
  Focus     jquery=.mdl-button[id='column']
  Wait Until Keyword Succeeds   30 min   10 sec    I add a column "${col}" only
  #I add column "${col}" using for-loop
  I input column name and title "${col}"
  Set Selenium Timeout    60s

I add column "${col}" using for-loop
  : FOR   ${i}  IN RANGE  0  99999999
  \   Execute Javascript    $(".mdl-button--colored[id='column']").click()
  \   ${is_visible}=  Run Keyword And Return Status   Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id
  \   Exit For Loop If  ${is_visible}

I input column name and title "${col}"
  Wait Until Keyword Succeeds    3 min    5 sec    Click Element   jquery=#form-widgets-IShortName-id
  Input Text  jquery=#form-widgets-IShortName-id  ${col}
  Click Element   jquery=#form-widgets-IBasic-title
  Input Text  jquery=#form-widgets-IBasic-title  ${col}
  Click Element     jquery=.fieldsettings--control-buttons a[id='ide-fieldsettings__save-button']     #this saves #{myfield column}
  Wait Until Element Is Visible     jquery=.mdl-tabs .mdl-tabs__panel plomino-palette-fieldsettings div .fieldsettings--control-buttons   60s
  Wait Until Element Is Visible     jquery=plomino-tab .mdl-tabs__panel plomino-view-editor .view-editor .view-editor__inner form[id='plomino-view']    60s
  I can see a view editor listing my data
  # wait until form is loaded
  

I add a column "${col}" only
  Run Keyword and Ignore Error    Execute Javascript    $(".mdl-button--colored[id='column']").click()
  Run Keyword and Ignore Error    Wait Until Page Contains Element   jquery=table thead .header-row th:contains('${col}')
  Run Keyword and Ignore Error    Wait Until Element Is Visible     jquery=table thead .header-row th:contains('${col}')
  Run Keyword and Ignore Error    Wait Until Element Is Visible     jquery=.default form:first      60s
  Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id



I click on Column button again
  Wait Until Page Contains Element    jquery=.mdl-button[id='column']
  Wait Until Element Is Visible     jquery=.mdl-button[id='column']
  Focus     jquery=.mdl-button[id='column']
  Click Element     jquery=.mdl-button[id='column']

I add a column "${colid}" with title "${title}" and field value "${fieldvalue}"
  Wait Until Element Is Visible     jquery=#column
  Click Element  jquery=#column
  Wait Until Page Contains Element    jquery=.header-row
  # Click Element  jquery=.view-editor__column-header:last
  # wait until page contains element  jquery=.view-editor__column-header.view-editor__column-header--selected
  # wait until page does not contain element  jquery=.plomino-block-preloader:visible
  Wait Until Element Is Visible     jquery=#form-widgets-IShortName-id
  Click Element   jquery=#form-widgets-IShortName-id
  Input Text  jquery=#form-widgets-IShortName-id  ${colid}
  Click Element   jquery=#form-widgets-IBasic-title
  Input Text  jquery=#form-widgets-IBasic-title  ${title}
  Click Element   jquery=#form-widgets-displayed_field
  Select From List by Value     ${fieldvalue}
  Click Element     jquery=.fieldsettings--control-buttons a[id='ide-fieldsettings__save-button']     #this saves #{myfield column}
  Wait Until Element Is Visible     jquery=.mdl-tabs .mdl-tabs__panel plomino-palette-fieldsettings div .fieldsettings--control-buttons
  Wait Until Element Is Visible     jquery=plomino-tab .mdl-tabs__panel plomino-view-editor .view-editor .view-editor__inner form[id='plomino-view']



# --- THEN -------------------------------------------------------------------
I can see a view editor listing my data
  Wait until page contains element  jquery=.view-editor:contains("New View")    60s
  Page should contain element  jquery=.view-editor:contains("New View")
  Wait Until Element Is Visible     jquery=.view-editor:contains("New View")    60s
  Wait Until Element Is Visible     jquery=div[id='content-core'] table         60s
  Set Selenium Timeout      10s

I will see action "${actionid}" in the view
  Wait until page contains element  jquery=.view-editor .actionButtons input[id="${actionid}"]
  Page should contain element  jquery=.view-editor .actionButtons input[id="${actionid}"]

I can see columns "${col1}", "${col2}", and "${col3}" in the view
  I will see column "${col1}" in the view
  I will see column "${col2}" in the view
  I will see column "${col3}" in the view


I will see column "${columnid}" in the view
  Wait until page contains element  jquery=.view-editor .view-editor__column-header[data-column='${columnid}']    60s
  Wait Until Element Is Visible     jquery=.view-editor .view-editor__column-header[data-column='${columnid}']    60s
  Page should contain element  jquery=.view-editor .view-editor__column-header[data-column='${columnid}']

I can rename the form to "${formId}"
    Click Element   jquery=.mdl-tabs .mdl-tabs__tab-bar a:contains('Form Settings')
    Wait Until Element Is Visible       jquery=.mdl-tabs__panel plomino-palette-formsettings .form-settings-wrapper .formsettings--control-buttons
    Input Text      jquery=#form-widgets-IShortName-id          ${formId}
    Input Text      jquery=#form-widgets-IBasic-title           ${formId}
    Click Element       jquery=.mdl-tabs__panel plomino-palette-formsettings .formsettings--control-buttons .mdl-button[id='ide-formsettings__save-button']
    Wait Until Element Is Visible       jquery=.mdl-tabs__panel plomino-palette-formsettings .formsettings--control-buttons .mdl-button[id='ide-formsettings__save-button']

I will see column header "${header}" and data "${rowdata1}", "${rowdata2}", "${rowdata3}"
  Wait until page contains element  jquery=table thead .header-row th:contains('${header}')
  Page Should Contain Element  jquery=table thead .header-row th:contains('${header}')
  Page Should Contain Element   jquery=tbody tr td a span span:contains('${rowdata1}')
  Page Should Contain Element   jquery=tbody tr td a span span:contains('${rowdata2}')  
  Page Should Contain Element   jquery=tbody tr td a span span:contains('${rowdata3}')

I can move the column "${col_1}" to column "${col_2}" by offset "${x}" "${y}"
  Chain Click And Hold    jquery=.view-editor__column-header[data-column='${col_1}']
  Chain Move To Element With Offset  jquery=.view-editor__column-header[data-column='${col_2}']  ${x}  ${y}
  Chain Release     jquery=.view-editor__column-header[data-column='${col_2}']
  Chains Perform Now
  Sleep     10s

I can move column "${src}" to column "${target}"
  Drag Drop    jquery=.view-editor__column-header[data-column='${src}']    jquery=.view-editor__column-header[data-column='${target}']

I can see that the 'Create view of form' dialog is displayed
  Wait Until Element Is Visible     jquery=.modal-content .modal-header h4:contains('Create view of form')    60s
  Wait Until Element Is Visible     jquery=.mdl-dialog__content-form-group label[for='new-view-dialog__id']   60s
  Wait Until Element Is Visible     jquery=.mdl-dialog__content-form-group label[for='new-view-dialog__title']    60s
  Wait Until Element Is Visible     jquery=.mdl-dialog__content-form-group label[for='new-view-dialog__field']    60s
  Wait Until Element Is Visible     jquery=.mdl-dialog__content-form-group label[for='new-view-dialog__form']   60s

I can see that the 'New View' screen is displayed
  Wait Until Element Is Visible     jquery=.view-editor:contains("New View")    60s
  Wait Until Element Is Visible     jquery=div[id='content-core'] table         60s
