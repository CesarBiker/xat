var d = new Date();

var servidor = iniciarServidor(3000);

var salaPrincipal = new SalaXat("Principal");

function SalaXat(nom) {
	this.nom = nom;
	this.persones = [];
	/*
		{
			nom : '',
			cookie : ''
		}
	*/
	this.numPersones = 0;
	this.afegirPersona = function(nom) {
		var persObj = this.persones.filter(function(per) {
			return per.nom === nom;
		})[0];

		if(typeof persObj === 'undefined') {
			this.persones.push( { nom : nom } );
			this.persones.sort(compare);
			this.numPersones++;
			return true;
		}
		return false;
	};

	this.borrarPersona = function(nom) {
		var indexPer = this.persones.map(function(per, index) {
			if(per.nom === nom)
				return index;
		}).filter(isFinite)[0];

		var persObj = this.persones.filter(function(per) {
			return per.nom === nom;
		})[0];

		if(typeof persObj !== 'undefined') {
			this.persones.splice(indexPer,1);//Borrar 1 element des de l'index trobat
			this.numPersones--;
			return true;
		}
		return false;
	};
}

function onConnection(socket) {
	console.log('Nova conexió: ' + socket.id);
	console.log(socket.request.connection.remoteAddress);

	socket.on('nou usuari', function(data) {
		console.log("Nou usuari :" + data.nomUsuari);
		salaPrincipal.afegirPersona(data.nomUsuari);
		var perEnv = salaPrincipal.persones.map(function(obj) {
			return obj.nom;
		});
		servidor.emit('nou usuari', { persones : perEnv });
		console.log("Enviant missatge a " + socket.id);
		enviarMissatgeXatId("Benvingut :D", "Servidor", "text", socket.id, "#00FF00");
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
		enviarMissatgeXatTots(escaped, data.nom, data.tipus, data.color);
		
		console.log(data);	
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

function enviarMissatgeXatTots(msg, nom, tipus, color) {
	var hora=afegirZero(d.getHours())+":"+afegirZero(d.getMinutes());

	if(typeof servidor !== 'undefined') {
		servidor.emit('msg', {
				data : msg,
				nom : nom,
				tipus : tipus,
				hora : hora,
				color : color
			});
	} else {
		console.log("Error al enviar missatge: servidor no definit.");
	}
}

function enviarMissatgeXatId(msg, nom, tipus, id, color) {
	var hora=afegirZero(d.getHours())+":"+afegirZero(d.getMinutes());

	if(typeof servidor !== 'undefined') {
		servidor.to(id).emit('msg', {
				data : msg,
				nom : nom,
				tipus : tipus,
				hora : hora,
				color : color
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

function compare(a,b) {
	if (a.nom < b.nom)
		return -1;
	else if (a.nom > b.nom)
		return 1;
	else 
		return 0;
}
