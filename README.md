# 📄 Projet Sheet

Un moteur minimaliste de formules de tableur écrit en JavaScript.  
Il permet de parser et d'exécuter des formules similaires à celles qu'on trouve dans Excel ou Google Sheets.

---

## ✨ Fonctionnalités

- 📦 **Analyseur lexical et syntaxique** : transforme les formules en arbre syntaxique (AST).
- 🧠 **Évaluation d'expressions** : prend en charge les opérations, fonctions, références de cellules, etc.
- 📚 **Fonctions intégrées** :
  - `SUM(...)`, `MAX(...)`, `MIN(...)`, `POW(...)`, `SQRT(...)`, `JOIN(...)`, `IF(...)`, `VLOOKUP(...)`, etc.
- 🔁 **Support des plages et des références** : lecture des valeurs de cellules ou de plages.
- 📡 **Exécution réactive** : met à jour automatiquement les résultats quand les cellules changent.
- 🔧 **Contexte personnalisable** : possibilité d’ajouter facilement ses propres fonctions.

---

## 🚀 Utilisation

Toutes les formules doivent commencer par un `=` comme dans un tableur classique :

```js
new Query("=SUM(1, 2, 3)").exec(); // 6

new Query("=IF(1 > 0, 'Oui', 'Non')").exec(); // "Oui"

new Query("=MAX(4, POW(2, 3))").exec(); // 8
```

Références de cellules ou plages (si la feuille est liée au contexte) :

```js
new Query("=A1").exec();          // Renvoie la valeur de A1
new Query("=SUM(A1:A5)").exec(); // Somme de A1 à A5
new Query("=VLOOKUP(4, A1:B10, 2)").exec(); // Recherche verticale
```

---

## 🧩 Architecture

### 1. `lexer()`

Transforme une chaîne comme `SUM(1,2)` en une liste de **tokens**. Gère :

- Opérateurs : `+`, `-`, `*`, `/`, `==`, `>=`, etc.
- Littéraux : nombres, chaînes, noms de fonctions
- Parenthèses, virgules, plages (`:`)

### 2. `parser()`

Transforme les tokens en un **AST** (arbre syntaxique) structuré :

- Opérations binaires
- Appels de fonctions
- Littéraux
- Références et plages

### 3. Classe `Query`

Prend une formule, la parse, puis exécute l’évaluation avec `.exec()`.  
Utilise :

- `execBinary()`, `execFunction()`, `resolveReference()`, `resolveRange()`
- Gestion des erreurs via `.onFail(err)`
- Mise à jour automatique via `subscribeChange()`

---

## 🧠 Fonctions du contexte

Voici les fonctions de base disponibles dans le contexte :

```js
_context = {
  sum(...args),
  max(...args),
  min(...args),
  pow(base, exposant),
  sqrt(valeur),
  join(séparateur, ...valeurs),
  vlookup(valeur, plage, index),
  if(condition, siVrai, siFaux)
}
```

Associer une feuille de données avec :

```js
_context.bindSheet(maFeuille);
```

---

## 🔧 Exemple de fonction personnalisée

On peut ajouter facilement une fonction :

```js
_context.moyenne = function() {
  const nums = this._numericArgs(...arguments);
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
```

Puis l’utiliser :

```js
new Query("=MOYENNE(2, 4, 6)").exec(); // 4
```

---

## ⚠️ Remarques

- Toutes les formules doivent **commencer par `=`**.
- Les dépendances entre cellules sont automatiquement suivies.
- Les erreurs sont accessibles via `.error`.

---

## 📁 Structure du projet

```
.
├── parser.js          # Analyseur lexical + syntaxique
├── query.js           # Exécution des AST
├── context.js         # Fonctions intégrées
└── README.md          # Ce fichier
```

---

## 🪪 Licence

Licence MIT.  
Libre d’utilisation, de modification et de contribution.
