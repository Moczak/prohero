import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse">
      {/* Imagem */}
      <div className="relative h-48 bg-gray-200"></div>
      
      <div className="p-4">
        {/* Título */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        
        {/* Descrição */}
        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
        
        <div className="flex justify-between items-center">
          {/* Preço */}
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          
          {/* Botão */}
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Estoque */}
        <div className="mt-2 h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
