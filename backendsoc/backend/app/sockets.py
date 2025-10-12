import socketio

# Socket.IO Async server with permissive CORS for local dev
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
)

# Expose ASGI app to be mounted in main.py
socket_app = socketio.ASGIApp(sio)

# Optional: room helpers to scope messages by conversation id
@sio.event
async def connect(sid, environ):
    pass

@sio.event
async def disconnect(sid):
    pass

@sio.event
async def join_conversation(sid, data):
    cid = str(data.get("conversation_id")) if isinstance(data, dict) else None
    if cid:
        await sio.enter_room(sid, cid)

@sio.event
async def leave_conversation(sid, data):
    cid = str(data.get("conversation_id")) if isinstance(data, dict) else None
    if cid:
        await sio.leave_room(sid, cid)
