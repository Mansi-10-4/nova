
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, CartItem, Order, AppView } from './types';
import { MOCK_PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { calculateOrderTotal } from './services/storeService';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import CheckoutPage from './components/CheckoutPage';
import DesignStudio from './components/DesignStudio';

// Helper for AI Key detection - provided by environment
// Use interface merging to match the environment's expected types and fix modifier conflicts
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.STOREFRONT);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('nova_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Filter & Sort State
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high'>('default');

  // Persistence for wishlist
  useEffect(() => {
    localStorage.setItem('nova_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(INITIAL_PRODUCTS.map(p => p.category)))];
  }, []);

  const cartTotal = useMemo(() => calculateOrderTotal(cartItems), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const wishlistCount = wishlist.length;

  const filteredAndSortedProducts = useMemo(() => {
    let result = categoryFilter === 'All' 
      ? [...products] 
      : products.filter(p => p.category === categoryFilter);

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [categoryFilter, sortBy, products]);

  const wishlistedProducts = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [wishlist, products]);

  const addToCart = useCallback((product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (cartItems.length === 0) setIsCartOpen(true);
  }, [cartItems.length]);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateProductVisual = useCallback((productId: string, newImage: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, image: newImage } : p));
  }, []);

  const handleStudioClick = async () => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    setView(AppView.DESIGN_STUDIO);
  };

  const handleCheckoutSuccess = (order: Order) => {
    setLastOrder(order);
    setCartItems([]);
    setView(AppView.ORDERS);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex-1 flex gap-8 text-[10px] uppercase tracking-[0.2em] font-medium hidden md:flex">
            <button 
              onClick={() => { setView(AppView.STOREFRONT); setCategoryFilter('All'); }} 
              className={`transition-colors ${view === AppView.STOREFRONT ? 'text-black font-bold' : 'hover:text-gray-400'}`}
            >
              Shop
            </button>
            <button 
              onClick={handleStudioClick}
              className={`transition-colors ${view === AppView.DESIGN_STUDIO ? 'text-black font-bold' : 'hover:text-gray-400'}`}
            >
              Studio
            </button>
            <button className="hover:text-gray-400 transition-colors opacity-30 cursor-not-allowed">About</button>
          </div>
          
          <div 
            className="flex-1 text-center cursor-pointer"
            onClick={() => setView(AppView.STOREFRONT)}
          >
            <h1 className="text-3xl font-light uppercase tracking-[0.4em] text-black">Nova</h1>
          </div>

          <div className="flex-1 flex justify-end items-center gap-6">
            <button 
              className="relative p-2 group"
              onClick={() => setView(AppView.WISHLIST)}
            >
              <i className={`${view === AppView.WISHLIST ? 'fas' : 'far'} fa-heart text-lg transition-transform group-hover:scale-110`}></i>
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button 
              className="relative p-2 group"
              onClick={() => setIsCartOpen(true)}
            >
              <i className="fas fa-shopping-bag text-lg transition-transform group-hover:scale-110"></i>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {view === AppView.STOREFRONT && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 border-b border-gray-100 pb-8">
              <h2 className="text-4xl font-light text-gray-900 leading-tight mb-6 md:mb-0">
                Curated Design <br />
                <span className="text-gray-400">For Your Space</span>
              </h2>
              
              <div className="flex flex-wrap gap-8 items-center text-[10px] uppercase tracking-[0.2em]">
                <div className="flex gap-4 border-r border-gray-100 pr-8">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setCategoryFilter(cat)}
                      className={`hover:text-black transition-colors ${categoryFilter === cat ? 'text-black font-bold underline underline-offset-8' : 'text-gray-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-300">Sort:</span>
                  <button 
                    onClick={() => setSortBy('price-low')}
                    className={`hover:text-black transition-colors ${sortBy === 'price-low' ? 'text-black font-bold' : 'text-gray-400'}`}
                  >
                    Price Low
                  </button>
                  <button 
                    onClick={() => setSortBy('price-high')}
                    className={`hover:text-black transition-colors ${sortBy === 'price-high' ? 'text-black font-bold' : 'text-gray-400'}`}
                  >
                    Price High
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {filteredAndSortedProducts.length > 0 ? (
                filteredAndSortedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={toggleWishlist}
                    onVisualUpdate={updateProductVisual}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-gray-400 italic">
                  No items found in this category.
                </div>
              )}
            </div>
          </div>
        )}

        {view === AppView.DESIGN_STUDIO && (
          <DesignStudio onCancel={() => setView(AppView.STOREFRONT)} />
        )}

        {view === AppView.WISHLIST && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 border-b border-gray-100 pb-8">
              <h2 className="text-4xl font-light text-gray-900 leading-tight">
                Your Wishlist <br />
                <span className="text-gray-400">Saved for Later</span>
              </h2>
              <button 
                onClick={() => setView(AppView.STOREFRONT)}
                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Return to Shop
              </button>
            </div>
            
            {wishlistedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                {wishlistedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart}
                    isWishlisted={true}
                    onToggleWishlist={toggleWishlist}
                    onVisualUpdate={updateProductVisual}
                  />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center">
                <i className="far fa-heart text-4xl text-gray-100 mb-6"></i>
                <p className="text-gray-400 text-sm italic uppercase tracking-widest">Your wishlist is currently empty.</p>
                <button 
                  onClick={() => setView(AppView.STOREFRONT)}
                  className="mt-8 px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all"
                >
                  Explore Collection
                </button>
              </div>
            )}
          </div>
        )}

        {view === AppView.CHECKOUT && (
          <CheckoutPage 
            items={cartItems} 
            total={cartTotal} 
            onCancel={() => setView(AppView.STOREFRONT)}
            onSuccess={handleCheckoutSuccess}
          />
        )}

        {view === AppView.ORDERS && lastOrder && (
          <div className="max-w-2xl mx-auto py-32 px-6 text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-2xl text-green-500"></i>
              </div>
            </div>
            <h2 className="text-3xl font-light uppercase tracking-widest mb-4">Order Confirmed</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Thank you for your purchase, {lastOrder.customer.name}. <br />
              Your order <span className="text-black font-medium">#{lastOrder.id}</span> is being prepared.
            </p>
            <div className="bg-gray-50 p-6 text-left mb-10">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">Items</p>
              {lastOrder.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-medium">
                <span>Total</span>
                <span>${lastOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={() => setView(AppView.STOREFRONT)}
              className="py-4 px-12 bg-black text-white text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-light uppercase tracking-[0.3em]">Nova</h3>
            <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
              Essential objects for the refined dwelling. We prioritize craftsmanship, longevity, and minimalist aesthetics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Contact</h4>
              <ul className="text-xs space-y-2 text-gray-600">
                <li className="hover:text-black transition-colors cursor-pointer">Support</li>
                <li className="hover:text-black transition-colors cursor-pointer">Inquiries</li>
                <li className="hover:text-black transition-colors cursor-pointer">Instagram</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Legal</h4>
              <ul className="text-xs space-y-2 text-gray-600">
                <li className="hover:text-black transition-colors cursor-pointer">Privacy</li>
                <li className="hover:text-black transition-colors cursor-pointer">Terms</li>
                <li className="hover:text-black transition-colors cursor-pointer">Returns</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-300">
          <p>© 2024 Nova Concept Store</p>
          <div className="flex gap-4">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-stripe"></i>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setView(AppView.CHECKOUT);
          window.scrollTo(0, 0);
        }}
      />
    </div>
  );
};

export default App;
