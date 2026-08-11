import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";

export default defineConfig([
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        languageOptions: {
            ecmaVersion: 2018,
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            jsdoc: jsdoc,
        },

    }
]);