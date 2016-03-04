var socket;
var nom = "No conectat";
function onLoadMain() {
    socket = io('http://192.168.3.9:3000');
    socket.on('msg', function(data) {
        var inn = document.getElementById('missatges').innerHTML;
        console.log(data);
        document.getElementById('missatges').innerHTML += "<div class=\"missatge\">" +
                    "<div class=\"cont\">" +
                        "<p class=\"autor\">" + data.nom + "</p>" +
                        "<p class=\"text\">" + data.data + "</p>" +
                    "</div>" +
                "</div>";
        document.getElementById('missatges').scrollTop = document.getElementById('missatges').scrollHeight;
    });

    var l = getCookie("login");
    if(l !== "") {
        var enviar = new XMLHttpRequest();
        enviar.onreadystatechange = function() {
            if(enviar.readyState == 4 && enviar.status == 200) {
                if(enviar.responseText.split(',')[0] === "true") {
                    nom = enviar.responseText.split(',')[1];
                    missatge("Hola " + nom + "!! Benvingut al club...");
                } else {
                    missatge("La teva sessió ha expirat, seras rediregit al login.");
                    setTimeout(function() {
                        window.location = "index.html";
                    }, 3000);
                }
                //window.location = "http://google.com/?q="+enviar.responseText;
            }
        }
        enviar.open("POST", "f.php", true);
        enviar.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        enviar.send("l=&contrasenya="+l);

    } else {
        missatge("La teva sessió ha expirat, seras rediregit al login.");
        setTimeout(function() {
            window.location = "index.html";
        }, 1000);
    }
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
    window.location = "index.html";
}

function missatge(msg) {
    //document.getElementById("missatge").innerHTML = msg;
    console.log("Debug: " + msg);
}

function closeSocket() {
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
                            nom : nom
        });
        document.getElementById('text').value = "";
    } else {
        alert('No has escrit res!');
    }

}

window.onbeforeunload = function() {
    closeSocket();
};

window.onunload = function() {
    closeSocket();
};