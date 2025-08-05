Como utilizar a API
Todas as requests e responses da API usam o formato JSON

Para que a requisição seja válida, é necessário enviar o AppID/Token no header Authorization da requisição.

{
  "Authorization": "Q2xpZW50X0lkXzQ5YmRhYTBiLTMxMzItNGNlOS1iZmIzLTU2ODMxYTg1ZWE4NjpDbGllbnRfU2VjcmV0X3lqN1B2bzdPVnVKZ1VPcjZpTGtXOFVOcVVZaFJ3R01vQkgwUUxHcGxQclk9"
}

Exemplo:

curl --request GET \
  --url https://api.openpix.com.br/api/v1/charge \
  --header 'Authorization: Q2xpZW50X0lkXzQ5YmRhYTBiLTMxMzItNGNlOS1iZmIzLTU2ODMxYTg1ZWE4NjpDbGllbnRfU2VjcmV0X3lqN1B2bzdPVnVKZ1VPcjZpTGtXOFVOcVVZaFJ3R01vQkgwUUxHcGxQclk9'


  Campos Comum
Este documento irá ajudá-lo a entender como alguns campos retornados pela API funcionam.

taxID
Os campos de taxID retornam um objeto com duas chaves, type e taxID:

taxID: {
  type: string,
  taxID: string,
}

O campo de type significa o tipo daquele taxID, como por exemplo BR:CNPJ ou BR:CPF, ja o campo de taxID dentro do objeto refere ao valor do documento em si.

value
Os campos de value quando dentro do contexto de fundos monetários, sempre retornam o valor em centavos, por exemplo:

value: 1000;

Isso significa que o valor equivale a R$10,00.

Como funciona?
A OpenPix possui diversas funcionalidades de split que permite que o recebimento de uma cobrança seja dividido entre algumas chaves pix via API, via plataforma e via plugin.js

Tipos de split
Temos 2 tipos de split, e esses dois tipos de split tem casos de uso diferentes, por isso é necessário antes de utilizar o split entender qual tipo de split utilizar.

Split de parceiro e afiliado (SPLIT_PARTNER)
O split de parceiro e afiliado é uma funcionalidade que permite que o recebimento de uma cobrança seja dividido entre a conta do parceiro e a conta do afiliado.

Ou seja, parte do valor da cobrança vai para a conta do parceiro e parte do valor da cobrança vai para a conta do afiliado, sendo possível configurar uma porcentagem ou valor fixo do parceiro diretamente pela plataforma para todas as cobranças.

Quando utilizar (SPLIT_PARTNER)
O sistema de parceiros permite a empresas registrar outras empresas como afiliados e gerenciar alguns aspectos do seu funcionamento através das API's e plataforma OpenPix.

Cada afiliado passa pelo processo de abertura de contas na plataforma.

Cada afiliado possui conta virtual na plataforma registrada no CNPJ de sua empresa independente do parceiro.

Cada afiliado recebe valores de cobranças diretamente via pix em sua conta virtual registrada na plataforma.

O parceiro não recebe diretamente valores em sua conta, somente taxa do parceiro perante o uso da feature de SPLIT_PARTNER.

Esta feature é indicada para quem quer ter uma relação mais definida entre parceiro e afiliados e pretende envolver parceiros no cadastro completo de uma conta virtual

requisitando assim dados de registro de empresa e sócios como qualquer outra abertura de contas, não recebendo diretamente em suas contas valores relativos a pagamento feitos por afiliados, somente valores relativos a taxa de parceiros.

Taxa de Parceiro

Split de sub-contas (SPLIT_SUB_ACCOUNT)
Sub contas são contas virtuais representadas por uma chave pix que podem transacionar virtualmente valores através do sistema de split de pagamentos. Esses valores podem ser convertidos em transações reais através do saque para a chave pix registrada para a subconta.

Ou seja, parte do valor da cobrança vai para uma chave pix e parte do valor da cobrança vai para outra chave pix, sendo possível definir na hora da criação da cobrança o valor que vai para cada chave pix.

Split SubAccount

Quando utilizar (SPLIT_SUB_ACCOUNT)
O sistema de subcontas permite registrar transações de split em uma subconta a partir de cobranças feitas para uma conta principal.

Subcontas não são contas bancárias reais e somente transacionam valores virtuais permitindo assim a eliminação de etapas burocráticas na abertura da mesma.

Cada subconta só precisa de uma chave pix única para ser aberta, de qualquer tipo, CPF, CNPJ, email, telefone, etc.

