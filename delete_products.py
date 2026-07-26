import os
import subprocess
import json
import time

STORE = "6imbm9-et.myshopify.com"

def get_products():
    query = """
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
    """
    with open("query_get.graphql", "w") as f:
        f.write(query)
        
    cmd = [
        "shopify", "store", "execute", 
        "--store", STORE, 
        "--query-file", "query_get.graphql",
        "--json"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists("query_get.graphql"):
        os.remove("query_get.graphql")
        
    try:
        # Shopify CLI might output non-JSON text before the actual JSON block
        # Find the first '{' and parse from there
        stdout = result.stdout
        json_start = stdout.find('{')
        if json_start != -1:
            json_str = stdout[json_start:]
            data = json.loads(json_str)
            if "data" in data:
                data = data["data"]
            edges = data.get("products", {}).get("edges", [])
            return [edge["node"] for edge in edges]
        else:
            print("No JSON found in output:", stdout)
            return []
    except Exception as e:
        print("Error fetching products:", result.stderr)
        return []

def delete_product(product_id):
    mutation = """
    mutation productDelete($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
    """
    variables = {
        "input": {
            "id": product_id
        }
    }
    
    with open("query_del.graphql", "w") as f:
        f.write(mutation)
    with open("vars_del.json", "w") as f:
        json.dump(variables, f)
        
    cmd = [
        "shopify", "store", "execute", 
        "--store", STORE, 
        "--query-file", "query_del.graphql",
        "--variable-file", "vars_del.json",
        "--json",
        "--allow-mutations"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists("query_del.graphql"):
        os.remove("query_del.graphql")
    if os.path.exists("vars_del.json"):
        os.remove("vars_del.json")
        
    try:
        stdout = result.stdout
        json_start = stdout.find('{')
        if json_start != -1:
            json_str = stdout[json_start:]
            out = json.loads(json_str)
            if "data" in out:
                out = out["data"]
            errors = out.get("productDelete", {}).get("userErrors", [])
            return errors
        else:
            return [{"message": "No JSON found in output"}]
    except Exception:
        return [{"message": "Failed to parse JSON"}]

def main():
    products = get_products()
    print(f"Found {len(products)} products to delete.")
    
    for prod in products:
        pid = prod["id"]
        title = prod["title"]
        print(f"Deleting {title} ({pid})...")
        errors = delete_product(pid)
        if errors:
            print(f"  ❌ Error: {errors}")
        else:
            print(f"  ✅ Deleted!")
            
    print("Done deleting products.")

if __name__ == "__main__":
    main()
