# Voting App Backend

Este es el backend para una aplicación de planificación de votaciones basada en el método de Planning Poker. El servidor está construido con Node.js y usa Socket.IO para la comunicación en tiempo real.

## Funcionalidades

- **Creación de Salas:** Permite a los usuarios crear nuevas salas y convertirse en el administrador.
- **Unirse a Salas:** Los usuarios pueden unirse a una sala existente mediante un ID.
- **Votación en Tiempo Real:** Los usuarios pueden votar en tiempo real y ver el promedio de votos.
- **Resetear Votación:** El administrador puede reiniciar la votación, limpiando los votos actuales.
- **Cerrar Sala:** El administrador puede cerrar la sala, desconectando a todos los participantes.
- **Salir de la Sala:** Los usuarios pueden salir de una sala, y el administrador puede cerrar la sala si es el único participante.

## Requisitos

- [Node.js](https://nodejs.org/) (versión 14 o superior)
- [npm](https://www.npmjs.com/) (viene con Node.js)

## Instalación

1. **Clonar el Repositorio:**
   ```bash
   git clone https://github.com/zeroexu/voting-app-be.git
