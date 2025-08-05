import React, { useState, useEffect } from 'react';
import { Edit, Tag, Trash2, ShoppingCart } from 'lucide-react';
// Usando uma string para o caminho da imagem padrão ao invés de importação
const defaultProductImage = '/images/logo.jpg';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  stock: number;
  status: boolean;
  organization_id: string;
  organization: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface ProductCardProps {
  product: Product;
  isCoach: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isCoach, onEdit, onDelete, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Formatar preço para o formato brasileiro
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };
  
  // Carregar imagem de forma lazy
  useEffect(() => {
    // Usar uma pequena timeout para escalonar as requisições de imagem
    const timer = setTimeout(() => {
      setImageSrc(product.image_url || defaultProductImage);
    }, Math.random() * 300); // Escalonar carregamentos em até 300ms
    
    return () => clearTimeout(timer);
  }, [product.image_url]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {!imageLoaded && !imageSrc && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        )}
        {!product.image_url ? (
          // Exibir mensagem "Sem imagem" quando não há imagem do produto
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-lg font-medium">
            Sem imagem
          </div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Se a imagem falhar, mostrar a mensagem "Sem imagem"
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-100');
              const textElement = document.createElement('div');
              textElement.className = 'text-gray-400 text-lg font-medium';
              textElement.innerText = 'Sem imagem';
              target.parentElement?.appendChild(textElement);
              setImageLoaded(true);
            }}
          />
        ) : null}
        {product.stock <= 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">
            Esgotado
          </div>
        )}
        {product.organization && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-sm truncate flex items-center">
            {product.organization.logo_url ? (
              <div className="w-5 h-5 mr-1 rounded-full overflow-hidden bg-white flex-shrink-0">
                <img 
                  src={product.organization.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : null}
            <span className="truncate">{product.organization.name}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 truncate">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Tag className="text-green-500 mr-1" size={18} />
            <span className="font-bold text-lg">{formatPrice(product.price)}</span>
          </div>
          
          <div className="flex space-x-2">
            {isCoach ? (
              <>
                <button 
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  title="Editar produto"
                  onClick={() => onEdit && onEdit(product)}
                >
                  <Edit size={18} className="text-gray-600" />
                </button>
                <button 
                  className="p-2 bg-gray-100 rounded-full hover:bg-red-100 transition-colors"
                  title="Excluir produto"
                  onClick={() => onDelete && onDelete(product)}
                >
                  <Trash2 size={18} className="text-gray-600 hover:text-red-600" />
                </button>
              </>
            ) : (
              onAddToCart && (
                <button 
                  className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                  title="Adicionar ao carrinho"
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart size={18} className={`${product.stock <= 0 ? 'text-gray-400' : 'text-green-600'}`} />
                </button>
              )
            )}
          </div>
        </div>
        
        {product.stock > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'} em estoque
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
