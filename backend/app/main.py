from fastapi import FastAPI

from .routers import task, session

app = FastAPI()

app.include_router(task.router)
app.include_router(session.router)

@app.get("/")
def root():
    return "This is Diachrony Timer."