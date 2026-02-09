
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getProductInsight, getSmartRecommendations, generateImage } from '../services/geminiService';
import { MOCK_PRODUCTS } from '../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onVisualUpdate?: (productId: string, newImage: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  isWishlisted, 
  onToggleWishlist,
  onVisualUpdate
}) => {
  const [insight, setInsight] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);

  useEffect(() => {
    if (isHovered && !insight) {
      getProductInsight(product).then(setInsight);
    }
  }, [isHovered, insight, product]);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    
    if (recommendations.length === 0 && !isLoadingRecs) {
      setIsLoadingRecs(true);
      const recommendedNames = await getSmartRecommendations(product, MOCK_PRODUCTS);
      const recommendedProducts = MOCK_PRODUCTS.filter(p => 
        recommendedNames.some(name => p.name.toLowerCase().includes(name.toLowerCase())) && p.id !== product.id
      ).slice(0, 2);
      setRecommendations(recommendedProducts);
      setIsLoadingRecs(false);
    }
  };

  const handleVisualise = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGeneratingVisual) return;
    setIsGeneratingVisual(true);
    try {
      const prompt = `A studio product photograph of "${product.name}", described as ${product.description}. Professional lighting, 8k resolution, minimalist aesthetic, neutral background.`;
      const newImage = await generateImage(prompt, '1K');
      onVisualUpdate?.(product.id, newImage);
    } catch (err) {
      console.error(err);
      alert("AI visual generation requires a billing-enabled API key.");
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  return (
    <div 
      className="group relative flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative flex-shrink-0">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 ${isGeneratingVisual ? 'opacity-30' : 'opacity-100'}`}
        />
        
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistClick}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95 group-hover:opacity-100 opacity-0 md:opacity-0"
          style={{ opacity: isWishlisted ? 1 : undefined }}
        >
          <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart text-xs ${isWishlisted ? 'text-black' : 'text-gray-400'}`}></i>
        </button>

        {/* Visualise Button */}
        <button 
          onClick={handleVisualise}
          className="absolute top-4 left-4 z-20 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95 group-hover:opacity-100 opacity-0 md:opacity-0"
        >
          <i className={`fas ${isGeneratingVisual ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-xs text-black`}></i>
        </button>

        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
          <button 
            onClick={handleAdd}
            className={`w-full py-3 text-xs uppercase tracking-widest font-medium shadow-lg transition-all active:scale-[0.98] ${
              isAdded ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            {isAdded ? 'Added to Bag' : 'Add to Bag'}
          </button>
        </div>
        {product.price > 300 && (
          <div className="absolute top-4 left-4 hidden group-hover:hidden">
            <span className="bg-black text-white text-[10px] uppercase tracking-tighter px-2 py-1">Premium Edition</span>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors">{product.name}</h3>
          <span className="text-sm font-light text-gray-500">${product.price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{product.category}</p>
        
        {insight && (
          <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <p className="text-[11px] italic text-gray-600 leading-relaxed">
              <span className="font-bold mr-1 text-black">AI Insight:</span> {insight}
            </p>
          </div>
        )}

        {/* AI Recommendations Section */}
        {isAdded && (recommendations.length > 0 || isLoadingRecs) && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-500">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Pairs well with</h4>
            {isLoadingRecs ? (
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-50 animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-50 animate-pulse"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommendations.map(rec => (
                  <button 
                    key={rec.id}
                    onClick={() => onAddToCart(rec)}
                    className="flex items-center gap-3 group/rec text-left hover:bg-gray-50 p-1 -ml-1 transition-colors rounded"
                  >
                    <img src={rec.image} className="w-10 h-10 object-cover grayscale group-hover/rec:grayscale-0 transition-all" alt={rec.name} />
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-gray-800 leading-tight">{rec.name}</p>
                      <p className="text-[9px] text-gray-400">${rec.price.toFixed(2)}</p>
                    </div>
                    <i className="fas fa-plus text-[8px] text-gray-300 group-hover/rec:text-black transition-colors pr-1"></i>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
