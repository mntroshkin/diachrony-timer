from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from .routers import task, session

app = FastAPI()

app.include_router(task.router)
app.include_router(session.router)

app.mount("/", StaticFiles(directory="./frontend", html=True), name="static")