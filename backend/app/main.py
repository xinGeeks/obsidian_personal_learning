from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.graph_routes import router as graph_router
from .routes.learning_routes import router as learning_router
from .routes.mastery_routes import router as mastery_router
from .routes.quiz import router as quiz_router
from .routes.resources_routes import router as resources_router
from .routes.settings_routes import router as settings_router
from .routes.vault import router as vault_router

app = FastAPI(title="Personal Learning Hub", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vault_router)
app.include_router(quiz_router)
app.include_router(learning_router)
app.include_router(mastery_router)
app.include_router(graph_router)
app.include_router(resources_router)
app.include_router(settings_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