Uma empresa pode ter qualquer número de subcontas.

Uma empresa pode a qualquer momento realizar um saque para a chave pix registrada na subconta, tanto via integração de API ou diretamente pela plataforma.

O uso da subconta permite a criação de fluxos menos burocráticos e mais livres dentro da plataforma, os valores sacados só serão debitados da conta principal no momento do saque garantindo total controle ao administrador da empresa dona destas subcontas.

Como calcular divisão split pagamento com porcentagem
info
Para a utilização dessa funcionalidade é necessário possuir uma conta na OpenPix e a funcionalidade Split, entre em contato com nosso time de suporte para habilitar essa funcionalidade

info
Você também precisará de um appID também para fazer requisições na nossa API, caso não tenha recomenda-mos fortemente você consultar nossa documenta de começando uma integração


-----------------------------

Como criar uma subconta
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

Atualmente a criação de uma subconta é feita apenas via API. Para isso você pode está utilizando o endpoint /api/v1/subaccount da API.

Você pode acessar aqui a documentação referente a esse endpoint.

Os campos obrigatórios para criar uma subconta são os seguintes:

name: O nome de identificação da subconta.
pixKey: A chave PIX da subconta (Não precisa ser necessariamente atrelada a uma conta da OpenPix).
A chave PIX será checada antes de criar a subconta. Caso a chave não exista, a subconta não será criada e uma mensagem de erro será retornada.

Exemplos em código
Shell + cURL
JavaScript + Fetch
  curl 'https://api.openpix.com.br/api/v1/subaccount' -X POST \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "Authorization": "app_id"
      --data-binary '{"name":"subaccount#1","pixKey": "destinatario@openpix.com.br"}'


--------------------------------------

Como usar a API para criar uma cobrança com split para Subconta?
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

Para criar uma cobrança Pix com split para sub conta, você utiliza o endpoint /api/v1/charge da API.

Você pode acessar aqui a documentação referente a esse endpoint.

Os campos obrigatórios para criar uma cobrança Pix com Split são os seguintes:

value: O valor em centavos da cobrança Pix a ser criado.
correlationID: Um identificador único para a cobrança Pix. CorrelationID
splits: Um array contendo as configurações de split realizado na hora do recebimento.
Exemplo
O body da sua requisição será semelhante a este exemplo:

{
  "value": 100,
  "correlationID": "c782e0ac-833d-4a89-9e73-9b60b2b41d3a",
  "splits": [
    {
      "pixKey": "destinatario@openpix.com.br",
      "value": 15,
      "splitType": "SPLIT_SUB_ACCOUNT"
    }
  ]
}

O valor do campo value dentro do objeto no array de splits, é o valor desejado para a realização do split em centavos. O valor do split não será debitado da conta de origem pois transações de split para sub contas são transações virtuais, somente será debitado da conta de origem o valor integral do saldo da sub conta no momento do saque da mesma.

Após efetuar a requisição, se tudo ocorreu bem, o status code da requisição será 2xx e no body da resposta, além dos campos normais de cobrança criada, retornaremos os seguintes campos:

