import json
import sys

def extract_keys_recursive(data, prefix=""):
    keys = []
    if isinstance(data, dict):
        for key, value in data.items():
            current_key = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                keys.extend(extract_keys_recursive(value, current_key))
            elif isinstance(value, str):
                keys.append(current_key)
    return keys

def get_keys_for_language(lang_code, namespace):
    file_path = f"public/locales/{lang_code}/{namespace}.json"
    keys = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content.strip():
                print(f"Warning: File is empty {file_path}", file=sys.stderr)
                return set() # Return empty set for empty file
            json_data = json.loads(content)
            keys = extract_keys_recursive(json_data)
    except FileNotFoundError:
        print(f"Error: File not found {file_path}", file=sys.stderr)
        return set() # Return empty set if file not found
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}", file=sys.stderr)
        return set() # Return empty set for JSON errors
    except Exception as e:
        print(f"An unexpected error occurred with {file_path}: {e}", file=sys.stderr)
        return set() # Return empty set for other errors
    return set(keys)

def main():
    namespaces = ["common", "entities", "ui"]
    results = {}

    for ns in namespaces:
        en_keys = get_keys_for_language("en", ns)
        pl_keys = get_keys_for_language("pl", ns)
        
        missing_keys = sorted(list(en_keys - pl_keys))
        results[f"missing_pl_{ns}_keys"] = missing_keys

    # Outputting in the specified format
    for key_name, key_list in results.items():
        keys_str = ", ".join([f'"{k}"' for k in key_list])
        print(f"{key_name}: [{keys_str}]")

if __name__ == "__main__":
    main()
