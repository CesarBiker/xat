var d = new Date();

var servidor = iniciarServidor(3000);

var salaPrincipal = new SalaXat("Principal");

function SalaXat(nom) {
	this.nom = nom;
	this.persones = [];
	this.afegirPersona = function(nom) {
		if(this.persones.indexOf(nom) == -1) {
			this.persones.push(nom);
			this.persones.sort();
			return true;
		}
		return false;
	};

	this.borrarPersona = function(nom) {
		var i = this.persones.indexOf(nom);
		if(i != -1) {
			this.persones.splice(i,1);//Borrar 1 element des de l'index trobat
			return true;
		}
		return false;
	};
}

function onConnection(socket) {
	console.log('Nova conexió');

	socket.on('nou usuari', function(data) {
		console.log("Nou usuari :" + data.nomUsuari);
		salaPrincipal.afegirPersona(data.nomUsuari);
		servidor.emit('nou usuari', { persones : salaPrincipal.persones });
		console.log(salaPrincipal.persones);
	});

	socket.on('desconectar', function(data) {
		console.log(data.nomUsuari + " s'ha anat");
		salaPrincipal.borrarPersona(data.nomUsuari);
		console.log(salaPrincipal.persones);
		servidor.emit('nou usuari', { persones : salaPrincipal.persones });
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
		enviarMissatgeXatTots(escaped, data.nom, data.tipus);
		
		console.log(data);	
	});

	/*socket.on('disconnect', function(){
		console.log("Tal s'ha desconectat");
	});*/
}

function enviarMissatgeXatTots(msg, nom, tipus) {
	var hora=afegirZero(d.getHours())+":"+afegirZero(d.getMinutes());

	if(typeof servidor !== 'undefined') {
		servidor.emit('msg', {
				data : msg,
				nom : nom,
				tipus : tipus,
				hora : hora
			});
	} else {
		console.log("Error al enviar missatge: servidor no definit.");
	}
}

function iniciarServidor(port) {
	var _srv = require('socket.io')();
	console.log("Iniciant servidor...");
	_srv.on('connection', onConnection);
	_srv.listen(port);
	console.log("Servidor iniciat al port " + port);
	return _srv;
}

function safe_tags(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}

function afegirZero(i) {
	return i < 10 ? "0" + i : i;
}
