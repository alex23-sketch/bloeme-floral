"""CMS, settings and editorial contracts."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from .common import HexColor, ORMModel


class SocialLink(BaseModel):
    platform: str
    url: str


class StoreHour(BaseModel):
    day: int = Field(ge=0, le=6)
    label: str
    opens: str | None = None
    closes: str | None = None
    closed: bool = False


class BusinessSettingsIn(BaseModel):
    company_name: str = Field(min_length=1, max_length=160)
    wordmark: str = Field(default="", max_length=80)
    tagline: str = Field(default="", max_length=240)
    short_description: str = ""
    logo_url: str | None = None
    favicon_url: str | None = None
    colors: dict[str, str] = {}
    typography: dict[str, str] = {}
    contact: dict[str, str] = {}
    store_hours: list[StoreHour] = []
    social: list[SocialLink] = []
    policies: dict[str, str] = {}
    seo: dict = {}
    tax_rate_bp: int = Field(default=725, ge=0, le=3000)
    locale: str = "en-US"
    payments_mode: str = Field(default="demo", pattern=r"^(disabled|demo|stripe)$")

    @field_validator("colors")
    @classmethod
    def _colors(cls, value: dict[str, str]) -> dict[str, str]:
        for key, v in value.items():
            if not v.startswith("#") or len(v) not in (4, 7):
                raise ValueError(f"Invalid hex colour for {key}")
        return value


class HeroSectionIn(BaseModel):
    id: str = "hero"
    headline: list[str] = Field(min_length=1, max_length=4)
    emphasis: str | None = None
    subheading: str = ""
    body: str | None = None
    primary_cta: dict = {"label": "Shop arrangements", "href": "/shop"}
    secondary_cta: dict | None = None
    media_src: str = ""
    media_alt: str = ""
    badge: dict | None = None


class PageSectionIn(BaseModel):
    id: str
    kind: str
    eyebrow: str | None = None
    heading: str | None = None
    body: str | None = None
    visible: bool = True
    data: dict = {}


class PageUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=160)
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = Field(default=None, max_length=400)
    hero: HeroSectionIn | None = None
    sections: list[PageSectionIn] | None = None


class PublishRequest(BaseModel):
    note: str = Field(default="", max_length=300)


class TestimonialIn(BaseModel):
    quote: str = Field(min_length=10, max_length=2000)
    author: str = Field(min_length=2, max_length=160)
    initials: str = Field(default="", max_length=4)
    location: str = Field(default="", max_length=160)
    occasion: str = Field(default="", max_length=80)
    rating: int = Field(default=5, ge=1, le=5)
    is_sample: bool = False
    featured: bool = False
    published: bool = True


class FaqIn(BaseModel):
    question: str = Field(min_length=4, max_length=300)
    answer: str = Field(min_length=10, max_length=4000)
    category: str = Field(default="ordering", max_length=40)
    position: int = 0
    featured: bool = False
    published: bool = True


class InquiryIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str
    phone: str | None = Field(default=None, max_length=40)
    topic: str = Field(default="general", pattern=r"^(general|wedding|corporate|delivery|sympathy|press)$")
    message: str = Field(min_length=10, max_length=4000)
    preferred_contact: str = Field(default="email", pattern=r"^(email|phone)$")
    website: str = Field(default="", max_length=0)  # honeypot must be empty
    consented: bool = True


class InquiryUpdate(BaseModel):
    status: str = Field(pattern=r"^(new|read|replied|closed)$")
    notes: str = Field(default="", max_length=4000)


class EmailTemplateIn(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=20000)
    enabled: bool = True


class EmailSettingsIn(BaseModel):
    smtp_enabled: bool
    smtp_host: str | None = Field(default=None, max_length=200)
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str | None = Field(default=None, max_length=200)
    smtp_password: str | None = Field(default=None, max_length=500)
    smtp_from: str = Field(default="atelier@example.com", max_length=200)
    smtp_starttls: bool = True


class MediaUploadMeta(BaseModel):
    alt: str = Field(default="", max_length=300)


class MediaOut(ORMModel):
    id: str
    filename: str
    stored_name: str
    content_type: str
    size_bytes: int
    width: int | None
    height: int | None
    alt_text: str
    url: str
