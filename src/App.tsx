import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider } from './state/CartContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { ToastRegion } from './components/ui/ToastRegion';
import { ScrollToTop } from './lib/ScrollToTop';
import { NotFoundState } from './components/ui/States';
import { useReveal } from './lib/useReveal';
import { organizationJsonLd, useSeo } from './lib/useSeo';
import { seoSettings } from './data/brand';
import { AdminShell } from './admin/AdminShell';
const HomePage = lazy(() => import('./pages/Home').then(m => ({default: m.HomePage})));
const ShopPage = lazy(() => import('./pages/Shop').then(m => ({default: m.ShopPage})));
const CollectionsPage = lazy(() => import('./pages/Collections').then(m => ({default: m.CollectionsPage})));
const CollectionDetailPage = lazy(() => import('./pages/Collections').then(m => ({default: m.CollectionDetailPage})));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail').then(m => ({default: m.ProductDetailPage})));
const AboutPage = lazy(() => import('./pages/About').then(m => ({default: m.AboutPage})));
const DeliveryPage = lazy(() => import('./pages/Delivery').then(m => ({default: m.DeliveryPage})));
const ContactPage = lazy(() => import('./pages/Contact').then(m => ({default: m.ContactPage})));
const CheckoutPage = lazy(() => import('./pages/Checkout').then(m => ({default: m.CheckoutPage})));

export function App() {
  const location = useLocation();
  // Re-scan the page for reveal targets after every route change.
  useReveal(location.pathname);
  // Site-wide structured data (the page-level ones replace it where relevant).
  useSeo({ title: seoSettings.defaultTitle, description: seoSettings.defaultDescription, path: location.pathname, jsonLd: organizationJsonLd(seoSettings.organization) });

  return (
    <CartProvider>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          <Suspense fallback={<div className="shell py-24 text-center font-serif text-2xl text-burgundy">Opening the atelier…</div>}>
          <Routes>
            <Route path="/admin/*" element={<AdminShell />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:slug" element={<CollectionDetailPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="*" element={<NotFoundState />} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
        <CartDrawer />
        <ToastRegion />
      </div>
    </CartProvider>
  );
}