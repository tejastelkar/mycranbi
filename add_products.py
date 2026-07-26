import os
import subprocess
import json

STORE = "6imbm9-et.myshopify.com"

COLLECTIONS = {
    "SKINCARE": {
        "products": ["mycranbi_saffron_face_gel.jpg", "cranbi_face_cream.jpg", "mycranbi_orange_facewash.jpg"],
    },
    "HAIRCARE": {
        "products": ["mycranbi_amla_and_shikakai_shampoo.jpg", "cranbi_dark_hair_oil.jpg", "mycranbi_cream_hair_serum.jpg"],
    },
    "SANDANYA": {
        "products": ["mycranbi_saffron_sandalwood_incense_sticks.jpg", "mycranbi_saffron_moisturising_cream.jpg"],
    },
    "BRINGARAS": {
        "products": ["cranbi_hair_shampoo.jpg", "mycranbi_green_hair_serum.jpg"],
    },
    "ELADHI": {
        "products": ["mycranbi_lavender_shower_gel.jpg", "cranbi_body_lotion.jpg"],
    },
    "ASHWARAS": {
        "products": ["cranbi_dark_amber_body_oil.jpg", "cranbi_chocolate_body_scrub.jpg"],
    },
    "KUMKUMADI": {
        "products": ["mycranbi_maa_kesar_homegrown_saffron.jpg", "mycranbi_shahi_kesar_chandan_ubtani.jpg"],
    }
}

def get_product_name(filename):
    name = filename.replace('.jpg', '').replace('mycranbi_', '').replace('cranbi_', '').replace('_', ' ')
    return name.title()

def main():
    mutation = """
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
    """
    
    with open("query.graphql", "w") as f:
        f.write(mutation)

    for collection, data in COLLECTIONS.items():
        for img in data["products"]:
            title = get_product_name(img)
            print(f"Creating product: {title} in collection {collection}")
            
            variables = {
                "input": {
                    "title": title,
                    "vendor": "My Cranbi",
                    "productType": collection,
                    "status": "DRAFT",
                    "tags": [collection]
                }
            }
            
            with open("vars.json", "w") as f:
                json.dump(variables, f)
                
            cmd = [
                "shopify", "store", "execute", 
                "--store", STORE, 
                "--query-file", "query.graphql",
                "--variable-file", "vars.json",
                "--json",
                "--allow-mutations"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            try:
                out_json = json.loads(result.stdout)
                errors = out_json.get("data", {}).get("productCreate", {}).get("userErrors", [])
                if errors:
                    print(f"  ❌ Error: {errors}")
                else:
                    print(f"  ✅ Success!")
            except Exception as e:
                print(f"  ❌ Failed to parse output: {result.stdout}")
                print(result.stderr)
                
    if os.path.exists("query.graphql"):
        os.remove("query.graphql")
    if os.path.exists("vars.json"):
        os.remove("vars.json")
        
    print("Finished creating products!")

if __name__ == "__main__":
    main()
