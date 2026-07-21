from fastapi import WebSocket

from src.core.ports import ILogger
from src.core.ports.utils.disposable_protocol import IDisposable


# Thread-safe solange nur im FastApi Worker-Thread (Async-Kontext) verwendet
class ConnectionManager(IDisposable):
    def __init__(self, logger: ILogger):
        self._logger: ILogger = logger
        self.active_connections: list[WebSocket] = []
        # Group-based connections for targeted broadcasting
        self.groups: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket) -> None:
        self._logger.debug(f"WebSocket connection request: {websocket.client.host}")
        await websocket.accept()
        self.active_connections.append(websocket)
        self._logger.debug(f"WebSocket total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket not in self.active_connections:
            raise ValueError("WebSocket not found in active connections")
        self.active_connections.remove(websocket)
        self._logger.debug(f"WebSocket disconnected: {websocket.client.host}")
        self._logger.debug(f"WebSocket total active connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def connect_to_group(self, websocket: WebSocket, group: str) -> None:
        """Connect a WebSocket to a named group for targeted broadcasting."""
        self._logger.debug(f"WebSocket connecting to group '{group}': {websocket.client.host}")
        await websocket.accept()
        
        if group not in self.groups:
            self.groups[group] = []
        
        self.groups[group].append(websocket)
        self.active_connections.append(websocket)
        self._logger.debug(
            f"WebSocket connected to group '{group}'. "
            f"Group size: {len(self.groups[group])}, Total connections: {len(self.active_connections)}"
        )

    def disconnect_from_group(self, websocket: WebSocket, group: str):
        """Disconnect a WebSocket from a named group."""
        # Remove from group
        if group in self.groups and websocket in self.groups[group]:
            self.groups[group].remove(websocket)
            self._logger.debug(f"WebSocket disconnected from group '{group}': {websocket.client.host}")
            
            # Clean up empty groups
            if not self.groups[group]:
                del self.groups[group]
                self._logger.debug(f"Group '{group}' removed (empty)")
        
        # Remove from active connections
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            self._logger.debug(f"WebSocket total active connections: {len(self.active_connections)}")

    async def broadcast_to_group(self, group: str, message: dict | str):
        """Broadcast a message to all WebSockets in a specific group."""
        if group not in self.groups:
            self._logger.debug(f"No active connections in group '{group}'")
            return
        
        # Convert dict to JSON string if needed
        if isinstance(message, dict):
            import json
            message_str = json.dumps(message)
        else:
            message_str = message
        
        # Send to all connections in the group
        disconnected = []
        for connection in self.groups[group]:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                self._logger.error(f"Error sending to WebSocket in group '{group}': {str(e)}")
                disconnected.append(connection)
        
        # Clean up disconnected WebSockets
        for connection in disconnected:
            self.disconnect_from_group(connection, group)

    async def dispose(self, disposing: bool) -> None:
        self._logger.debug("Disposing ConnectionManager and closing all active WebSocket connections.")
        for connection in self.active_connections:
            await connection.close()
        self.active_connections.clear()
