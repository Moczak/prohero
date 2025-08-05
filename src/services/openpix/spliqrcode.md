Como usar a API para criar uma cobrança com split?
info
Para a utilização dessa funcionalidade é necessário possuir a funcionalidade Split

Criar Split via API
Para criar uma cobrança Pix com split, você utiliza o endpoint /api/v1/charge da API.

Você pode acessar aqui a documentação referente a esse endpoint.

Os campos obrigatórios para criar uma cobrança Pix com Split são os seguintes:

value: O valor em centavos da cobrança Pix a ser criado.
correlationID: Um identificador único para a cobrança Pix. CorrelationID
splits: Um array contendo as configurações de split realizado na hora do recebimento
Exemplo
O body da sua requisição será semelhante a este exemplo:

{
  "value": 100,
  "correlationID": "c782e0ac-833d-4a89-9e73-9b60b2b41d3a",
  "splits": [
    { "pixKey": "destinatario@openpix.com.br", "value": 15 },
    { "pixKey": "2a33747b-1715-4f57-8b9d-4cb73c15b19b", "value": 30 }
  ]
}

O valor do campo value dentro do objeto no array de splits, é o valor desejado para a realização do split em centavos. O valor restante continuará na conta de origem da cobrança

Após efetuar a requisição, se tudo ocorreu bem, o status code da requisição será 2xx e no body da resposta, além dos campos normais de cobrança criada, retornaremos os seguintes campos:

{
  "charge": {
    ...Charge Payload
    "splits": [
      { "pixKey": "destinatario@openpix.com.br", "value": 15 },
      { "pixKey": "2a33747b-1715-4f57-8b9d-4cb73c15b19b", "value": 30 }
    ]
  },
  "correlationID": "c782e0ac-833d-4a89-9e73-9b60b2b41d3a",
  "brCode": "00020101021226990014br.gov.bcb.pix2577pix-h.bpp.com.br/23114447/qrs1/v2/011Q0PuArnNb5VzolFm8H9X0A7yQb5Ayi6wZ2Koj6RX52040000530398654043.335802BR5911Krusty_Krab6009Sao_Paulo62290525cac964d74db74c479add4eabc63047932"
}


Exemplos em código
Shell + cURL
JavaScript + Fetch
  curl 'https://api.openpix.com.br/api/v1/charge' -X POST \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "user-agent: node-fetch" \
      --data-binary '{"correlationID":"c782e0ac-833d-4a89-9e73-9b60b2b41d3a","value":100, "splits": [{ "pixKey":



      Correlation ID
Ao lidar com a comunicação entre sistemas distribuídos e serviços em uma aplicação, um aspecto crítico é a identificação e o rastreamento de transações específicas. O Correlation ID (ID de Correlação) desempenha um papel fundamental nesse processo. Vamos explorar a formatação adequada do Correlation ID e fornecer um exemplo prático para ilustrar sua implementação.

O que é um Correlation ID?
Um Correlation ID é um identificador exclusivo associado a uma transação ou solicitação específica que percorre todo o ciclo de vida da operação, desde a entrada até a saída do sistema. Isso é essencial para rastrear e correlacionar eventos e logs relacionados a uma determinada transação, facilitando a depuração e o monitoramento de sistemas complexos.

Formato Recomendado
O formato do Correlation ID deve ser consistente e fácil de gerar, interpretar e comparar. Recomenda-se o uso de uma sequência alfanumérica única, como um UUID (Universally Unique Identifier) ou um GUID (Globally Unique Identifier). Esses formatos geralmente possuem uma estrutura semelhante a:

Exemplos: 123e4567-e89b-12d3-a456-426655440000

Onde cada caractere é uma representação hexadecimal.

Exemplo Prático
Vamos considerar um cenário em que estamos desenvolvendo um serviço de pagamento em um ambiente de microserviços, onde várias solicitações são processadas simultaneamente. Ao receber uma solicitação de pagamento, geramos um Correlation ID único para essa transação. Aqui está um exemplo de implementação em Python:

import uuid

def process_payment(request):
    correlation_id = str(uuid.uuid4())
    # Restante do processamento da solicitação com o uso do Correlation ID

Neste exemplo, a biblioteca UUID do Python é usada para criar um ID de Correlação único sempre que uma solicitação de pagamento é recebida. Esse ID pode ser incluído em registros de log, cabeçalhos de solicitação e respostas, permitindo o rastreamento da transação em todo o sistema.

Conclusão
O Correlation ID desempenha um papel crucial na rastreabilidade e no monitoramento de sistemas distribuídos. Ao adotar um formato consistente, como UUID ou GUID, os desenvolvedores podem garantir a eficácia do rastreamento de transações na plataforma da OpenPix, simplificando a depuração e melhorando a visibilidade operacional. Certifique-se de seguir as melhores práticas ao implementar o Correlation ID em sua aplicação.