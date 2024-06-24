# Planning Poker Voting System

Este es un sistema de votación en tiempo real para "planning poker" implementado en Node.js utilizando Socket.IO. Este proyecto permite a los usuarios crear salas, unirse a salas existentes y emitir votos numéricos. El administrador de la sala tiene capacidades adicionales como iniciar y resetear la votación, cerrar la sala y expulsar miembros.

## Requisitos

- Node.js
- npm (Node Package Manager)

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/planning-poker.git
```

2. Navega al directorio del proyecto:
```bash
cd planning-poker
```

3) Instala las dependencias:
```bash
npm install
```

## Uso
Para iniciar el servidor, ejecuta el siguiente comando:

```bash
node index.js
```
El servidor estará escuchando en el puerto 3000.

## API de Socket.IO
### Eventos
*create_room:* Crea una nueva sala. El usuario que crea la sala se convierte en el administrador.
- Parámetros: { roomId: string, maxParticipants: number, name: string }
- Respuesta: { roomId: string, admin: boolean, token: string }
*join_room:* Permite a un usuario unirse a una sala existente.

- Parámetros: { roomId: string, name: string }
- Respuesta: { roomId: string, admin: boolean, token: string }
*vote:* Emite un voto en una sala.

- Parámetros: { roomId: string, vote: number }
- Respuesta: { votes: object, avgVote: number }
*reset_votes:* Resetea los votos en una sala. Solo el administrador puede realizar esta acción.

- Parámetros: { roomId: string }
- Respuesta: void
*kick_user:* Expulsa a un usuario de una sala. Solo el administrador puede realizar esta acción.

- Parámetros: { roomId: string, userId: string }
- Respuesta: void
*close_room:* Cierra una sala. Solo el administrador puede realizar esta acción.

- Parámetros: { roomId: string }
- Respuesta: void
### Manejo de Eventos
*room_created:* Se emite cuando una sala es creada.

- Parámetros: { roomId: string, admin: boolean, token: string }
- room_joined: Se emite cuando un usuario se une a una sala.

*Parámetros:* { roomId: string, admin: boolean, token: string }
- vote_update: Se emite cuando hay una actualización en los votos.

- Parámetros: { votes: object, avgVote: number }
*votes_reset:* Se emite cuando los votos son reseteados.

- Parámetros: void
*kicked:* Se emite cuando un usuario es expulsado de una sala.

- Parámetros: void
*room_closed:* Se emite cuando una sala es cerrada.

- Parámetros: void
*user_joined:* Se emite cuando un nuevo usuario se une a una sala.

- Parámetros: { userId: string, name: string, token: string }
*user_left:* Se emite cuando un usuario deja una sala.

- Parámetros: { userId: string }
*error:* Se emite cuando ocurre un error.

- Parámetros: string

## Funcionalidades
- Crear Sala: El primer usuario que crea la sala se convierte en el administrador.
- Unirse a Sala: Los usuarios pueden unirse a una sala existente proporcionando el ID de la sala.
- Votación: Los usuarios pueden emitir votos numéricos. Los votos se promedian y se envía el resultado a todos los miembros de la sala.
- Resetear Votación: Solo el administrador puede resetear los votos.
- Expulsar Miembro: El administrador puede expulsar a cualquier miembro de la sala.
- Cerrar Sala: El administrador puede cerrar la sala en cualquier momento.
- Inactividad: Las salas se cierran automáticamente después de 10 minutos de inactividad.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo LICENSE para obtener más detalles.

## Contribuir

Las contribuciones son bienvenidas. Si deseas contribuir, por favor sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -am 'Agrega nueva funcionalidad'`).
4. Empuja tus cambios a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

