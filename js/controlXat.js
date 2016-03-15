var socket;
var nom = "No conectat";
var color = "#555";
var l = "";
var focus = false;
var interval;
var missatgesPerduts = 0;
var notificationN;
var bodyLoaded = false;
var lastMessage = "";
var icones = ["1f31e","1f32c","1f385-1f3fc","1f3c3-1f3fc","1f3c5","1f3c6","1f3cb-1f3fc","1f3cd","1f3ce","1f42a","1f446-1f3fc","1f447-1f3fc","1f448-1f3fc","1f449-1f3fc","1f44a-1f3fc","1f44b-1f3fc","1f44c-1f3fc","1f44d-1f3fc","1f44e-1f3fc","1f44f-1f3fc","1f450-1f3fc","1f466-1f3fc","1f467-1f3fc","1f468-1f3fc","1f469-1f3fc","1f46e-1f3fc","1f471-1f3fc","1f47c-1f3fc","1f483-1f3fb","1f4a2","1f4a5","1f4a6","1f4a8","1f4a9","1f4aa-1f3fd","1f4b0","1f52a","1f575-1f3fc","1f590-1f3fc","1f595-1f3fc","1f596-1f3fc","1f5e1","1f600","1f601","1f602","1f603","1f604","1f605","1f606","1f607","1f608","1f609","1f60a","1f60b","1f60c","1f60d","1f60e","1f60f","1f610","1f611","1f612","1f613","1f614","1f615","1f616","1f617","1f618","1f619","1f61a","1f61b","1f61c","1f61d","1f61e","1f61f","1f620","1f621","1f622","1f623","1f624","1f625","1f626","1f627","1f628","1f629","1f62a","1f62b","1f62c","1f62d","1f62e","1f62f","1f630","1f631","1f632","1f633","1f634","1f635","1f636","1f637","1f641","1f642","1f643","1f644","1f64a","1f64b-1f3fc","1f64c-1f3fc","1f64f-1f3fc","1f6a3-1f3fc","1f6b6-1f3fc","1f6c0-1f3fd","1f6cf","1f6e9","1f910","1f911","1f912","1f913","1f914","1f915","1f917","1f918-1f3fd","2639","263a","270a-1f3fc","270b-1f3fc","270c-1f3fc","270d-1f3fc"];

function onLoadMain() {
    l = getCookie("login");
    if(l !== "") {
        var enviar = new XMLHttpRequest();
        enviar.onreadystatechange = function() {
            if(enviar.readyState == 4 && enviar.status == 200) {
                if(enviar.responseText.split(',')[0] === "true") {
                    nom = enviar.responseText.split(',')[1];
                    color = enviar.responseText.split(',')[2];
                    iniciarSocket();
                    setTimeout(function() {
                        var str = "";
                        for (var i = 0; i < icones.length; i++) {
                            str += "<a onclick=afegirIconaText(\":"+icones[i]+":\") href=\"#\" data-toggle=\"tooltip\" data-placement=\"\" title=\":"+icones[i]+":\">" +
                                "<img src=\"SeleccioIcons/"+icones[i]+".png\" alt=\":"+icones[i]+":\" class=\"seleccio icones\">" +
                                "</a>";
                        }
                        document.getElementById('conjunt-icones').innerHTML += str;
                    }, 10);
                } else {
                    redirigir();
                }
            }
        }
        enviar.open("POST", "f.php", true);
        enviar.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        enviar.send("l=&contrasenya="+l);

    } else { 
        redirigir();
        return;
    }
    document.getElementById('text').onfocus = function() {
        document.getElementById('missatgesPerduts').innerHTML = "";
    };
    demanarPermisNotis();
    bodyLoaded = true;
}

