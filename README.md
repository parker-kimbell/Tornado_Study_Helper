# Study Helper
An app built in the Python Tornado framework that streams through a list of notes.

## Project Setup
1) In the project directory run
 ```pip install -r /path/to/requirements.txt``` to install all project requirements. At this point it's just the Tornado

## To Run
1) Open a terminal in the project ```src``` directory. Run the ```python studyHelp.py``` command to start the server. The default port is 3000.
2) Open a web browser and navigate to ```localhost:3000 (or your alternative port)``` to load the app.

## Known Major Issues
1) Currently notes that were added before a given client creates a session will not display in that clients browser. Only notes that have been added after the session has been established will show.

## Planned Improvements
1) Store notes persistently
2) Create login system
3) Store notes by user
4) Store notes by type
5) Allow users to control speed that notes display