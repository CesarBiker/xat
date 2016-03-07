var socket;
var nom = "No conectat";
var focus = false;
var interval;
var missatgesPerduts = 0;
var notificationN;

function onLoadMain() {

    var l = getCookie("login");
    if(l !== "") {
        var enviar = new XMLHttpRequest();
        enviar.onreadystatechange = function() {
            if(enviar.readyState == 4 && enviar.status == 200) {
                if(enviar.responseText.split(',')[0] === "true") {
                    nom = enviar.responseText.split(',')[1];
                    //missatge("Hola " + nom + "!! Benvingut al club...");
                    iniciarSocket();
                } else {
                    redirigir();
                }
                //window.location = "http://google.com/?q="+enviar.responseText;
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
}

function iniciarSocket() {
    socket = io('http://192.168.3.9:3000');
    socket.emit('nou usuari', {
        nomUsuari : nom
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
        console.log(data);
        if(data.tipus === "text") {
            document.getElementById('missatges').innerHTML += "<div class=\"panel panel-default panel-missatge\">" +
                        "<div class=\"panel-body missatge\">" +
                            "<p class=\"autor\"><b>" + data.nom + "</b></p>" +
                            "<p class=\"text\">" + data.data + "</p>" +
                            "<p class=\"hora\">" + data.hora + "</p>" +
                        "</div>" +
                    "</div>";
            document.getElementById('missatges').scrollTop = document.getElementById('missatges').scrollHeight;
        } else {
            document.getElementById('missatges').innerHTML += "<div class=\"panel panel-default panel-missatge\">" +
                "<div class=\"panel-body missatge\">" +
                    "<p class=\"autor\"><b>" + data.nom + "</b></p>" +
                    /*"<p class=\"text\"><pre><code class=\""+tipus+"\">" + text + "</code></pre></p>" + */
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

function missatge(msg) {
    //document.getElementById("missatge").innerHTML = msg;
    console.log("Debug: " + msg);
}

function closeSocket() {
    socket.emit('desconectar', { nomUsuari : nom });
    socket.close();
}

function testKey(event) {
    if(event.key == "Enter") {
        enviarMissatge();
    }
}

function enviarMissatge() {
    var txt = document.getElementById('text').value;
    if(txt !== "") {
        socket.emit('msg', { msg : txt,
                             nom : nom,
                             tipus : "text"
        });
        document.getElementById('text').value = "";
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
    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
        console.log("granted1");
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
            if (permission === "granted") {
                console.log("granted2");
            }
        });
    }
    // At last, if the user has denied notifications, and you 
    // want to be respectful there is no need to bother them any more.
    Notification.requestPermission();
}

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
};

window.onblur = function() {
    focus = false;
};

window.onunload = function() {
    closeSocket();
};