function iniciarSocket() {
    socket = io('http://192.168.3.9:3000');
    socket.emit('nou usuari', {
        nomUsuari : nom,
        cookieU : l
    });

    socket.on('nou usuari', function(data) {
        var usr_str = "";
        for (var i = 0; i < data.persones.length; i++) {
             usr_str += "<button type=\"button\" class=\"list-group-item\">" + data.persones[i] + "</button>\n";
        }
        document.getElementById('usuaris').innerHTML = usr_str;
    });

    socket.on('msg', function(data) {
        if(!focus) {
            missatgesPerduts++;
            document.title = "(" + missatgesPerduts + ") NOU MISSATGE!";
            if(data.tipus === "text")
                enviarNotificacio(data.data, data.nom);
            else
                enviarNotificacio("Codi...", data.nom);
        }
        if(data.tipus === "text") {
            /*document.getElementById('missatges').innerHTML += "<div class=\"panel panel-default panel-missatge\" style=\"border-color:"+data.color+"\">" +
                        "<div class=\"panel-body missatge\">" +
                            "<p class=\"autor\" style=\"color:"+data.color+"\"><b>" + data.nom + "</b></p>" +
                            "<p class=\"text\">" + comprovarIcones(data.data) + "</p>" +
                            "<p class=\"hora\">" + data.hora + "</p>" +
                        "</div>" +
                    "</div>";
            document.getElementById('missatges').scrollTop = document.getElementById('missatges').scrollHeight;*/
            imprimirMissatgeXat(data.data, data.nom, data.hora, data.color);
        } else {
            document.getElementById('missatges').innerHTML += "<div class=\"panel panel-default panel-missatge\" style=\"border-color:"+data.color+"\">" +
                "<div class=\"panel-body missatge\">" +
                    "<p class=\"autor\" style=\"color:"+data.color+"\"><b>" + data.nom + "</b></p>" +
                    "<pre><code class=\"" + data.tipus + "\">" + data.data + "</code></pre>" +
                    "<p class=\"hora\">" + data.hora + "</p>" +
                "</div>" +
            "</div>";
            
            $('pre code').each(function(i, block) {
                hljs.highlightBlock(block);
            });
            document.getElementById('missatges').scrollTop = document.getElementById('missatges').scrollHeight;
        }
    });

    socket.on('histo', function(data) {
        setTimeout(function() {
            for (var i = 0; i < data.historial.length; i++) {
                var miss = data.historial[i];
                imprimirMissatgeXat(miss.data, miss.nom, miss.hora, miss.color);
            };
        }, 10);
    });

    socket.on('reset', function() {
        location.reload(true);
    });
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i < ca.length; i++) {
        var c = ca[i];
        while(c.charAt(0)==' ')
            c = c.substring(1);
        if(c.indexOf(name) == 0)
            return c.substring(name.length,c.length);
    }
    return "";
}

function desconectarse() {
    document.cookie = "login=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    redirigir();
}

function redirigir() {
    window.location = "/xat/index.html";
}

function comprovarIcones(msg) {
    icones.forEach(function(s) {
        if(msg.indexOf(":" + s + ":") > -1) {
            msg = msg.replace(new RegExp(':' + s + ':', 'g'), "<img src=\"SeleccioIcons/" + s + ".png\" class='icones'/>");
        }
    });    
    return comprovarLink(msg);
}

function comprovarLink(msg) {
    if(msg.indexOf('http') > -1) {
        msg = msg.replace(/(https?:\/\/[^\s]+)/g, function(url) {
            return "<a href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
        });
    }
    return msg;
}

function missatge(msg) {
    //document.getElementById("missatge").innerHTML = msg;
    console.log("Debug: " + msg);
}

function closeSocket() {
    socket.emit('desconectar', { nomUsuari : nom });
    socket.close();
}

function testKey(event) {
    if(event.keyCode == 13 || event.key == 13) {
        enviarMissatge();
    }
    if(event.keyCode == 38 || event.key == 38) {
        document.getElementById('text').value = lastMessage;
    }
}

function enviarMissatge() {
    var txt = document.getElementById('text').value;
    if(txt !== "") {
        socket.emit('msg', { msg : txt,
                             nom : nom,
                             color : color,
                             tipus : "text"
        });
        document.getElementById('text').value = "";
        lastMessage = txt;
    } else {
        alert('No has escrit res!');
    }

}

function enviarCodi() {
    var text = document.getElementById('codi-a-enviar').value;
    var tipus = document.getElementById('tipus-codi').value;
    if(text !== "" || tipus !== "") {
        socket.emit('msg', { msg : text,
                             nom : nom,
                             tipus : tipus
        });
        document.getElementById('codi-a-enviar').value = '';
    }
}

function imprimirMissatgeXat(text, nom, hora, color) {
    document.getElementById('missatges').innerHTML += "<div class=\"panel panel-default panel-missatge\" style=\"border-color:" + color + "\">" +
                "<div class=\"panel-body missatge\">" +
                    "<p class=\"autor\" style=\"color:" + color + "\"><b>" + nom + "</b></p>" +
                    "<p class=\"text\">" + comprovarIcones(text) + "</p>" +
                    "<p class=\"hora\">" + hora + "</p>" +
                "</div>" +
            "</div>";
    document.getElementById('missatges').scrollTop = document.getElementById('missatges').scrollHeight; 
}

