# MULTEOR #

![Multeor](http://multeor.com/static/images/infographic_03_licht.gif)

Multeor is a multiplayer webgame developed by [Arjen de Vries](http://www.dasblitz.nl), [Filidor Wiese](http://www.fili.nl) and [Arthur van 't Hoog](http://www.arthurvanthoog.nl) in 2013. In the game you control a meteor crashing into earth. Score points by leaving the biggest trail of destruction.

The game can be played at: http://multeor.com/


## Smartphone as the controller ##

The game is viewed on a desktop computer but controlled by using smartphones. Up to eight players can connect to a single game at the same time. Players can personalize their Multeor by first logging into Facebook on their controller. Multeor is great fun playing solo, but it works even better in a group. We recommend challenging friends and colleagues at the office or at a party. The more players, the more destruction, colors and chaos!

More information can be found at http://multeor.com/about/  
A blog article about the techniques used: http://blog.fili.nl/project-multeor/

## Getting Multeor up and running ##

### Prerequisites ###

Please make sure you have the following installed on your system:

* Node + Npm  
* Ruby  
* Compass as a ruby gem  
* Java JRE  
* Local webserver (including php support if you want to use map-editor)

### Installing and building ###

1. Clone the repository
2. Install npm dependencies with `npm install`
2. Run `./multeor.sh build` to compile the sass and javascript
3. Point a webserver to the public directory as the document root

### Running Multeor ###

You can start the server-side of Multeor using `node server.js`. Alternatively use `./multeor.sh start-forever` command to run Multeor as a headless never-ending daemon, which can be stopped with `./multeor.sh stop`.

## License ##

Multeor is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).

Meaning you are free to:

* Share — copy and redistribute the material in any medium or format
* Adapt — remix, transform, and build upon the material

Under the following terms:

* Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
* NonCommercial — You may not use the material for commercial purposes.

## Contact us ##

You can reach us on [octagon@multeor.com](octagon@multeor.com) and of course we will also consider any pull-requests :)
