import { db } from "@workspace/db";
import { blogArticlesTable } from "@workspace/db";

const articles = [
  {
    slug: "integrer-mobile-money-api-drimpay",
    title: "Intégrer Mobile Money en 10 minutes avec l'API DrimPay",
    excerpt: "Un guide pas-à-pas pour connecter votre application aux paiements Mobile Money en Afrique de l'Ouest et Centrale. De l'obtention de votre clé API à votre premier paiement en production.",
    content: `## Pourquoi intégrer le Mobile Money ?

Le Mobile Money représente aujourd'hui plus de 60% des transactions financières en Afrique subsaharienne. Pour toute entreprise qui cible ce marché, proposer TMoney, Orange Money, Wave ou MTN MoMo n'est plus une option — c'est une nécessité.

L'API DrimPay vous permet d'intégrer l'ensemble de ces opérateurs via **un seul endpoint**, sans avoir à négocier des accords individuels avec chaque opérateur.

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- Un compte DrimPay vérifié (KYB validé)
- Votre clé API sandbox disponible dans le dashboard
- Node.js 18+ ou Python 3.10+ installé
- Un endpoint HTTPS accessible (pour recevoir les webhooks)

## Étape 1 — Obtenir votre clé API

Connectez-vous à votre dashboard DrimPay, naviguez vers **Clés API** et créez une clé sandbox. Vous obtiendrez une clé au format \`sk_sandbox_xxxxxxxxxxxx\`.

> Ne commitez jamais votre clé API dans votre code source. Utilisez des variables d'environnement.

## Étape 2 — Initier un paiement

\`\`\`javascript
const response = await fetch('https://api.drimpay.io/v1/payin', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_sandbox_xxxxxxxxxxxx',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'XOF',
    operator: 'TMONEY',
    phone: '+22890000000',
    reference: 'ORDER-2025-001',
    webhook_url: 'https://votre-app.com/webhooks/drimpay',
  }),
});

const { transaction_id, status } = await response.json();
\`\`\`

## Étape 3 — Gérer les webhooks

DrimPay envoie une notification à votre \`webhook_url\` dès que le statut du paiement change. Vérifiez toujours la signature HMAC-SHA256 :

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return expected === signature;
}
\`\`\`

## Étape 4 — Passer en production

Une fois vos tests validés en sandbox :
1. Créez une clé **Live** dans le dashboard
2. Remplacez \`sk_sandbox_\` par \`sk_live_\` dans votre configuration
3. Assurez-vous que votre endpoint webhook est sécurisé (HTTPS obligatoire)

## Opérateurs supportés

| Pays | Opérateurs |
|------|-----------|
| Togo | TMoney, Flooz (Moov) |
| Sénégal | Wave, Orange Money, Free Money |
| Côte d'Ivoire | Orange Money, MTN MoMo, Wave |
| Cameroun | Orange Money, MTN MoMo |
| Bénin | MTN MoMo, Moov Money |

## Conclusion

En suivant ces 4 étapes, votre intégration Mobile Money est opérationnelle. L'API DrimPay gère la complexité des différents opérateurs pour que vous puissiez vous concentrer sur votre produit.`,
    category: "Guide technique",
    author: "Équipe DrimPay",
    authorTitle: "Engineering",
    publishedAt: new Date("2025-03-15"),
    readingTimeMinutes: 8,
    imageUrl: "/blog/integrer-mobile-money-api.png",
    tags: ["API", "Mobile Money", "Intégration", "Guide"],
  },
  {
    slug: "orange-money-vs-wave-comparaison",
    title: "Orange Money vs Wave : Quel opérateur choisir pour votre business ?",
    excerpt: "Orange Money règne sur 17 pays, Wave révolutionne les frais avec 1%. Analyse complète des deux géants du Mobile Money en Afrique francophone pour vous aider à faire le bon choix.",
    content: `## Le duel des titans du Mobile Money

En Afrique francophone, deux opérateurs dominent la conversation fintech : **Orange Money** avec sa présence dans 17 pays et ses 20 millions d'utilisateurs actifs, et **Wave** avec son modèle disruptif à 1% de frais fixes qui a bouleversé le secteur au Sénégal et en Côte d'Ivoire.

Mais lequel est le meilleur pour intégrer dans votre business ? La réponse dépend de votre marché cible, de votre volume de transactions et de votre tolérance aux frais.

## Orange Money : la couverture avant tout

### Points forts
- **17 pays** couverts en Afrique francophone
- Base d'utilisateurs la plus large : 20M+ actifs
- Infrastructure mature et fiable depuis 2008
- API bien documentée et stable
- USSD disponible (sans internet)

### Points faibles
- Frais variables selon les pays (1.5% à 3.5%)
- Délais de règlement parfois longs (24-48h)
- Onboarding marchand complexe par pays

### Pour qui ?
Orange Money est idéal si vous opérez dans **plusieurs pays simultanément** ou ciblez des zones rurales où la couverture data est limitée. Sa présence au Mali, Burkina Faso, Guinée et Madagascar le rend incontournable pour une stratégie panafricaine.

## Wave : la révolution des frais

### Points forts
- **1% de frais fixe** (révolutionnaire dans le secteur)
- UX exceptionnelle — la meilleure du marché
- Adoption massive chez les jeunes urbains (60% de parts de marché au Sénégal)
- Règlement rapide (en temps réel)
- API moderne et developer-friendly

### Points faibles
- Disponible seulement au **Sénégal, Côte d'Ivoire, Mali et Burkina Faso**
- Nécessite une connexion internet
- Moins de notoriété chez les populations rurales et seniors

### Pour qui ?
Wave est le choix parfait pour les **marketplaces urbaines**, les applications e-commerce et les services digitaux ciblant une clientèle connectée au Sénégal et en Côte d'Ivoire.

## Comparaison directe

| Critère | Orange Money | Wave |
|---------|-------------|------|
| Pays couverts | 17 | 4 |
| Frais marchands | 1.5-3.5% | 1% |
| Règlement | 24-48h | Temps réel |
| UX utilisateur | Bonne | Excellente |
| Rural/USSD | Oui | Non |
| API qualité | Bonne | Excellente |

## La stratégie gagnante avec DrimPay

Avec DrimPay, vous n'avez pas à choisir. Intégrez les deux opérateurs via **une seule API** et laissez vos clients payer avec l'application qu'ils préfèrent. Votre code ne change pas — DrimPay route automatiquement la transaction vers le bon opérateur.

\`\`\`javascript
// Même code pour Orange Money ET Wave
const payment = await drimpay.payin({
  amount: 10000,
  currency: 'XOF',
  operator: 'WAVE', // ou 'ORANGE_MONEY'
  phone: '+221700000000',
});
\`\`\`

## Verdict

- **Couverture maximale** → Orange Money
- **Frais minimaux + UX** → Wave
- **Les deux sans effort** → DrimPay`,
    category: "Analyse marché",
    author: "Équipe DrimPay",
    authorTitle: "Product & Market",
    publishedAt: new Date("2025-04-02"),
    readingTimeMinutes: 6,
    imageUrl: "/blog/orange-money-vs-wave.png",
    tags: ["Orange Money", "Wave", "Comparaison", "Stratégie"],
  },
  {
    slug: "essor-mobile-money-afrique-francophone-2025",
    title: "L'essor du Mobile Money en Afrique francophone en 2025",
    excerpt: "Le Mobile Money a traité plus de 900 milliards de dollars en 2024 à l'échelle mondiale. En Afrique francophone, la croissance dépasse 35% par an. Ce que les chiffres révèlent sur l'avenir des paiements.",
    content: `## Une décennie de transformation financière

En 2015, moins de 15% des adultes en Afrique subsaharienne avaient accès à un compte bancaire. En 2025, plus de 65% disposent d'un compte Mobile Money. Cette transformation n'a pas d'équivalent dans l'histoire financière mondiale.

Le Mobile Money n'est pas une solution de remplacement temporaire en attendant la bancarisation classique. C'est le **système financier natif** d'une génération entière.

## Les chiffres clés 2024-2025

### Volumes de transaction

L'Afrique subsaharienne a traité **900 milliards de dollars** en transactions Mobile Money en 2024, soit une hausse de 23% vs 2023. En Afrique francophone spécifiquement :

- **Sénégal** : +42% de volume, porté par Wave
- **Côte d'Ivoire** : +38%, leadership Orange Money + MTN
- **Togo** : +31%, TMoney en forte croissance
- **Cameroun** : +29%, duopole Orange/MTN stable

### Pénétration par pays

| Pays | Comptes actifs | % population adulte |
|------|---------------|---------------------|
| Sénégal | 18.2M | 78% |
| Côte d'Ivoire | 24.1M | 71% |
| Cameroun | 12.8M | 38% |
| Togo | 4.1M | 42% |
| Bénin | 3.9M | 28% |
| Mali | 8.7M | 35% |

## Les tendances qui façonnent 2025

### 1. Le paiement marchand explose

Historiquement, le Mobile Money servait principalement aux transferts P2P (personne à personne). En 2025, les paiements marchands représentent désormais **35% des transactions**, contre 18% en 2021. Le commerce électronique et les plateformes de services alimentent cette croissance.

### 2. La normalisation des frais à 1%

Wave a provoqué une guerre des prix dans le secteur. Orange Money et MTN ont réduit leurs frais marchands dans plusieurs marchés. Pour les entreprises, c'est une réduction de coût directe qui améliore les marges.

### 3. L'interopérabilité comme standard

Les régulateurs BCEAO et BEAC poussent vers l'interopérabilité obligatoire : un client Orange Money doit pouvoir payer un marchand MTN sans friction. Ce chantier transforme profondément l'infrastructure.

### 4. La montée des API-first

Les entreprises ne veulent plus gérer des intégrations opérateur par opérateur. Le marché des agrégateurs de paiement comme DrimPay connaît une croissance de **180%** par an.

## Pourquoi l'Afrique francophone est le prochain eldorado

Contrairement à l'Afrique anglophone (Kenya, Nigeria), l'Afrique francophone a une fragilité : la **fragmentation**. 15 pays, 2 zones monétaires (BCEAO/BEAC), des régulations différentes. Cette complexité est précisément ce qui crée une opportunité pour les plateformes qui la résolvent.

Les entreprises qui s'intègrent aujourd'hui via une API unifiée auront un avantage concurrentiel durable quand le marché atteindra sa maturité d'ici 2027-2028.

## Conclusion

Le Mobile Money en Afrique francophone n'est plus une tendance émergente — c'est l'infrastructure financière dominante. Les chiffres de 2025 confirment une accélération, pas un ralentissement. Pour les entrepreneurs et développeurs, la question n'est plus "pourquoi intégrer le Mobile Money ?" mais "pourquoi attendre ?"`,
    category: "Actualités",
    author: "Équipe DrimPay",
    authorTitle: "Research & Insights",
    publishedAt: new Date("2025-04-18"),
    readingTimeMinutes: 7,
    imageUrl: "/blog/essor-mobile-money-afrique.png",
    tags: ["Mobile Money", "Afrique", "Statistiques", "Tendances 2025"],
  },
  {
    slug: "kyb-verification-entreprise-drimpay",
    title: "KYB : Tout ce qu'il faut savoir pour vérifier votre entreprise sur DrimPay",
    excerpt: "La vérification KYB (Know Your Business) est obligatoire pour activer les paiements en production. Ce guide détaille chaque étape, les documents requis et les erreurs courantes à éviter.",
    content: `## Qu'est-ce que le KYB et pourquoi est-il obligatoire ?

Le **Know Your Business** (KYB) est l'équivalent professionnel du KYC (Know Your Customer). C'est le processus par lequel DrimPay vérifie que votre entreprise est légitime, légalement constituée et conforme aux réglementations AML/CFT (Anti-Blanchiment / Financement du Terrorisme).

Cette vérification est imposée par la BCEAO et la BEAC pour toute plateforme de paiement opérant dans leurs zones. Sans KYB validé, vous restez en mode sandbox — les paiements réels sont bloqués.

## Quand faire votre KYB ?

Idéalement, commencez le KYB **dès l'inscription**, même si vous n'êtes pas encore prêt pour la production. Le processus peut prendre 2 à 5 jours ouvrés selon la complétude de votre dossier.

## Les 3 étapes du KYB DrimPay

### Étape 1 — Informations entreprise

Vous devrez fournir :
- **Raison sociale** (nom légal complet)
- **Nom commercial** si différent
- **Type d'entreprise** : SARL, SAS, SA, GIE, Entreprise individuelle...
- **Numéro RCCM** (Registre du Commerce) ou équivalent local
- **Numéro fiscal** (NIF, TIN selon le pays)
- **Pays et ville d'enregistrement**
- **Date de création**
- **Description de votre activité**

### Étape 2 — Activité et conformité

- **Description détaillée** de vos services/produits
- **Source principale des fonds** (ventes de produits, services, commissions...)
- **Volume mensuel estimé** de transactions
- **Site web** (si disponible)

### Étape 3 — Représentant légal et documents

Informations du dirigeant :
- Nom complet, email, téléphone
- Type de pièce d'identité : CNI, Passeport, Permis de conduire
- Numéro du document

## Documents à préparer

| Document | Format | Obligatoire |
|----------|--------|-------------|
| Registre RCCM / Statuts | PDF, max 10MB | Oui |
| Pièce d'identité dirigeant | PDF/JPG, max 5MB | Oui |
| Justificatif d'adresse | PDF, max 5MB | Oui |
| Relevé bancaire | PDF, max 10MB | Recommandé |

> **Conseil** : Scannez vos documents à une résolution d'au moins 150 DPI. Les photos floues ou illisibles sont la première cause de rejet.

## Erreurs courantes à éviter

### 1. Incohérence entre les données et les documents
Si votre RCCM mentionne "ACME SARL" mais que vous avez renseigné "Acme" dans le formulaire, le dossier sera suspendu pour vérification. Soyez exact.

### 2. Documents expirés
Les justificatifs d'adresse doivent dater de **moins de 3 mois**. Une facture d'électricité de l'année dernière sera refusée.

### 3. Mauvais type d'entreprise
Une micro-entreprise enregistrée comme "Entreprise individuelle" ne doit pas être déclarée comme "SARL". Le type légal doit correspondre exactement à votre acte de constitution.

### 4. Numéro fiscal manquant
Certains pays ont des formats spécifiques (ex: Togo — NIF sur 12 chiffres). Vérifiez le format attendu.

## Délais de traitement

- **Dossier complet** : 2-3 jours ouvrés
- **Dossier incomplet** : Vous recevez une notification par email avec les corrections requises
- **Appel en cas de refus** : Contactez support@drimpay.io avec votre numéro de dossier

## Après la validation KYB

Une fois votre KYB approuvé :
1. Votre compte passe en mode **Production**
2. Créez une clé API **Live** dans le dashboard
3. Votre limite de transaction initiale est de 500 000 FCFA/jour (augmentable sur demande)
4. Vous recevez un email de confirmation avec votre contrat marchand signé électroniquement

## Conclusion

Le KYB est une étape incontournable mais simple si vous préparez votre dossier en avance. Rassemblez tous vos documents avant de commencer le formulaire pour éviter les allers-retours. En cas de doute, notre équipe support répond en moins de 15 minutes sur WhatsApp.`,
    category: "Compliance",
    author: "Équipe DrimPay",
    authorTitle: "Compliance & Legal",
    publishedAt: new Date("2025-05-05"),
    readingTimeMinutes: 7,
    imageUrl: "/blog/kyb-verification-entreprise.png",
    tags: ["KYB", "Vérification", "Compliance", "Onboarding"],
  },
  {
    slug: "paiements-transfrontaliers-bceao-beac",
    title: "Paiements transfrontaliers en Afrique : BCEAO et BEAC, les règles à connaître",
    excerpt: "8 pays BCEAO, 6 pays BEAC, deux zones CFA, des réglementations distinctes. Comprendre ce cadre est essentiel pour tout business qui collecte ou envoie des paiements à travers l'Afrique francophone.",
    content: `## Deux zones, une monnaie, des règles différentes

Le Franc CFA existe en deux versions : le **XOF** (zone BCEAO, Afrique de l'Ouest) et le **XAF** (zone BEAC, Afrique Centrale). Si les deux sont arrimés à l'euro au même taux (655.957 FCFA = 1 EUR), leurs cadres réglementaires sont gérés par deux institutions distinctes avec des règles propres.

Pour une plateforme de paiement, cette distinction est fondamentale.

## Zone BCEAO — Afrique de l'Ouest

### Pays membres
Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo

### Monnaie
Franc CFA Ouest (XOF)

### Cadre réglementaire clé

La BCEAO a publié en 2020 le **Règlement R-2020-10** sur les systèmes de paiement, qui encadre :
- L'agrément des établissements de monnaie électronique (EME)
- Les limites de solde et de transaction Mobile Money
- L'interopérabilité obligatoire entre opérateurs
- Les obligations de reporting AML/CFT

#### Limites importantes (XOF)
| Type | Limite par transaction | Limite mensuelle |
|------|----------------------|-----------------|
| Mobile Money standard | 2 000 000 | 5 000 000 |
| Compte marchand vérifié | 10 000 000 | Sans limite* |

*Sous réserve de reporting AML pour les transactions > 5 000 000 XOF

### Ce que cela signifie pour votre business

Si votre client paie depuis le Sénégal vers un marchand au Togo, la transaction reste en XOF. La BCEAO facilite les paiements intrazone via le **STAR-UEMOA** (Système de Transfert Automatisé et de Règlement).

## Zone BEAC — Afrique Centrale

### Pays membres
Cameroun, République Centrafricaine, Congo, Gabon, Guinée Équatoriale, Tchad

### Monnaie
Franc CFA Central (XAF)

### Cadre réglementaire clé

La BEAC opère via le **SYSTAC** (Système de Télécompensation en Afrique Centrale) pour les paiements interbancaires. La réglementation Mobile Money est moins mature qu'en zone BCEAO :

- Cadre EME moins développé
- Interopérabilité en cours d'implémentation
- Reporting AML obligatoire dès 1 000 000 XAF

## Paiements inter-zones (XOF ↔ XAF)

C'est là que ça se complique. **Il n'existe pas de mécanisme unifié** pour les paiements entre la zone BCEAO et la zone BEAC via Mobile Money. Chaque transaction inter-zones implique :

1. Une conversion de devises (XOF → EUR → XAF ou via cambistes agréés)
2. Des délais de règlement plus longs (24-72h)
3. Des frais de change supplémentaires
4. Des déclarations réglementaires obligatoires

### La solution DrimPay

DrimPay gère chaque corridor séparément. Un marchand ivoirien (XOF) qui veut collecter depuis le Cameroun (XAF) dispose de **deux wallets distincts** dans son dashboard :

- Un wallet XOF pour ses collections en zone BCEAO
- Un wallet XAF pour ses collections en zone BEAC

Les fonds ne se mélangent pas, et les reversements se font dans la devise locale de chaque wallet.

## Obligations de conformité pour les marchands

Quelle que soit la zone, vos obligations incluent :

### AML/CFT
- Vérification d'identité des clients au-delà de certains seuils
- Conservation des données de transaction pendant **5 ans minimum**
- Déclaration des transactions suspectes à la CENTIF locale

### Reporting
- Déclaration mensuelle de votre volume de transactions à DrimPay
- Mise à jour de votre profil KYB en cas de changement de gérance ou d'activité

### Conservation des fonds
- DrimPay sépare strictement les fonds marchands des fonds propres
- Chaque wallet marchand est adossé à un compte de cantonnement réglementaire

## Conclusion

Opérer dans les deux zones CFA est parfaitement possible mais requiert une compréhension claire des spécificités de chaque marché. DrimPay abstrait cette complexité technique et réglementaire pour vous — mais il est essentiel que vous compreniez le cadre dans lequel vous évoluez pour prendre les bonnes décisions business.`,
    category: "Réglementation",
    author: "Équipe DrimPay",
    authorTitle: "Compliance & Legal",
    publishedAt: new Date("2025-05-20"),
    readingTimeMinutes: 9,
    imageUrl: "/blog/paiements-bceao-beac.png",
    tags: ["BCEAO", "BEAC", "Réglementation", "Paiements transfrontaliers", "CFA"],
  },
  {
    slug: "securiser-integrations-paiement-guide",
    title: "Sécuriser vos intégrations de paiement : Guide des bonnes pratiques",
    excerpt: "Une clé API exposée dans un dépôt public, un webhook non vérifié, une absence de rate limiting — voici les erreurs qui coûtent cher. Ce guide vous aide à sécuriser votre intégration DrimPay de A à Z.",
    content: `## La sécurité des paiements n'est pas optionnelle

En 2024, les fraudes liées aux intégrations de paiement mal sécurisées ont coûté **2.8 milliards de dollars** aux entreprises africaines. La grande majorité de ces incidents auraient pu être évités avec des pratiques de base.

Ce guide couvre les protections essentielles pour une intégration DrimPay sécurisée.

## 1. Gestion des clés API

### Ne jamais exposer vos clés
La règle d'or : votre clé secrète (\`sk_live_...\`) ne doit jamais apparaître :
- Dans votre code source (même en commentaire)
- Dans un dépôt Git — même privé
- Dans des logs applicatifs
- Dans des messages ou emails

\`\`\`bash
# Mauvais — ne faites jamais ça
API_KEY=sk_live_xxxxxxxxxxxx

# Correct — utilisez des variables d'environnement
export DRIMPAY_SECRET_KEY="sk_live_xxxxxxxxxxxx"
\`\`\`

### Utiliser des variables d'environnement

\`\`\`javascript
// Node.js — charger depuis .env
import dotenv from 'dotenv';
dotenv.config();

const drimpay = new DrimPayClient({
  secretKey: process.env.DRIMPAY_SECRET_KEY,
});
\`\`\`

### Rotation régulière des clés

Faites pivoter vos clés API **tous les 90 jours** ou immédiatement si vous suspectez une compromission. DrimPay permet la rotation sans interruption de service via le dashboard.

### Restriction par IP (recommandé)

Si vos appels API proviennent toujours du même serveur, restreignez votre clé à cette IP dans le dashboard. Même si la clé est volée, elle sera inutilisable depuis une autre origine.

## 2. Vérification des webhooks

C'est la faille la plus courante. Sans vérification, n'importe qui peut envoyer une fausse notification "paiement réussi" à votre endpoint.

### Implémentation correcte

\`\`\`javascript
import crypto from 'crypto';

app.post('/webhooks/drimpay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-drimpay-signature'];
  const webhookSecret = process.env.DRIMPAY_WEBHOOK_SECRET;

  // Calculer la signature attendue
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)  // Corps RAW, pas parsé
    .digest('hex');

  // Comparer de façon sécurisée (timing-safe)
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body);
  // Traiter l'événement...
  res.json({ received: true });
});
\`\`\`

> Utilisez \`timingSafeEqual\` (pas \`===\`) pour éviter les attaques par timing.

## 3. Idempotence des paiements

Ne traitez jamais deux fois le même webhook. DrimPay envoie parfois des doublons en cas de timeout réseau.

\`\`\`javascript
// Stockez les transaction_id déjà traités
const processedTransactions = new Set(); // En prod : Redis ou DB

app.post('/webhooks/drimpay', async (req, res) => {
  const { transaction_id, status } = req.body;

  if (processedTransactions.has(transaction_id)) {
    return res.json({ received: true }); // Idempotent
  }

  if (status === 'success') {
    await fulfillOrder(transaction_id);
    processedTransactions.add(transaction_id);
  }

  res.json({ received: true });
});
\`\`\`

## 4. Rate limiting et protection contre les abus

### Côté API DrimPay
Nos serveurs appliquent des limites par défaut :
- 100 requêtes/minute en sandbox
- 500 requêtes/minute en production (augmentable sur demande)

### Côté votre application
Protégez votre endpoint webhook contre les attaques par flood :

\`\`\`javascript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Max 200 requêtes/min depuis la même IP
  message: 'Too many requests',
});

app.use('/webhooks', webhookLimiter);
\`\`\`

## 5. HTTPS obligatoire en production

Votre endpoint webhook **doit** être en HTTPS avec un certificat valide. DrimPay refuse les URLs en HTTP et les certificats auto-signés en mode live.

## 6. Séparation sandbox / production

Ne mélangez jamais les environnements :

| Environnement | Clé | Webhook URL |
|--------------|-----|-------------|
| Développement | \`sk_sandbox_...\` | \`https://staging.votre-app.com/...\` |
| Production | \`sk_live_...\` | \`https://votre-app.com/...\` |

## Checklist de sécurité avant la mise en production

- [ ] Clé secrète dans les variables d'environnement (jamais dans le code)
- [ ] Signature webhook vérifiée sur chaque requête entrante
- [ ] Idempotence implémentée pour les événements webhook
- [ ] Endpoint webhook en HTTPS avec certificat valide
- [ ] Rate limiting activé sur votre endpoint
- [ ] Logs d'erreurs configurés (mais sans logger les clés API)
- [ ] Restriction IP activée si applicable
- [ ] Test complet en sandbox avant le passage en live

## Signaler un problème de sécurité

Si vous découvrez une vulnérabilité dans l'infrastructure DrimPay, contactez-nous immédiatement à **security@drimpay.io**. Nous appliquons un programme de responsible disclosure et répondons sous 24h.`,
    category: "Sécurité",
    author: "Équipe DrimPay",
    authorTitle: "Security Engineering",
    publishedAt: new Date("2025-06-01"),
    readingTimeMinutes: 10,
    imageUrl: "/blog/securiser-integrations-paiement.png",
    tags: ["Sécurité", "API", "Webhooks", "Bonnes pratiques"],
  },
];

async function seed() {
  console.log("Seeding blog articles...");

  for (const article of articles) {
    try {
      await db
        .insert(blogArticlesTable)
        .values(article)
        .onConflictDoNothing();
      console.log(`✓ Inserted: ${article.slug}`);
    } catch (err) {
      console.error(`✗ Failed: ${article.slug}`, err);
    }
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
