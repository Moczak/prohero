import React from 'react';
import { X, Trash2, ShoppingCart } from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  organization_name?: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  onCheckout: () => void;
  isProcessing?: boolean;
}



const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cartItems,
  onCheckout,
  isProcessing = false,
  updateQuantity,
  removeItem
}) => {
  // Calcular o total do carrinho
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <ShoppingCart className="mr-2 text-green-600" size={24} />
            <h2 className="text-xl font-semibold">Carrinho</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-grow overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h3>
              <p className="text-gray-500">Adicione produtos ao carrinho para vê-los aqui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex border rounded-lg p-3 relative">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ShoppingCart size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-3 flex-grow">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    {item.organization_name && (
                      <p className="text-xs text-gray-500 mb-1">{item.organization_name}</p>
                    )}
                    <p className="font-semibold text-green-600">{formatPrice(item.price)}</p>
                    
                    <div className="flex items-center mt-2">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center border rounded-l-md"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t border-b">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded-r-md"
                      >
                        +
                      </button>
                      
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500"
                        title="Remover item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Total:</span>
            <span className="font-bold text-lg">{formatPrice(cartTotal)}</span>
          </div>
          <button 
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-md font-medium flex items-center justify-center gap-2"
            onClick={onCheckout}
            disabled={isProcessing || cartItems.length === 0}
          >
            {isProcessing && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isProcessing ? 'Processando...' : 'Finalizar Compra'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
