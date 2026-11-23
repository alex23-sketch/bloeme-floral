"""Shared Pydantic primitives and paginated envelopes."""

from __future__ import annotations

from typing import Annotated, Generic, Literal, TypeVar

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

T = TypeVar("T")


def _non_negative(v: int) -> int:
    if v < 0:
        raise ValueError("must be zero or greater")
    return v


Cents = Annotated[int, Field(strict=True, ge=0, description="Integer cents (USD)")]
NonNegInt = Annotated[int, AfterValidator(_non_negative)]
Slug = Annotated[str, Field(min_length=2, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
HexColor = Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]
ISODate = Annotated[str, Field(pattern=r"^\d{4}-\d{2}-\d{2}$")]
VariantSize = Literal["classic", "deluxe", "grand"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PageMeta(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int
    pages: int


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    meta: PageMeta


class OkResponse(BaseModel):
    ok: bool = True
    message: str = ""


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody
