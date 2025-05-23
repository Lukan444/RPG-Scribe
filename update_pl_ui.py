import json
import sys
from collections import OrderedDict

def set_nested_value(data_dict, key_string, value):
    keys = key_string.split('.')
    current_level = data_dict
    for i, k in enumerate(keys):
        if i == len(keys) - 1: # Last key, set the value
            current_level[k] = value
        else:
            if k not in current_level or not isinstance(current_level[k], dict):
                # If key doesn't exist or is not a dict, create/overwrite with an OrderedDict
                current_level[k] = OrderedDict()
            current_level = current_level[k]

def main():
    new_translations = {
      "forms.tabs.advanced": "Zaawansowane",
      "forms.tabs.basic": "Podstawowe informacje",
      "forms.tabs.details": "Szczegóły",
      "forms.tabs.history": "Historia",
      "forms.tabs.metadata": "Metadane",
      "forms.tabs.notes": "Notatki",
      "forms.tabs.permissions": "Uprawnienia",
      "forms.tabs.properties": "Właściwości",
      "forms.tabs.relationships": "Relacje",
      "forms.tabs.secrets": "Sekrety MG",
      "forms.validation.categoryRequired": "Kategoria jest wymagana",
      "forms.validation.descriptionRequired": "Opis jest wymagany",
      "forms.validation.fileTooLarge": "Plik jest za duży (maks. {{maxSize}})",
      "forms.validation.invalidFileType": "Nieprawidłowy typ pliku (dozwolone: {{allowedTypes}})",
      "forms.validation.nameRequired": "Nazwa jest wymagana",
      "forms.validation.passwordTooShort": "Hasło musi mieć co najmniej 8 znaków",
      "forms.validation.passwordsDoNotMatch": "Hasła się nie zgadzają",
      "forms.validation.titleRequired": "Tytuł jest wymagany",
      "forms.validation.typeRequired": "Typ jest wymagany"
    }
    
    target_file_path = "public/locales/pl/ui.json"
    existing_data = OrderedDict() # Use OrderedDict to preserve key order as much as possible

    try:
        with open(target_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if content.strip(): # If file is not empty
                existing_data = json.loads(content, object_pairs_hook=OrderedDict)
            else:
                print(f"Info: File '{target_file_path}' was empty. Starting with new translations.", file=sys.stderr)
    except FileNotFoundError:
        print(f"Info: File '{target_file_path}' not found. A new file will be created with the translations.", file=sys.stderr)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{target_file_path}'. Starting with a fresh structure for new translations.", file=sys.stderr)
        # Reset existing_data to ensure a clean slate if JSON is corrupt
        existing_data = OrderedDict()


    # Merge new translations
    for key, value in new_translations.items():
        set_nested_value(existing_data, key, value)
        
    # Write the updated data back to the file
    try:
        with open(target_file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2) # Using indent=2 for readability
        print(f"Successfully updated '{target_file_path}' with new translations.", file=sys.stdout)
    except IOError as e:
        print(f"Error: Could not write to file '{target_file_path}': {e}", file=sys.stderr)
        sys.exit(1) # Exit with error status if write fails

if __name__ == "__main__":
    main()
