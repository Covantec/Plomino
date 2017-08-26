


# ============================================================================
# DEXTERITY ROBOT TESTS
# ============================================================================
#
# Run this robot test stand-alone:
#
#  $ bin/test -s Products.CMFPlomino -t test_plominodatabase.robot --all
#
# Run this robot test with robot server (which is faster):
#
# 1) Start robot server:
#
# $ bin/robot-server --reload-path src Products.CMFPlomino.testing.PRODUCTS_CMFPLOMINO_ACCEPTANCE_TESTING
#
# 2) Run robot tests:
#
# $ bin/robot src/Products/CMFPlomino/tests/robot/test_plominodatabase.robot
#
# See the http://docs.plone.org for further details (search for robot
# framework).
#
# ============================================================================



*** Settings *****************************************************************

Resource  description_plominodatabase.robot

Test Setup   Test Setup
Test Teardown  Test Tear Down

*** Test Cases ***************************************************************

Scenario: As a site administrator I can add a PlominoDatabase
  Given a logged-in site administrator
    and an add plominodatabase form
   When I type 'My PlominoDatabase' into the title field
    and I submit the form
   Then a plominodatabase with the title 'My PlominoDatabase' has been created

Scenario: As a site administrator I can view a PlominoDatabase
  Given a logged-in site administrator
    and a plominodatabase 'My PlominoDatabase'
   When I go to the plominodatabase view
   Then I can see the plominodatabase title 'My PlominoDatabase'

Scenario: As a site administrator I can open a form
  Given a logged-in test user
    and I open the ide for "mydb"
   When I open a form "frm_test"
   Then I can see field "field_1" in the editor

Scenario: As a site administrator I can open a form (2 tabs)
  Given I have an empty form open
   When I open a form "frm_test"
   Then I can see field "field_1" in the editor

Scenario: As a site administrator I can add a form by click
  Given a logged-in test user
    and I open the ide for "mydb"
   When I add a form by click
   Then I can see "new-form" is open

Scenario: As a site administrator I can add a form by click (2 tabs)
  Given I have an empty form open
   When I add a form by click
   Then I can see "new-form" is open

# html5 dnd not currently supported by selenium - https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/3604
#Scenario: As a site administrator I can add a form by dnd
#  Given a logged-in test user
#    and I open the ide for "mydb"
#   When I add a form by dnd
#   Then I can see "new-form" is open

Scenario: I can rename a form
  Given I have a form open
   When I enter "mynewid" in "Id" in "Form Settings"
   Then I can see "mynewid" is open

Scenario: I can add a field to a form
  Given a logged-in test user
    and I open the ide for "mydb"
    and I open a form "frm_test"
   When I add a "Text" field
   Then I can see field "text" in the editor
    and I select the field "text"  # probably should be selected automatically? or group should?
    and I see "text" in "Id" in "Field Settings"

Scenario: I can add a field to a form by dnd
  Given a logged-in test user
    and I open the ide for "mydb"
    and I open the first form   #TODO   When I open a form "frm_test"
   When I add a "Text" field by dnd
   Then I can see field "text" in the editor
    and I select the field "text"
    and I see "text" in "Id" in "Field Settings"

Scenario: I can change the label and title at the same time
  # Set Selenium Speed  1 seconds
  Given I have a form open
   When I add a "Text" field
    and I edit the label "text" to "My text question"
   Then I see "My text question" in "Field title" in "Label Settings"
    and I select the field "text"
    and I see "My text question" in "Title" in "Field Settings"

Scenario: I can add the colon to the label
  # Set Selenium Speed  1 seconds
  Given I have a form open
   When I add a "Text" field
    and I edit the label "text" to "My text question:"
   Then I see "My text question:" in "Field title" in "Label Settings"
    and I select the field "text"
    and I see "My text question:" in "Title" in "Field Settings"

Scenario: I can preview
  Given I have a form open
   When I preview "frm_test"
    and I submit the form
   Then I will see the preview form saved

Scenario: I can preview (2 tabs)
  Given I have an empty form open
    and I have an additional form open
   When I preview "frm_test"
    and I submit the form
   Then I will see the preview form saved

Scenario: I can add a validation rule to a field
  Given I have a form open
   When I add a "Text" field
    and I select the field "text"
    and I add a macro "Field contains text" to "Field Settings"
    and I enter "blah" in "Field value" in the form
    and I save the macro
    and I add a macro "Invalid" to "Field Settings"
    and I enter "You can't say blah" in "Invalid message" in the form
    and I save the macro
    and I save the fieldsettings
    and I preview "frm_test"
    # if you want to enter blah in the Untitled - select field Untitled in the macro modal
    and I input the text "blah" inside the field with id "field_1"
    and I submit the form
   Then I will see the validation error "You can't say blah" for field "field_1"