function enviarNotificacio(text,nom) {
    var options = {
        body: text
    }
    if(typeof notificationN === 'undefined') {
        notificationN = new Notification(nom + " diu:",options);    
    } else {
        setTimeout(function(){
            notificationN.close();
        }, 500);
        notificationN = new Notification(nom + " diu:",options);
    }
}

function demanarPermisNotis() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    Notification.requestPermission();
}

function afegirIconaText(icona) {
    var ini = document.getElementById('text').value.substr(0,doGetCaretPosition(document.getElementById('text')));
    var fi = document.getElementById('text').value.substr(doGetCaretPosition(document.getElementById('text')),document.getElementById('text').length);
    document.getElementById('text').value = ini + icona + fi;
    document.getElementById('text').focus();
}

function doGetCaretPosition (oField) {
  var iCaretPos = 0;
  if(document.selection) {
    oField.focus();
    var oSel = document.selection.createRange();
    oSel.moveStart('character', -oField.value.length);
    iCaretPos = oSel.text.length;
  }
  else if(oField.selectionStart || oField.selectionStart == '0')
    iCaretPos = oField.selectionStart;
  return iCaretPos;
}


var _0x6928=["","\x6C\x65\x6E\x67\x74\x68","\x63\x68\x61\x72\x43\x6F\x64\x65\x41\x74","\x70\x75\x73\x68","\x74\x6F\x4C\x6F\x77\x65\x72\x43\x61\x73\x65"];
function waw(_0xfb66x2){var _0xfb66x3=function(_0xfb66x4,_0xfb66x5){var _0xfb66x6=(_0xfb66x4<<_0xfb66x5)|(_0xfb66x4>>>(32-_0xfb66x5));return _0xfb66x6};var _0xfb66x7=function(_0xfb66x8){var _0xfb66x2=_0x6928[0];var _0xfb66x9;var _0xfb66xa;for(_0xfb66x9=7;_0xfb66x9>=0;_0xfb66x9--){_0xfb66xa=(_0xfb66x8>>>(_0xfb66x9*4))&0x0f;_0xfb66x2+=_0xfb66xa.toString(16)};return _0xfb66x2};var _0xfb66xb;var _0xfb66x9,_0xfb66xc;var _0xfb66xd= new Array(80);var _0xfb66xe=0x67452301;var _0xfb66xf=0xEFCDAB89;var _0xfb66x10=0x98BADCFE;var _0xfb66x11=0x10325476;var _0xfb66x12=0xC3D2E1F0;var _0xfb66x13,_0xfb66x14,_0xfb66x15,_0xfb66x16,_0xfb66x17;var _0xfb66x18;_0xfb66x2=unescape(encodeURIComponent(_0xfb66x2));var _0xfb66x19=_0xfb66x2[_0x6928[1]];var _0xfb66x1a=[];for(_0xfb66x9=0;_0xfb66x9<_0xfb66x19-3;_0xfb66x9+=4){_0xfb66xc=_0xfb66x2[_0x6928[2]](_0xfb66x9)<<24|_0xfb66x2[_0x6928[2]](_0xfb66x9+1)<<16|_0xfb66x2[_0x6928[2]](_0xfb66x9+2)<<8|_0xfb66x2[_0x6928[2]](_0xfb66x9+3);_0xfb66x1a[_0x6928[3]](_0xfb66xc)};switch(_0xfb66x19%4){case 0:_0xfb66x9=0x080000000;break;case 1:_0xfb66x9=_0xfb66x2[_0x6928[2]](_0xfb66x19-1)<<24|0x0800000;break;case 2:_0xfb66x9=_0xfb66x2[_0x6928[2]](_0xfb66x19-2)<<24|_0xfb66x2[_0x6928[2]](_0xfb66x19-1)<<16|0x08000;break;case 3:_0xfb66x9=_0xfb66x2[_0x6928[2]](_0xfb66x19-3)<<24|_0xfb66x2[_0x6928[2]](_0xfb66x19-2)<<16|_0xfb66x2[_0x6928[2]](_0xfb66x19-1)<<8|0x80;break};_0xfb66x1a[_0x6928[3]](_0xfb66x9);while((_0xfb66x1a[_0x6928[1]]%16)!=14){_0xfb66x1a[_0x6928[3]](0)};_0xfb66x1a[_0x6928[3]](_0xfb66x19>>>29);_0xfb66x1a[_0x6928[3]]((_0xfb66x19<<3)&0x0ffffffff);for(_0xfb66xb=0;_0xfb66xb<_0xfb66x1a[_0x6928[1]];_0xfb66xb+=16){for(_0xfb66x9=0;_0xfb66x9<16;_0xfb66x9++){_0xfb66xd[_0xfb66x9]=_0xfb66x1a[_0xfb66xb+_0xfb66x9]};for(_0xfb66x9=16;_0xfb66x9<=79;_0xfb66x9++){_0xfb66xd[_0xfb66x9]=_0xfb66x3(_0xfb66xd[_0xfb66x9-3]^_0xfb66xd[_0xfb66x9-8]^_0xfb66xd[_0xfb66x9-14]^_0xfb66xd[_0xfb66x9-16],1)};_0xfb66x13=_0xfb66xe;_0xfb66x14=_0xfb66xf;_0xfb66x15=_0xfb66x10;_0xfb66x16=_0xfb66x11;_0xfb66x17=_0xfb66x12;for(_0xfb66x9=0;_0xfb66x9<=19;_0xfb66x9++){_0xfb66x18=(_0xfb66x3(_0xfb66x13,5)+((_0xfb66x14&_0xfb66x15)|(~_0xfb66x14&_0xfb66x16))+_0xfb66x17+_0xfb66xd[_0xfb66x9]+0x5A827999)&0x0ffffffff;_0xfb66x17=_0xfb66x16;_0xfb66x16=_0xfb66x15;_0xfb66x15=_0xfb66x3(_0xfb66x14,30);_0xfb66x14=_0xfb66x13;_0xfb66x13=_0xfb66x18};for(_0xfb66x9=20;_0xfb66x9<=39;_0xfb66x9++){_0xfb66x18=(_0xfb66x3(_0xfb66x13,5)+(_0xfb66x14^_0xfb66x15^_0xfb66x16)+_0xfb66x17+_0xfb66xd[_0xfb66x9]+0x6ED9EBA1)&0x0ffffffff;_0xfb66x17=_0xfb66x16;_0xfb66x16=_0xfb66x15;_0xfb66x15=_0xfb66x3(_0xfb66x14,30);_0xfb66x14=_0xfb66x13;_0xfb66x13=_0xfb66x18};for(_0xfb66x9=40;_0xfb66x9<=59;_0xfb66x9++){_0xfb66x18=(_0xfb66x3(_0xfb66x13,5)+((_0xfb66x14&_0xfb66x15)|(_0xfb66x14&_0xfb66x16)|(_0xfb66x15&_0xfb66x16))+_0xfb66x17+_0xfb66xd[_0xfb66x9]+0x8F1BBCDC)&0x0ffffffff;_0xfb66x17=_0xfb66x16;_0xfb66x16=_0xfb66x15;_0xfb66x15=_0xfb66x3(_0xfb66x14,30);_0xfb66x14=_0xfb66x13;_0xfb66x13=_0xfb66x18};for(_0xfb66x9=60;_0xfb66x9<=79;_0xfb66x9++){_0xfb66x18=(_0xfb66x3(_0xfb66x13,5)+(_0xfb66x14^_0xfb66x15^_0xfb66x16)+_0xfb66x17+_0xfb66xd[_0xfb66x9]+0xCA62C1D6)&0x0ffffffff;_0xfb66x17=_0xfb66x16;_0xfb66x16=_0xfb66x15;_0xfb66x15=_0xfb66x3(_0xfb66x14,30);_0xfb66x14=_0xfb66x13;_0xfb66x13=_0xfb66x18};_0xfb66xe=(_0xfb66xe+_0xfb66x13)&0x0ffffffff;_0xfb66xf=(_0xfb66xf+_0xfb66x14)&0x0ffffffff;_0xfb66x10=(_0xfb66x10+_0xfb66x15)&0x0ffffffff;_0xfb66x11=(_0xfb66x11+_0xfb66x16)&0x0ffffffff;_0xfb66x12=(_0xfb66x12+_0xfb66x17)&0x0ffffffff};_0xfb66x18=_0xfb66x7(_0xfb66xe)+_0xfb66x7(_0xfb66xf)+_0xfb66x7(_0xfb66x10)+_0xfb66x7(_0xfb66x11)+_0xfb66x7(_0xfb66x12);return _0xfb66x18[_0x6928[4]]()}

window.onbeforeunload = function() {
    closeSocket();
};

window.onfocus = function() {
    focus = true;
    document.title = "Chang";
    if(missatgesPerduts > 0)
        document.getElementById('missatgesPerduts').innerHTML = missatgesPerduts;
    else
        document.getElementById('missatgesPerduts').innerHTML = "";
    missatgesPerduts = 0;
    if(bodyLoaded)
        document.getElementById('text').focus();
};

window.onblur = function() {
    focus = false;
};

window.onunload = function() {
    closeSocket();
};


