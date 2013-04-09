Cereal Killers
==============

Project Name: Guess Who
-----------------------

Members: 
Andrew Gosse - 100828142
Brandon Schurman -100857068
Kurt Engsig - 100826349

Description:
-------------

The objective is to guess which character the opponent is holding.

A player selects the theme for the game they wish to play. This theme will be a collection of characters in which the players will attempt to guess. Examples may include video game characters, celebrities, historic figures, etcetera. A game is formed via a connection over our web server between two players of the same theme. The players are given a random character from the collection, and the game begins. 

The player who is selected to guess first inputs simple yes or no questions into a text field to be passed to the opponent via the server to help reveal the identity of their opponents chosen character (ie. hair color, faical hair, etc.). When the player receives their opponents response, they are able to cross out any characters on their board which do not fit their new description of who their opponents character might be. For example, a player may ask if their opponents character has starred in an action movie. Finding out that the answer is in fact "No", the player can now cross out any characters on their board who have starred in an action move. 
The players alternate guessing and answering until one of them figures out their opponents character.

Our GUI consists of 5 main panels:
----------------------------------


1.	Game board (center panel):
        This panel is where the users see all possible characters the their opponent could have. This panel is made up of a table filled with different images of 		characters that have the ability to listen for a mouse click. Based on the information recieved from their opponent, the user may click on each image using a 	process of elimation to figure out what character the opponent has.

2.	Guessing panel (left panel):
        This panel consits of one large open box and a small text field below. This panel allows for the user to make their own guess/question about their opponent's           character and recieve your opponent's responses as well. Using our server that both clients are connected to,we simply pass the users question and response to         	the other client.

3.	Chat panel (right panel):
        This panel consits of one large open box and a small text field below. This panel allows for an open chat between clients. In this open chat both clients are           allowed to talk freely. This panel works in the same way as the guessing panel.

4.	Character panel (below game board):
        This panel is a small image indicating the users current character. This image is to be known only by the client well the other client has to use a series of         	guesses to figure out who the character is.

5.	Opponenets game board panel (top right corner):
        This panel shows a small representation of the opponent's game board. On this representation you can see how many characters have been crossed out by your         	opponent. However you cannot see which characters they are.

6.	Final guess panel (bottom center below game board):
	This panel is where you input your final guess when you believe you know who your opponents character is.

Dependinces:
------------
- mongodb
- node
- express
- jade