Scenario: I can change to computed and select the date
  Given I have a form open
   When I add a "Date" field
    and I select the field "date"
    and I change the fieldsettings tab to "Advanced"
    and I change the fieldmode to "COMPUTED"
    and I save the fieldsettings
   Then I select the field "date"
    and I see "date" in "Id" in "Field Settings"

Scenario: I can change to computed and select the date (2 tabs)
  Given I have an empty form open
    and I have an additional form open
   When I add a "Date" field
    and I select the field "date"
    and I change the fieldsettings tab to "Advanced"
    and I change the fieldmode to "COMPUTED"
    and I save the fieldsettings
   Then I select the field "date"
    and I see "date" in "Id" in "Field Settings"

Scenario: I can change to computed and back and select the date
  Given I have a form open
   When I add a "Date" field
    and I select the field "date"
    and I change the fieldsettings tab to "Advanced"
    and I change the fieldmode to "COMPUTED"
    and I save the fieldsettings
    and I select the field "date"
    and I change the fieldsettings tab to "Advanced"
    and I change the fieldmode to "EDITABLE"
    and I save the fieldsettings
   Then I select the field "date"
    and I see "date" in "Id" in "Field Settings"

Scenario: I can change to computed and back and select the date (2 tabs)
  Given I have an empty form open
    and I have an additional form open
   When I add a "Date" field
    and I select the field "date"
    and I change the fieldsettings tab to "Advanced"
    and I change the fieldmode to "COMPUTED"
    and I save the fieldsettings
    and I select the field "date"
    and I change the fieldsettings tab to "Advanced"
    and I change the fieldmode to "EDITABLE"
    and I save the fieldsettings
   Then I select the field "date"
    and I see "date" in "Id" in "Field Settings"

Scenario: I can add hidewhen on empty form by click
  Given I have an empty form open
   When I add a hidewhen by click
   Then I will see that hidewhen is present

Scenario: I can add hidewhen on email form by click
  Given I have an empty form open
   When I add a "Email" field
    and I add a hidewhen by click
   Then I will see that hidewhen is present


Scenario: I can export design from a database
  Given a logged-in test user
    and I open the ide for "mydb"
   and I open service tab "Import/export of data"
   Then I can see Import/Export dialog open
    and I click the tab "Design import/export" in Import/Export dialog
    and click element id="targettype-zipfile"
    and click button "Export"


# View tests

Scenario: I can add a view
  Given I have a form and some data saved
   When I create a view
   # Then I can see "new-view" is open
   Then I can see a view editor listing my data

Scenario: I can add a column to a view
  Given I have a form and some data saved
   When I create a view
    # and I can see "new-view" is open
    and I can see a view editor listing my data
    and I add a column "text"
    and I add a column "text_1"
  Then I will see column "text" in the view
    and I will see column "text_1" in the view

Scenario: I can add an action to a view
  Given I have a form and some data saved
   When I create a view
    # and I can see "new-view" is open
    and sleep  1s
    and I can see a view editor listing my data
    and I add an action "my action"
   Then I will see action "my-action" in the view

Scenario: I can rename a form and then create new form
  Given I have a form open
   When I enter "new-form" in "Id" in "Form Settings"
    and I can see "new-form" is open
    and I enter "new-form-1" in "Id" in "Form Settings"
    and I can see "new-form-1" is open
    and I add a form by click
   Then I can see "new-form" is open

Scenario: I can rename a form and then create new form and then go back and repeat
  Given I have a form open
   When I enter "new-form" in "Id" in "Form Settings"
    and I can see "new-form" is open
    and I enter "new-form-1" in "Id" in "Form Settings"
    and I can see "new-form-1" is open
    and I add a form by click
    and I can see "new-form" is open
    and sleep  1s
    and I open a form "new-form-1"
    and I enter "new-form" in "Id" in "Form Settings"
    and I add a form by click
   Then I can see "new-form-1" is open

#Scenario: I can add filter a view
#  Given I have a form and some data saved
#   When I create a view
#    and I see > 2 documents in the view
#    and I add a macro the the "view settings" called "number range"
#    and I set the range to <5
#   Then I will see less than 2 documents in the view



