"""Catalog API contracts. `Public*` shapes match `src/types/content.ts` so the
website and the future Expo app consume identical resources."""

from __future__ import annotations

from pydantic import BaseModel, Field

from .common import Cents, HexColor, NonNegInt, ORMModel, Slug, VariantSize


# ------------------------------------------------------------------ write inputs


class ProductImageIn(BaseModel):
    src: str = Field(min_length=1, max_length=500)
    alt: str = Field(default="", max_length=300)
    position: int = 0


class VariantIn(BaseModel):
    size: VariantSize
    label: str | None = Field(default=None, max_length=40)
    stems: str = Field(default="", max_length=80)
    description: str = ""
    price_cents: Cents
    compare_at_price_cents: Cents | None = None
    sku: str | None = Field(default=None, max_length=50)
    stock_qty: NonNegInt = 0
    in_stock: bool = True


class PaletteColor(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    hex: HexColor


class Dimensions(BaseModel):
    width: float = Field(default=11, gt=0, le=100)
    height: float = Field(default=18, gt=0, le=100)


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: Slug | None = None
    sku: str | None = Field(default=None, max_length=40, pattern=r"^[A-Z0-9-]+$")
    collection_id: str
    short_description: str = Field(default="", max_length=300)
    description: str = ""
    category_tags: list[str] = []
    flower_types: list[str] = []
    color_palette: list[PaletteColor] = []
    dimensions: Dimensions = Dimensions()
    vase_included: bool = False
    care_instructions: list[str] = []
    featured: bool = False
    bestseller: bool = False
    new_arrival: bool = False
    low_stock_threshold: NonNegInt = 3
    seo_title: str = Field(default="", max_length=200)
    seo_description: str = Field(default="", max_length=400)
    images: list[ProductImageIn] = []
    variants: list[VariantIn] = Field(default_factory=list, max_length=3)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: Slug | None = None
    collection_id: str | None = None
    short_description: str | None = Field(default=None, max_length=300)
    description: str | None = None
    category_tags: list[str] | None = None
    flower_types: list[str] | None = None
    color_palette: list[PaletteColor] | None = None
    dimensions: Dimensions | None = None
    vase_included: bool | None = None
    care_instructions: list[str] | None = None
    featured: bool | None = None
    bestseller: bool | None = None
    new_arrival: bool | None = None
    low_stock_threshold: NonNegInt | None = None
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = Field(default=None, max_length=400)
    images: list[ProductImageIn] | None = None
    variants: list[VariantIn] | None = None


class StockAdjustment(BaseModel):
    delta: int = Field(ge=-1000, le=1000)
    reason: str = Field(default="adjustment", pattern=r"^(adjustment|restock|damage|correction)$")
    note: str = Field(default="", max_length=400)


class CollectionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: Slug | None = None
    tagline: str = Field(default="", max_length=240)
    description: str = ""
    story: list[str] = []
    hero_image_url: str | None = Field(default=None, max_length=500)
    palette_name: str = Field(default="", max_length=120)
    position: NonNegInt = 0
    featured: bool = False
    published: bool = True
    seo_title: str = Field(default="", max_length=200)
    seo_description: str = Field(default="", max_length=400)


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: Slug | None = None
    tagline: str | None = Field(default=None, max_length=240)
    description: str | None = None
    story: list[str] | None = None
    hero_image_url: str | None = Field(default=None, max_length=500)
    palette_name: str | None = Field(default=None, max_length=120)
    position: NonNegInt | None = None
    featured: bool | None = None
    published: bool | None = None
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = Field(default=None, max_length=400)


# ------------------------------------------------------------------ public outputs


class PublicVariant(ORMModel):
    id: str
    size: VariantSize
    label: str
    stems: str
    description: str
    price_cents: int
    compare_at_price_cents: int | None
    sku: str
    stock_qty: int
    in_stock: bool


class PublicImage(ORMModel):
    id: str
    src: str
    alt: str
    position: int


class PublicProduct(ORMModel):
    id: str
    collection: str
    collection_name: str
    sku: str
    name: str
    slug: str
    short_description: str
    description: str
    price_cents: int
    compare_at_price_cents: int | None
    category_tags: list[str]
    color_palette: list[dict]
    flower_types: list[str]
    dimensions: dict
    vase_included: bool
    care_instructions: list[str]
    status: str
    in_stock: bool
    featured: bool
    bestseller: bool
    new_arrival: bool
    low_stock: bool
    images: list[PublicImage]
    variants: list[PublicVariant]
    seo_title: str
    seo_description: str
    updated_at: str


class PublicCollection(ORMModel):
    id: str
    slug: str
    name: str
    tagline: str
    description: str
    story: list[str]
    hero_image: dict | None
    palette_name: str
    position: int
    featured: bool
    product_count: int
    seo_title: str
    seo_description: str


class PublicCatalogIndex(BaseModel):
    version: str
    collections: list[PublicCollection]
    products: list[PublicProduct]


class SearchResult(BaseModel):
    type: str
    id: str
    slug: str
    title: str
    subtitle: str
    price_cents: int | None = None
