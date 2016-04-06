var servidor = iniciarServidor(3000);

var salaPrincipal;

function onConnection(socket) {
	console.log('Nova conexió: ' + socket.id);
	console.log(socket.request.connection.remoteAddress);

	socket.on('nou usuari', function(data) {
		salaPrincipal.llegirHistorial();
		console.log("Nou usuari :" + data.nomUsuari);
		//console.log(data);
		salaPrincipal.afegirPersona(data.nomUsuari, data.cookieU, socket.id);
		var perEnv = salaPrincipal.persones.map(function(obj) {
			return obj.nom;
		});
		servidor.emit('nou usuari', { persones : perEnv });
		console.log("Enviant missatge a " + socket.id);
		salaPrincipal.enviarMissatgeA("Benvingut/da :D", "Servidor", "text", "#198A5A", socket.id);
		if(salaPrincipal.calNouHistorial) {
			var inter = setInterval(function() {
				if(!salaPrincipal.calNouHistorial) {
					servidor.to(socket.id).emit('histo', {
						historial : salaPrincipal.logHistorial
					});
					clearInterval(inter);
				} 
			},10);
		} else {
			servidor.to(socket.id).emit('histo', {
				historial : salaPrincipal.logHistorial
			});
		}
		console.log(salaPrincipal.persones);
	});

	socket.on('desconectar', function(data) {
		console.log(data.nomUsuari + " s'ha anat");
		salaPrincipal.borrarPersona(data.nomUsuari);
		console.log(salaPrincipal.persones);
		var perEnv = salaPrincipal.persones.map(function(obj) {
			return obj.nom;
		});
		servidor.emit('nou usuari', { persones : perEnv });
	});

	socket.on('msg', function(data) {
		var escaped = safe_tags(data.msg);
		var ind;
		if(data.tipus === "text") {
			if((ind = escaped.indexOf('img:')) > -1) {
				ind = escaped.indexOf('img:');
				var link = escaped.substring(ind + 4,escaped.length);
				escaped = "<img style='max-width:calc(100vw - 250px)' src=\""+link+"\"/>";
			}			
		}
		salaPrincipal.enviarMissatgeTots(escaped, data.nom, data.tipus, data.color);
	});

	socket.on('msgPriv', function(data) {
		var escaped = safe_tags(data.msg);
		//TODO: comprovar que els usuaris es 'vegin'
		//TODO: enviar la sala de xat
		var idDesti = salaPrincipal.obtenirIdUsuari(data.desti);
		var idOrigen = salaPrincipal.obtenirIdUsuari(data.nom);
		if(idDesti != null) {
			salaPrincipal.enviarMissatgeA(data.msg, "Missatge privat de: " + data.nom, data.tipus, data.color, idDesti);
			salaPrincipal.enviarMissatgeA(data.msg, "Missatge enviat a: " + data.desti, data.tipus, data.color, idOrigen);
			console.log("Enviant missatge a: " + idDesti + "(" + data.desti + ")");
		} else {
			salaPrincipal.enviarMissatgeA("No s'ha pogut enviar el missatge", data.nom, data.tipus, data.color, idOrigen);
			console.log("No s'ha pogut enviar el missatge a: " + idDesti + "(" + data.desti + ")");
		}

	});

	socket.on('typing', function(data) {
		//TODO: fer a la sala
		servidor.emit('typing', data);
	});

	socket.on('reset', function(data) {
		if(socket.request.connection.remoteAddress.indexOf('192.168.3.9')) {
			servidor.emit('reset');
			console.log('Enviat reset a clients');			
		} else {
			console.log('Intent de reset de: ' + socket.request.connection.remoteAddress);
		}
	});

	/*socket.on('disconnect', function(){
		console.log("Tal s'ha desconectat");
	});*/
}

function iniciarServidor(port) {
	var _srv = require('socket.io')();
	console.log("Iniciant servidor...");
	_srv.on('connection', onConnection);
	_srv.listen(port);
	console.log("Servidor iniciat al port " + port);
	var SalaXat = require("./salaXat.js");
	salaPrincipal = new SalaXat("SalaPrincipal", _srv);
	return _srv;
}

function safe_tags(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}
