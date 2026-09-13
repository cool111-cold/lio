export default [
    {
        files: ["**/*.js", "**/*.jsx"],
        languageOptions: {
          ecmaVersion: "latest", 
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true
            }
          }
        },
        rules: {
            "no-restricted-imports": ["error", {
            "paths": [{
                "name": "react",
                "importNames": ["p", "button", "input"],
                "message": "Используй компоненты из src/components/ вместо react-native"
            }]
            }]
        }
    }
]