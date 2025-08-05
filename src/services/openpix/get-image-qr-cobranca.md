Get one charge


id
required
string
Example: fe7834b4060c488a9b0f89811be5f5cf
charge ID or correlation ID. You will need URI encoding if your correlation ID has characters outside the ASCII set or reserved characters (%, #, /).


https://api.woovi-sandbox.com/api/v1/charge/{id}




RESPOSNE

{
  "charge": {
    "status": "ACTIVE",
    "customer": {
      "name": "Dan",
      "email": "email0@example.com",
      "phone": "5511999999999",
      "taxID": {
        "taxID": "31324227036",
        "type": "BR:CPF"
      }
    },
    "value": 100,
    "comment": "good",
    "correlationID": "9134e286-6f71-427a-bf00-241681624586",
    "paymentLinkID": "7777-6f71-427a-bf00-241681624586",
    "paymentLinkUrl": "https://woovi.com/pay/9134e286-6f71-427a-bf00-241681624586",
    "globalID": "Q2hhcmdlOjcxOTFmMWIwMjA0NmJmNWY1M2RjZmEwYg==",
    "qrCodeImage": "https://api.woovi.com/openpix/charge/brcode/image/9134e286-6f71-427a-bf00-241681624586.png",
    "brCode": "000201010212261060014br.gov.bcb.pix2584https://api.woovi.com/openpix/testing?transactionID=867ba5173c734202ac659721306b38c952040000530398654040.015802BR5909LOCALHOST6009Sao Paulo62360532867ba5173c734202ac659721306b38c963044BCA",
    "additionalInfo": [
      {
        "key": "Product",
        "value": "Pencil"
      },
      {
        "key": "Invoice",
        "value": "18476"
      },
      {
        "key": "Order",
        "value": "302"
      }
    ],
    "expiresIn": 2592000,
    "expiresDate": "2021-04-01T17:28:51.882Z",
    "createdAt": "2021-03-02T17:28:51.882Z",
    "updatedAt": "2021-03-02T17:28:51.882Z",
    "paymentMethods": {
      "pix": {
        "method": "PIX_COB",
        "transactionID": "9134e286-6f71-427a-bf00-241681624586",
        "identifier": "9134e286-6f71-427a-bf00-241681624586",
        "additionalInfo": [],
        "fee": 50,
        "value": 200,
        "status": "ACTIVE",
        "txId": "9134e286-6f71-427a-bf00-241681624586",
        "brCode": "000201010212261060014br.gov.bcb.pix2584https://api.woovi.com/openpix/testing?transactionID=867ba5173c734202ac659721306b38c952040000530398654040.015802BR5909LOCALHOST6009Sao Paulo62360532867ba5173c734202ac659721306b38c963044BCA",
        "qrCodeImage": "https://api.woovi.com/openpix/charge/brcode/image/9134e286-6f71-427a-bf00-241681624586.png"
      }
    }
  }
}