/* =====================================================================
   DONNÉES DU CAFÉ MODIFIABLES DEPUIS L'ADMIN (adresse du site + /admin)
   Horaires, fermetures exceptionnelles, note Google, carte et douceurs.
   Ce fichier est réécrit à chaque enregistrement dans l'admin. On peut aussi
   le modifier à la main, à condition de garder un JSON valide après
   « window.DONNEES = » (guillemets doubles, pas de virgule finale).
   Signification des champs : commentaire « MODIFIER LES DONNÉES DU SITE ICI »
   dans index.html.
   ===================================================================== */
window.DONNEES = {
  "hours": [
    {
      "day": "Lundi",
      "closed": true
    },
    {
      "day": "Mardi",
      "closed": true
    },
    {
      "day": "Mercredi",
      "open": "07:30",
      "close": "16:00"
    },
    {
      "day": "Jeudi",
      "open": "07:30",
      "close": "16:00"
    },
    {
      "day": "Vendredi",
      "open": "07:30",
      "close": "16:00"
    },
    {
      "day": "Samedi",
      "open": "09:00",
      "close": "17:00"
    },
    {
      "day": "Dimanche",
      "open": "09:00",
      "close": "17:00"
    }
  ],
  "fermetures": [],
  "fermetureAnnonceJours": 14,
  "google": {
    "ratingValue": 5,
    "reviewCount": 188,
    "checkedOn": "2026-11"
  },
  "menu": [
    {
      "id": "coffee",
      "title": "Specialty coffee",
      "items": [
        {
          "name": "Double espresso",
          "price": 4.9
        },
        {
          "name": "Americano",
          "price": 5.5,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Batch brew",
          "price": 5.5,
          "temps": [
            "chaud",
            "glacé"
          ],
          "fav": true
        },
        {
          "name": "Espresso macchiato",
          "price": 4.9,
          "gap": true
        },
        {
          "name": "Cortado",
          "price": 5.5
        },
        {
          "name": "Cappuccino",
          "price": 6
        },
        {
          "name": "Flat white",
          "price": 6.5,
          "fav": true
        },
        {
          "name": "Mocha",
          "price": 6.9,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Latte",
          "price": 6.9,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Espresso Tonic",
          "price": 7,
          "fav": true,
          "gap": true
        },
        {
          "name": "Espresso Sunrise",
          "price": 7.5
        }
      ]
    },
    {
      "id": "matcha",
      "title": "Matcha lovers",
      "items": [
        {
          "name": "Matcha latte",
          "price": 7,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Matcha Vanille",
          "name_en": "Vanilla matcha",
          "price": 7.2,
          "temps": [
            "chaud",
            "glacé"
          ],
          "fav": true
        },
        {
          "name": "Matcha Lavande",
          "name_en": "Lavender matcha",
          "price": 7.2,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Matcha Rose",
          "name_en": "Rose matcha",
          "price": 7.2,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Matcha Fraise",
          "name_en": "Strawberry matcha",
          "price": 7.5,
          "temps": [
            "chaud",
            "glacé"
          ]
        }
      ]
    },
    {
      "id": "supplements",
      "title": "Suppléments",
      "title_en": "Extras",
      "after": "matcha",
      "items": [
        {
          "name": "Lait alternatif",
          "name_en": "Plant-based milk",
          "price": 0.5,
          "desc": "Avoine, amande, coco, pois, sans lactose",
          "desc_en": "Oat, almond, coconut, pea, lactose-free"
        },
        {
          "name": "Sirop",
          "name_en": "Syrup",
          "price": 0.5
        },
        {
          "name": "Extra shot",
          "price": 1.5
        }
      ]
    },
    {
      "id": "tea",
      "title": "Chocolate & Tea",
      "items": [
        {
          "name": "Chai latte",
          "price": 6.5,
          "temps": [
            "chaud",
            "glacé"
          ],
          "fav": true
        },
        {
          "name": "Chocolat chaud",
          "name_en": "Hot chocolate",
          "price": 6.5,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Hojicha latte",
          "price": 6.5,
          "temps": [
            "chaud",
            "glacé"
          ]
        },
        {
          "name": "Thé chaud",
          "name_en": "Tea",
          "price": 4.5,
          "desc": "Sencha, Jasmin, Earl Grey, Irish Breakfast, Thé fumé, Infusion",
          "desc_en": "Sencha, jasmine, Earl Grey, Irish Breakfast, smoked tea, herbal infusion"
        },
        {
          "name": "Make it dirty",
          "price": 1.5,
          "gap": true
        }
      ]
    }
  ],
  "douceurs": [
    {
      "name": "Cookie de la nonna",
      "name_en": "Nonna's cookie",
      "desc": "Chocolat, noisette. La recette de la grand-mère de Lloyd.",
      "desc_en": "Chocolate and hazelnut. Lloyd's grandmother's recipe.",
      "price": 4.5,
      "confirm": true
    },
    {
      "name": "Cookie matcha",
      "name_en": "Matcha cookie",
      "desc": "Chocolat blanc.",
      "desc_en": "White chocolate.",
      "price": 5,
      "confirm": true
    },
    {
      "name": "Kola-Czech",
      "desc": "Le koláč de la grand-maman tchèque d'Adéla, garni selon la saison.",
      "desc_en": "The koláč of Adéla's Czech grandmother, with a seasonal filling.",
      "price": 7.5,
      "confirm": true
    },
    {
      "name": "Brownie",
      "desc": "Fait maison.",
      "desc_en": "Homemade."
    },
    {
      "name": "Cake citron & romarin",
      "name_en": "Lemon & rosemary cake",
      "desc": "Fait maison.",
      "desc_en": "Homemade."
    },
    {
      "name": "Viennoiseries",
      "name_en": "Croissants & pastries",
      "desc": "Livrées par une boulangerie de Pully.",
      "desc_en": "Delivered by a bakery in Pully."
    }
  ]
};
