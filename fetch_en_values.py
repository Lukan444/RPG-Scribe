import json
import sys

def get_value_from_nested_dict(data_dict, key_string):
    keys = key_string.split('.')
    current_val = data_dict
    for k in keys:
        if isinstance(current_val, dict) and k in current_val:
            current_val = current_val[k]
        else:
            return None  # Key not found or path is invalid
    return current_val if isinstance(current_val, str) else None # Ensure we only return strings

def main():
    target_keys = [
      "forms.tabs.advanced", "forms.tabs.basic", "forms.tabs.details", 
      "forms.tabs.history", "forms.tabs.metadata", "forms.tabs.notes", 
      "forms.tabs.permissions", "forms.tabs.properties", "forms.tabs.relationships", 
      "forms.tabs.secrets", "forms.validation.categoryRequired", 
      "forms.validation.descriptionRequired", "forms.validation.fileTooLarge", 
      "forms.validation.invalidFileType", "forms.validation.nameRequired", 
      "forms.validation.passwordTooShort", "forms.validation.passwordsDoNotMatch", 
      "forms.validation.titleRequired", "forms.validation.typeRequired"
    ]
    
    ui_en_file_path = "public/locales/en/ui.json"
    results = {}

    try:
        with open(ui_en_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content.strip():
                print(f"Error: File is empty {ui_en_file_path}", file=sys.stderr)
                # Output empty JSON if file is unusable, to maintain structure
                print(json.dumps({}))
                return

            ui_en_data = json.loads(content)
            
            for key in target_keys:
                value = get_value_from_nested_dict(ui_en_data, key)
                if value is not None:
                    results[key] = value
                else:
                    results[key] = f"ERROR: Value for key '{key}' not found or not a string."
                    print(f"Warning: Value for key '{key}' not found or not a string in {ui_en_file_path}", file=sys.stderr)
                    
    except FileNotFoundError:
        print(f"Error: File not found {ui_en_file_path}", file=sys.stderr)
        # Output empty JSON if file is unusable
        print(json.dumps({}))
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {ui_en_file_path}", file=sys.stderr)
        # Output empty JSON if file is unusable
        print(json.dumps({}))
        return
    except Exception as e:
        print(f"An unexpected error occurred with {ui_en_file_path}: {e}", file=sys.stderr)
        # Output empty JSON if file is unusable
        print(json.dumps({}))
        return

    # Outputting the results as a JSON string
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
