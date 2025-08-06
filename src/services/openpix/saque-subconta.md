Como realizar o saque de uma Subconta via API?
info
Para a utilização desta funcionalidade é necessário possuir a funcionalidade Subconta

Para realizar o saque integral de uma subconta, você utiliza o endpoint /api/v1/subaccount/{ID}/withdraw da API.

Você pode acessar aqui a documentação referente a esse endpoint.

A chave pix registrada na subconta deve ser passada na url da requisição como parâmetro.

Após efetuar a requisição, se tudo ocorreu bem, o status code da requisição será 2xx e no body da resposta, um objeto com os detalhes da transação efetuada para a chave pix registrada na subconta.

Exemplos em código
Shell + cURL
JavaScript + Fetch
  curl 'https://api.openpix.com.br/api/v1/subaccount/chave-pix-subconta/withdraw -X POST \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "user-agent: node-fetch" \
      -H "Authorization": "app_id"

      {
  "value": 1000
      }

Exemplos de resposta
{
  "transaction": {
    "status": "CREATED",
    "value": 100,
    "correlationID": "TESTING1323",
    "destinationAlias": "pixKeyTest@test.com",
    "comment": "testing-transaction"
  }
}