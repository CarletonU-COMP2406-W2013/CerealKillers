Files
======

Note in our repository that all files listed below are stored in our file called express-server.

express-server/...
-------------------

node_modules
------------
node_modules - all libraries used throughout the app

public
------
public - all static files containing JQuery,stylesheets,images
>public\images - all image sets and other images used in our app
>public\javascripts - Contains GuessQuery.js which is all the client side javascript to play the game and AccQuery.js which is used for selecting game type and to alert user of results of game.
>public\libs - JQuery library
>public\stlyesheets - all style sheets for each page within our app.

routes
-------
routes - all redirects for different pages within our app. Allows us to redirect to different pages and allowing us to render them.

views
-----
views - jade files - all skelton pages within or app.

app.js
-------
app.js - It runs our server on a port that allows clients to connect and play our app. It handles events asynchronously.

guess-db.js
-----------
guess-db.js - Is our database for managing all needed information such as game themes and user info.


