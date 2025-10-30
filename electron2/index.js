document.onkeydown = updateKey;
document.onkeyup = resetKey;

var server_port = 65432;
var server_addr = "10.131.111.204"; // the IP address of your Raspberry PI
let activeClient = null;

function client() {
  const net = require("net");
  var input = document.getElementById("message").value;

  const client = net.createConnection(
    { port: server_port, host: server_addr },
    () => {
      // 'connect' listener.
      console.log("connected to server!");
      // send the message
      client.write(`${input}\r\n`);
    }
  );

  // get the data from the server
  client.on("data", (data) => {
    document.getElementById("bluetooth").innerHTML = data;
    document.getElementById("direction").innerHTML = data;
    console.log(data.toString());
    client.end();
    client.destroy();
  });

  client.on("end", () => {
    console.log("disconnected from server");
  });
}

// for detecting which key is been pressed w,a,s,d
let keyPressed = false; // si hay una tecla activa

function updateKey(e) {
  e = e || window.event;
  if (keyPressed) return; // ignorar repeats
  keyPressed = true;

  switch (e.keyCode) {
    case 87: // W / Up
      document.getElementById("upArrow").style.color = "green";
      send_data("forward");
      break;
    case 83: // S / Down
      document.getElementById("downArrow").style.color = "green";
      send_data("backward");
      break;
    case 65: // A / Left
      document.getElementById("leftArrow").style.color = "green";
      send_data("left");
      break;
    case 68: // D / Right
      document.getElementById("rightArrow").style.color = "green";
      send_data("right");
      break;
  }
}

function resetKey(e) {
  e = e || window.event;
  keyPressed = false;

  document.getElementById("upArrow").style.color = "grey";
  document.getElementById("downArrow").style.color = "grey";
  document.getElementById("leftArrow").style.color = "grey";
  document.getElementById("rightArrow").style.color = "grey";

  stopClient(); // envía stop y espera respuesta antes de abrir otra conexión
}

function send_data(x) {
  const net = require("net");
  var input = x;

  const client = net.createConnection(
    { port: server_port, host: server_addr },
    () => {
      // 'connect' listener.
      console.log("connected to server!");
      // send the message
      client.write(`${input}\r\n`);
    }
  );

  // get the data from the server
  client.on("data", (data) => {
    document.getElementById("bluetooth").innerHTML = data;
    document.getElementById("direction").innerHTML = data;
    document.getElementById("speed").innerHTML = 0.3;
    console.log(data.toString());
  });

  activeClient = client;
}
function stopClient() {
  if (activeClient) {
    try {
      console.log("Enviando stop al servidor...");
      activeClient.write("stop\n");

      // escuchamos la respuesta del servidor solo una vez
      activeClient.on("data", (data) => {
        const msg = data.toString().trim();
        const parts = msg.split(",");

        const distance = parseFloat(parts[1]);
        const totalDistance = parseFloat(parts[2]);
        document.getElementById("direction").innerHTML = parts[0];
        document.getElementById("bluetooth").innerHTML = parts[0];
        document.getElementById("speed").innerHTML = 0;

        if (!isNaN(totalDistance)) {
          document.getElementById("distance").innerHTML = parts[2]+" cm";
        }

        const temp = parts[3];
        document.getElementById("temperature").innerHTML = temp + " F";

        console.log("Servidor respondió:", msg);

        if (parts[0] === "Stopping") {
          console.log("Servidor indicó stop, cerrando conexión");
          activeClient.end();
          activeClient.destroy();
          activeClient = null;
        }
      });
    } catch (err) {
      console.error("Error al enviar stop:", err);
      activeClient = null;
    }
  }
}
