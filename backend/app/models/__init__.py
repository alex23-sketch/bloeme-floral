"""SQLAlchemy models. Importing this package registers all tables on Base.metadata."""

from .auth import AdminSession, AdminUser, AuditEvent, LoginAttempt, ROLES
from .catalog import (
    PRODUCT_STATUSES,
    VARIANT_SIZES,
    Collection,
    InventoryMovement,
    Product,
    ProductImage,
    ProductVariant,
)
from .cms import (
    BusinessSettings,
    CmsPage,
    CmsPageRevision,
    Faq,
    Inquiry,
    MediaAsset,
    Testimonial,
)
from .commerce import (
    ORDER_STATUSES,
    Customer,
    CustomerAddress,
    CustomerSession,
    Discount,
    EmailLog,
    EmailTemplate,
    IdempotencyKey,
    Order,
    OrderItem,
    OrderStatusHistory,
    Payment,
    PaymentEvent,
    Refund,
)
from .delivery import BlackoutDate, DeliverySchedule, DeliveryWindow, DeliveryZone

__all__ = [
    "AdminSession", "AdminUser", "AuditEvent", "LoginAttempt", "ROLES",
    "Collection", "Product", "ProductImage", "ProductVariant", "InventoryMovement",
    "VARIANT_SIZES", "PRODUCT_STATUSES",
    "BusinessSettings", "CmsPage", "CmsPageRevision", "MediaAsset", "Testimonial", "Faq", "Inquiry",
    "Customer", "CustomerAddress", "CustomerSession", "Discount", "IdempotencyKey", "Order", "OrderItem",
    "OrderStatusHistory", "Payment", "PaymentEvent", "Refund", "EmailTemplate", "EmailLog",
    "ORDER_STATUSES", "DeliveryZone", "DeliveryWindow", "DeliverySchedule", "BlackoutDate",
]
