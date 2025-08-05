import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';

interface City {
  name: string;
  state: string;
}

interface CitySelectorProps {
  value: string;
  onChange: (city: string, state: string) => void;
  onStateChange?: (state: string) => void;
  className?: string;
  placeholder?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  onStateChange,
  className = '',
  placeholder = 'Selecione uma cidade'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buscar cidades do IBGE quando o componente montar
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Primeiro buscar os estados
        const statesResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const statesData = await statesResponse.json();
        
        // Mapear siglas dos estados
        const stateMap = statesData.reduce((acc: {[key: string]: string}, state: any) => {
          acc[state.id] = state.sigla;
          return acc;
        }, {});
        
        // Depois buscar todas as cidades
        const citiesResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
        const citiesData = await citiesResponse.json();
        
        // Mapear cidades com seus estados
        const formattedCities = citiesData.map((city: any) => {
          let stateId;
          
          // Lidar com diferentes estruturas de resposta da API
          try {
            // Estrutura antiga
            if (city.microrregiao?.mesorregiao?.UF?.id) {
              stateId = city.microrregiao.mesorregiao.UF.id;
            }
            // Estrutura nova
            else if (city.municipio?.microrregiao?.mesorregiao?.UF?.id) {
              stateId = city.municipio.microrregiao.mesorregiao.UF.id;
            }
            // Estrutura alternativa
            else if (city.regiao?.id) {
              stateId = city.regiao.id;
            }
            // Verificar se há UF diretamente no objeto
            else if (city.UF?.id) {
              stateId = city.UF.id;
            }
            // Verificar se há estado diretamente
            else if (city.estado?.id) {
              stateId = city.estado.id;
            }
            // Verificar a estrutura nova com regiao-imediata
            else if (city['regiao-imediata']?.['regiao-intermediaria']?.UF?.id) {
              stateId = city['regiao-imediata']['regiao-intermediaria'].UF.id;
            }
            // Se nenhuma estrutura conhecida for encontrada
            else {
              // Tentar encontrar o estado pelo código do município
              // Os dois primeiros dígitos do código do município geralmente correspondem ao código do estado
              if (city.id) {
                const cityCode = String(city.id);
                if (cityCode.length >= 2) {
                  const stateCode = cityCode.substring(0, 2);
                  // Encontrar o estado pelo código
                  const stateEntry = Object.entries(stateMap).find(([id]) => {
                    return String(id).substring(0, 2) === stateCode;
                  });
                  if (stateEntry) {
                    stateId = stateEntry[0];
                  }
                }
              }
            }
          } catch (err) {
            console.warn('Erro ao processar cidade:', city, err);
          }
          
          return {
            name: city.nome,
            state: stateId ? stateMap[stateId] : 'UF'
          };
        }).filter((city: { name: string; state: string }) => city.name && city.state); // Filtrar cidades sem nome ou estado
        
        setCities(formattedCities);
        setFilteredCities(formattedCities.slice(0, 100)); // Inicialmente mostrar apenas 100 cidades
      } catch (err) {
        console.error('Erro ao buscar cidades:', err);
        setError('Não foi possível carregar a lista de cidades.');
        // Usar algumas cidades principais como fallback
        const fallbackCities = [
          { name: 'São Paulo', state: 'SP' },
          { name: 'Rio de Janeiro', state: 'RJ' },
          { name: 'Brasília', state: 'DF' },
          { name: 'Salvador', state: 'BA' },
          { name: 'Fortaleza', state: 'CE' },
          { name: 'Belo Horizonte', state: 'MG' },
          { name: 'Manaus', state: 'AM' },
          { name: 'Curitiba', state: 'PR' },
          { name: 'Recife', state: 'PE' },
          { name: 'Porto Alegre', state: 'RS' },
          // Adicionar mais cidades de fallback se necessário
        ];
        setCities(fallbackCities);
        setFilteredCities(fallbackCities);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCities();
  }, []);

  // Atualizar cidades filtradas quando o termo de pesquisa mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities(cities.slice(0, 100)); // Mostrar apenas as primeiras 100 cidades quando não há pesquisa
    } else {
      const filtered = cities.filter(city => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 100)); // Limitar resultados da pesquisa a 100 cidades
    }
  }, [searchTerm, cities]);

  // Fecha o dropdown quando clica fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Atualiza o selectedCity quando o valor muda externamente
  useEffect(() => {
    if (value) {
      const cityParts = value.split(',').map(part => part.trim());
      const cityName = cityParts[0];
      const cityState = cityParts[1] || '';
      
      if (cityName) {
        setSelectedCity({ name: cityName, state: cityState });
      } else {
        setSelectedCity(null);
      }
    } else {
      setSelectedCity(null);
    }
  }, [value]);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    onChange(city.name, city.state);
    if (onStateChange) {
      onStateChange(city.state);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedCity(null);
    onChange('', '');
    if (onStateChange) {
      onStateChange('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCity ? (
          <div className="flex justify-between items-center w-full">
            <span>{selectedCity.name}, {selectedCity.state}</span>
            <button 
              type="button" 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown size={18} className={`ml-2 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar cidade..."
                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 size={24} className="animate-spin text-green-500" />
                <span className="ml-2 text-gray-600">Carregando cidades...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-red-500 text-center">
                {error}
              </div>
            ) : filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <div
                  key={`${city.name}-${city.state}-${index}`}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedCity && selectedCity.name === city.name && selectedCity.state === city.state
                      ? 'bg-green-50 text-green-700'
                      : ''
                  }`}
                  onClick={() => handleSelectCity(city)}
                >
                  <span className="font-medium">{city.name}</span>
                  <span className="text-gray-500 ml-2">{city.state}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">
                Nenhuma cidade encontrada
              </div>
            )}
            
            {!loading && !error && searchTerm.trim() === '' && cities.length > 100 && (
              <div className="px-4 py-2 text-gray-500 text-center text-sm">
                Mostrando as primeiras 100 cidades. Digite para pesquisar mais.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySelector;
