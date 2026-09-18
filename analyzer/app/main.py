from fastapi import FastAPI

from app.routes.analyze import router as analyze_router

app = FastAPI(
    title="Codebase Intelligence Analyzer",
    description="Static code analysis engine for the Codebase Intelligence Platform",
    version="1.0.0",
)


app.include_router(
    analyze_router,
    prefix="",
)

@app.get("/")
def root():
    return {
        "name": "Codebase Intelligence Analyzer",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }