var fs = require("fs");

var SalaXat = function(nom, servidor) {
	if(typeof nom === 'undefined' || nom === "") {
		console.log("ERROR: No hi ha cap nom a la sala.");
		return;
	}
	this.servidor = servidor;
	this.nom = nom;
	this.persones = [];
	this.numPersones = 0;
	this.logHistorial = [];
	this.calNouHistorial = true;
	this.MOTD = "Benvingut/da :D";

	this.fitxerHistorial = iniciarHistorial(this.nom);
}

SalaXat.prototype.afegirPersona = function(nom, cookie, id) {
	var persObj = this.persones.filter(function(per) {
		return per.nom === nom;
	})[0];

	if(typeof persObj === 'undefined') {
		this.persones.push({ 
			nom : nom,
			cookie : cookie,
			id : id
		});
		this.persones.sort(compare);
		this.numPersones++;
		return true;
	}
	return false;
};

SalaXat.prototype.borrarPersona = function(nom) {
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

SalaXat.prototype.obtenirIdUsuari = function(nom) {
	for (var i = 0; i < this.persones.length; i++) {
		if(this.persones[i].nom === nom)
			return this.persones[i].id;
	};
	return null;
};

//TODO: S'hauria de posar amb JSON el missatge i els seus atributs
//TODO: Cal enviar al destinatari l'identificador de la sala
SalaXat.prototype.enviarMissatgeA = function(msg, nom, tipus, color, id) {
	var d = new Date();
	var hora = afegirZero(d.getHours()) + ":" + afegirZero(d.getMinutes());

	if(typeof this.servidor !== 'undefined') {
		this.servidor.to(id).emit('msg', {
				data : msg,
				nom : nom,
				tipus : tipus,
				hora : hora,
				color : color
			});
	} else {
		console.log("ERROR: No es pot enviar el missatge a la sala " + this.name + ", servidor no definit.");
	}
};

SalaXat.prototype.enviarMissatgeTots = function(msg, nom, tipus, color) {
	var d = new Date();
	var hora = afegirZero(d.getHours()) + ":" + afegirZero(d.getMinutes());

	if(typeof this.servidor !== 'undefined') {
		this.servidor.emit('msg', {
				data : msg,
				nom : nom,
				tipus : tipus,
				hora : hora,
				color : color
			});
		this.escriureHistorial({
				data : msg,
				nom : nom,
				tipus : tipus,
				hora : hora,
				color : color
			});
	} else {
		console.log("ERROR: No es pot enviar el missatge a la sala " + this.name + ", servidor no definit.");
	}
};

function iniciarHistorial(nomSala) {
	var t = fs.openSync(nomSala + "_historial.json", "a+");
	console.log(t);
	return t;
};

SalaXat.prototype.escriureHistorial = function(msg) {
	var buff = new Buffer(JSON.stringify(msg) + "\n");
	var sala = this;

	fs.write(this.fitxerHistorial, buff, 0, buff.length, null, function(err, written, buffer) {
		if(err) {
			console.log("ERROR: No s'ha pogut escriure a l'historial:" + err);
			return console.log(err);
		}
		console.log("Escrit a l'historial " + written + " bytes.");
		if(sala.logHistorial.length > 30)
			sala.logHistorial.shift();
		sala.logHistorial.push(msg);
	});
	this.llegirHistorial();
};

SalaXat.prototype.llegirHistorial = function() {
	var nomFitx = this.nom + "_historial.json";
	console.log("llegint de : " + nomFitx);
	var sala = this;

	if(this.calNouHistorial) {
		fs.stat(nomFitx, function(err, stats) {
			fs.createReadStream(nomFitx, {
				start: stats.size - 3500,
				end: stats.size - 1
			}).addListener("data", function(data) {
				var linia = data.toString().split('\n');
				if(sala.logHistorial.length === 0) {
					console.log("Llegint...");
					for (var i = 0; i < linia.length; i++) {
						if(linia[i].substring(0,1) === "{") {
							sala.logHistorial.push(JSON.parse(linia[i]));
						}
					};
					console.log("Llegit " + sala.logHistorial.length + " linies");
				}
				sala.calNouHistorial = false;
			})
		});
	}
};

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

module.exports = SalaXat;