{
  "charge": {
    ...Charge Payload
    "splits": [
      { "pixKey": "destinatario@openpix.com.br", "value": 15, splitType: "SPLIT_SUB_ACCOUNT" },
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
      -H "Authorization": "app_id"
      --data-binary '{"correlationID":"c782e0ac-833d-4a89-9e73-9b60b2b41d3a","value":100, "splits": [{ "pixKey"


Como acessar saldo e detalhes de uma Subconta via API?
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

Para acessar o saldo e detalhes de uma subconta, você utiliza o endpoint /api/v1/subaccount/{ID} da API.

Você pode acessar aqui a documentação referente a esse endpoint.

A chave pix registrada na subconta deve ser passada na url da requisição como parâmetro.

Após efetuar a requisição, se tudo ocorreu bem, o status code da requisição será 2xx e no body da resposta, uma objeto contendo os campos de balance, name, pixKey da subconta requisitada.

Exemplos em código
Shell + cURL
JavaScript + Fetch
  curl 'https://api.openpix.com.br/api/v1/subaccount/chave-pix-subconta -X GET \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "user-agent: node-fetch" \
      -H "Authorization": "app_id"

Exemplos de resposta
{
  "SubAccount": {
    "name": "test-sub-account",
    "pixKey": "c4249323-b4ca-43f2-8139-8232aab09b93",
    "balance": 100
  }
}

Como usar a API listar as Subcontas de uma empresa via API?
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

Para listar subcontas de uma empersa, você utiliza o endpoint /api/v1/subaccount da API.

Você pode acessar aqui a documentação referente a esse endpoint.

A empresa é identificada a partir do app_id usado no cabeçalho Authorization.

Após efetuar a requisição, se tudo ocorreu bem, o status code da requisição será 2xx e no body da resposta, uma lista das subcontas pertencentes a empresa além de detalhes de paginação:

Exemplos em código
Shell + cURL
JavaScript + Fetch
  curl 'https://api.openpix.com.br/api/v1/subaccount' -X GET \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "user-agent: node-fetch" \
      -H "Authorization": "app_id"

Exemplos de resposta
{
  "subAccounts": {
    "subaccount": {
      "name": "test-sub-account",
      "pixKey": "c4249323-b4ca-43f2-8139-8232aab09b93",
    }
  },
  "pageInfo": {
    "skip": 0,
    "limit": 10,
    "totalCount": 20,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}


Como fazer uma transferência entre subcontas?
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

Para realizar uma transferência entre subcontas da mesma empresa, você utiliza o endpoint /api/v1/subaccount/transfer da API.

Você pode acessar aqui a documentação referente a esse endpoint.

Os campos obrigatórios para fazer uma transferência entre subcontas são os seguintes:

value: O valor em centavos da cobrança Pix a ser criado.
fromPixKey: A chave Pix da subconta que irá realizar a transferência.
fromPixKeyType: O tipo da chave Pix da subconta que irá realizar a transferência.
toPixKey: A chave Pix da subconta que receberá a transferência.
toPixKeyType: O tipo da chave Pix da subconta que receberá a transferência.
Existe também a possibilidade de adicionar os seguintes campos (opcionais):

correlationID: Um identificador único para cada transferência. CorrelationID
info
Lembrando que o correlationID é um campo opcional, caso você não o envie, fazermos a geração internamente.

Exemplo
O body da sua requisição será semelhante a este exemplo:

{
  value: 65,
  fromPixKey: 'pixKey@pixKey.com',
  fromPixKeyType: 'EMAIL',
  toPixKey: 'mediator@pixKey.com',
  toPixKeyType: 'EMAIL',
}

Exemplos em código
Shell + cURL
JavaScript + Fetch
  curl 'https://api.openpix.com.br/api/v1/subaccount/transfer' -X POST \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "user-agent: node-fetch" \
      --data-binary '{
        "value": 65,
        "fromPixKey": "pixKey@pixKey.com",
        "fromPixKeyType": "EMAIL",
        "toPixKey": "mediator@pixKey.com",
        "toPixKeyType": "EMAIL"
      }'


Como reconhecer uma subconta de uma cobrança paga?
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

A forma mais recomendada para reconhecer uma subconta de uma cobrança após o pagamento em tempo real é utilizando o nosso Webhook de cobrança paga. Nele é retornado todas as informações da cobrança, inclusive a subconta, caso a cobrança esteja atrelada à uma. Segue o exemplo do payload retornado pelo Webhook de uma cobrança atrelada à uma subconta:

{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "customer": {
      "name": "CONTA DE PAGAMENTO DE PIX",
      "taxID": {
        "taxID": "74866698000169",
        "type": "BR:CNPJ"
      },
      "correlationID": "<correlationID>"
    },
    "value": 1600,
    "comment": "from-script-api",
    "identifier": "a74f60ba44e54c67b2cb74243971a674",
    "correlationID": "<correlationID>",
    "paymentLinkID": "<paymentLinkID>",
    "transactionID": "a74f60ba44e54c67b2cb74243971a674",
    "status": "COMPLETED",
    "additionalInfo": [],
    "discount": 0,
    "valueWithDiscount": 1600,
    "expiresDate": "2024-03-16T18:19:44.426Z",
    "type": "DYNAMIC",
    "createdAt": "2024-03-15T18:19:50.296Z",
    "updatedAt": "2024-03-15T18:22:04.045Z",
    "paidAt": "2024-03-15T18:19:50.154Z",
    "payer": {
      "name": "CONTA DE PAGAMENTO DE PIX",
      "taxID": {
        "taxID": "74866698000169",
        "type": "BR:CNPJ"
      },
      "correlationID": "<correlationID>"
    },
    "brCode": "<brCode>",
    "subaccount": {
      "name": "mediatorpix@key.com",
      "pixKey": "mediatorpix@key.com"
    },
    "expiresIn": 86400,
    "pixKey": "<pixKey>",
    "paymentLinkUrl": "<paymentLinkUrl>",
    "qrCodeImage": "<qrCodeImage>",
    "globalID": "<globalID>"
  },
  "pix": {
    "customer": {
      "name": "CONTA DE PAGAMENTO DE PIX",
      "taxID": {
        "taxID": "74866698000169",
        "type": "BR:CNPJ"
      },
      "correlationID": "<correlationID>"
    },
    "payer": {
      "name": "CONTA DE PAGAMENTO DE PIX",
      "taxID": {
        "taxID": "74866698000169",
        "type": "BR:CNPJ"
      },
      "correlationID": "<correlationID>"
    },
    "charge": {
      "customer": {
        "name": "CONTA DE PAGAMENTO DE PIX",
        "taxID": {
          "taxID": "74866698000169",
          "type": "BR:CNPJ"
        },
        "correlationID": "<correlationID>"
      },
      "value": 1600,
      "comment": "from-script-api",
      "identifier": "a74f60ba44e54c67b2cb74243971a674",
      "correlationID": "<correlationID>",
      "paymentLinkID": "<paymentLinkID>",
      "transactionID": "a74f60ba44e54c67b2cb74243971a674",
      "status": "COMPLETED",
      "additionalInfo": [],
      "fee": 50,
      "discount": 0,
      "valueWithDiscount": 1600,
      "expiresDate": "2024-03-16T18:19:44.426Z",
      "type": "DYNAMIC",
      "createdAt": "2024-03-15T18:19:50.296Z",
      "updatedAt": "2024-03-15T18:22:04.045Z",
      "paidAt": "2024-03-15T18:19:50.154Z",
      "payer": {
        "name": "CONTA DE PAGAMENTO DE PIX",
        "taxID": {
          "taxID": "74866698000169",
          "type": "BR:CNPJ"
        },
        "correlationID": "<correlationID>"
      },
      "brCode": "<brCode>",
      "subaccount": {
        "name": "mediatorpix@key.com",
        "pixKey": "mediatorpix@key.com"
      },
      "expiresIn": 86400,
      "pixKey": "<pixKey>",
      "paymentLinkUrl": "<paymentLinkUrl>",
      "qrCodeImage": "<qrCodeImage>",
      "globalID": "<globalID>"
    },
    "value": 1600,
    "time": "2024-03-15T18:19:50.154Z",
    "endToEndId": "E231144472024031518218Xb59c4mq1x",
    "transactionID": "a74f60ba44e54c67b2cb74243971a674",
    "type": "PAYMENT",
    "createdAt": "2024-03-15T18:22:03.843Z",
    "globalID": "<globalID>"
  },
  "company": {
    "id": "<companyID>",
    "name": "master",
    "taxID": "<taxID>"
  },
  "account": {
    "clientId": "<clientId>"
  }
}


Casos de uso de split de sub-contas
info
Para a utilização dessa funcionalidade é necessário possuir a funcionalidade Split

Casos de uso de split de sub-contas
O split de sub-contas é uma funcionalidade que permite que o recebimento de uma cobrança seja dividido entre chaves pix. Entenda mais aqui: O que é um split

info
Entenda melhor sobre qual tipo de split utilizar aqui

Caso de uso 1 - Dividir o valor entre os sócios da empresa
Imagine que você tem uma empresa com 3 sócios e deseja dividir o valor de uma cobrança entre eles. Para isso, você pode criar uma cobrança pix com split de sub-contas, onde o valor da cobrança será dividido entre as chaves pix dos sócios, isso facilita a divisão do valor entre os sócios, economizando tempo e evitando erros.

Como dividir o valor entre os sócios da empresa via API
Para dividir o valor entre os sócios da empresa via API, você deve utilizar o endpoint /api/v1/charge da API.

Para a API é necessário enviar o campo splits no body da requisição, que é um array contendo as configurações de split realizado na hora do recebimento com os valores fixos já definidos, ou seja, seu sistema deve definir o valor que vai para cada chave pix e informar na api da OpenPix.

Caso de uso 2 - Gorjeta
Administradores de empresas do ramo de alimentação como restaurantes e bares podem cadastrar chave pix de garçons e atendentes como uma subconta e configurar valores por cobrança a serem registrados como crédito, podendo então ser sacado a qualquer momento por integração via API ou diretamente pela plataforma.

Caso de uso 3 - Comissão para vendedores
Gestores de comércio podem cadastrar vendedores através da chave pix do vendendor como subconta e assim gerenciar cada cobrança, para creditar valroes de comissão automaticamente podendo fazer os saque a qualquer momento por integração via API ou diretamente pela plataforma.

MarketPlace
Gestores de MarketPlace digitais podem criar cobranças com chave pix cadastrada como subconta, registrando assim em cada cobrança paga o valor da comissão por venda relacionada a vendas dentro de seu marketplace. Esta integração permite a gestores um gerenciamento de valores automático e facilidade na gestão e no pagamento de valores ao longo do tempo. O saque pode ser feito por integração via api ou diretamente pela plataforma.


--------------------------------------

Como lidar com o calculo de split
Neste exemplo estou considerando um cenário onde quero criar uma cobrança de R$ 100,00 e enviar 20% do valor dessa cobrança para o recebedor (sub-conta) desse split, que no caso seria R$ 20,00

// função para lidar com calculo do valor split em porcentagem
const calculateSplitPercentage = (value: number, percentage: number) => {
  return value * (percentage / 100)
}

const createCharge = () => {
  // 100 reais em centavos
  const totalValueCharge = 10000
  // a porcentagem que será paga para o recebedor (sub-conta)
  // essa porcentagem pode ser ajustada baseado nas suas necessidades e regras de negócio
  const splitPercentageRecipient = 20
  // calculando o valor que o recebedor deverá receber
  const valueSplitRecipient = calculateSplitPercentage(totalValueCharge, splitPercentageRecipient)

  // agora estou chamando uma abstração de uma chamada para API da OpenPix
  // nessa requisição o valor total da cobrança e o valor split do recebedor (sub-conta) e as demais informações
  fetchOpenPixApi('/api/v1/charge', {
    method: 'POST',
    body: {
      "value": totalValueCharge,
      "correlationID": "c782e0ac-833d-4a89-9e73-9b60b2b41d3a",
      "splits": [
        {
          "pixKey": "destinatario1@openpix.com.br",
          "value": valueSplitRecipient
        }
      ]
    },
    headers: {
      Authorization: 'MEU_APP_ID'
    }
  })
}

Tipos de cobrança
Dentro de cobranças, temos dois tipos: Cobranças e Cobranças com vencimento.

O tipo da cobrança determina como ela vai se comportar ao chegar na data de expiração.

Em nossas APIs, utilizados a propriedade type para representar o tipo de uma cobrança.

Cobrança (cob)
Uma cobrança (cob), ao passar da data de expiração não pode mais ser paga; Nosso sistema vai alterar o estado da cobrança para EXPIRED.

Cobranças em nossas APIs são representadas pelo tipo DYNAMIC.

Para mais informações a respeito de como você pode criar uma cobrança usando nossa API, veja Como usar a API para criar uma cobrança (cob)?

Cobrança com vencimento (cobv)
Uma cobrança com vencimento (cobv), ao passar de sua data de expiração, ainda pode ser paga; Com a diferença de que haverá incidência de multa e juros.

Cobranças com vencimento em nossas APIs são representadas pelo tipo OVERDUE.


Como usar a API para criar um cliente?
Para criar um cliente, você utiliza o endpoint /api/v1/customer da API.

Você pode acessar aqui a documentação referente a esse endpoint.

Os campos obrigatórios para criar um cliente são os seguintes:

name: Nome do cliente.
E além do nome é necessário enviar um desses três dados:

taxID: CPF ou CNPJ do cliente.
email: Email do cliente.
phone: Celular do cliente. (començando com 55 e código de área)
Exemplo
O body da sua requisição será semelhante a um destes exemplos:

Exemplo com taxID
{
  "name": "Dan",
  "taxID": "360.***.***-72"
}

Exemplo com email
{
  "name": "Dan",
  "email": "dan@gmail.com"
}

Exemplo com telefone
{
  "name": "Dan",
  "phone": "554899..."
}

Após efetuar a requisição, se tudo ocorreu bem, o status code da requisição será 2xx e no body da resposta, retornaremos o cliente criado.

Retornarmeros a seguinte resposta de exemplo:

{
  "customer": {
    "name": "NOME DO CLIENTE",
    "taxID": { "taxID": "360...", "type": "BR:CPF" },
    "correlationID": "d1d46bbd-b010-4beb-b59e-cecf824efb43"
  }
}