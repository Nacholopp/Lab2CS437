import socket
import sys
import time
import os

# --- IMPORTAR EL CONTROL DEL COCHE ---
sys.path.append('/home/j309/Freenove_4WD_Smart_Car_Kit_for_Raspberry_Pi/Code/Server')  # Ajusta si tu motor.py está en otra carpeta
from motor import Ordinary_Car

# Crear instancia del coche
car = Ordinary_Car()

HOST = "172.24.72.204"  # IP de tu Raspberry
PORT = 65432

start_time = None       # Momento en que empezó a moverse
total_distance = 0.0    # Distancia acumulada en metros
velocity = 0.3 


def get_raspberry_temperature():
    # Ejecuta el comando de la Raspberry Pi
    output = os.popen("vcgencmd measure_temp").read()
    # output viene tipo: temp=45.2'C
    temp_str = output.replace("temp=", "").replace("'C", "")
    return float(temp_str)

print("🚗 Starting WiFi car server...")
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    print(f"✅ Listening on {HOST}:{PORT}")

    try:
        while True:
            client, addr = s.accept()
            print("📡 Connected from:", addr)
            with client:
                while True:
                    data = client.recv(1024)
                    if not data:
                        print("❌ Client disconnected")
                        break

                    msg = data.decode().strip().lower()
                    print(f"📩 Received: {msg}")

                    # --- MAPEO DE COMANDOS A MOTORES ---
                    if msg == "forward":
                        car.set_motor_model(2000, 2000, 2000, 2000)
                        start_time = time.time()
                        client.sendall(b"Moving forward")
                        
                        
                    elif msg == "backward":
                        car.set_motor_model(-2000, -2000, -2000, -2000)
                        start_time = time.time()
                        client.sendall(b"Moving forward")
                    elif msg == "left":
                        car.set_motor_model(-2000, -2000, 2000, 2000)
                        client.sendall(b"Turning left")
                    elif msg == "right":
                        car.set_motor_model(2000, 2000, -2000, -2000)
                        client.sendall(b"Turning right")
                    elif msg == "stop":
                        car.set_motor_model(0, 0, 0, 0)
                        if start_time:
                            elapsed = time.time() - start_time
                            distance = velocity * elapsed
                            total_distance += abs(distance)
                            start_time = None

                            response = f"Stopping,{distance:.2f},{total_distance:.2f},{get_raspberry_temperature()}"
                            client.sendall(response.encode())
                        else:
                            client.sendall(b"Stopping")
                    else:
                        client.sendall(b"Unknown command")

    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    finally:
        car.close()
        print("🔒 Motors stopped, socket closed.")
        s.close()
