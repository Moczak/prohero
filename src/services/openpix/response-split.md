{
    "charge": {
        "value": 1500,
        "identifier": "8db0a8b89d3c4660ab14242a77565d64",
        "correlationID": "dab84baa-78bd-48c8-8609-5eeee1c9f716",
        "transactionID": "8db0a8b89d3c4660ab14242a77565d64",
        "status": "ACTIVE",
        "additionalInfo": [],
        "fee": 85,
        "discount": 0,
        "valueWithDiscount": 1500,
        "expiresDate": "2025-07-31T15:23:04.306Z",
        "type": "DYNAMIC",
        "paymentLinkID": "40086da9-16dc-4f7e-9eaf-67e2a4afab90",
        "createdAt": "2025-07-30T15:23:04.330Z",
        "updatedAt": "2025-07-30T15:23:04.330Z",
        "ensureSameTaxID": false,
        "brCode": "00020101021226980014br.gov.bcb.pix2576api.woovi-sandbox.com/api/testaccount/qr/v1/8db0a8b89d3c4660ab14242a77565d64520400005303986540515.005802BR5915Pro_Hero_Sports6009Sao_Paulo622905258db0a8b89d3c4660ab14242a763044014",
        "splits": [
            {
                "value": 1275,
                "pixKey": "+5555970783420",
                "splitType": "SPLIT_SUB_ACCOUNT",
                "sourceAccount": "68516d8888341482dd83019a",
                "pixKeyType": "PHONE"
            }
        ],
        "expiresIn": 86400,
        "pixKey": "69362c8a-b74e-4d01-ad99-6195e4b9ed84",
        "paymentLinkUrl": "https://woovi-sandbox.com/pay/40086da9-16dc-4f7e-9eaf-67e2a4afab90",
        "qrCodeImage": "https://api.woovi-sandbox.com/openpix/charge/brcode/image/40086da9-16dc-4f7e-9eaf-67e2a4afab90.png",
        "globalID": "Q2hhcmdlOjY4OGEzOGQ4OTAyNzJjOWQzM2Y4YWVhZA==",
        "paymentMethods": {
            "pix": {
                "method": "PIX_COB",
                "txId": "8db0a8b89d3c4660ab14242a77565d64",
                "value": 1500,
                "status": "ACTIVE",
                "fee": 85,
                "brCode": "00020101021226980014br.gov.bcb.pix2576api.woovi-sandbox.com/api/testaccount/qr/v1/8db0a8b89d3c4660ab14242a77565d64520400005303986540515.005802BR5915Pro_Hero_Sports6009Sao_Paulo622905258db0a8b89d3c4660ab14242a763044014",
                "transactionID": "8db0a8b89d3c4660ab14242a77565d64",
                "identifier": "8db0a8b89d3c4660ab14242a77565d64",
                "qrCodeImage": "https://api.woovi-sandbox.com/openpix/charge/brcode/image/40086da9-16dc-4f7e-9eaf-67e2a4afab90.png"
            }
        }
    },
    "correlationID": "dab84baa-78bd-48c8-8609-5eeee1c9f716",
    "brCode": "00020101021226980014br.gov.bcb.pix2576api.woovi-sandbox.com/api/testaccount/qr/v1/8db0a8b89d3c4660ab14242a77565d64520400005303986540515.005802BR5915Pro_Hero_Sports6009Sao_Paulo622905258db0a8b89d3c4660ab14242a763044014"
}



Exemplo de resposta do webhook de cobrança paga

  "status": "COMPLETED",


Exemplo de resposta do webhook de cobrança criada

   "status": "ACTIVE",


   Exemplo de resposta de webhook de cobrança expirada

    "status": "EXPIRED",