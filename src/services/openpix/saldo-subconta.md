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
  curl 'https://api.woovi-sandbox.com/api/v1/subaccount/openpix_pix_key GET \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -H "user-agent: node-fetch" \
      -H "Authorization": "app_id"

Exemplos de resposta
[
  {
    "subAccount": {
      "name": "118e3b2d-6468-41e1-a3f6-3845a5931fd2",
      "pixKey": "80519935004",
      "balance": 850 (em centavos)
    }
  }
]

openpix_pix_key tabela user