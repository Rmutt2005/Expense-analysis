from __future__ import annotations

import io
from typing import Any

import joblib


def dumps_model(model: Any) -> bytes:
    buf = io.BytesIO()
    joblib.dump(model, buf)
    return buf.getvalue()


def loads_model(blob: bytes) -> Any:
    buf = io.BytesIO(blob)
    return joblib.load(buf)
